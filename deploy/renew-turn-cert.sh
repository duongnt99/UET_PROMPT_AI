#!/usr/bin/env bash
set -euo pipefail

source_dir=/etc/letsencrypt/live/ai-arena-vietnam.uet.edu.vn
target_dir=/etc/coturn/certs

install -d -o turnserver -g turnserver -m 0750 "$target_dir"
install -o turnserver -g turnserver -m 0640 -D "$source_dir/fullchain.pem" "$target_dir/fullchain.pem"
install -o turnserver -g turnserver -m 0640 -D "$source_dir/privkey.pem" "$target_dir/privkey.pem"
systemctl restart coturn
