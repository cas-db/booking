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

  it('accepts a well formed tireSpec and garageId', async () => {
    const { status } = await POST('/booking/Bookings', {
      tireSpec: '225/45 R17 allseason',
      garageId: 'GAR-42',
    })
    assert.equal(status, 201)
  })

  it('rejects a malformed tireSpec', async () => {
    await assert.rejects(
      POST('/booking/Bookings', { tireSpec: 'very round black tire', garageId: 'GAR-01' }),
      /400/,
    )
  })

  it('rejects a malformed garageId', async () => {
    await assert.rejects(
      POST('/booking/Bookings', { tireSpec: '205/55 R16 winter', garageId: 'garage one' }),
      /400/,
    )
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

  it('ignores a replayed TireDelivered for a booking that is already Done', async () => {
    const messaging = await cds.connect.to('messaging')
    const id = await createBooking('205/55 R16 winter', 'GAR-03')

    await messaging.emit('TireDelivered', { bookingId: id, garageId: 'GAR-03' })
    await POST(`/booking/Bookings(${id})/BookingService.confirmSwap`, {})

    await messaging.emit('TireDelivered', { bookingId: id, garageId: 'GAR-03' })

    const one = await GET(`/booking/Bookings(${id})`)
    assert.equal(one.data.status, 'Done')
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

describe('confirmSwap action', () => {
  const confirmSwap = (id: string) =>
    POST(`/booking/Bookings(${id})/BookingService.confirmSwap`, {})

  const readyBooking = async () => {
    const messaging = await cds.connect.to('messaging')
    const { data } = await POST('/booking/Bookings', {
      tireSpec: '205/55 R16 winter',
      garageId: 'GAR-04',
    })
    await messaging.emit('TireDelivered', { bookingId: data.ID, garageId: 'GAR-04' })
    return data.ID as string
  }

  it('sets a ReadyForSwap booking to Done and returns it', async () => {
    const id = await readyBooking()

    const { data } = await confirmSwap(id)
    assert.equal(data.ID, id)
    assert.equal(data.status, 'Done')

    const one = await GET(`/booking/Bookings(${id})`)
    assert.equal(one.data.status, 'Done')
  })

  it('emits exactly one BookingDone with the contract payload', async () => {
    const messaging = await cds.connect.to('messaging')
    const received: Record<string, unknown>[] = []
    messaging.on('BookingDone', (msg) => {
      received.push(msg.data as Record<string, unknown>)
    })

    const id = await readyBooking()
    await confirmSwap(id)

    assert.equal(received.length, 1)
    assert.deepEqual(received[0], {
      bookingId: id,
      garageId: 'GAR-04',
      tireSpec: '205/55 R16 winter',
    })
  })

  it('emits no BookingDone when the action is rejected', async () => {
    const messaging = await cds.connect.to('messaging')
    let count = 0
    messaging.on('BookingDone', () => {
      count += 1
    })

    const { data } = await POST('/booking/Bookings', {
      tireSpec: '205/55 R16 winter',
      garageId: 'GAR-04',
    })
    await assert.rejects(confirmSwap(data.ID), /409/)

    assert.equal(count, 0)
  })

  it('answers 409 for a booking in Created and leaves the status alone', async () => {
    const { data } = await POST('/booking/Bookings', {
      tireSpec: '205/55 R16 winter',
      garageId: 'GAR-04',
    })

    await assert.rejects(confirmSwap(data.ID), /409/)

    const one = await GET(`/booking/Bookings(${data.ID})`)
    assert.equal(one.data.status, 'Created')
  })

  it('answers 409 for a booking that is already Done', async () => {
    const id = await readyBooking()
    await confirmSwap(id)

    await assert.rejects(confirmSwap(id), /409/)
  })

  it('answers 404 for an unknown ID', async () => {
    await assert.rejects(confirmSwap('99999999-9999-9999-9999-999999999999'), /404/)
  })
})

describe('cancel action', () => {
  const cancel = (id: string) => POST(`/booking/Bookings(${id})/BookingService.cancel`, {})

  const createBooking = async () => {
    const { data } = await POST('/booking/Bookings', {
      tireSpec: '205/55 R16 winter',
      garageId: 'GAR-05',
    })
    return data.ID as string
  }

  it('cancels a booking in Created and emits BookingCancelled', async () => {
    const messaging = await cds.connect.to('messaging')
    const received: Record<string, unknown>[] = []
    messaging.on('BookingCancelled', (msg) => {
      received.push(msg.data as Record<string, unknown>)
    })

    const id = await createBooking()
    const { data } = await cancel(id)

    assert.equal(data.status, 'Cancelled')
    assert.deepEqual(received, [
      { bookingId: id, garageId: 'GAR-05', tireSpec: '205/55 R16 winter' },
    ])
  })

  it('answers 409 for a booking that is no longer in Created', async () => {
    const messaging = await cds.connect.to('messaging')
    const id = await createBooking()
    await messaging.emit('TireDelivered', { bookingId: id, garageId: 'GAR-05' })

    await assert.rejects(cancel(id), /409/)

    const one = await GET(`/booking/Bookings(${id})`)
    assert.equal(one.data.status, 'ReadyForSwap')
  })

  it('answers 404 for an unknown ID', async () => {
    await assert.rejects(cancel('99999999-9999-9999-9999-999999999999'), /404/)
  })

  it('ignores a TireDelivered for a cancelled booking', async () => {
    const messaging = await cds.connect.to('messaging')
    const id = await createBooking()
    await cancel(id)

    await messaging.emit('TireDelivered', { bookingId: id, garageId: 'GAR-05' })

    const one = await GET(`/booking/Bookings(${id})`)
    assert.equal(one.data.status, 'Cancelled')
  })

  it('lists only the bookings in a given status with $filter', async () => {
    const id = await createBooking()
    await cancel(id)

    const { data } = await GET("/booking/Bookings?$filter=status eq 'Cancelled'")
    assert.ok(data.value.length > 0)
    assert.ok(data.value.every((b: { status: string }) => b.status === 'Cancelled'))
    assert.ok(data.value.some((b: { ID: string }) => b.ID === id))
  })
})
