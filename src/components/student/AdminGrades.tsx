import { useEffect, useState } from 'react'
import { RotateCw } from 'lucide-react'
import { useAuth } from '../../context/auth-context'
import { getMasterStudents, gradeErrorMessage, type Student } from '../../lib/grades-data'
import { getEnrollments, type Enrollment } from '../../lib/student-data'
import GradeEditor from './GradeEditor'
import './AdminGrades.css'

function searchText(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es') }
function studentLabel(student: Student) { return `${student.nombre ?? ''} ${student.apellidos ?? ''}`.trim() || 'Nombre no disponible' }

export default function AdminGrades() {
  const { user, role } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [studentId, setStudentId] = useState('')
  const [enrollmentId, setEnrollmentId] = useState('')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [studentLoading, setStudentLoading] = useState(true)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [studentError, setStudentError] = useState('')
  const [enrollmentError, setEnrollmentError] = useState('')
  const [retry, setRetry] = useState(0)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!user || role !== 'master') return
    const controller = new AbortController()
    setStudentLoading(true)
    setStudentError('')
    getMasterStudents(controller.signal).then((values) => {
      if (!controller.signal.aborted) setStudents(values)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setStudentError(gradeErrorMessage(error, 'No se pudieron cargar los estudiantes.'))
    }).finally(() => { if (!controller.signal.aborted) setStudentLoading(false) })
    return () => controller.abort()
  }, [user?.id, role, retry])

  useEffect(() => {
    if (!studentId || !user || role !== 'master') return
    const controller = new AbortController()
    setEnrollmentLoading(true)
    setEnrollmentError('')
    getEnrollments(studentId, controller.signal).then((values) => {
      if (!controller.signal.aborted) setEnrollments(values)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setEnrollmentError(gradeErrorMessage(error, 'No se pudieron cargar las matrículas del estudiante.'))
    }).finally(() => { if (!controller.signal.aborted) setEnrollmentLoading(false) })
    return () => controller.abort()
  }, [studentId, user?.id, role, retry])

  if (!user || role !== 'master') return <p role="status">No tienes acceso a la administración de notas.</p>
  const query = searchText(search.trim())
  const filtered = students.filter((item) => searchText(`${studentLabel(item)} ${item.codigo_universitario ?? ''}`).includes(query))
  const selectedStudent = students.find((item) => item.id === studentId)
  const visibleStudents = selectedStudent && !filtered.some((item) => item.id === studentId) ? [selectedStudent, ...filtered] : filtered
  const selectedEnrollment = enrollments.find((item) => item.id === enrollmentId)
  function mayChange() { return !busy && (!dirty || window.confirm('Hay calificaciones sin guardar. ¿Descartar esos cambios?')) }

  return (
    <div className="admin-grades">
      <fieldset className="grade-selector" disabled={busy}>
        <legend className="screen-reader-only">Seleccionar estudiante y matrícula para administrar notas</legend>
        <div className="grade-selection-grid">
          <div><label htmlFor="grade-student-search">Buscar estudiante</label><input id="grade-student-search" type="search" value={search} disabled={studentLoading || !!studentError} aria-describedby="grade-search-help grade-student-count" onChange={(event) => setSearch(event.target.value)} />
            <p id="grade-search-help" className="screen-reader-only">Escribe el nombre, apellidos o código universitario. Las opciones del desplegable Estudiante se filtrarán automáticamente.</p>
          </div>
          <div><label htmlFor="grade-student">Estudiante</label><select id="grade-student" value={studentId} disabled={studentLoading || !!studentError} aria-describedby="grade-student-help" onChange={(event) => {
            if (!mayChange()) return
            setStudentId(event.target.value); setEnrollmentId(''); setEnrollments([]); setEnrollmentError(''); setDirty(false)
          }}>
            <option value="">Selecciona un estudiante</option>
            {visibleStudents.map((item) => <option key={item.id} value={item.id}>{studentLabel(item)} · {item.codigo_universitario ?? 'Sin código'}</option>)}
          </select><p id="grade-student-help" className="screen-reader-only">Selecciona al estudiante. Sus cursos matriculados se cargarán automáticamente; recorre la lista con las flechas y confirma tu selección.</p></div>
        </div>
        <p id="grade-student-count" role="status" aria-live="polite">{studentLoading ? 'Cargando estudiantes...' : !studentError ? `${filtered.length} estudiantes encontrados` : ''}</p>
        {studentError && <div role="alert"><p>{studentError}</p><button type="button" className="portal-retry" onClick={() => setRetry((value) => value + 1)}><RotateCw size={18} aria-hidden="true" />Reintentar</button></div>}
        {studentId && <div className="grade-course-selector"><label htmlFor="grade-enrollment">Curso matriculado y periodo</label><select id="grade-enrollment" value={enrollmentId} disabled={enrollmentLoading || !!enrollmentError || !enrollments.length} aria-describedby="grade-enrollment-help" onChange={(event) => {
          if (!mayChange()) return
          setEnrollmentId(event.target.value); setDirty(false)
        }}>
          <option value="">Selecciona un curso matriculado</option>
          {enrollments.map((item) => <option key={item.id} value={item.id}>{item.curso?.codigo ?? 'Sin código'} · {item.curso?.nombre ?? 'Curso no disponible'} · {item.periodo ?? 'Periodo no disponible'}</option>)}
        </select><p id="grade-enrollment-help" className="screen-reader-only">Elige el curso y periodo de la matrícula. Se cargarán sus seis criterios de evaluación y los promedios guardados.</p>
          <p role="status" aria-live="polite">{enrollmentLoading ? 'Cargando cursos matriculados...' : !enrollmentError ? enrollments.length ? `${enrollments.length} matrículas disponibles` : 'Este estudiante aún no tiene cursos matriculados.' : ''}</p>
          {enrollmentError && <div role="alert"><p>{enrollmentError}</p><button type="button" className="portal-retry" onClick={() => setRetry((value) => value + 1)}><RotateCw size={18} aria-hidden="true" />Reintentar</button></div>}
        </div>}
      </fieldset>
      {selectedEnrollment && !enrollmentLoading && !enrollmentError && <section aria-labelledby="grade-edit-title">
        <h3 id="grade-edit-title">{selectedEnrollment.curso?.nombre ?? 'Calificaciones del curso'}</h3>
        <p>{selectedStudent ? studentLabel(selectedStudent) : ''} · {selectedEnrollment.curso?.codigo ?? 'Sin código'} · {selectedEnrollment.periodo ?? 'Periodo no disponible'}</p>
        <GradeEditor key={enrollmentId} userId={user.id} enrollmentId={enrollmentId} onBusyChange={setBusy} onDirtyChange={setDirty} />
      </section>}
    </div>
  )
}
