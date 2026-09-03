<script lang="ts">
  let { connected }: { connected: boolean } = $props()
</script>

<span
  data-testid="connection"
  data-connected={connected}
  class="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
>
  <span
    aria-hidden="true"
    class="size-2.5 rounded-full {connected ? 'bg-emerald-500' : 'bg-red-500'}"
  ></span>
  {connected ? 'connected' : 'offline'}
</span>
