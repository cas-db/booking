<script lang="ts">
  import type { BookingStatus } from '../api/types'
  import { timelineSteps } from '../lib/status'
  import { absoluteTime } from '../lib/time'

  let {
    status,
    createdAt,
    modifiedAt,
  }: {
    status: BookingStatus
    createdAt?: string | null
    modifiedAt?: string | null
  } = $props()

  const steps = $derived(timelineSteps(status))
  const lastDone = $derived(steps.filter((step) => step.state === 'done').length - 1)

  /** Only the booking and the latest status change have a timestamp in the model. */
  function stampOf(index: number): string | null {
    if (index === 0) return createdAt ?? null
    if (index === lastDone && status !== 'Created') return modifiedAt ?? null
    return null
  }

  const DOT: Record<string, string> = {
    done: 'bg-emerald-700 text-white',
    current: 'bg-sky-700 text-white ring-4 ring-sky-200 dark:ring-sky-900',
    ahead: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    skipped: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
</script>

<ol
  data-testid="timeline"
  class="relative flex flex-col gap-6 border-l border-slate-200 pl-6 dark:border-slate-800"
>
  {#each steps as step (step.key)}
    <li data-testid="timeline-step" data-step={step.key} data-state={step.state} class="relative">
      <span
        aria-hidden="true"
        class="absolute -left-[2.1rem] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold {DOT[
          step.state
        ]}"
      >
        {step.state === 'done' ? '✓' : step.state === 'skipped' ? '·' : ''}
      </span>
      <p
        class="text-sm font-semibold {step.state === 'ahead' || step.state === 'skipped'
          ? 'text-slate-500 dark:text-slate-400'
          : ''}"
      >
        {step.label}
        <span class="sr-only">({step.state})</span>
      </p>
      <p class="text-xs text-slate-600 dark:text-slate-400">{step.hint}</p>
      {#if stampOf(steps.indexOf(step))}
        <p
          data-testid="timeline-time"
          class="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-400"
        >
          {absoluteTime(stampOf(steps.indexOf(step)))}
        </p>
      {/if}
    </li>
  {/each}

  {#if status === 'Cancelled'}
    <li data-testid="timeline-step" data-step="cancelled" data-state="done" class="relative">
      <span
        aria-hidden="true"
        class="absolute -left-[2.1rem] flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-white"
      >
        ✕
      </span>
      <p class="text-sm font-semibold">Cancelled</p>
      <p class="text-xs text-slate-600 dark:text-slate-400">
        the side branch, BookingCancelled left the service
      </p>
      <p
        data-testid="timeline-time"
        class="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-400"
      >
        {absoluteTime(modifiedAt)}
      </p>
    </li>
  {/if}
</ol>
