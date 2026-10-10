import { ArrowRight, FileText, Accessibility, MessagesSquare } from 'lucide-react'
import '../sections.css'

const resources = [
  { Icon: FileText, title: 'Información en formatos accesibles', description: 'Consulta sobre materiales y documentos en un formato que puedas leer y utilizar con tus herramientas de apoyo.' },
  { Icon: Accessibility, title: 'Adaptaciones y acompañamiento', description: 'Cuéntanos qué apoyo necesitas para tus clases, evaluaciones o actividades universitarias.' },
  { Icon: MessagesSquare, title: 'Reportar una barrera', description: 'Comparte dificultades de acceso a la página, los materiales o los servicios para que podamos orientar tu consulta.' },
]

export default function Accesibilidad() {
  return (
    <div className="section-page">
      <p className="section-page-intro">Un espacio para encontrar recursos, comunicar tus necesidades y solicitar apoyo para tu experiencia universitaria.</p>
      <section aria-labelledby="accessibility-resources-title">
        <h2 id="accessibility-resources-title" className="section-page-subtitle">Recursos y apoyo</h2>
        <ul className="service-list accessibility-list" role="list">
          {resources.map(({ Icon, title, description }) => (
            <li className="service-item" key={title}>
              <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
              <div>
                <h3>{title}</h3><p>{description}</p>
                <a className="section-action" href="#contacto" aria-label={`Consultar sobre ${title}, ir al formulario de contacto`}>Consultar<ArrowRight size={18} aria-hidden="true" /></a>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="accessibility-faq" aria-labelledby="accessibility-faq-title">
        <h2 id="accessibility-faq-title" className="section-page-subtitle">Preguntas frecuentes</h2>
        <details>
          <summary>¿Cómo puedo solicitar apoyo?</summary>
          <p>Abre el formulario de contacto, elige “Accesibilidad y apoyo” y explica qué necesitas. El formulario prepara y guarda tu consulta en este dispositivo; todavía no la envía a la universidad.</p>
        </details>
        <details>
          <summary>¿Qué puedo incluir en mi consulta?</summary>
          <p>Describe la actividad o el recurso que necesitas y el formato o tipo de apoyo que te resultaría útil. No es necesario incluir información médica.</p>
        </details>
        <details>
          <summary>¿Cómo reporto un problema de acceso?</summary>
          <p>Indica en qué página, material o servicio encontraste la dificultad, qué intentabas hacer y qué ocurrió. Puedes mencionar el navegador o la herramienta de apoyo que utilizabas.</p>
        </details>
      </section>
      <section className="section-contact" aria-labelledby="accessibility-contact-title">
        <h2 id="accessibility-contact-title">Cuéntanos qué necesitas</h2>
        <p>Prepara tu consulta de accesibilidad en nuestro formulario.</p>
        <a className="section-action" href="#contacto" aria-label="Ir al formulario de contacto para preparar una consulta de accesibilidad">Ir al formulario de contacto<ArrowRight size={18} aria-hidden="true" /></a>
      </section>
    </div>
  )
}
