<script lang="ts">
  import type { Toasts } from '../lib/toasts.svelte'

  let { toasts }: { toasts: Toasts } = $props()
</script>

<div
  aria-live="polite"
  aria-atomic="false"
  class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2"
>
  {#each toasts.all as toast (toast.id)}
    <div
      data-testid="toast"
      data-kind={toast.kind}
      class="pointer-events-auto rounded-lg px-4 py-2 text-sm font-medium shadow-lg ring-1 {toast.kind ===
      'success'
        ? 'bg-emerald-600 text-white ring-emerald-700'
        : 'bg-red-600 text-white ring-red-700'}"
    >
      {toast.message}
    </div>
  {/each}
</div>
