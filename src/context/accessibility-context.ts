import { createContext, useContext } from 'react'
import type { useSpeechReader } from '../hooks/useSpeechReader'

export const AccessibilityContext = createContext<{
  reader: ReturnType<typeof useSpeechReader>
} | null>(null)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) throw new Error('Los controles de accesibilidad requieren AccessibilityProvider')
  return context
}
