import Paper from './Paper.jsx'
import AnnotationCanvas from './AnnotationCanvas.jsx'
import { useEffect } from 'react'

export default function FocusReader({ doc, annMode, onToggleAnnotation, onClose, annotations, onSaveAnnotation }) {
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <div className="focus-overlay">
            <div className="focus-toolbar">
                <button className="focus-btn" onClick={onClose} title="Thoát (Esc / F)">
                    ✕ Thoát
                </button>
                <span className="focus-title">{doc?.fileName}</span>

                <div className="ann-mode-bar">
                    <button
                        className={`ann-mode-btn ${annMode === 'draw' ? 'active' : ''}`}
                        onClick={() => onToggleAnnotation('draw')}
                    >
                        ✏️
                    </button>
                    <button
                        className={`ann-mode-btn ${annMode === 'highlight' ? 'active' : ''}`}
                        onClick={() => onToggleAnnotation('highlight')}
                    >
                        🖊
                    </button>
                    {annMode !== 'off' && (
                        <button
                            className="ann-mode-btn"
                            onClick={() => onToggleAnnotation('off')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="focus-content" style={{ position: 'relative' }}>
                <div style={{ maxWidth: 740, margin: '0 auto', position: 'relative' }}>
                    <Paper document={doc} />
                    {doc && (
                        <AnnotationCanvas
                            mode={annMode}
                            docId={doc.id}
                            annotations={annotations}
                            onSave={onSaveAnnotation}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
