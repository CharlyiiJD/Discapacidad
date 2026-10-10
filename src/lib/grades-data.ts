import { supabase } from './supabase'

export type UserRole = 'master' | 'docente' | null
export type GradeValue = number | string | null
export type ConsolidatedGrades = {
  id: string
  matricula_id: string
  c1_nota1: GradeValue
  c1_nota2: GradeValue
  c1_nota3: GradeValue
  c2_nota1: GradeValue
  c2_nota2: GradeValue
  c2_nota3: GradeValue
  promedio_c1: GradeValue
  promedio_c2: GradeValue
  nota_final: GradeValue
}

export const gradeFields = ['c1_nota1', 'c1_nota2', 'c1_nota3', 'c2_nota1', 'c2_nota2', 'c2_nota3'] as const
export type GradeField = (typeof gradeFields)[number]
export type GradeInput = Record<GradeField, number | null>
export type Student = { id: string; nombre: string | null; apellidos: string | null; codigo_universitario: string | null }
const gradeColumns = 'id,matricula_id,c1_nota1,c1_nota2,c1_nota3,c2_nota1,c2_nota2,c2_nota3,promedio_c1,promedio_c2,nota_final'

export async function getMasterStudents(signal: AbortSignal): Promise<Student[]> {
  const students: Student[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('estudiantes')
      .select('id,nombre,apellidos,codigo_universitario').order('id')
      .range(offset, offset + pageSize - 1).abortSignal(signal).returns<Student[]>()
    if (error) throw error
    students.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return students.sort((a, b) => `${a.apellidos ?? ''} ${a.nombre ?? ''}`.localeCompare(`${b.apellidos ?? ''} ${b.nombre ?? ''}`, 'es'))
}

export async function getEnrollmentGrades(enrollmentId: string, signal: AbortSignal): Promise<ConsolidatedGrades | null> {
  const { data, error } = await supabase.from('consolidados').select(gradeColumns)
    .eq('matricula_id', enrollmentId).abortSignal(signal).maybeSingle<ConsolidatedGrades>()
  if (error) throw error
  return data
}

export async function saveEnrollmentGrades(userId: string, enrollmentId: string, grades: GradeInput, signal: AbortSignal): Promise<ConsolidatedGrades> {
  if (gradeFields.some((field) => grades[field] !== null && (!Number.isFinite(grades[field]) || grades[field]! < 0 || grades[field]! > 20))) {
    throw new Error('Las calificaciones deben estar entre 0 y 20.')
  }
  const { data: auth, error: authError } = await supabase.auth.getUser()
  signal.throwIfAborted()
  if (authError || auth.user?.id !== userId) throw new Error('Tu sesión ha cambiado. Inicia sesión nuevamente.')
  if (await getUserRole(userId, signal) !== 'master') throw new Error('Tu cuenta no tiene permiso para guardar calificaciones.')
  // Whitelist editable columns; PostgreSQL owns all generated averages.
  const row = {
    matricula_id: enrollmentId,
    c1_nota1: grades.c1_nota1, c1_nota2: grades.c1_nota2, c1_nota3: grades.c1_nota3,
    c2_nota1: grades.c2_nota1, c2_nota2: grades.c2_nota2, c2_nota3: grades.c2_nota3,
  }
  const { data, error } = await supabase.from('consolidados').upsert(row, { onConflict: 'matricula_id' })
    .select(gradeColumns).abortSignal(signal).single<ConsolidatedGrades>()
  if (error) throw error
  if (!data || data.matricula_id !== enrollmentId) throw new Error('No se pudo verificar el guardado de las calificaciones.')
  return data
}

export function gradeErrorMessage(error: unknown, fallback: string) {
  const details = typeof error === 'object' && error !== null ? error as { message?: unknown; code?: unknown } : null
  if (details?.code === '42P10') return `${fallback} Supabase necesita una restricción UNIQUE en consolidados.matricula_id para poder actualizar sin duplicados.`
  return typeof details?.message === 'string' ? `${fallback} ${details.message}` : fallback
}

export async function getUserRole(userId: string, signal: AbortSignal): Promise<UserRole> {
  const { data, error } = await supabase.from('roles_usuario').select('rol')
    .eq('usuario_id', userId).abortSignal(signal)
  if (error) throw error
  if (data?.some((row) => row.rol === 'master')) return 'master'
  if (data?.some((row) => row.rol === 'docente')) return 'docente'
  return null
}

export async function getStudentConsolidatedGrades(userId: string, signal: AbortSignal): Promise<ConsolidatedGrades[]> {
  const { data, error } = await supabase.from('consolidados')
    .select('id,matricula_id,c1_nota1,c1_nota2,c1_nota3,c2_nota1,c2_nota2,c2_nota3,promedio_c1,promedio_c2,nota_final,matricula:matriculas!inner(estudiante_id)')
    .eq('matricula.estudiante_id', userId).abortSignal(signal).returns<ConsolidatedGrades[]>()
  if (error) throw error
  return data ?? []
}

export function formatGrade(value: GradeValue | undefined) {
  if (value == null || value === '') return 'Pendiente'
  const number = Number(value)
  return Number.isFinite(number) ? new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(number) : 'No disponible'
}

export function isComplete(values: (GradeValue | undefined)[]) {
  return values.every((value) => value != null && value !== '' && Number.isFinite(Number(value)))
}
