import { useRef } from 'react'
import { weekDays } from '../../lib/enrollment-utils'
import type { Enrollment, Schedule } from '../../lib/student-data'
import StudentTable from './StudentTable'
import './StudentSchedule.css'

function minutes(value: string | null) {
  if (!value) return NaN
  const timestamp = Date.parse(`1970-01-01T${value}Z`)
  return (timestamp - Date.UTC(1970, 0, 1)) / 60000
}
function clock(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`
}

export default function StudentSchedule({ enrollments, schedules }: { enrollments: Enrollment[]; schedules: Schedule[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const courses = new Map(enrollments.map((item) => [item.curso_id, item.curso]))
  const ownSchedules = schedules.filter((item) => courses.has(item.curso_id))
  if (!ownSchedules.length) return <p role="status">{enrollments.length ? 'Aún no hay horarios registrados para tus cursos' : 'Aún no tienes cursos matriculados'}</p>

  const valid = ownSchedules.filter((item) => item.dia_semana != null && Number.isInteger(item.dia_semana) && item.dia_semana >= 1 && item.dia_semana <= 7 && Number.isFinite(minutes(item.hora_inicio)) && minutes(item.hora_inicio) >= 0 && minutes(item.hora_fin) <= 1440 && minutes(item.hora_inicio) < minutes(item.hora_fin))
  const boundaries = [...new Set([480, 540, 600, 660, 720, 780, 840, ...valid.flatMap((item) => [minutes(item.hora_inicio), minutes(item.hora_fin)])])].sort((a, b) => a - b)
  const days = [1, 2, 3, 4, 5, ...[6, 7].filter((day) => valid.some((item) => item.dia_semana === day))]
  const cells = boundaries.slice(0, -1).map((start, index) => days.map((day) => valid.filter((item) => item.dia_semana === day && minutes(item.hora_inicio) < boundaries[index + 1] && minutes(item.hora_fin) > start)))
  const signature = (items: Schedule[]) => items.map((item) => item.id).sort().join('|')
  const courseIds = [...courses.keys()].sort()
  const colorFor = (id: string) => courseIds.indexOf(id) % 5

  return (
    <div className="student-schedule">
      {valid.length !== ownSchedules.length && <p role="status">Algunos horarios tienen datos incompletos. Puedes consultarlos en el detalle del horario.</p>}
      <div className="student-table-scroll" role="region" aria-label="Horario semanal, tabla con horas y días" tabIndex={0}>
        <table className="weekly-schedule">
          <caption className="screen-reader-only">Horario semanal de tus cursos matriculados. Las filas indican las horas y las columnas los días. Cada clase incluye el nombre del curso y su hora de inicio y fin.</caption>
          <thead><tr><th scope="col">Hora</th>{days.map((day) => <th scope="col" key={day}>{weekDays[day - 1]}</th>)}</tr></thead>
          <tbody>{cells.map((row, rowIndex) => <tr key={boundaries[rowIndex]}>
            <th scope="row" className="weekly-hour">{clock(boundaries[rowIndex])}<span className="weekly-hour-end">{clock(boundaries[rowIndex + 1])}</span></th>
            {row.map((items, columnIndex) => {
              const key = signature(items)
              if (items.length && rowIndex > 0 && signature(cells[rowIndex - 1][columnIndex]) === key) return null
              let span = 1
              if (items.length) while (rowIndex + span < cells.length && signature(cells[rowIndex + span][columnIndex]) === key) span++
              return <td key={days[columnIndex]} rowSpan={span}>
                {items.length ? items.map((item) => <button type="button" key={item.id} className={`weekly-class weekly-class--${colorFor(item.curso_id)}`} style={{ minHeight: items.length === 1 ? span * 84 - 12 : undefined }} aria-label={`Clase de ${courses.get(item.curso_id)?.nombre ?? 'curso no disponible'}. ${weekDays[days[columnIndex] - 1]}, desde las ${item.hora_inicio?.slice(0, 5)} hasta las ${item.hora_fin?.slice(0, 5)}. Aula ${item.aula ?? 'no disponible'}. Docente ${item.docente ?? 'no disponible'}. Abrir detalle de esta clase.`} onClick={() => {
                  if (!detailsRef.current) return
                  detailsRef.current.open = true
                  const button = Array.from(detailsRef.current.querySelectorAll<HTMLButtonElement>('.table-entry-button')).find((entry) => entry.dataset.studentRowId === item.id)
                  if (button?.getAttribute('aria-expanded') === 'true') document.getElementById(button.getAttribute('aria-controls') ?? '')?.focus()
                  else button?.click()
                }}>
                  <span className="screen-reader-only">{weekDays[days[columnIndex] - 1]}, </span>
                  <strong>{courses.get(item.curso_id)?.nombre ?? 'Curso no disponible'}</strong>
                  <span>{item.hora_inicio?.slice(0, 5)} - {item.hora_fin?.slice(0, 5)}</span>
                  {item.aula && <span>Aula: {item.aula}</span>}
                </button>) : <span className="screen-reader-only">Sin clases</span>}
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <details ref={detailsRef} className="schedule-details"><summary>Detalle del horario</summary>
        <StudentTable caption="Detalle de todas las sesiones de tus cursos matriculados" columns={['Curso', 'Día', 'Inicio', 'Fin', 'Aula', 'Docente']} rows={ownSchedules.map((item) => ({ id: item.id, cells: [courses.get(item.curso_id)?.nombre ?? 'No disponible', weekDays[(item.dia_semana ?? 0) - 1] ?? 'No disponible', item.hora_inicio?.slice(0, 5), item.hora_fin?.slice(0, 5), item.aula, item.docente] }))} />
      </details>
    </div>
  )
}
