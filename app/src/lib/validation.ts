/** The same rules the service enforces in srv/booking-service.ts, mirrored for fast feedback. */
export const TIRE_SPEC = /^\d{3}\/\d{2} R\d{2} (winter|summer|allseason)$/
export const GARAGE_ID = /^GAR-\d{2}$/

export const TIRE_SPEC_PRESETS = [
  '205/55 R16 winter',
  '195/65 R15 summer',
  '225/45 R17 allseason',
  '235/60 R18 winter',
]

export function tireSpecError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'a tire spec is required'
  if (!TIRE_SPEC.test(trimmed)) {
    return 'must look like "205/55 R16 winter" (winter, summer or allseason)'
  }
  return null
}

export function garageIdError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'a garage is required'
  if (!GARAGE_ID.test(trimmed)) return 'must look like "GAR-01"'
  return null
}
