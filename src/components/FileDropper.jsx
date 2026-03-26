import { useRef, useState } from 'react'

const ACCEPT = '.md,.docx,.html,.htm'
const FILE_TYPES = { md: 'md', docx: 'docx', html: 'html', htm: 'html' }

function getType(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    return FILE_TYPES[ext] || null
}

function readFileContent(file, type) {
    return new Promise((resolve, reject) => {
        if (type === 'docx') {
            const reader = new FileReader()
            reader.onload = (e) => {
                const bytes = new Uint8Array(e.target.result)
                let binary = ''
                for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
                resolve(btoa(binary))
            }
            reader.onerror = reject
            reader.readAsArrayBuffer(file)
        } else {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = reject
            reader.readAsText(file, 'UTF-8')
        }
    })
}

/**
 * FileDropper
 * Props:
 *   onUpload(data)        – called with { fileName, content, type }
 *   project               – currently selected project (may be null)
 *   projects              – full list of projects (for folder picker)
 *   onSelectProject(p)    – callback to set selected project in parent
 */
export default function FileDropper({ onUpload, project, projects = [], onSelectProject }) {
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef()

    // The "effective" project: either pre-selected from sidebar, or chosen in the picker
    const effectiveProject = project

    async function processFiles(files) {
        if (!effectiveProject) {
            return alert('Vui lòng chọn thư mục bên trên trước khi tải lên')
        }
        setUploading(true)
        for (const file of files) {
            const type = getType(file.name)
            if (!type) continue
            const content = await readFileContent(file, type)
            await onUpload({ fileName: file.name, content, type })
        }
        setUploading(false)
    }

    function onDrop(e) {
        e.preventDefault()
        setDragging(false)
        processFiles([...e.dataTransfer.files])
    }

    function onDragOver(e) { e.preventDefault(); setDragging(true) }
    function onDragLeave() { setDragging(false) }
    function onChange(e) { processFiles([...e.target.files]); e.target.value = '' }

    function handleDropperClick() {
        if (!effectiveProject) return
        inputRef.current?.click()
    }

    function pickProject(p) {
        onSelectProject && onSelectProject(p)
    }

    return (
        <div className="file-dropper-wrapper">
            {/* Folder target picker */}
            {projects.length > 0 && (
                <div className="folder-target-bar">
                    <span className="folder-target-label">
                        📂 Upload vào:
                    </span>
                    {projects.map((p) => (
                        <button
                            key={p.id}
                            className={`folder-target-btn ${effectiveProject?.id === p.id ? 'active' : ''}`}
                            onClick={() => pickProject(p)}
                            type="button"
                        >
                            {effectiveProject?.id === p.id ? '✅' : '○'} {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Drop zone */}
            <div
                className={`file-dropper ${dragging ? 'drag-over' : ''} ${!effectiveProject ? 'disabled' : ''}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={handleDropperClick}
            >
                <input ref={inputRef} type="file" hidden accept={ACCEPT} multiple onChange={onChange} />
                <div className="drop-icon">{uploading ? '⏳' : '📤'}</div>
                <p>
                    {uploading
                        ? 'Đang tải lên...'
                        : effectiveProject
                            ? <><strong>Tap hoặc kéo file</strong> vào đây để tải vào<br /><em style={{ fontSize: 13 }}>📂 {effectiveProject.name}</em></>
                            : <><strong>Chọn thư mục</strong> bên trên trước,<br />rồi tap ở đây để tải file lên</>}
                </p>
                <small>Hỗ trợ: .md, .docx, .html</small>
            </div>
        </div>
    )
}
