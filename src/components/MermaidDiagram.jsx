import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' })

let _id = 0

export default function MermaidDiagram({ code }) {
    const ref = useRef(null)
    const [svg, setSvg] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const id = `mermaid-${++_id}`
        mermaid.render(id, code)
            .then(({ svg }) => setSvg(svg))
            .catch((e) => setError(e.message || 'Lỗi render diagram'))
    }, [code])

    if (error) return <div className="mermaid-wrapper" style={{ color: 'var(--c-danger)', fontSize: 13 }}>⚠ {error}</div>

    return (
        <div className="mermaid-wrapper" ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
    )
}
