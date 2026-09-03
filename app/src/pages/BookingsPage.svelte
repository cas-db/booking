<script lang="ts">
  import BookingCard from '../components/BookingCard.svelte'
  import StatusFilter from '../components/StatusFilter.svelte'
  import ConnectionDot from '../components/ConnectionDot.svelte'
  import BookingForm from '../components/BookingForm.svelte'
  import { createBookingsStore } from '../lib/bookings.svelte'
  import { ACTION_LABELS, countByStatus, filterBookings, type BookingAction } from '../lib/status'
  import type { Booking } from '../api/types'
  import { filters } from '../lib/filters.svelte'
  import type { Toasts } from '../lib/toasts.svelte'

  let { toasts }: { toasts: Toasts } = $props()

  const store = createBookingsStore()

  let dialog = $state<HTMLDialogElement | null>(null)
  let trigger = $state<HTMLButtonElement | null>(null)
  let open = $state(false)

  function openDialog(): void {
    open = true
  }

  /** Escape and the close button land here, so focus always returns to the opener. */
  function closeDialog(): void {
    open = false
    trigger?.focus()
  }

  async function created(booking: Booking): Promise<void> {
    closeDialog()
    toasts.success(`Booking for ${booking.tireSpec} created`)
    await store.refresh()
  }

  async function runAction(booking: Booking, action: BookingAction): Promise<string | null> {
    const result = await store.act(booking, action)
    if (result.ok) {
      toasts.success(`${ACTION_LABELS[action]}: ${booking.tireSpec}`)
      return null
    }
    toasts.error(result.message)
    return result.message
  }

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })

  const counts = $derived(countByStatus(store.bookings))
  const visible = $derived(filterBookings(store.bookings, filters.selected, filters.needle))

  $effect(() => store.start())
</script>

<section aria-labelledby="bookings-heading">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 id="bookings-heading" class="text-lg font-semibold">Bookings</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        Created &rarr; Ready for swap &rarr; Done, Cancelled leaves the chain
      </p>
    </div>
    <ConnectionDot connected={store.connected} />
  </div>

  <div class="mb-6 flex justify-end">
    <button
      type="button"
      bind:this={trigger}
      onclick={openDialog}
      class="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
    >
      New booking
    </button>
  </div>

  <div class="mb-6 flex flex-wrap items-center gap-3">
    <StatusFilter bind:selected={filters.selected} {counts} />
    <label class="ml-auto">
      <span class="sr-only">Filter by tire spec, garage or customer</span>
      <input
        type="search"
        bind:value={filters.needle}
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
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400"
    >
      No bookings yet.
    </p>
  {:else if visible.length === 0}
    <p
      data-testid="no-matches"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400"
    >
      No booking matches the filter.
    </p>
  {:else}
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each visible as booking (booking.ID)}
        <li><BookingCard {booking} onaction={runAction} /></li>
      {/each}
    </ul>
  {/if}

  <dialog
    bind:this={dialog}
    aria-labelledby="new-booking-title"
    onclose={closeDialog}
    class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 backdrop:bg-slate-900/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
  >
    <h3 id="new-booking-title" class="mb-4 text-lg font-semibold">New booking</h3>
    {#if open}
      <BookingForm onclose={closeDialog} oncreated={created} />
    {/if}
  </dialog>
</section>
