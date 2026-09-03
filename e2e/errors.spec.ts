import { test, expect } from '@playwright/test'
import { createBooking, SERVICE } from './fixtures'

test('a rejected transition shows the server message and rolls the card back', async ({
  page,
  request,
}) => {
  const booking = await createBooking(request, { garageId: 'GAR-23' })

  await page.goto('/')
  const card = page.locator(`[data-testid="booking-card"][data-id="${booking.ID}"]`)
  await expect(card).toBeVisible()

  // Cancel behind the UI's back, the card is now stale and its action is a 409.
  const cancelled = await request.post(`${SERVICE}/Bookings(${booking.ID})/BookingService.cancel`, {
    data: {},
  })
  expect(cancelled.ok()).toBeTruthy()

  await card.getByTestId('action-cancel').click()

  await expect(card.getByTestId('card-error')).toContainText('cannot be cancelled')
  await expect(page.getByTestId('toast')).toContainText('cannot be cancelled')
  await expect(card).toHaveAttribute('data-status', 'Cancelled', { timeout: 10_000 })
})

test('an unreachable service renders the error state', async ({ page }) => {
  await page.route(/\/booking\/(Bookings|Customers)/, (route) => route.abort('connectionrefused'))

  await page.goto('/')

  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(alert).toContainText('not reachable')
  await expect(page.getByTestId('connection')).toHaveAttribute('data-connected', 'false')
})
