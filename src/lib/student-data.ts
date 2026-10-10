import { supabase } from './supabase'

export type Course = { id: string; codigo: string | null; nombre: string | null; creditos: number | null; ciclo: number | null; carrera: string | null }
export type Enrollment = { id: string; curso_id: string; periodo: string | null; estado: string | null; curso: Course | null }
export type Schedule = { id: string; curso_id: string; dia_semana: number | null; hora_inicio: string | null; hora_fin: string | null; aula: string | null; docente: string | null }

export const ENROLLMENT_PERIOD = '2026-II'

export async function getEnrollments(userId: string, signal: AbortSignal, period?: string): Promise<Enrollment[]> {
  let query = supabase.from('matriculas')
    .select('id,curso_id,periodo,estado,curso:cursos(id,codigo,nombre,creditos,ciclo,carrera)')
    .eq('estudiante_id', userId)
  if (period) query = query.eq('periodo', period)
  const { data, error } = await query.order('periodo', { ascending: false }).abortSignal(signal).returns<Enrollment[]>()
  if (error) throw error
  return data ?? []
}

export async function getCareers(signal: AbortSignal): Promise<string[]> {
  const careers = new Set<string>()
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error, status } = await supabase.from('cursos').select('carrera')
      .order('carrera').range(offset, offset + pageSize - 1).abortSignal(signal)
    if (error) throw { ...error, status }
    for (const item of data ?? []) if (typeof item.carrera === 'string' && item.carrera.trim()) careers.add(item.carrera)
    if (!data || data.length < pageSize) break
  }
  return [...careers].sort((a, b) => a.localeCompare(b, 'es'))
}

export async function getAvailableCourses(career: string, semester: number, signal: AbortSignal): Promise<Course[]> {
  const { data, error } = await supabase.from('cursos')
    .select('id,codigo,nombre,creditos,ciclo,carrera')
    .eq('carrera', career).eq('ciclo', semester).eq('activo', true)
    .order('codigo').abortSignal(signal).returns<Course[]>()
  if (error) throw error
  return data ?? []
}

export async function createEnrollments(userId: string, courseIds: string[], signal: AbortSignal): Promise<Enrollment[]> {
  if (!courseIds.length) return []
  const { data: auth, error: authError } = await supabase.auth.getUser()
  signal.throwIfAborted()
  if (authError || auth.user?.id !== userId) throw new Error('La sesión ha cambiado. Vuelve a iniciar sesión.')
  const existing = await getEnrollments(auth.user.id, signal, ENROLLMENT_PERIOD)
  if (existing.length) throw new Error('Ya tienes una matrícula confirmada para este periodo.')
  const rows = [...new Set(courseIds)].map((courseId) => ({ id: crypto.randomUUID(), estudiante_id: auth.user!.id, curso_id: courseId, periodo: ENROLLMENT_PERIOD }))
  const { data, error } = await supabase.from('matriculas').insert(rows)
    .select('id,curso_id,periodo,estado,curso:cursos(id,codigo,nombre,creditos,ciclo,carrera)')
    .abortSignal(signal).returns<Enrollment[]>()
  if (error) throw error
  if (!data || data.length !== rows.length) throw new Error('No se pudo verificar la matrícula guardada.')
  return data
}

export async function getSchedules(courseIds: string[], signal: AbortSignal): Promise<Schedule[]> {
  if (courseIds.length === 0) return []
  const { data, error } = await supabase.from('horarios')
    .select('id,curso_id,dia_semana,hora_inicio,hora_fin,aula,docente')
    .in('curso_id', courseIds).order('dia_semana').order('hora_inicio').abortSignal(signal).returns<Schedule[]>()
  if (error) throw error
  return data ?? []
}
