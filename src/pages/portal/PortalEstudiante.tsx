import { useEffect, useRef, useState } from 'react'
import { BookOpen, NotebookPen, CalendarDays, Coins, RotateCw, ClipboardList, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/auth-context'
import { ENROLLMENT_PERIOD, getEnrollments, getSchedules, type Enrollment, type Schedule } from '../../lib/student-data'
import { getStudentConsolidatedGrades, type ConsolidatedGrades } from '../../lib/grades-data'
import EnrollmentPanel from '../../components/student/EnrollmentPanel'
import StudentGrades from '../../components/student/StudentGrades'
import AdminGrades from '../../components/student/AdminGrades'
import StudentSchedule from '../../components/student/StudentSchedule'
import StudentTable, { type StudentRow } from '../../components/student/StudentTable'
import './PortalEstudiante.css'

const sections = [
  { id: 'matricula', label: 'Matrícula', Icon: ClipboardList },
  { id: 'mis-cursos', label: 'Mis cursos', Icon: BookOpen },
  { id: 'mis-notas', label: 'Mis notas', Icon: NotebookPen },
  { id: 'mi-horario', label: 'Mi horario', Icon: CalendarDays },
  { id: 'mis-creditos', label: 'Mis créditos', Icon: Coins },
  { id: 'administrar-notas', label: 'Administrar notas', Icon: ShieldCheck },
] as const
type SectionId = (typeof sections)[number]['id']
type AcademicData = { userId: string; section: SectionId; enrollments: Enrollment[]; grades: ConsolidatedGrades[]; schedules: Schedule[] }

function getSection(): SectionId | null {
  const id = window.location.hash.split('/')[1]
  return sections.some((section) => section.id === id) ? id as SectionId : null
}

const display = (value: string | number | null | undefined) => value ?? 'No disponible'

export default function PortalEstudiante() {
  const { user, loading: authLoading, role, roleLoading, roleError, retryRole } = useAuth()
  const [selected, setSelected] = useState(getSection)
  const [data, setData] = useState<AcademicData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const contentRef = useRef<HTMLElement>(null)
  const title = sections.find((section) => section.id === selected)?.label

  useEffect(() => {
    const update = () => setSelected(getSection())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  useEffect(() => {
    if (!user || !selected || selected === 'matricula' || selected === 'administrar-notas') return
    const userId = user.id
    const section = selected
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setData(null)
    contentRef.current?.focus({ preventScroll: true })
    async function load() {
      try {
        const enrollments = await getEnrollments(userId, controller.signal, section === 'mis-notas' ? undefined : ENROLLMENT_PERIOD)
        const grades = section === 'mis-notas' ? await getStudentConsolidatedGrades(userId, controller.signal) : []
        const schedules = section === 'mi-horario' ? await getSchedules([...new Set(enrollments.map((enrollment) => enrollment.curso_id))], controller.signal) : []
        if (!controller.signal.aborted) setData({ userId, section, enrollments, grades, schedules })
      } catch {
        if (!controller.signal.aborted) setError('No se pudo cargar tu información. Inténtalo nuevamente.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [user?.id, selected, retry])

  useEffect(() => {
    if (selected === 'matricula' || selected === 'administrar-notas') contentRef.current?.focus({ preventScroll: true })
  }, [selected])

  if (authLoading) return <p className="portal-access" role="status">Comprobando tu sesión...</p>
  if (!user) return (
    <section className="portal-access" aria-labelledby="portal-access-title">
      <h2 id="portal-access-title">Portal del estudiante</h2>
      <p>Inicia sesión para consultar tu información académica.</p>
      <a href="#iniciar-sesion" className="section-action" aria-label="Iniciar sesión, abrir el formulario para acceder al portal del estudiante">Iniciar sesión</a>
    </section>
  )

  const currentData = data?.userId === user.id && data.section === selected ? data : null
  let rows: StudentRow[] = []
  let columns: string[] = []
  let empty = 'Aún no tienes cursos matriculados'
  if (currentData) {
    if (selected === 'mis-cursos') {
      columns = ['Código', 'Curso', 'Créditos', 'Periodo', 'Estado']
      rows = currentData.enrollments.map((item) => ({ id: item.id, cells: [display(item.curso?.codigo), display(item.curso?.nombre), display(item.curso?.creditos), display(item.periodo), display(item.estado)] }))
    } else if (selected === 'mis-creditos') {
      columns = ['Periodo', 'Cursos matriculados', 'Créditos registrados']
      const periods = new Map<string, Enrollment[]>()
      const uniqueEnrollments = [...new Map(currentData.enrollments.map((item) => [`${item.periodo}:${item.curso_id}`, item])).values()]
      for (const item of uniqueEnrollments) {
        const period = item.periodo ?? 'Sin periodo'
        periods.set(period, [...(periods.get(period) ?? []), item])
      }
      rows = [...periods].map(([period, items]) => ({ id: period, cells: [period, items.length, items.every((item) => item.curso?.creditos != null) ? items.reduce((total, item) => total + item.curso!.creditos!, 0) : 'No disponible'] }))
    }
  }

  return (
    <div className="student-portal">
      <aside className="portal-sidebar">
        <h2>Portal del estudiante</h2>
        <nav aria-label="Secciones de tu información académica">
          <ul role="list">{sections.filter((section) => section.id !== 'administrar-notas' || role === 'master').map(({ id, label, Icon }) => <li key={id}><a href={`#portal/${id}`} aria-current={selected === id ? 'page' : undefined} aria-controls="portal-content" aria-label={`${label}, consultar tu información académica`} onClick={() => { if (selected === id) contentRef.current?.focus({ preventScroll: true }) }}><Icon size={19} aria-hidden="true" /><span>{label}</span></a></li>)}</ul>
        </nav>
        {roleError && <div role="alert"><p>{roleError}</p><button type="button" className="portal-retry" onClick={retryRole} aria-label="Reintentar la verificación de tu rol"><RotateCw size={18} aria-hidden="true" />Reintentar</button></div>}
      </aside>
      <section ref={contentRef} id="portal-content" className="portal-content" tabIndex={-1} aria-labelledby={selected ? 'portal-section-title' : undefined} aria-label={!selected ? 'Contenido del portal del estudiante' : undefined} aria-busy={selected === 'administrar-notas' ? roleLoading : selected && selected !== 'matricula' ? loading || (!currentData && !error) : false}>
        {selected && <>
          <h2 id="portal-section-title">{title}</h2>
          {selected === 'administrar-notas' ? roleLoading ? <p role="status" aria-live="polite">Verificando tu rol...</p> : role !== 'master' ? <p role="status">No tienes acceso a la administración de notas.</p> : <AdminGrades key={user.id} /> : selected === 'matricula' ? <EnrollmentPanel onSaved={() => setRetry((value) => value + 1)} /> : loading || (!currentData && !error) ? <p role="status" aria-live="polite">Cargando tu información...</p> : error ? <div role="alert"><p>{error}</p><button type="button" className="portal-retry" onClick={() => setRetry(retry + 1)} aria-label={`Reintentar la carga de ${title?.toLowerCase()}`}><RotateCw size={18} aria-hidden="true" />Reintentar</button></div> : selected === 'mis-notas' && currentData ? <StudentGrades enrollments={currentData.enrollments} grades={currentData.grades} /> : selected === 'mi-horario' && currentData ? <StudentSchedule enrollments={currentData.enrollments} schedules={currentData.schedules} /> : rows.length ? <>
            {selected === 'mis-creditos' && <p className="portal-credit-note">Créditos de los cursos registrados en tus matrículas, agrupados por periodo.</p>}
            {selected === 'mis-creditos' && <p className="credit-summary">Créditos matriculados: {rows.every((row) => typeof row.cells[2] === 'number') ? rows.reduce((total, row) => total + (row.cells[2] as number), 0) : 'No disponible'}</p>}
            <StudentTable caption={`${title} del estudiante autenticado`} columns={columns} rows={rows} entryColumn={selected === 'mis-cursos' ? 1 : 0} />
          </> : <p className="portal-empty" role="status">{empty}</p>}
        </>}
      </section>
    </div>
  )
}
