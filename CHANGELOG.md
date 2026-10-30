# Changelog — The Phoenix

All notable changes to **THE PHOENIX** academic timetable scheduling platform are documented in this file.

---

## [1.2.0] - 2026-10-30

### Fixed
- **Missing Module Error on Vercel (`Cannot find module '@/lib/backendApi'`):**
  - Resolved overbroad `lib/` pattern in root `.gitignore` that inadvertently ignored `Frontend/src/lib/`.
  - Added explicit exception `!Frontend/src/lib/` and committed `Frontend/src/lib/backendApi.ts`.
- **Vercel Build Failure (`Command "pnpm run build" exited with 1`):**
  - Resolved `ERR_PNPM_IGNORED_BUILDS` caused by strict dependency build enforcement on `unrs-resolver`.
  - Configured `pnpm-workspace.yaml` and `.npmrc` across the workspace with `allowBuilds: { unrs-resolver: true }` and `strictDepBuilds: false`.
  - Added root `package.json` that correctly coordinates the Next.js frontend build under both `pnpm` and `npm`.
- **Node.js 26.x Target Configuration:**
  - Upgraded `"engines": { "node": "26.x" }` across root `package.json` and `Frontend/package.json`.
  - Updated `Frontend/Dockerfile` to base image `node:26-alpine`.
- **Database & Server Resilience:**
  - Added local SQLite datastore fallback in `backend/database.py` with indexed lookups (`User_id`, `username`, `email`) to ensure uninterrupted local operation and tests even if the cloud Supabase domain is unresolvable.
  - Added missing backend route compatibility for `/upload_teachers` and `/upload_classes`.
- **ESLint & Warning Elimination:**
  - Fixed Next.js `@next/next/google-font-preconnect` warning in `Frontend/src/pages/_document.tsx`.
  - Removed unused duplicate page `Frontend/src/pages/view_enhanced.tsx`.

### Performance Optimizations
- **Dynamic Import of Heavy Packages:**
  - Deferred loading of the `xlsx` spreadsheet parsing and export engine in `Frontend/src/components/TimetableGrid.tsx`.
  - **Results:** Reduced `/create` initial page bundle size from **157 kB to 17.4 kB** (an **89% reduction**), and First Load JS from **310 kB to 208 kB** (a **33% reduction**).
- **Web Font & Asset Streamlining:**
  - Trimmed unused font weights in `Frontend/src/pages/_document.tsx` to only the actively rendered variants (`Inter: 400, 500, 600, 700` and `JetBrains Mono: 400, 500`), reducing font payload overhead by over 50%.
- **Vercel CDN Caching & Compression:**
  - Configured long-term immutable caching (`public, max-age=31536000, immutable`) for Next.js static assets and chunks in `Frontend/vercel.json` and `Frontend/next.config.mjs`.
  - Enabled Gzip/Brotli compression, `swcMinify`, and removed `X-Powered-By` header.
  - Automatically stripped development `console.log` statements in production bundles.

---

## [1.1.0] - 2026-10-30

### Added
- Custom minimal 404 Not Found page at `Frontend/src/pages/404.tsx` adhering to the Notion/Linear calm dark design system.

### Changed
- Refactored all frontend views (`/`, `/login`, `/create`, `/generate`, `/view`, `/analytics`) to a unified, distraction-free neutral aesthetic.
