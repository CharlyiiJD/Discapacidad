import { useCallback, useEffect, useRef, useState } from 'react'
import { activeContentDialog, describeFocus, isReadable, liveSelector, readableText, speechChunks } from '../lib/speech-content'

type Playback = 'idle' | 'speaking' | 'paused'
const rateKey = 'uncp-speech-rate'
function initialRate() {
  try {
    const value = Number(localStorage.getItem(rateKey) ?? '1')
    return Number.isFinite(value) && value >= 0.5 && value <= 2 ? value : 1
  } catch { return 1 }
}

export function useSpeechReader() {
  const [supported] = useState(() => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
  const [enabled, setEnabled] = useState(false)
  const [playback, setPlayback] = useState<Playback>('idle')
  const [rate, setRate] = useState(initialRate)
  const [voiceLabel, setVoiceLabel] = useState('Voz en espa\u00f1ol del navegador')
  const [error, setError] = useState('')
  const enabledRef = useRef(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const rateRef = useRef(rate)
  const generation = useRef(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const scopeRef = useRef<Element | null>(null)
  const lastAnnouncement = useRef({ text: '', time: 0 })
  const liveSnapshot = useRef(new WeakMap<Element, string>())
  const liveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const suppressFocus = useRef(false)
  const remainingSpeech = useRef('')
  const pausedSpeech = useRef<string | null>(null)

  const withoutFocusAnnouncement = useCallback((action: () => void) => {
    suppressFocus.current = true
    try { action() } finally { suppressFocus.current = false }
  }, [])

  const cancelPlayback = useCallback(() => {
    generation.current++
    if (supported) window.speechSynthesis.cancel()
    utteranceRef.current = null
    remainingSpeech.current = ''
    pausedSpeech.current = null
    setPlayback('idle')
  }, [supported])

  const stop = useCallback(() => {
    clearTimeout(liveTimer.current)
    cancelPlayback()
  }, [cancelPlayback])

  const speak = useCallback((text: string, deduplicate = false, preservePaused = false) => {
    if (!supported || !enabledRef.current || document.hidden || !text.trim()) return
    const normalized = text.toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    const previous = lastAnnouncement.current
    if (deduplicate && Date.now() - previous.time < 2200 && (previous.text.includes(normalized) || normalized.includes(previous.text)) && previous.text) return
    const paused = preservePaused ? pausedSpeech.current : null
    cancelPlayback()
    pausedSpeech.current = paused
    lastAnnouncement.current = { text: normalized, time: Date.now() }
    setError('')
    const token = generation.current
    const chunks = speechChunks(text)
    function next(index: number) {
      if (token !== generation.current || !enabledRef.current) return
      if (index >= chunks.length) { utteranceRef.current = null; remainingSpeech.current = ''; setPlayback(pausedSpeech.current !== null ? 'paused' : 'idle'); return }
      remainingSpeech.current = chunks.slice(index).join(' ')
      const utterance = new SpeechSynthesisUtterance(chunks[index])
      utterance.lang = voiceRef.current?.lang ?? 'es-PE'
      utterance.voice = voiceRef.current
      utterance.rate = rateRef.current
      utterance.onend = () => next(index + 1)
      utterance.onerror = (event) => {
        if (token !== generation.current) return
        stop()
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setError('No se pudo reproducir la voz. Activa nuevamente la lectura y comprueba las voces en espa\u00f1ol y el audio del navegador.')
        }
      }
      utteranceRef.current = utterance
      setPlayback(pausedSpeech.current !== null ? 'paused' : 'speaking')
      try { window.speechSynthesis.speak(utterance) } catch {
        stop()
        setError('El navegador no pudo iniciar la voz. Int\u00e9ntalo nuevamente.')
      }
    }
    next(0)
  }, [supported, stop, cancelPlayback])

  useEffect(() => {
    if (!supported) return
    const synthesis = window.speechSynthesis
    function updateVoices() {
      const voices = synthesis.getVoices()
      voiceRef.current = voices.find((voice) => voice.lang.toLowerCase().replace('_', '-') === 'es-pe')
        ?? voices.find((voice) => /^es(?:[-_]|$)/i.test(voice.lang) && voice.localService)
        ?? voices.find((voice) => /^es(?:[-_]|$)/i.test(voice.lang)) ?? null
      setVoiceLabel(voiceRef.current ? `${voiceRef.current.name} (${voiceRef.current.lang})` : voices.length ? 'No hay una voz espa\u00f1ola instalada; el navegador intentar\u00e1 usar espa\u00f1ol.' : 'Cargando voces; se solicitar\u00e1 espa\u00f1ol al navegador.')
    }
    updateVoices()
    synthesis.addEventListener('voiceschanged', updateVoices)
    return () => { synthesis.removeEventListener('voiceschanged', updateVoices); generation.current++; synthesis.cancel() }
  }, [supported])

  const activate = useCallback((announce = true) => {
    if (!supported || enabledRef.current) return
    liveSnapshot.current = new WeakMap()
    document.querySelectorAll(liveSelector).forEach((node) => liveSnapshot.current.set(node, readableText(node)))
    enabledRef.current = true
    setEnabled(true)
    if (announce) speak('Lectura asistida activada. Los controles se anunciar\u00e1n al recibir el foco. Puedes usar Leer secci\u00f3n para escuchar el contenido.')
  }, [supported, speak])

  const toggle = useCallback(() => {
    if (!supported) return
    if (enabledRef.current) {
      enabledRef.current = false
      setEnabled(false)
      stop()
      setError('')
    } else {
      activate()
    }
  }, [supported, stop, activate])

  const announcePanelFocus = useCallback((element: Element, prefix = '') => {
    speak(`${prefix} ${describeFocus(element)}`.trim(), false, true)
  }, [speak])

  const readSection = useCallback(() => {
    const modal = activeContentDialog()
    const scope = modal ?? (scopeRef.current?.isConnected && isReadable(scopeRef.current) ? scopeRef.current : null)
      ?? document.getElementById('portal-content') ?? document.getElementById('contenido-principal')
    if (scope) speak(readableText(scope) || 'Esta secci\u00f3n todav\u00eda no tiene contenido.')
  }, [speak])

  const pause = useCallback(() => {
    if (supported && utteranceRef.current) {
      pausedSpeech.current = remainingSpeech.current
      window.speechSynthesis.pause()
      setPlayback('paused')
    }
  }, [supported])
  const resume = useCallback(() => {
    if (!supported) return
    if (pausedSpeech.current !== null) speak(pausedSpeech.current)
    else if (utteranceRef.current) { window.speechSynthesis.resume(); setPlayback('speaking') }
  }, [supported, speak])
  const changeRate = useCallback((value: number) => {
    if (!Number.isFinite(value)) return
    const next = Math.max(0.5, Math.min(2, value))
    stop()
    rateRef.current = next
    setRate(next)
    try { localStorage.setItem(rateKey, String(next)) } catch { /* Preferences are optional when storage is unavailable. */ }
  }, [stop])

  useEffect(() => {
    if (!enabled) return
    function focus(event: FocusEvent) {
      const element = event.target
      if (suppressFocus.current) return
      if (!(element instanceof Element) || !isReadable(element)) return
      if (element.closest('#speech-reader-panel')) { announcePanelFocus(element); return }
      if (element.closest('[data-speech-controls]')) return
      if (element.closest('main')) scopeRef.current = element.closest('section[aria-labelledby], section[aria-label]') ?? document.getElementById('contenido-principal')
      speak(describeFocus(element))
    }
    function change(event: Event) {
      const element = event.target
      if (!(element instanceof Element)) return
      if (element.matches('#speech-reader-panel input[type="range"]')) { announcePanelFocus(element); return }
      if (element.closest('[data-speech-controls]')) return
      if (element.matches('select, input[type="checkbox"], input[type="radio"]')) speak(describeFocus(element), true)
    }
    function scanLiveRegions() {
      const messages: string[] = []
      document.querySelectorAll(liveSelector).forEach((region) => {
        if (region.closest('[data-speech-controls], [aria-live="off"]') || !isReadable(region) || region.closest('[aria-busy="true"]')) return
        const text = readableText(region)
        const previous = liveSnapshot.current.get(region)
        liveSnapshot.current.set(region, text)
        // The outer live region already contains the text of nested regions.
        if (text && text !== previous && !region.parentElement?.closest(liveSelector)) messages.push(text)
      })
      if (messages.length) speak([...new Set(messages)].join('. '), true)
    }
    const observer = new MutationObserver((records) => {
      if (records.every((record) => (record.target instanceof Element ? record.target : record.target.parentElement)?.closest('[data-speech-controls]'))) return
      clearTimeout(liveTimer.current)
      liveTimer.current = setTimeout(scanLiveRegions, 160)
    })
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-busy', 'aria-live', 'open', 'hidden', 'inert'] })
    function routeChange() { stop(); scopeRef.current = null; lastAnnouncement.current = { text: '', time: 0 } }
    function visibility() { if (document.hidden) stop() }
    document.addEventListener('focusin', focus)
    document.addEventListener('change', change)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('hashchange', routeChange)
    return () => {
      observer.disconnect()
      clearTimeout(liveTimer.current)
      document.removeEventListener('focusin', focus)
      document.removeEventListener('change', change)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('hashchange', routeChange)
    }
  }, [enabled, speak, stop, announcePanelFocus])

  return { supported, enabled, playback, rate, voiceLabel, error, activate, toggle, readSection, pause, resume, stop, changeRate, withoutFocusAnnouncement, announcePanelFocus }
}
