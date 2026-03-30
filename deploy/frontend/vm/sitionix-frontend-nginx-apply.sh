#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 4 ]]; then
  echo "Usage: sitionix-frontend-nginx-apply.sh <nginx-source> <site-path> <site-link-path> <backup-path>" >&2
  exit 1
fi

nginx_source="$1"
site_path="$2"
site_link_path="$3"
backup_path="$4"

assert_absolute_path() {
  local path_value="$1"
  local allowed_prefix="$2"

  if [[ "${path_value}" != "${allowed_prefix}"* ]]; then
    echo "Path ${path_value} must stay under ${allowed_prefix}" >&2
    exit 1
  fi
}

assert_absolute_path "${site_path}" "/etc/nginx/"
assert_absolute_path "${site_link_path}" "/etc/nginx/"
assert_absolute_path "${backup_path}" "/opt/sitionix/backups/frontend/"

if [[ ! -f "${nginx_source}" ]]; then
  echo "Rendered nginx config is missing: ${nginx_source}" >&2
  exit 1
fi

mkdir -p "$(dirname "${backup_path}")"

previous_site_exists=0
if [[ -f "${site_path}" ]]; then
  cp "${site_path}" "${backup_path}"
  previous_site_exists=1
else
  rm -f "${backup_path}"
fi

restore_previous_state() {
  if (( previous_site_exists )); then
    cp "${backup_path}" "${site_path}"
    ln -sfn "${site_path}" "${site_link_path}"
    return
  fi

  rm -f "${site_path}" "${site_link_path}"
}

install -m 0644 "${nginx_source}" "${site_path}"
ln -sfn "${site_path}" "${site_link_path}"

if ! nginx -t; then
  restore_previous_state
  exit 1
fi

systemctl reload nginx
