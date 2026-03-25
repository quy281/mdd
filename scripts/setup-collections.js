// Setup PocketBase collections cho HoSo Reader
// Chạy: node scripts/setup-collections.js

const PB_URL = 'https://db.mkg.vn'

async function api(path, method = 'GET', body = null, token = null) {
    const h = { 'Content-Type': 'application/json' }
    if (token) h.Authorization = 'Bearer ' + token
    const r = await fetch(PB_URL + path, {
        method,
        headers: h,
        body: body ? JSON.stringify(body) : null,
    })
    const t = await r.text()
    let d
    try { d = JSON.parse(t) } catch (_) { d = { raw: t } }
    return { ok: r.ok, status: r.status, data: d }
}

async function main() {
    console.log('🔑 Đăng nhập superuser...')
    const auth = await api('/api/collections/_superusers/auth-with-password', 'POST', {
        identity: 'quy28181818@gmail.com',
        password: '@Mkg201444',
    })
    if (!auth.ok) { console.error('❌ Đăng nhập thất bại:', auth.data); process.exit(1) }
    const tk = auth.data.token
    console.log('✅ Đăng nhập thành công')

    // ─── Collections ────────────────────────────────────────────────────────────

    const collections = [
        {
            name: 'hoso_projects',
            fields: [
                { name: 'name', type: 'text', required: true },
            ],
        },
        {
            name: 'hoso_documents',
            fields: [
                { name: 'project_id', type: 'text', required: true },
                { name: 'fileName', type: 'text', required: true },
                { name: 'content', type: 'text', required: false },
                { name: 'type', type: 'text', required: true },
            ],
        },
        {
            name: 'hoso_annotations',
            fields: [
                { name: 'document_id', type: 'text', required: true },
                { name: 'project_id', type: 'text' },
                { name: 'type', type: 'text', required: true },
                { name: 'text', type: 'text' },
                { name: 'color', type: 'text' },
                { name: 'note', type: 'text' },
                { name: 'range', type: 'json' },
                { name: 'data', type: 'json' },
                { name: 'fileName', type: 'text' },
                { name: 'scrollPosition', type: 'number' },
            ],
        },
    ]

    for (const col of collections) {
        console.log(`\n📦 Tạo collection: ${col.name}`)

        // Check if exists
        const existing = await api('/api/collections/' + col.name, 'GET', null, tk)
        if (existing.ok) {
            console.log(`  ⏭  Đã tồn tại, cập nhật rules...`)
            const patch = await api('/api/collections/' + existing.data.id, 'PATCH', {
                listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
            }, tk)
            console.log(patch.ok ? '  ✅ Rules OK' : '  ❌ Rules fail: ' + JSON.stringify(patch.data))
            continue
        }

        // Create
        const res = await api('/api/collections', 'POST', {
            name: col.name,
            type: 'base',
            fields: col.fields,
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: '',
        }, tk)
        if (res.ok) {
            console.log(`  ✅ Tạo thành công (id: ${res.data.id})`)
        } else {
            console.error(`  ❌ Tạo thất bại: ${JSON.stringify(res.data)}`)
        }
    }

    // ─── Seed data ────────────────────────────────────────────────────────────────

    console.log('\n🌱 Seed data mẫu...')

    // Tạo project mẫu
    const proj1 = await api('/api/collections/hoso_projects/records', 'POST', {
        name: 'Tài liệu Kỹ thuật MKG',
    }, tk)
    console.log(proj1.ok ? `  ✅ Project: ${proj1.data.name}` : `  ❌ ${JSON.stringify(proj1.data)}`)

    const proj2 = await api('/api/collections/hoso_projects/records', 'POST', {
        name: 'Báo cáo & Tổng kết',
    }, tk)
    console.log(proj2.ok ? `  ✅ Project: ${proj2.data.name}` : `  ❌ ${JSON.stringify(proj2.data)}`)

    if (proj1.ok) {
        const pid = proj1.data.id
        const sampleDocs = [
            {
                project_id: pid,
                fileName: 'README.md',
                type: 'md',
                content: `# HoSo Reader\n\nỨng dụng đọc tài liệu Markdown, DOCX và HTML.\n\n## Tính năng\n\n- 📝 Đọc Markdown với syntax highlighting\n- 📄 Chuyển đổi DOCX sang HTML\n- 🌐 Render HTML an toàn\n- ✏ Vẽ annotation trên tài liệu\n- 📌 Highlight và ghi chú\n- 🔄 Đồng bộ real-time qua PocketBase\n- 📴 Offline cache qua IndexedDB\n\n## Phím tắt\n\n| Phím | Chức năng |\n|------|----------|\n| F | Toggle Focus Mode |\n| D | Toggle Draw mode |\n| H | Toggle Highlight mode |\n| Esc | Thoát Focus Mode |\n`,
            },
            {
                project_id: pid,
                fileName: 'architecture.md',
                type: 'md',
                content: `# Kiến trúc hệ thống\n\n## Stack\n\n\`\`\`\nFrontend: React 19 + Vite\nBackend: PocketBase (db.mkg.vn)\nCache: IndexedDB\n\`\`\`\n\n## Sơ đồ\n\n\`\`\`mermaid\ngraph TD\n  A[App.jsx] --> B[projectStore.js]\n  B --> C[PocketBase]\n  B --> D[IndexedDB]\n  A --> E[Sidebar]\n  A --> F[Paper]\n  A --> G[FocusReader]\n\`\`\`\n\n## Collections\n\n| Collection | Mô tả |\n|---|---|\n| hoso_projects | Dự án |\n| hoso_documents | Tài liệu |\n| hoso_annotations | Ghi chú & vẽ |\n`,
            },
            {
                project_id: pid,
                fileName: 'guide.md',
                type: 'md',
                content: `# Hướng dẫn sử dụng\n\n## Bắt đầu\n\n1. Tạo **dự án mới** bằng nút ＋ ở góc dưới Sidebar\n2. Kéo file **MD/DOCX/HTML** thả vào ô upload\n3. Click file để đọc\n\n## Annotation\n\n- **✏ Vẽ**: Nhấn nút Vẽ hoặc phím D, sau đó kéo chuột trên tài liệu\n- **🖊 Highlight**: Nhấn nút Highlight hoặc phím H, sau đó chọn văn bản\n\n## Focus Mode\n\nNhấn **F** hoặc nút ⛶ để vào chế độ đọc toàn màn hình.\nNhấn **Esc** hoặc **F** để thoát.\n`,
            },
        ]

        for (const doc of sampleDocs) {
            const r = await api('/api/collections/hoso_documents/records', 'POST', doc, tk)
            console.log(r.ok ? `  ✅ Doc: ${doc.fileName}` : `  ❌ ${doc.fileName}: ${JSON.stringify(r.data)}`)
        }
    }

    console.log('\n🎉 Setup hoàn tất! Truy cập https://db.mkg.vn/_/ để kiểm tra.')
}

main().catch(console.error)
