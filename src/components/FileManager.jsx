import FileDropper from './FileDropper.jsx'

function fileIcon(type) {
    if (type === 'md') return '📝'
    if (type === 'docx') return '📄'
    if (type === 'html') return '🌐'
    return '📎'
}

function formatBytes(n) {
    if (!n) return ''
    if (n < 1024) return n + ' B'
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
    return (n / 1024 / 1024).toFixed(1) + ' MB'
}

function fmtDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('vi-VN')
}

export default function FileManager({ projects, selectedProject, onUpload, onSelectDoc, onDeleteDoc }) {
    const docs = selectedProject
        ? (selectedProject.documents || [])
        : projects.flatMap((p) => (p.documents || []).map((d) => ({ ...d, _projName: p.name })))

    return (
        <div className="file-manager">
            <div className="file-manager-header">
                <h2>
                    {selectedProject ? `📂 ${selectedProject.name}` : '📁 Tất cả tài liệu'}
                    <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--c-text3)', marginLeft: 10 }}>
                        ({docs.length} files)
                    </span>
                </h2>
            </div>

            <FileDropper onUpload={onUpload} project={selectedProject} />

            {docs.length === 0 ? (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                    </svg>
                    <h3>Chưa có tài liệu nào</h3>
                    <p>Kéo file MD, DOCX hoặc HTML vào ô trên để tải lên</p>
                </div>
            ) : (
                <div className="file-grid">
                    {docs.map((doc) => (
                        <div key={doc.id} className="file-card" onClick={() => onSelectDoc(doc, selectedProject || projects.find(p => p.id === doc.project_id))}>
                            <div className="file-card-icon">{fileIcon(doc.type)}</div>
                            <div className="file-card-name">{doc.fileName}</div>
                            <div className="file-card-meta">
                                {doc._projName && <span>{doc._projName} · </span>}
                                <span className={`badge badge-${doc.type}`}>{doc.type?.toUpperCase()}</span>
                                {doc.created && <span style={{ marginLeft: 6 }}>{fmtDate(doc.created)}</span>}
                            </div>
                            <button
                                className="file-card-del"
                                title="Xóa file"
                                onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc) }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
