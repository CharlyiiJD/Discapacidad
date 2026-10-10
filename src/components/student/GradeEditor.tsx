import { useEffect, useRef, useState, type FormEvent } from 'react'
import { RotateCw, Save } from 'lucide-react'
import { formatGrade, getEnrollmentGrades, gradeErrorMessage, gradeFields, isComplete, saveEnrollmentGrades, type ConsolidatedGrades, type GradeField, type GradeInput } from '../../lib/grades-data'

type Values = Record<GradeField, string>
const emptyValues = (): Values => ({ c1_nota1: '', c1_nota2: '', c1_nota3: '', c2_nota1: '', c2_nota2: '', c2_nota3: '' })
function valuesFrom(grades: ConsolidatedGrades | null): Values {
  const values = emptyValues()
  for (const field of gradeFields) values[field] = grades?.[field] == null ? '' : String(grades[field])
  return values
}

export default function GradeEditor({ userId, enrollmentId, onBusyChange, onDirtyChange }: { userId: string; enrollmentId: string; onBusyChange: (busy: boolean) => void; onDirtyChange: (dirty: boolean) => void }) {
  const [values, setValues] = useState(emptyValues)
  const [saved, setSaved] = useState<ConsolidatedGrades | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const submission = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const dirty = gradeFields.some((field) => values[field] !== valuesFrom(saved)[field])

  useEffect(() => { onDirtyChange(dirty) }, [dirty, onDirtyChange])
  useEffect(() => () => submission.current?.abort(), [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    getEnrollmentGrades(enrollmentId, controller.signal).then((grades) => {
      if (!controller.signal.aborted) { setSaved(grades); setValues(valuesFrom(grades)) }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(gradeErrorMessage(error, 'No se pudieron consultar las calificaciones.'))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [enrollmentId, retry])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current || loading || loadError) return
    const input = {} as GradeInput
    for (const field of gradeFields) {
      const value = values[field].trim() === '' ? null : Number(values[field])
      if (value !== null && (!Number.isFinite(value) || value < 0 || value > 20)) {
        setSaveError('Cada calificación debe ser un número entre 0 y 20, o quedar vacía.')
        formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus()
        return
      }
      input[field] = value
    }
    const controller = new AbortController()
    submission.current = controller
    busyRef.current = true
    setBusy(true)
    onBusyChange(true)
    setSaveError('')
    setMessage('Guardando calificaciones...')
    try {
      const grades = await saveEnrollmentGrades(userId, enrollmentId, input, controller.signal)
      if (!controller.signal.aborted) {
        setSaved(grades)
        setValues(valuesFrom(grades))
        onDirtyChange(false)
        setMessage('Calificaciones guardadas correctamente. Los promedios guardados se han actualizado desde Supabase.')
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        setMessage('')
        setSaveError(gradeErrorMessage(error, 'No se confirmó el guardado de las calificaciones.'))
      }
    } finally {
      busyRef.current = false
      if (!controller.signal.aborted) { setBusy(false); onBusyChange(false) }
    }
  }

  const c1 = [saved?.c1_nota1, saved?.c1_nota2, saved?.c1_nota3]
  const c2 = [saved?.c2_nota1, saved?.c2_nota2, saved?.c2_nota3]
  return (
    <div className="grade-editor">
      <p role="status" aria-live="polite">{loading ? 'Cargando las calificaciones del curso...' : !loadError ? saved ? 'Calificaciones cargadas.' : 'Aún no se han registrado notas para este curso.' : ''}</p>
      {loadError && <div role="alert"><p>{loadError}</p><button type="button" className="portal-retry" onClick={() => setRetry((value) => value + 1)} aria-label="Reintentar la consulta de calificaciones"><RotateCw size={18} aria-hidden="true" />Reintentar</button></div>}
      {!loading && !loadError && <form ref={formRef} onSubmit={handleSubmit} aria-label="Editar calificaciones del curso seleccionado" aria-describedby="grade-entry-help">
        <p id="grade-entry-help" className="screen-reader-only">Ingresa calificaciones de cero a veinte, con decimales si corresponde. Puedes dejar criterios vacíos y guardar parcialmente. Los promedios muestran los valores ya guardados en Supabase y permanecerán pendientes hasta completar las notas.</p>
        <fieldset className="grade-editable" disabled={busy}>
          <legend className="screen-reader-only">Seis criterios de evaluación</legend>
          <div className="grade-consolidated-grid">{([1, 2] as const).map((consolidated) => <fieldset className="grade-consolidated" key={consolidated}>
            <legend>Consolidado {consolidated}</legend>
            <div className="grade-criteria">{([1, 2, 3] as const).map((criterion) => {
              const field: GradeField = `c${consolidated}_nota${criterion}`
              return <div key={field}><label htmlFor={`grade-${field}`}>Criterio {criterion}<span className="screen-reader-only"> del consolidado {consolidated}</span></label>
                <input id={`grade-${field}`} name={field} type="number" min={0} max={20} step="any" inputMode="decimal" value={values[field]} aria-describedby="grade-entry-help" onChange={(event) => { setValues((previous) => ({ ...previous, [field]: event.target.value })); setMessage(''); setSaveError('') }} />
              </div>
            })}</div>
            <p>Promedio guardado: <output>{isComplete(consolidated === 1 ? c1 : c2) ? formatGrade(consolidated === 1 ? saved?.promedio_c1 : saved?.promedio_c2) : 'Pendiente'}</output></p>
          </fieldset>)}</div>
        </fieldset>
        <p>Nota final guardada: <output>{isComplete([...c1, ...c2]) ? formatGrade(saved?.nota_final) : 'Pendiente'}</output></p>
        <p className="grade-dirty" role="status" aria-live="polite">{dirty ? 'Cambios sin guardar' : ''}</p>
        <button type="submit" className="grade-save" disabled={busy || !dirty} aria-label="Guardar calificaciones del curso seleccionado"><Save size={18} aria-hidden="true" />{busy ? 'Guardando...' : 'Guardar calificaciones'}</button>
      </form>}
      <p className="grade-status" role="status" aria-live="polite" aria-atomic="true">{message}</p>
      <p className="grade-error" role="alert">{saveError}</p>
    </div>
  )
}
