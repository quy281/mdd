---
name: MKG Task Manager Patterns
description: Quy tắc xử lý PocketBase, checklist data, CSS, UI preferences, real database schema và user data cho hệ thống Task Manager MKG
---

# MKG Task Manager – Agent Skill

## 1. PocketBase Connection

### Instance
- **URL**: `https://db.mkg.vn`
- **SDK**: `pocketbase` npm package, initialized in `src/services/pb.js`
- **Superuser**: `quy28181818@gmail.com` / `@Mkg201444` (dùng cho scripts, KHÔNG dùng trong frontend)

### API Calls
- **KHÔNG dùng** `getFullList()` → gây lỗi `skipTotal=1` trên một số bản PB
- **Dùng** `getList(1, 500)` thay thế, đủ cho hầu hết use case
- **KHÔNG dùng** `sort=-created` → không phải bản PB nào cũng hỗ trợ field `created` trong sort
- Khi có lỗi `400 Bad Request` → kiểm tra **từng parameter** (sort, expand, filter) bằng cách bỏ dần ra

```javascript
// ✅ ĐÚNG
const result = await pb.collection('tasks').getList(1, 500, {
  filter: filter || undefined,
});
return result.items;

// ❌ SAI
const result = await pb.collection('tasks').getFullList({ sort: '-created' });
```

### PocketBase API Rules (quan trọng!)
Khi tạo collection mới hoặc cần user tạo/sửa/xóa records:
- `listRule: ""` → mọi authenticated user đọc được
- `viewRule: ""` → mọi authenticated user xem được
- `createRule: ""` → mọi authenticated user tạo được
- `updateRule: ""` → mọi authenticated user sửa được
- `deleteRule: ""` → mọi authenticated user xóa được
- `null` → **BLOCKED** (chỉ superuser)

**Lỗi phổ biến**: Quên set `createRule`/`deleteRule` → user gặp 403 khi tạo/xóa records.
Luôn update rules qua superuser API nếu cần:
```javascript
await fetch(PB_URL + '/api/collections/' + collectionId, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + superToken },
  body: JSON.stringify({ createRule: '', updateRule: '', deleteRule: '' }),
});
```

### Realtime Subscriptions
- Khi subscribe realtime + có optimistic update → **PHẢI check duplicate**
- Logic: if record exists → replace; if temp record → replace temp; else add new

```javascript
case 'create':
  setItems(prev => {
    const exists = prev.some(t => t.id === record.id);
    if (exists) return prev.map(t => t.id === record.id ? { ...t, ...record } : t);
    const tempIdx = prev.findIndex(t => t.id?.startsWith('_temp_'));
    if (tempIdx !== -1) { const u = [...prev]; u[tempIdx] = record; return u; }
    return [record, ...prev];
  });
```

---

## 2. Database Schema (Collections)

### `task_users` (auth collection)
| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Họ tên nhân viên |
| `email` | email | Email đăng nhập (username@mkg.vn) |
| `username` | text | Tên đăng nhập |
| `role` | select | director / assistant_director / hr / manager / staff |
| `department` | text | Phòng ban |

**Rules**: list ✅, view ✅, create ✅, update ✅, delete ✅ (all authenticated)

### `tasks` (base collection)
| Field | Type | Description |
|-------|------|-------------|
| `title` | text | Tiêu đề công việc |
| `description` | text | Mô tả chi tiết |
| `status` | select | todo / in_progress / done |
| `priority` | select | low / medium / high / urgent |
| `due_date` | date | Hạn hoàn thành |
| `assigned_by` | relation→task_users | Người giao |
| `assigned_to` | relation→task_users (multiple) | Người được giao |
| `color` | text | Màu card (#hex) |
| `checklist` | json | Mảng checklist items |
| `group` | text | Phòng ban / nhóm |

### `task_comments` (base collection)
| Field | Type | Description |
|-------|------|-------------|
| `task` | relation→tasks | Task parent |
| `author` | relation→task_users | Người viết |
| `content` | text | Nội dung comment |

### `task_config` (base collection) — Online shared settings
| Field | Type | Description |
|-------|------|-------------|
| `key` | text | Tên config (vd: "departments") |
| `value` | json | Giá trị config |

**Cách dùng**: Lưu shared settings (phòng ban, v.v.) thay vì localStorage → đồng bộ real-time giữa các browser.
```javascript
// Đọc
const cfg = await getConfig('departments');
// Ghi
await setConfig('departments', ['Đội thợ 1', 'Phòng thiết kế', ...]);
```

---

## 3. Real User Accounts

| Tên | Email | Role | Mật khẩu |
|-----|-------|------|----------|
| Admin MKG | admin@mkg.vn | director | mkg20144 |
| Thuy Le | thuyle@mkg.vn | assistant_director | mkg20266 |

**Lưu ý**: Thêm nhân sự mới qua giao diện Admin Settings (⚙ Quản lý → Nhân sự & Quyền → + Thêm nhân sự mới), hoặc qua PB API.

### Departments (hiện tại, lưu trong task_config)
- Đội thợ 1
- Đội thợ 2
- Phòng thiết kế
- Phòng kinh doanh
- Phòng marketing
- Ban giám đốc

---

## 4. Role System

### ROLE_HIERARCHY
```javascript
const ROLE_HIERARCHY = { director: 3, assistant_director: 2.5, hr: 2.5, manager: 2, staff: 1 };
```

| Role | Label | Color | Quyền |
|------|-------|-------|-------|
| director | Giám đốc | #ef4444 | Xem tất cả, giao việc mọi người, quản lý hệ thống |
| assistant_director | Trợ lý GĐ | #a855f7 | Thuộc Ban giám đốc, xem tất cả |
| hr | Nhân sự | #ec4899 | Quản lý nhân sự, truy cập Admin Settings |
| manager | Trưởng phòng | #f59e0b | Quản lý phòng ban |
| staff | Nhân viên | #3b82f6 | Xem việc được giao, KHÔNG tạo task mới |

### Ai thấy nút Admin (⚙ Quản lý)?
- `director` và `hr` → thấy nút ⚙ trong sidebar

---

## 5. Checklist Data Structure

```javascript
{
  id: string,              // unique id (Date.now().toString())
  text: string,            // nội dung
  checked: boolean,        // true = hoàn thành
  status: 'todo' | 'done', // PHẢI sync với checked
  level: 0 | 1 | 2,       // 0 = top-level, 1 = sub-task, 2 = sub-sub-task
  urgent: boolean,         // true = khẩn cấp (hiện 🔴)
  comments: [{             // inline comments per item
    id: string,
    author: string,        // userId
    authorName: string,
    content: string,
    created: ISO string
  }]
}
```

### Quan trọng: Sync `checked` ↔ `status`
```javascript
const newChecked = !item.checked;
updated[i] = { ...item, checked: newChecked, status: newChecked ? 'done' : 'todo' };
```

### Drag & Drop (Google Keep style)
- **Vertical drag** = reorder items (HTML5 Drag API + touch events)
- **Horizontal drag** (dx > 40px) = indent/outdent level
- Luôn hỗ trợ cả mouse + touch

---

## 6. CSS Conventions

### Design Tokens (CSS Variables)
```css
--bg, --bg-hover, --bg-input
--text-primary, --text-secondary, --text-muted
--accent, --accent-bg
--border, --border-light
--radius-sm, --radius-md
--status-done, --status-overdue
```

### Naming Conventions
- Checklist items: `.ck-*`
- Task card preview: `.ecl-*`
- Task groups: `.task-group-*`
- Urgent queue: `.urgent-queue-*`
- Badges: `.badge-*`
- Admin settings: `.admin-*`
- Notifications: `.notif-*`

---

## 7. UI Preferences (Boss Style)

1. **Đơn giản, tập trung** — Bỏ mọi thứ không cần thiết
2. **Strikethrough cho item xong** — ~~gạch ngang~~ cả trong và ngoài
3. **KHÔNG dùng status filters** — Bỏ Chờ làm/Đang làm/Hoàn thành → phân loại **phòng ban/đội**
4. **Board chung** — "Tất cả" = board chung việc cả công ty
5. **Lưu trữ thay vì Xong** — Tasks status=done → tab "📦 Lưu trữ"
6. **Mobile-first** — Bottom nav, FAB button, touch drag

### Sidebar Filters
- Section 1 (Bộ lọc): Tất cả, Việc của tôi, Việc đã giao, Khẩn cấp, Lưu trữ
- Section 2 (Phòng ban): Dynamic từ task_config

### Notifications
- 🔔 Bell icon trong header với badge đỏ
- Trigger khi task được giao (create) hoặc cập nhật (update)
- Browser notification + in-app notification panel
- Stored in localStorage per user

---

## 8. Deployment

### Build & Deploy
```bash
npx vite build   # Build to dist/
```
- Deployed via **Cloudflare Pages** or manual
- GitHub repo: `https://github.com/quy281/task.git`
- Branch: `main`
- Dev server: `npx vite --port 5174`

---

## 9. Project Structure

```
task-manager/
├── src/
│   ├── App.jsx          # Dashboard, filters, urgent queue, groups
│   ├── main.jsx         # Entry point
│   ├── components/
│   │   ├── LoginForm.jsx     # Login (manual only, no quick login)
│   │   ├── Layout.jsx        # Sidebar + bottom nav
│   │   ├── TaskCard.jsx      # Card preview
│   │   ├── TaskDetail.jsx    # Modal (title → checklist → comments)
│   │   ├── TaskForm.jsx      # Create task (Google Keep style)
│   │   ├── AdminSettings.jsx # Phòng ban + Nhân sự & Quyền (add/edit/delete users)
│   │   └── NotificationPanel.jsx # Bell dropdown với notifications
│   ├── hooks/
│   │   ├── useAuth.jsx        # Auth context
│   │   ├── useTasks.js        # Fetch + realtime + CRUD
│   │   └── useNotifications.js # Realtime notification hook
│   ├── services/
│   │   └── pb.js         # PocketBase SDK wrapper + getConfig/setConfig
│   └── styles/
│       └── index.css     # All styles (3600+ lines)
├── scripts/              # PB setup & migration scripts
└── vite.config.js
```

---

## 10. Script Patterns

Khi cần tương tác trực tiếp với PocketBase (tạo collection, seed data, update rules):

```javascript
const PB_URL = 'https://db.mkg.vn';

async function api(path, method, body, token) {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    const r = await fetch(PB_URL + path, {
        method: method || 'GET', headers: h,
        body: body ? JSON.stringify(body) : null,
    });
    return { ok: r.ok, status: r.status, data: await r.json() };
}

// Login as superuser
const a = await api('/api/collections/_superusers/auth-with-password', 'POST', {
    identity: 'quy28181818@gmail.com', password: '@Mkg201444',
});
const tk = a.data.token;

// Create user
await api('/api/collections/task_users/records', 'POST', {
    name: 'Tên', email: 'ten@mkg.vn', username: 'ten',
    password: 'password123', passwordConfirm: 'password123',
    role: 'staff', emailVisibility: true,
}, tk);

// Update user role
await api('/api/collections/task_users/records/' + userId, 'PATCH', {
    role: 'manager',
}, tk);
```
