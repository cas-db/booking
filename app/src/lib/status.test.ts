import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTION_RESULT,
  allowedActions,
  countByStatus,
  filterBookings,
  matchesText,
  statusLabel,
} from './status'
import type { Booking } from '../api/types'

const booking = (over: Partial<Booking> = {}): Booking => ({
  ID: '11111111-1111-1111-1111-111111111111',
  tireSpec: '205/55 R16 winter',
  garageId: 'GAR-01',
  status: 'Created',
  ...over,
})

describe('booking filters', () => {
  it('keeps every booking when no chip is selected and the needle is empty', () => {
    const all = [booking(), booking({ ID: 'b', status: 'Done' })]
    assert.deepEqual(filterBookings(all, [], ''), all)
  })

  it('narrows to the selected statuses', () => {
    const all = [booking(), booking({ ID: 'b', status: 'Done' })]
    assert.deepEqual(
      filterBookings(all, ['Done'], '').map((b) => b.ID),
      ['b'],
    )
  })

  it('combines chips and the needle with AND', () => {
    const all = [
      booking({ ID: 'a', status: 'Done', garageId: 'GAR-01' }),
      booking({ ID: 'b', status: 'Done', garageId: 'GAR-02' }),
    ]
    assert.deepEqual(
      filterBookings(all, ['Done'], 'GAR-02').map((b) => b.ID),
      ['b'],
    )
  })

  it('matches tire spec, garage and customer name, ignoring case', () => {
    const row = booking({ customer: { ID: 'c', name: 'Alice Anders' } })
    assert.equal(matchesText(row, 'winter'), true)
    assert.equal(matchesText(row, 'gar-01'), true)
    assert.equal(matchesText(row, 'alice'), true)
    assert.equal(matchesText(row, 'summer'), false)
    assert.equal(matchesText(row, '   '), true)
  })
})

describe('status helpers', () => {
  it('counts every status, including the empty ones', () => {
    const counts = countByStatus([booking(), booking({ ID: 'b', status: 'Done' })])
    assert.deepEqual(counts, { Created: 1, ReadyForSwap: 0, Done: 1, Cancelled: 0 })
  })

  it('renders ReadyForSwap as two words', () => {
    assert.equal(statusLabel('ReadyForSwap'), 'Ready for swap')
    assert.equal(statusLabel('Done'), 'Done')
  })
})

describe('allowed actions per status', () => {
  it('offers confirm swap only in ReadyForSwap', () => {
    assert.deepEqual(allowedActions('ReadyForSwap'), ['confirmSwap'])
  })

  it('offers cancel only in Created, the backend forbids it later', () => {
    assert.deepEqual(allowedActions('Created'), ['cancel'])
  })

  it('offers nothing once a booking is Done or Cancelled', () => {
    assert.deepEqual(allowedActions('Done'), [])
    assert.deepEqual(allowedActions('Cancelled'), [])
  })

  it('names the status an action leaves the booking in', () => {
    assert.equal(ACTION_RESULT.confirmSwap, 'Done')
    assert.equal(ACTION_RESULT.cancel, 'Cancelled')
  })
})
