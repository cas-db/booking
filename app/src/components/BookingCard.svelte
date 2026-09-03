<script lang="ts">
  import type { Booking } from '../api/types'
  import StatusBadge from './StatusBadge.svelte'
  import BookingActions from './BookingActions.svelte'
  import type { BookingAction } from '../lib/status'
  import { bookingHref } from '../lib/router.svelte'

  let {
    booking,
    onaction,
  }: {
    booking: Booking
    onaction: (booking: Booking, action: BookingAction) => Promise<string | null>
  } = $props()
</script>

<article
  data-testid="booking-card"
  data-id={booking.ID}
  data-status={booking.status}
  class="flex h-full flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
>
  <div class="flex items-start justify-between gap-3">
    <div>
      <h3 class="text-base font-semibold">
        <a
          href={bookingHref(booking.ID)}
          class="rounded hover:text-sky-700 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:hover:text-sky-300"
        >
          {booking.tireSpec}
        </a>
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        {booking.customer?.name ?? 'no customer'}
      </p>
    </div>
    <StatusBadge status={booking.status} />
  </div>

  <dl class="grid grid-cols-2 gap-2 text-sm">
    <div>
      <dt class="text-slate-600 dark:text-slate-400">Garage</dt>
      <dd class="font-medium">{booking.garageId}</dd>
    </div>
    <div>
      <dt class="text-slate-600 dark:text-slate-400">Booking</dt>
      <dd class="font-mono text-xs">{booking.ID.slice(0, 8)}</dd>
    </div>
  </dl>

  <BookingActions {booking} {onaction} />
</article>
