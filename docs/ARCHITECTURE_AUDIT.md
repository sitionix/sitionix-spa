# Architecture Audit - sitionix-spa

## Current microfrontend boundaries
- **Shell (host)**: `apps/shell` owns the root route and mounts microfrontends. Entry is `apps/shell/src/App.tsx` and router `apps/shell/src/app/router.tsx`.
- **Auth MF**: `apps/auth` exposes `./mount` via Module Federation (`apps/auth/vite.config.ts`, `apps/auth/src/mf/mount.tsx`).
- **Workspace MF**: `apps/workspace` exposes `./mount` via Module Federation (`apps/workspace/vite.config.ts`, `apps/workspace/src/mf/mount.tsx`).

## Routing ownership
- **Shell**: Browser router routes `"/"`, `"/auth/*"`, `"/workspace/*"` (`apps/shell/src/app/router.tsx`).
- **Auth MF**: Memory router owns `"/"` (registration), `"/authorisation"`, `"/registration"` (`apps/auth/src/app/router.tsx`).
- **Workspace MF**: Memory router owns `"/"` (dashboard) and wildcard fallback (`apps/workspace/src/app/router.tsx`).

## State management approach
- **Local React state only**: Components use hooks (`useState`, `useEffect`) with no global store or React context. I did not find Redux/Zustand/Recoil/etc (scan: `apps/*`, `packages/*`).
- **Session/side effects**: Centralized utilities live in `@sitionix/auth-session` (session types only, no token storage) and `@sitionix/http-client` (fetch wrapper with cookie credentials).

## Shared libraries and consumption
- **@sitionix/ui**: Shared auth UI components (`packages/ui/src/*`). Consumed by Auth/Workspace via workspace dependency and Vite/TS aliases (`apps/auth/vite.config.ts`, `apps/workspace/vite.config.ts`, `apps/*/tsconfig.app.json`).
- **@sitionix/contracts**: Shared request/response types (`packages/contracts/src/*`). Consumed by Auth/Workspace (`apps/auth/package.json`, `apps/workspace/package.json`).
- **@sitionix/http-client**: Fetch wrapper (`packages/http-client/src/index.ts`). Consumed by Auth/Workspace shared HTTP helpers.
- **@sitionix/auth-session**: Auth token storage + session helpers (`packages/auth-session/src/index.ts`). Consumed by Auth/Workspace.
- **@sitionix/build-config**: Shared Vite/Vitest config helpers (`packages/build-config/src/index.ts`). Used by Auth/Workspace Vite/Vitest configs.
- **@packages/tailwind-config**: Tailwind preset (`packages/tailwind-config/preset.ts`). Consumed via relative path in app Tailwind configs.

## Build tooling
- **Build system**: Vite 7 (apps), TypeScript build for packages.
- **Module Federation**: `@originjs/vite-plugin-federation` for Shell remotes and Auth/Workspace exposes (`apps/*/vite.config.ts`).
- **Testing**: Vitest with shared config helpers (`packages/build-config/src/vitest/createVitestConfig.ts`).
- **Styling**: Tailwind v4 via app-level `tailwind.config.ts` + shared preset.

## Top 10 structural issues (with references)
1. **MF route state is decoupled from browser URL**. `MemoryRouter` with `initialEntries` set to `basename` ignores deep links and prevents URL sync (assumption based on current mount implementation). `apps/auth/src/mf/mount.tsx`, `apps/workspace/src/mf/mount.tsx`.
2. **Remote entry URLs are hard-coded to localhost**. No environment-based remote resolution for staging/prod. `apps/shell/vite.config.ts`.
3. **Shell config diverges from shared build-config**. Auth/Workspace use `@sitionix/build-config`, Shell does not. `apps/shell/vite.config.ts`, `packages/build-config/src/vite/createViteConfig.ts`.
4. **Dev-time aliases bypass package boundaries**. Auth/Workspace alias workspace packages to `src`, ignoring built exports, which can diverge from production bundles. `apps/auth/vite.config.ts`, `apps/workspace/vite.config.ts`, `apps/auth/tsconfig.app.json`, `apps/workspace/tsconfig.app.json`.
5. **Toolchain version is not enforced**. No `engines` or `.nvmrc`, while build/test currently fail with Node 22.8.0. `package.json` (root).
6. **Module Federation shared deps not pinned/singleton**. React/router shared config lacks explicit version/strictness in the host (assumption: risk of duplicate React instances). `apps/shell/vite.config.ts`, `apps/auth/vite.config.ts`, `apps/workspace/vite.config.ts`.
7. **Tailwind preset package naming inconsistency**. Package is `@packages/tailwind-config` but apps import via relative path and do not declare dependency. `packages/tailwind-config/package.json`, `apps/*/tailwind.config.ts`.
8. **HTTP client setup duplicated across MFs**. Both Auth and Workspace define `shared/http/httpClient.ts` rather than a shared config layer. `apps/auth/src/shared/http/httpClient.ts`, `apps/workspace/src/shared/http/httpClient.ts`.
9. **Router fallbacks mask missing routes**. Wildcard routes redirect to index, making 404s impossible and hiding bad URLs. `apps/auth/src/app/router.tsx`, `apps/workspace/src/app/router.tsx`.
10. **Remote entry compat middleware duplicated**. `assetsRemoteEntryCompat` is copy/pasted between Auth and Workspace instead of shared. `apps/auth/vite.config.ts`, `apps/workspace/vite.config.ts`.

## Quick wins vs risky changes
- **Quick wins**
  - Add `engines`/`.nvmrc` to pin Node and reduce build/test drift (`package.json`).
  - Centralize `assetsRemoteEntryCompat` in `@sitionix/build-config` and reuse in Auth/Workspace.
  - Import Tailwind preset via workspace dependency and consistent package name (`packages/tailwind-config`).
  - Add a `lint` script or consistent lint config to root/package apps.

- **Risky changes**
  - Replace MF `MemoryRouter` with URL-synced routing or shared history across shell and remotes.
  - Change dev aliases to consume built packages (requires tighter release flow and publishing discipline).
  - Introduce cross-MF state sharing (global store/event bus) without a boundary contract.

## Dependency & ownership map (top-level packages/apps)
> Ownership is inferred by folder responsibility only (assumption).

| Package/App | Type | Public API surface | Notes/Owner (assumed) |
| --- | --- | --- | --- |
| `apps/shell` | Host app | Browser routes at `/`, `/auth/*`, `/workspace/*` (`apps/shell/src/app/router.tsx`). Consumes remotes `auth` + `workspace`. | Shell/Platform |
| `apps/auth` | MF app | Module Federation expose `auth/mount` (`apps/auth/src/mf/mount.tsx`). Routes: `/`, `/authorisation`, `/registration` (`apps/auth/src/app/router.tsx`). | Auth team |
| `apps/workspace` | MF app | Module Federation expose `workspace/mount` (`apps/workspace/src/mf/mount.tsx`). Routes: `/` (dashboard) (`apps/workspace/src/app/router.tsx`). | Workspace team |
| `packages/ui` | Shared UI | `AuthButton`, `AuthSidePanel`, `AuthInput`, `SocialAuthButton`, `SocialAuthPanel` via `packages/ui/src/index.ts`. | Design system |
| `packages/contracts` | Shared types | `common/*`, `auth/*` request/response types via `packages/contracts/src/index.ts`. | Shared API |
| `packages/http-client` | Shared utils | `requestJson`, `createRequestJson`, HTTP types via `packages/http-client/src/index.ts`. | Shared API |
| `packages/auth-session` | Shared utils | Session domain types via `packages/auth-session/src/index.ts`. | Auth platform |
| `packages/build-config` | Shared tooling | `createViteConfig`, `createVitestConfig` via `packages/build-config/src/index.ts`. | Platform tooling |
| `packages/tailwind-config` | Shared styling | Tailwind preset export via `packages/tailwind-config/preset.ts`. | Design system |

## Command results (build/tests/lint)
- `pnpm build` (root): **failed**
  - Node 22.8.0 is below Vite requirement (20.19+ or 22.12+).
  - EPERM writing `.vite-temp` under `apps/shell/node_modules`.
- `pnpm test` (root): **failed**
  - EPERM writing `.vite-temp` under `packages/ui/node_modules` and `packages/auth-session/node_modules`.
- `pnpm lint`: **not available** (no lint script in root `package.json`).

## Notes / assumptions
- The MemoryRouter deep-link limitation is inferred from `initialEntries` usage; if the host passes a full path elsewhere, this might be mitigated.
- Ownership labels are assumptions based on folder responsibility only.
