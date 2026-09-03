import { test, expect } from '@playwright/test'
import { createBooking, readBooking } from './fixtures'

test('cancels a booking in Created and then offers no action', async ({ page, request }) => {
  const booking = await createBooking(request, { garageId: 'GAR-22' })

  await page.goto('/')
  const card = page.locator(`[data-testid="booking-card"][data-id="${booking.ID}"]`)
  await expect(card).toBeVisible()

  await card.getByTestId('action-cancel').click()

  await expect(card.getByTestId('status-badge')).toHaveText('Cancelled')
  await expect(page.getByTestId('toast')).toContainText('Cancel')
  await expect(card.getByTestId('action-cancel')).toBeHidden()
  await expect(card.getByTestId('action-confirmSwap')).toBeHidden()
  expect((await readBooking(request, booking.ID))?.status).toBe('Cancelled')
})
