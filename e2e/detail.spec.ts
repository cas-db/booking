import { test, expect } from '@playwright/test'
import { createBooking, deliverTire, firstCustomer, readBooking } from './fixtures'

test('a deep link renders the booking with its chain timeline', async ({ page, request }) => {
  const customer = await firstCustomer(request)
  const booking = await createBooking(request, {
    customer_ID: customer.ID,
    garageId: 'GAR-31',
    tireSpec: '235/60 R18 winter',
  })

  await page.goto(`/#/bookings/${booking.ID}`)

  const detail = page.getByTestId('booking-detail')
  await expect(detail).toBeVisible()
  await expect(page.getByTestId('booking-id')).toHaveText(booking.ID)
  await expect(detail).toContainText('235/60 R18 winter')
  await expect(detail).toContainText('GAR-31')
  await expect(detail).toContainText(customer.name)
  await expect(detail.getByTestId('status-badge')).toHaveText('Created')

  const steps = page.getByTestId('timeline-step')
  await expect(steps).toHaveCount(3)
  await expect(steps.nth(0)).toHaveAttribute('data-state', 'done')
  await expect(steps.nth(2)).toHaveAttribute('data-state', 'ahead')
})

test('confirming from the detail page turns the booking Done', async ({ page, request }) => {
  const booking = await createBooking(request, { garageId: 'GAR-32' })
  await deliverTire(request, booking)

  await page.goto(`/#/bookings/${booking.ID}`)

  const detail = page.getByTestId('booking-detail')
  await expect(detail).toHaveAttribute('data-status', 'ReadyForSwap')

  await detail.getByTestId('action-confirmSwap').click()

  await expect(detail.getByTestId('status-badge')).toHaveText('Done')
  await expect(page.getByTestId('toast')).toContainText('Confirm swap')
  await expect(detail.getByTestId('action-confirmSwap')).toBeHidden()
  await expect(page.getByTestId('timeline-step').nth(2)).toHaveAttribute('data-state', 'done')
  expect((await readBooking(request, booking.ID))?.status).toBe('Done')
})

test('a card links to its detail page and back keeps the filters', async ({ page, request }) => {
  const booking = await createBooking(request, { garageId: 'GAR-33' })

  await page.goto('/')
  await page.getByRole('searchbox').fill('GAR-33')

  const card = page.locator(`[data-testid="booking-card"][data-id="${booking.ID}"]`)
  await card.getByRole('link').click()

  await expect(page.getByTestId('booking-detail')).toBeVisible()

  await page.goBack()

  await expect(page.getByRole('searchbox')).toHaveValue('GAR-33')
  await expect(card).toBeVisible()
})

test('an unknown ID renders the not found state', async ({ page }) => {
  await page.goto('/#/bookings/00000000-0000-0000-0000-000000000000')

  await expect(page.getByTestId('not-found')).toBeVisible()
})
