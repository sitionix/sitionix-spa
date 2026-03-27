# sitionix-spa

## Local development
- `pnpm dev`
- Shell runs on `https://localhost:3000`
- Remotes run on:
  - `https://localhost:3001`
  - `https://localhost:3002`
  - `https://localhost:3003`
- Local shell remote origins are configured from [`apps/shell/.env`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/apps/shell/.env)

## Dev deployment pipeline
The dev cloud deployment is config-driven from:
- [`deploy/frontend/config/applications.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/config/applications.json)
- [`deploy/frontend/config/deployment-command.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/config/deployment-command.json)
- [`deploy/frontend/environments/dev.json`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/environments/dev.json)

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

The deployed runtime does not use `vite preview`. GitHub Actions builds static assets, uploads a release payload to the VM, updates `/opt/sitionix/app/frontend/current/*`, renders the Nginx site config, runs `nginx -t`, and reloads Nginx only after validation passes.

## GitHub Actions usage
Trigger dispatcher: [`frontend-deploy-dispatch.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-dispatch.yml)

Reusable execution workflow: [`frontend-deploy-execute.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-execute.yml)

Supported triggers:
- `push`
  Branch-to-environment mapping comes from environment profiles. Today `develop -> dev`.
- `workflow_dispatch`
  Inputs:
  - `deploy_env`
  - `application`
- PR comment deploy
  Example:
  ```text
  /deploy --name "Workspace SPA" --env dev
  ```

The dispatcher resolves a normalized deployment plan from config and then calls the reusable execution workflow. That keeps future wrappers for issues, scheduled deploys, or other entrypoints thin. The `/deploy` command prefix, allowed application names, environment ids, hostnames, VM paths and SSL certificate paths are all read from deployment config. Nothing in the workflow hardcodes app names or frontend hosts.

## Required GitHub environment secrets
Create a GitHub Environment named `dev` and provide:
- `DEPLOY_VM_HOST`
- `DEPLOY_VM_USER`
- `DEPLOY_VM_SSH_PRIVATE_KEY`

Optional environment variable:
- `DEPLOY_VM_PORT`

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
