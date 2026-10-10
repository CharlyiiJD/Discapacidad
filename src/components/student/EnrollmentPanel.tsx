import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, RotateCw } from 'lucide-react'
import { useAuth } from '../../context/auth-context'
import { createEnrollments, ENROLLMENT_PERIOD, getAvailableCourses, getCareers, getEnrollments, getSchedules, type Course, type Enrollment, type Schedule } from '../../lib/student-data'
import { hasCompleteSchedule, schedulesOverlap, weekDays } from '../../lib/enrollment-utils'
import './EnrollmentPanel.css'

type Catalog = { userId: string; career: string; semester: string; courses: Course[]; schedules: Schedule[]; enrollments: Enrollment[] }

function careerErrorMessage(error: unknown) {
  const details = typeof error === 'object' && error !== null ? error as { code?: unknown; status?: unknown } : null
  if (details?.code === '42501' || details?.status === 403) {
    const code = typeof details.code === 'string' ? ` (código ${details.code})` : ''
    return `Supabase denegó el acceso al catálogo de carreras${code}. Se deben revisar los permisos de lectura de cursos para usuarios autenticados. Reintentar no corrige los permisos.`
  }
  if (details?.status === 401) return 'Tu sesión no permite consultar las carreras. Cierra sesión y vuelve a iniciar sesión.'
  return 'No se pudieron cargar las carreras. Comprueba tu conexión e inténtalo nuevamente.'
}

export default function EnrollmentPanel({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth()
  const [careers, setCareers] = useState<string[]>([])
  const [career, setCareer] = useState('')
  const [semester, setSemester] = useState('')
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [careerLoading, setCareerLoading] = useState(true)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [careerError, setCareerError] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [message, setMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const [enrollmentCheck, setEnrollmentCheck] = useState<{ userId: string; enrollments: Enrollment[]; error: string } | null>(null)
  const busyRef = useRef(false)
  const submissionRef = useRef<AbortController | null>(null)
  const lockedMessageRef = useRef<HTMLParagraphElement>(null)
  const checked = user && enrollmentCheck?.userId === user.id ? enrollmentCheck : null
  const canEnroll = Boolean(checked && !checked.error && checked.enrollments.length === 0)

  useEffect(() => () => submissionRef.current?.abort(), [])

  useEffect(() => {
    if (!user) return
    const userId = user.id
    const controller = new AbortController()
    setEnrollmentCheck(null)
    getEnrollments(userId, controller.signal, ENROLLMENT_PERIOD).then((enrollments) => {
      if (!controller.signal.aborted) setEnrollmentCheck({ userId, enrollments, error: '' })
    }).catch(() => {
      if (!controller.signal.aborted) setEnrollmentCheck({ userId, enrollments: [], error: 'No se pudo comprobar tu matrícula. Inténtalo nuevamente antes de seleccionar cursos.' })
    })
    return () => controller.abort()
  }, [user?.id, retry])

  useEffect(() => {
    if (!user || !canEnroll) return
    const controller = new AbortController()
    setCareerLoading(true)
    setCareerError('')
    getCareers(controller.signal).then((values) => {
      if (!controller.signal.aborted) setCareers(values)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setCareerError(careerErrorMessage(error))
    }).finally(() => {
      if (!controller.signal.aborted) setCareerLoading(false)
    })
    return () => controller.abort()
  }, [user?.id, retry, canEnroll])

  useEffect(() => {
    if (!user || !canEnroll || !career || !semester) return
    const userId = user.id
    const controller = new AbortController()
    setCatalogLoading(true)
    setCatalogError('')
    setSelectedIds([])
    async function load() {
      try {
        const [courses, enrollments] = await Promise.all([
          getAvailableCourses(career, Number(semester), controller.signal),
          getEnrollments(userId, controller.signal, ENROLLMENT_PERIOD),
        ])
        if (enrollments.length) {
          if (!controller.signal.aborted) { setEnrollmentCheck({ userId, enrollments, error: '' }); setMessage('') }
          return
        }
        const courseIds = [...new Set([...courses.map((item) => item.id), ...enrollments.map((item) => item.curso_id)])]
        const schedules = await getSchedules(courseIds, controller.signal)
        if (!controller.signal.aborted) setCatalog({ userId, career, semester, courses, schedules, enrollments })
      } catch {
        if (!controller.signal.aborted) setCatalogError('No se pudieron cargar los cursos y horarios. Inténtalo nuevamente.')
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [user?.id, career, semester, retry, canEnroll])

  const current = catalog && catalog.userId === user?.id && catalog.career === career && catalog.semester === semester ? catalog : null
  const enrolledIds = new Set(current?.enrollments.map((item) => item.curso_id) ?? [])
  const existingSchedules = current?.schedules.filter((item) => enrolledIds.has(item.curso_id)) ?? []
  const courseSchedules = (id: string) => current?.schedules.filter((item) => item.curso_id === id) ?? []
  const eligible = current?.courses.filter((course) => !enrolledIds.has(course.id) && course.creditos != null && hasCompleteSchedule(courseSchedules(course.id)) && !courseSchedules(course.id).some((schedule) => existingSchedules.some((existing) => schedulesOverlap(schedule, existing)))) ?? []
  const selectedCourses = eligible.filter((course) => selectedIds.includes(course.id))
  const credits = selectedCourses.reduce((sum, course) => sum + (course.creditos ?? 0), 0)
  const waitingForCatalog = Boolean(career && semester && (catalogLoading || (!current && !catalogError)))
  const allRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = selectedCourses.length > 0 && selectedCourses.length < eligible.length
  }, [selectedCourses.length, eligible.length])

  function resetSelection() {
    setSelectedIds([])
    setMessage('')
    setSubmitError('')
    setCatalogError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current || !user || !canEnroll || !current || !selectedCourses.length) return
    const controller = new AbortController()
    submissionRef.current = controller
    busyRef.current = true
    setBusy(true)
    setSubmitError('')
    setMessage('Guardando tu matrícula. Por favor, espera.')
    try {
      const latest = await getEnrollments(user.id, controller.signal, ENROLLMENT_PERIOD)
      if (latest.length) {
        if (!controller.signal.aborted) {
          setEnrollmentCheck({ userId: user.id, enrollments: latest, error: '' })
          setSelectedIds([])
          setMessage('')
          onSaved()
          requestAnimationFrame(() => lockedMessageRef.current?.focus())
        }
        return
      }
      const registered = new Set(latest.map((item) => item.curso_id))
      const pending = selectedCourses.filter((item) => !registered.has(item.id))
      const enrolledSchedules = await getSchedules([...registered], controller.signal)
      const proposed = current.schedules.filter((item) => pending.some((course) => course.id === item.curso_id))
      const conflict = proposed.some((schedule, index) => [...enrolledSchedules, ...proposed.slice(index + 1)].some((other) => schedulesOverlap(schedule, other)))
      if (conflict) {
        if (!controller.signal.aborted) {
          setCatalog({ ...current, enrollments: latest, schedules: [...current.schedules.filter((item) => !registered.has(item.curso_id)), ...enrolledSchedules] })
          setMessage('')
          setSubmitError('Hay un cruce de horarios entre los cursos seleccionados o con tu matrícula actual. Revisa tu selección.')
        }
        return
      }
      const inserted = await createEnrollments(user.id, pending.map((item) => item.id), controller.signal)
      if (!controller.signal.aborted) {
        setCatalog({ ...current, enrollments: [...latest, ...inserted], schedules: [...current.schedules.filter((item) => !registered.has(item.curso_id)), ...enrolledSchedules] })
        setSelectedIds([])
        setEnrollmentCheck({ userId: user.id, enrollments: inserted, error: '' })
        setMessage(`Matrícula confirmada: ${inserted.length} ${inserted.length === 1 ? 'curso registrado' : 'cursos registrados'} en ${ENROLLMENT_PERIOD}. Usted ya se ha matriculado para este periodo.`)
        onSaved()
        requestAnimationFrame(() => lockedMessageRef.current?.focus())
      }
    } catch {
      if (!controller.signal.aborted) {
        setMessage('')
        setSubmitError('No se pudo confirmar tu matrícula. Revisa tu sesión e inténtalo nuevamente. No se confirmó el guardado de los cursos.')
        try {
          const enrollments = await getEnrollments(user.id, controller.signal, ENROLLMENT_PERIOD)
          if (!controller.signal.aborted && enrollments.length) {
            setEnrollmentCheck({ userId: user.id, enrollments, error: '' })
            setSelectedIds([])
            onSaved()
            requestAnimationFrame(() => lockedMessageRef.current?.focus())
          }
        } catch {
          // Keep the error visible if the server state cannot be verified.
        }
      }
    } finally {
      busyRef.current = false
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  if (!checked) return <p role="status" aria-live="polite">Comprobando tu matrícula para {ENROLLMENT_PERIOD}...</p>
  if (checked.error) return <div role="alert"><p>{checked.error}</p><button type="button" className="portal-retry" onClick={() => setRetry((value) => value + 1)} aria-label="Reintentar la comprobación de tu matrícula"><RotateCw size={18} aria-hidden="true" />Reintentar</button></div>
  if (checked.enrollments.length) return (
    <section className="enrollment-form" aria-label="Matrícula confirmada">
      <p ref={lockedMessageRef} tabIndex={-1} className="enrollment-locked-message" role="status" aria-live="polite" aria-atomic="true">{message || `Usted ya se ha matriculado para el periodo ${ENROLLMENT_PERIOD}.`}</p>
      <p>Tu matrícula está confirmada. No puedes añadir cursos ni cambiar de carrera o semestre desde esta sección.</p>
      <div className="enrollment-locked-links">
        <a href="#portal/mis-cursos" aria-label="Mis cursos, consultar los cursos de tu matrícula confirmada">Mis cursos</a>
        <a href="#portal/mi-horario" aria-label="Mi horario, consultar las clases de tu matrícula confirmada">Mi horario</a>
      </div>
    </section>
  )

  return (
    <form className="enrollment-form" onSubmit={handleSubmit} aria-label="Formulario de matrícula académica" aria-describedby="enrollment-period enrollment-help">
      <p id="enrollment-period" className="enrollment-period">Periodo académico: <strong>{ENROLLMENT_PERIOD}</strong></p>
      <p id="enrollment-help" className="screen-reader-only">Elige tu carrera y semestre. Selecciona los cursos con las casillas de verificación y usa Confirmar matrícula para registrar tu selección. Puedes marcar las casillas con la barra espaciadora.</p>
      <fieldset className="enrollment-controls" disabled={busy}>
        <legend className="screen-reader-only">Carrera y semestre de matrícula</legend>
        <div className="enrollment-filters">
          <div>
            <label htmlFor="enrollment-career">Carrera profesional</label>
            <select id="enrollment-career" value={career} required disabled={careerLoading || !!careerError} aria-describedby="enrollment-career-help" onChange={(event) => { setCareer(event.target.value); setSemester(''); resetSelection() }}>
              <option value="">Selecciona tu carrera</option>
              {careers.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <p id="enrollment-career-help" className="screen-reader-only">Selecciona tu carrera profesional. Abre la lista con Enter o Alt y flecha abajo, recorre las opciones con las flechas y confirma con Enter.</p>
          </div>
          <div>
            <label htmlFor="enrollment-semester">Semestre</label>
            <select id="enrollment-semester" value={semester} required disabled={!career || careerLoading || !!careerError} aria-describedby="enrollment-semester-help" onChange={(event) => { setSemester(event.target.value); resetSelection() }}>
              <option value="">Selecciona el semestre</option>
              {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>Semestre {index + 1}</option>)}
            </select>
            <p id="enrollment-semester-help" className="screen-reader-only">Selecciona el semestre del plan de estudios, del uno al diez. La lista de cursos y horarios se actualizará automáticamente.</p>
          </div>
        </div>
        {careerLoading && <p role="status">Cargando carreras...</p>}
        {careerError && <div role="alert"><p>{careerError}</p><button type="button" className="portal-retry" onClick={() => setRetry((value) => value + 1)}><RotateCw size={18} aria-hidden="true" />Reintentar</button></div>}
        {!careerLoading && !careerError && !careers.length && <p role="status">Aún no hay carreras disponibles para matrícula.</p>}
        {waitingForCatalog && <p role="status">Cargando cursos y horarios...</p>}
        {catalogError && <div role="alert"><p>{catalogError}</p><button type="button" className="portal-retry" onClick={() => setRetry((value) => value + 1)}><RotateCw size={18} aria-hidden="true" />Reintentar</button></div>}
        {current && !waitingForCatalog && !catalogError && (
          <fieldset className="enrollment-courses">
            <legend>Cursos disponibles</legend>
            {current.courses.length ? <>
              <label className="enrollment-select-all"><input ref={allRef} type="checkbox" checked={eligible.length > 0 && selectedCourses.length === eligible.length} disabled={!eligible.length} onChange={(event) => { setSelectedIds(event.target.checked ? eligible.map((item) => item.id) : []); setMessage(''); setSubmitError('') }} />Seleccionar todos los cursos disponibles</label>
              <div className="student-table-scroll" role="region" aria-label="Cursos y horarios disponibles para matrícula" tabIndex={0}>
                <table className="student-table enrollment-table">
                  <caption className="screen-reader-only">Cursos de {career}, semestre {semester}, con créditos y horarios</caption>
                  <thead><tr>{['Seleccionar', 'Código', 'Curso', 'Créditos', 'Día', 'Inicio', 'Fin', 'Estado'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
                  <tbody>{current.courses.map((course) => {
                    const schedules = courseSchedules(course.id)
                    const registered = enrolledIds.has(course.id)
                    const available = eligible.some((item) => item.id === course.id)
                    const status = registered ? 'Matriculado' : !hasCompleteSchedule(schedules) ? 'Horario no disponible' : course.creditos == null ? 'Créditos no disponibles' : !available ? 'Cruce de horario' : 'Disponible'
                    return <tr key={course.id}>
                      <td><input type="checkbox" checked={selectedCourses.some((item) => item.id === course.id)} disabled={!available} aria-label={`Seleccionar ${course.nombre ?? 'curso'} (${course.codigo ?? 'sin código'}), ${course.creditos ?? 'sin'} créditos. ${status}. ${schedules.map((item) => `${weekDays[(item.dia_semana ?? 0) - 1] ?? 'Día no disponible'}, de ${item.hora_inicio?.slice(0, 5) ?? 'hora no disponible'} a ${item.hora_fin?.slice(0, 5) ?? 'hora no disponible'}`).join('. ')}`} onChange={(event) => { setSelectedIds((ids) => event.target.checked ? [...ids, course.id] : ids.filter((id) => id !== course.id)); setMessage(''); setSubmitError('') }} /></td>
                      <td>{course.codigo ?? 'No disponible'}</td><td>{course.nombre ?? 'No disponible'}</td><td>{course.creditos ?? 'No disponible'}</td>
                      <td>{schedules.length ? schedules.map((item) => <div key={item.id}>{item.dia_semana ? weekDays[item.dia_semana - 1] ?? 'No disponible' : 'No disponible'}</div>) : 'No disponible'}</td>
                      <td>{schedules.length ? schedules.map((item) => <div key={item.id}>{item.hora_inicio?.slice(0, 5) ?? 'No disponible'}</div>) : 'No disponible'}</td>
                      <td>{schedules.length ? schedules.map((item) => <div key={item.id}>{item.hora_fin?.slice(0, 5) ?? 'No disponible'}</div>) : 'No disponible'}</td>
                      <td><span className={registered ? 'enrollment-registered' : ''}>{registered && <Check size={15} aria-hidden="true" />}{status}</span></td>
                    </tr>
                  })}</tbody>
                </table>
              </div>
            </> : <p role="status">Aún no hay cursos disponibles para esta carrera y semestre.</p>}
          </fieldset>
        )}
      </fieldset>
      {current && !waitingForCatalog && !catalogError && <div className="enrollment-confirmation">
        <p className="enrollment-total" aria-live="polite" aria-atomic="true">{selectedCourses.length} {selectedCourses.length === 1 ? 'curso seleccionado' : 'cursos seleccionados'} · <strong>{credits} créditos</strong></p>
        <button className="enrollment-submit" type="submit" disabled={busy || !selectedCourses.length} aria-label={`Confirmar matrícula de ${selectedCourses.length} cursos y ${credits} créditos en ${ENROLLMENT_PERIOD}`}>{busy ? 'Guardando matrícula...' : 'Confirmar matrícula'}</button>
      </div>}
      <p className="enrollment-message" role="status" aria-live="polite" aria-atomic="true">{message}</p>
      <p className="enrollment-error" role="alert">{submitError}</p>
    </form>
  )
}
