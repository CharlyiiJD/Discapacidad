import { ArrowRight, BookOpen, GraduationCap, HeartHandshake, Laptop, MessagesSquare, Compass } from 'lucide-react'
import '../sections.css'

const services = [
  { Icon: Compass, title: 'Orientación académica', description: 'Consulta sobre carreras, requisitos de admisión y los próximos pasos de tu formación.' },
  { Icon: BookOpen, title: 'Biblioteca y recursos', description: 'Consulta libros universitarios de acceso abierto, lee en línea y encuentra materiales en PDF para descargar.' },
  { Icon: GraduationCap, title: 'Becas y oportunidades', description: 'Conoce las opciones de apoyo y consulta los requisitos para postular a una beca.' },
  { Icon: HeartHandshake, title: 'Apoyo a estudiantes', description: 'Cuéntanos qué necesitas para participar en tus actividades académicas y recibir orientación.' },
  { Icon: Laptop, title: 'Soporte tecnológico', description: 'Consulta sobre el acceso al portal, las plataformas de estudio y los recursos tecnológicos.' },
  { Icon: MessagesSquare, title: 'Atención y consultas', description: 'Prepara una consulta o comparte tus dudas para encontrar el servicio que necesitas.' },
]

export default function Servicios() {
  return (
    <div className="section-page">
      <p className="section-page-intro">Encuentra el apoyo que necesitas para estudiar, aprender y participar en nuestra comunidad.</p>
      <section aria-labelledby="services-list-title">
        <h2 id="services-list-title" className="section-page-subtitle">¿En qué podemos ayudarte?</h2>
        <ul className="service-list" role="list">
          {services.map(({ Icon, title, description }) => (
            <li className="service-item" key={title}>
              <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
                <a className="section-action" href={title === 'Biblioteca y recursos' ? '#biblioteca' : '#contacto'} aria-label={title === 'Biblioteca y recursos' ? 'Explorar biblioteca, consultar libros y materiales PDF para leer en línea o descargar' : `Solicitar información sobre ${title}, ir al formulario de contacto`}>
                  {title === 'Biblioteca y recursos' ? 'Explorar biblioteca' : 'Solicitar información'}<ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="section-contact" aria-labelledby="services-support-title">
        <h2 id="services-support-title">Apoyo para una experiencia sin barreras</h2>
        <p>Consulta los recursos de accesibilidad y las formas de solicitar acompañamiento.</p>
        <a className="section-action" href="#accesibilidad" aria-label="Ver accesibilidad, ir a la página de recursos y apoyo accesible">
          Ver accesibilidad<ArrowRight size={18} aria-hidden="true" />
        </a>
      </section>
    </div>
  )
}
