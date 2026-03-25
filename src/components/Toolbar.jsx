export default function Toolbar({
    doc,
    onToggleFocus,
    onToggleAnnotation,
    annMode,
    onPrint,
    onDeleteDoc,
}) {
    if (!doc) return (
        <div className="toolbar">
            <span style={{ color: 'var(--c-text3)', fontSize: 13 }}>HoSo Reader – Chọn tài liệu để đọc</span>
        </div>
    )

    return (
        <div className="toolbar">
            <span className="toolbar-doc-title">{doc.fileName}</span>
            <div className="toolbar-divider" />

            {/* Annotation modes */}
            <div className="ann-mode-bar">
                <button
                    className={`ann-mode-btn ${annMode === 'draw' ? 'active' : ''}`}
                    title="Vẽ tay (D)"
                    onClick={() => onToggleAnnotation('draw')}
                >
                    ✏️ Vẽ
                </button>
                <button
                    className={`ann-mode-btn ${annMode === 'highlight' ? 'active' : ''}`}
                    title="Highlight (H)"
                    onClick={() => onToggleAnnotation('highlight')}
                >
                    🖊 Highlight
                </button>
            </div>

            <div className="toolbar-divider" />

            <button className="toolbar-btn" onClick={onPrint} title="In tài liệu">
                🖨 In
            </button>
            <button className="toolbar-btn danger" onClick={() => onDeleteDoc(doc)} title="Xóa file">
                🗑 Xóa
            </button>

            <div className="toolbar-spacer" />

            <button
                className="toolbar-btn"
                onClick={onToggleFocus}
                title="Chế độ đọc (F)"
            >
                ⛶ Focus
            </button>
        </div>
    )
}
