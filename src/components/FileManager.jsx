import { useState, useEffect } from 'react'
import FileDropper from './FileDropper.jsx'
import { getRecent } from './Sidebar.jsx'

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

export default function FileManager({ projects, selectedProject, onSelectProject, onUpload, onSelectDoc, onDeleteDoc }) {
    const [recentDocs, setRecentDocs] = useState([])
    const [expandedFolders, setExpandedFolders] = useState({})

    useEffect(() => {
        if (!selectedProject) {
            setRecentDocs(getRecent())
        }
    }, [selectedProject])

    const toggleFolder = (id) => setExpandedFolders((p) => ({ ...p, [id]: !p[id] }))

    const docs = selectedProject
        ? (selectedProject.documents || [])
        : projects.flatMap((p) => (p.documents || []).map((d) => ({ ...d, _projName: p.name })))

    const renderFileCard = (doc, isRecent = false) => (
        <div key={isRecent ? doc.id + doc.viewedAt : doc.id} className="file-card" onClick={() => onSelectDoc(doc, selectedProject || projects.find(p => p.id === (isRecent ? doc.projectId : doc.project_id)))}>
            <div className="file-card-icon">{fileIcon(doc.type)}</div>
            <div className="file-card-name">{doc.fileName}</div>
            <div className="file-card-meta">
                {(doc._projName || doc.projectName) && <span>{doc._projName || doc.projectName} · </span>}
                <span className={`badge badge-${doc.type}`}>{doc.type?.toUpperCase()}</span>
                {doc.created && !isRecent && <span style={{ marginLeft: 6 }}>{fmtDate(doc.created)}</span>}
                {isRecent && <span style={{ marginLeft: 6 }}>Vừa mở</span>}
            </div>
            {!isRecent && (
                <button
                    className="file-card-del"
                    title="Xóa file"
                    onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc) }}
                >
                    ✕
                </button>
            )}
        </div>
    )

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

            <FileDropper onUpload={onUpload} project={selectedProject} projects={projects} onSelectProject={onSelectProject} />

            {!selectedProject && recentDocs.length > 0 && (
                <>
                    <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 16, color: 'var(--c-text2)' }}>🕒 Tài liệu vừa mở</h3>
                    <div className="file-grid">
                        {recentDocs.map((doc) => renderFileCard(doc, true))}
                    </div>
                    <div className="toolbar-divider" style={{ margin: '24px 0' }} />
                </>
            )}

            {!selectedProject && projects.some(p => (p.documents || []).length > 0) && (
                <h3 style={{ marginBottom: 16, fontSize: 16, color: 'var(--c-text2)' }}>
                    📂 Các thư mục dự án
                </h3>
            )}

            {docs.length === 0 ? (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                    </svg>
                    <h3>Chưa có tài liệu nào</h3>
                    <p>Kéo file MD, DOCX hoặc HTML vào ô trên để tải lên</p>
                </div>
            ) : selectedProject ? (
                <div className="file-grid">
                    {docs.map((doc) => renderFileCard(doc))}
                </div>
            ) : (
                <div className="folder-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {projects.map((p) => {
                        const pDocs = p.documents || []
                        if (pDocs.length === 0) return null
                        const isExpanded = expandedFolders[p.id]
                        return (
                            <div key={p.id} className="folder-group" style={{ background: 'var(--c-bg2)', borderRadius: 12, padding: 16, border: '1px solid var(--c-border)' }}>
                                <div
                                    className="folder-header"
                                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 12 }}
                                    onClick={() => toggleFolder(p.id)}
                                >
                                    <span style={{ fontSize: 20 }}>{isExpanded ? '📂' : '📁'}</span>
                                    <span style={{ flex: 1, fontWeight: 500, fontSize: 16 }}>{p.name}</span>
                                    <span style={{ color: 'var(--c-text3)', fontSize: 14 }}>{pDocs.length} files</span>
                                    <span style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                                </div>
                                {isExpanded && (
                                    <div className="file-grid" style={{ marginTop: 16 }}>
                                        {pDocs.map((d) => renderFileCard({ ...d, _projName: p.name }))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
