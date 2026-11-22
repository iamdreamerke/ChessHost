import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: ReactNode
  eyebrow?: string
  width?: number
  children: ReactNode
}

export default function Modal({ open, onClose, title, eyebrow, width, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={'modal-backdrop' + (open ? ' show' : '')} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      {open && (
        <div className="modal" style={width ? { width: Math.min(width, 9999), maxWidth: '100%' } : undefined} role="dialog" aria-modal="true">
          <div className="modal-head">
            <div>
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              {title && <h2>{title}</h2>}
            </div>
            <button className="close" onClick={onClose} aria-label="Close">×</button>
          </div>
          {children}
        </div>
      )}
    </div>
  )
}
