import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, X } from 'lucide-react'
import { useAccessibility } from '../../context/accessibility-context'
import SpeechReaderControls from './SpeechReaderControls'
import './AccessibilityControls.css'

export default function SpeechReaderPanel() {
  const { reader } = useAccessibility()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const { withoutFocusAnnouncement, activate, announcePanelFocus, enabled, toggle } = reader

  const close = useCallback(() => {
    withoutFocusAnnouncement(() => dialogRef.current?.close())
    setOpen(false)
  }, [withoutFocusAnnouncement])

  const show = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    activate(false)
    withoutFocusAnnouncement(() => {
      dialog.showModal()
      dialog.querySelector<HTMLButtonElement>('.speech-toggle')?.focus()
    })
    setOpen(true)
    requestAnimationFrame(() => {
      const button = dialog.querySelector<HTMLButtonElement>('.speech-toggle')
      if (dialog.open && button && document.activeElement === button) announcePanelFocus(button, 'Panel de lectura asistida.')
    })
  }, [activate, announcePanelFocus, withoutFocusAnnouncement])

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.code !== 'KeyL' || !event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey || event.repeat || event.isComposing) return
      event.preventDefault()
      event.stopPropagation()
      if (dialogRef.current?.open) close()
      else if (enabled) toggle()
      else show()
    }
    const routeChange = () => { if (dialogRef.current?.open) close() }
    window.addEventListener('keydown', shortcut, true)
    window.addEventListener('hashchange', routeChange)
    return () => { window.removeEventListener('keydown', shortcut, true); window.removeEventListener('hashchange', routeChange) }
  }, [close, show, enabled, toggle])

  return (
    <>
      <button type="button" className="speech-edge-tab" data-speech-controls aria-label="Abrir panel de lectura asistida" aria-expanded={open} aria-controls="speech-reader-panel" aria-haspopup="dialog" aria-keyshortcuts="Alt+Shift+L" aria-describedby="speech-shortcut-help" title="Lectura asistida (Alt + Shift + L)" onClick={show}>
        <Volume2 size={22} aria-hidden="true" />
      </button>
      <span id="speech-shortcut-help" className="screen-reader-only">Alt, Mayúsculas y L abre el panel y activa la lectura. Si el panel está abierto, lo cierra y mantiene la voz activada. Si está cerrado con la voz activada, desactiva la lectura sin abrirlo. Otra pulsación vuelve a abrirlo y activarla. También puedes abrir este panel con el botón lateral. Usa Tab para recorrer sus controles y Escape para cerrar.</span>
      <dialog ref={dialogRef} id="speech-reader-panel" className="speech-reader-panel" data-speech-controls aria-modal="true" aria-labelledby="speech-panel-title" aria-describedby="speech-shortcut-help" onCancel={(event) => { event.preventDefault(); close() }} onClose={() => {
        setOpen(false)
        const target = previousFocus.current?.isConnected ? previousFocus.current : document.getElementById('contenido-principal')
        withoutFocusAnnouncement(() => target?.focus({ preventScroll: true }))
      }} onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
      }}>
        <div className="speech-panel-heading"><h2 id="speech-panel-title">Lectura asistida</h2><button type="button" className="access-icon" aria-label="Cerrar panel de lectura asistida" title="Cerrar panel" onClick={close}><X size={20} aria-hidden="true" /></button></div>
        <SpeechReaderControls onCommand={close} />
      </dialog>
    </>
  )
}
