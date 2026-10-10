import { useId, useRef } from 'react'
import type { Enrollment } from '../../lib/student-data'
import { formatGrade, isComplete, type ConsolidatedGrades } from '../../lib/grades-data'
import StudentTable from './StudentTable'
import './StudentGrades.css'

function CourseGrades({ enrollment, grades }: { enrollment: Enrollment; grades?: ConsolidatedGrades }) {
  const headingId = useId()
  const sectionRef = useRef<HTMLElement>(null)
  const c1 = [grades?.c1_nota1, grades?.c1_nota2, grades?.c1_nota3]
  const c2 = [grades?.c2_nota1, grades?.c2_nota2, grades?.c2_nota3]
  const anyGrade = [...c1, ...c2].some((value) => value != null)
  const title = enrollment.curso?.nombre ?? 'Curso sin nombre disponible'
  const average1 = isComplete(c1) ? formatGrade(grades?.promedio_c1) : 'Pendiente'
  const average2 = isComplete(c2) ? formatGrade(grades?.promedio_c2) : 'Pendiente'
  const final = isComplete([...c1, ...c2]) ? formatGrade(grades?.nota_final) : 'Pendiente'
  const context = `Curso ${title}. Código ${enrollment.curso?.codigo ?? 'no disponible'}. Periodo académico ${enrollment.periodo ?? 'no disponible'}.`
  const consolidatedLabel = (index: number, values: typeof c1, average: string) => `Notas del consolidado ${index}. ${values.map((value, criterion) => `Nota del criterio ${criterion + 1}: ${formatGrade(value)}`).join('. ')}. Promedio del consolidado ${index}: ${average}.`
  return (
    <section ref={sectionRef} className="student-course-grades" aria-labelledby={headingId} aria-describedby={`${headingId}-summary`} tabIndex={0} onKeyDown={(event) => {
      if (event.key === 'Enter' && event.target === event.currentTarget) { event.preventDefault(); sectionRef.current?.querySelector<HTMLButtonElement>('.table-entry-button')?.focus() }
    }}>
      <h3 id={headingId}>{title}</h3>
      <p id={`${headingId}-summary`} className="screen-reader-only">{context} {anyGrade ? `${consolidatedLabel(1, c1, average1)} ${consolidatedLabel(2, c2, average2)} Nota final: ${final}.` : 'Aún no se han registrado notas para este curso.'}</p>
      <p>Código: {enrollment.curso?.codigo ?? 'No disponible'} · Periodo: {enrollment.periodo ?? 'No disponible'}</p>
      {!anyGrade && <p>Aún no se han registrado notas para este curso</p>}
      <StudentTable caption={`Calificaciones de ${title}, periodo ${enrollment.periodo ?? 'no disponible'}`} columns={['Consolidado', 'Criterio 1', 'Criterio 2', 'Criterio 3', 'Promedio']} rows={[
        { id: 'c1', accessibleLabel: `${context} ${consolidatedLabel(1, c1, average1)}`, cellLabels: [`${context} Consolidado 1.`, ...c1.map((value, index) => `${context} Consolidado 1. Nota del criterio ${index + 1}: ${formatGrade(value)}.`), `${context} Promedio del consolidado 1: ${average1}.`], cells: ['Consolidado 1', ...c1.map(formatGrade), average1] },
        { id: 'c2', accessibleLabel: `${context} ${consolidatedLabel(2, c2, average2)}`, cellLabels: [`${context} Consolidado 2.`, ...c2.map((value, index) => `${context} Consolidado 2. Nota del criterio ${index + 1}: ${formatGrade(value)}.`), `${context} Promedio del consolidado 2: ${average2}.`], cells: ['Consolidado 2', ...c2.map(formatGrade), average2] },
      ]} />
      <p className="student-final-grade" tabIndex={0} role="group" aria-label={`${context} Nota final: ${final}.`}>Nota final: <strong>{final}</strong></p>
    </section>
  )
}

export default function StudentGrades({ enrollments, grades }: { enrollments: Enrollment[]; grades: ConsolidatedGrades[] }) {
  if (!enrollments.length) return <p role="status" aria-live="polite">Aún no tienes cursos matriculados</p>
  const byEnrollment = new Map(grades.map((item) => [item.matricula_id, item]))
  return <div className="student-grades-list">{enrollments.map((item) => <CourseGrades key={item.id} enrollment={item} grades={byEnrollment.get(item.id)} />)}</div>
}
