<script lang="ts">
  import type { Booking } from '../api/types'
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
          ? 'bg-emerald-700 text-white hover:bg-emerald-600 focus-visible:ring-emerald-400'
          : 'border border-slate-300 text-slate-700 hover:border-slate-400 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-200'}"
      >
        {running === action ? 'Working...' : ACTION_LABELS[action]}
      </button>
    {/each}
  </div>
{/if}
