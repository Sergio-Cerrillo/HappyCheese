// Pruebas aisladas. No usan Supabase, Stripe ni correo reales.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const exports = {}
  vm.runInNewContext(output, {
    exports, URL, console: { error() {} }, process: { env: {} },
    require: name => {
      if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`)
      return mocks[name]
    },
  }, { filename: file })
  return exports
}

const sales = load('lib/flavor-sales.ts')
const validation = load('lib/catalog-validation.ts', { zod: require('zod') })
const flavor = {
  id: 'limited', name: 'Edición especial', active: true,
  prices: { mediana: 25, grande: 40 },
  availability: [{ storeId: 'happycheese', portions: ['mediana', 'grande'] }],
  limitedEdition: { enabled: true, startsOn: '2026-10-24', endsOn: '2026-10-25', maxUnits: 20 },
  inventory: { sold: 15, reserved: 3, remaining: 2 },
}

test('Se permite comprar antes de la primera recogida y el final se interpreta en Europe/Madrid', () => {
  assert.equal(sales.getFlavorSaleState(flavor, new Date('2026-10-23T21:59:59Z')).available, true)
  assert.equal(sales.getFlavorSaleState(flavor, new Date('2026-10-23T22:00:00Z')).available, true)
  assert.equal(sales.getFlavorSaleState(flavor, new Date('2026-10-25T22:59:59Z')).available, true)
  assert.equal(sales.getFlavorSaleState(flavor, new Date('2026-10-25T23:00:00Z')).label, 'Edición finalizada')
})

test('El contador distingue una unidad, varias, agotadas y un sabor sin límite', () => {
  const now = new Date('2026-10-24T12:00:00Z')
  assert.equal(sales.getFlavorSaleState(flavor, now).label, 'Quedan 2 unidades')
  assert.equal(sales.getFlavorSaleState({ ...flavor, inventory: { remaining: 1 } }, now).label, 'Queda 1 unidad')
  assert.equal(sales.getFlavorSaleState({ ...flavor, inventory: { remaining: 0 } }, now).available, false)
  assert.equal(sales.getFlavorSaleState({ ...flavor, inventory: undefined }, now).available, false)
  assert.equal(sales.getFlavorSaleState({ ...flavor, limitedEdition: null }, now).available, true)
  assert.equal(sales.getFlavorSaleState({ ...flavor, limitedEdition: { ...flavor.limitedEdition, maxUnits: null } }, now).label, 'Edición limitada')
})

test('El carrito suma tamaños y bases del mismo sabor antes de permitir otra unidad', () => {
  const available = { ...flavor, limitedEdition: { enabled: true, maxUnits: 20 } }
  const cart = [
    { flavorId: 'limited', portion: 'mediana', quantity: 1 },
    { flavorId: 'limited', portion: 'grande', quantity: 1, customBase: { id: 'cookie' } },
    { flavorId: 'other', quantity: 10 },
  ]
  assert.equal(sales.getFlavorCartError(available, cart), null)
  assert.match(sales.getFlavorCartError(available, cart, 1), /quedan 2 unidades/)
})

test('La recogida incluye los dos extremos del período y el modal dispone de un texto con las fechas', () => {
  assert.match(sales.getFlavorPickupError(flavor, '2026-10-23'), /recogida del 24\/10\/2026 al 25\/10\/2026/)
  assert.equal(sales.getFlavorPickupError(flavor, '2026-10-24'), null)
  assert.equal(sales.getFlavorPickupError(flavor, '2026-10-25'), null)
  assert.ok(sales.getFlavorPickupError(flavor, '2026-10-26'))
  assert.equal(sales.getFlavorPickupPeriod({ ...flavor, limitedEdition: { enabled: false } }), null)
  assert.equal(sales.getFlavorPickupPeriod({ ...flavor, limitedEdition: { enabled: true, startsOn: '2030-12-24', endsOn: '2030-12-24' } }), 'Recogida el 24/12/2030')
  assert.equal(sales.getFlavorPickupError({ ...flavor, limitedEdition: { enabled: false } }, '2026-10-01'), null)
})

test('El calendario usa la intersección de las fechas de los sabores del carrito', () => {
  const second = { ...flavor, id: 'second', limitedEdition: { enabled: true, startsOn: '2026-10-25', endsOn: '2026-10-30' } }
  const outsideCart = { ...flavor, id: 'unselected', limitedEdition: { enabled: true, startsOn: '2099-01-01' } }
  const window = sales.getCartPickupWindow([flavor, second, outsideCart], [{ flavorId: flavor.id }, { flavorId: second.id }])
  assert.equal(window.startsOn, '2026-10-25')
  assert.equal(window.endsOn, '2026-10-25')
  const incompatible = sales.getCartPickupWindow([flavor, outsideCart], [{ flavorId: flavor.id }, { flavorId: outsideCart.id }])
  assert.ok(incompatible.startsOn > incompatible.endsOn)
  const regular = sales.getCartPickupWindow([{ ...flavor, limitedEdition: { enabled: false } }], [{ flavorId: flavor.id }])
  assert.equal(regular.startsOn, null)
  assert.equal(regular.endsOn, null)
})

test('La configuración admite límite, fechas o ambos y rechaza rangos e importes inválidos', () => {
  const parse = value => validation.limitedEditionSchema.safeParse(value).success
  for (const value of [
    { enabled: false }, { enabled: true, maxUnits: 20 },
    { enabled: true, endsOn: '2026-11-13' },
    { enabled: true, startsOn: '2026-11-13', endsOn: '2026-11-13', maxUnits: 1 },
  ]) assert.equal(parse(value), true)
  for (const value of [
    { enabled: true }, { enabled: true, maxUnits: 0 }, { enabled: true, maxUnits: 1.2 },
    { enabled: true, maxUnits: '20' }, { enabled: true, maxUnits: 100001 },
    { enabled: true, endsOn: '2026-02-30' }, { enabled: true, startsOn: '2026-11-14', endsOn: '2026-11-13' },
  ]) assert.equal(parse(value), false)
  assert.equal(validation.limitedEditionSchema.parse({ enabled: true, maxUnits: 20, id: 'forged' }).id, undefined)
})

function checkoutSetup(options = {}) {
  let writes = 0
  let sessionOptions
  let requestOptions
  const cleanupChanges = []
  const currentFlavor = { ...flavor, limitedEdition: { enabled: true, maxUnits: 20 }, ...options.flavor }
  const api = load('app/api/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, settings) => ({ body, status: settings?.status || 200 }) } },
    '@/lib/stripe': {
      formatAmountForStripe: value => Math.round(value * 100),
      stripe: { checkout: { sessions: { create: async (data, config) => {
        sessionOptions = data; requestOptions = config
        if (options.stripeError) throw new Error('Connection lost')
        return { id: 'cs_mock', url: 'https://checkout.stripe.com/mock' }
      } } } },
    },
    '@/lib/db': {
      getStoreById: async () => ({ id: 'happycheese', name: 'Joan', active: true }),
      getFlavors: async () => [currentFlavor],
      createOrder: async data => { writes++; if (options.error) throw options.error; return { ...data, id: 'HC-mock' } },
    },
    '@/lib/order-items': load('lib/order-items.ts'),
    '@/lib/flavor-sales': sales,
    '@/lib/flavor-inventory': { refreshExpiredFlavorReservations: async () => false },
    '@/lib/date-utils': { isValidPickupDate: () => true },
    '@/lib/supabase-admin': { default: { from: () => {
      const query = {
        update(value) { cleanupChanges.push(value); return query }, eq() { return query }, select() { return query },
        single: async () => ({ error: null }), then: resolve => Promise.resolve({ error: null }).then(resolve),
      }
      return query
    } } },
  })
  const request = (quantity, pickupDate = '2026-12-10') => ({ json: async () => ({
    items: [{ flavorId: 'limited', portion: 'mediana', quantity }], total: quantity * 25,
    storeId: 'happycheese', storeName: 'Joan', customerName: 'Prueba', customerEmail: 'test@example.com',
    customerPhone: '600000000', pickupDate, pickupTime: '12:00',
  }) })
  return { api, request, results: () => ({ writes, sessionOptions, requestOptions, cleanupChanges }) }
}

test('El checkout rechaza exceso de unidades y fechas vencidas antes de crear el pedido', async () => {
  const limited = checkoutSetup()
  assert.equal((await limited.api.POST(limited.request(3))).status, 409)
  assert.equal(limited.results().writes, 0)
  const ended = checkoutSetup({ flavor: { limitedEdition: { enabled: true, endsOn: '2020-01-01' } } })
  assert.equal((await ended.api.POST(ended.request(1))).status, 409)
  assert.equal(ended.results().writes, 0)
})

test('El checkout limitado crea una sesión de 35 minutos con clave idempotente', async () => {
  const setup = checkoutSetup()
  const before = Math.floor(Date.now() / 1000)
  assert.equal((await setup.api.POST(setup.request(2))).status, 200)
  assert.equal(setup.results().writes, 1)
  assert.ok(setup.results().sessionOptions.expires_at >= before + 35 * 60)
  assert.equal(setup.results().requestOptions.idempotencyKey, 'checkout-HC-mock')
})

test('El checkout admite la compra anticipada y rechaza recogidas fuera del período antes de reservar', async () => {
  const setup = checkoutSetup({ flavor: { limitedEdition: { enabled: true, startsOn: '2090-12-24', endsOn: '2090-12-31', maxUnits: 20 } } })
  assert.equal((await setup.api.POST(setup.request(1, '2090-12-23'))).status, 409)
  assert.equal((await setup.api.POST(setup.request(1, '2091-01-01'))).status, 409)
  assert.equal(setup.results().writes, 0)
  assert.equal((await setup.api.POST(setup.request(1, '2090-12-24'))).status, 200)
  assert.equal((await setup.api.POST(setup.request(1, '2090-12-31'))).status, 200)
  assert.equal(setup.results().writes, 2)
})

test('Un conflicto de stock detectado en la reserva atómica devuelve 409 sin abrir Stripe', async () => {
  const setup = checkoutSetup({ error: { message: 'LIMITED_EDITION: Solo queda una unidad' } })
  const response = await setup.api.POST(setup.request(2))
  assert.equal(response.status, 409)
  assert.equal(response.body.error, 'Solo queda una unidad')
  assert.equal(setup.results().sessionOptions, undefined)
})

test('Un fallo de conexión al crear Checkout mantiene el pedido limitado recuperable para un pago tardío', async () => {
  const setup = checkoutSetup({ stripeError: true })
  assert.equal((await setup.api.POST(setup.request(1))).status, 500)
  assert.equal(setup.results().cleanupChanges[0].status, 'pendiente')
  assert.equal(setup.results().cleanupChanges[0].paymentStatus, 'failed')
})

test('Guardar el sabor valida la edición y descarta el contador y el ID enviados por el navegador', async () => {
  let saved
  const api = load('app/api/flavors/route.ts', {
    'next/server': { NextResponse: { json: (body, settings) => ({ body, status: settings?.status || 200 }) } },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    '@/lib/db': { getSessionById: async () => ({}), updateFlavor: async (id, data) => { saved = data; return { id, ...data } } },
    '@/lib/catalog-validation': validation,
    '@/lib/flavor-catalog': load('lib/flavor-catalog.ts'),
    '@/lib/flavor-inventory': { refreshExpiredFlavorReservations: async () => false },
  })
  assert.equal((await api.PUT({ json: async () => ({ id: 'limited', limitedEdition: { enabled: true, maxUnits: 1.5 } }) })).status, 400)
  assert.equal(saved, undefined)
  assert.equal((await api.PUT({ json: async () => ({ id: 'limited', limitedEdition: { enabled: true, maxUnits: 20, id: 'forged' }, inventory: { remaining: 999 } }) })).status, 200)
  assert.equal(saved.inventory, undefined)
  assert.equal(saved.limitedEdition.id, undefined)
})

function reconciliationSetup({ sessionId, stripeError, paymentStatus = 'pending' } = {}) {
  const changes = []
  let lookups = 0
  let syncs = 0
  const database = { from: table => {
    let update
    const query = {
      select() { return query }, eq() { return query }, lt() { return query }, order() { return query },
      limit() { return query }, single() { return query }, in() { return query },
      update(value) { update = value; return query },
      then(resolve, reject) {
        if (update) changes.push(update)
        const data = table === 'flavorReservations'
          ? [{ orderId: 'HC-reserved' }, { orderId: 'HC-reserved' }]
          : { id: 'HC-reserved', paymentStatus, updatedAt: '2026-11-13T12:00:00Z' }
        return Promise.resolve({ data, error: null }).then(resolve, reject)
      },
    }
    return query
  } }
  const service = load('lib/flavor-inventory.ts', {
    'server-only': {}, '@/lib/supabase-admin': { default: database },
    '@/lib/order-payments': {
      findOrderSession: async () => { lookups++; if (stripeError) throw new Error('Stripe unavailable'); return sessionId },
      syncCheckoutSession: async () => { syncs++ },
    },
  })
  return { service, changes, results: () => ({ lookups, syncs }) }
}

test('Las reservas vencidas se concilian con Stripe una vez por pedido y conservan el cupo ante errores', async () => {
  const found = reconciliationSetup({ sessionId: 'cs_paid_or_expired' })
  await found.service.refreshExpiredFlavorReservations()
  assert.equal(found.results().lookups, 1)
  assert.equal(found.results().syncs, 1)
  assert.equal(found.changes.length, 0)
  const failed = reconciliationSetup({ stripeError: true })
  await failed.service.refreshExpiredFlavorReservations()
  assert.equal(failed.changes.length, 0)
})

test('Un intento huérfano caduca solo después de buscar su sesión y conserva los pagos ya verificados', async () => {
  const orphan = reconciliationSetup()
  await orphan.service.refreshExpiredFlavorReservations()
  assert.equal(orphan.results().lookups, 1)
  assert.equal(orphan.changes[0].paymentStatus, 'expired')
  const paid = reconciliationSetup({ paymentStatus: 'paid' })
  await paid.service.refreshExpiredFlavorReservations()
  assert.equal(paid.changes.length, 0)
})
