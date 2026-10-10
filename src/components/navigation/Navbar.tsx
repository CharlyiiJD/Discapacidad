import mainLogo from '../../assets/main-logo.png'
import { navigationItems } from './navigation'
import './Navbar.css'
import { useAuth } from '../../context/auth-context'
import ProfileMenu from './ProfileMenu'

type NavbarProps = {
  currentPage: string
  authOpen: boolean
}

export default function Navbar({ currentPage, authOpen }: NavbarProps) {
  const { user, loading } = useAuth()
  return (
    <header className="academic-header">
      <nav className="academic-navigation content-container" aria-label={'Navegaci\u00f3n principal'}>
        <a
          className="brand-link"
          href="#inicio"
          aria-label={'Logo de My-University, ir a la p\u00e1gina de Inicio'}
        >
          <img className="brand-logo" src={mainLogo} alt="My-University" />
        </a>
        <ul className="navigation-links" role="list">
          {navigationItems.map(({ id, label, accessibleLabel }) => (
            <li key={id}>
              {id === 'iniciar-sesion' && user ? <ProfileMenu /> : id === 'iniciar-sesion' && loading ? (
                <span className="profile-loading" role="status"><span className="screen-reader-only">Comprobando tu sesión</span></span>
              ) : <a
                className={`navigation-link${id === 'iniciar-sesion' ? ' navigation-link--primary' : ''}`}
                href={`#${id}`}
                aria-label={accessibleLabel}
                aria-current={currentPage === id ? 'page' : undefined}
                aria-haspopup={id === 'iniciar-sesion' ? 'dialog' : undefined}
                aria-expanded={id === 'iniciar-sesion' ? authOpen : undefined}
                aria-controls={id === 'iniciar-sesion' && authOpen ? 'auth-dialog' : undefined}
              >
                {label}
              </a>}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
