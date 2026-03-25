---
name: MKG Development Platform
description: Quy tắc phát triển phần mềm tổng quát cho hệ sinh thái MKG - PocketBase, deployment, auth, patterns, real infrastructure.
---

# MKG Development Platform – General Agent Skill

> Skill này áp dụng cho **MỌI** dự án phần mềm của MKG, không riêng app nào.

---

## 1. Thông tin hạ tầng

### PocketBase (Backend chính)
| Key | Value |
|-----|-------|
| **URL** | `https://db.mkg.vn` |
| **Superuser email** | `quy28181818@gmail.com` |
| **Superuser pass** | `@Mkg201444` |
| **Admin app pass** | `mkg20144` |

### GitHub
| Key | Value |
|-----|-------|
| **Account** | `quy281` |
| **Org** | Dùng personal repos |

### Deployment
| Platform | Dùng cho |
|----------|---------|
| **Cloudflare Pages** | Vite, static sites, standalone tools |
| **Vercel** | Next.js apps |
| **Domain** | `*.mkg.vn` |

### Projects Location
- Lưu tại ổ **D:\\** (VD: `D:\agent-hub`, `D:\agentos`, `D:\project-name`)
- Mỗi project là 1 folder riêng

---

## 2. PocketBase Patterns (BẮT BUỘC)

### 2.1. API Call Rules

```javascript
// ✅ ĐÚNG — dùng getList()
const result = await pb.collection('collection_name').getList(1, 500, {
  filter: filter || undefined,
});
return result.items;

// ❌ SAI — KHÔNG dùng getFullList() (gây lỗi skipTotal)
const result = await pb.collection('collection_name').getFullList({ sort: '-created' });

// ❌ SAI — KHÔNG dùng sort=-created (không phải bản PB nào cũng hỗ trợ)
```

### 2.2. Collection API Rules

Khi tạo collection mới → **PHẢI set rules** cho phù hợp:
| Rule | Giá trị `""` | Giá trị `null` |
|------|-------------|----------------|
| listRule | Mọi authenticated user đọc được | **BLOCKED** (chỉ superuser) |
| viewRule | Mọi authenticated user xem được | **BLOCKED** |
| createRule | Mọi authenticated user tạo được | **BLOCKED** |
| updateRule | Mọi authenticated user sửa được | **BLOCKED** |
| deleteRule | Mọi authenticated user xóa được | **BLOCKED** |

**Lỗi phổ biến #1**: Tạo collection nhưng quên set rules → user gặp 403 Forbidden.

```javascript
// Fix: Update rules qua superuser API
const patch = await fetch(PB_URL + '/api/collections/' + colId, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + superToken },
  body: JSON.stringify({
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  }),
});
```

### 2.3. Auth Collection (User) Patterns

Khi tạo collection kiểu `auth` cho users:
```javascript
// Tạo user
await pb.collection('app_users').create({
  name: 'Tên',
  email: 'ten@mkg.vn',
  username: 'ten',
  password: 'password123',
  passwordConfirm: 'password123',
  role: 'staff',
  emailVisibility: true,
});

// Login
const auth = await pb.collection('app_users').authWithPassword('ten@mkg.vn', 'password123');

// Get current user
const user = pb.authStore.record;
```

### 2.4. Realtime Subscriptions

```javascript
// Subscribe
const unsub = pb.collection('items').subscribe('*', (e) => {
  const { action, record } = e; // action: 'create'|'update'|'delete'
  // Handle...
});

// Unsubscribe
unsub();
```

**Lỗi phổ biến #2**: Optimistic update + realtime → duplicate records.
```javascript
// Fix: Always check for existing records
case 'create':
  setItems(prev => {
    const exists = prev.some(t => t.id === record.id);
    if (exists) return prev.map(t => t.id === record.id ? { ...t, ...record } : t);
    // Replace temp record if any
    const tempIdx = prev.findIndex(t => t.id?.startsWith('_temp_'));
    if (tempIdx !== -1) { const u = [...prev]; u[tempIdx] = record; return u; }
    return [record, ...prev];
  });
```

### 2.5. Shared Config Pattern

Dùng 1 collection `<app>_config` với `key` (text) + `value` (json) để lưu shared settings thay vì localStorage:

```javascript
// Đọc config
export async function getConfig(key) {
  const result = await pb.collection('app_config').getList(1, 1, {
    filter: `key = "${key}"`,
  });
  return result.items[0] || null;
}

// Ghi config
export async function setConfig(key, value) {
  const existing = await getConfig(key);
  if (existing) {
    return await pb.collection('app_config').update(existing.id, { value });
  } else {
    return await pb.collection('app_config').create({ key, value });
  }
}
```

**Quy tắc**: Mọi dữ liệu cần đồng bộ giữa các browser/device → dùng PocketBase, KHÔNG dùng localStorage.

---

## 3. Superuser Script Pattern

Khi cần tạo collections, seed data, update rules — dùng Node.js scripts:

```javascript
const PB_URL = 'https://db.mkg.vn';

async function api(path, method, body, token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(PB_URL + path, {
    method: method || 'GET', headers: h,
    body: body ? JSON.stringify(body) : null,
  });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch (_) { d = { raw: t }; }
  return { ok: r.ok, status: r.status, data: d };
}

async function main() {
  // 1. Login as superuser
  const a = await api('/api/collections/_superusers/auth-with-password', 'POST', {
    identity: 'quy28181818@gmail.com', password: '@Mkg201444',
  });
  const tk = a.data.token;

  // 2. Create collection
  await api('/api/collections', 'POST', {
    name: 'my_collection',
    type: 'base', // hoặc 'auth' cho user collection
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'data', type: 'json' },
    ],
    listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
  }, tk);

  // 3. Seed data
  for (const item of seedData) {
    await api('/api/collections/my_collection/records', 'POST', item, tk);
  }
}
main();
```

**Lưu scripts** trong `scripts/` folder của project.

---

## 4. Frontend Patterns

### Tech Stack ưu tiên
| Loại | Công cụ |
|------|---------|
| **Build tool** | Vite |
| **Framework** | React (JSX) |
| **Styling** | Vanilla CSS (KHÔNG Tailwind trừ khi yêu cầu) |
| **State** | React hooks (useState, useEffect, useContext) |
| **Backend** | PocketBase SDK |
| **PWA** | vite-plugin-pwa |

### Project Init
```bash
npx -y create-vite@latest ./ --template react   # Tạo project React + Vite
npm install pocketbase                            # Backend SDK
```

### Auth Hook Pattern
```javascript
// hooks/useAuth.jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  // ... login, logout, onAuthChange
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### Data Hook Pattern
```javascript
// hooks/useData.js — Fetch + Realtime + Optimistic CRUD
export function useData(collectionName) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Fetch on mount
  // Subscribe realtime
  // Optimistic add/edit/remove
  return { items, loading, addItem, editItem, removeItem };
}
```

---

## 5. Data Seeding Requirements

Mỗi dự án MKG **PHẢI có**:
1. **Ít nhất 20 records mẫu** cho mỗi collection chính
2. **Real user accounts** — dùng email `*.mkg.vn`, KHÔNG mock data
3. **Demo-ready** — app phải chạy ngon ngay sau khi seed, không cần thao tác thêm
4. **Scripts reproducible** — `node scripts/seed-data.js` phải chạy lại được nhiều lần (check trùng trước khi tạo)

---

## 6. UI/UX Preferences (Boss Style)

1. **Đơn giản, tập trung** — Bỏ mọi thứ dư thừa
2. **Mobile-first** — Bottom nav, FAB button, touch-friendly
3. **KHÔNG placeholders** — Mọi hình ảnh phải generate/real, không dùng placeholder
4. **Dark mode support** — CSS variables cho theming
5. **Vietnamese UI** — Mọi label, button, message bằng tiếng Việt
6. **Notifications** — Browser notification + in-app bell icon khi có events
7. **Role-based access** — Admin/manager/staff phân quyền rõ ràng
8. **Online sync** — Mọi dữ liệu shared phải qua PocketBase, KHÔNG localStorage cho data quan trọng

---

## 7. Deployment Checklist

```bash
# 1. Build
npx vite build

# 2. Test build locally
npx vite preview

# 3. Push to GitHub
git add -A
git commit -m "feat: description"
git push origin main

# 4. Cloudflare Pages auto-deploy từ GitHub
#    - Build command: npx vite build
#    - Output directory: dist
#    - Domain: app-name.mkg.vn
```

### PWA Config (nếu cần)
```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';
export default {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'App Name MKG',
        short_name: 'App',
        theme_color: '#1a1a2e',
      },
    }),
  ],
};
```

---

## 8. Icon & Favicon

Mỗi project PHẢI có:
- `favicon.svg` hoặc `favicon.ico` trong `/public`
- PWA icons: 192x192 và 512x512 trong `/public`
- Nếu chưa có logo → agent tự suggest prompt để generate

---

## 9. Common Errors & Fixes

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| 403 Forbidden khi create/delete | Collection rules = `null` | Set rules = `""` qua superuser API |
| `getFullList` 400 Error | PB version không hỗ trợ skipTotal | Dùng `getList(1, 500)` |
| Data không sync giữa browsers | Lưu localStorage | Chuyển sang PocketBase collection |
| Duplicate records khi realtime | Optimistic + realtime race | Check exists trước khi add |
| Login thất bại | Sai collection name hoặc email format | Kiểm tra collection type = auth |
| Port conflict dev server | Port đã bị chiếm | Dùng `--port 5174` hoặc port khác |
