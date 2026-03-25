export default function BottomNav({ view, onChangeView, docOpen }) {
    const items = [
        { key: 'reader', icon: '📖', label: 'Đọc' },
        { key: 'files', icon: '📁', label: 'Files' },
        { key: 'notes', icon: '📌', label: 'Ghi chú' },
        { key: 'focus', icon: '⛶', label: 'Focus' },
    ]

    return (
        <nav className="bottom-nav">
            {items.map((item) => (
                <button
                    key={item.key}
                    className={`bottom-nav-btn ${view === item.key ? 'active' : ''}`}
                    onClick={() => onChangeView(item.key)}
                    disabled={item.key === 'focus' && !docOpen}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    )
}
