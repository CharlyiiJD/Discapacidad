import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'

const baseURL = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    await context.route('**/rest/v1/**', (route) => route.fulfill({ json: [] }))
    await context.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, json: { message: 'No test session' } }))
    await context.addInitScript(() => {
      const events = new EventTarget()
      const mock = { calls: [], cancelCount: 0, paused: false, current: null, voices: [] }
      window.__speechMock = mock
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
        constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.voice = null }
      } })
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        getVoices: () => mock.voices,
        addEventListener: events.addEventListener.bind(events),
        removeEventListener: events.removeEventListener.bind(events),
        speak: (utterance) => { mock.current = utterance; mock.calls.push({ text: utterance.text, rate: utterance.rate, lang: utterance.lang }) },
        cancel: () => { mock.cancelCount++; mock.current = null; mock.paused = false },
        pause: () => { mock.paused = true },
        resume: () => { mock.paused = false },
      } })
      mock.loadVoices = () => {
        mock.voices = [{ name: 'Voz de prueba', lang: 'es-PE', localService: true }]
        events.dispatchEvent(new Event('voiceschanged'))
      }
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${baseURL}/#servicios`, { waitUntil: 'domcontentloaded' })
    const panel = page.locator('#speech-reader-panel')
    await expect(panel).not.toBeVisible()
    assert.equal(await page.evaluate(() => window.__speechMock.calls.length), 0)
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).toBeVisible()
    const activate = panel.getByRole('button', { name: 'Activar lectura asistida', exact: true })
    await expect(activate).toBeFocused()
    await expect(activate).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => page.evaluate(() => window.__speechMock.calls.at(-1)?.text ?? '')).toContain('activado')
    await page.keyboard.press('Tab')
    await expect(panel.getByRole('button', { name: 'Leer sección', exact: true })).toBeFocused()
    await expect.poll(() => page.evaluate(() => window.__speechMock.calls.at(-1)?.text ?? '')).toContain('Leer sección')
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).not.toBeVisible()
    await expect(activate).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).not.toBeVisible()
    await expect(activate).toHaveAttribute('aria-pressed', 'false')
    const offCount = await page.evaluate(() => window.__speechMock.calls.length)
    await page.locator('.navigation-link[href="#servicios"]').focus()
    assert.equal(await page.evaluate(() => window.__speechMock.calls.length), offCount)
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).toBeVisible()
    await expect(activate).toBeFocused()
    await expect(activate).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).not.toBeVisible()
    await page.evaluate(() => window.__speechMock.loadVoices())
    await page.locator('.navigation-link[href="#servicios"]').focus()
    await expect.poll(() => page.evaluate(() => window.__speechMock.calls.at(-1).lang)).toBe('es-PE')
    await page.locator('.speech-edge-tab').click()
    await panel.getByRole('button', { name: 'Pausar lectura', exact: true }).press('Enter')
    await expect(panel).not.toBeVisible()
    assert.equal(await page.evaluate(() => window.__speechMock.paused), true)
    await page.locator('.speech-edge-tab').click()
    await panel.getByRole('button', { name: 'Reanudar lectura', exact: true }).press('Enter')
    await expect(panel).not.toBeVisible()
    assert.equal(await page.evaluate(() => window.__speechMock.paused), false)
    await page.locator('.speech-edge-tab').click()
    await panel.getByRole('button', { name: 'Leer sección', exact: true }).press('Enter')
    await expect(panel).not.toBeVisible()
    await expect.poll(() => page.evaluate(() => window.__speechMock.calls.at(-1).text)).toContain('Servicios')
    await page.locator('.navigation-link[href="#iniciar-sesion"]').press('Enter')
    const login = page.locator('#auth-dialog')
    await expect(login).toBeVisible()
    await expect(login.locator('.speech-controls')).toHaveCount(0)
    const password = login.locator('input[autocomplete="current-password"]')
    await password.fill('secreto-no-leer-123')
    await password.focus()
    const beforeTyping = await page.evaluate(() => window.__speechMock.calls.length)
    await password.pressSequentially('xyz')
    await page.waitForTimeout(250)
    assert.equal(await page.evaluate(() => window.__speechMock.calls.length), beforeTyping)
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).not.toBeVisible()
    await expect(activate).toHaveAttribute('aria-pressed', 'false')
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).toBeVisible()
    await expect(activate).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Tab')
    await expect.poll(() => page.evaluate(() => window.__speechMock.calls.at(-1)?.text ?? '')).toContain('Leer sección')
    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await expect(login).toBeVisible()
    await expect(password).toBeFocused()
    await page.keyboard.press('Alt+Shift+L')
    await expect(panel).not.toBeVisible()
    await expect(activate).toHaveAttribute('aria-pressed', 'false')
    const disabledCount = await page.evaluate(() => window.__speechMock.calls.length)
    await login.locator('input[type="email"]').focus()
    await page.waitForTimeout(250)
    assert.equal(await page.evaluate(() => window.__speechMock.calls.length), disabledCount)
    const spoken = await page.evaluate(() => window.__speechMock.calls.map((call) => call.text).join(' '))
    assert.ok(!spoken.includes('secreto-no-leer'))
    assert.ok(!spoken.includes('xyz'))
    assert.deepEqual(errors, [])
    await context.close()
  }
  console.log('Ciclo del atajo, voz con Tab, panel lateral, pausa y privacidad: comprobados con voz simulada.')
} finally { await browser.close() }
