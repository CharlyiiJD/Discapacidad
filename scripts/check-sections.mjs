import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('http://127.0.0.1:5173/#servicios', { waitUntil: 'networkidle' })
    const headerText = await page.locator('header').innerText()
    for (const [id, title] of [['accesibilidad', 'Accesibilidad'], ['servicios', 'Servicios']]) {
      await page.locator(`.navigation-link[href="#${id}"]`).click()
      await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
      await expect(page.locator(`.navigation-link[href="#${id}"]`)).toHaveAttribute('aria-current', 'page')
      assert.equal(await page.locator('main').evaluate((node) => node === document.activeElement), true)
      assert.equal(await page.locator('header').innerText(), headerText)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await expect(page).toHaveTitle(`${title} | My-University`)
      if (id === 'accesibilidad') {
        const question = page.getByText('¿Cómo puedo solicitar apoyo?', { exact: true })
        await question.focus()
        await page.keyboard.press('Enter')
        await expect(page.locator('details').first()).toHaveAttribute('open', '')
      }
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      assert.deepEqual(audit.violations.map((violation) => violation.id), [])
      await page.screenshot({ path: `artifacts/${id}-${width}.png`, fullPage: true })
      console.log(`${title} at ${width}px: navigation, keyboard, layout and accessibility passed`)
    }
    await page.locator('.service-item a').first().click()
    await expect(page.getByRole('form', { name: 'Formulario de contacto' })).toBeVisible()
    assert.equal(await page.locator('#contacto').evaluate((node) => node === document.activeElement), true)
    await expect(page.locator('#contacto')).toBeInViewport()
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Servicios', level: 1, exact: true })).toBeVisible()
    assert.deepEqual(errors, [])
    await context.close()
  }
} finally {
  await browser.close()
}
