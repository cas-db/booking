import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { BOOKING_STATUS, canTransition, type BookingStatus } from '../srv/booking-status'

const allowed: [BookingStatus, BookingStatus][] = [
  ['Created', 'ReadyForSwap'],
  ['ReadyForSwap', 'Done'],
  ['Created', 'Cancelled'],
]

const isAllowed = (from: BookingStatus, to: BookingStatus) =>
  allowed.some(([f, t]) => f === from && t === to)

describe('booking status transitions', () => {
  for (const from of BOOKING_STATUS) {
    for (const to of BOOKING_STATUS) {
      const expected = isAllowed(from, to)
      it(`${expected ? 'allows' : 'forbids'} ${from} -> ${to}`, () => {
        assert.equal(canTransition(from, to), expected)
      })
    }
  }

  it('forbids a transition from an unknown status', () => {
    assert.equal(canTransition(undefined, 'ReadyForSwap'), false)
    assert.equal(canTransition('Nonsense', 'Done'), false)
  })
})
