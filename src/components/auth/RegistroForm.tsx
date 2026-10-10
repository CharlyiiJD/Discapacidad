import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import PasswordField from './PasswordField'

const fieldLabels = {
  'register-name': 'Nombre',
  'register-surname': 'Apellidos',
  'register-email': 'Correo electrónico',
  'register-password': 'Contraseña',
  'register-confirmation': 'Confirmar contraseña',
}
type FieldId = keyof typeof fieldLabels
type FieldErrors = Partial<Record<FieldId, string>>

function registrationError(code: string | undefined) {
  switch (code) {
    case 'email_address_invalid': return 'El servicio no acepta ese correo electrónico. Revisa la dirección o utiliza otra.'
    case 'weak_password': return 'La contraseña no cumple los requisitos de seguridad del servicio. Usa al menos 12 caracteres y combina mayúsculas, minúsculas, números y símbolos.'
    case 'user_already_exists': case 'email_exists': return 'Ya existe una cuenta con ese correo. Inicia sesión con tu cuenta.'
    case 'over_request_rate_limit': case 'over_email_send_rate_limit': return 'Se han realizado demasiados intentos. Espera unos minutos antes de volver a crear tu cuenta.'
    case 'signup_disabled': return 'El registro de nuevas cuentas no está disponible en este momento.'
    default: return 'No se pudo completar el registro. Inténtalo nuevamente; si el problema continúa, contacta con la universidad.'
  }
}

export default function RegistroForm() {
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)
  const focusError = () => requestAnimationFrame(() => errorRef.current?.focus())

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current) return

    const form = event.currentTarget
    const values = new FormData(form)

    const nombre = String(values.get('nombre') ?? '').trim()
    const apellidos = String(values.get('apellidos') ?? '').trim()
    const email = String(values.get('correo') ?? '').trim()
    const password = String(values.get('register-password') ?? '')
    const confirmation = String(values.get('register-confirmation') ?? '')

    const emailInput = form.elements.namedItem('correo') as HTMLInputElement
    const nextErrors: FieldErrors = {}
    if (!nombre) nextErrors['register-name'] = 'Ingresa tu nombre para crear la cuenta.'
    if (!apellidos) nextErrors['register-surname'] = 'Ingresa tus apellidos para crear la cuenta.'
    if (!email) nextErrors['register-email'] = 'Ingresa tu correo electrónico.'
    else if (!email.includes('@')) nextErrors['register-email'] = 'El correo debe incluir el signo arroba (@). Escribe una dirección como nombre@dominio.com.'
    else if (emailInput.validity.typeMismatch) nextErrors['register-email'] = 'El correo electrónico no es válido. Revisa lo que escribiste antes y después del signo arroba, por ejemplo nombre@dominio.com.'
    if (!password) nextErrors['register-password'] = 'Crea una contraseña de al menos 12 caracteres.'
    else if (password.length < 12) nextErrors['register-password'] = 'La contraseña debe tener al menos 12 caracteres.'
    if (!confirmation) nextErrors['register-confirmation'] = 'Vuelve a escribir tu contraseña para confirmarla.'
    else if (password !== confirmation) nextErrors['register-confirmation'] = 'Las contraseñas no coinciden. Inténtalo otra vez: escribe la misma contraseña en ambos campos.'
    setErrors(nextErrors)
    setServerError('')
    setStatus('')
    if (Object.keys(nextErrors).length) {
      focusError()
      return
    }

    busyRef.current = true
    setIsLoading(true)
    setStatus('Creando tu cuenta. Por favor, espera.')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellidos,
          },
        },
      })

      if (error) {
        setStatus('')
        setServerError(registrationError(error.code))
        focusError()
        return
      }

      if (data.user && !data.session) {
        setStatus(
          'Solicitud de registro recibida. Revisa tu correo electrónico para confirmar tu cuenta. Si ya tienes una cuenta, intenta iniciar sesión.'
        )
      } else if (data.session) {
        setStatus(
          'Tu cuenta se ha creado correctamente y has iniciado sesión.'
        )
      } else {
        setStatus(
          'Solicitud procesada. Revisa tu correo electrónico para continuar.'
        )
      }

      form.reset()
    } catch {
      setStatus('')
      setServerError('No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo nuevamente.')
      focusError()
    } finally {
      setIsLoading(false)
      busyRef.current = false
    }
  }

  return (
    <>
      <form
        className="auth-form"
        aria-label="Formulario de registro de cuenta"
        noValidate
        onSubmit={handleSubmit}
        onInput={(event) => {
          const target = event.target
          if (!(target instanceof HTMLInputElement)) return
          setServerError('')
          setStatus('')
          setErrors((previous) => {
            const updated = { ...previous }
            delete updated[target.id as FieldId]
            if (target.id === 'register-password') delete updated['register-confirmation']
            return updated
          })
        }}
      >
        {(Object.keys(errors).length > 0 || serverError) && <div ref={errorRef} id="register-error-summary" className="auth-error-summary" tabIndex={-1} role="alert" aria-atomic="true" aria-labelledby="register-error-title" aria-describedby="register-error-list">
          <h3 id="register-error-title">No se pudo crear tu cuenta</h3>
          <ul id="register-error-list">
            {(Object.entries(errors) as [FieldId, string][]).map(([id, message]) => <li key={id}><a href={`#${id}`} onClick={(event) => { event.preventDefault(); document.getElementById(id)?.focus() }}>{fieldLabels[id]}: {message}</a></li>)}
            {serverError && <li>{serverError}</li>}
          </ul>
        </div>}
        <div className="auth-name-row">
          <div className="auth-field">
            <label htmlFor="register-name">Nombre</label>
            <input
              id="register-name"
              name="nombre"
              autoComplete="given-name"
              required
              maxLength={100}
              autoFocus
              disabled={isLoading}
              aria-invalid={errors['register-name'] ? true : undefined}
              aria-describedby={`register-name-help${errors['register-name'] ? ' register-name-error' : ''}`}
            />
            <p id="register-name-help" className="screen-reader-only">
              Ingresa tu nombre. Campo obligatorio.
            </p>
            {errors['register-name'] && <p id="register-name-error" className="auth-field-error">{errors['register-name']}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="register-surname">Apellidos</label>
            <input
              id="register-surname"
              name="apellidos"
              autoComplete="family-name"
              required
              maxLength={150}
              disabled={isLoading}
              aria-invalid={errors['register-surname'] ? true : undefined}
              aria-describedby={`register-surname-help${errors['register-surname'] ? ' register-surname-error' : ''}`}
            />
            <p id="register-surname-help" className="screen-reader-only">
              Ingresa tus apellidos. Campo obligatorio.
            </p>
            {errors['register-surname'] && <p id="register-surname-error" className="auth-field-error">{errors['register-surname']}</p>}
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Correo electrónico</label>
          <input
            id="register-email"
            name="correo"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            aria-invalid={errors['register-email'] ? true : undefined}
            aria-describedby={`register-email-help${errors['register-email'] ? ' register-email-error' : ''}`}
          />
          <p id="register-email-help" className="screen-reader-only">
            Ingresa el correo electrónico que deseas asociar a tu cuenta.
            Campo obligatorio.
          </p>
          {errors['register-email'] && <p id="register-email-error" className="auth-field-error">{errors['register-email']}</p>}
        </div>

        <PasswordField
          id="register-password"
          label="Contraseña"
          autoComplete="new-password"
          minLength={12}
          error={errors['register-password']}
          disabled={isLoading}
          description="Crea una contraseña de al menos 12 caracteres. Campo obligatorio. Puedes usar el botón Mostrar contraseña para revisar lo que escribiste."
        />

        <PasswordField
          id="register-confirmation"
          label="Confirmar contraseña"
          autoComplete="new-password"
          minLength={12}
          error={errors['register-confirmation']}
          disabled={isLoading}
          description="Vuelve a escribir la misma contraseña para confirmarla. Campo obligatorio."
        />

        <button
          type="submit"
          className="auth-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p
          className="auth-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status}
        </p>
      </form>

      <p className="auth-alternative">
        ¿Ya tienes una cuenta?{' '}
        <a
          href="#iniciar-sesion"
          aria-label="Iniciar sesión, abrir el formulario de acceso"
        >
          Iniciar sesión
        </a>
      </p>
    </>
  )
}
