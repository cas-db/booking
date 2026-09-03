<script lang="ts">
  import type { Booking } from '../api/types'
  import StatusBadge from './StatusBadge.svelte'
  import { ACTION_LABELS, allowedActions, type BookingAction } from '../lib/status'

  let {
    booking,
    onaction,
  }: {
    booking: Booking
    onaction: (booking: Booking, action: BookingAction) => Promise<string | null>
  } = $props()

  let running = $state<BookingAction | null>(null)
  let error = $state<string | null>(null)

  const actions = $derived(allowedActions(booking.status))

  async function run(action: BookingAction) {
    if (running) return
    running = action
    error = null
    error = await onaction(booking, action)
    running = null
  }
</script>

<article
  data-testid="booking-card"
  data-id={booking.ID}
  data-status={booking.status}
  class="flex h-full flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
>
  <div class="flex items-start justify-between gap-3">
    <div>
      <h3 class="text-base font-semibold">{booking.tireSpec}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {booking.customer?.name ?? 'no customer'}
      </p>
    </div>
    <StatusBadge status={booking.status} />
  </div>

  <dl class="grid grid-cols-2 gap-2 text-sm">
    <div>
      <dt class="text-slate-500 dark:text-slate-400">Garage</dt>
      <dd class="font-medium">{booking.garageId}</dd>
    </div>
    <div>
      <dt class="text-slate-500 dark:text-slate-400">Booking</dt>
      <dd class="font-mono text-xs">{booking.ID.slice(0, 8)}</dd>
    </div>
  </dl>

  {#if error}
    <p
      role="alert"
      data-testid="card-error"
      class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      {error}
    </p>
  {/if}

  {#if actions.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each actions as action (action)}
        <button
          type="button"
          disabled={running !== null}
          onclick={() => run(action)}
          data-testid="action-{action}"
          class="rounded-lg px-3 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50
            {action === 'confirmSwap'
            ? 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400'
            : 'border border-slate-300 text-slate-700 hover:border-slate-400 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-200'}"
        >
          {running === action ? 'Working...' : ACTION_LABELS[action]}
        </button>
      {/each}
    </div>
  {/if}
</article>
