import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 820 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    let signupRequests = 0
    let rejectSignup = true
    await context.route('**/auth/v1/**', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.endsWith('/signup')) throw new Error(`Unexpected authentication request: ${url.pathname}`)
      signupRequests++
      await route.fulfill(rejectSignup ? { status: 422, json: { code: 'weak_password', message: 'Password does not meet requirements' } } : { json: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'prueba@example.com', user_metadata: { nombre: 'Persona', apellidos: 'De prueba' }, created_at: '2026-01-01T00:00:00Z' } })
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('http://127.0.0.1:5173/#servicios', { waitUntil: 'networkidle' })
    const loginTrigger = page.locator('.navigation-link[href="#iniciar-sesion"]')
    await loginTrigger.click()
    let dialog = page.getByRole('dialog', { name: 'Iniciar sesión', exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Correo electrónico' })).toBeFocused()
    assert.equal(await page.locator('#page-heading').innerText(), 'Servicios')
    for (const mode of ['login', 'register']) {
      if (mode === 'register') {
        await dialog.getByRole('link', { name: /Regístrate/ }).click()
        dialog = page.getByRole('dialog', { name: 'Crear cuenta', exact: true })
        await expect(dialog).toBeVisible()
        await expect(page).toHaveURL(/#registro$/)
        assert.equal(await page.locator('#page-heading').innerText(), 'Servicios')
        assert.equal(await page.getByText('Crea tu cuenta para acceder al portal universitario.', { exact: true }).count(), 0)
        await expect(dialog.getByRole('textbox', { name: 'Nombre', exact: true })).toBeFocused()
      }
      const bounds = await dialog.boundingBox()
      assert.ok(Math.abs(bounds.x + bounds.width / 2 - width / 2) < 2)
      assert.ok(Math.abs(bounds.y + bounds.height / 2 - 410) < 2)
      for (let index = 0; index < 10; index++) {
        await page.keyboard.press('Tab')
        assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true)
      }
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      assert.deepEqual(audit.violations.map((violation) => violation.id), [])
      await page.screenshot({ path: `artifacts/auth-${mode}-${width}.png` })
    }
    await dialog.getByRole('button', { name: /Crear cuenta/ }).click()
    await expect(page.locator('#register-error-summary')).toBeFocused()
    await expect(page.locator('#register-name')).toHaveAttribute('aria-invalid', 'true')
    assert.equal(signupRequests, 0)
    await dialog.getByLabel('Nombre', { exact: true }).fill('Persona')
    await dialog.getByLabel('Apellidos', { exact: true }).fill('De prueba')
    await dialog.getByLabel('Correo electrónico', { exact: true }).fill('prueba.example.com')
    await dialog.getByLabel('Contraseña', { exact: true }).fill('password-de-prueba')
    await dialog.getByLabel('Confirmar contraseña', { exact: true }).fill('otra-password-de-prueba')
    await dialog.getByRole('button', { name: /Crear cuenta/ }).click()
    const summary = page.locator('#register-error-summary')
    await expect(summary).toBeFocused()
    await expect(summary).toContainText('El correo debe incluir el signo arroba')
    await expect(summary).toContainText('Las contraseñas no coinciden. Inténtalo otra vez')
    await expect(page.locator('#register-email')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#register-confirmation')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#register-confirmation')).toHaveAttribute('aria-describedby', /register-confirmation-error/)
    assert.equal(signupRequests, 0)
    assert.ok(!(await summary.innerText()).includes('password-de-prueba'))
    await summary.getByRole('link', { name: /Correo electrónico/ }).press('Enter')
    await expect(page.locator('#register-email')).toBeFocused()
    await dialog.getByLabel('Correo electrónico', { exact: true }).fill('prueba@')
    await dialog.getByRole('button', { name: /Crear cuenta/ }).click()
    await expect(summary).toContainText('El correo electrónico no es válido')
    assert.equal(signupRequests, 0)
    await dialog.getByLabel('Correo electrónico', { exact: true }).fill('prueba@example.com')
    await expect(page.locator('#register-email')).not.toHaveAttribute('aria-invalid', 'true')
    await dialog.getByRole('button', { name: /Crear cuenta/ }).click()
    await expect(summary).toBeFocused()
    await expect(summary.getByRole('link')).toHaveCount(1)
    const toggle = dialog.getByRole('button', { name: 'Mostrar confirmar contraseña', exact: true })
    await toggle.press('Enter')
    await expect(page.locator('#register-confirmation')).toHaveAttribute('type', 'text')
    await dialog.getByRole('button', { name: 'Ocultar confirmar contraseña', exact: true }).press('Space')
    await expect(page.locator('#register-confirmation')).toHaveAttribute('type', 'password')
    await dialog.getByLabel('Confirmar contraseña', { exact: true }).fill('password-de-prueba')
    await dialog.getByRole('button', { name: /Crear cuenta/ }).click()
    await expect(summary).toBeFocused()
    await expect(summary).toContainText('La contraseña no cumple los requisitos de seguridad')
    assert.equal(signupRequests, 1)
    const errorAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    assert.deepEqual(errorAudit.violations.map((violation) => violation.id), [])
    rejectSignup = false
    await dialog.getByRole('button', { name: /Crear cuenta/ }).click()
    await expect(dialog.getByRole('status')).toContainText('Solicitud de registro recibida')
    await expect(summary).toHaveCount(0)
    assert.equal(signupRequests, 2)
    await page.keyboard.press('Escape')
    await expect(page.locator('#auth-dialog')).toHaveCount(0)
    await expect(page).toHaveURL(/#servicios$/)
    await expect(loginTrigger).toBeFocused()
    await page.locator('.navigation-link[href="#inicio"]').click()
    await expect(page.locator('.university-hero')).toBeVisible()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await page.locator('.footer-bottom a[href="#inicio"]').click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    assert.ok(await page.locator('header').evaluate((node) => node.getBoundingClientRect().top >= 0))
    assert.deepEqual(errors, [])
    console.log(`Authentication dialogs at ${width}px: centering, keyboard, routes, validation and accessibility passed`)
    await context.close()
  }
} finally {
  await browser.close()
}
