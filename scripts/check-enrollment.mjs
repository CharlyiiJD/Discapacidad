import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const studentId = '11111111-1111-4111-8111-111111111111'
const user = { id: studentId, aud: 'authenticated', role: 'authenticated', email: 'prueba@example.com', app_metadata: { provider: 'email' }, user_metadata: { nombre: 'Prueba' }, created_at: '2026-01-01T00:00:00Z' }
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: studentId, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`
const session = { access_token: token, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user }
const courses = Array.from({ length: 5 }, (_, index) => ({ id: `22222222-2222-4222-8222-${String(index + 1).padStart(12, '0')}`, codigo: `CUR-0${index + 1}`, nombre: `Curso de prueba ${index + 1}`, creditos: index === 0 ? 4 : 3, ciclo: 1, carrera: 'Ingeniería de prueba' }))
const schedules = courses.map((course, index) => ({ id: `horario-${index}`, curso_id: course.id, dia_semana: index + 1, hora_inicio: '08:00:00', hora_fin: '10:00:00', aula: 'Aula de prueba', docente: 'Docente de prueba' }))
const enrollment = (course) => ({ id: `matricula-${course.id}`, curso_id: course.id, periodo: '2026-II', estado: 'registrada', curso: course })

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    let registered = []
    let failInsert = false
    let failCatalog = false
    let failCareers = false
    let failEnrollmentRead = false
    const insertions = []
    await context.route('**/auth/v1/**', (route) => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith('/user') ? user : session }))
    await context.route('**/rest/v1/**', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const table = url.pathname.split('/').pop()
      if (table === 'roles_usuario') {
        assert.equal(url.searchParams.get('usuario_id'), `eq.${studentId}`)
        await route.fulfill({ json: [] })
      } else if (table === 'cursos') {
        if (url.searchParams.get('select') === 'carrera') {
          await route.fulfill(failCareers ? { status: 403, json: { code: '42501', message: 'permission denied for table cursos' } } : { json: courses.map(({ carrera }) => ({ carrera })) })
        } else {
          assert.equal(url.searchParams.get('carrera'), 'eq.Ingeniería de prueba')
          assert.equal(url.searchParams.get('ciclo'), 'eq.1')
          assert.equal(url.searchParams.get('activo'), 'eq.true')
          await route.fulfill(failCatalog ? { status: 500, json: { message: 'Consulta rechazada' } } : { json: courses })
        }
      } else if (table === 'matriculas') {
        if (request.method() === 'POST') {
          const rows = request.postDataJSON()
          insertions.push(rows)
          for (const row of rows) {
            assert.equal(row.estudiante_id, studentId)
            assert.equal(row.periodo, '2026-II')
            assert.ok(!registered.some((item) => item.curso_id === row.curso_id))
          }
          if (failInsert) {
            await route.fulfill({ status: 403, json: { code: '42501', message: 'RLS rechazó la inserción' } })
          } else {
            const saved = rows.map((row) => ({ ...enrollment(courses.find((course) => course.id === row.curso_id)), id: row.id }))
            registered = [...registered, ...saved]
            await route.fulfill({ status: 201, json: saved })
          }
        } else {
          assert.equal(url.searchParams.get('estudiante_id'), `eq.${studentId}`)
          assert.equal(url.searchParams.get('periodo'), 'eq.2026-II')
          await route.fulfill(failEnrollmentRead ? { status: 403, json: { code: '42501', message: 'Lectura de matrícula rechazada' } } : { json: registered })
        }
      } else if (table === 'horarios') {
        const filter = url.searchParams.get('curso_id')
        assert.ok(filter?.startsWith('in.('))
        await route.fulfill({ json: schedules.filter((item) => filter.includes(item.curso_id)) })
      } else throw new Error(`Tabla inesperada: ${table}`)
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('http://127.0.0.1:5173/#servicios', { waitUntil: 'networkidle' })
    await page.locator('.navigation-link[href="#iniciar-sesion"]').click()
    const login = page.getByRole('dialog', { name: 'Iniciar sesión', exact: true })
    await login.getByLabel('Correo electrónico', { exact: true }).fill(user.email)
    await login.getByLabel('Contraseña', { exact: true }).fill('password-de-prueba')
    await login.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
    await expect(page.locator('#auth-dialog')).toHaveCount(0)
    await page.goto('http://127.0.0.1:5173/#portal/matricula')
    const career = page.getByLabel('Carrera profesional', { exact: true })
    await expect(career).toBeEnabled()
    assert.equal(await career.locator('option').count(), 2)
    await career.selectOption(courses[0].carrera)
    const semester = page.getByLabel('Semestre', { exact: true })
    assert.equal(await semester.locator('option').count(), 11)
    await semester.selectOption('1')
    await expect(page.locator('.enrollment-table tbody tr')).toHaveCount(5)
    const first = page.getByRole('checkbox', { name: /Seleccionar Curso de prueba 1/ })
    await first.focus()
    await first.press('Space')
    await expect(page.locator('.enrollment-total')).toContainText('4 créditos')
    const confirm = page.getByRole('button', { name: /Confirmar matrícula de/ })
    failInsert = true
    await confirm.click()
    await expect(page.locator('.enrollment-error')).toContainText('No se pudo confirmar')
    assert.equal(registered.length, 0)
    failInsert = false
    await confirm.click()
    await expect(page.locator('.enrollment-locked-message')).toContainText('Matrícula confirmada: 1 curso')
    await expect(page.locator('.enrollment-locked-message')).toBeFocused()
    await expect(career).toHaveCount(0)
    await expect(confirm).toHaveCount(0)
    assert.equal(insertions.length, 2)
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    assert.deepEqual(audit.violations.map((item) => item.id), [])
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.screenshot({ path: `artifacts/enrollment-${width}.png`, fullPage: true })

    for (const [section, text] of [['mis-cursos', courses[0].nombre], ['mis-creditos', 'Créditos matriculados: 4'], ['mi-horario', 'Lunes']]) {
      await page.locator(`.portal-sidebar a[href="#portal/${section}"]`).click()
      await expect(page.locator('#portal-content')).toContainText(text)
      if (section === 'mi-horario') await expect(page.locator('.student-table tbody tr')).toHaveCount(1)
    }
    await page.locator('.portal-sidebar a[href="#portal/matricula"]').click()
    await expect(page.locator('.enrollment-locked-message')).toContainText('Usted ya se ha matriculado')
    await expect(career).toHaveCount(0)
    await page.reload()
    await expect(page.locator('.enrollment-locked-message')).toContainText('Usted ya se ha matriculado')
    assert.equal(insertions.length, 2)

    registered = []
    await page.reload()
    await expect(career).toBeEnabled()
    await career.selectOption(courses[0].carrera)
    await semester.selectOption('1')
    await first.check()
    registered.push(enrollment(courses[1]))
    await confirm.click()
    await expect(page.locator('.enrollment-locked-message')).toContainText('Usted ya se ha matriculado')
    await expect(career).toHaveCount(0)
    assert.equal(insertions.length, 2)

    registered = []
    await page.reload()
    await expect(career).toBeEnabled()
    await career.selectOption(courses[0].carrera)
    failCatalog = true
    await semester.selectOption('1')
    await expect(page.getByText('No se pudieron cargar los cursos y horarios. Inténtalo nuevamente.')).toBeVisible()
    failCareers = true
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('Supabase denegó el acceso al catálogo de carreras (código 42501)')
    await expect(career).toBeDisabled()
    failEnrollmentRead = true
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('No se pudo comprobar tu matrícula')
    await expect(career).toHaveCount(0)
    assert.deepEqual(errors, [])
    console.log(`Matrícula ${width}px: filtros, teclado, créditos, guardado, duplicados, RLS, vistas y axe verificados con API simulada`)
    await context.close()
  }
} finally {
  await browser.close()
}
