import type { Schedule } from './student-data'

export const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function timeValue(value: string | null) {
  return value ? Date.parse(`1970-01-01T${value}Z`) : NaN
}

export function hasCompleteSchedule(schedules: Schedule[]) {
  return schedules.length > 0 && schedules.every((item) => item.dia_semana != null && item.dia_semana >= 1 && item.dia_semana <= 7 && Number.isFinite(timeValue(item.hora_inicio)) && timeValue(item.hora_inicio) < timeValue(item.hora_fin))
}

export function schedulesOverlap(first: Schedule, second: Schedule) {
  return first.curso_id !== second.curso_id && first.dia_semana === second.dia_semana && timeValue(first.hora_inicio) < timeValue(second.hora_fin) && timeValue(second.hora_inicio) < timeValue(first.hora_fin)
}
