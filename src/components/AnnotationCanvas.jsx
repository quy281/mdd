import { useRef, useEffect, useState } from 'react'

const PEN_COLOR = '#3b82f6'
const PEN_WIDTH = 2

export default function AnnotationCanvas({ mode, docId, annotations, onSave }) {
    const canvasRef = useRef(null)
    const drawing = useRef(false)
    const path = useRef([])
    const [savedPaths, setSavedPaths] = useState([])

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
        const touch = e.touches?.[0] || e
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }

    function startDraw(e) {
        if (mode !== 'draw') return
        drawing.current = true
        path.current = [getPos(e)]
        e.preventDefault()
    }

    function moveDraw(e) {
        if (!drawing.current || mode !== 'draw') return
        const pos = getPos(e)
        path.current.push(pos)
        drawPath(path.current, PEN_COLOR, PEN_WIDTH)
        e.preventDefault()
    }

    async function endDraw(e) {
        if (!drawing.current) return
        drawing.current = false
        if (path.current.length < 2) return
        const data = { points: path.current, color: PEN_COLOR, width: PEN_WIDTH }
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
            if (p?.points) drawPath(p.points, p.color || PEN_COLOR, p.width || PEN_WIDTH)
        })
    }

    function drawPath(points, color, width) {
        const canvas = canvasRef.current
        if (!canvas || points.length < 2) return
        const ctx = canvas.getContext('2d')
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
        ctx.stroke()
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
        <canvas
            ref={canvasRef}
            className={`annotation-canvas ${mode !== 'off' ? `mode-${mode}` : ''}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
        />
    )
}
