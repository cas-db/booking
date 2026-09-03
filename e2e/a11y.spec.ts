import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createBooking, deliverTire, readBooking } from './fixtures'

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

/** The in-memory database keeps every booking of the run, so the marker has to be unique. */
function uniqueTireSpec(): string {
  return `${rand(100, 999)}/${rand(10, 99)} R${rand(10, 22)} winter`
}

test('the overview has no axe violations', async ({ page, request }) => {
  await createBooking(request, { garageId: 'GAR-41' })
  await page.goto('/')
  await expect(page.getByTestId('booking-card').first()).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('the create dialog has no axe violations and returns focus on Escape', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'New booking' })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('the detail page has no axe violations', async ({ page, request }) => {
  const booking = await createBooking(request, { garageId: 'GAR-42' })
  await page.goto(`/#/bookings/${booking.ID}`)
  await expect(page.getByTestId('booking-detail')).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('dark mode keeps the contrast readable', async ({ page, request }) => {
  await createBooking(request, { garageId: 'GAR-44' })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.getByTestId('booking-card').first()).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('create and confirm work with the keyboard only', async ({ page, request }) => {
  const garageId = 'GAR-43'
  const tireSpec = uniqueTireSpec()
  await page.goto('/')

  await page.getByRole('button', { name: 'New booking' }).focus()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Customer')).toBeFocused()

  await page.keyboard.press('Tab')
  await page.keyboard.type(tireSpec)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Control+A')
  await page.keyboard.type(garageId)

  await dialog.getByRole('button', { name: 'Book swap' }).focus()
  await page.keyboard.press('Enter')

  await expect(dialog).toBeHidden()
  const card = page.locator('[data-testid="booking-card"]').filter({ hasText: tireSpec })
  await expect(card).toBeVisible()

  const id = await card.getAttribute('data-id')
  expect(id).not.toBeNull()
  await deliverTire(request, {
    ID: id!,
    garageId,
    tireSpec: '205/55 R16 winter',
    status: 'Created',
  })
  await expect(card).toHaveAttribute('data-status', 'ReadyForSwap', { timeout: 10_000 })

  await card.getByTestId('action-confirmSwap').focus()
  await page.keyboard.press('Enter')

  await expect(card.getByTestId('status-badge')).toHaveText('Done')
  expect((await readBooking(request, id!))?.status).toBe('Done')
})
