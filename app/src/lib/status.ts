import type { Booking, BookingStatus } from '../api/types'

export const STATUSES: BookingStatus[] = ['Created', 'ReadyForSwap', 'Done', 'Cancelled']

export const STATUS_LABELS: Record<BookingStatus, string> = {
  Created: 'Created',
  ReadyForSwap: 'Ready for swap',
  Done: 'Done',
  Cancelled: 'Cancelled',
}

/** Tailwind classes per status, kept next to the status logic so both stay in sync. */
export const STATUS_CLASSES: Record<BookingStatus, string> = {
  Created: 'bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-950 dark:text-sky-200',
  ReadyForSwap: 'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-200',
  Done: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200',
  Cancelled: 'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300',
}

export function statusLabel(status: BookingStatus): string {
  return STATUS_LABELS[status] ?? status
}

/** Matches a booking against a free text needle over tireSpec, garageId and the customer. */
export function matchesText(booking: Booking, needle: string): boolean {
  const text = needle.trim().toLowerCase()
  if (!text) return true
  return [booking.tireSpec, booking.garageId, booking.customer?.name ?? '', booking.ID]
    .join(' ')
    .toLowerCase()
    .includes(text)
}

/** Status chips and the free text filter combine with AND, no selected chip means all. */
export function filterBookings(
  bookings: Booking[],
  selected: BookingStatus[],
  needle: string,
): Booking[] {
  return bookings.filter(
    (booking) =>
      (selected.length === 0 || selected.includes(booking.status)) && matchesText(booking, needle),
  )
}

export function countByStatus(bookings: Booking[]): Record<BookingStatus, number> {
  const counts: Record<BookingStatus, number> = {
    Created: 0,
    ReadyForSwap: 0,
    Done: 0,
    Cancelled: 0,
  }
  for (const booking of bookings) {
    if (booking.status in counts) counts[booking.status]++
  }
  return counts
}

export type BookingAction = 'confirmSwap' | 'cancel'

export const ACTION_LABELS: Record<BookingAction, string> = {
  confirmSwap: 'Confirm swap',
  cancel: 'Cancel',
}

/** The status a successful action leaves the booking in, used for the optimistic update. */
export const ACTION_RESULT: Record<BookingAction, BookingStatus> = {
  confirmSwap: 'Done',
  cancel: 'Cancelled',
}

/** Mirrors the transitions srv/booking-status.ts allows, the server stays the authority. */
export function allowedActions(status: BookingStatus): BookingAction[] {
  if (status === 'ReadyForSwap') return ['confirmSwap']
  if (status === 'Created') return ['cancel']
  return []
}

export type TimelineState = 'done' | 'current' | 'ahead' | 'skipped'
export type TimelineStep = { key: string; label: string; hint: string; state: TimelineState }

/**
 * The chain as the spec describes it: booked, tire delivered, swapped. Cancelled is a side
 * branch, so a cancelled booking never reaches the later steps.
 */
export function timelineSteps(status: BookingStatus): TimelineStep[] {
  const completed: Record<BookingStatus, number> = {
    Created: 1,
    ReadyForSwap: 2,
    Done: 3,
    Cancelled: 1,
  }
  const done = completed[status]
  const cancelled = status === 'Cancelled'

  const steps = [
    { key: 'booked', label: 'Booked', hint: 'BookingCreated left the service' },
    { key: 'delivered', label: 'Tire delivered', hint: 'TireDelivered arrived from the chain' },
    { key: 'swapped', label: 'Swapped', hint: 'BookingDone left the service' },
  ]

  return steps.map((step, index) => ({
    ...step,
    state:
      index < done
        ? 'done'
        : cancelled
          ? 'skipped'
          : index === done
            ? 'current'
            : ('ahead' as const),
  })) as TimelineStep[]
}
