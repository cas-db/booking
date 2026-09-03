import type { BookingStatus } from '../api/types'

/**
 * The overview filters live outside the page component so a trip to a detail page and back
 * keeps them, exactly like the browser back button suggests.
 */
export const filters = $state<{ selected: BookingStatus[]; needle: string }>({
  selected: [],
  needle: '',
})
