import { test, expect } from '@playwright/test'
import { createBooking } from './fixtures'

test('cds serves the built UI and the OData service from one process', async ({
  page,
  request,
}) => {
  const booking = await createBooking(request, { garageId: 'GAR-51' })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Tire swap bookings' })).toBeVisible()
  const card = page.locator(`[data-testid="booking-card"][data-id="${booking.ID}"]`)
  await expect(card).toBeVisible()
  await expect(card).toContainText('GAR-51')
})
