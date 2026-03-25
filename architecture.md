# HoSo Reader – Kiến trúc & Kết nối CSDL

## Tổng quan

**HoSo Reader** là một ứng dụng đọc tài liệu (Markdown, DOCX, HTML) chạy trên trình duyệt, xây dựng bằng **React 19 + Vite + Tailwind CSS v4**. Dữ liệu được lưu trên **PocketBase** (cloud) và **IndexedDB** (local cache/offline fallback).

---

## Stack kỹ thuật

| Lớp | Công nghệ |
|-----|-----------|
| Frontend UI | React 19 + Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Backend / DB | PocketBase (self-hosted tại `https://db.mkg.vn`) |
| Local Cache | IndexedDB (browser-native, qua `idb.js`) |
| Recent Docs | `localStorage` (chỉ metadata nhỏ) |
| Render Markdown | `react-markdown` + `remark-gfm` + `rehype-highlight` |
| Render DOCX | `mammoth` (client-side) |
| Sơ đồ | `mermaid` |
| Sanitize HTML | `DOMPurify` |

---

## Kiến trúc thư mục

```
d:\hoso\
├── src/
│   ├── main.jsx              # Entry point React
│   ├── App.jsx               # Root component, quản lý state toàn app
│   ├── index.css             # Design tokens + Tailwind
│   │
│   ├── store/                # DATA LAYER
│   │   ├── pb.js             # PocketBase client singleton
│   │   ├── idb.js            # IndexedDB helpers (get/set/del)
│   │   └── projectStore.js   # Tất cả CRUD + fallback logic
│   │
│   ├── components/
│   │   ├── Sidebar.jsx       # Desktop nav + project/doc list
│   │   ├── BottomNav.jsx     # Mobile bottom navigation
│   │   ├── Toolbar.jsx       # Desktop toolbar (print, export, annotation)
│   │   ├── Paper.jsx         # Render nội dung tài liệu
│   │   ├── FileDropper.jsx   # Drag & drop upload file
│   │   ├── FileManager.jsx   # Grid view quản lý tất cả files
│   │   ├── FocusReader.jsx   # Chế độ đọc toàn màn hình
│   │   ├── NotesManager.jsx  # Xem và quản lý annotations/notes
│   │   ├── AnnotationCanvas.jsx # Canvas vẽ tay trên tài liệu
│   │   ├── TextHighlighter.jsx  # Highlight văn bản
│   │   └── MermaidDiagram.jsx   # Render sơ đồ Mermaid
│   │
│   └── utils/                # Tiện ích (nếu có)
│
├── public/
├── index.html
├── package.json
└── vite.config.js
```

---

## Kết nối CSDL – PocketBase

### 1. Cấu hình client (`src/store/pb.js`)

```js
import PocketBase from 'pocketbase'

const pb = new PocketBase('https://db.mkg.vn')
pb.autoCancellation(false) // Tắt auto-cancel để dùng concurrent requests

export default pb
```

- **Không cần auth** – collections được cấu hình public access trên PocketBase.
- `autoCancellation(false)` bắt buộc để tránh các request bị hủy khi gọi nhiều lần nhanh.

### 2. Collections trên PocketBase

| Collection | Mô tả | Các trường chính |
|---|---|---|
| `hoso_projects` | Quản lý dự án | `name`, `created` |
| `hoso_documents` | Tài liệu trong dự án | `project_id`, `fileName`, `content` (text lớn), `type` (`md`/`docx`/`html`) |
| `hoso_annotations` | Ghi chú / highlight | `document_id`, `project_id`, `type`, `text`, `color`, `note`, `range`, `data`, `fileName`, `scrollPosition` |

---

## Kết nối CSDL – IndexedDB (Offline Cache)

### `src/store/idb.js` – API đơn giản key-value

```js
// DB: 'hoso_db', ObjectStore: 'keyval'
idbGet(key)        // Đọc giá trị theo key
idbSet(key, val)   // Ghi giá trị theo key
idbDel(key)        // Xóa theo key
```

**Các key được dùng:**

| Key | Nội dung |
|-----|----------|
| `hoso_ls_projects` | Mảng projects (cache offline) |
| `hoso_ls_documents` | Mảng documents (cache offline) |
| `hoso_ls_annotations` | Mảng annotations (cache offline) |

---

## Data Layer – `projectStore.js`

### Chiến lược: PocketBase-first, IDB fallback

Mọi hàm đều theo pattern:

```
1. Thử gọi PocketBase API
   ✅ Thành công → ghi kết quả vào IDB (write-through) → return
   ❌ Timeout / lỗi → đọc từ IDB → return
```

### Timeout tự động

```js
function withTimeout(promise, ms) {
  // Nếu PB vừa thành công trong 15 giây → timeout × 2 (tránh false timeout)
  const timeout = (Date.now() - _lastPBSuccess < 15000) ? ms * 2 : ms
  return Promise.race([promise, new Promise((_, rej) =>
    setTimeout(() => rej(new Error('PocketBase timeout')), timeout)
  )])
}
```

- `getProjects()`: timeout **8000ms**
- `getAnnotations()`: timeout **4000ms**

### Các hàm CRUD chính

```js
// PROJECTS
getProjects()                     // Lấy tất cả projects + documents (parallel fetch)
createProject(name)               // Tạo project mới
deleteProject(id)                 // Xóa project + toàn bộ docs + annotations

// DOCUMENTS
saveDocument(projectId, fileName, content, type)  // Lưu tài liệu (write-through IDB)
deleteDocument(projectId, docId)                  // Xóa doc + annotations liên quan

// ANNOTATIONS
getAnnotations(docId)             // Lấy annotations của 1 doc cụ thể
getAllAnnotations()                // Lấy tất cả annotations
saveAnnotation(data)              // Lưu annotation mới
updateAnnotation(id, data)        // Cập nhật annotation
deleteAnnotation(id)              // Xóa annotation

// REALTIME
subscribeToChanges(onUpdate)      // Subscribe realtime PocketBase WebSocket
                                  // Returns cleanup function để unsubscribe
```

### Write-through pattern (khi saveDocument)

```
1. POST → hoso_documents trên PocketBase → nhận record.id
2. Ngay lập tức → idbSet(LS_DOCS, [newDoc, ...existingDocs])
3. Nếu fail PB → idbSet() luôn làm offline fallback
```

---

## State Management (App.jsx)

- **Không dùng Redux/Context** – state toàn bộ trong `App.jsx` dùng `useState`/`useCallback`
- `projects` state: mảng `{ id, name, createdAt, documents: [...] }`
- **Optimistic updates**: tạo project/upload file → UI cập nhật trước → gọi API sau

### Sync strategy

```js
// 1. Khi app khởi động
useEffect(() => { refreshProjects(true) }, [])

// 2. Khi tab được focus lại (tránh stale data cross-device)
useEffect(() => {
  const onVisible = () => {
    if (document.visibilityState === 'visible') refreshProjects(true)
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}, [])

// 3. Realtime subscription (PocketBase WebSocket)
useEffect(() => {
  const cleanup = subscribeToChanges(() => refreshProjects(true))
  return cleanup
}, [])

// 4. Sau upload file, delay 2s rồi full sync
setTimeout(() => refreshProjects(true), 2000)
```

---

## View Modes

```js
const VIEW = {
  READER: 'reader',   // Đọc tài liệu chính
  FILES:  'files',    // Grid quản lý file
  NOTES:  'notes',    // Danh sách annotations/notes
  FOCUS:  'focus',    // Fullscreen focus reading
}
```

- Mobile: auto vào **FOCUS** mode khi mở tài liệu (`window.innerWidth < 768`)
- Keyboard shortcut: `F` để toggle FOCUS mode
- Mobile: **BottomNav** điều hướng
- Desktop: **Sidebar** + **Toolbar**

---

## Recent Documents

```js
// localStorage key: 'hoso_recent_docs' (tối đa 10 file)
// Chỉ lưu metadata nhỏ: { id, fileName, type, projectId, projectName, viewedAt }
// KHÔNG lưu content vào localStorage (dùng IDB cho cache lớn)
```

---

## Supported File Types

| Extension | Xử lý | Component |
|-----------|--------|-----------|
| `.md` | Direct render | `react-markdown` với GFM + syntax highlight |
| `.docx` | `mammoth` → convert sang HTML phía client | `Paper.jsx` |
| `.html` / `.htm` | Direct render (sanitize bởi DOMPurify) | `Paper.jsx` |

---

## Cách nhân bản sang dự án mới

### Bước 1 – Cài đặt dependencies

```bash
npm install pocketbase
# IDB không cần thư viện ngoài – dùng IndexedDB native
```

### Bước 2 – Sao chép store layer

```
src/store/pb.js          → Sửa URL PocketBase
src/store/idb.js         → Dùng nguyên (generic key-value IDB)
src/store/projectStore.js → Sửa tên collection + fields theo domain mới
```

### Bước 3 – Cấu hình PocketBase Collections

Tạo 3 collections tối thiểu:

- `{app}_projects` (fields: `name`)
- `{app}_documents` (fields: `project_id`, `fileName`, `content` *Long Text*, `type`)
- `{app}_annotations` (fields: `document_id`, `project_id`, `type`, `text`, `color`, `note`, `data`)

Bật **List/View/Create/Delete rules = ""** (public) hoặc thêm auth tùy nhu cầu.

### Bước 4 – Sử dụng trong component

```js
import { getProjects, saveDocument, saveAnnotation } from './store/projectStore'

// Trong useEffect hoặc event handler:
const projects = await getProjects()
const doc = await saveDocument(projectId, fileName, content, 'md')
const ann = await saveAnnotation({ document_id: docId, text: 'highlight', color: '#fde047' })
```

---

## Dependency Graph

```
App.jsx
  ├── store/projectStore.js
  │     ├── store/pb.js          (PocketBase SDK)
  │     └── store/idb.js         (IndexedDB native)
  │
  ├── components/Sidebar.jsx     (Desktop nav)
  ├── components/BottomNav.jsx   (Mobile nav)
  ├── components/Paper.jsx       (Document renderer)
  ├── components/FileDropper.jsx (Upload)
  ├── components/FileManager.jsx (Grid view)
  ├── components/FocusReader.jsx (Fullscreen mode)
  └── components/NotesManager.jsx (Annotations list)
```
