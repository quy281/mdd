import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import MermaidDiagram from './MermaidDiagram.jsx'

export default function Paper({ document }) {
    const [html, setHtml] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!document) return
        if (document.type === 'docx') {
            convertDocx(document.content)
        }
    }, [document])

    async function convertDocx(base64Content) {
        setLoading(true)
        try {
            const mammoth = await import('mammoth')
            const bytes = atob(base64Content)
            const arr = new Uint8Array(bytes.length)
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
            const result = await mammoth.convertToHtml({ arrayBuffer: arr.buffer })
            setHtml(result.value)
        } catch (e) {
            console.error('DOCX convert error:', e)
            setHtml('<p>Không thể chuyển đổi file DOCX.</p>')
        }
        setLoading(false)
    }

    if (!document) {
        return (
            <div className="paper-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
                <h3>Chọn tài liệu để đọc</h3>
                <p>Chọn một file từ thanh bên hoặc tải lên file mới để bắt đầu</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="paper-placeholder">
                <span className="loading-spinner" />
                <p>Đang chuyển đổi tài liệu...</p>
            </div>
        )
    }

    return (
        <div className="paper-container">
            {document.type === 'md' && (
                <div className="md-content">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const lang = (className || '').replace('language-', '')
                                if (!inline && lang === 'mermaid') {
                                    return <MermaidDiagram code={String(children)} />
                                }
                                return <code className={className} {...props}>{children}</code>
                            },
                        }}
                    >
                        {document.content}
                    </ReactMarkdown>
                </div>
            )}
            {document.type === 'html' && (
                <div
                    className="md-content"
                    dangerouslySetInnerHTML={{
                        __html: (() => {
                            const DOMPurify = window.DOMPurify
                            return DOMPurify
                                ? DOMPurify.sanitize(document.content)
                                : document.content
                        })(),
                    }}
                />
            )}
            {document.type === 'docx' && (
                <div className="md-content" dangerouslySetInnerHTML={{ __html: html }} />
            )}
        </div>
    )
}
