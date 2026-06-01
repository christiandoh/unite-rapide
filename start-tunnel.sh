#!/bin/bash
# Start Cloudflare Tunnel and capture URL
LOG_FILE="/home/nundo/unite-rapide/tunnel-url.txt"
TEMP_FILE="/tmp/tunnel_output.txt"

# Start tunnel, capture output
/usr/bin/cloudflared tunnel --url http://localhost:80 2>&1 | tee "$TEMP_FILE" | while read line; do
  # Extract URL from log line
  url=$(echo "$line" | grep -oP 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | head -1)
  if [ -n "$url" ]; then
    echo "$url" > "$LOG_FILE"
    echo "[$(date)] Tunnel URL: $url" >> /home/nundo/unite-rapide/tunnel.log
  fi
  echo "$line"
done
