import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const studentId = '11111111-1111-4111-8111-111111111111'
const masterId = '33333333-3333-4333-8333-333333333333'
const otherId = '44444444-4444-4444-8444-444444444444'
const course = { id: '22222222-2222-4222-8222-222222222222', codigo: 'CUR-01', nombre: 'Curso de prueba', creditos: 4, ciclo: 1, carrera: 'Carrera de prueba' }
const enrollments = [{ id: 'matricula-prueba', curso_id: course.id, periodo: '2026-II', estado: 'matriculado', curso }, { id: 'matricula-pendiente', curso_id: 'otro-curso', periodo: '2026-I', estado: 'matriculado', curso: { ...course, nombre: 'Curso sin notas', codigo: 'CUR-02' } }]
const fields = ['c1_nota1', 'c1_nota2', 'c1_nota3', 'c2_nota1', 'c2_nota2', 'c2_nota3']
const students = [{ id: studentId, nombre: 'Ana María', apellidos: 'Pérez López', codigo_universitario: '20260001' }, { id: otherId, nombre: 'Luis', apellidos: 'Soto', codigo_universitario: '20260002' }]
let saved = null

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    saved = null
    for (const mode of ['master', 'student']) {
      const id = mode === 'master' ? masterId : studentId
      const user = { id, aud: 'authenticated', role: 'authenticated', email: `${mode}@example.com`, app_metadata: { provider: 'email' }, user_metadata: { nombre: mode }, created_at: '2026-01-01T00:00:00Z' }
      const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`
      const session = { access_token: token, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user }
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
      let failSave = false
      let postCount = 0
      let adminReads = 0
      await context.route('**/auth/v1/**', (route) => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith('/user') ? user : session }))
      await context.route('**/rest/v1/**', async (route) => {
        const request = route.request()
        const url = new URL(request.url())
        const table = url.pathname.split('/').pop()
        if (table === 'roles_usuario') {
          assert.equal(url.searchParams.get('usuario_id'), `eq.${id}`)
          await route.fulfill({ json: mode === 'master' ? [{ rol: 'master' }] : [] })
        } else if (table === 'estudiantes') {
          assert.equal(mode, 'master')
          adminReads++
          await route.fulfill({ json: students })
        } else if (table === 'matriculas') {
          const student = url.searchParams.get('estudiante_id')
          assert.ok(student === `eq.${studentId}` || (mode === 'master' && student === `eq.${otherId}`))
          await route.fulfill({ json: student === `eq.${studentId}` ? enrollments : [] })
        } else if (table === 'consolidados') {
          if (request.method() === 'POST') {
            assert.equal(mode, 'master')
            postCount++
            assert.equal(url.searchParams.get('on_conflict'), 'matricula_id')
            const body = request.postDataJSON()
            assert.deepEqual(Object.keys(body).sort(), ['matricula_id', ...fields].sort())
            assert.equal(body.matricula_id, enrollments[0].id)
            assert.ok(fields.every((field) => body[field] === null || (body[field] >= 0 && body[field] <= 20)))
            if (failSave) {
              await route.fulfill({ status: 403, json: { code: '42501', message: 'Permiso de escritura denegado' } })
              return
            }
            const complete = fields.every((field) => body[field] !== null)
            saved = { id: 'consolidado-unico', ...body, promedio_c1: complete ? '17.25' : null, promedio_c2: complete ? '18.5' : null, nota_final: complete ? '17.875' : null }
            await route.fulfill({ status: 201, json: saved })
          } else if (mode === 'master') {
            assert.equal(url.searchParams.get('matricula_id'), `eq.${enrollments[0].id}`)
            await route.fulfill({ json: saved })
          } else {
            assert.equal(url.searchParams.get('matricula.estudiante_id'), `eq.${studentId}`)
            await route.fulfill({ json: saved ? [saved] : [] })
          }
        } else throw new Error(`Tabla inesperada: ${table}`)
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
      if (mode === 'master') {
        await page.goto('http://127.0.0.1:5173/#portal/administrar-notas')
        await expect(page.locator('.portal-sidebar a[href="#portal/administrar-notas"]')).toBeVisible()
        const search = page.getByLabel('Buscar estudiante', { exact: true })
        const student = page.getByLabel('Estudiante', { exact: true })
        await expect(student).toBeEnabled()
        await search.fill('20260002')
        await expect(student.locator('option')).toHaveCount(2)
        await student.selectOption(otherId)
        await expect(page.getByText('Este estudiante aún no tiene cursos matriculados.')).toBeVisible()
        await search.fill('perez')
        await student.selectOption(studentId)
        const courseSelect = page.getByLabel('Curso matriculado y periodo', { exact: true })
        await expect(courseSelect).toBeEnabled()
        await expect(courseSelect.locator('option')).toHaveCount(3)
        await courseSelect.selectOption(enrollments[0].id)
        const first = page.locator('#grade-c1_nota1')
        await expect(first).toBeVisible()
        await first.focus()
        await first.fill('0')
        const save = page.getByRole('button', { name: 'Guardar calificaciones del curso seleccionado' })
        await save.click()
        await expect(page.locator('.grade-status')).toContainText('Calificaciones guardadas correctamente')
        await expect(page.locator('.grade-editor output').last()).toHaveText('Pendiente')
        assert.equal(saved.c1_nota1, 0)
        assert.equal(saved.c1_nota2, null)
        const completeValues = [17, 17, 17.75, 18, 18, 19.5]
        for (let index = 0; index < fields.length; index++) await page.locator(`#grade-${fields[index]}`).fill(String(completeValues[index]))
        await save.click()
        await expect(page.locator('.grade-status')).toContainText('Calificaciones guardadas correctamente')
        await expect(page.locator('.grade-editor output').last()).toHaveText('17.88')
        assert.equal(postCount, 2)
        await first.fill('21')
        await save.click()
        assert.equal(postCount, 2)
        await first.fill('19')
        failSave = true
        await save.click()
        await expect(page.locator('.grade-error')).toContainText('No se confirmó el guardado')
        await expect(page.locator('.grade-status')).toBeEmpty()
        assert.equal(saved.c1_nota1, 17)
      } else {
        await page.goto('http://127.0.0.1:5173/#portal/mis-notas')
        await expect(page.locator('.student-final-grade')).toHaveCount(2)
        await expect(page.locator('.student-course-grades').first()).toContainText('17.88')
        await expect(page.getByText('Aún no se han registrado notas para este curso', { exact: true })).toBeVisible()
        await expect(page.locator('.portal-sidebar a[href="#portal/administrar-notas"]')).toHaveCount(0)
        await expect(page.locator('#portal-content input')).toHaveCount(0)
        assert.equal(adminReads, 0)
        assert.equal(postCount, 0)
      }
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      assert.deepEqual(audit.violations.map((item) => item.id), [])
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await page.screenshot({ path: `artifacts/grades-${mode}-${width}.png`, fullPage: true })
      if (mode === 'student') {
        await page.goto('http://127.0.0.1:5173/#portal/administrar-notas')
        await expect(page.getByText('No tienes acceso a la administración de notas.')).toBeVisible()
        assert.equal(adminReads, 0)
      }
      assert.deepEqual(errors, [])
      console.log(`Calificaciones ${mode} ${width}px: API simulada, permisos de interfaz, criterios, guardado, errores y accesibilidad comprobados`)
      await context.close()
    }
  }
} finally {
  await browser.close()
}
