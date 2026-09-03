/** Turns a CAP timestamp into "just now", "3 min ago", "2 h ago" or a plain date. */
export function relativeTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return 'unknown'
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return 'unknown'

  const seconds = Math.round((now.getTime() - then.getTime()) / 1000)
  if (seconds < 0) return 'just now'
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d ago`
  return then.toISOString().slice(0, 10)
}

/** The absolute value for a title attribute, seconds are enough for a workshop demo. */
export function absoluteTime(iso: string | null | undefined): string {
  if (!iso) return 'unknown'
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return 'unknown'
  return value.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}
