import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import mainLogo from '../../assets/main-logo.png'
import IniciarSesion from '../../pages/iniciar-sesion/IniciarSesion'
import RegistroForm from './RegistroForm'
import './AuthDialog.css'

export type AuthMode = 'iniciar-sesion' | 'registro'

type AuthDialogProps = {
  mode: AuthMode
  onDismiss: () => void
}

export default function AuthDialog({ mode, onDismiss }: AuthDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const title = mode === 'registro' ? 'Crear cuenta' : 'Iniciar sesión'

  useEffect(() => {
    const dialog = dialogRef.current!
    const previousOverflow = document.body.style.overflow
    const previousTitle = document.title
    document.body.style.overflow = 'hidden'
    document.title = `${title} | My-University`
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      document.title = previousTitle
    }
  }, [title])

  return (
    <dialog
      ref={dialogRef} id="auth-dialog" className="auth-dialog"
      aria-modal="true" aria-labelledby="auth-title"
      onCancel={(event) => { event.preventDefault(); onDismiss() }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onDismiss()
      }}
    >
      <button type="button" className="auth-icon-button auth-close" onClick={onDismiss} aria-label={`Cerrar ventana de ${title.toLowerCase()}`} title="Cerrar ventana"><X size={22} aria-hidden="true" /></button>
      <img className="auth-logo" src={mainLogo} alt="Logotipo de My-University" />
      <h2 id="auth-title">{title}</h2>
      {mode === 'registro' ? <RegistroForm /> : <IniciarSesion />}
    </dialog>
  )
}
