# sitionix-spa

## Local development
- `pnpm dev`
- Shell runs on `https://localhost:3000`
- Remotes run on:
  - `https://localhost:3001`
  - `https://localhost:3002`
  - `https://localhost:3003`
- Committed `.env` files still provide the current local defaults:
  - [`apps/shell/.env`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/shell/.env)
  - [`apps/auth/.env`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/auth/.env)
  - [`apps/workspace/.env`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/workspace/.env)
  - [`apps/builder/.env`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/builder/.env)
- The staged cleanup path is now in place:
  - examples live in [`apps/shell/.env.example`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/shell/.env.example), [`apps/auth/.env.example`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/auth/.env.example), [`apps/workspace/.env.example`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/workspace/.env.example), [`apps/builder/.env.example`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/builder/.env.example)
  - local overrides belong in `apps/*/.env.local`
- Local-only Vite dev server settings such as `VITE_HOST` and localhost proxy targets stay out of GitHub Environment config.

## Dev deployment pipeline
The dev cloud deployment is split by ownership:
- [`deploy/frontend/config/applications.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/config/applications.json)
- [`deploy/frontend/config/deployment-command.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/config/deployment-command.json)
- [`deploy/frontend/environments/dev.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/environments/dev.json)

The repo now owns only stable deployment metadata:
- deployable applications
- deploy command prefix
- branch-to-environment mapping
- environment ids / GitHub Environment names
- stable VM/deploy path constants
- deterministic Nginx site path derivation
- deterministic Let’s Encrypt certificate path derivation

The GitHub Environment `dev` owns deploy-specific values:
- frontend hosts
- public build env values
- optional BFF upstream override
- SSH connection secrets

For the `dev` profile it builds and deploys:
- `Shell SPA` -> `https://app.dev.sitionix.com`
- `Auth SPA` -> `https://auth.dev.sitionix.com`
- `Workspace SPA` -> `https://workspace.dev.sitionix.com`
- `Builder SPA` -> `https://builder.dev.sitionix.com`

Build-time frontend values are derived from that profile:
- `VITE_SHELL_ORIGIN=https://app.dev.sitionix.com`
- `VITE_AUTH_REMOTE_ORIGIN=https://auth.dev.sitionix.com`
- `VITE_WORKSPACE_REMOTE_ORIGIN=https://workspace.dev.sitionix.com`
- `VITE_BUILDER_REMOTE_ORIGIN=https://builder.dev.sitionix.com`
- `VITE_API_BASE_URL=/bffssox`
- `VITE_WORKSPACE_USE_MOCKS=false`

The deployed runtime does not use `vite preview`. GitHub Actions builds static assets, uploads a release payload to the VM, updates `/opt/sitionix/app/frontend/current/*`, renders the Nginx site config, runs `nginx -t`, and reloads Nginx only after validation passes.

## GitHub Actions usage
Push entrypoint: [`frontend-deploy-on-push.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-on-push.yml)

PR comment entrypoint: [`frontend-deploy-on-comment.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-on-comment.yml)

Reusable execution workflow: [`frontend-deploy-execute.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-execute.yml)

Supported triggers:
- `push`
  Branch-to-environment mapping comes from environment profiles. Today `develop -> dev`.
- PR comment deploy
  Example:
  ```text
  /deploy --name "Workspace SPA" --env dev
  ```

The push and PR comment entrypoints only resolve environment/app selection and then call the reusable execution workflow. The full deployment plan is materialized inside the executor after `environment: dev` attaches GitHub Environment vars and secrets. That keeps trigger-specific workflows thin and avoids trying to resolve deploy-time values before GitHub Environment context exists.

## Required GitHub environment variables and secrets
Create a GitHub Environment named `dev`.

Required environment variables:
- `FRONTEND_HOST_SHELL`
- `FRONTEND_HOST_AUTH`
- `FRONTEND_HOST_WORKSPACE`
- `FRONTEND_HOST_BUILDER`
- `VITE_API_BASE_URL`
- `FRONTEND_WORKSPACE_USE_MOCKS`

Required environment secrets:
- `DEPLOY_VM_HOST`
- `DEPLOY_VM_USER`
- `DEPLOY_VM_SSH_PRIVATE_KEY`

Optional environment variables:
- `DEPLOY_BFF_PROXY_TARGET`
- `DEPLOY_VM_PORT`

Repo-owned stable deploy constants:
- app root: `/opt/sitionix/app/frontend`
- runtime root: `/opt/sitionix/runtime/frontend`
- backup root: `/opt/sitionix/backups/frontend`
- nginx site path: `/etc/nginx/sites-available/sitionix-frontend-<env>.conf`
- nginx site link path: `/etc/nginx/sites-enabled/sitionix-frontend-<env>.conf`
- certificate paths: `/etc/letsencrypt/live/<host>/fullchain.pem` and `/etc/letsencrypt/live/<host>/privkey.pem`
- default BFF upstream: `http://127.0.0.1:8080`

## VM layout
- Active static roots:
  - `/opt/sitionix/app/frontend/current/shell`
  - `/opt/sitionix/app/frontend/current/auth`
  - `/opt/sitionix/app/frontend/current/workspace`
  - `/opt/sitionix/app/frontend/current/builder`
- Release history:
  - `/opt/sitionix/runtime/frontend/releases/<release-id>`
- Release backups and manifests:
  - `/opt/sitionix/backups/frontend/releases/<release-id>`

Detailed flow, Nginx behaviour and verification checklist are documented in [`docs/frontend-dev-deploy.md`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/docs/frontend-dev-deploy.md).
