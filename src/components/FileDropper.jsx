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

export default function FileDropper({ onUpload, project }) {
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef()

    async function processFiles(files) {
        if (!project) return alert('Vui lòng chọn hoặc tạo dự án trước')
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

    return (
        <div
            className={`file-dropper ${dragging ? 'drag-over' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
        >
            <input ref={inputRef} type="file" hidden accept={ACCEPT} multiple onChange={onChange} />
            <div className="drop-icon">{uploading ? '⏳' : '📂'}</div>
            <p>
                {uploading
                    ? 'Đang tải lên...'
                    : project
                        ? <>Kéo file vào đây hoặc <strong>click để chọn</strong></>
                        : 'Tạo dự án trước để tải file lên'}
            </p>
            <small>Hỗ trợ: .md, .docx, .html</small>
        </div>
    )
}
