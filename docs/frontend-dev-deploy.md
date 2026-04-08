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
- stable VM/deploy path constants
- deterministic Nginx site path derivation
- deterministic certificate path derivation

GitHub Environment `dev` controls:
- public hostnames
- build-time public env values
- optional BFF upstream override
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
Local-only Vite dev server settings such as `VITE_HOST` and localhost proxy targets remain local-dev concerns and are not part of the cloud deploy contract.

## Workflow flow
Push workflow: [`frontend-deploy-on-push.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-on-push.yml)

PR comment workflow: [`frontend-deploy-on-comment.yml`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/workflows/frontend-deploy-on-comment.yml)

Shared composite action: [`frontend-deploy-run`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/.github/actions/frontend-deploy-run/action.yml)

1. Resolve target environment and selected app(s) from deployment config.
2. Checkout the correct ref.
   For PR comment deploy this is the PR head SHA.
3. Start a real `deploy` job bound directly to the selected GitHub Environment.
4. Materialize the full deployment plan from GitHub Environment vars/secrets plus repo metadata.
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

This split keeps trigger-specific workflows small while keeping the environment-bound secret access on a normal job instead of a reusable workflow boundary.
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
The environment-bound deploy job expects the selected GitHub Environment to provide:

Non-secret variables:
- `FRONTEND_HOST_SHELL`
- `FRONTEND_HOST_AUTH`
- `FRONTEND_HOST_WORKSPACE`
- `FRONTEND_HOST_BUILDER`
- `VITE_API_BASE_URL`

Secrets:
- `DEPLOY_VM_HOST`
- `DEPLOY_VM_USER`
- `DEPLOY_VM_SSH_PRIVATE_KEY`

Optional variables:
- `DEPLOY_BFF_PROXY_TARGET`
- `DEPLOY_VM_PORT`

Repo-owned stable deploy constants:
- app root: `/opt/sitionix/app/frontend`
- runtime root: `/opt/sitionix/runtime/frontend`
- backup root: `/opt/sitionix/backups/frontend`
- nginx helper path: `/usr/local/sbin/sitionix-frontend-nginx-apply`
- nginx site path: `/etc/nginx/sites-available/sitionix-frontend-<env>.conf`
- nginx site link path: `/etc/nginx/sites-enabled/sitionix-frontend-<env>.conf`
- dev certificate lineage name: `app.dev.sitionix.com`
- dev certificate paths: `/etc/letsencrypt/live/app.dev.sitionix.com/fullchain.pem` and `/etc/letsencrypt/live/app.dev.sitionix.com/privkey.pem`
- default BFF upstream: `http://127.0.0.1:8080`

## Nginx shape
Rendered from the deployment plan by [`scripts/frontend-deploy/lib/nginx.mjs`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/scripts/frontend-deploy/lib/nginx.mjs)

Current behaviour:
- each hostname has its own HTTPS server block
- each hostname also redirects HTTP to HTTPS
- all dev frontend hosts share the single `app.dev.sitionix.com` Let's Encrypt lineage
- shell serves SPA static files and proxies `/bffssox/`
- auth/workspace/builder serve static files with SPA fallback
- auth/workspace/builder add CORS only for `remoteEntry.js` and `/assets/*`

Certificate contract:
- the environment profile owns the TLS lineage name via `tlsCertificateLineage`
- Nginx cert/key paths are derived once from that lineage, not from each frontend host
- for `dev`, `app.dev.sitionix.com`, `auth.dev.sitionix.com`, `workspace.dev.sitionix.com`, and `builder.dev.sitionix.com` all use `/etc/letsencrypt/live/app.dev.sitionix.com/{fullchain,privkey}.pem`

## VM deploy script
Script: [`deploy/frontend/vm/deploy-frontend.sh`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/vm/deploy-frontend.sh)

What it does:
- validates destination paths
- stages each selected app under `/opt/sitionix/runtime/frontend/releases/<release-id>`
- keeps the previous symlink target for rollback
- switches active app symlinks under `/opt/sitionix/app/frontend/current`
- invokes a root-owned Nginx helper for config install, validation and reload
- restores previous app symlinks if the privileged Nginx step fails

Current privilege boundary:
- `sitionixvv` owns and writes `/opt/sitionix/app/frontend`, `/opt/sitionix/runtime/frontend` and `/opt/sitionix/backups/frontend`
- only the Nginx helper runs through `sudo`
- application artifacts and active frontend symlinks stay user-owned
- the deploy script's only privileged call is `sudo /usr/local/sbin/sitionix-frontend-nginx-apply /tmp/<release-id>/nginx/sitionix-frontend.conf /etc/nginx/sites-available/sitionix-frontend-<env>.conf /etc/nginx/sites-enabled/sitionix-frontend-<env>.conf /opt/sitionix/backups/frontend/releases/<release-id>/sitionix-frontend.conf.previous`

Remaining privileged operations inside the helper:
- `install -m 0644 <rendered-config> <site-path>` because `/etc/nginx/sites-available` is root-owned
- `ln -sfn <site-path> <site-link-path>` because `/etc/nginx/sites-enabled` is root-owned
- `nginx -t` because Nginx config validation needs root-level access to the live config tree and certificates
- `systemctl reload nginx` because reloading the system service requires root
- `cp` or `rm` only for rollback of the live Nginx config under `/etc/nginx`

## VM sudoers setup
Copy the versioned helper from [`deploy/frontend/vm/sitionix-frontend-nginx-apply.sh`](/Users/vladvinskevitch/Documents/Java/sitionix/sitionix-spa/deploy/frontend/vm/sitionix-frontend-nginx-apply.sh) to the VM, then install it as root:

```bash
scp deploy/frontend/vm/sitionix-frontend-nginx-apply.sh sitionixvv@<vm>:/tmp/sitionix-frontend-nginx-apply.sh
sudo install -o root -g root -m 0755 /tmp/sitionix-frontend-nginx-apply.sh /usr/local/sbin/sitionix-frontend-nginx-apply
stat -c '%U %G %a' /usr/local/sbin/sitionix-frontend-nginx-apply
test ! -w /usr/local/sbin/sitionix-frontend-nginx-apply
```

The checks above should report `root root 755` and confirm that `sitionixvv` cannot write the helper.

Then create `/etc/sudoers.d/sitionix-frontend-deploy` with `visudo -f /etc/sudoers.d/sitionix-frontend-deploy` and add only this rule:

```sudoers
Cmnd_Alias SITIONIX_FRONTEND_NGINX_APPLY = /usr/local/sbin/sitionix-frontend-nginx-apply /tmp/*/nginx/sitionix-frontend.conf /etc/nginx/sites-available/sitionix-frontend-*.conf /etc/nginx/sites-enabled/sitionix-frontend-*.conf /opt/sitionix/backups/frontend/releases/*/sitionix-frontend.conf.previous
sitionixvv ALL=(root) NOPASSWD: SITIONIX_FRONTEND_NGINX_APPLY
```

VM ownership prerequisite:

```bash
sudo mkdir -p /opt/sitionix/app/frontend/current /opt/sitionix/runtime/frontend/releases /opt/sitionix/backups/frontend/releases
sudo chown -R sitionixvv:sitionixvv /opt/sitionix/app/frontend /opt/sitionix/runtime/frontend /opt/sitionix/backups/frontend
```

This keeps `NOPASSWD` scoped to one root-owned helper instead of granting `sudo` for generic filesystem or service commands.

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
