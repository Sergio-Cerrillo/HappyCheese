// Pruebas aisladas: no usan credenciales ni llaman a Stripe, Supabase o Resend.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks, env = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const exports = {}
  vm.runInNewContext(output, {
    exports, require: (name) => {
      if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`)
      return mocks[name]
    }, process: { env: { STRIPE_WEBHOOK_SECRET: 'test_secret', ...env } }, console: { log() {}, error() {} },
  }, { filename: file })
  return exports
}

function setup(overrides = {}) {
  const order = {
    id: 'HC-test', status: 'pendiente', paymentStatus: 'pending', total: 25,
    stripeSessionId: 'cs_test', customerEmail: 'test@example.com', items: [],
    createdAt: '2026-10-16T14:27:53.765+00:00', updatedAt: '2026-10-16T14:27:53.765+00:00',
    ...overrides,
  }
  const charge = { id: 'ch_test', object: 'charge', payment_intent: 'pi_test', refunded: false, amount_refunded: 0, created: 1700000000 }
  const intent = { id: 'pi_test', object: 'payment_intent', status: 'succeeded', latest_charge: charge }
  const session = {
    id: 'cs_test', metadata: { orderId: order.id }, payment_status: 'paid',
    payment_intent: intent, currency: 'eur', amount_total: 2500,
    status: 'complete', created: 1700000000,
  }
  const state = {
    customer: 0, store: 0, failCustomer: false, failDb: false, currentSession: session,
    blockedUpdate: false, concurrentStatus: null, failStripe: false, sessionReads: 0,
    readCount: 0, updateCount: 0, sessionPages: null,
  }
  const database = { from: () => {
    let updates
    let single = false
    const filters = []
    const query = {
      select() { return query },
      update(value) { updates = value; return query },
      eq(key, value) { filters.push(() => order[key] === value); return query },
      is(key, value) { filters.push(() => (order[key] ?? null) === value); return query },
      single() { single = true; return query },
      maybeSingle() { return query },
      then(resolve, reject) {
        if (updates) state.updateCount++
        else state.readCount++
        if (updates && state.concurrentStatus) {
          order.status = state.concurrentStatus
          order.updatedAt = '2030-01-01T00:00:00.000Z'
          state.concurrentStatus = null
        }
        const matches = filters.every((filter) => filter())
        const affected = matches && (!updates || !state.blockedUpdate)
        const error = state.failDb ? new Error('Database unavailable')
          : single && !affected ? new Error('Expected exactly one row') : null
        if (!error && updates && affected) Object.assign(order, updates)
        return Promise.resolve({ data: !error && affected ? { ...order } : null, error }).then(resolve, reject)
      },
    }
    return query
  } }
  let event
  const stripe = {
    webhooks: { constructEvent: () => event },
    paymentIntents: { retrieve: async () => intent },
    checkout: { sessions: {
      retrieve: async () => {
        state.sessionReads++
        if (state.failStripe) throw new Error('Stripe unavailable')
        return state.currentSession
      },
      list: async (options) => {
        if (state.failStripe) throw new Error('Stripe unavailable')
        if (state.sessionPages) return state.sessionPages(options)
        return { data: [state.currentSession], has_more: false }
      },
    } },
  }
  const service = load('lib/order-payments.ts', {
    'server-only': {},
    '@/lib/stripe': { stripe },
    '@/lib/supabase-admin': { default: database },
    '@/lib/email': {
      sendCustomerConfirmationEmail: async () => {
        state.customer++
        if (state.failCustomer) throw new Error('Email unavailable')
      },
      sendStoreNotificationEmail: async () => { state.store++ },
    },
  })
  const afterTasks = []
  const server = {
    NextResponse: { json: (body, options) => ({ body, status: options?.status || 200, headers: options?.headers || {} }) },
    after: task => afterTasks.push(task),
  }
  const api = load('app/api/webhooks/stripe/route.ts', {
    'next/server': server, '@/lib/stripe': { stripe }, '@/lib/order-payments': service,
  })
  const confirmation = load('app/api/checkout/confirm/route.ts', {
    'next/server': server, '@/lib/order-payments': service,
  })
  return { order, session, state, service, intent, charge, confirmation, afterTasks,
    send: async (type = 'checkout.session.completed', object = session) => {
      event = { id: 'evt_test', type, data: { object } }
      return api.POST({ text: async () => '{}', headers: { get: () => 'signature' } })
    },
  }
}

test('Un checkout no pagado no se confirma ni envía correos', async () => {
  const flow = setup()
  flow.session.payment_status = 'unpaid'
  assert.equal((await flow.send()).status, 200)
  assert.equal(flow.order.paymentStatus, 'pending')
  assert.equal(flow.state.customer + flow.state.store, 0)
})

test('Un pago confirmado actualiza el pedido y registra ambos correos', async () => {
  const flow = setup()
  assert.equal((await flow.send()).status, 200)
  assert.equal(flow.order.status, 'confirmado')
  assert.equal(flow.order.paymentStatus, 'paid')
  assert.ok(flow.order.customerConfirmationSentAt)
  assert.ok(flow.order.storeNotificationSentAt)
})

test('Los eventos repetidos no reenvían correos ni revierten pedidos completados', async () => {
  const flow = setup()
  await flow.send()
  flow.order.status = 'completado'
  const paidAt = flow.order.paidAt
  await flow.send()
  assert.equal(flow.order.status, 'completado')
  assert.equal(flow.order.paidAt, paidAt)
  assert.equal(flow.state.customer, 1)
  assert.equal(flow.state.store, 1)
})

test('Un error de correo devuelve 500 y el reintento solo envía el que falta', async () => {
  const flow = setup()
  flow.state.failCustomer = true
  assert.equal((await flow.send()).status, 500)
  assert.equal(flow.order.paymentStatus, 'paid')
  assert.ok(flow.order.storeNotificationSentAt)
  flow.state.failCustomer = false
  assert.equal((await flow.send()).status, 200)
  assert.equal(flow.state.customer, 2)
  assert.equal(flow.state.store, 1)
})

test('Un error de base de datos devuelve 500 para permitir reintentos', async () => {
  const flow = setup()
  flow.state.failDb = true
  assert.equal((await flow.send()).status, 500)
  assert.equal(flow.state.customer, 0)
})

test('Un importe o sesión distintos no confirman el pedido', async () => {
  for (const mutation of [{ amount_total: 1 }, { id: 'cs_other' }]) {
    const flow = setup()
    Object.assign(flow.session, mutation)
    assert.equal((await flow.send()).status, 500)
    assert.equal(flow.order.paymentStatus, 'pending')
  }
})

test('Las sesiones caducadas se cancelan sin cambiar pedidos ya pagados', async () => {
  const unpaid = setup()
  unpaid.session.status = 'expired'
  unpaid.session.payment_status = 'unpaid'
  await unpaid.send('checkout.session.expired')
  assert.equal(unpaid.order.status, 'cancelado')
  assert.equal(unpaid.order.paymentStatus, 'expired')
  const paid = setup({ paymentStatus: 'paid', status: 'completado' })
  await paid.send('checkout.session.expired')
  assert.equal(paid.order.paymentStatus, 'paid')
  assert.equal(paid.order.status, 'completado')
})

test('Un intento fallido permite pagar después; un fallo antiguo no revierte el pago', async () => {
  const flow = setup()
  flow.session.status = 'open'
  flow.session.payment_status = 'unpaid'
  flow.intent.last_payment_error = { message: 'declined' }
  await flow.send('payment_intent.payment_failed', { id: 'pi_test', object: 'payment_intent' })
  assert.equal(flow.order.paymentStatus, 'failed')
  flow.session.status = 'complete'
  flow.session.payment_status = 'paid'
  await flow.send()
  await flow.send('payment_intent.payment_failed', { id: 'pi_test', object: 'payment_intent' })
  assert.equal(flow.order.paymentStatus, 'paid')
})

test('Los reembolsos parciales y completos actualizan el indicador y su importe', async () => {
  const flow = setup({ paymentStatus: 'paid', status: 'completado', stripePaymentIntentId: 'pi_test' })
  Object.assign(flow.charge, { refunded: false, amount_refunded: 500 })
  await flow.send('charge.refunded', flow.charge)
  assert.equal(flow.order.paymentStatus, 'partially_refunded')
  assert.equal(flow.order.refundedAmount, 5)
  Object.assign(flow.charge, { refunded: true, amount_refunded: 2500 })
  await flow.send('charge.refunded', flow.charge)
  assert.equal(flow.order.paymentStatus, 'refunded')
  assert.equal(flow.order.status, 'cancelado')
  await flow.send()
  assert.equal(flow.order.paymentStatus, 'refunded')
})

test('Un reembolso recibido antes del webhook de pago no se pierde', async () => {
  const flow = setup()
  Object.assign(flow.charge, { refunded: true, amount_refunded: 2500 })
  await flow.send()
  assert.equal(flow.order.paymentStatus, 'refunded')
  assert.equal(flow.state.customer, 0)
})

test('Los ingresos excluyen impagos y descuentan reembolsos sin depender del estado de preparación', () => {
  const { getOrderRevenue, canConfirmOrder, getPaymentLabel } = load('lib/order-status.ts', {})
  assert.equal(getOrderRevenue({ total: 25, paymentStatus: 'pending' }), 0)
  assert.equal(getOrderRevenue({ total: 25, paymentStatus: 'refunded' }), 0)
  assert.equal(getOrderRevenue({ total: 25, paymentStatus: 'partially_refunded', refundedAmount: 5 }), 20)
  assert.equal(getOrderRevenue({ total: 25, paymentStatus: 'paid', status: 'cancelado' }), 25)
  assert.equal(canConfirmOrder({ status: 'confirmado', paymentStatus: 'pending' }), false)
  assert.equal(getPaymentLabel({ status: 'confirmado' }), 'Pago sin verificar')
})

test('La API impide confirmar impagos y no acepta cambios manuales del pago', async () => {
  const { canConfirmOrder } = load('lib/order-status.ts', {})
  const order = { id: 'HC-test', paymentStatus: 'pending', status: 'pendiente' }
  let lastUpdate
  const api = load('app/api/orders/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/order-status': { canConfirmOrder },
    '@/lib/order-payments': {
      findOrderSession: async () => order.paymentStatus === 'paid' ? 'cs_test' : undefined,
      syncCheckoutSession: async () => order,
    },
    '@/lib/db': {
      getSessionById: async () => ({}), getOrderById: async () => order,
      updateOrder: async (id, updates) => { lastUpdate = updates; return { ...order, ...updates } },
    },
  })
  assert.equal((await api.POST()).status, 410)
  assert.equal((await api.PUT({ json: async () => ({ id: order.id, status: 'confirmado' }) })).status, 409)
  assert.equal(lastUpdate, undefined)
  order.paymentStatus = 'paid'
  assert.equal((await api.PUT({ json: async () => ({ id: order.id, status: 'completado', paymentStatus: 'refunded', total: 0 }) })).status, 200)
  assert.deepEqual(JSON.parse(JSON.stringify(lastUpdate)), { status: 'completado' })
})

test('El checkout guarda un intento pendiente y marca el fallo si Stripe no crea la sesión', async () => {
  let order
  let sessionOptions
  let failStripe = false
  const api = load('app/api/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/stripe': {
      formatAmountForStripe: (value) => Math.round(value * 100),
      stripe: { checkout: { sessions: { create: async (options) => {
        sessionOptions = options
        if (failStripe) throw new Error('Stripe unavailable')
        return { id: 'cs_test', url: 'https://checkout.stripe.com/test' }
      } } } },
    },
    '@/lib/date-utils': { isValidPickupDate: () => true },
    '@/lib/db': {
      getStoreById: async () => ({ active: true }),
      createOrder: async (data) => { order = { ...data, id: 'HC-test' }; return order },
    },
    '@/lib/supabase-admin': { default: { from: () => {
      let changes
      const query = {
        update(value) { changes = value; return query }, eq() { return query },
        select() { return query }, single() { return query },
        then(resolve, reject) {
          Object.assign(order, changes)
          return Promise.resolve({ error: null }).then(resolve, reject)
        },
      }
      return query
    } } },
  })
  const request = { json: async () => ({
    items: [{ flavorName: 'Tarta', price: 25, quantity: 1 }], storeId: 'store', storeName: 'Store',
    customerName: 'Test', customerEmail: 'test@example.com', customerPhone: '123',
    total: 25, pickupDate: '2026-10-20', pickupTime: '12:00',
  }) }
  assert.equal((await api.POST(request)).status, 200)
  assert.equal(order.paymentStatus, 'pending')
  assert.equal(order.stripeSessionId, 'cs_test')
  assert.equal(sessionOptions.payment_intent_data.metadata.orderId, order.id)
  failStripe = true
  assert.equal((await api.POST(request)).status, 500)
  assert.equal(order.status, 'cancelado')
  assert.equal(order.paymentStatus, 'failed')
})

test('La vuelta de Stripe confirma el pago aunque el webhook no haya llegado y falte la sesión en Supabase', async () => {
  const flow = setup({ stripeSessionId: null, stripePaymentIntentId: null, total: 46 })
  flow.session.amount_total = 4600
  const response = await flow.confirmation.POST({ json: async () => ({ sessionId: 'cs_test', orderId: flow.order.id }) })
  assert.equal(response.status, 200)
  assert.equal(response.headers['Cache-Control'], 'private, no-store')
  assert.equal(response.body.paymentStatus, 'paid')
  assert.equal(response.body.status, 'confirmado')
  assert.equal(flow.order.stripeSessionId, 'cs_test')
  assert.equal(flow.order.stripePaymentIntentId, 'pi_test')
  // La respuesta de pago no espera a Resend.
  assert.equal(flow.state.customer + flow.state.store, 0)
  await Promise.all(flow.afterTasks.map(task => task()))
  assert.equal(flow.state.customer, 1)
  assert.equal(flow.state.store, 1)
})

test('Una actualización que afecta a cero filas nunca se considera un pago guardado', async () => {
  const flow = setup()
  flow.state.blockedUpdate = true
  const response = await flow.confirmation.POST({ json: async () => ({ sessionId: 'cs_test', orderId: flow.order.id }) })
  assert.equal(response.status, 503)
  assert.equal(flow.order.paymentStatus, 'pending')
  assert.equal(flow.afterTasks.length, 0)
  assert.equal(flow.state.customer + flow.state.store, 0)
  assert.equal((await flow.send()).status, 500)
})

test('Si Stripe no está disponible, la página devuelve un error de verificación en vez de afirmar que está pendiente', async () => {
  const flow = setup()
  flow.state.failStripe = true
  const response = await flow.confirmation.POST({ json: async () => ({ sessionId: 'cs_test', orderId: flow.order.id }) })
  assert.equal(response.status, 502)
  assert.equal(response.body.paymentStatus, undefined)
  assert.equal(flow.afterTasks.length, 0)
})

test('Conocer otro número de pedido no permite acceder a sus datos con una sesión ajena', async () => {
  const flow = setup()
  const response = await flow.confirmation.POST({ json: async () => ({ sessionId: 'cs_test', orderId: 'HC-other' }) })
  assert.equal(response.status, 404)
  assert.equal(response.body.customerEmail, undefined)
  assert.equal(flow.state.readCount, 0)
  assert.equal(flow.state.updateCount, 0)
})

test('Los parámetros de retorno incompletos no consultan ni modifican pedidos', async () => {
  const flow = setup()
  const response = await flow.confirmation.POST({ json: async () => ({ orderId: flow.order.id }) })
  assert.equal(response.status, 400)
  assert.equal(flow.state.sessionReads, 0)
})

test('Una acción del administrador durante la verificación no se sobrescribe', async () => {
  const flow = setup()
  flow.state.concurrentStatus = 'completado'
  await flow.service.syncCheckoutSession(flow.session.id, flow.order.id)
  assert.equal(flow.order.status, 'completado')
  assert.equal(flow.order.paymentStatus, 'paid')
  assert.ok(flow.state.readCount >= 2)
})

test('El administrador recupera y concilia pedidos antiguos sin sesión guardada', async () => {
  const flow = setup({ stripeSessionId: null })
  const orders = await flow.service.reconcileOrders([{ ...flow.order }])
  assert.equal(orders[0].paymentStatus, 'paid')
  assert.equal(orders[0].stripeSessionId, flow.session.id)
  assert.equal(orders[0].stripePaymentIntentId, 'pi_test')
  assert.equal(orders[0].paymentSyncError, false)
  // Una consulta al panel no envía correos retrospectivos al cliente.
  assert.equal(flow.state.customer + flow.state.store, 0)
})

test('Los errores al conciliar un pedido se señalan en el panel', async () => {
  const flow = setup()
  flow.state.failStripe = true
  const orders = await flow.service.reconcileOrders([{ ...flow.order }])
  assert.equal(orders[0].paymentSyncError, true)
  assert.equal(orders[0].paymentStatus, 'pending')
})

test('La búsqueda de sesiones pagina y exige el ID exacto, no un prefijo del pedido', async () => {
  const flow = setup({ stripeSessionId: null })
  flow.state.sessionPages = options => options.starting_after
    ? { data: [flow.session], has_more: false }
    : { data: [{ id: 'cs_other', metadata: { orderId: 'HC-test-other' } }], has_more: true }
  assert.equal(await flow.service.findOrderSession(flow.order), flow.session.id)
})

test('El cliente administrativo exige la clave de servidor y no usa la clave pública como alternativa', () => {
  const clients = []
  const mocks = { 'server-only': {}, '@supabase/supabase-js': { createClient: (...args) => {
    clients.push(args)
    return { schema: () => ({}) }
  } } }
  assert.throws(() => load('lib/supabase-admin.ts', mocks, {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
  }), /SUPABASE_SERVICE_ROLE_KEY/)
  assert.equal(clients.length, 0)
  load('lib/supabase-admin.ts', mocks, {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-key',
  })
  assert.equal(clients[0][1], 'server-key')
  assert.equal(clients[0][2].auth.persistSession, false)
})

test('No cambia un pedido realmente sin pagar aunque se use una URL de retorno de éxito', async () => {
  const flow = setup()
  flow.session.payment_status = 'unpaid'
  flow.session.status = 'open'
  const response = await flow.confirmation.POST({ json: async () => ({ sessionId: flow.session.id, orderId: flow.order.id }) })
  assert.equal(response.status, 200)
  assert.equal(response.body.paymentStatus, 'pending')
  await Promise.all(flow.afterTasks.map(task => task()))
  assert.equal(flow.state.customer + flow.state.store, 0)
})

test('La comprobación de Stripe conserva un estado pendiente que el admin asignó después de cobrar', async () => {
  const flow = setup({ status: 'pendiente', paymentStatus: 'paid', paidAt: '2026-10-16T14:30:00.000Z' })
  await flow.service.syncCheckoutSession(flow.session.id, flow.order.id)
  assert.equal(flow.order.status, 'pendiente')
  assert.equal(flow.order.paymentStatus, 'paid')
})

test('El endpoint del panel concilia antes de responder y exige autenticación', async () => {
  let authenticated = false
  let reconciliations = 0
  const api = load('app/api/orders/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => authenticated ? { value: 'session' } : undefined }) },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200, headers: options?.headers }) } },
    '@/lib/order-status': {},
    '@/lib/order-payments': { reconcileOrders: async orders => {
      reconciliations++
      return orders.map(order => ({ ...order, paymentStatus: 'paid', paymentSyncError: true }))
    } },
    '@/lib/db': { getSessionById: async () => ({}), getOrders: async () => [{ id: 'HC-test', paymentStatus: 'pending' }] },
  })
  assert.equal((await api.GET()).status, 401)
  assert.equal(reconciliations, 0)
  authenticated = true
  const response = await api.GET()
  assert.equal(response.body[0].paymentStatus, 'paid')
  assert.equal(response.headers['Cache-Control'], 'private, no-store')
  assert.equal(response.headers['X-Order-Sync-Errors'], '1')
})

test('La escritura administrativa comprueba el pago y la versión dentro de la propia actualización', async () => {
  const conditions = []
  const query = {
    update() { return query }, select() { return query },
    eq(key, value) { conditions.push([key, value]); return query },
    in(key, values) { conditions.push([key, [...values]]); return query },
    single: async () => ({ data: null, error: new Error('Concurrent refund') }),
  }
  const db = load('lib/db.ts', { './supabase-admin': { db: { from: () => query } } })
  assert.equal(await db.updateOrder('HC-test', { status: 'completado' }, '2026-10-16T14:30:00Z'), null)
  assert.deepEqual(conditions, [
    ['id', 'HC-test'], ['updatedAt', '2026-10-16T14:30:00Z'], ['paymentStatus', ['paid', 'partially_refunded']],
  ])
})

test('El webhook no oculta un fallo al registrar el envío de un correo', async () => {
  const flow = setup()
  await flow.send()
  flow.order.customerConfirmationSentAt = undefined
  flow.state.blockedUpdate = true
  assert.equal((await flow.send()).status, 500)
  assert.equal(flow.order.paymentStatus, 'paid')
  assert.equal(flow.order.customerConfirmationSentAt, undefined)
})

test('Antes de completar un pedido, el panel detecta un reembolso de Stripe aún no registrado', async () => {
  const flow = setup({ paymentStatus: 'paid', status: 'confirmado' })
  Object.assign(flow.charge, { refunded: true, amount_refunded: 2500 })
  let manualUpdates = 0
  const api = load('app/api/orders/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/order-status': load('lib/order-status.ts', {}),
    '@/lib/order-payments': flow.service,
    '@/lib/db': {
      getSessionById: async () => ({}), getOrderById: async () => ({ ...flow.order }),
      updateOrder: async () => { manualUpdates++; return flow.order },
    },
  })
  const response = await api.PUT({ json: async () => ({ id: flow.order.id, status: 'completado' }) })
  assert.equal(response.status, 409)
  assert.equal(flow.order.paymentStatus, 'refunded')
  assert.equal(flow.order.status, 'cancelado')
  assert.equal(manualUpdates, 0)
})

function stripeRecordApi(options = {}) {
  const order = { id: 'HC-test', total: 46, stripeSessionId: 'cs_test' }
  const session = {
    id: 'cs_test', metadata: { orderId: order.id }, currency: 'eur', amount_total: 4600,
    livemode: true, status: 'expired', payment_status: 'unpaid', payment_intent: null,
    created: 1792160873, expires_at: 1792247273,
    ...options.session,
  }
  const calls = { database: 0, stripe: 0 }
  const api = load('app/api/orders/[id]/stripe/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => options.authenticated === false ? undefined : { value: 'admin-session' } }) },
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: 200, ...init }) } },
    '@/lib/db': {
      getSessionById: async () => options.expiredAuth ? null : {},
      getOrderById: async () => { calls.database++; return order },
    },
    '@/lib/order-payments': { findOrderSession: async () => options.missingSession ? undefined : session.id },
    '@/lib/stripe': { stripe: {
      paymentIntents: { retrieve: async () => ({ id: 'pi_verified', status: 'requires_payment_method', ...options.intent }) },
      checkout: { sessions: { retrieve: async () => {
        calls.stripe++
        if (options.stripeUnavailable) throw new Error('Stripe unavailable')
        return session
      } } },
    } },
  })
  return { calls, open: () => api.GET({}, { params: Promise.resolve({ id: order.id }) }) }
}

test('Consultar el diagnóstico de Stripe exige una sesión de administrador válida', async () => {
  for (const options of [{ authenticated: false }, { expiredAuth: true }]) {
    const fixture = stripeRecordApi(options)
    assert.equal((await fixture.open()).status, 401)
    assert.equal(fixture.calls.database, 0)
    assert.equal(fixture.calls.stripe, 0)
  }
})

test('Una sesión caducada muestra su estado sin inventar un rechazo bancario ni redirigir', async () => {
  const response = await stripeRecordApi().open()
  assert.equal(response.status, 200)
  assert.equal(response.url, undefined)
  assert.equal(response.body.found, true)
  assert.equal(response.body.sessionStatus, 'expired')
  assert.equal(response.body.paymentStatus, 'unpaid')
  assert.equal(response.body.lastPaymentError, undefined)
  assert.match(response.body.summary, /no demuestra que la tarjeta fuera rechazada/)
  assert.equal(response.headers['Cache-Control'], 'private, no-store')
})

test('Un intento de cobro se devuelve como diagnóstico sin secretos ni datos de tarjeta', async () => {
  const response = await stripeRecordApi({ session: { payment_intent: 'pi_verified' }, intent: {
    client_secret: 'must-not-leak', payment_method: { card: { number: 'must-not-leak' } },
  } }).open()
  assert.equal(response.status, 200)
  assert.equal(response.body.paymentIntentId, 'pi_verified')
  assert.equal(response.body.paymentIntentStatus, 'requires_payment_method')
  assert.equal(JSON.stringify(response.body).includes('must-not-leak'), false)
})

test('El diagnóstico no muestra sesiones que pertenecen a otro pedido o con otro importe', async () => {
  for (const session of [{ metadata: { orderId: 'HC-other' } }, { amount_total: 1 }]) {
    const response = await stripeRecordApi({ session }).open()
    assert.equal(response.status, 409)
    assert.equal(response.body.sessionId, undefined)
  }
})

test('No encontrar una sesión no se interpreta como un pago fallido', async () => {
  const fixture = stripeRecordApi({ missingSession: true })
  const response = await fixture.open()
  assert.equal(response.status, 200)
  assert.equal(response.body.found, false)
  assert.equal(response.body.lastPaymentError, undefined)
  assert.equal(fixture.calls.stripe, 0)
})

test('Un fallo de conexión con Stripe se muestra como error de consulta', async () => {
  const response = await stripeRecordApi({ stripeUnavailable: true }).open()
  assert.equal(response.status, 502)
  assert.equal(response.body.paymentStatus, undefined)
})

test('Se muestra el último error que Stripe conserva, con su código y motivo de rechazo', async () => {
  const response = await stripeRecordApi({ session: { payment_intent: {
    id: 'pi_declined', status: 'requires_payment_method',
    last_payment_error: { code: 'card_declined', decline_code: 'insufficient_funds', message: 'Your card has insufficient funds.', payment_method: { client_secret: 'must-not-leak' } },
  } } }).open()
  assert.equal(response.status, 200)
  assert.equal(response.body.lastPaymentError.code, 'card_declined')
  assert.equal(response.body.lastPaymentError.declineCode, 'insufficient_funds')
  assert.equal(response.body.lastPaymentError.message, 'Your card has insufficient funds.')
  assert.equal(JSON.stringify(response.body).includes('must-not-leak'), false)
})

test('Los pagos reembolsados se distinguen de una sesión pagada o abandonada', async () => {
  const response = await stripeRecordApi({ session: { payment_status: 'paid', payment_intent: {
    id: 'pi_refunded', status: 'succeeded', latest_charge: { amount_refunded: 4600, refunded: true },
  } } }).open()
  assert.equal(response.status, 200)
  assert.equal(response.body.refundedAmount, 46)
  assert.match(response.body.summary, /reembolso completo/)
})
