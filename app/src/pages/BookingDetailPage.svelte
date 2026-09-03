<script lang="ts">
  import { ApiError, cancelBooking, confirmSwap, getBooking } from '../api/booking'
  import type { Booking } from '../api/types'
  import BookingActions from '../components/BookingActions.svelte'
  import ChainTimeline from '../components/ChainTimeline.svelte'
  import StatusBadge from '../components/StatusBadge.svelte'
  import { ACTION_LABELS, ACTION_RESULT, type BookingAction } from '../lib/status'
  import type { Toasts } from '../lib/toasts.svelte'

  let { id, toasts }: { id: string; toasts: Toasts } = $props()

  let booking = $state<Booking | null>(null)
  let loading = $state(true)
  let missing = $state(false)
  let error = $state<string | null>(null)

  $effect(() => {
    const bookingId = id
    loading = true
    missing = false
    error = null
    getBooking(bookingId)
      .then((row) => (booking = row))
      .catch((e: unknown) => {
        booking = null
        if (e instanceof ApiError && e.status === 404) missing = true
        else error = e instanceof Error ? e.message : 'the booking could not be loaded'
      })
      .finally(() => (loading = false))
  })

  async function runAction(row: Booking, action: BookingAction): Promise<string | null> {
    const previous = row.status
    booking = { ...row, status: ACTION_RESULT[action] }
    try {
      const updated =
        action === 'confirmSwap' ? await confirmSwap(row.ID) : await cancelBooking(row.ID)
      booking = { ...row, ...updated }
      toasts.success(`${ACTION_LABELS[action]}: ${row.tireSpec}`)
      return null
    } catch (e) {
      booking = { ...row, status: previous }
      const message = e instanceof Error ? e.message : 'the action failed'
      toasts.error(message)
      return message
    }
  }
</script>

<a
  href="#/"
  class="mb-6 inline-flex items-center gap-1 rounded text-sm font-medium text-sky-700 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-300"
>
  &larr; All bookings
</a>

{#if loading}
  <div class="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
{:else if missing}
  <p
    data-testid="not-found"
    class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400"
  >
    No booking with this ID.
  </p>
{:else if error}
  <p
    role="alert"
    class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
  >
    {error}
  </p>
{:else if booking}
  <article
    data-testid="booking-detail"
    data-id={booking.ID}
    data-status={booking.status}
    class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
  >
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">{booking.tireSpec}</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {booking.customer?.name ?? 'no customer'}
        </p>
      </div>
      <StatusBadge status={booking.status} />
    </div>

    <dl class="mb-8 grid gap-4 sm:grid-cols-3">
      <div>
        <dt class="text-sm text-slate-600 dark:text-slate-400">Garage</dt>
        <dd class="font-medium">{booking.garageId}</dd>
      </div>
      <div>
        <dt class="text-sm text-slate-600 dark:text-slate-400">Customer</dt>
        <dd class="font-medium">{booking.customer?.name ?? 'no customer'}</dd>
      </div>
      <div class="sm:col-span-3">
        <dt class="text-sm text-slate-600 dark:text-slate-400">Booking ID</dt>
        <dd data-testid="booking-id" class="font-mono text-sm break-all">{booking.ID}</dd>
      </div>
    </dl>

    <h3 class="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">Chain</h3>
    <ChainTimeline status={booking.status} />

    <div class="mt-8 flex flex-col gap-3">
      <BookingActions {booking} onaction={runAction} />
    </div>
  </article>
{/if}
