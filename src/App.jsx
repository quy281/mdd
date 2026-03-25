import { useState, useEffect, useCallback } from 'react'
import Sidebar, { addToRecent } from './components/Sidebar.jsx'
import Toolbar from './components/Toolbar.jsx'
import Paper from './components/Paper.jsx'
import BottomNav from './components/BottomNav.jsx'
import FileManager from './components/FileManager.jsx'
import FocusReader from './components/FocusReader.jsx'
import NotesManager from './components/NotesManager.jsx'
import AnnotationCanvas from './components/AnnotationCanvas.jsx'
import {
    getProjects,
    createProject,
    deleteProject,
    saveDocument,
    deleteDocument,
    getAllAnnotations,
    saveAnnotation,
    deleteAnnotation,
    subscribeToChanges,
} from './store/projectStore.js'

const VIEW = { READER: 'reader', FILES: 'files', NOTES: 'notes', FOCUS: 'focus' }

export default function App() {
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [view, setView] = useState(VIEW.READER)
    const [annMode, setAnnMode] = useState('off') // 'off' | 'draw' | 'highlight'
    const [annotations, setAnnotations] = useState([])
    const [loading, setLoading] = useState(false)
    const [toasts, setToasts] = useState([])
    const [showNewProject, setShowNewProject] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // Toast helper
    function toast(msg, type = 'info') {
        const id = Date.now()
        setToasts((t) => [...t, { id, msg, type }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
    }

    // Refresh projects from PocketBase
    const refreshProjects = useCallback(async (force = false) => {
        if (!force && loading) return
        setLoading(true)
        try {
            const data = await getProjects()
            setProjects(data)
            // Rehydrate selectedProject & selectedDoc
            if (selectedProject) {
                const updated = data.find((p) => p.id === selectedProject.id)
                if (updated) {
                    setSelectedProject(updated)
                    if (selectedDoc) {
                        const updatedDoc = (updated.documents || []).find((d) => d.id === selectedDoc.id)
                        if (updatedDoc) setSelectedDoc(updatedDoc)
                    }
                }
            }
        } catch (e) {
            toast('Lỗi đồng bộ dữ liệu', 'error')
        }
        setLoading(false)
    }, [selectedProject?.id, selectedDoc?.id])

    // Initial load
    useEffect(() => {
        refreshProjects(true)
    }, [])

    // Visibility change → sync
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') refreshProjects(true)
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [refreshProjects])

    // Realtime subscription
    useEffect(() => {
        const cleanup = subscribeToChanges(() => refreshProjects(true))
        return cleanup
    }, [refreshProjects])

    // Keyboard shortcuts
    useEffect(() => {
        function onKey(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if (e.key === 'f' || e.key === 'F') {
                if (selectedDoc) setView((v) => v === VIEW.FOCUS ? VIEW.READER : VIEW.FOCUS)
            }
            if (e.key === 'd' || e.key === 'D') setAnnMode((m) => m === 'draw' ? 'off' : 'draw')
            if (e.key === 'h' || e.key === 'H') setAnnMode((m) => m === 'highlight' ? 'off' : 'highlight')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [selectedDoc])

    // Mobile detect
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    // Load annotations when doc changes
    useEffect(() => {
        if (!selectedDoc) { setAnnotations([]); return }
        getAllAnnotations().then(setAnnotations)
    }, [selectedDoc?.id])

    // ─── Actions ────────────────────────────────────────────────────────────────

    async function handleSelectDoc(doc, project) {
        setSelectedDoc(doc)
        if (project) setSelectedProject(project)
        setView(isMobile ? VIEW.FOCUS : VIEW.READER)
        setAnnMode('off')
        addToRecent(doc, project || selectedProject)
        // Load annotations for this doc
        const anns = await getAllAnnotations()
        setAnnotations(anns)
    }

    async function handleNewProject() {
        const name = newProjectName.trim()
        if (!name) return
        try {
            // Optimistic update
            const temp = { id: `_temp_${Date.now()}`, name, documents: [] }
            setProjects((p) => [temp, ...p])
            setSelectedProject(temp)
            setNewProjectName('')
            setShowNewProject(false)
            const record = await createProject(name)
            toast(`Đã tạo dự án "${name}"`, 'success')
            await refreshProjects(true)
            setSelectedProject(record)
        } catch (e) {
            toast('Không thể tạo dự án: ' + e.message, 'error')
        }
    }

    async function handleDeleteProject(project) {
        if (!confirm(`Xóa dự án "${project.name}" và toàn bộ tài liệu trong đó?`)) return
        try {
            await deleteProject(project.id)
            setProjects((p) => p.filter((x) => x.id !== project.id))
            if (selectedProject?.id === project.id) {
                setSelectedProject(null)
                setSelectedDoc(null)
                setView(VIEW.READER)
            }
            toast('Đã xóa dự án', 'info')
        } catch (e) {
            toast('Lỗi xóa dự án: ' + e.message, 'error')
        }
    }

    async function handleUpload({ fileName, content, type }) {
        if (!selectedProject) return toast('Chọn dự án trước', 'error')
        try {
            const record = await saveDocument(selectedProject.id, fileName, content, type)
            toast(`Đã tải lên ${fileName}`, 'success')
            // Update local state immediately
            setProjects((prev) => prev.map((p) =>
                p.id === selectedProject.id
                    ? { ...p, documents: [record, ...(p.documents || [])] }
                    : p
            ))
            setSelectedProject((p) => p ? { ...p, documents: [record, ...(p.documents || [])] } : p)
            // Full refresh after 2s
            setTimeout(() => refreshProjects(true), 2000)
        } catch (e) {
            toast('Lỗi tải lên: ' + e.message, 'error')
        }
    }

    async function handleDeleteDoc(doc) {
        if (!confirm(`Xóa file "${doc.fileName}"?`)) return
        try {
            await deleteDocument(selectedProject?.id || doc.project_id, doc.id)
            if (selectedDoc?.id === doc.id) { setSelectedDoc(null); setView(VIEW.FILES) }
            setProjects((prev) => prev.map((p) =>
                p.id === (selectedProject?.id || doc.project_id)
                    ? { ...p, documents: (p.documents || []).filter((d) => d.id !== doc.id) }
                    : p
            ))
            toast('Đã xóa file', 'info')
        } catch (e) {
            toast('Lỗi xóa file: ' + e.message, 'error')
        }
    }

    async function handleSaveAnnotation(data) {
        try {
            const ann = await saveAnnotation({
                ...data,
                fileName: selectedDoc?.fileName,
                project_id: selectedProject?.id,
            })
            setAnnotations((a) => [ann, ...a])
        } catch (e) {
            console.error('Save annotation error:', e)
        }
    }

    async function handleDeleteAnnotation(id) {
        try {
            await deleteAnnotation(id)
            setAnnotations((a) => a.filter((x) => x.id !== id))
            toast('Đã xóa ghi chú', 'info')
        } catch (e) {
            toast('Lỗi xóa ghi chú', 'error')
        }
    }

    function toggleAnnotation(mode) {
        setAnnMode((curr) => curr === mode ? 'off' : mode)
    }

    function handlePrint() {
        window.print()
    }

    // ─── Render ──────────────────────────────────────────────────────────────────

    const docAnnotations = annotations.filter((a) => a.document_id === selectedDoc?.id)

    return (
        <div className="app-layout">
            {/* Sidebar (Desktop) */}
            <Sidebar
                projects={projects}
                selectedProject={selectedProject}
                selectedDoc={selectedDoc}
                onSelectProject={(p) => { setSelectedProject(p); setView(VIEW.READER) }}
                onSelectDoc={handleSelectDoc}
                onNewProject={() => setShowNewProject(true)}
                onDeleteProject={handleDeleteProject}
                onViewFiles={() => setView(VIEW.FILES)}
                onViewNotes={() => setView(VIEW.NOTES)}
                view={view}
                loading={loading}
            />

            {/* Main Content */}
            <div className="main-content">
                {/* Toolbar (Desktop, Reader mode) */}
                {view !== VIEW.FILES && view !== VIEW.NOTES && (
                    <Toolbar
                        doc={selectedDoc}
                        onToggleFocus={() => setView((v) => v === VIEW.FOCUS ? VIEW.READER : VIEW.FOCUS)}
                        onToggleAnnotation={toggleAnnotation}
                        annMode={annMode}
                        onPrint={handlePrint}
                        onDeleteDoc={handleDeleteDoc}
                    />
                )}

                {/* Reader View */}
                {view === VIEW.READER && (
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
                        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                            <Paper document={selectedDoc} />
                            {selectedDoc && (
                                <AnnotationCanvas
                                    mode={annMode}
                                    docId={selectedDoc.id}
                                    annotations={docAnnotations}
                                    onSave={handleSaveAnnotation}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* File Manager */}
                {view === VIEW.FILES && (
                    <FileManager
                        projects={projects}
                        selectedProject={selectedProject}
                        onUpload={handleUpload}
                        onSelectDoc={handleSelectDoc}
                        onDeleteDoc={handleDeleteDoc}
                    />
                )}

                {/* Notes Manager */}
                {view === VIEW.NOTES && (
                    <NotesManager
                        annotations={annotations}
                        onDelete={handleDeleteAnnotation}
                        onRefresh={() => getAllAnnotations().then(setAnnotations)}
                    />
                )}
            </div>

            {/* Focus Mode */}
            {view === VIEW.FOCUS && selectedDoc && (
                <FocusReader
                    doc={selectedDoc}
                    annMode={annMode}
                    onToggleAnnotation={toggleAnnotation}
                    onClose={() => setView(isMobile ? VIEW.READER : VIEW.READER)}
                    annotations={docAnnotations}
                    onSaveAnnotation={handleSaveAnnotation}
                />
            )}

            {/* Bottom Nav (Mobile) */}
            <BottomNav
                view={view}
                onChangeView={(v) => {
                    if (v === VIEW.FOCUS && !selectedDoc) return
                    setView(v)
                }}
                docOpen={!!selectedDoc}
            />

            {/* New Project Modal */}
            {showNewProject && (
                <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowNewProject(false)}>
                    <div className="modal">
                        <h3>📁 Tạo dự án mới</h3>
                        <input
                            placeholder="Tên dự án..."
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNewProject()}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowNewProject(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleNewProject}>Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <div className="toast-container">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.type === 'success' && '✅'}
                        {t.type === 'error' && '❌'}
                        {t.type === 'info' && 'ℹ️'}
                        {t.msg}
                    </div>
                ))}
            </div>
        </div>
    )
}
