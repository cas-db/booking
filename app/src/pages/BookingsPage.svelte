<script lang="ts">
  import BookingCard from '../components/BookingCard.svelte'
  import StatusFilter from '../components/StatusFilter.svelte'
  import ConnectionDot from '../components/ConnectionDot.svelte'
  import { createBookingsStore } from '../lib/bookings.svelte'
  import { countByStatus, filterBookings } from '../lib/status'
  import type { BookingStatus } from '../api/types'

  const store = createBookingsStore()

  let selected = $state<BookingStatus[]>([])
  let needle = $state('')

  const counts = $derived(countByStatus(store.bookings))
  const visible = $derived(filterBookings(store.bookings, selected, needle))

  $effect(() => store.start())
</script>

<section aria-labelledby="bookings-heading">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 id="bookings-heading" class="text-lg font-semibold">Bookings</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Created &rarr; Ready for swap &rarr; Done, Cancelled leaves the chain
      </p>
    </div>
    <ConnectionDot connected={store.connected} />
  </div>

  <div class="mb-6 flex flex-wrap items-center gap-3">
    <StatusFilter bind:selected {counts} />
    <label class="ml-auto">
      <span class="sr-only">Filter by tire spec, garage or customer</span>
      <input
        type="search"
        bind:value={needle}
        placeholder="Filter by tire spec or garage"
        class="w-64 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900"
      />
    </label>
  </div>

  {#if store.loading}
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="loading bookings">
      {#each { length: 3 } as _, i (i)}
        <li class="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></li>
      {/each}
    </ul>
  {:else if store.error}
    <p
      role="alert"
      class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      {store.error}
    </p>
  {:else if store.bookings.length === 0}
    <p
      data-testid="empty-state"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400"
    >
      No bookings yet.
    </p>
  {:else if visible.length === 0}
    <p
      data-testid="no-matches"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400"
    >
      No booking matches the filter.
    </p>
  {:else}
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each visible as booking (booking.ID)}
        <li><BookingCard {booking} /></li>
      {/each}
    </ul>
  {/if}
</section>
