# Repro: auto-login after reopen (HTTPS local)

## Preconditions
- Start SPA: `pnpm dev`
- Open only shell origin: `https://localhost:3000`
- BFF is running and reachable from SPA `/bffssox` proxy

## Scenario A: reopen tab
1. Open `https://localhost:3000/auth/authorisation`
2. Login with valid credentials
3. Confirm navigation to `/workspace`
4. Close tab
5. Open a new tab at `https://localhost:3000/workspace`

## Expected
- On initial load there is exactly one bootstrap refresh sequence
- User lands in `/workspace` without re-login
- No `403 Session does not match original token context`

## Scenario B: two tabs at once
1. After successful login, open two tabs with `https://localhost:3000/workspace`
2. Reload both tabs almost simultaneously

## Expected
- Refresh is coordinated across tabs (no parallel refresh storm)
- Session is not marked suspicious due to concurrent refresh

## Quick checks
- Do not use direct remote URLs (`:3001/:3002/:3003`)
- Verify `VITE_API_BASE_URL` is configured for each app
