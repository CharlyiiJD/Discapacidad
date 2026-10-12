import { useEffect, useRef, useState } from 'react'
import AcademicLayout from './layouts/AcademicLayout'
import Inicio from './pages/inicio/Inicio'
import Servicios from './pages/servicios/Servicios'
import Accesibilidad from './pages/accesibilidad/Accesibilidad'
import PortalEstudiante from './pages/portal/PortalEstudiante'
import Biblioteca from './pages/biblioteca/Biblioteca'
import { useAuth } from './context/auth-context'
import AuthDialog, { type AuthMode } from './components/auth/AuthDialog'
import { navigationItems } from './components/navigation/navigation'
import './App.css'
import SpeechReaderPanel from './components/accessibility/SpeechReaderPanel'

const pages = {
  inicio: Inicio,
  servicios: Servicios,
  accesibilidad: Accesibilidad,
  portal: PortalEstudiante,
  biblioteca: Biblioteca,
}

type PageId = keyof typeof pages

function getCurrentPage(): PageId {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('portal/')) return 'portal'
  return Object.hasOwn(pages, hash) ? (hash as PageId) : 'inicio'
}

export default function App() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(getCurrentPage)
  const [authMode, setAuthMode] = useState<AuthMode | null>(() => {
    const hash = window.location.hash.slice(1)
    return hash === 'registro' || hash === 'iniciar-sesion' ? hash : null
  })
  const returnPage = useRef<PageId>(currentPage)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'iniciar-sesion' || hash === 'registro') {
        returnPage.current = currentPage
        setAuthMode(hash)
      } else {
        setAuthMode(null)
        setCurrentPage(getCurrentPage())
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentPage])

  useEffect(() => {
    const handleHomeLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      if (!(event.target instanceof Element) || !event.target.closest('a[href="#inicio"]')) return
      event.preventDefault()
      if (window.location.hash !== '#inicio') window.location.hash = 'inicio'
      requestAnimationFrame(() => {
        document.getElementById('contenido-principal')?.focus({ preventScroll: true })
        window.scrollTo({ top: 0, behavior: 'instant' })
      })
    }
    document.addEventListener('click', handleHomeLink)
    return () => document.removeEventListener('click', handleHomeLink)
  }, [])

  function closeAuth() {
    setAuthMode(null)
    window.location.hash = returnPage.current
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.profile-trigger, .navigation-link[href="#iniciar-sesion"]')?.focus({ preventScroll: true }))
  }

  useEffect(() => {
    if (user && authMode) closeAuth()
  }, [user, authMode])

  const Page = pages[currentPage]
  const pageLabel = currentPage === 'portal' ? 'Portal del estudiante' : currentPage === 'biblioteca' ? 'Biblioteca y recursos' : navigationItems.find((item) => item.id === currentPage)!.label

  return (
    <>
      <AcademicLayout currentPage={currentPage} pageLabel={pageLabel} authOpen={authMode !== null}>
        <Page />
      </AcademicLayout>
      {authMode && <AuthDialog key={authMode} mode={authMode} onDismiss={closeAuth} />}
      <SpeechReaderPanel />
    </>
  )
}
