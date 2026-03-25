import { deleteAnnotation } from '../store/projectStore.js'

function typeLabel(t) {
    if (t === 'highlight') return '🖊 Highlight'
    if (t === 'draw') return '✏ Vẽ tay'
    return '📌 Ghi chú'
}

function fmtDate(d) {
    return new Date(d).toLocaleString('vi-VN')
}

export default function NotesManager({ annotations, onDelete, onRefresh }) {
    const groups = annotations.reduce((acc, a) => {
        const key = a.fileName || a.document_id || 'Khác'
        if (!acc[key]) acc[key] = []
        acc[key].push(a)
        return acc
    }, {})

    return (
        <div className="notes-manager">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2>📌 Ghi chú & Highlight <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--c-text3)' }}>({annotations.length})</span></h2>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={onRefresh}
                >
                    ⟳ Làm mới
                </button>
            </div>

            {annotations.length === 0 && (
                <div className="empty-state">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <h3>Chưa có ghi chú nào</h3>
                    <p>Dùng chế độ Highlight hoặc Vẽ trên tài liệu để tạo ghi chú</p>
                </div>
            )}

            {Object.entries(groups).map(([fileName, items]) => (
                <div key={fileName} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📄 {fileName}
                    </div>
                    {items.map((ann) => (
                        <div key={ann.id} className="note-card">
                            <div className="note-card-type">{typeLabel(ann.type)}</div>
                            {ann.text && (
                                <div className="note-card-text" style={{
                                    background: ann.color ? ann.color + '22' : 'transparent',
                                    borderLeft: ann.color ? `3px solid ${ann.color}` : 'none',
                                    padding: ann.color ? '4px 8px' : 0,
                                    borderRadius: 4,
                                }}>
                                    "{ann.text}"
                                </div>
                            )}
                            {ann.note && (
                                <div className="note-card-text" style={{ marginTop: 6, fontStyle: 'italic', color: 'var(--c-text3)' }}>
                                    💬 {ann.note}
                                </div>
                            )}
                            {ann.type === 'draw' && (
                                <div className="note-card-text" style={{ color: 'var(--c-text3)' }}>
                                    [Bản vẽ tay]
                                </div>
                            )}
                            <div className="note-card-meta">
                                {ann.created ? fmtDate(ann.created) : ''}
                            </div>
                            <div className="note-card-actions">
                                <button
                                    onClick={() => onDelete(ann.id)}
                                    style={{ color: 'var(--c-danger)' }}
                                >
                                    🗑 Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}
