import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { absoluteTime, relativeTime } from './time'

const now = new Date('2026-09-03T12:00:00Z')

describe('relative time', () => {
  it('calls anything younger than a minute just now', () => {
    assert.equal(relativeTime('2026-09-03T11:59:30Z', now), 'just now')
  })

  it('counts minutes, hours and days', () => {
    assert.equal(relativeTime('2026-09-03T11:45:00Z', now), '15 min ago')
    assert.equal(relativeTime('2026-09-03T09:00:00Z', now), '3 h ago')
    assert.equal(relativeTime('2026-09-01T12:00:00Z', now), '2 d ago')
  })

  it('falls back to the date once a week has passed', () => {
    assert.equal(relativeTime('2026-08-01T12:00:00Z', now), '2026-08-01')
  })

  it('survives a missing or broken timestamp', () => {
    assert.equal(relativeTime(null, now), 'unknown')
    assert.equal(relativeTime('not a date', now), 'unknown')
  })
})

describe('absolute time', () => {
  it('renders a readable UTC timestamp', () => {
    assert.equal(absoluteTime('2026-09-03T11:45:09Z'), '2026-09-03 11:45:09 UTC')
  })

  it('survives a missing timestamp', () => {
    assert.equal(absoluteTime(undefined), 'unknown')
  })
})
