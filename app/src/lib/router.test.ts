import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bookingHref, parseRoute } from './router.svelte'

describe('hash router', () => {
  it('treats an empty hash and a bare slash as the overview', () => {
    assert.deepEqual(parseRoute(''), { name: 'bookings' })
    assert.deepEqual(parseRoute('#/'), { name: 'bookings' })
  })

  it('reads the booking ID out of a detail route', () => {
    assert.deepEqual(parseRoute('#/bookings/abc-123'), { name: 'detail', id: 'abc-123' })
  })

  it('decodes an encoded ID', () => {
    assert.deepEqual(parseRoute(bookingHref('a b')), { name: 'detail', id: 'a b' })
  })

  it('answers unknown for anything else', () => {
    assert.deepEqual(parseRoute('#/nope'), { name: 'unknown' })
    assert.deepEqual(parseRoute('#/bookings/a/b'), { name: 'unknown' })
  })
})
