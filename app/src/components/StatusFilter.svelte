<script lang="ts">
  import type { BookingStatus } from '../api/types'
  import { STATUSES, statusLabel } from '../lib/status'

  let {
    selected = $bindable(),
    counts,
  }: { selected: BookingStatus[]; counts: Record<BookingStatus, number> } = $props()

  function toggle(status: BookingStatus) {
    selected = selected.includes(status)
      ? selected.filter((s) => s !== status)
      : [...selected, status]
  }
</script>

<div class="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
  {#each STATUSES as status (status)}
    <button
      type="button"
      aria-pressed={selected.includes(status)}
      onclick={() => toggle(status)}
      class="rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none
        {selected.includes(status)
        ? 'border-sky-600 bg-sky-700 text-white'
        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}"
    >
      {statusLabel(status)}
      <span
        class="ml-1 {selected.includes(status)
          ? 'text-sky-100'
          : 'text-slate-600 dark:text-slate-400'}"
      >
        {counts[status]}
      </span>
    </button>
  {/each}
</div>
