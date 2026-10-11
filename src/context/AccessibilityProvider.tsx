import type { ReactNode } from 'react'
import { AccessibilityContext } from './accessibility-context'
import { useSpeechReader } from '../hooks/useSpeechReader'

export default function AccessibilityProvider({ children }: { children: ReactNode }) {
  const reader = useSpeechReader()
  return <AccessibilityContext.Provider value={{ reader }}>{children}</AccessibilityContext.Provider>
}
