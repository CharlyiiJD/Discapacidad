import { useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Download, ExternalLink, FileText, Search, X } from 'lucide-react'
import { libraryResources, type LibraryResource } from '../../lib/library-resources'
import '../sections.css'
import './Biblioteca.css'

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()

export default function Biblioteca() {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [language, setLanguage] = useState('')
  const [selected, setSelected] = useState<LibraryResource | null>(null)
  const readerRef = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLButtonElement | null>(null)
  const resources = libraryResources.filter((item) => (!subject || subject === item.subject) && (!language || language === item.language)
    && normalize(`${item.title} ${item.authors} ${item.subject} ${item.description}`).includes(normalize(query)))

  function openReader(item: LibraryResource, button: HTMLButtonElement) {
    returnFocus.current = button
    setSelected(item)
    requestAnimationFrame(() => { readerRef.current?.focus(); readerRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }) })
  }
  function closeReader() {
    setSelected(null)
    requestAnimationFrame(() => returnFocus.current?.isConnected ? returnFocus.current.focus() : document.getElementById('library-search')?.focus())
  }

  return (
    <div className="library-page">
      <a className="section-action library-back" href="#servicios" aria-label="Volver a Servicios desde la biblioteca"><ArrowLeft size={17} aria-hidden="true" />Servicios</a>
      <p className="section-page-intro">Libros universitarios de acceso abierto para acompañar tus estudios.</p>
      <img className="library-image" src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=80" alt="Estanterías de libros organizadas en una biblioteca con pasillos de consulta" />
      <section className="library-catalog" aria-labelledby="library-catalog-title">
        <div className="library-section-heading"><h2 id="library-catalog-title">Catálogo digital</h2><span>{libraryResources.length} libros · OpenStax</span></div>
        <div className="library-filters" role="search" aria-label="Buscar y filtrar materiales de biblioteca">
          <div className="library-search-field"><label htmlFor="library-search">Buscar material</label><div><Search size={19} aria-hidden="true" /><input id="library-search" type="search" placeholder="Título, autor o materia" value={query} onChange={(event) => setQuery(event.target.value)} aria-describedby="library-search-help" /></div><p id="library-search-help" className="screen-reader-only">Ingresa un título, autor o tema. El catálogo se filtra automáticamente sin mover el foco.</p></div>
          <div><label htmlFor="library-subject">Área de estudio</label><select id="library-subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">Todas las áreas</option><option>Estadística</option><option>Física</option><option>Economía</option></select></div>
          <div><label htmlFor="library-language">Idioma</label><select id="library-language" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">Todos los idiomas</option><option>Español</option><option>Inglés</option></select></div>
        </div>
        <p className="library-results" role="status" aria-live="polite" aria-atomic="true">{resources.length === 1 ? '1 material disponible' : `${resources.length} materiales disponibles`}</p>
        <p id="library-pdf-help" className="screen-reader-only">PDF para descargar abre el archivo oficial en una nueva pestaña. Dependiendo del navegador, se descargará o podrás guardarlo con la opción Descargar del visor. Los tamaños son aproximados y los archivos requieren conexión a Internet.</p>
        <ul className="library-grid" role="list">
          {resources.map((item) => <li key={item.id}>
            <article className={`library-book library-book--${item.id}`} aria-labelledby={`library-${item.id}-title`}>
              <div className="library-book-meta"><span className="library-subject"><BookOpen size={18} aria-hidden="true" />{item.subject}</span><span>{item.language}</span></div>
              <h3 id={`library-${item.id}-title`}>{item.title}</h3>
              <p className="library-authors">{item.authors}</p><p className="library-description">{item.description}</p>
              <p className="library-format"><FileText size={16} aria-hidden="true" />PDF · {item.size} · Acceso gratuito</p>
              <div className="library-actions">
                <button type="button" className="library-primary" aria-label={`Leer en línea ${item.title}, abrir el visor PDF dentro de la biblioteca. Idioma ${item.language}.`} aria-controls={selected ? 'library-reader' : undefined} onClick={(event) => openReader(item, event.currentTarget)}><BookOpen size={17} aria-hidden="true" />Leer en línea</button>
                <a className="library-download" href={item.pdf} target="_blank" rel="noopener noreferrer" aria-label={`PDF para descargar: ${item.title}, ${item.size}, idioma ${item.language}. Abre el archivo oficial en otra pestaña.`} aria-describedby="library-pdf-help"><Download size={17} aria-hidden="true" />PDF para descargar</a>
              </div>
              <a className="library-source" href={item.source} target="_blank" rel="noopener noreferrer" aria-label={`Fuente y licencia de ${item.title} en OpenStax, nueva pestaña`}>Fuente y licencia<ExternalLink size={14} aria-hidden="true" /></a>
            </article>
          </li>)}
        </ul>
        {!resources.length && <div className="library-empty"><h3>No encontramos materiales</h3><button type="button" className="section-action" onClick={() => { setQuery(''); setSubject(''); setLanguage('') }} aria-label="Restablecer los filtros para mostrar todos los materiales">Mostrar todos los materiales</button></div>}
      </section>
      {selected && <section ref={readerRef} id="library-reader" className="library-reader" aria-labelledby="library-reader-title" aria-describedby="library-reader-help" tabIndex={-1}>
        <div className="library-section-heading"><div><p className="library-reader-label">LECTURA EN LÍNEA</p><h2 id="library-reader-title">{selected.title}</h2></div><button type="button" className="library-close" onClick={closeReader} aria-label={`Cerrar el visor de ${selected.title} y volver al catálogo`} title="Cerrar visor"><X size={22} aria-hidden="true" /></button></div>
        <div className="library-reader-links"><a href={selected.web} target="_blank" rel="noopener noreferrer" aria-label={`Leer versión web de ${selected.title} en OpenStax, alternativa al PDF para lectores de pantalla, nueva pestaña`}>Leer versión web<ExternalLink size={16} aria-hidden="true" /></a><a href={selected.pdf} target="_blank" rel="noopener noreferrer" aria-label={`Abrir PDF de ${selected.title} en una nueva pestaña`}>Abrir PDF en otra pestaña<ExternalLink size={16} aria-hidden="true" /></a></div>
        <p id="library-reader-help" className="library-reader-note">El visor PDF depende de tu navegador. La versión web ofrece una alternativa para lectores de pantalla; la voz integrada de este portal no lee el interior del PDF.</p>
        <iframe key={selected.id} src={selected.pdf} title={`Visor PDF: ${selected.title}, en ${selected.language}`} className="library-pdf" />
      </section>}
    </div>
  )
}
