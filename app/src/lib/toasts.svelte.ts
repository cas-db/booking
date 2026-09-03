export type ToastKind = 'success' | 'error'
export type Toast = { id: number; kind: ToastKind; message: string }

/** A tiny toast queue, announced through an aria-live region in App.svelte. */
export function createToasts() {
  let toasts = $state<Toast[]>([])
  let next = 0

  function push(kind: ToastKind, message: string, ttl = 4000): void {
    const id = next++
    toasts = [...toasts, { id, kind, message }]
    setTimeout(() => dismiss(id), ttl)
  }

  function dismiss(id: number): void {
    toasts = toasts.filter((toast) => toast.id !== id)
  }

  return {
    get all() {
      return toasts
    },
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    dismiss,
  }
}

export type Toasts = ReturnType<typeof createToasts>
