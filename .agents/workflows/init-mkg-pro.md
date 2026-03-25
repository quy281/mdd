---
description: Quy trinh khoi tao tu Y tuong den He thong file MD, Data mau va Asset Config.
---

# Workflow: /init-mkg-pro

1. **Step 1: The Interview** - AI gui 5 cau hoi (Target, Flow, Vibe, Color).
2. **Step 2: Documentation** - Sau khi Quy OK, AI tao:
   - `PRD.md`: Feature list & User Flow.
   - `ARCHITECTURE.md`: PocketBase Schema & DB Connection (db.mkg.vn).
   - `UI_GUIDE.md`: Design system + **Icon/Favicon Specs**.
   - `SEED_DATA.md`: 20+ records mau cho moi table.
3. **Step 3: Asset Setup** - AI tu viet doan code config Favicon cho Next.js (app/layout.tsx) hoac HTML Head.
4. **Step 4: Hot Cache** - Cap nhat `GEMINI.md` va `TASKS.md`.
