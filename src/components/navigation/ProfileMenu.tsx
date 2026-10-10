import { useEffect, useId, useRef, useState } from 'react'
import { ExternalLink, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../../context/auth-context'

export default function ProfileMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLAnchorElement>(null)
  const logoutRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const candidateName = user?.user_metadata.nombre
  const name = typeof candidateName === 'string' ? candidateName : ''
  const candidateSurname = user?.user_metadata.apellidos
  const surname = typeof candidateSurname === 'string' ? candidateSurname.trim().split(/\s+/)[0] : ''
  const firstName = name.trim().split(/\s+/)[0]
  const shortName = [firstName, surname ? `${Array.from(surname)[0]}.` : ''].filter(Boolean).join(' ')

  useEffect(() => {
    if (!open) return
    portalRef.current?.focus()
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  async function handleSignOut() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await signOut()
      setOpen(false)
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.navigation-link[href="#iniciar-sesion"]')?.focus({ preventScroll: true }))
    } catch {
      setError('No se pudo cerrar la sesión. Inténtalo nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="profile-menu-wrapper" ref={rootRef}>
      <button
        ref={triggerRef} type="button" className="profile-trigger"
        aria-label={`Perfil${shortName ? ` de ${shortName}` : ''}, abrir menú de cuenta`}
        title="Mi perfil" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true) }
        }}
      ><UserRound size={23} aria-hidden="true" /></button>
      {shortName && <span className="profile-name" aria-hidden="true" title={shortName}>{shortName}</span>}
      {open && (
        <div className="profile-dropdown">
          <div id={menuId} role="menu" aria-label="Opciones de tu cuenta" onKeyDown={(event) => {
            const items = [portalRef.current, logoutRef.current]
            const current = items.indexOf(document.activeElement as HTMLAnchorElement | HTMLButtonElement)
            if (event.key === 'Escape') { event.preventDefault(); setOpen(false); triggerRef.current?.focus() }
            else if (event.key === 'Tab') { setOpen(false); triggerRef.current?.focus() }
            else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault()
              const index = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + 2) % 2
              items[index]?.focus()
            }
          }}>
            <a ref={portalRef} role="menuitem" href={`${import.meta.env.BASE_URL}#portal`} target="_blank" rel="noopener noreferrer" aria-label="Ir al portal del estudiante, abrir en una nueva pestaña" onClick={() => { setOpen(false); triggerRef.current?.focus() }}>
              <ExternalLink size={18} aria-hidden="true" />Ir al portal del estudiante
            </a>
            <button ref={logoutRef} type="button" role="menuitem" aria-label="Cerrar sesión de tu cuenta" aria-disabled={busy} onClick={handleSignOut}>
              <LogOut size={18} aria-hidden="true" />{busy ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
          <p className="profile-menu-error" role="alert">{error}</p>
        </div>
      )}
    </div>
  )
}
