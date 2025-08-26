#!/usr/bin/env bash
set -euo pipefail

# Simple setup script for the Airbnb project.
# Responsibilities:
# 1. Install backend & frontend dependencies
# 2. Optionally start ngrok and export a PUBLIC_TUNNEL_URL for callback usage
# 3. Generate .env files if missing with sensible defaults
# 4. Start API and Client (concurrently) or print commands

API_DIR="api"
CLIENT_DIR="client"
PORT_API=${PORT_API:-4000}
PORT_CLIENT=${PORT_CLIENT:-5173}

print_header() { echo -e "\n==== $1 ====\n"; }

create_env_file() {
  local file=$1
  local content=$2
  if [[ ! -f "$file" ]]; then
    print_header "Creating $file"
    echo "$content" > "$file"
  fi
}

# 1. Ensure .env files
create_env_file "$API_DIR/.env" "PORT=$PORT_API
CLIENT_URL=http://localhost:$PORT_CLIENT
COOKIE_TIME=${COOKIE_TIME:-7}
SESSION_SECRET=${SESSION_SECRET:-changeme_session_secret}
JWT_SECRET=${JWT_SECRET:-changeme_jwt_secret}
JWT_EXPIRES_TIME=${JWT_EXPIRES_TIME:-20d}
DB_URL=${DB_URL:-mongodb://localhost:27017/airbnb_db}
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-your_cloud_name}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY:-your_key}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET:-your_secret}
ZALOPAY_APP_ID=${ZALOPAY_APP_ID:-2554}
ZALOPAY_KEY1=${ZALOPAY_KEY1:-sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn}
ZALOPAY_KEY2=${ZALOPAY_KEY2:-trMrHtvjo6myautxDUiAcYsVtaeQ8nhf}
ZALOPAY_ENDPOINT=${ZALOPAY_ENDPOINT:-https://sb-openapi.zalopay.vn/v2/create}
"

create_env_file "$CLIENT_DIR/.env" "VITE_API_URL=http://localhost:$PORT_API
"

print_header "Installing dependencies (API)"
(cd "$API_DIR" && npm install)

print_header "Installing dependencies (Client)"
# Clean install to ensure optional dependencies like @esbuild/linux-x64 are properly installed
(cd "$CLIENT_DIR" && rm -rf node_modules && npm install --legacy-peer-deps)

# 2. Start ngrok if available
if command -v ngrok >/dev/null 2>&1; then
  print_header "Starting ngrok tunnel for API port $PORT_API"
  if [[ -n "${NGROK_AUTHTOKEN:-}" ]]; then
    ngrok config add-authtoken "${NGROK_AUTHTOKEN}" >/dev/null 2>&1 || true

  fi
  # Run ngrok in background
  ngrok http $PORT_API --log=stdout > ngrok.log 2>&1 &
  NGROK_PID=$!
  # Wait for public_url to appear
  print_header "Waiting for ngrok public URL"
  for i in {1..20}; do
    if grep -q "started tunnel" ngrok.log; then
      break
    fi
    sleep 1
  done
  # Extract https URL from Forwarding line
  PUBLIC_URL=$(grep -Eo 'https://[a-zA-Z0-9.-]+\.ngrok-free\.app' ngrok.log | head -n1 || true)
  if [[ -n "$PUBLIC_URL" ]]; then
    echo "Discovered public tunnel: $PUBLIC_URL"
    # Append / update API .env
    if ! grep -q '^PUBLIC_TUNNEL_URL=' "$API_DIR/.env"; then
      echo "PUBLIC_TUNNEL_URL=$PUBLIC_URL" >> "$API_DIR/.env"
    else
      sed -i "s#^PUBLIC_TUNNEL_URL=.*#PUBLIC_TUNNEL_URL=$PUBLIC_URL#" "$API_DIR/.env"
    fi
    if ! grep -q '^ZALOPAY_CALLBACK_URL=' "$API_DIR/.env"; then
      echo "ZALOPAY_CALLBACK_URL=$PUBLIC_URL/payments/zalopay/callback" >> "$API_DIR/.env"
    else
      sed -i "s#^ZALOPAY_CALLBACK_URL=.*#ZALOPAY_CALLBACK_URL=$PUBLIC_URL/payments/zalopay/callback#" "$API_DIR/.env"
    fi
  else
    echo "Could not determine ngrok public URL yet. Check ngrok.log"
  fi
else
  echo "ngrok not found in PATH. Skipping tunnel setup."
fi

print_header "Starting API server"
(cd "$API_DIR" && npm start) &
API_PID=$!

print_header "Starting Client dev server"
(cd "$CLIENT_DIR" && npm run dev) &
CLIENT_PID=$!

print_header "All services started"
echo "API PID: $API_PID"
echo "Client PID: $CLIENT_PID"
echo "Tail the ngrok log with: tail -f ngrok.log"

echo "Press Ctrl+C to stop all."
trap 'echo Stopping...; kill $API_PID $CLIENT_PID ${NGROK_PID:-} 2>/dev/null || true; exit 0' INT TERM
wait
