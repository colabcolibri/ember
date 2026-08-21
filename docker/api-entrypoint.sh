#!/bin/sh
set -eu

if [ -n "${EMBER_BOOTSTRAP_ADMIN_EMAIL:-${EMBER_BOOTSTRAP_FACILITATOR_EMAIL:-}}" ] && [ "${EMBER_EMAIL_PROVIDER:-noop}" = "noop" ]; then
  echo "[api] erro: EMBER_BOOTSTRAP_ADMIN_EMAIL definido mas EMBER_EMAIL_PROVIDER=noop — email desabilitado." >&2
  echo "[api] configure EMBER_EMAIL_PROVIDER=smtp ou resend antes do primeiro acesso." >&2
  exit 1
fi

node ./node_modules/@ember/db/dist/migrate-cli.js
exec node dist/index.js
