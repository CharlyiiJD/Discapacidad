import { useState, type FormEvent } from 'react'
import { ArrowRight, Mail, MessageCircle, Clock } from 'lucide-react'

export default function ContactSection() {
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    try {
      localStorage.setItem('university-contact-draft', JSON.stringify(values))
      setStatus('Tu consulta se guardó en este dispositivo. Aún no se ha enviado a la universidad.')
    } catch {
      setStatus('No se pudo guardar tu consulta. Revisa la configuración de almacenamiento del navegador e inténtalo de nuevo.')
    }
  }

  return (
    <section className="contact-band" id="contacto" aria-labelledby="contact-form-title" tabIndex={-1}>
      <div className="content-container contact-grid">
        <div>
          <p className="section-eyebrow">ESTAMOS PARA AYUDARTE</p>
          <h2 id="contact-title">Conversemos sobre<br />tu próximo paso.</h2>
          <p>Cuéntanos qué necesitas. Nuestro equipo puede orientarte sobre programas, admisión y apoyo a estudiantes.</p>
          <ul className="contact-details" role="list">
            <li><MessageCircle size={22} aria-hidden="true" /><span>Orientación académica y apoyo personalizado</span></li>
            <li><Mail size={22} aria-hidden="true" /><span>Atención por escrito y formatos accesibles</span></li>
            <li><Clock size={22} aria-hidden="true" /><span>Lunes a viernes, de 9:00 a 17:00</span></li>
          </ul>
        </div>
        <form className="contact-form" onSubmit={handleSubmit} aria-labelledby="contact-form-title" aria-describedby="contact-form-description contact-notice">
          <h3 id="contact-form-title">Formulario de contacto</h3>
          <p id="contact-form-description" className="screen-reader-only">Completa tus datos y escribe tu consulta. Todos los campos son obligatorios.</p>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="contact-name">Nombre completo</label>
              <input id="contact-name" name="nombre" autoComplete="name" required maxLength={120} placeholder="Ingresa tu nombre completo" aria-describedby="contact-name-help" />
              <p id="contact-name-help" className="screen-reader-only">Ingresa tu nombre y apellidos en este espacio. Campo obligatorio.</p>
            </div>
            <div className="form-field">
              <label htmlFor="contact-email">Correo electrónico</label>
              <input id="contact-email" name="correo" type="email" autoComplete="email" required maxLength={254} placeholder="nombre@ejemplo.com" aria-describedby="contact-email-help" />
              <p id="contact-email-help" className="screen-reader-only">Escribe tu correo electrónico completo, por ejemplo nombre@ejemplo.com. Campo obligatorio.</p>
            </div>
          </div>
          <label htmlFor="contact-topic">¿Sobre qué quieres conversar?
            <select id="contact-topic" name="tema" defaultValue="" required aria-describedby="contact-topic-help">
              <option value="" disabled>Selecciona un tema</option>
              <option>Programas y admisión</option><option>Becas</option><option>Accesibilidad y apoyo</option><option>Otra consulta</option>
            </select>
          </label>
          <p id="contact-topic-help" className="screen-reader-only">Selecciona un tema. Abre la lista con Enter o Alt y flecha abajo, recorre las opciones con las flechas y confirma con Enter. En dispositivos táctiles, explora las opciones con los gestos de tu lector de pantalla. Campo obligatorio.</p>
          <label htmlFor="contact-message">Tu mensaje<textarea id="contact-message" name="mensaje" rows={4} required maxLength={3000} placeholder="Escribe aquí tu consulta" aria-describedby="contact-message-help" /></label>
          <p id="contact-message-help" className="screen-reader-only">Escribe qué necesitas y cómo podemos orientarte. Puedes ingresar hasta 3000 caracteres. Campo obligatorio.</p>
          <p id="contact-notice" className="form-note">Por ahora, el formulario guarda tu consulta solo en este dispositivo.</p>
          <button type="submit" className="home-button" aria-label="Guardar consulta, botón para guardar tu mensaje en este dispositivo">Guardar consulta<ArrowRight size={18} aria-hidden="true" /></button>
          <p className="form-status" role="status" aria-live="polite">{status}</p>
        </form>
      </div>
    </section>
  )
}
