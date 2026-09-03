import { test, expect } from '@playwright/test'
import { createBooking, deliverTire, readBooking } from './fixtures'

test('a delivered tire turns into a confirmed swap', async ({ page, request }) => {
  const booking = await createBooking(request, { garageId: 'GAR-21' })

  await page.goto('/')
  const card = page.locator(`[data-testid="booking-card"][data-id="${booking.ID}"]`)
  await expect(card).toBeVisible()
  await expect(card.getByTestId('action-cancel')).toBeVisible()
  await expect(card.getByTestId('action-confirmSwap')).toBeHidden()

  await deliverTire(request, booking)

  await expect(card).toHaveAttribute('data-status', 'ReadyForSwap', { timeout: 10_000 })
  await expect(card.getByTestId('action-cancel')).toBeHidden()

  await card.getByTestId('action-confirmSwap').click()

  await expect(card.getByTestId('status-badge')).toHaveText('Done')
  await expect(page.getByTestId('toast')).toContainText('Confirm swap')
  await expect(card.getByTestId('action-confirmSwap')).toBeHidden()
  expect((await readBooking(request, booking.ID))?.status).toBe('Done')
})
