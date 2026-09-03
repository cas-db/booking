import { test, expect } from '@playwright/test'
import { firstCustomer } from './fixtures'

test('creates a booking and shows it as a new card', async ({ page, request }) => {
  const customer = await firstCustomer(request)
  const garageId = `GAR-${String(Math.floor(Math.random() * 90) + 10)}`

  await page.goto('/')
  await page.getByRole('button', { name: 'New booking' }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Customer').selectOption({ label: customer.name })
  await dialog.getByLabel('Tire spec').fill('225/45 R17 allseason')
  await dialog.getByLabel('Garage').fill(garageId)
  await dialog.getByRole('button', { name: 'Book swap' }).click()

  await expect(page.getByTestId('toast')).toContainText('225/45 R17 allseason')

  const card = page
    .locator('[data-testid="booking-card"]')
    .filter({ hasText: garageId })
    .filter({ hasText: '225/45 R17 allseason' })
  await expect(card).toBeVisible()
  await expect(card.getByTestId('status-badge')).toHaveText('Created')
  await expect(card).toContainText(customer.name)
})

test('flags an invalid tire spec and an invalid garage before sending', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New booking' }).click()

  const dialog = page.getByRole('dialog')
  const submit = dialog.getByRole('button', { name: 'Book swap' })
  await expect(submit).toBeDisabled()

  await dialog.getByLabel('Tire spec').fill('205/55 R16 autumn')
  await dialog.getByLabel('Garage').fill('GARAGE-1')
  await dialog.getByLabel('Garage').blur()

  await expect(page.getByTestId('tire-spec-error')).toBeVisible()
  await expect(page.getByTestId('garage-error')).toBeVisible()
  await expect(submit).toBeDisabled()

  await dialog.getByLabel('Tire spec').fill('205/55 R16 winter')
  await dialog.getByLabel('Garage').fill('GAR-04')
  await expect(page.getByTestId('tire-spec-error')).toBeHidden()
  await expect(page.getByTestId('garage-error')).toBeHidden()
  await expect(submit).toBeEnabled()
})

test('surfaces a server error and keeps the dialog open', async ({ page }) => {
  await page.route('**/booking/Bookings', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: '400', message: 'garage GAR-99 is not known' } }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'New booking' }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Tire spec').fill('195/65 R15 summer')
  await dialog.getByLabel('Garage').fill('GAR-99')
  await dialog.getByRole('button', { name: 'Book swap' }).click()

  await expect(page.getByTestId('form-error')).toHaveText('garage GAR-99 is not known')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Tire spec')).toHaveValue('195/65 R15 summer')
  await expect(dialog.getByLabel('Garage')).toHaveValue('GAR-99')
})
