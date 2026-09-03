import { appendFileSync, openSync, closeSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const MSG_BOX = process.env.MSG_BOX ?? join(homedir(), '.cds-msg-box')
const LOCK = `${MSG_BOX}.lock`

/**
 * Appends an event to the file based message box the running service reads from,
 * exactly like another service of the chain would. CAP rewrites the box while it
 * consumes it, so take its lock file first or an appended line can be dropped.
 */
export function emit(event: string, data: Record<string, unknown>): void {
  withLock(() => {
    appendFileSync(MSG_BOX, `\n${event} ${JSON.stringify({ data, headers: {} })}`)
  })
}

export function emitTireDelivered(bookingId: string, garageId = 'GAR-01'): void {
  emit('TireDelivered', { bookingId, garageId })
}

function withLock(fn: () => void): void {
  for (let tries = 0; tries < 25; tries++) {
    let fd: number
    try {
      fd = openSync(LOCK, 'wx')
    } catch {
      sleepSync(200)
      continue
    }
    try {
      fn()
    } finally {
      closeSync(fd)
      unlinkSync(LOCK)
    }
    return
  }
  throw new Error(`could not lock ${MSG_BOX}`)
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}
