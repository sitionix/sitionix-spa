# Frontend Dev Deploy

## Context
This repo deploys the existing module-federation topology as four static builds behind one VM-hosted Nginx edge:

- `app.dev.sitionix.com` serves shell
- `auth.dev.sitionix.com` serves auth
- `workspace.dev.sitionix.com` serves workspace
- `builder.dev.sitionix.com` serves builder

Only shell proxies `/bffssox/*` to the BFF. Backend services remain private.

## Source of truth
Deployment metadata is split by responsibility:
- app catalog: [`deploy/frontend/config/applications.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/config/applications.json)
- command config: [`deploy/frontend/config/deployment-command.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/config/deployment-command.json)
- environment profiles: [`deploy/frontend/environments/dev.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/environments/dev.json)
- GitHub Environment `dev`: deploy-specific variables and secrets

Repo-owned files control:
- deploy command prefix
- deployable application names
- branch-to-environment mapping
- environment ids / GitHub Environment names

GitHub Environment `dev` controls:
- public hostnames
- build-time public env values
- BFF proxy target
- VM filesystem layout
- Nginx site paths
- Let’s Encrypt certificate paths
- SSH connection settings and secrets

## Frontend build strategy
Shell federation remotes are no longer hardcoded to localhost in [`apps/shell/vite.config.ts`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/shell/vite.config.ts). They are resolved from:

- `VITE_AUTH_REMOTE_ORIGIN`
- `VITE_WORKSPACE_REMOTE_ORIGIN`
- `VITE_BUILDER_REMOTE_ORIGIN`

Development mode uses `/<remote>/remoteEntry.js`.
Static build mode uses `/<remote>/assets/remoteEntry.js`.

Auth, workspace and builder still use `VITE_SHELL_ORIGIN` for direct-open redirect back to shell.

Local development still uses committed app `.env` files for now, but `.env.example` files now exist as the staged migration target and `apps/*/.env.local` is reserved for developer-specific overrides.

## Workflow flow
Push workflow: [`frontend-deploy-on-push.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-on-push.yml)

PR comment workflow: [`frontend-deploy-on-comment.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-on-comment.yml)

Reusable execution workflow: [`frontend-deploy-execute.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-execute.yml)

1. Resolve target environment and selected app(s) from deployment config.
2. Checkout the correct ref.
   For PR comment deploy this is the PR head SHA.
3. Call the reusable execution workflow with a normalized deployment request.
4. Attach the selected GitHub Environment and materialize the full deployment plan from GitHub Environment vars/secrets plus repo metadata.
5. Build the selected app(s) with env derived from the materialized plan.
6. Generate a release payload with:
   - built static files
   - rendered Nginx config
   - deployment plan snapshot
   - release manifest
   - VM deploy script
7. Upload the release tarball to the VM over SSH/SCP.
8. Run the VM deploy script.
9. Verify public URLs, remote entries and shell `/bffssox` proxy behaviour.

This split keeps trigger-specific workflows small and puts deploy-specific value resolution in the only place where GitHub Environment context actually exists.
Even when a deploy targets only one app, the deployment plan still carries the full frontend topology so the rendered Nginx config keeps all four hosts intact.

## PR comment deploy
Example:

```text
/deploy --name "Workspace SPA" --env dev
```

Supported flags:
- `--name "<Application Name>"`
- `--all`
- `--env <environment-id>`

Allowed application names are read from deployment config, not duplicated in workflow logic.

## GitHub Environment contract
The reusable executor expects the selected GitHub Environment to provide:

Non-secret variables:
- `FRONTEND_HOST_SHELL`
- `FRONTEND_HOST_AUTH`
- `FRONTEND_HOST_WORKSPACE`
- `FRONTEND_HOST_BUILDER`
- `FRONTEND_API_BASE_URL`
- `FRONTEND_WORKSPACE_USE_MOCKS`
- `DEPLOY_BFF_PROXY_TARGET`
- `DEPLOY_APP_ROOT`
- `DEPLOY_RUNTIME_ROOT`
- `DEPLOY_BACKUP_ROOT`
- `DEPLOY_NGINX_SITE_PATH`
- `DEPLOY_NGINX_SITE_LINK_PATH`
- `DEPLOY_SSL_SHELL_CERT_PATH`
- `DEPLOY_SSL_SHELL_KEY_PATH`
- `DEPLOY_SSL_AUTH_CERT_PATH`
- `DEPLOY_SSL_AUTH_KEY_PATH`
- `DEPLOY_SSL_WORKSPACE_CERT_PATH`
- `DEPLOY_SSL_WORKSPACE_KEY_PATH`
- `DEPLOY_SSL_BUILDER_CERT_PATH`
- `DEPLOY_SSL_BUILDER_KEY_PATH`

Secrets:
- `DEPLOY_VM_HOST`
- `DEPLOY_VM_USER`
- `DEPLOY_VM_SSH_PRIVATE_KEY`

Optional variables:
- `DEPLOY_VM_PORT`
- `DEPLOY_SUDO_COMMAND`

## Nginx shape
Rendered from the deployment plan by [`scripts/frontend-deploy/lib/nginx.mjs`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/scripts/frontend-deploy/lib/nginx.mjs)

Current behaviour:
- each hostname has its own HTTPS server block
- each hostname also redirects HTTP to HTTPS
- shell serves SPA static files and proxies `/bffssox/`
- auth/workspace/builder serve static files with SPA fallback
- auth/workspace/builder add CORS only for `remoteEntry.js` and `/assets/*`

## VM deploy script
Script: [`deploy/frontend/vm/deploy-frontend.sh`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/vm/deploy-frontend.sh)

What it does:
- validates destination paths
- stages each selected app under `/opt/sitionix/runtime/frontend/releases/<release-id>`
- keeps the previous symlink target for rollback
- installs the rendered Nginx site config
- switches active app symlinks under `/opt/sitionix/app/frontend/current`
- runs `nginx -t`
- restores previous config and symlinks if validation fails
- reloads Nginx only after validation succeeds

## Verification checklist
CI / deploy:
- `develop` push resolves to `dev`
- PR comment `/deploy --name "Workspace SPA" --env dev` resolves correctly
- deploy job fails on invalid config, invalid artifact shape, or `nginx -t` failure

Frontend runtime:
- `https://app.dev.sitionix.com` returns shell HTML
- shell build contains no `localhost:3001`, `localhost:3002`, `localhost:3003`
- `https://auth.dev.sitionix.com/assets/remoteEntry.js` returns `200`
- `https://workspace.dev.sitionix.com/assets/remoteEntry.js` returns `200`
- `https://builder.dev.sitionix.com/assets/remoteEntry.js` returns `200`
- auth/workspace/builder bundles contain the configured `VITE_SHELL_ORIGIN`

Nginx / edge:
- rendered config points each hostname to `/opt/sitionix/app/frontend/current/<app>`
- only shell has `/bffssox/` proxy configuration
- remote hosts emit `Access-Control-Allow-Origin: https://app.dev.sitionix.com` for remote assets
- `nginx -t` passes before reload

Regression safety:
- repeated deploy writes a new release directory instead of mutating the current one in place
- active symlinks are switched only after staging succeeds
- failed `nginx -t` restores previous config and symlinks
- workflow verifies public URLs after deploy instead of reporting success immediately after copy
