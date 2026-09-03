import type { Booking, Customer } from './types'

const BASE = '/booking'

/** An error answer of the OData service, with the message the service sent. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ODataError = { error?: { message?: string } }
type ODataList<T> = { value: T[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'the booking service is not reachable')
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ODataError
    return body.error?.message ?? `request failed with ${response.status}`
  } catch {
    return `request failed with ${response.status}`
  }
}

export async function listBookings(): Promise<Booking[]> {
  const body = await request<ODataList<Booking>>('/Bookings?$expand=customer')
  return body.value
}

export async function getBooking(id: string): Promise<Booking> {
  return request<Booking>(`/Bookings(${id})?$expand=customer`)
}

export async function listCustomers(): Promise<Customer[]> {
  const body = await request<ODataList<Customer>>('/Customers')
  return body.value
}
