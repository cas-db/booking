export const BOOKING_STATUS = ['Created', 'ReadyForSwap', 'Done'] as const

export type BookingStatus = (typeof BOOKING_STATUS)[number]

/** For every target status, the statuses a booking is allowed to come from. */
const ALLOWED_FROM: Record<BookingStatus, readonly BookingStatus[]> = {
  Created: [],
  ReadyForSwap: ['Created'],
  Done: ['ReadyForSwap'],
}

export function canTransition(from: string | null | undefined, to: BookingStatus): boolean {
  return ALLOWED_FROM[to].includes(from as BookingStatus)
}
