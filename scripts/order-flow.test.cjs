// Pruebas aisladas: no usan credenciales ni llaman a Stripe, Supabase o Resend.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const exports = {}
  vm.runInNewContext(output, {
    exports, require: (name) => {
      if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`)
      return mocks[name]
    }, process: { env: {} }, console: { log() {}, error() {} },
  }, { filename: file })
  return exports
}

function setup(overrides = {}) {
  const order = {
    id: 'HC-test', status: 'pendiente', paymentStatus: 'pending', total: 25,
    stripeSessionId: 'cs_test', customerEmail: 'test@example.com', items: [],
    ...overrides,
  }
  const session = {
    id: 'cs_test', metadata: { orderId: order.id }, payment_status: 'paid',
    payment_intent: 'pi_test', currency: 'eur', amount_total: 2500,
    status: 'complete', created: 1700000000,
  }
  const state = { customer: 0, store: 0, failCustomer: false, failDb: false, charges: [], currentSession: session }
  const database = { from: () => {
    let updates
    const filters = []
    const query = {
      select() { return query },
      update(value) { updates = value; return query },
      eq(key, value) { filters.push(() => order[key] === value); return query },
      or(expression) {
        if (expression.startsWith('paymentStatus')) {
          const statuses = expression.match(/in\.\(([^)]+)\)/)[1].split(',')
          filters.push(() => order.paymentStatus == null || statuses.includes(order.paymentStatus))
        } else {
          filters.push(() => order.stripeSessionId == null || order.stripeSessionId === session.id)
        }
        return query
      },
      single() { return query },
      then(resolve, reject) {
        const error = state.failDb ? new Error('Database unavailable') : null
        const matches = filters.every((filter) => filter())
        if (!error && updates && matches) Object.assign(order, updates)
        return Promise.resolve({ data: matches ? { ...order } : null, error }).then(resolve, reject)
      },
    }
    return query
  } }
  let event
  const api = load('app/api/webhooks/stripe/route.ts', {
    'next/headers': { headers: async () => ({ get: () => 'signature' }) },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/stripe': { stripe: {
      webhooks: { constructEvent: () => event },
      charges: { list: async () => ({ data: state.charges }), retrieve: async () => state.charges[0] },
      checkout: { sessions: { list: async () => ({ data: [state.currentSession] }) } },
    } },
    '@/lib/supabase': { default: database },
    '@/lib/email': {
      sendCustomerConfirmationEmail: async () => {
        state.customer++
        if (state.failCustomer) throw new Error('Email unavailable')
      },
      sendStoreNotificationEmail: async () => { state.store++ },
    },
  })
  return { order, session, state, send: async (type = 'checkout.session.completed', object = session) => {
    event = { type, data: { object } }
    return api.POST({ text: async () => '{}' })
  } }
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
  await flow.send('payment_intent.payment_failed', { id: 'pi_test' })
  assert.equal(flow.order.paymentStatus, 'failed')
  flow.session.status = 'complete'
  await flow.send()
  await flow.send('payment_intent.payment_failed', { id: 'pi_test' })
  assert.equal(flow.order.paymentStatus, 'paid')
})

test('Los reembolsos parciales y completos actualizan el indicador y su importe', async () => {
  const flow = setup({ paymentStatus: 'paid', status: 'completado', stripePaymentIntentId: 'pi_test' })
  flow.state.charges = [{ id: 'ch_test', payment_intent: 'pi_test', refunded: false, amount_refunded: 500 }]
  await flow.send('charge.refunded', flow.state.charges[0])
  assert.equal(flow.order.paymentStatus, 'partially_refunded')
  assert.equal(flow.order.refundedAmount, 5)
  flow.state.charges[0] = { ...flow.state.charges[0], refunded: true, amount_refunded: 2500 }
  await flow.send('charge.refunded', flow.state.charges[0])
  assert.equal(flow.order.paymentStatus, 'refunded')
  assert.equal(flow.order.status, 'cancelado')
  await flow.send()
  assert.equal(flow.order.paymentStatus, 'refunded')
})

test('Un reembolso recibido antes del webhook de pago no se pierde', async () => {
  const flow = setup()
  flow.state.charges = [{ refunded: true, amount_refunded: 2500 }]
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
    '@/lib/supabase': { default: { from: () => {
      let changes
      const query = {
        update(value) { changes = value; return query }, eq() { return query },
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
