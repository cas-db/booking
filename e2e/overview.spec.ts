import { test, expect } from '@playwright/test'
import { createBooking, firstCustomer } from './fixtures'

test('renders one card per booking with its status', async ({ page, request }) => {
  const customer = await firstCustomer(request)
  const booking = await createBooking(request, {
    customer_ID: customer.ID,
    tireSpec: '195/65 R15 summer',
  })

  await page.goto('/')

  const card = page.locator(`[data-testid="booking-card"][data-id="${booking.ID}"]`)
  await expect(card).toBeVisible()
  await expect(card).toContainText('195/65 R15 summer')
  await expect(card).toContainText(customer.name)
  await expect(card).toContainText('GAR-01')
  await expect(card.getByTestId('status-badge')).toHaveText('Created')
  await expect(card.getByTestId('card-created')).toHaveText(/just now|min ago/)
  await expect(page.getByTestId('connection')).toHaveAttribute('data-connected', 'true')
})

test('status chips and the text filter narrow the grid', async ({ page, request }) => {
  const created = await createBooking(request, { garageId: 'GAR-07' })
  const cancelled = await createBooking(request, { garageId: 'GAR-08' })
  const cancel = await request.post(
    `http://localhost:4004/booking/Bookings(${cancelled.ID})/BookingService.cancel`,
    { data: {} },
  )
  expect(cancel.ok()).toBeTruthy()

  await page.goto('/')

  const createdCard = page.locator(`[data-testid="booking-card"][data-id="${created.ID}"]`)
  const cancelledCard = page.locator(`[data-testid="booking-card"][data-id="${cancelled.ID}"]`)
  await expect(createdCard).toBeVisible()
  await expect(cancelledCard).toBeVisible()

  await page.getByRole('button', { name: /^Cancelled/ }).click()
  await expect(createdCard).toBeHidden()
  await expect(cancelledCard).toBeVisible()

  await page.getByRole('button', { name: /^Cancelled/ }).click()
  await page.getByRole('searchbox').fill('GAR-07')
  await expect(createdCard).toBeVisible()
  await expect(cancelledCard).toBeHidden()

  await page.getByRole('searchbox').fill('GAR-does-not-exist')
  await expect(page.getByTestId('no-matches')).toBeVisible()
})

test('picks up a booking created elsewhere through polling', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Bookings', exact: true })).toBeVisible()

  const booking = await createBooking(request, { tireSpec: '225/45 R17 allseason' })

  const card = page.locator(`[data-testid="booking-card"][data-id="${booking.ID}"]`)
  await expect(card).toBeVisible({ timeout: 10_000 })
})
