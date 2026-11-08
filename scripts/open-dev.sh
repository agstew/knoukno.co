#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
PORT=3000
if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
  echo "Kno U Kn is already running on http://localhost:$PORT"
  open "http://localhost:$PORT"
  exit 0
fi

nohup npm run dev > .dev-server.log 2>&1 &
for i in $(seq 1 30); do
  if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
    echo "Kno U Kn is running on http://localhost:$PORT"
    open "http://localhost:$PORT"
    exit 0
  fi
  sleep 1
done

echo "Kno U Kn did not become ready on http://localhost:$PORT"
exit 1
