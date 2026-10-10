import { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y } from 'swiper/modules'
import type SwiperCore from 'swiper'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/a11y'

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2400&q=85',
    alt: 'Edificio universitario rodeado de jardines y espacios abiertos',
    title: 'My-University',
    subtitle: 'Tu futuro empieza con una oportunidad.',
    description: 'Una comunidad para aprender, descubrir y construir un futuro con oportunidades para todas las personas.',
    action: 'Explorar programas', target: '#programas', accessibleLabel: 'Botón para explorar programas de nuestra universidad',
  },
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2400&q=85',
    alt: 'Estudiantes reunidos para compartir ideas en una biblioteca',
    title: 'Educación para todos',
    subtitle: 'El talento no tiene barreras.',
    description: 'Acompañamiento, recursos accesibles y una comunidad que crece contigo en cada etapa de tu formación.',
    action: 'Conocer nuestros servicios', target: '#servicios', accessibleLabel: 'Botón para conocer nuestros servicios de apoyo a estudiantes',
  },
  {
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2400&q=85',
    alt: 'Biblioteca con estanterías de libros y espacios de estudio',
    title: 'Conocimiento que transforma',
    subtitle: 'Ideas de hoy, cambios de mañana.',
    description: 'Explora nuevas preguntas, comparte tus ideas y encuentra el espacio para convertirlas en proyectos.',
    action: 'Descubrir la actualidad', target: '#actualidad', accessibleLabel: 'Botón para descubrir la actualidad, noticias y eventos de la universidad',
  },
]

export default function HeroCarousel() {
  const swiperRef = useRef<SwiperCore | null>(null)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      setReducedMotion(media.matches)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <section
      className="university-hero"
      aria-label="Carrusel de novedades de My-University"
      aria-roledescription="carrusel"
    >
      <Swiper
        modules={[A11y]}
        slidesPerView={1}
        speed={reducedMotion ? 0 : 500}
        rewind
        a11y={{ enabled: true, wrapperLiveRegion: true, slideLabelMessage: 'Imagen {{index}} de {{slidesLength}}', itemRoleDescriptionMessage: 'diapositiva' }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.title}>
            {({ isActive }) => (
              <article className="hero-slide" aria-hidden={!isActive} inert={!isActive}>
                <img className="hero-image" src={slide.image} alt={slide.alt} fetchPriority={index === 0 ? 'high' : 'auto'} />
                <div className="hero-shade" />
                <div className="hero-copy content-container">
                  <h2>{slide.title}</h2>
                  <p className="hero-subtitle">{slide.subtitle}</p>
                  <p className="hero-description">{slide.description}</p>
                  <div className="hero-actions">
                    <a className="home-button" href={slide.target} aria-label={slide.accessibleLabel}>
                      {slide.action}<ArrowRight size={18} aria-hidden="true" />
                    </a>
                    <a className="home-button home-button--light" href="#contacto" aria-label="Contactar, ir al formulario de contacto">Contactar</a>
                  </div>
                </div>
              </article>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="hero-controls content-container">
        <div className="carousel-controls" role="group" aria-label="Controles del carrusel">
          <button type="button" className="icon-button" onClick={() => swiperRef.current?.slidePrev()} aria-label="Botón para mostrar la imagen anterior" title="Imagen anterior"><ArrowLeft size={19} aria-hidden="true" /></button>
          <button type="button" className="icon-button" onClick={() => swiperRef.current?.slideNext()} aria-label="Botón para mostrar la imagen siguiente" title="Imagen siguiente"><ArrowRight size={19} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  )
}
