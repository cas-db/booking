import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import cds from '@sap/cds'

const test = cds.test('.')
const { GET, POST } = test

describe('BookingService', () => {
  it('lists the seeded customers', async () => {
    const { data } = await GET('/booking/Customers')
    assert.equal(data.value.length, 2)
    assert.deepEqual(data.value.map((c: { name: string }) => c.name).toSorted(), [
      'Alice Anders',
      'Bob Berger',
    ])
  })

  it('creates a booking in status Created and reads it back', async () => {
    const { status, data } = await POST('/booking/Bookings', {
      tireSpec: '205/55 R16 winter',
      garageId: 'GAR-01',
    })

    assert.equal(status, 201)
    assert.ok(data.ID)
    assert.equal(data.status, 'Created')

    const one = await GET(`/booking/Bookings(${data.ID})`)
    assert.equal(one.data.ID, data.ID)
    assert.equal(one.data.tireSpec, '205/55 R16 winter')
    assert.equal(one.data.garageId, 'GAR-01')

    const list = await GET('/booking/Bookings')
    assert.ok(list.data.value.some((b: { ID: string }) => b.ID === data.ID))
  })

  it('rejects a booking without a tireSpec', async () => {
    await assert.rejects(POST('/booking/Bookings', { tireSpec: '  ', garageId: 'GAR-01' }), /400/)
  })
})

describe('BookingCreated event', () => {
  it('emits exactly one BookingCreated with the contract payload', async () => {
    const messaging = await cds.connect.to('messaging')
    const received: Record<string, unknown>[] = []
    messaging.on('BookingCreated', (msg) => {
      received.push(msg.data as Record<string, unknown>)
    })

    const { data } = await POST('/booking/Bookings', {
      tireSpec: '225/45 R17 summer',
      garageId: 'GAR-02',
    })

    assert.equal(received.length, 1)
    assert.deepEqual(received[0], {
      bookingId: data.ID,
      tireSpec: '225/45 R17 summer',
      garageId: 'GAR-02',
    })
  })
})

describe('TireDelivered event', () => {
  const createBooking = async (tireSpec: string, garageId: string) => {
    const { data } = await POST('/booking/Bookings', { tireSpec, garageId })
    return data.ID as string
  }

  it('sets the addressed booking to ReadyForSwap and leaves the others alone', async () => {
    const messaging = await cds.connect.to('messaging')
    const delivered = await createBooking('195/65 R15 winter', 'GAR-03')
    const untouched = await createBooking('195/65 R15 winter', 'GAR-03')

    await messaging.emit('TireDelivered', { bookingId: delivered, garageId: 'GAR-03' })

    const one = await GET(`/booking/Bookings(${delivered})`)
    assert.equal(one.data.status, 'ReadyForSwap')

    const other = await GET(`/booking/Bookings(${untouched})`)
    assert.equal(other.data.status, 'Created')
  })

  it('ignores an unknown bookingId and keeps serving', async () => {
    const messaging = await cds.connect.to('messaging')

    await messaging.emit('TireDelivered', {
      bookingId: '99999999-9999-9999-9999-999999999999',
      garageId: 'GAR-03',
    })

    const { status, data } = await GET('/booking/Bookings')
    assert.equal(status, 200)
    assert.ok(Array.isArray(data.value))
  })
})
