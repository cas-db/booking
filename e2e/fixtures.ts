import { expect, type APIRequestContext } from '@playwright/test'
import { emitTireDelivered } from './emit'

export const SERVICE = 'http://localhost:4004/booking'

export type SeedBooking = {
  ID: string
  tireSpec: string
  garageId: string
  status: string
}

export async function firstCustomer(
  request: APIRequestContext,
): Promise<{ ID: string; name: string }> {
  const response = await request.get(`${SERVICE}/Customers`)
  expect(response.ok()).toBeTruthy()
  const body = (await response.json()) as { value: { ID: string; name: string }[] }
  expect(body.value.length).toBeGreaterThan(0)
  return body.value[0]
}

/** Creates a booking over the API so a spec does not depend on the UI to get data. */
export async function createBooking(
  request: APIRequestContext,
  data: { tireSpec?: string; garageId?: string; customer_ID?: string } = {},
): Promise<SeedBooking> {
  const response = await request.post(`${SERVICE}/Bookings`, {
    data: {
      tireSpec: data.tireSpec ?? '205/55 R16 winter',
      garageId: data.garageId ?? 'GAR-01',
      ...(data.customer_ID ? { customer_ID: data.customer_ID } : {}),
    },
  })
  expect(response.status(), await response.text()).toBe(201)
  return (await response.json()) as SeedBooking
}

export async function readBooking(
  request: APIRequestContext,
  id: string,
): Promise<SeedBooking | null> {
  const response = await request.get(`${SERVICE}/Bookings(${id})`)
  if (!response.ok()) return null
  return (await response.json()) as SeedBooking
}

/**
 * Emits TireDelivered and waits until the service has consumed it. The message box
 * is polled, so this can take a moment.
 */
export async function deliverTire(
  request: APIRequestContext,
  booking: SeedBooking,
  timeoutMs = 20_000,
): Promise<void> {
  emitTireDelivered(booking.ID, booking.garageId)
  await expect
    .poll(async () => (await readBooking(request, booking.ID))?.status, {
      timeout: timeoutMs,
      intervals: [250],
    })
    .toBe('ReadyForSwap')
}
