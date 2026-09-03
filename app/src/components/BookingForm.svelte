<script lang="ts">
  import { createBooking, listCustomers } from '../api/booking'
  import type { Booking, Customer } from '../api/types'
  import { garageIdError, tireSpecError, TIRE_SPEC_PRESETS } from '../lib/validation'

  let { onclose, oncreated }: { onclose: () => void; oncreated: (booking: Booking) => void } =
    $props()

  let customers = $state<Customer[]>([])
  let customerId = $state('')
  let tireSpec = $state('')
  let garageId = $state('GAR-01')
  let submitting = $state(false)
  let serverError = $state<string | null>(null)
  let touched = $state({ tireSpec: false, garageId: false })

  const tireSpecProblem = $derived(tireSpecError(tireSpec))
  const garageIdProblem = $derived(garageIdError(garageId))
  const invalid = $derived(!!tireSpecProblem || !!garageIdProblem)

  $effect(() => {
    listCustomers()
      .then((rows) => (customers = rows))
      .catch(() => (customers = []))
  })

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    touched = { tireSpec: true, garageId: true }
    if (invalid || submitting) return

    submitting = true
    serverError = null
    try {
      const booking = await createBooking({
        tireSpec: tireSpec.trim(),
        garageId: garageId.trim(),
        ...(customerId ? { customer_ID: customerId } : {}),
      })
      oncreated(booking)
    } catch (e) {
      serverError = e instanceof Error ? e.message : 'the booking could not be created'
    } finally {
      submitting = false
    }
  }
</script>

<form
  onsubmit={submit}
  novalidate
  class="flex flex-col gap-4"
  aria-describedby={serverError ? 'form-error' : undefined}
>
  {#if serverError}
    <p
      id="form-error"
      role="alert"
      data-testid="form-error"
      class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      {serverError}
    </p>
  {/if}

  <label class="flex flex-col gap-1 text-sm">
    <span class="font-medium">Customer</span>
    <!-- svelte-ignore a11y_autofocus -->
    <select
      autofocus
      bind:value={customerId}
      class="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
    >
      <option value="">no customer</option>
      {#each customers as customer (customer.ID)}
        <option value={customer.ID}>{customer.name}</option>
      {/each}
    </select>
  </label>

  <label class="flex flex-col gap-1 text-sm">
    <span class="font-medium">Tire spec</span>
    <input
      bind:value={tireSpec}
      onblur={() => (touched = { ...touched, tireSpec: true })}
      list="tire-spec-presets"
      placeholder="205/55 R16 winter"
      aria-invalid={touched.tireSpec && !!tireSpecProblem}
      aria-describedby={touched.tireSpec && tireSpecProblem ? 'tire-spec-error' : undefined}
      class="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
    />
    <datalist id="tire-spec-presets">
      {#each TIRE_SPEC_PRESETS as preset (preset)}
        <option value={preset}></option>
      {/each}
    </datalist>
    {#if touched.tireSpec && tireSpecProblem}
      <span id="tire-spec-error" data-testid="tire-spec-error" class="text-sm text-red-700">
        {tireSpecProblem}
      </span>
    {/if}
  </label>

  <label class="flex flex-col gap-1 text-sm">
    <span class="font-medium">Garage</span>
    <input
      bind:value={garageId}
      onblur={() => (touched = { ...touched, garageId: true })}
      placeholder="GAR-01"
      aria-invalid={touched.garageId && !!garageIdProblem}
      aria-describedby={touched.garageId && garageIdProblem ? 'garage-error' : undefined}
      class="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
    />
    {#if touched.garageId && garageIdProblem}
      <span id="garage-error" data-testid="garage-error" class="text-sm text-red-700">
        {garageIdProblem}
      </span>
    {/if}
  </label>

  <div class="mt-2 flex justify-end gap-2">
    <button
      type="button"
      onclick={onclose}
      class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={invalid || submitting}
      class="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {submitting ? 'Booking...' : 'Book swap'}
    </button>
  </div>
</form>
