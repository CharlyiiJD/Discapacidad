import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const studentId = '11111111-1111-4111-8111-111111111111'
const courseId = '22222222-2222-4222-8222-222222222222'
const user = { id: studentId, aud: 'authenticated', role: 'authenticated', email: 'prueba@example.com', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { nombre: 'Prueba Segundo', apellidos: 'Ejemplo Apellido' }, created_at: '2026-01-01T00:00:00Z' }
const payload = { sub: studentId, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.test`
const session = { access_token: token, refresh_token: 'test-refresh-token', expires_in: 3600, token_type: 'bearer', user }
const course = { id: courseId, codigo: 'CUR-01', nombre: 'Curso de prueba', creditos: 4, ciclo: 1, carrera: 'Carrera de prueba' }
const enrollments = [{ id: 'matricula-prueba', curso_id: courseId, periodo: '2026-II', estado: 'registrada', curso: course }]

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    let empty = false
    let logoutRequests = 0
    const queries = []
    await context.route('**/auth/v1/**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/logout')) { logoutRequests++; await route.fulfill({ status: 204 }); return }
      await route.fulfill({ json: url.pathname.endsWith('/user') ? user : session })
    })
    await context.route('**/rest/v1/**', async (route) => {
      const url = new URL(route.request().url())
      const table = url.pathname.split('/').pop()
      queries.push(url)
      if (table === 'roles_usuario') {
        assert.equal(url.searchParams.get('usuario_id'), `eq.${studentId}`)
        await route.fulfill({ json: [] })
      } else if (table === 'matriculas') {
        assert.equal(url.searchParams.get('estudiante_id'), `eq.${studentId}`)
        await route.fulfill({ json: empty ? [] : enrollments })
      } else if (table === 'consolidados') {
        assert.equal(url.searchParams.get('matricula.estudiante_id'), `eq.${studentId}`)
        await route.fulfill({ json: [{ id: 'consolidado-prueba', matricula_id: 'matricula-prueba', c1_nota1: 16, c1_nota2: null, c1_nota3: null, c2_nota1: null, c2_nota2: null, c2_nota3: null, promedio_c1: null, promedio_c2: null, nota_final: null }] })
      } else if (table === 'horarios') {
        assert.equal(url.searchParams.get('curso_id'), `in.(${courseId})`)
        await route.fulfill({ json: [{ id: 'horario-prueba', curso_id: courseId, dia_semana: 1, hora_inicio: '08:00:00', hora_fin: '10:00:00', aula: 'Aula de prueba', docente: 'Docente de prueba' }, { id: 'horario-repetido', curso_id: courseId, dia_semana: 4, hora_inicio: '11:00:00', hora_fin: '13:00:00', aula: 'Aula de prueba', docente: 'Docente de prueba' }] })
      } else throw new Error(`Unexpected table: ${table}`)
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('http://127.0.0.1:5173/#servicios', { waitUntil: 'networkidle' })
    await page.locator('.navigation-link[href="#iniciar-sesion"]').click()
    const dialog = page.getByRole('dialog', { name: 'Iniciar sesión', exact: true })
    await dialog.getByLabel('Correo electrónico', { exact: true }).fill(user.email)
    await dialog.getByLabel('Contraseña', { exact: true }).fill('password-de-prueba')
    await dialog.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
    await expect(page.locator('#auth-dialog')).toHaveCount(0)
    const profile = page.getByRole('button', { name: /Perfil de Prueba/ })
    await expect(profile).toBeVisible()
    await expect(page.locator('.profile-name')).toHaveText('Prueba E.')
    await expect(profile).toHaveAttribute('aria-label', 'Perfil de Prueba E., abrir menú de cuenta')
    await profile.press('ArrowDown')
    const portalLink = page.getByRole('menuitem', { name: /Ir al portal del estudiante/ })
    await expect(portalLink).toBeFocused()
    await expect(portalLink).toHaveAttribute('target', '_blank')
    await expect(portalLink).toHaveAttribute('rel', 'noopener noreferrer')
    const menuAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    assert.deepEqual(menuAudit.violations.map((violation) => violation.id), [])
    const [portal] = await Promise.all([page.waitForEvent('popup'), portalLink.click()])
    portal.on('pageerror', (error) => errors.push(error.message))
    await expect(portal.locator('.student-portal')).toBeVisible()
    await expect(portal.locator('#portal-content')).toBeEmpty()
    assert.equal(queries.filter((url) => !url.pathname.endsWith('/roles_usuario')).length, 0)
    if (width > 900) {
      const ratio = await portal.locator('.student-portal').evaluate((node) => node.querySelector('aside').getBoundingClientRect().width / node.getBoundingClientRect().width)
      assert.ok(Math.abs(ratio - 0.15) < 0.001)
    }
    await portal.screenshot({ path: `artifacts/portal-empty-${width}.png` })
    for (const [id, label, content] of [['mis-cursos', 'Mis cursos', course.nombre], ['mis-notas', 'Mis notas', 'Consolidado 1'], ['mi-horario', 'Mi horario', 'Lunes'], ['mis-creditos', 'Mis créditos', '2026-II']]) {
      await portal.locator(`.portal-sidebar a[href="#portal/${id}"]`).click()
      await expect(portal.getByRole('heading', { name: label, level: 2, exact: true })).toBeVisible()
      await expect(portal.locator('.student-table')).toContainText(content)
      if (id === 'mis-cursos') {
        const table = portal.locator('.student-table-scroll')
        const entry = portal.locator('.table-entry-button').first()
        await table.focus()
        await table.press('Enter')
        await expect(entry).toBeFocused()
        await expect(entry).toHaveAttribute('aria-label', /Curso: Curso de prueba.*Créditos: 4.*Periodo: 2026-II/)
        await entry.press('Enter')
        const detail = portal.locator('.student-row-detail')
        await expect(detail).toBeFocused()
        await detail.press('Tab')
        await expect(portal.locator('.student-detail-value').first()).toBeFocused()
        await portal.locator('.student-detail-value').first().press('Escape')
        await expect(entry).toBeFocused()
        await expect(entry).toHaveAttribute('aria-expanded', 'false')
      }
      if (id === 'mis-notas') {
        const courseSection = portal.locator('.student-course-grades').first()
        await courseSection.focus()
        await courseSection.press('Enter')
        const consolidated = portal.locator('.table-entry-button').first()
        await expect(consolidated).toBeFocused()
        await expect(consolidated).toHaveAttribute('aria-label', /Notas del consolidado 1.*Nota del criterio 1: 16.*Nota del criterio 2: Pendiente.*Promedio del consolidado 1: Pendiente/)
        await consolidated.press('Enter')
        await expect(portal.locator('.student-row-detail')).toBeFocused()
        await expect(portal.locator('.student-detail-value').nth(1)).toHaveAttribute('aria-label', /Consolidado 1. Nota del criterio 1: 16/)
        await portal.locator('.student-row-detail').press('Escape')
        await expect(consolidated).toBeFocused()
        await expect(portal.locator('.student-final-grade')).toHaveAttribute('aria-label', /Nota final: Pendiente/)
      }
      if (id === 'mi-horario') {
        await expect(portal.locator('.weekly-class')).toHaveCount(2)
        await expect(portal.locator('.weekly-schedule th[scope="col"]')).toHaveText(['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'])
        await expect(portal.locator('.weekly-schedule td[rowspan="2"]')).toHaveCount(2)
        await expect(portal.locator('.weekly-class').first()).toContainText('08:00 - 10:00')
        await expect(portal.locator('.weekly-class').last()).toContainText('11:00 - 13:00')
        await portal.locator('.weekly-class').first().focus()
        await portal.locator('.weekly-class').first().press('Enter')
        await expect(portal.locator('.student-row-detail')).toBeFocused()
        await portal.locator('.student-row-detail').press('Escape')
        await portal.getByText('Detalle del horario', { exact: true }).focus()
        await portal.getByText('Detalle del horario', { exact: true }).press('Enter')
        await portal.getByText('Detalle del horario', { exact: true }).press('Enter')
        await expect(portal.locator('.schedule-details')).toHaveAttribute('open', '')
        await portal.screenshot({ path: `artifacts/portal-schedule-${width}.png`, fullPage: true })
      }
      assert.equal(await portal.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      const audit = await new AxeBuilder({ page: portal }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      assert.deepEqual(audit.violations.map((violation) => violation.id), [])
    }
    await portal.screenshot({ path: `artifacts/portal-credits-${width}.png` })
    empty = true
    await portal.locator('.portal-sidebar a[href="#portal/mis-cursos"]').click()
    await expect(portal.getByRole('status')).toHaveText('Aún no tienes cursos matriculados')
    await profile.click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión de tu cuenta' }).click()
    await expect(page.locator('.navigation-link[href="#iniciar-sesion"]')).toBeVisible()
    await expect(portal.getByText('Inicia sesión para consultar tu información académica.')).toBeVisible()
    assert.equal(logoutRequests, 1)
    assert.deepEqual(errors, [])
    console.log(`Portal at ${width}px: session, new tab, scoped queries, empty states, keyboard and accessibility passed (mocked API)`)
    await context.close()
  }
} finally {
  await browser.close()
}
