import { test, expect } from '@playwright/test'
import { createBooking, deliverTire, firstCustomer } from './fixtures'

test('shows the booking list', async ({ page, request }) => {
  const customer = await firstCustomer(request)
  const booking = await createBooking(request, { customer_ID: customer.ID })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Tire swap bookings' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: booking.ID.slice(0, 8) })).toBeVisible()
})

test('an emitted TireDelivered reaches the service', async ({ request }) => {
  const booking = await createBooking(request)

  await deliverTire(request, booking)
})
