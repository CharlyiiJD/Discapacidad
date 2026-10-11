import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type PasswordFieldProps = {
  id: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  description: string
  minLength?: number
  error?: string
  disabled?: boolean
}

export default function PasswordField({ id, label, autoComplete, description, minLength, error, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input id={id} name={id} type={visible ? 'text' : 'password'} data-speech-sensitive autoComplete={autoComplete} required minLength={minLength} disabled={disabled} spellCheck={false} autoCapitalize="none" aria-invalid={error ? true : undefined} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} />
        <button
          type="button" className="auth-icon-button" aria-pressed={visible} aria-controls={id} disabled={disabled}
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          title={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      <p id={`${id}-help`} className="screen-reader-only">{description}</p>
      {error && <p id={`${id}-error`} className="auth-field-error">{error}</p>}
    </div>
  )
}
