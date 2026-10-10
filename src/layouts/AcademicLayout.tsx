import { useEffect, useRef, type ReactNode } from 'react'
import Navbar from '../components/navigation/Navbar'

type AcademicLayoutProps = {
  children: ReactNode
  currentPage: string
  pageLabel: string
  authOpen: boolean
}

export default function AcademicLayout({ children, currentPage, pageLabel, authOpen }: AcademicLayoutProps) {
  const mainRef = useRef<HTMLElement>(null)
  const previousPage = useRef(currentPage)

  useEffect(() => {
    document.title = `${pageLabel} | My-University`
    if (previousPage.current !== currentPage) {
      mainRef.current?.focus({ preventScroll: true })
      previousPage.current = currentPage
      if (currentPage === 'inicio') {
        const target = document.getElementById(window.location.hash.slice(1))
        if (target) {
          target.focus({ preventScroll: true })
          target.scrollIntoView({ behavior: 'instant', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' })
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    }
  }, [currentPage, pageLabel])

  return (
    <>
      <a
        className="skip-link"
        href="#contenido-principal"
        aria-label={'Saltar al contenido principal, omitir la navegaci\u00f3n'}
        onClick={(event) => {
          event.preventDefault()
          mainRef.current?.focus()
        }}
      >
        Saltar al contenido principal
      </a>
      <Navbar currentPage={currentPage} authOpen={authOpen} />
      <main
        ref={mainRef}
        id="contenido-principal"
        className={currentPage === 'inicio' ? 'academic-main academic-main--home' : currentPage === 'portal' ? 'academic-main academic-main--portal content-container' : 'academic-main content-container'}
        aria-labelledby="page-heading"
        tabIndex={-1}
      >
        <h1 id="page-heading" className={currentPage === 'inicio' || currentPage === 'portal' ? 'screen-reader-only' : 'section-page-title'}>{pageLabel}</h1>
        {children}
      </main>
    </>
  )
}
