import { useRef, useState } from 'react'
import { ArrowRight, GraduationCap, BookOpen, HeartHandshake, Accessibility, Compass, X, CalendarDays, MapPin } from 'lucide-react'
import HeroCarousel from '../../components/home/HeroCarousel'
import ContactSection from '../../components/home/ContactSection'
import ProgramCarousel from '../../components/home/ProgramCarousel'
import UniversityFooter from '../../components/home/UniversityFooter'
import './Inicio.css'

const shortcuts = [
  { Icon: GraduationCap, title: 'Admisión', text: 'Orientación para comenzar tu vida universitaria.', link: 'Quiero postular', href: '#contacto', color: 'blue' },
  { Icon: BookOpen, title: 'Nuestros programas', text: 'Encuentra la carrera que conecta con tus intereses.', link: 'Explorar programas', href: '#programas', color: 'green' },
  { Icon: HeartHandshake, title: 'Becas y apoyo', text: 'Oportunidades y acompañamiento para seguir avanzando.', link: 'Solicitar información', href: '#contacto', color: 'coral' },
  { Icon: Accessibility, title: 'Accesibilidad', text: 'Recursos para una experiencia sin barreras.', link: 'Conocer recursos', href: '#accesibilidad', color: 'violet' },
  { Icon: Compass, title: 'Vida universitaria', text: 'Actividades para compartir y descubrir lo que te inspira.', link: 'Ver actividades', href: '#eventos', color: 'gold' },
]

const news = [
  { title: 'Un campus que se construye para todas las personas', category: 'COMUNIDAD', date: '2026-10-08', displayDate: '8 oct. 2026', image: 'photo-1523240795612-9a054b0db644', text: 'Nuestra comunidad propone nuevos espacios de encuentro y recursos de apoyo. La participación de estudiantes, docentes y personal permite identificar barreras y pensar juntos en una universidad más accesible.' },
  { title: 'Ideas que conectan la investigación con la comunidad', category: 'INVESTIGACIÓN', date: '2026-10-06', displayDate: '6 oct. 2026', image: 'photo-1507842217343-583bb7270b66', text: 'Los proyectos interdisciplinarios abren nuevas conversaciones sobre los desafíos de nuestro entorno. Compartir experiencias y conocimiento es el primer paso para transformar una idea en una oportunidad.' },
  { title: 'Nuevos espacios para aprender y compartir', category: 'VIDA UNIVERSITARIA', date: '2026-10-02', displayDate: '2 oct. 2026', image: 'photo-1523240795612-9a054b0db644', text: 'Talleres, grupos de estudio y actividades culturales se suman a los espacios de encuentro universitario. Una invitación a descubrir intereses, colaborar y formar parte de nuestra comunidad.' },
  { title: 'Nuevas oportunidades de orientación académica', category: 'ESTUDIANTES', date: '2026-09-29', displayDate: '29 sep. 2026', image: 'photo-1521737711867-e3b97375f902', text: 'Los espacios de orientación reúnen a estudiantes y equipos de apoyo para conversar sobre sus intereses, conocer recursos y preparar sus próximos pasos en la universidad.' },
  { title: 'La biblioteca abre nuevas rutas al conocimiento', category: 'APRENDIZAJE', date: '2026-09-25', displayDate: '25 sep. 2026', image: 'photo-1507842217343-583bb7270b66', text: 'Lecturas, encuentros y recursos de estudio acompañan a nuestra comunidad. La biblioteca invita a explorar sus colecciones y compartir nuevas preguntas en un espacio abierto al aprendizaje.' },
  { title: 'Proyectos que nacen del trabajo en equipo', category: 'INNOVACIÓN', date: '2026-09-21', displayDate: '21 sep. 2026', image: 'photo-1581092921461-eab62e97a780', text: 'La colaboración entre distintas áreas de estudio permite desarrollar proyectos, experimentar y encontrar soluciones. Nuestra comunidad comparte experiencias para seguir aprendiendo en equipo.' },
]

const imageDescriptions: Record<string, string> = {
  'photo-1581092921461-eab62e97a780': 'Persona examinando una muestra con un microscopio en un laboratorio de investigación',
  'photo-1576091160399-112ba8d25d1d': 'Profesional de salud con estetoscopio consultando información en un teléfono',
  'photo-1521737711867-e3b97375f902': 'Equipo de personas reunidas alrededor de una mesa con computadoras para colaborar',
  'photo-1523240795612-9a054b0db644': 'Estudiantes compartiendo ideas y materiales de estudio frente a estanterías de una biblioteca',
  'photo-1507842217343-583bb7270b66': 'Estanterías de una biblioteca organizadas en varios niveles y llenas de libros',
}

const events = [
  { day: '15', month: 'OCT', title: 'Conoce tu universidad', text: 'Encuentro de orientación para futuros estudiantes.', time: '10:00', place: 'Campus y modalidad virtual', date: '2026-10-15' },
  { day: '22', month: 'OCT', title: 'Jornada de accesibilidad', text: 'Diálogos sobre una educación sin barreras.', time: '15:00', place: 'Auditorio principal', date: '2026-10-22' },
  { day: '05', month: 'NOV', title: 'Feria de proyectos', text: 'Ideas y soluciones creadas por nuestra comunidad.', time: '09:00', place: 'Plaza del campus', date: '2026-11-05' },
]

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`

export default function Inicio() {
  const [selectedNews, setSelectedNews] = useState<(typeof news)[number] | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  function openNews(item: (typeof news)[number]) {
    setSelectedNews(item)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <HeroCarousel />
      <section className="quick-access" aria-label="Opciones para explorar la universidad">
        {shortcuts.map(({ Icon, title, text, link, href, color }) => (
          <article className={`shortcut shortcut--${color}`} key={title}>
            <Icon className="shortcut-icon" size={38} strokeWidth={1.5} aria-hidden="true" />
            <h2>{title}</h2><p>{text}</p>
            <a href={href} aria-label={`${link}, botón para ${title === 'Nuestros programas' ? 'explorar nuestros programas' : `acceder a ${title.toLowerCase()}`}`}><span>{link}</span><ArrowRight size={20} aria-hidden="true" /></a>
          </article>
        ))}
      </section>

      <section className="home-section content-container" id="programas" aria-labelledby="programs-title">
        <div className="section-heading"><div><p className="section-eyebrow">ENCUENTRA TU CAMINO</p><h2 id="programs-title">Un mundo de posibilidades</h2></div><a className="text-link" href="#contacto" aria-label="Recibir orientación, ir al formulario de contacto">Recibir orientación<ArrowRight size={19} aria-hidden="true" /></a></div>
        <ProgramCarousel />
      </section>

      <section className="community-band" id="comunidad" aria-labelledby="community-title">
        <div className="content-container"><div className="community-heading"><h2 id="community-title">Una comunidad que crece contigo</h2><p>Cifras ilustrativas de nuestra comunidad</p></div>
          <dl className="statistics-grid">{[{ number: '12.000+', label: 'Estudiantes' }, { number: '35', label: 'Programas académicos' }, { number: '480+', label: 'Docentes' }, { number: '60+', label: 'Convenios' }, { number: '25', label: 'Años de trayectoria' }].map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.number}</dd></div>)}</dl>
        </div>
      </section>

      <section className="home-section content-container news-events-grid" id="actualidad" aria-label="Noticias y próximos eventos">
        <section aria-labelledby="news-title"><p className="section-eyebrow">LO QUE NOS MUEVE</p><h2 id="news-title" className="block-title">Últimas noticias</h2>
          <div className="news-list">{news.map((item) => <article className="news-item" key={item.title}><img src={photo(item.image)} alt={imageDescriptions[item.image]} loading="lazy" /><div><p className="news-meta">{item.category}<span aria-hidden="true"> / </span><time dateTime={item.date}>{item.displayDate}</time></p><h3>{item.title}</h3><button className="text-link" type="button" onClick={() => openNews(item)} aria-label={`Leer noticia: ${item.title}`}>Leer noticia<ArrowRight size={18} aria-hidden="true" /></button></div></article>)}</div>
        </section>
        <section id="eventos" aria-labelledby="events-title"><p className="section-eyebrow">NOS ENCONTRAMOS PRONTO</p><h2 id="events-title" className="block-title">Próximos eventos</h2>
          <div className="event-list">{events.map((event) => <article className="event-item" key={event.title}><time className="event-date" dateTime={`${event.date}T${event.time}:00-05:00`} aria-label={`${event.day} de ${event.month === 'OCT' ? 'octubre' : 'noviembre'} de 2026 a las ${event.time}`}><strong>{event.day}</strong><span>{event.month}</span></time><div><h3>{event.title}</h3><p>{event.text}</p><p className="event-meta"><CalendarDays size={15} aria-hidden="true" />{event.time} (hora de Lima)</p><p className="event-meta"><MapPin size={15} aria-hidden="true" />{event.place}</p><a className="text-link" href="#contacto" aria-label={`Consultar sobre ${event.title}, ir al formulario de contacto`}>Consultar<ArrowRight size={16} aria-hidden="true" /></a></div></article>)}</div>
        </section>
      </section>
      <ContactSection />
      <UniversityFooter />
      <dialog className="news-dialog" ref={dialogRef} aria-labelledby="news-dialog-title" onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
        {selectedNews && <><button className="icon-button dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Botón para cerrar la noticia" title="Cerrar noticia" autoFocus><X size={22} aria-hidden="true" /></button><p className="section-eyebrow">{selectedNews.category}</p><h2 id="news-dialog-title">{selectedNews.title}</h2><time dateTime={selectedNews.date}>{selectedNews.displayDate}</time><img src={photo(selectedNews.image)} alt={imageDescriptions[selectedNews.image]} /><p>{selectedNews.text}</p></>}
      </dialog>
    </>
  )
}
