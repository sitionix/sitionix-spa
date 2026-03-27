#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
payload_dir="$(cd "${script_dir}/.." && pwd)"

# shellcheck source=/dev/null
source "${payload_dir}/release.env"

run_privileged() {
  if [[ -n "${SITIONIX_SUDO_COMMAND}" ]]; then
    "${SITIONIX_SUDO_COMMAND}" "$@"
    return
  fi
  "$@"
}

assert_absolute_path() {
  local path_value="$1"
  local allowed_prefix="$2"

  if [[ "${path_value}" != "${allowed_prefix}"* ]]; then
    echo "Path ${path_value} must stay under ${allowed_prefix}" >&2
    exit 1
  fi
}

assert_absolute_path "${SITIONIX_APP_ROOT}" "/opt/sitionix/"
assert_absolute_path "${SITIONIX_RUNTIME_ROOT}" "/opt/sitionix/"
assert_absolute_path "${SITIONIX_BACKUP_ROOT}" "/opt/sitionix/"
assert_absolute_path "${SITIONIX_NGINX_SITE_PATH}" "/etc/nginx/"
assert_absolute_path "${SITIONIX_NGINX_SITE_LINK_PATH}" "/etc/nginx/"

release_root="${SITIONIX_RUNTIME_ROOT}/releases/${SITIONIX_RELEASE_ID}"
backup_root="${SITIONIX_BACKUP_ROOT}/releases/${SITIONIX_RELEASE_ID}"
current_root="${SITIONIX_APP_ROOT}/current"

mkdir -p "${release_root}" "${backup_root}" "${current_root}"

IFS=',' read -r -a selected_apps <<< "${SITIONIX_SELECTED_APPS}"
IFS=',' read -r -a remote_entry_apps <<< "${SITIONIX_REMOTE_ENTRY_APPS}"

has_remote_entry_expectation() {
  local candidate="$1"
  for app in "${remote_entry_apps[@]}"; do
    if [[ "${app}" == "${candidate}" ]]; then
      return 0
    fi
  done
  return 1
}

for app in "${selected_apps[@]}"; do
  source_dir="${payload_dir}/apps/${app}"
  target_dir="${release_root}/${app}"

  if [[ ! -d "${source_dir}" ]]; then
    echo "Missing unpacked artifact directory for ${app}: ${source_dir}" >&2
    exit 1
  fi

  mkdir -p "${target_dir}"
  cp -R "${source_dir}/." "${target_dir}/"

  if [[ ! -f "${target_dir}/index.html" ]]; then
    echo "Missing index.html for ${app} at ${target_dir}" >&2
    exit 1
  fi

  if has_remote_entry_expectation "${app}"; then
    if [[ ! -f "${target_dir}/remoteEntry.js" && ! -f "${target_dir}/assets/remoteEntry.js" ]]; then
      echo "Missing remoteEntry.js for ${app} at ${target_dir}" >&2
      exit 1
    fi
  fi
done

cp "${payload_dir}/release-manifest.json" "${backup_root}/release-manifest.json"

nginx_source="${payload_dir}/nginx/sitionix-frontend.conf"
if [[ ! -f "${nginx_source}" ]]; then
  echo "Rendered nginx config is missing: ${nginx_source}" >&2
  exit 1
fi

nginx_backup="${backup_root}/sitionix-frontend.conf.previous"
if run_privileged test -f "${SITIONIX_NGINX_SITE_PATH}"; then
  run_privileged cp "${SITIONIX_NGINX_SITE_PATH}" "${nginx_backup}"
fi

declare -A previous_targets
for app in "${selected_apps[@]}"; do
  current_link="${current_root}/${app}"
  if [[ -L "${current_link}" ]]; then
    previous_targets["${app}"]="$(readlink "${current_link}")"
  else
    previous_targets["${app}"]=""
  fi
done

restore_previous_state() {
  if [[ -f "${nginx_backup}" ]]; then
    run_privileged cp "${nginx_backup}" "${SITIONIX_NGINX_SITE_PATH}"
  else
    run_privileged rm -f "${SITIONIX_NGINX_SITE_PATH}"
  fi

  for app in "${selected_apps[@]}"; do
    current_link="${current_root}/${app}"
    previous_target="${previous_targets[${app}]}"
    if [[ -n "${previous_target}" ]]; then
      ln -sfn "${previous_target}" "${current_link}"
    else
      rm -f "${current_link}"
    fi
  done
}

run_privileged install -m 0644 "${nginx_source}" "${SITIONIX_NGINX_SITE_PATH}"
run_privileged ln -sfn "${SITIONIX_NGINX_SITE_PATH}" "${SITIONIX_NGINX_SITE_LINK_PATH}"

for app in "${selected_apps[@]}"; do
  current_link="${current_root}/${app}"
  next_link="${current_link}.next"
  ln -sfn "${release_root}/${app}" "${next_link}"
  mv -f "${next_link}" "${current_link}"
done

if ! run_privileged nginx -t; then
  restore_previous_state
  exit 1
fi

run_privileged systemctl reload nginx

for app in "${selected_apps[@]}"; do
  current_link="${current_root}/${app}"
  if [[ ! -L "${current_link}" ]]; then
    echo "Current symlink is missing for ${app}" >&2
    exit 1
  fi
done
