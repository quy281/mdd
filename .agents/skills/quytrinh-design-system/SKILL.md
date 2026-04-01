---
name: quytrinh-design-system
description: >
  Hệ thống thiết kế UI/UX và kiến trúc data layer của phần mềm ERP nội thất MKG-ERP (d:/quytrinh).
  Dùng làm chuẩn tham chiếu khi xây dựng phần mềm mới: màu sắc, layout, component patterns, PocketBase data layer.
  Trigger: Khi user yêu cầu xây dựng phần mềm mới với dark theme, cần sidebar/bottom-nav, PocketBase backend, hoặc hỏi về style gốc của MKG.
skills:
  - clean-code
  - frontend-design
---

# MKG-ERP Design System

Đây là tài liệu chuẩn hóa toàn bộ UI/UX và data layer của **MKG-ERP** — hệ thống quản lý sản xuất & lắp đặt nội thất. Stack: **Next.js 15 App Router + Tailwind v4 + PocketBase + TypeScript**.

---

## 1. Design Philosophy

> **"Linear.app meets warm walnut wood"** — dark UI cao cấp, ấm áp, không lạnh lẽo như blue-theme thông thường.

- Tất cả dark, **không có light mode** (forced dark)
- Palette lấy cảm hứng từ **gỗ óc chó** (walnut) và **vàng đồng** (gold oak)
- Micro-animations nhẹ nhàng (0.3s ease-out), không gây mất tập trung
- Mobile-first: sidebar ẩn trên mobile, dùng bottom-nav

---

## 2. Color Palette — Gold Oak Dark

```css
/* Brand — Gold Oak */
--color-primary:          #c8956c;   /* Cam vàng chính */
--color-primary-hover:    #b5824f;   /* Hover darker */
--color-primary-light:    rgba(200, 149, 108, 0.15); /* Tinted bg */
--color-primary-foreground: #110f0b; /* Text trên nền primary */

--color-secondary:        #9a8b78;   /* Nâu xám — muted text */
--color-accent:           #d4a574;   /* Vàng nhạt hơn — status label */

/* Semantic */
--color-success:          #6b9a5e;
--color-success-light:    rgba(107, 154, 94, 0.15);
--color-danger:           #c45c4a;
--color-danger-light:     rgba(196, 92, 74, 0.15);
--color-warning:          #c8956c;   /* Dùng chung với primary */
--color-info:             #7a9bb5;

/* Surfaces — Walnut Dark */
--background:   #110f0b;   /* Nền toàn trang — gần đen ấm */
--surface:      #1c1814;   /* Card, panel surface */
--surface-hover:#2a2218;   /* Hover state của surface */
--border-color: #3d2e1e;   /* Border mỏng, nâu ấm */
--muted:        #1c1814;
--muted-fg:     #9a8b78;   /* Placeholder, label */

/* Sidebar riêng — tối hơn */
--sidebar-bg:     #0d0b08;
--sidebar-fg:     #9a8b78;
--sidebar-hover:  #1c1814;
--sidebar-active: #c8956c;

/* Text */
--foreground:   #e8ddd0;   /* Text chính — trắng ấm */
```

### Quy tắc dùng màu
| Trường hợp | Màu |
|---|---|
| Text chính | `#e8ddd0` |
| Label / muted text | `#9a8b78` |
| Placeholder input | `#5e503f` |
| Active / highlight | `#c8956c` |
| Nền card | `#1c1814` |
| Border | `#3d2e1e` |
| Nền sidebar | `#0d0b08` |

---

## 3. Typography

```tsx
// Font: Inter (Google Fonts), hỗ trợ Vietnamese
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});
```

- Font size chính: `text-sm` (14px) cho body
- Heading: `text-2xl font-bold tracking-tight text-[#e8ddd0]`
- Sub label: `text-xs text-[#9a8b78]`
- Footer / caption: `text-[10px]` hoặc `text-xs`

---

## 4. Spacing & Radius

```css
--radius-sm: 0.375rem;  /* 6px  — tag, badge nhỏ */
--radius-md: 0.5rem;    /* 8px  — button, input */
--radius-lg: 0.75rem;   /* 12px — card, panel */
--radius-xl: 1rem;      /* 16px — modal, login card */
```

Tailwind equivalents: `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px).

---

## 5. Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.2);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3);
```

---

## 6. Animations

Chỉ dùng 4 animation chính, tất cả `0.3s ease-out`:

```css
/* Dùng cho page/component mount */
.animate-fade-in    { animation: fadeIn 0.3s ease-out; }
/* Slide từ trái */
.animate-slide-in-left { animation: slideInLeft 0.3s ease-out; }
/* Slide từ dưới */
.animate-slide-in-up   { animation: slideInUp 0.3s ease-out; }
```

Card hover glow (class `card-glow`):
```css
.card-glow:hover {
  box-shadow: 0 0 24px rgba(200, 149, 108, 0.08), 0 0 8px rgba(200, 149, 108, 0.05);
  border-color: #4d3e2e;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
```

---

## 7. Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3d2e1e; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #9a8b78; }
```

---

## 8. Layout Architecture

### AppShell Pattern

```
RootLayout
  └─ AppShell              ← wrapper tổng
       ├─ Sidebar           ← hidden on mobile (lg:flex)
       ├─ TopBar            ← fixed header (mobile)
       ├─ main (nội dung)   ← có padding-left cho sidebar
       └─ BottomNav         ← fixed bottom, lg:hidden
```

### Page Content Area

```tsx
// Tất cả page content dùng max-width và spacing này:
<div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
  {/* content */}
</div>
```

---

## 9. Sidebar Component

File: `components/layout/Sidebar.tsx`

**Specs:**
- Desktop only: `hidden lg:flex`
- Fixed left: `fixed left-0 top-0 h-screen z-40`
- Width: `260px` expanded / `72px` collapsed — toggle bằng nút chevron
- Background: `#0d0b08` (tối hơn background page)
- Border right: `border-r border-[#3d2e1e]/50`

**Active nav item indicator:**
```tsx
// Màu text + bg khi active
isActive ? "bg-[#c8956c]/15 text-[#c8956c]" : "text-[#9a8b78] hover:bg-[#1c1814]"

// Thanh dọc bên trái khi active
<span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#c8956c] rounded-r-full" />
```

**Collapsed tooltip:**
```tsx
// Khi sidebar collapsed, hover icon hiện tooltip
<div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs bg-[#1c1814] border border-[#3d2e1e] opacity-0 group-hover:opacity-100 transition-opacity z-50">
  {item.label}
</div>
```

**User info + logout ở bottom:**
```tsx
// Avatar chữ cái đầu + displayName
<div className="w-8 h-8 rounded-lg bg-[#c8956c]/15 flex items-center justify-center">
  <span className="text-xs font-bold text-[#c8956c]">{user.displayName.charAt(0)}</span>
</div>
```

---

## 10. Bottom Navigation (Mobile)

File: `components/layout/BottomNav.tsx`

```tsx
// Container
<nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0d0b08]/95 border-t border-[#3d2e1e]/50 backdrop-blur-xl"
     style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
  <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
```

- Dùng `safe-area-inset-bottom` để tránh home-indicator iPhone
- `backdrop-blur-xl` cho glass effect
- Max 5 items, filtered by role
- Active indicator: dải ngang trên cùng (`top-0`, `w-8 h-0.5 bg-[#c8956c]`)
- Touch feedback: `active:scale-95` trên mỗi Link

---

## 11. Card Pattern

```tsx
// Card cơ bản
<div className="bg-[#1c1814] rounded-xl border border-[#3d2e1e] p-5 card-glow">

// Card với icon header (stat card)
<div className="bg-[#1c1814] rounded-xl border border-[#3d2e1e] p-4 lg:p-5 card-glow group">
  <div className="flex items-center justify-between mb-3">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
         style={{ backgroundColor: `${accent}15` }}>
      <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
    </div>
  </div>
  <p className="text-2xl font-bold text-[#e8ddd0]">{value}</p>
  <p className="text-sm text-[#9a8b78] mt-0.5">{label}</p>
</div>
```

---

## 12. Input / Form Pattern

```tsx
// Input cơ bản
<input className="w-full h-11 px-4 rounded-xl text-sm
  bg-[#110f0b] border border-[#3d2e1e] text-[#e8ddd0]
  placeholder:text-[#5e503f]
  focus:outline-none focus:border-[#c8956c] focus:ring-1 focus:ring-[#c8956c]/30
  transition-all" />

// Label
<label className="block text-xs font-medium text-[#9a8b78] mb-1.5">

// Error message
<p className="text-sm text-[#c45c4a] bg-[#c45c4a]/10 px-3 py-2 rounded-lg animate-fade-in">
  {error}
</p>
```

---

## 13. Button Pattern

```tsx
// Primary button
<button className="w-full h-11 rounded-xl text-sm font-semibold
  bg-[#c8956c] text-[#110f0b]
  hover:bg-[#b5824f]
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all flex items-center justify-center gap-2">

// Ghost/secondary
<button className="px-3 py-2 rounded-lg text-xs text-[#9a8b78]
  hover:bg-[#1c1814] hover:text-[#e8ddd0] transition-colors">
```

---

## 14. Status Badge Pattern

```tsx
const statusMap = {
  IN_PRODUCTION: { label: "Đang SX",    color: "text-[#d4a574]" },
  COMPLETED:     { label: "Hoàn thành", color: "text-[#6b9a5e]" },
  CONTRACTED:    { label: "Đã ký HĐ",  color: "text-[#7a9bb5]" },
  DRAFT:         { label: "Nháp",       color: "text-[#9a8b78]" },
  QUOTED:        { label: "Đã gửi BG", color: "text-[#c8956c]" },
  DELIVERING:    { label: "Đang giao", color: "text-[#7a9bb5]" },
  INSTALLING:    { label: "Đang lắp",  color: "text-[#d4a574]" },
};

// Render
<span className={cn("text-[10px] font-medium", st.color)}>{st.label}</span>
```

---

## 15. Login Page Pattern

```tsx
// Full screen với grain texture + ambient glow
<div className="min-h-screen flex items-center justify-center bg-[#110f0b] relative overflow-hidden">
  {/* Grain texture */}
  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,...")` }} />
  {/* Ambient glow */}
  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
    w-[600px] h-[400px] rounded-full bg-[#c8956c]/5 blur-[120px]" />
  
  {/* Card */}
  <div className="relative w-full max-w-sm mx-4 animate-fade-in">
    {/* Logo icon */}
    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1c1814] border border-[#3d2e1e]
      flex items-center justify-center shadow-lg">
      <span className="text-xl font-bold text-[#c8956c]">M</span>
    </div>
    
    {/* Form card */}
    <form className="bg-[#1c1814] border border-[#3d2e1e] rounded-2xl p-6 space-y-5 card-glow">
      {/* inputs, error, submit */}
    </form>
  </div>
</div>
```

---

## 16. Data Layer — PocketBase

### 16.1 Singleton Pattern

File: `lib/pocketbase.ts`

```ts
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://db.mkg.vn";

let pb: PocketBase;

export function getPocketBase(): PocketBase {
  if (typeof window === "undefined") {
    // SSR: luôn tạo mới
    return new PocketBase(PB_URL);
  }
  // Client: singleton, tắt auto-cancel
  if (!pb) {
    pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);
  }
  return pb;
}
```

### 16.2 Collections Constants

```ts
// Dùng prefix namespace để tránh xung đột (erp_)
export const Collections = {
  ORDERS:            "erp_orders",
  PRODUCTS:          "erp_products",
  COMPONENTS:        "erp_components",
  TICKETS:           "erp_tickets",
  CUSTOMERS:         "erp_customers",
  QUOTATIONS:        "erp_quotations",
  CATALOG_PRODUCTS:  "erp_catalog_products",
  CATALOG_MATERIALS: "erp_catalog_materials",
  CATALOG_UNITS:     "erp_catalog_units",
  USERS:             "erp_app_users",
  NOTIFICATIONS:     "erp_notifications",
  SETTINGS:          "erp_settings",
} as const;
```

### 16.3 CRUD Abstraction (`pb-crud.ts`)

Wrap PocketBase calls để dễ test/swap:

```ts
// Get all với pagination tự động
export async function pbGetAll<T>(collection: string, filter?: string): Promise<T[]> { ... }

// CRUD chuẩn
export async function pbCreate<T>(collection: string, data: Partial<T>): Promise<T>
export async function pbUpdate<T>(collection: string, id: string, data: Partial<T>): Promise<T>
export async function pbDelete(collection: string, id: string): Promise<void>
```

### 16.4 Record Mapper

```ts
// Loại bỏ metadata PocketBase, chỉ giữ data thuần
function mapRecord<T>(record: RecordModel): T {
  const { collectionId, collectionName, expand, ...rest } = record;
  return rest as unknown as T;
}
```

### 16.5 Composite Query (Anti N+1)

```ts
// Batch load components cho nhiều products cùng lúc
const filterParts = productIds.map(id => `product_id = "${id}"`);
const allComponents = await pbGetAll<Component>(
  Collections.COMPONENTS,
  filterParts.join(" || ")
);
// Group lại bằng Map
const componentMap = new Map<string, Component[]>();
for (const c of allComponents) {
  const list = componentMap.get(c.product_id) || [];
  list.push(c);
  componentMap.set(c.product_id, list);
}
```

---

## 17. Auth System Pattern

### Custom Auth (không dùng PocketBase auth)

- Password hash bằng **Web Crypto SHA-256** (browser-native, không cần lib)
- Session lưu trong `localStorage` (key: `erp_session`)
- Super Admin hardcoded làm fallback khi PB không kết nối được

```ts
// Hash
async function hashPassword(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Session
const session = { userId, loginAt: new Date().toISOString(), userData: safeUser };
localStorage.setItem("erp_session", JSON.stringify(session));
```

### Role-Based Permissions

```ts
type UserRole = "ADMIN" | "MANAGER" | "WAREHOUSE" | "INSTALLER" | "SALES";

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN:     ["*"],
  MANAGER:   ["*"],
  WAREHOUSE: ["/", "/bom", "/kitting", "/scan", "/delivery", "/tickets"],
  INSTALLER: ["/", "/scan", "/installation", "/tickets"],
  SALES:     ["/", "/customers", "/quotations", "/ho-so", "/catalog"],
};

// Check
function hasPermission(user: AppUser | null, path: string): boolean {
  if (!user) return false;
  if (user.permissions.includes("*")) return true;
  return user.permissions.some(p => path === p || (p !== "/" && path.startsWith(p)));
}
```

### Auth Guard Component

```tsx
// components/layout/AuthGuard.tsx
// Redirect về /login nếu không có session
// Render children chỉ sau khi mounted để tránh hydration mismatch
```

---

## 18. Notification Pattern

```ts
// addNotification — push vào PocketBase + local state
addNotification({
  title: "Đơn hàng mới",
  body: `Mã đơn ${order.order_code} đã được tạo`,
  type: "ORDER_NEW",
  targetRoles: ["MANAGER", "WAREHOUSE", "ADMIN"],
  link: "/bom",
}).catch(() => {}); // silent fail — không chặn flow chính
```

---

## 19. PWA Setup

```tsx
// next.config.ts / layout.tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",       // ← quan trọng cho notch
  themeColor: "#110f0b",      // ← màu thanh status bar
};

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MKG-ERP",
  },
};

// SW registration (inline script)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
```

---

## 20. Grid Layouts Chuẩn

```tsx
// Stat cards: 2 cột mobile, 4 cột desktop
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

// Quick actions: 1 cột → 3 cột
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

// List item hover row
<div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2a2218]/50 transition-colors">
```

---

## 21. Tổng kết: Checklist khi build phần mềm mới

- [ ] Copy `globals.css` → thay brand name, giữ nguyên palette
- [ ] Setup Inter font với `vietnamese` subset
- [ ] AppShell = Sidebar (desktop) + TopBar + BottomNav (mobile)
- [ ] PocketBase singleton với `autoCancellation(false)`
- [ ] `Collections` constant object với namespace prefix
- [ ] `pbGetAll` wrapper với auto-pagination
- [ ] Auth bằng SHA-256 + localStorage session
- [ ] `hasPermission()` cho route guard
- [ ] `card-glow` class cho mọi interactive card
- [ ] `animate-fade-in` cho page mount
- [ ] `safe-area-inset-bottom` cho bottom nav
- [ ] `viewportFit: "cover"` + `themeColor: "#110f0b"` cho PWA
