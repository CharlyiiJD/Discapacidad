import { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, Pagination } from 'swiper/modules'
import type SwiperCore from 'swiper'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/pagination'

const images = {
  technology: { id: 'photo-1581092921461-eab62e97a780', alt: 'Persona examinando una muestra con un microscopio en un laboratorio de investigación' },
  health: { id: 'photo-1576091160399-112ba8d25d1d', alt: 'Profesional de salud con estetoscopio consultando información en un teléfono' },
  business: { id: 'photo-1521737711867-e3b97375f902', alt: 'Equipo reunido alrededor de una mesa con computadoras para colaborar' },
  learning: { id: 'photo-1523240795612-9a054b0db644', alt: 'Estudiantes compartiendo ideas y materiales de estudio en una biblioteca' },
}

const programs = [
  { name: 'Ingeniería de sistemas', area: 'TECNOLOGÍA', image: images.technology },
  { name: 'Ingeniería industrial', area: 'INGENIERÍA', image: images.technology },
  { name: 'Enfermería', area: 'CIENCIAS DE LA SALUD', image: images.health },
  { name: 'Psicología', area: 'BIENESTAR Y COMUNIDAD', image: images.health },
  { name: 'Administración', area: 'NEGOCIOS Y GESTIÓN', image: images.business },
  { name: 'Contabilidad', area: 'NEGOCIOS Y GESTIÓN', image: images.business },
  { name: 'Economía', area: 'CIENCIAS SOCIALES', image: images.business },
  { name: 'Educación', area: 'APRENDIZAJE', image: images.learning },
  { name: 'Derecho', area: 'SOCIEDAD Y JUSTICIA', image: images.learning },
  { name: 'Comunicación', area: 'HUMANIDADES', image: images.learning },
]

export default function ProgramCarousel() {
  const swiperRef = useRef<SwiperCore | null>(null)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setReducedMotion(media.matches)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <div
      className="program-carousel-wrapper"
    >
      <Swiper
        className="program-carousel"
        modules={[A11y, Pagination]}
        slidesPerView={1}
        spaceBetween={26}
        breakpoints={{ 600: { slidesPerView: 2 }, 1000: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } }}
        watchSlidesProgress
        rewind
        speed={reducedMotion ? 0 : 1200}
        pagination={{
          clickable: true,
          renderBullet: (index, className) => `<button type="button" class="${className}" aria-label="Ir al grupo de carreras ${index + 1}"></button>`,
        }}
        a11y={{ enabled: true, containerMessage: 'Carrusel de diez carreras universitarias', containerRole: 'region', containerRoleDescriptionMessage: 'carrusel', wrapperLiveRegion: true, slideLabelMessage: 'Carrera {{index}} de {{slidesLength}}', paginationBulletMessage: 'Botón para ir al grupo de carreras {{index}}' }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
      >
        {programs.map((program) => (
          <SwiperSlide key={program.name}>
            {({ isVisible }) => (
              <article className="program-item" inert={!isVisible} aria-hidden={!isVisible}>
                <img src={`https://images.unsplash.com/${program.image.id}?auto=format&fit=crop&w=800&q=80`} alt={program.image.alt} loading="lazy" />
                <p className="section-eyebrow">{program.area}</p>
                <h3>{program.name}</h3>
                <a className="text-link" href="#contacto" aria-label={`Conocer más sobre ${program.name}, solicitar orientación sobre esta carrera`}>Conocer más<ArrowRight size={18} aria-hidden="true" /></a>
              </article>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="program-carousel-controls" role="group" aria-label="Controles del carrusel de carreras">
        <button type="button" className="icon-button" onClick={() => swiperRef.current?.slidePrev()} aria-label="Mostrar las carreras anteriores" title="Carreras anteriores"><ArrowLeft size={19} aria-hidden="true" /></button>
        <button type="button" className="icon-button" onClick={() => swiperRef.current?.slideNext()} aria-label="Mostrar las carreras siguientes" title="Carreras siguientes"><ArrowRight size={19} aria-hidden="true" /></button>
      </div>
    </div>
  )
}
