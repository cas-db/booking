<script lang="ts">
  import BookingsPage from './pages/BookingsPage.svelte'
</script>

<div class="min-h-screen">
  <header
    class="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
  >
    <div class="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
      <span class="text-2xl" aria-hidden="true">🛞</span>
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Tire swap bookings</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">booking service on /booking</p>
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-5xl px-6 py-8">
    <BookingsPage />
  </main>
</div>
