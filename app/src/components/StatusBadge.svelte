<script lang="ts">
  import type { BookingStatus } from '../api/types'
  import { STATUS_CLASSES, statusLabel } from '../lib/status'

  let { status }: { status: BookingStatus } = $props()
</script>

<span
  data-testid="status-badge"
  data-status={status}
  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset {STATUS_CLASSES[
    status
  ]}"
>
  {statusLabel(status)}
</span>
