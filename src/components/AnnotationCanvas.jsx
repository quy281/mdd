import { useRef, useEffect, useState } from 'react'

const COLORS = ['#e5e7eb', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#000000']
const WIDTHS = [
    { label: 'Nét mảnh', value: 2 },
    { label: 'Nét thường', value: 4 },
    { label: 'Bút dạ', value: 16 },
]

export default function AnnotationCanvas({ mode, docId, annotations, onSave }) {
    const canvasRef = useRef(null)
    const drawing = useRef(false)
    const path = useRef([])
    const [savedPaths, setSavedPaths] = useState([])

    const [penColor, setPenColor] = useState('#3b82f6')
    const [penWidth, setPenWidth] = useState(4)

    // Load existing draw annotations
    useEffect(() => {
        const draws = (annotations || []).filter((a) => a.type === 'draw' && a.document_id === docId)
        setSavedPaths(draws.map((a) => a.data))
    }, [annotations, docId])

    // Redraw canvas when savedPaths change
    useEffect(() => {
        redrawAll()
    }, [savedPaths])

    function getPos(e) {
        const rect = canvasRef.current.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function startDraw(e) {
        if (mode !== 'draw') return
        // Allow ONLY pen and mouse
        // Touch is allowed to scroll by native browser logic without preventDefault
        if (e.pointerType === 'touch') return

        drawing.current = true
        path.current = [getPos(e)]
        e.preventDefault()
    }

    function moveDraw(e) {
        if (!drawing.current || mode !== 'draw') return
        if (e.pointerType === 'touch') return

        const pos = getPos(e)
        path.current.push(pos)
        drawPath(path.current, penColor, penWidth)
        e.preventDefault()
    }

    async function endDraw(e) {
        if (!drawing.current) return
        if (e.pointerType === 'touch') return

        drawing.current = false
        if (path.current.length < 2) return
        const data = { points: path.current, color: penColor, width: penWidth }
        setSavedPaths((p) => [...p, data])
        path.current = []
        // Save to PocketBase
        if (onSave && docId) {
            await onSave({ document_id: docId, type: 'draw', data, scrollPosition: window.scrollY })
        }
    }

    function redrawAll() {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        savedPaths.forEach((p) => {
            if (p?.points) drawPath(p.points, p.color || '#3b82f6', p.width || 2)
        })
    }

    function drawPath(points, color, width) {
        const canvas = canvasRef.current
        if (!canvas || points.length < 2) return
        const ctx = canvas.getContext('2d')

        if (width >= 16) {
            ctx.globalAlpha = 0.4
        } else {
            ctx.globalAlpha = 1.0
        }

        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
        ctx.stroke()
        ctx.globalAlpha = 1.0 // Reset
    }

    // Resize canvas to fill parent
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const parent = canvas.parentElement
        const ro = new ResizeObserver(() => {
            canvas.width = parent.offsetWidth
            canvas.height = parent.offsetHeight
            redrawAll()
        })
        ro.observe(parent)
        return () => ro.disconnect()
    }, [savedPaths])

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <canvas
                ref={canvasRef}
                className={`annotation-canvas ${mode !== 'off' ? `mode-${mode}` : ''}`}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: mode !== 'off' ? 'auto' : 'none',
                    touchAction: mode === 'draw' ? 'pan-y pan-x' : 'auto'
                }}
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
            />
            {mode === 'draw' && (
                <div style={{
                    position: 'fixed',
                    bottom: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--c-bg)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 24,
                    padding: '12px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    pointerEvents: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 100
                }}>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setPenColor(c)}
                                style={{
                                    width: 28, height: 28, borderRadius: '50%', background: c,
                                    border: penColor === c ? '2px solid var(--c-text)' : '2px solid transparent',
                                    padding: 0, cursor: 'pointer',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {WIDTHS.map(w => (
                            <button
                                key={w.value}
                                onClick={() => setPenWidth(w.value)}
                                style={{
                                    background: penWidth === w.value ? 'var(--c-bg3)' : 'transparent',
                                    border: '1px solid ' + (penWidth === w.value ? 'var(--c-border)' : 'transparent'),
                                    borderRadius: 12, padding: '4px 8px',
                                    fontSize: 13, color: 'var(--c-text)', cursor: 'pointer',
                                    fontWeight: penWidth === w.value ? 600 : 400
                                }}
                            >
                                {w.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
