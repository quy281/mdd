import { useState } from 'react'

const RECENT_KEY = 'hoso_recent_docs'
const MAX_RECENT = 10

function fileIcon(type) {
    if (type === 'md') return '📝'
    if (type === 'docx') return '📄'
    if (type === 'html') return '🌐'
    return '📎'
}

export function addToRecent(doc, project) {
    const item = {
        id: doc.id,
        fileName: doc.fileName,
        type: doc.type,
        projectId: project.id,
        projectName: project.name,
        viewedAt: new Date().toISOString(),
    }
    const all = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    const filtered = all.filter((r) => r.id !== item.id)
    const updated = [item, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export function getRecent() {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
}

export default function Sidebar({
    projects,
    selectedProject,
    selectedDoc,
    onSelectProject,
    onSelectDoc,
    onNewProject,
    onDeleteProject,
    onViewFiles,
    onViewNotes,
    view,
    loading,
}) {
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState({})

    const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

    const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.documents || []).some((d) => d.fileName.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
                <h1>HoSo Reader</h1>
            </div>

            {/* Search */}
            <div className="sidebar-search">
                <input
                    placeholder="🔍 Tìm kiếm tài liệu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="sidebar-section">
                {/* Quick nav */}
                <div className="sidebar-section-title">Xem nhanh</div>
                <button
                    className={`sidebar-btn ${view === 'files' ? 'active' : ''}`}
                    onClick={onViewFiles}
                >
                    <span className="icon">📁</span>
                    <span className="label">Quản lý file</span>
                </button>
                <button
                    className={`sidebar-btn ${view === 'notes' ? 'active' : ''}`}
                    onClick={onViewNotes}
                >
                    <span className="icon">📌</span>
                    <span className="label">Ghi chú & Highlight</span>
                </button>

                {/* Projects */}
                <div className="sidebar-section-title" style={{ marginTop: 12 }}>
                    Dự án
                </div>

                {loading && (
                    <div style={{ padding: '8px 16px', color: 'var(--c-text3)', fontSize: 13, display: 'flex', gap: 8 }}>
                        <span className="loading-spinner" /> Đang tải...
                    </div>
                )}

                {filtered.map((project) => (
                    <div key={project.id}>
                        <div className="sidebar-project-header">
                            <button
                                className={`sidebar-btn ${selectedProject?.id === project.id && view === 'reader' ? 'active' : ''}`}
                                style={{ flex: 1, margin: 0, width: 'auto' }}
                                onClick={() => { toggle(project.id); onSelectProject(project) }}
                            >
                                <span className="icon">{expanded[project.id] ? '📂' : '📁'}</span>
                                <span className="label">{project.name}</span>
                                <span className="count">{(project.documents || []).length}</span>
                            </button>
                            <button
                                title="Xóa dự án"
                                style={{ fontSize: 14, color: 'var(--c-text3)', padding: '4px', opacity: 0.6 }}
                                onClick={(e) => { e.stopPropagation(); onDeleteProject(project) }}
                            >
                                ✕
                            </button>
                        </div>

                        {expanded[project.id] && (project.documents || []).map((doc) => (
                            <button
                                key={doc.id}
                                className={`sidebar-doc-item ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                                onClick={() => onSelectDoc(doc, project)}
                            >
                                <span className="doc-icon">{fileIcon(doc.type)}</span>
                                <span className="doc-name">{doc.fileName}</span>
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <button className="sidebar-footer-btn" onClick={onNewProject}>
                    <span>＋</span> Tạo dự án mới
                </button>
            </div>
        </aside>
    )
}
