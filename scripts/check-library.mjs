import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5175'
await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await context.route('**/rest/v1/**', (route) => route.fulfill({ json: [] }))
    await context.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, json: { message: 'No test session' } }))
    // Exercise the fallback without downloading a large third-party PDF in every run.
    await context.route('https://assets.openstax.org/**/*.pdf', (route) => route.abort())
    await page.goto(`${baseURL}/#servicios`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: /^Explorar biblioteca/ }).press('Enter')
    await expect(page).toHaveURL(/#biblioteca$/)
    await expect(page.getByRole('heading', { name: 'Biblioteca y recursos', exact: true })).toBeVisible()
    await expect(page.locator('.library-book')).toHaveCount(4)
    await expect(page.locator('.library-pdf')).toHaveCount(0)
    await page.getByLabel('Buscar material', { exact: true }).fill('estadistica')
    await expect(page.locator('.library-book')).toHaveCount(1)
    await page.getByLabel('Buscar material', { exact: true }).fill('')
    await page.getByLabel('Área de estudio', { exact: true }).selectOption('Física')
    await expect(page.locator('.library-book')).toHaveCount(2)
    await page.getByLabel('Idioma', { exact: true }).selectOption('Inglés')
    await expect(page.locator('.library-book')).toHaveCount(0)
    await page.getByRole('button', { name: /Restablecer los filtros/ }).press('Enter')
    await expect(page.locator('.library-book')).toHaveCount(4)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    assert.equal(overflow, false)
    await expect.poll(() => page.locator('.library-image').evaluate((image) => image.complete && image.naturalWidth > 0), { timeout: 20000 }).toBe(true)
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    assert.deepEqual(audit.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) })), [])
    await page.screenshot({ path: `artifacts/library-${width}.png`, fullPage: true })
    const read = page.getByRole('button', { name: /^Leer en línea Introducción a la estadística/ })
    await read.press('Enter')
    const reader = page.locator('#library-reader')
    await expect(reader).toBeFocused()
    await expect(page.locator('.library-pdf')).toHaveAttribute('title', /Introducción a la estadística/)
    await expect(reader.getByRole('link', { name: /^Leer versión web/ })).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(reader.getByRole('link', { name: /^Abrir PDF/ })).toHaveAttribute('target', '_blank')
    await page.keyboard.press('Tab')
    await expect(reader.getByRole('button', { name: /^Cerrar el visor/ })).toBeFocused()
    await reader.getByRole('button', { name: /^Cerrar el visor/ }).press('Enter')
    await expect(page.locator('.library-pdf')).toHaveCount(0)
    await expect(read).toBeFocused()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.library-book')).toHaveCount(4)
    assert.deepEqual(errors, [])
    await context.close()
  }
  console.log('Biblioteca: filtros, ruta, teclado, foco, alternativas al PDF, imagen, reflujo y axe comprobados en escritorio y móvil. PDF reales verificados por separado mediante HTTP HEAD.')
} finally { await browser.close() }
