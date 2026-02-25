# sitionix-spa

## Dev
- `pnpm dev` (shell on 3000, auth on 3001, workspace on 3002, builder on 3003)
- Open only `https://localhost:3000` (shell origin)
- Do not open remotes directly (`https://localhost:3001`, `https://localhost:3002`, `https://localhost:3003`)

## Build
- `pnpm -r build`
- `pnpm -C apps/auth build && pnpm -C apps/auth preview --port 3001 --strictPort`
- `pnpm -C apps/shell build && pnpm -C apps/shell preview --port 3000 --strictPort`

## MF check
- Dev remote entry: `curl -k -I https://localhost:3001/remoteEntry.js`
- Preview remote entry: `curl -k -I https://localhost:3001/assets/remoteEntry.js`
