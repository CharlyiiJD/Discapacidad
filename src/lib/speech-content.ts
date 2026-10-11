import { computeAccessibleDescription, computeAccessibleName, getRole } from 'dom-accessibility-api'

export const liveSelector = '[role="alert"], [role="status"], [aria-live="polite"], [aria-live="assertive"]'
const controls = 'button, a[href], input, select, textarea, summary, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="slider"]'
const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

export function activeContentDialog(): Element | null {
  return Array.from(document.querySelectorAll('dialog[open][aria-modal="true"], dialog[open]:modal'))
    .filter((dialog) => !dialog.hasAttribute('data-speech-controls')).at(-1) ?? null
}

export function isReadable(element: Element): boolean {
  if (element.closest('[hidden], [inert], [aria-hidden="true"], [data-speech-ignore], dialog:not([open])')) return false
  const modal = activeContentDialog()
  if (modal && !modal.contains(element) && !element.closest('#speech-reader-panel')) return false
  const style = getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

export function isSensitive(element: Element): boolean {
  return !!element.closest('[data-speech-sensitive]') || element.matches('input[type="password"], [autocomplete="current-password"], [autocomplete="new-password"], [autocomplete="one-time-code"]')
    || /password|contrase[n\u00f1]a|\botp\b|token|auth.?code/i.test(`${element.id} ${element.getAttribute('name') ?? ''}`)
}

const roleNames: Record<string, string> = {
  button: 'bot\u00f3n', link: 'enlace', combobox: 'lista desplegable', listbox: 'lista de opciones',
  checkbox: 'casilla de verificaci\u00f3n', radio: 'opci\u00f3n', switch: 'interruptor', slider: 'control deslizante',
  textbox: 'campo de texto', spinbutton: 'campo num\u00e9rico', menuitem: 'opci\u00f3n de men\u00fa',
  group: 'grupo', region: 'secci\u00f3n', main: 'contenido principal', dialog: 'ventana de di\u00e1logo',
}

export function describeFocus(element: Element): string {
  if (!isReadable(element)) return ''
  if (element.matches(liveSelector)) return readableText(element)
  const name = computeAccessibleName(element) || element.getAttribute('title') || (element.matches('[tabindex]') && !element.matches(controls) ? readableText(element) : '')
  const description = computeAccessibleDescription(element)
  const role = roleNames[getRole(element) ?? ''] ?? (element.tagName === 'SUMMARY' ? 'bot\u00f3n' : '')
  const parts = [name, role && !name.toLowerCase().includes(role) ? role : '']
  if (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true') parts.push('no disponible')
  if (element.matches(':required') || element.getAttribute('aria-required') === 'true') parts.push('obligatorio')
  if (element.getAttribute('aria-invalid') === 'true') parts.push('revisa este campo')
  if (element.hasAttribute('aria-expanded')) parts.push(element.getAttribute('aria-expanded') === 'true' ? 'expandido' : 'contra\u00eddo')
  if (element.hasAttribute('aria-pressed')) parts.push(element.getAttribute('aria-pressed') === 'true' ? 'activado' : 'desactivado')
  if (element.matches('input[type="checkbox"], input[type="radio"]')) {
    const input = element as HTMLInputElement
    parts.push(input.indeterminate ? 'selecci\u00f3n parcial' : input.checked ? 'seleccionado' : 'no seleccionado')
  } else if (element.hasAttribute('aria-checked')) parts.push(element.getAttribute('aria-checked') === 'true' ? 'seleccionado' : 'no seleccionado')
  if (element.hasAttribute('aria-current') && element.getAttribute('aria-current') !== 'false') parts.push('actual')
  if (element.matches('select') && !isSensitive(element)) {
    parts.push(`Opci\u00f3n actual: ${Array.from((element as HTMLSelectElement).selectedOptions).map((option) => option.textContent).join(', ')}`)
  }
  if (element instanceof HTMLInputElement && element.type === 'range' && !isSensitive(element)) parts.push(element.getAttribute('aria-valuetext') ?? element.value)
  if (isSensitive(element)) parts.push('campo protegido; su contenido no se leer\u00e1')
  if (description && !clean(name).includes(clean(description))) parts.push(description)
  return clean(parts.filter(Boolean).join('. '))
}

// Read the rendered content, not form values or repeated hidden ARIA descriptions.
export function readableText(root: Element): string {
  function visit(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return clean(node.textContent ?? '')
    if (!(node instanceof Element) || !isReadable(node)) return ''
    if (node.matches('script, style, svg, .screen-reader-only, [data-speech-controls], nav, footer')) return ''
    if (node.matches('input, textarea')) return describeField(node)
    if (isSensitive(node)) return 'Campo protegido'
    if (node.matches('img')) return node.getAttribute('alt') ?? ''
    if (node.matches('table')) {
      const table = node as HTMLTableElement
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => clean(th.textContent ?? ''))
      const rows = Array.from(table.rows).filter((row) => !row.closest('thead') && isReadable(row))
      return [table.caption?.textContent ?? computeAccessibleName(table), ...rows.map((row) => {
        const entry = row.querySelector('.table-entry-button[aria-label]')
        if (entry) return computeAccessibleName(entry)
        return Array.from(row.cells).map((cell, index) => `${headers[index] ?? ''}: ${visitChildren(cell)}`).join('. ')
      })].join('. ')
    }
    if (node.matches(controls)) return describeFocus(node)
    const children = node.matches('details:not([open])') ? Array.from(node.children).filter((child) => child.matches('summary')) : Array.from(node.childNodes)
    return children.map(visit).filter(Boolean).join(node.matches('p, h1, h2, h3, h4, section, article, div, dl, ul, ol, li, fieldset') ? '. ' : ' ')
  }
  function visitChildren(element: Element): string { return Array.from(element.childNodes).map(visit).filter(Boolean).join(' ') }
  function describeField(element: Element): string {
    return [computeAccessibleName(element), isSensitive(element) ? 'campo protegido' : 'campo de formulario'].filter(Boolean).join(', ')
  }
  return clean(visit(root)).replace(/(?:\.\s*){2,}/g, '. ')
}

export function speechChunks(text: string): string[] {
  const words = clean(text).split(' ')
  const chunks: string[] = []
  let current = ''
  for (const word of words) {
    if (current.length + word.length > 450 && current) { chunks.push(current); current = '' }
    current += `${current ? ' ' : ''}${word}`
  }
  if (current) chunks.push(current)
  return chunks
}
