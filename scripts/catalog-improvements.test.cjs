// Tests isolated from Supabase, Stripe and Resend: no real orders or emails.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks = {}, env = {}) {
  mocks = {
    '@/lib/flavor-inventory': { refreshExpiredFlavorReservations: async () => false },
    ...mocks,
  }
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(source, {
    exports, URL, Response, require: name => {
      if (name === '@/lib/flavor-sales' && !(name in mocks)) return load('lib/flavor-sales.ts')
      if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`)
      return mocks[name]
    }, process: { env }, console: { error() {} },
  }, { filename: file })
  return exports
}

const pricing = load('lib/order-items.ts')
const validation = load('lib/catalog-validation.ts', { zod: require('zod') })
const templates = load('lib/email-templates.ts', { '@/lib/order-items': pricing })
const reviewLinks = require('../lib/store-review-links.json')
const reviews = load('lib/store-reviews.ts', {
  './store-review-links.json': { default: reviewLinks }, './catalog-validation': validation,
})
const base = { id: 'base-pistacho', name: 'Galleta de pistacho', surcharge: 3.5, storeIds: ['joan'] }
const flavor = {
  id: 'pistacho', name: 'Pistacho', active: true,
  prices: { individual: 7, mediana: 25, grande: 40 },
  customBasesEnabled: true, customBases: [base],
  availability: [
    { storeId: 'joan', portions: ['individual', 'mediana', 'grande'] },
    { storeId: 'lux', portions: ['mediana'], prices: { mediana: 30 } },
  ],
}
const choice = { flavorId: flavor.id, portion: 'mediana', quantity: 2, customBase: { id: base.id, name: 'Manipulada', surcharge: -20 }, price: 1 }

test('El suplemento y el nombre se reconstruyen desde el catálogo, conservando una copia en el pedido', () => {
  const [item] = pricing.priceOrderItems([choice], [flavor], 'joan')
  assert.equal(item.price, 28.5)
  assert.equal(item.customBase.name, base.name)
  assert.equal(item.customBase.surcharge, 3.5)
  assert.equal(item.quantity * item.price, 57)
  assert.notEqual(item.customBase, base)
})

test('La base original y dos bases diferentes tienen identidades independientes en el carrito', () => {
  const standard = { flavorId: flavor.id, portion: 'mediana' }
  const custom = { ...standard, customBase: { id: base.id } }
  assert.notEqual(pricing.getItemKey(standard), pricing.getItemKey(custom))
  assert.notEqual(pricing.getItemKey(custom), pricing.getItemKey({ ...custom, customBase: { id: 'otra' } }))
})

test('Las bases anteriores solo se ofrecen en mediana/grande y se rechazan otras tiendas u opciones desactivadas', () => {
  for (const [item, catalogue, store] of [
    [{ ...choice, portion: 'individual' }, [flavor], 'joan'],
    [choice, [flavor], 'lux'],
    [{ ...choice, customBase: { id: 'inexistente' } }, [flavor], 'joan'],
    [choice, [{ ...flavor, customBasesEnabled: false }], 'joan'],
    [choice, [{ ...flavor, active: false }], 'joan'],
  ]) assert.throws(() => pricing.priceOrderItems([item], catalogue, store))
})

const sizedBase = {
  ...base, surcharge: 99,
  portionSettings: {
    individual: { enabled: true, surcharge: 0 },
    doble: { enabled: false, surcharge: 1 },
    mediana: { enabled: true, surcharge: 2 },
    grande: { enabled: true, surcharge: 5.75 },
  },
}
const sizedFlavor = {
  ...flavor, customBases: [sizedBase],
  prices: { individual: 7, doble: 12, mediana: 25, grande: 40 },
  availability: [{ storeId: 'joan', portions: ['individual', 'doble', 'mediana', 'grande'] }],
}

test('Una misma base tiene suplementos por tamaño, incluido cero, sin usar el importe antiguo ni el del cliente', () => {
  const items = pricing.priceOrderItems(['individual', 'mediana', 'grande'].map(portion => ({
    ...choice, portion, quantity: portion === 'mediana' ? 2 : 1,
  })), [sizedFlavor], 'joan')
  assert.equal(items.map(item => item.price).join(','), '7,27,45.75')
  assert.equal(items.map(item => item.customBase.surcharge).join(','), '0,2,5.75')
  assert.equal(items.reduce((sum, item) => sum + item.quantity * item.price, 0), 106.75)
  assert.equal(new Set(items.map(pricing.getItemKey)).size, 3)
  assert.ok(pricing.getBaseDescription(items[2]).includes('+5.75 €/ud.'))
})

test('Desactivar un tamaño conserva su importe y bloquea el pedido sin volver al suplemento antiguo', () => {
  assert.throws(() => pricing.priceOrderItems([{ ...choice, portion: 'doble' }], [sizedFlavor], 'joan'), /base seleccionada/)
  assert.equal(sizedBase.portionSettings.doble.surcharge, 1)
  const disabled = { ...sizedFlavor, customBases: [{ ...sizedBase, portionSettings: {} }] }
  assert.equal(pricing.getCustomBases(disabled, 'joan', 'mediana').length, 0)
  assert.throws(() => pricing.priceOrderItems([choice], [disabled], 'joan'), /base seleccionada/)
  assert.equal(pricing.getCustomBases(sizedFlavor, 'lux', 'mediana').length, 0)
  assert.equal(pricing.getCustomBases({ ...sizedFlavor, availability: [{ storeId: 'joan', portions: ['grande'] }] }, 'joan', 'mediana').length, 0)
})

test('Las bases antiguas mantienen su suplemento para mediana y grande hasta configurarlas por tamaño', () => {
  assert.equal(pricing.getCustomBases(flavor, 'joan', 'mediana')[0].surcharge, 3.5)
  assert.equal(pricing.getCustomBasePortionSettings(base).grande.surcharge, 3.5)
  assert.equal(pricing.getCustomBasePortionSettings(base).individual, undefined)
  assert.equal(base.portionSettings, undefined)
})

test('El esquema conserva los tamaños y valida sus interruptores, importes y nombres de formato', () => {
  const { surcharge, ...newBase } = sizedBase
  const result = validation.customBasesSchema.safeParse([newBase])
  assert.equal(result.success, true)
  assert.equal(result.data[0].surcharge, 0)
  assert.equal(result.data[0].portionSettings.grande.surcharge, 5.75)
  assert.equal(result.data[0].portionSettings.doble.enabled, false)
  assert.equal(validation.customBasesSchema.safeParse([{ ...base, portionSettings: {} }]).success, true)
  for (const portionSettings of [
    { mediana: { enabled: true, surcharge: -1 } },
    { mediana: { enabled: true, surcharge: 1.001 } },
    { mediana: { enabled: true, surcharge: 1001 } },
    { mediana: { enabled: 'sí', surcharge: 2 } },
    { grande: { enabled: true } },
    { desconocido: { enabled: true, surcharge: 2 } },
  ]) assert.equal(validation.customBasesSchema.safeParse([{ ...base, portionSettings }]).success, false)
})

test('Crear y editar sabores conserva la configuración por tamaño y rechaza importes inválidos antes de escribir', async () => {
  let written
  let writes = 0
  const api = load('app/api/flavors/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    '@/lib/db': {
      getSessionById: async () => ({}),
      createFlavor: async data => { written = data; writes++; return { id: 'nuevo', ...data } },
      updateFlavor: async (id, data) => { written = data; writes++; return { id, ...data } },
    },
    '@/lib/catalog-validation': validation,
    '@/lib/flavor-catalog': load('lib/flavor-catalog.ts'),
  })
  const data = { name: 'Prueba', description: 'Tarta', prices: sizedFlavor.prices, availability: sizedFlavor.availability, customBasesEnabled: true, customBases: [sizedBase] }
  assert.equal((await api.POST({ json: async () => data })).status, 200)
  assert.equal(written.customBases[0].portionSettings.grande.surcharge, 5.75)
  assert.equal((await api.PUT({ json: async () => ({ id: 'nuevo', ...data }) })).status, 200)
  assert.equal(written.customBases[0].portionSettings.doble.enabled, false)
  assert.equal((await api.PUT({ json: async () => ({ id: 'nuevo', customBases: [{ ...base, portionSettings: { mediana: { enabled: true, surcharge: -2 } } }] }) })).status, 400)
  assert.equal(writes, 2)
})

test('Se conserva el precio específico por tienda y no se aceptan cantidades inválidas', () => {
  assert.equal(pricing.priceOrderItems([{ ...choice, customBase: undefined }], [flavor], 'lux')[0].price, 30)
  for (const quantity of [0, -1, 1.5, '2', 101, NaN]) {
    assert.throws(() => pricing.priceOrderItems([{ ...choice, quantity }], [flavor], 'joan'))
  }
})

test('El dashboard valida nombres, tiendas, importes y duplicados de bases', () => {
  assert.equal(validation.customBasesSchema.safeParse([base]).success, true)
  for (const invalid of [{ ...base, name: ' ' }, { ...base, storeIds: [] }, { ...base, surcharge: -1 }, { ...base, surcharge: 1.001 }]) {
    assert.equal(validation.customBasesSchema.safeParse([invalid]).success, false)
  }
  assert.equal(validation.customBasesSchema.safeParse([base, base]).success, false)
})

test('Los enlaces de reseñas solo aceptan HTTPS y dominios de Google, sin credenciales', () => {
  assert.equal(validation.isGoogleReviewUrl('https://g.page/r/example/review'), true)
  for (const invalid of ['javascript:alert(1)', 'https://google.com.evil.test/', 'https://attacker@google.com/', 'http://g.page/review']) {
    assert.equal(validation.isGoogleReviewUrl(invalid), false)
  }
})

test('El correo usa las reseñas de la tienda correcta y escapa los nombres de bases', async () => {
  const sent = []
  const urls = { joan: 'https://g.page/r/joan/review', lux: 'https://g.page/r/lux/review' }
  const email = load('lib/email.ts', {
    resend: { Resend: class { emails = { send: async message => { sent.push(message); return { data: { id: 'test' } } } } } },
    '@/lib/db': { getStoreById: async id => ({ googleReviewUrl: urls[id] }) },
    '@/lib/store-reviews': reviews,
    '@/lib/email-templates': templates,
  }, { RESEND_API_KEY: 'test' })
  const options = {
    to: 'test@example.com', customerName: 'Test', orderId: 'HC-test', total: 28.5,
    storeName: 'Happycheese', pickupDate: '2026-12-10', pickupTime: '12:00',
    items: [{ flavorName: 'Pistacho', portion: 'mediana', quantity: 1, price: 28.5, customBase: { ...base, name: '<b>Galleta</b>' } }],
  }
  await email.sendCustomerConfirmationEmail({ ...options, storeId: 'joan' })
  await email.sendCustomerConfirmationEmail({ ...options, storeId: 'lux' })
  assert.ok(sent[0].html.includes(urls.joan))
  assert.ok(!sent[0].html.includes(urls.lux))
  assert.ok(sent[1].html.includes(urls.lux))
  assert.ok(!sent[1].html.includes(urls.joan))
  assert.ok(sent[0].html.includes('&lt;b&gt;Galleta&lt;/b&gt;'))
  await email.sendCustomerConfirmationEmail({ ...options, storeId: 'unknown' })
  assert.ok(!sent[2].html.includes('Dejar mi reseña ahora'))
  await email.sendStoreNotificationEmail({ ...options, storeId: 'lux', customerEmail: options.to, customerPhone: '123456789' })
  assert.ok(sent[3].html.includes('Base: &lt;b&gt;Galleta&lt;/b&gt;'))
  await email.sendCustomerConfirmationEmail({ ...options, storeId: 'happycheese' })
  await email.sendCustomerConfirmationEmail({ ...options, storeId: 'happycheese-lux' })
  const htmlUrl = value => value.replaceAll('&', '&amp;')
  assert.ok(Object.values(reviewLinks).every(value => validation.isGoogleReviewUrl(value) && new URL(value).pathname === '/local/writereview'))
  assert.equal(new URL(reviewLinks.happycheese).searchParams.get('placeid'), 'ChIJH5_uqYGTlxIRu7XKliViQAE')
  assert.equal(new URL(reviewLinks['happycheese-lux']).searchParams.get('placeid'), 'ChIJ_zXXWwCTlxIR8OK6K5UQOuI')
  assert.ok(!sent[4].html.includes('Cuando hayas recogido'))
  assert.ok(sent[4].html.includes(htmlUrl(reviewLinks.happycheese)))
  assert.ok(!sent[4].html.includes(htmlUrl(reviewLinks['happycheese-lux'])))
  assert.ok(sent[5].html.includes(htmlUrl(reviewLinks['happycheese-lux'])))
  assert.equal(reviews.getStoreReviewUrl('happycheese_lux'), reviewLinks['happycheese-lux'])
  assert.equal(reviews.getStoreReviewUrl('happycheese', urls.joan), urls.joan)
})

test('Guardar el orden exige autenticación y rechaza identificadores duplicados', async () => {
  let loggedIn = false
  let writes = 0
  const api = load('app/api/flavors/reorder/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    'next/headers': { cookies: async () => ({ get: () => loggedIn ? { value: 'session' } : undefined }) },
    '@/lib/db': { getSessionById: async () => ({}), getStoreById: async () => ({ active: true }), getFlavors: async () => [] },
    '@/lib/supabase-admin': { db: { rpc: async () => { writes++; return {} } } },
  })
  const request = ids => ({ json: async () => ({ storeId: 'joan', ids }) })
  assert.equal((await api.PUT(request(['a']))).status, 401)
  assert.equal(writes, 0)
  loggedIn = true
  assert.equal((await api.PUT(request(['a', 'a']))).status, 400)
  assert.equal(writes, 0)
  assert.equal((await api.PUT(request(['b', 'a']))).status, 200)
  assert.equal(writes, 1)
})

test('Un mismo sabor puede ser primero en una tienda y quinto en otra, sin mezclar prioridades', () => {
  const { sortFlavors } = load('lib/flavor-catalog.ts')
  const flavors = Array.from({ length: 5 }, (_, index) => ({
    id: index === 0 ? 'clasica' : `sabor-${index}`,
    sortOrder: index,
    storeSortOrders: { joan: index, lux: index === 0 ? 4 : index - 1 },
  }))
  assert.equal(sortFlavors(flavors, 'joan')[0].id, 'clasica')
  assert.equal(sortFlavors(flavors, 'lux')[4].id, 'clasica')
  assert.equal(flavors[0].id, 'clasica')
  const newFlavor = { id: 'nuevo', sortOrder: 0 }
  assert.equal(sortFlavors([newFlavor, ...flavors], 'lux').at(-1).id, 'nuevo')
  assert.equal(sortFlavors(flavors.map(({ storeSortOrders, ...flavor }) => flavor), 'joan')[0].id, 'clasica')
})

test('Guardar un orden requiere tienda y usa la función que solo modifica esa tienda', async () => {
  let argumentsReceived
  let active = true
  const api = load('app/api/flavors/reorder/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    '@/lib/db': { getSessionById: async () => ({}), getStoreById: async () => ({ active }), getFlavors: async () => [] },
    '@/lib/supabase-admin': { db: { rpc: async (name, parameters) => { argumentsReceived = { name, ...parameters }; return {} } } },
  })
  const request = data => ({ json: async () => data })
  assert.equal((await api.PUT(request({ ids: ['clasica', 'pistacho'] }))).status, 400)
  assert.equal(argumentsReceived, undefined)
  assert.equal((await api.PUT(request({ storeId: 'lux', ids: ['pistacho', 'clasica'] }))).status, 200)
  assert.equal(argumentsReceived.name, 'reorder_flavors_for_store')
  assert.equal(argumentsReceived.store_id, 'lux')
  assert.equal(argumentsReceived.flavor_ids.join(','), 'pistacho,clasica')
  active = false
  assert.equal((await api.PUT(request({ storeId: 'joan', ids: ['clasica', 'pistacho'] }))).status, 404)
})

test('El catálogo respeta la prioridad guardada y deja al final los sabores sin orden', async () => {
  const query = {
    select() { return query }, order() { return query }, error: null,
    data: [{ id: 'nuevo' }, { id: 'segundo', sortOrder: 1 }, { id: 'primero', sortOrder: 0 }],
  }
  const catalog = load('lib/db.ts', { './supabase-admin': { db: { from: () => query } }, './flavor-catalog': load('lib/flavor-catalog.ts') })
  assert.equal((await catalog.getFlavors()).map(flavor => flavor.id).join(','), 'primero,segundo,nuevo')
})

test('La API pública conserva la prioridad al filtrar por tienda y desactiva la caché', async () => {
  const sorting = load('lib/flavor-catalog.ts')
  const flavors = sorting.sortFlavors([
    { id: 'ultimo', sortOrder: 2, active: true, availability: [{ storeId: 'joan', portions: ['mediana'] }] },
    { id: 'otra-tienda', sortOrder: 0, active: true, availability: [{ storeId: 'lux', portions: ['mediana'] }] },
    { id: 'primero', sortOrder: 1, active: true, availability: [{ storeId: 'joan', portions: ['mediana'] }] },
    { id: 'oculto', sortOrder: 0, active: false, availability: [{ storeId: 'joan', portions: ['mediana'] }] },
  ])
  const api = load('app/api/flavors/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, headers: options?.headers }) } },
    'next/headers': { cookies: async () => ({ get: () => undefined }) },
    '@/lib/db': { getFlavors: async () => flavors },
    '@/lib/catalog-validation': validation,
    '@/lib/flavor-catalog': sorting,
  })
  const response = await api.GET({ url: 'http://localhost/api/flavors?storeId=joan' })
  assert.equal(response.body.map(flavor => flavor.id).join(','), 'primero,ultimo')
  assert.ok(response.headers['Cache-Control'].includes('no-store'))
})

test('Las tiendas públicas devuelven el horario actualizado sin caché y excluyen las inactivas', async () => {
  let hours = 'L-D: 10:00 - 20:00'
  const api = load('app/api/stores/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, headers: options?.headers }) } },
    'next/headers': { cookies: async () => ({ get: () => undefined }) },
    '@/lib/db': { getStores: async () => [{ id: 'joan', active: true, hours }, { id: 'lux', active: false, hours: 'Oculto' }] },
    '@/lib/catalog-validation': validation,
  })
  assert.equal((await api.GET()).body.length, 1)
  hours = 'L-V: 09:00 - 18:30'
  const response = await api.GET()
  assert.equal(response.body[0].hours, hours)
  assert.ok(response.headers['Cache-Control'].includes('no-store'))
})

test('El checkout rechaza importes manipulados antes de guardar o llamar a Stripe', async () => {
  let writes = 0
  let stripeCalls = 0
  const api = load('app/api/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/stripe': { formatAmountForStripe: value => Math.round(value * 100), stripe: { checkout: { sessions: { create: async () => { stripeCalls++; return {} } } } } },
    '@/lib/db': { getStoreById: async () => ({ id: 'joan', name: 'Joan', active: true }), getFlavors: async () => [flavor], createOrder: async () => { writes++ } },
    '@/lib/supabase-admin': {}, '@/lib/order-items': pricing,
    '@/lib/date-utils': { isValidPickupDate: () => true },
  })
  const data = { items: [choice], total: 2, storeId: 'joan', storeName: 'Joan', customerName: 'Test', customerEmail: 'test@example.com', customerPhone: '123456789', pickupDate: '2026-12-10', pickupTime: '12:00' }
  assert.equal((await api.POST({ json: async () => data })).status, 409)
  assert.equal(writes, 0)
  assert.equal(stripeCalls, 0)
})

test('El checkout guarda y cobra la base validada con la tienda e importe del servidor', async () => {
  let order
  let sessionOptions
  const api = load('app/api/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/stripe': { formatAmountForStripe: value => Math.round(value * 100), stripe: { checkout: { sessions: { create: async options => { sessionOptions = options; return { id: 'cs_test', url: 'https://checkout.stripe.com/test' } } } } } },
    '@/lib/db': {
      getStoreById: async () => ({ id: 'joan', name: 'Happycheese Joan Alcover', active: true }), getFlavors: async () => [flavor],
      createOrder: async data => { order = { ...data, id: 'HC-test' }; return order },
    },
    '@/lib/supabase-admin': { default: { from: () => {
      const query = { update() { return query }, eq() { return query }, select() { return query }, single: async () => ({ error: null }) }
      return query
    } } },
    '@/lib/order-items': pricing, '@/lib/date-utils': { isValidPickupDate: () => true },
  })
  const data = { items: [choice], total: 57, storeId: 'joan', storeName: 'Otra tienda', customerName: 'Test', customerEmail: 'test@example.com', customerPhone: '123456789', pickupDate: '2026-12-10', pickupTime: '12:00' }
  assert.equal((await api.POST({ json: async () => data })).status, 200)
  assert.equal(order.storeName, 'Happycheese Joan Alcover')
  assert.equal(order.total, 57)
  assert.equal(order.items[0].customBase.name, base.name)
  assert.equal(sessionOptions.line_items[0].price_data.unit_amount, 2850)
  assert.equal(sessionOptions.line_items[0].quantity, 2)
  assert.ok(sessionOptions.line_items[0].price_data.product_data.description.includes(base.name))
})

test('Stripe y el pedido reciben el suplemento del tamaño elegido, sin heredar el importe común', async () => {
  let order
  let sessionOptions
  const api = load('app/api/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/stripe': { formatAmountForStripe: value => Math.round(value * 100), stripe: { checkout: { sessions: { create: async options => { sessionOptions = options; return { id: 'cs_test', url: 'https://checkout.stripe.com/test' } } } } } },
    '@/lib/db': {
      getStoreById: async () => ({ id: 'joan', name: 'Joan Alcover', active: true }), getFlavors: async () => [sizedFlavor],
      createOrder: async data => { order = { ...data, id: 'HC-test' }; return order },
    },
    '@/lib/supabase-admin': { default: { from: () => {
      const query = { update() { return query }, eq() { return query }, select() { return query }, single: async () => ({ error: null }) }
      return query
    } } },
    '@/lib/order-items': pricing, '@/lib/date-utils': { isValidPickupDate: () => true },
  })
  const data = { items: ['individual', 'mediana', 'grande'].map(portion => ({ ...choice, portion, quantity: 1 })), total: 79.75, storeId: 'joan', storeName: 'Joan Alcover', customerName: 'Test', customerEmail: 'test@example.com', customerPhone: '123456789', pickupDate: '2026-12-10', pickupTime: '12:00' }
  assert.equal((await api.POST({ json: async () => data })).status, 200)
  assert.equal(order.total, 79.75)
  assert.equal(order.items.map(item => item.customBase.surcharge).join(','), '0,2,5.75')
  assert.equal(sessionOptions.line_items.map(item => item.price_data.unit_amount).join(','), '700,2700,4575')
})

test('El aviso de 36 horas coincide con la validación incluso con ajustes antiguos de 34 horas', () => {
  const dates = load('lib/date-utils.ts', { 'date-fns': require('date-fns') })
  assert.equal(dates.getPickupSettings({ minNoticeHours: 34 }).minNoticeHours, 36)
  assert.equal(dates.getPickupSettings({ minNoticeHours: 48 }).minNoticeHours, 48)
  assert.equal(dates.isValidPickupDate('2000-01-01', '12:00'), false)
})

test('La vista previa de pedidos no está disponible en producción', () => {
  const route = load('app/pedido/vista-previa/page.tsx', {
    'react/jsx-runtime': {},
    'next/navigation': { notFound: () => { throw new Error('Preview disabled') } },
    '@/components/header': {}, '@/components/footer': {}, '@/components/order/order-confirmation': {},
  }, { NODE_ENV: 'production' })
  assert.throws(() => route.default(), /Preview disabled/)
})

test('La vista previa del correo no envía emails y muestra el enlace de la tienda elegida', async () => {
  const mocks = { '@/lib/email-templates': templates, '@/lib/store-reviews': reviews }
  const route = load('app/pedido/vista-previa-email/contenido/route.ts', mocks, { NODE_ENV: 'development' })
  for (const [store, id] of [['joan', 'happycheese'], ['lux', 'happycheese-lux']]) {
    const response = route.GET({ url: `http://localhost/pedido/vista-previa-email/contenido?tienda=${store}` })
    const html = await response.text()
    assert.equal(response.status, 200)
    assert.ok(html.includes(reviewLinks[id]))
    assert.ok(html.includes('Tu opinión nos importa'))
    assert.ok(html.includes('Galleta de pistacho'))
  }
  const production = load('app/pedido/vista-previa-email/contenido/route.ts', mocks, { NODE_ENV: 'production' })
  assert.equal(production.GET({ url: 'http://localhost/pedido/vista-previa-email/contenido' }).status, 404)
})

test('La página de vista previa del correo también está desactivada en producción', async () => {
  const route = load('app/pedido/vista-previa-email/page.tsx', {
    'react/jsx-runtime': {}, 'next/link': {},
    'next/navigation': { notFound: () => { throw new Error('Preview disabled') } },
  }, { NODE_ENV: 'production' })
  await assert.rejects(() => route.default({ searchParams: Promise.resolve({}) }), /Preview disabled/)
})

test('La confirmación web invita a reseñar la tienda del pedido solo después de pagar', () => {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const wrapper = ({ children }) => React.createElement('div', null, children)
  const confirmation = load('components/order/order-confirmation.tsx', {
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: ({ children, href }) => React.createElement('a', { href }, children) },
    '@/components/ui/button': { Button: wrapper },
    '@/components/ui/card': { Card: wrapper, CardContent: wrapper },
    'lucide-react': require('lucide-react'),
    '@/lib/order-status': load('lib/order-status.ts'),
    '@/lib/store-reviews': reviews,
  })
  const sample = {
    id: 'demo', storeId: 'happycheese', storeName: 'Joan Alcover', items: [], total: 25,
    status: 'confirmado', paymentStatus: 'paid', pickupDate: '2026-12-10', pickupTime: '12:00',
  }
  const render = order => renderToStaticMarkup(React.createElement(confirmation.OrderConfirmation, { order }))
  const htmlUrl = value => value.replaceAll('&', '&amp;')
  assert.ok(render(sample).includes(htmlUrl(reviewLinks.happycheese)))
  assert.ok(!render(sample).includes(htmlUrl(reviewLinks['happycheese-lux'])))
  assert.ok(render({ ...sample, storeId: 'happycheese-lux', storeName: 'Lux' }).includes(htmlUrl(reviewLinks['happycheese-lux'])))
  const customUrl = 'https://g.page/r/nuevo/review'
  assert.ok(render({ ...sample, storeReviewUrl: customUrl }).includes(customUrl))
  for (const patch of [{ paymentStatus: 'pending' }, { status: 'cancelado' }, { storeId: 'unknown' }]) {
    assert.ok(!render({ ...sample, ...patch }).includes('Dejar mi reseña ahora'))
  }
})

test('El enlace de reseñas configurado se entrega sin que un fallo de tienda oculte el pago', async () => {
  const order = { id: 'HC-test', storeId: 'happycheese-lux', paymentStatus: 'paid' }
  let failLookup = false
  let lookedUp
  const api = load('app/api/checkout/confirm/route.ts', {
    'next/server': { after() {}, NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/order-payments': { PaymentSyncError: class extends Error {}, syncCheckoutSession: async () => order },
    '@/lib/db': { getStoreById: async id => { lookedUp = id; if (failLookup) throw new Error('Offline'); return { googleReviewUrl: 'https://g.page/r/lux-actual/review' } } },
    '@/lib/store-reviews': reviews,
  })
  const request = { json: async () => ({ orderId: order.id, sessionId: 'cs_test' }) }
  assert.equal((await api.POST(request)).body.storeReviewUrl, 'https://g.page/r/lux-actual/review')
  assert.equal(lookedUp, order.storeId)
  failLookup = true
  const fallback = await api.POST(request)
  assert.equal(fallback.status, 200)
  assert.equal(fallback.body.paymentStatus, 'paid')
  assert.equal(fallback.body.storeReviewUrl, reviewLinks['happycheese-lux'])
})
