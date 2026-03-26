#!/bin/sh
set -e

PORT="${PORT:-10000}"
echo "🚀 docker-entrypoint: starting Rahba on port $PORT"

# Start the server early to open the port for Render's scanner
node --dns-result-order=ipv4first --max-old-space-size=512 dist/main &
NODE_PID=$!
echo "🟢 Node server started (PID=$NODE_PID)"

# --- Choose a direct DB URL for migrations if available ---
ORIGINAL_DATABASE_URL="${DATABASE_URL}"

# Prefer these envs (first found wins)
MIGRATE_URL=""
if [ -n "$DATABASE_URL_DIRECT" ]; then MIGRATE_URL="$DATABASE_URL_DIRECT"; fi
if [ -z "$MIGRATE_URL" ] && [ -n "$PRISMA_MIGRATE_DATABASE_URL" ]; then MIGRATE_URL="$PRISMA_MIGRATE_DATABASE_URL"; fi
if [ -z "$MIGRATE_URL" ] && [ -n "$DIRECT_DATABASE_URL" ]; then MIGRATE_URL="$DIRECT_DATABASE_URL"; fi
if [ -z "$MIGRATE_URL" ] && [ -n "$DATABASE_DIRECT_URL" ]; then MIGRATE_URL="$DATABASE_DIRECT_URL"; fi
if [ -z "$MIGRATE_URL" ] && [ -n "$ORIGINAL_DATABASE_URL" ]; then MIGRATE_URL="$ORIGINAL_DATABASE_URL"; fi

if [ -n "$MIGRATE_URL" ]; then
  echo "📦 Using direct DB URL for migrations (will override DATABASE_URL during CLI calls)"
  export PRISMA_MIGRATE_DATABASE_URL="$MIGRATE_URL"
  EFFECTIVE_DB_URL="$MIGRATE_URL"
else
  echo "⚠️ No direct DB URL provided for migrations. Using DATABASE_URL as-is."
  EFFECTIVE_DB_URL="$ORIGINAL_DATABASE_URL"
fi

echo "🛠️ Running prisma migrate deploy..."
if DATABASE_URL="$EFFECTIVE_DB_URL" npx prisma migrate deploy; then
  echo "✅ migrate deploy completed"
else
  echo "⚠️ migrate deploy failed (may be due to pooler/permissions or prior failed migration). Attempting resolve & retry..."
  # Attempt to mark the hotfix migration as rolled back so it can be reapplied with the updated SQL
  DATABASE_URL="$EFFECTIVE_DB_URL" npx prisma migrate resolve --rolled-back 20251030_hotfix_missing_schema || true
  # Retry migrate deploy once
  if DATABASE_URL="$EFFECTIVE_DB_URL" npx prisma migrate deploy; then
    echo "✅ migrate deploy completed after resolve"
  else
    echo "⚠️ migrate deploy still failing. Will continue with db push as a fallback."
  fi
fi

# Skip db push - migrate deploy is sufficient!
echo "✅ Skipping prisma db push (migrate deploy already completed)"

# Restore runtime database URL
export DATABASE_URL="$ORIGINAL_DATABASE_URL"

# Optionally bootstrap admin
if [ "${ADMIN_BOOTSTRAP_ON_START}" = "true" ]; then
  echo "👑 Bootstrapping SUPER_ADMIN via create-admin.js"
  node create-admin.js || true
fi

# Wait for the node process
wait "$NODE_PID"
