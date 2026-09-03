import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import cds from '@sap/cds'

const test = cds.test('.')
const { GET, POST } = test

type ContractEvent = { event: string; fields: string[]; emittedBy: string; consumedBy: string }

/** Reads the shared event contract table out of specs/README.md. */
function readContract(): ContractEvent[] {
  const spec = readFileSync('specs/README.md', 'utf8')
  const rows = spec.matchAll(/^\|\s*`(\w+)`\s*\|\s*`\{([^}]*)\}`\s*\|\s*(\w+)\s*\|\s*(\w+)\s*\|$/gm)

  return [...rows].map(([, event, payload, emittedBy, consumedBy]) => ({
    event,
    fields: payload
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean),
    emittedBy,
    consumedBy,
  }))
}

const contract = readContract()
const ours = (direction: 'emittedBy' | 'consumedBy') =>
  contract.filter((e) => e[direction] === 'booking')

describe('the shared event contract', () => {
  before(() => {
    assert.equal(contract.length, 4, 'specs/README.md must list the four chain events')
  })

  it('names booking as the emitter of BookingCreated and the consumer of TireDelivered', () => {
    assert.deepEqual(
      ours('emittedBy').map((e) => e.event),
      ['BookingCreated'],
    )
    assert.deepEqual(
      ours('consumedBy').map((e) => e.event),
      ['TireDelivered'],
    )
  })

  it('emits the outbound event with exactly the fields the contract lists', async () => {
    const [outbound] = ours('emittedBy')
    const messaging = await cds.connect.to('messaging')
    const received: Record<string, unknown>[] = []
    messaging.on(outbound.event, (msg) => {
      received.push(msg.data as Record<string, unknown>)
    })

    await POST('/booking/Bookings', { tireSpec: '205/55 R16 winter', garageId: 'GAR-09' })

    assert.equal(received.length, 1, `expected exactly one ${outbound.event}`)
    const keys = Object.keys(received[0])
    assert.equal(keys.length, outbound.fields.length)
    assert.deepEqual(
      new Set(keys),
      new Set(outbound.fields),
      `${outbound.event} payload drifted from specs/README.md`,
    )
  })

  it('reacts to the inbound event as the contract defines it', async () => {
    const [inbound] = ours('consumedBy')
    const messaging = await cds.connect.to('messaging')
    const { data } = await POST('/booking/Bookings', {
      tireSpec: '205/55 R16 winter',
      garageId: 'GAR-09',
    })

    const payload = Object.fromEntries(
      inbound.fields.map((field) => [field, field === 'bookingId' ? data.ID : 'GAR-09']),
    )
    await messaging.emit(inbound.event, payload)

    const one = await GET(`/booking/Bookings(${data.ID})`)
    assert.equal(
      one.data.status,
      'ReadyForSwap',
      `${inbound.event} with ${JSON.stringify(payload)} did not move the booking`,
    )
  })

  it('uses the status values from specs/booking.md', () => {
    const spec = readFileSync('specs/booking.md', 'utf8')
    for (const status of ['Created', 'ReadyForSwap', 'Done']) {
      assert.ok(spec.includes(status), `${status} is not in specs/booking.md any more`)
    }
  })
})
