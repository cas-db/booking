<script lang="ts">
  import BookingsPage from './pages/BookingsPage.svelte'
  import BookingDetailPage from './pages/BookingDetailPage.svelte'
  import Toast from './components/Toast.svelte'
  import { createToasts } from './lib/toasts.svelte'
  import { createRouter } from './lib/router.svelte'

  const toasts = createToasts()
  const router = createRouter()
</script>

<div class="min-h-screen">
  <header
    class="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
  >
    <div class="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
      <span class="text-2xl" aria-hidden="true">🛞</span>
      <div>
        <h1 class="text-xl font-semibold tracking-tight">
          <a
            href="#/"
            class="rounded focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          >
            Tire swap bookings
          </a>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">booking service on /booking</p>
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-5xl px-6 py-8">
    {#if router.current.name === 'detail'}
      <BookingDetailPage id={router.current.id} {toasts} />
    {:else if router.current.name === 'unknown'}
      <p
        data-testid="not-found"
        class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400"
      >
        This page does not exist. <a href="#/" class="text-sky-700 underline dark:text-sky-300"
          >Back to the bookings</a
        >.
      </p>
    {:else}
      <BookingsPage {toasts} />
    {/if}
  </main>

  <Toast {toasts} />
</div>
