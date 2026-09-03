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
