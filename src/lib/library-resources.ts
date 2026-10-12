export type LibraryResource = {
  id: string
  title: string
  subject: 'Estadística' | 'Física' | 'Economía'
  language: 'Español' | 'Inglés'
  description: string
  authors: string
  size: string
  pdf: string
  web: string
  source: string
}

const assets = 'https://assets.openstax.org/oscms-prodcms/media/documents/'

// Official publisher URLs, checked on 2026-10-12. No copies are hosted here.
export const libraryResources: LibraryResource[] = [
  {
    id: 'estadistica', title: 'Introducción a la estadística', subject: 'Estadística', language: 'Español',
    description: 'Muestreo, análisis de datos, probabilidad e inferencia estadística para tu formación universitaria.',
    authors: 'Barbara Illowsky y Susan Dean', size: '24,2 MB',
    pdf: `${assets}Introduccion_al_la_estadistica_-_WEB.pdf`,
    web: 'https://openstax.org/books/introducci%C3%B3n-estad%C3%ADstica/pages/1-introduccion',
    source: 'https://openstax.org/books/introducci%C3%B3n-estad%C3%ADstica/pages/prefacio',
  },
  {
    id: 'fisica-1', title: 'Física universitaria · Volumen 1', subject: 'Física', language: 'Español',
    description: 'Unidades, movimiento, energía, fluidos, oscilaciones y ondas en un texto basado en cálculo.',
    authors: 'Samuel J. Ling, Jeff Sanny y William Moebs', size: '68,8 MB',
    pdf: `${assets}FisicaUniversitariaVolumen1-WEB.pdf`,
    web: 'https://openstax.org/books/f%C3%ADsica-universitaria-volumen-1/pages/1-introduccion',
    source: 'https://openstax.org/books/f%C3%ADsica-universitaria-volumen-1/pages/prefacio',
  },
  {
    id: 'fisica-2', title: 'Física universitaria · Volumen 2', subject: 'Física', language: 'Español',
    description: 'Temperatura, termodinámica, campos eléctricos, circuitos y magnetismo.',
    authors: 'Samuel J. Ling, Jeff Sanny y William Moebs', size: '53,5 MB',
    pdf: `${assets}FisicaUniversitariaVolumen2-WEB.pdf`,
    web: 'https://openstax.org/books/f%C3%ADsica-universitaria-volumen-2/pages/1-introduccion',
    source: 'https://openstax.org/books/f%C3%ADsica-universitaria-volumen-2/pages/prefacio',
  },
  {
    id: 'economia', title: 'Principles of Economics · 3.ª edición', subject: 'Economía', language: 'Inglés',
    description: 'Una introducción a la microeconomía y la macroeconomía, los mercados y las decisiones económicas.',
    authors: 'Steven A. Greenlaw, David Shapiro y Daniel MacDonald', size: '47,2 MB',
    pdf: `${assets}principles-economics-3e_-_WEB.pdf`,
    web: 'https://openstax.org/books/principles-economics-3e/pages/1-introduction',
    source: 'https://openstax.org/books/principles-economics-3e/pages/preface',
  },
]
