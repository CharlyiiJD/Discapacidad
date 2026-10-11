
import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import PasswordField from '../../components/auth/PasswordField'

export default function IniciarSesion() {
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const values = new FormData(form)

    const email = String(values.get('correo') ?? '').trim()
    const password = String(values.get('login-password') ?? '')

    if (!password) {
      setStatus('Ingresa tu contraseña.')
      return
    }

    setIsLoading(true)
    setStatus('Verificando tus credenciales. Por favor, espera.')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setStatus('Correo electrónico o contraseña incorrectos.')
        return
      }

      setStatus('¡Inicio de sesión exitoso! Bienvenido a UNCP Accesible.')

      form.reset()
    } catch {
      setStatus('No se pudo conectar con el servidor. Inténtalo nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form
        className="auth-form"
        aria-label="Formulario de inicio de sesión"
        onSubmit={handleSubmit}
      >
        <div className="auth-field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            name="correo"
            type="email"
            autoComplete="username"
            required
            autoFocus
            aria-describedby="login-email-help"
          />
          <p id="login-email-help" className="screen-reader-only">
            Ingresa el correo electrónico de tu cuenta. Campo obligatorio.
          </p>
        </div>

        <PasswordField
          id="login-password"
          label="Contraseña"
          autoComplete="current-password"
          description="Ingresa la contraseña de tu cuenta. Campo obligatorio. Puedes usar el botón Mostrar contraseña para revisar lo que escribiste."
        />

        <button
          className="auth-submit"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
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
        ¿No tienes una cuenta?{' '}
        <a
          href="#registro"
          aria-label="Regístrate si todavía no tienes una cuenta. Abrir el formulario para crear tu cuenta."
        >
          Regístrate
        </a>
      </p>
    </>
  )
}
