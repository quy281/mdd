import { useState } from 'react'

export default function Toolbar({
    doc,
    onToggleFocus,
    onToggleAnnotation,
    annMode,
    onPrint,
    onDeleteDoc,
    onSaveDoc,
}) {
    const [editing, setEditing] = useState(false)
    const [editContent, setEditContent] = useState('')
    const [saving, setSaving] = useState(false)

    if (!doc) return (
        <div className="toolbar">
            <span style={{ color: 'var(--c-text3)', fontSize: 13 }}>HoSo Reader – Chọn tài liệu để đọc</span>
        </div>
    )

    function startEdit() {
        setEditContent(doc.content || '')
        setEditing(true)
    }

    async function handleSave() {
        setSaving(true)
        await onSaveDoc(editContent)
        setSaving(false)
        setEditing(false)
    }

    function cancelEdit() {
        setEditing(false)
        setEditContent('')
    }

    // Editor modal
    if (editing) {
        return (
            <>
                <div className="toolbar">
                    <span className="toolbar-doc-title">✏️ Chỉnh sửa: {doc.fileName}</span>
                    <div className="toolbar-spacer" />
                    <button className="toolbar-btn" onClick={cancelEdit} disabled={saving}>
                        ✕ Hủy
                    </button>
                    <button
                        className="toolbar-btn save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
                    </button>
                </div>
                <div className="editor-container">
                    <textarea
                        className="md-editor"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        spellCheck={false}
                        autoFocus
                    />
                </div>
            </>
        )
    }

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

            {doc.type === 'md' && (
                <button className="toolbar-btn" onClick={startEdit} title="Chỉnh sửa nội dung">
                    ✏️ Sửa
                </button>
            )}
            <button className="toolbar-btn save-btn" onClick={() => {
                const blob = new Blob([doc.content || ''], { type: 'text/markdown;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = doc.fileName || 'document.md'
                a.click()
                URL.revokeObjectURL(url)
            }} title="Lưu file về máy">
                💾 Save
            </button>
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
