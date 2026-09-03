import { cancelBooking, confirmSwap, listBookings } from '../api/booking'
import type { Booking } from '../api/types'
import { ACTION_RESULT, type BookingAction } from './status'

const POLL_MS = 3000

/**
 * The list of bookings plus the polling loop. The service has no push channel, so a
 * status change caused by another service only shows up through polling.
 */
export function createBookingsStore() {
  let bookings = $state<Booking[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let connected = $state(true)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function refresh(): Promise<void> {
    try {
      bookings = await listBookings()
      connected = true
      error = null
    } catch (e) {
      connected = false
      // Keep the last known list on a failed poll, only a failed first load is fatal.
      if (loading || bookings.length === 0) {
        error = e instanceof Error ? e.message : 'unknown error'
      }
    } finally {
      loading = false
    }
  }

  function schedule(): void {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      if (!document.hidden) await refresh()
      schedule()
    }, POLL_MS)
  }

  function start(): () => void {
    void refresh().then(schedule)
    const onVisible = () => {
      if (!document.hidden) void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }

  function replace(booking: Booking): void {
    bookings = bookings.map((row) => (row.ID === booking.ID ? { ...row, ...booking } : row))
  }

  /**
   * Runs a bound action optimistically: the card flips right away and rolls back to the
   * status the server still has when the request fails.
   */
  async function act(
    booking: Booking,
    action: BookingAction,
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const previous = booking.status
    replace({ ...booking, status: ACTION_RESULT[action] })
    try {
      const updated =
        action === 'confirmSwap' ? await confirmSwap(booking.ID) : await cancelBooking(booking.ID)
      replace({ ...booking, ...updated })
      return { ok: true }
    } catch (e) {
      replace({ ...booking, status: previous })
      return { ok: false, message: e instanceof Error ? e.message : 'the action failed' }
    }
  }

  return {
    get bookings() {
      return bookings
    },
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    get connected() {
      return connected
    },
    start,
    refresh,
    act,
  }
}

export type BookingsStore = ReturnType<typeof createBookingsStore>
