import { useId } from 'react'
import { BookOpen, Pause, Play, Square, Volume2, VolumeX } from 'lucide-react'
import { useAccessibility } from '../../context/accessibility-context'
import './AccessibilityControls.css'

export default function SpeechReaderControls({ onCommand }: { onCommand?: () => void }) {
  const { reader } = useAccessibility()
  const id = useId()
  const active = reader.playback !== 'idle'
  const command = (action: () => void) => { action(); onCommand?.() }
  return (
    <div className="speech-controls" data-speech-controls role="group" aria-label="Controles de lectura asistida">
      <button type="button" className="access-command speech-toggle" aria-pressed={reader.enabled} disabled={!reader.supported} onClick={() => command(reader.toggle)} aria-describedby={`${id}-help`}>
        {reader.enabled ? <VolumeX size={19} aria-hidden="true" /> : <Volume2 size={19} aria-hidden="true" />}
        Activar lectura asistida
      </button>
      <span id={`${id}-help`} className="screen-reader-only">Este botón activa o desactiva la lectura. Su estado indica si está activada. Pulsa Enter o Espacio para cambiarlo. Desactiva la lectura asistida si usas NVDA. No se leen contraseñas ni valores de campos de texto.</span>
      {reader.supported && <>
        <button type="button" className="access-command" disabled={!reader.enabled} onClick={() => command(reader.readSection)}><BookOpen size={18} aria-hidden="true" />Leer sección</button>
        <div className="speech-playback" role="group" aria-label="Reproducción de voz">
          <button type="button" className="access-icon" aria-label={reader.playback === 'paused' ? 'Reanudar lectura' : 'Pausar lectura'} title={reader.playback === 'paused' ? 'Reanudar lectura' : 'Pausar lectura'} disabled={!reader.enabled || !active} onClick={() => command(reader.playback === 'paused' ? reader.resume : reader.pause)}>{reader.playback === 'paused' ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}</button>
          <button type="button" className="access-icon" aria-label="Detener lectura actual" title="Detener lectura actual" disabled={!reader.enabled || !active} onClick={() => command(reader.stop)}><Square size={17} aria-hidden="true" /></button>
        </div>
        <div className="speech-rate">
          <label htmlFor={`${id}-rate`}>Velocidad</label>
          <input id={`${id}-rate`} type="range" min="0.5" max="2" step="0.1" value={reader.rate} aria-valuetext={`${reader.rate.toLocaleString('es-PE')} veces la velocidad normal`} onChange={(event) => reader.changeRate(Number(event.target.value))} />
          <output htmlFor={`${id}-rate`} aria-live="off">{reader.rate.toLocaleString('es-PE')}x</output>
        </div>
        <span className="screen-reader-only">{reader.voiceLabel}</span>
      </>}
      <p className="speech-status" role="status" aria-live="polite" aria-atomic="true">{!reader.supported ? 'La lectura asistida no está disponible en este navegador. Puedes usar un lector de pantalla externo.' : reader.error || (reader.enabled ? reader.playback === 'paused' ? 'Lectura pausada' : reader.playback === 'speaking' ? 'Leyendo' : 'Lectura asistida activada' : '')}</p>
    </div>
  )
}
