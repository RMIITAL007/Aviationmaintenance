#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=== Starting Maintenance Copilot Backend ==="
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Initializing .venv..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

export PYTHONPATH="$DIR/backend"
cd "$DIR/backend"
echo "Launching FastAPI on http://localhost:8000 (Docs: http://localhost:8000/docs)"
exec "$DIR/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload
