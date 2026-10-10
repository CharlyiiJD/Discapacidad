import { Fragment, useId, useState, type ReactNode } from 'react'

export type StudentRow = { id: string; cells: ReactNode[]; accessibleLabel?: string; cellLabels?: string[] }

export default function StudentTable({ caption, columns, rows, entryColumn = 0 }: { caption: string; columns: string[]; rows: StudentRow[]; entryColumn?: number }) {
  const prefix = useId()
  const [expanded, setExpanded] = useState<string | null>(null)
  const description = (row: StudentRow) => row.accessibleLabel ?? `${caption}. ${columns.map((column, index) => `${column}: ${typeof row.cells[index] === 'string' || typeof row.cells[index] === 'number' ? row.cells[index] : 'No disponible'}`).join('. ')}.`
  return (
    <div className="student-table-scroll" role="region" aria-label={caption} tabIndex={0} onKeyDown={(event) => {
      if (event.key === 'Enter' && event.target === event.currentTarget) { event.preventDefault(); event.currentTarget.querySelector<HTMLButtonElement>('.table-entry-button')?.focus() }
    }}>
      <table className="student-table">
        <caption className="screen-reader-only">{caption}</caption>
        <thead><tr>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => {
          const detailId = `${prefix}-detail-${rowIndex}`
          const buttonId = `${prefix}-button-${rowIndex}`
          const open = expanded === row.id
          return <Fragment key={row.id}>
            <tr>{row.cells.map((cell, index) => <td key={columns[index]}>{index === entryColumn ? <button id={buttonId} type="button" className="table-entry-button" data-student-row-id={row.id} aria-label={`${description(row)} ${open ? 'Ocultar' : 'Abrir'} detalle.`} aria-expanded={open} aria-controls={open ? detailId : undefined} onClick={() => {
              setExpanded(open ? null : row.id)
              if (!open) requestAnimationFrame(() => document.getElementById(detailId)?.focus())
            }}>{cell ?? 'No disponible'}</button> : cell ?? 'No disponible'}</td>)}</tr>
            {open && <tr className="student-detail-row"><td colSpan={columns.length}>
              <div id={detailId} className="student-row-detail" role="group" tabIndex={0} aria-label={description(row)} onKeyDown={(event) => {
                if (event.key === 'Escape') { event.preventDefault(); setExpanded(null); document.getElementById(buttonId)?.focus() }
              }}>
                <dl>{columns.map((column, index) => <div key={column}><dt>{column}</dt><dd><span className="student-detail-value" tabIndex={0} role="group" aria-label={row.cellLabels?.[index] ?? `${caption}. ${columns[entryColumn]}: ${row.cells[entryColumn] ?? 'No disponible'}. ${column}: ${row.cells[index] ?? 'No disponible'}.`}>{row.cells[index] ?? 'No disponible'}</span></dd></div>)}</dl>
              </div>
            </td></tr>}
          </Fragment>
        })}</tbody>
      </table>
    </div>
  )
}
