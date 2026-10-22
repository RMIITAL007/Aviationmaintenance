#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/frontend"

echo "=== Starting Maintenance Copilot Frontend ==="
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Launching Vite dev server on http://localhost:5173"
exec npm run dev
