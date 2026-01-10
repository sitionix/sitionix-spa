# sitionix-spa

## Dev
- `pnpm dev` (shell on 3000, auth on 3001)
- Open `http://localhost:3000/auth`

## Build
- `pnpm -r build`
- `pnpm -C apps/auth build && pnpm -C apps/auth preview --port 3001 --strictPort`
- `pnpm -C apps/shell build && pnpm -C apps/shell preview --port 3000 --strictPort`

## MF check
- Dev remote entry: `curl -I http://localhost:3001/remoteEntry.js`
- Preview remote entry: `curl -I http://localhost:3001/assets/remoteEntry.js`
