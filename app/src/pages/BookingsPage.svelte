<script lang="ts">
  import { listBookings } from '../api/booking'
  import type { Booking } from '../api/types'

  let bookings = $state<Booking[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)

  async function load() {
    loading = true
    error = null
    try {
      bookings = await listBookings()
    } catch (e) {
      error = e instanceof Error ? e.message : 'unknown error'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    void load()
  })
</script>

<section aria-labelledby="bookings-heading">
  <h2 id="bookings-heading" class="mb-4 text-lg font-semibold">Bookings</h2>

  {#if loading}
    <ul class="space-y-3" aria-label="loading bookings">
      {#each { length: 3 } as _, i (i)}
        <li class="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"></li>
      {/each}
    </ul>
  {:else if error}
    <p
      role="alert"
      class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      {error}
    </p>
  {:else if bookings.length === 0}
    <p
      class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400"
    >
      No bookings yet.
    </p>
  {:else}
    <ul class="space-y-3">
      {#each bookings as booking (booking.ID)}
        <li
          class="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <p class="font-medium">{booking.tireSpec}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {booking.customer?.name ?? 'no customer'} · {booking.garageId} · {booking.ID.slice(
                0,
                8,
              )}
            </p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium dark:bg-slate-800">
            {booking.status}
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
