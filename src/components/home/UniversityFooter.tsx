import { ArrowUp } from 'lucide-react'

const columns = [
  { title: 'Universidad', links: [{ label: 'Inicio', href: '#inicio' }, { label: 'Nuestra comunidad', href: '#comunidad' }, { label: 'Actualidad', href: '#actualidad' }, { label: 'Próximos eventos', href: '#eventos' }] },
  { title: 'Estudia con nosotros', links: [{ label: 'Programas académicos', href: '#programas' }, { label: 'Proceso de admisión', href: '#contacto' }, { label: 'Becas y oportunidades', href: '#contacto' }, { label: 'Orientación', href: '#contacto' }] },
  { title: 'Estamos cerca', links: [{ label: 'Contacto', href: '#contacto' }, { label: 'Servicios', href: '#servicios' }, { label: 'Accesibilidad', href: '#accesibilidad' }, { label: 'Iniciar sesión', href: '#iniciar-sesion' }] },
]

export default function UniversityFooter() {
  return (
    <footer className="university-footer">
      <div className="content-container footer-grid">
        <div className="footer-brand">
          <a href="#inicio" aria-label="Logo de My-University, volver a Inicio"><img src="/mini-logo.png" width="102" height="55" alt="My-University" /></a>
          <p>Aprender nos conecta.<br />Una universidad abierta al conocimiento, a las personas y a nuevas posibilidades.</p>
          <div className="social-links" role="group" aria-label="Redes sociales">
            {[
              { icon: 'facebook', name: 'Facebook', href: 'https://www.facebook.com/' },
              { icon: 'instagram', name: 'Instagram', href: 'https://www.instagram.com/' },
              { icon: 'linkedin', image: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png', name: 'LinkedIn', href: 'https://www.linkedin.com/' },
              { icon: 'youtube', name: 'YouTube', href: 'https://www.youtube.com/' },
            ].map(({ icon, image, name, href }) => <a key={name} className="icon-button" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${name}, sitio externo en una nueva pestaña`} title={name}><img src={image ?? `https://cdn.simpleicons.org/${icon}/ffffff`} width="19" height="19" alt="" aria-hidden="true" loading="lazy" /></a>)}
          </div>
        </div>
        {columns.map((column) => <nav key={column.title} aria-label={`Pie de página: ${column.title}`}><h2>{column.title}</h2><ul role="list">{column.links.map((link) => <li key={link.label}><a href={link.href} aria-label={`${link.label}, ir a esta sección`}>{link.label}</a></li>)}</ul></nav>)}
      </div>
      <div className="content-container footer-bottom"><p>© {new Date().getFullYear()} My-University</p><a href="#inicio" aria-label="Volver al inicio de la página">Volver arriba<ArrowUp size={17} aria-hidden="true" /></a></div>
    </footer>
  )
}
