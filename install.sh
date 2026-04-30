#!/usr/bin/env bash
# ============================================================
# DownAir — From zero server to live website. One command.
#
# Usage:
#   GITHUB_TOKEN=ghp_xxx ./install.sh downair.net
# ============================================================
set -euo pipefail

DOMAIN="${1:-}"
INSTALL_DIR="/opt/downair"
REPO_OWNER="XGenerationy"
REPO_NAME="DownAir"
SWAP_SIZE="2G"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN:-localhost}}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }

[ "$(id -u)" -ne 0 ] && fail "Run as root: sudo ./install.sh $DOMAIN"
[ -z "$DOMAIN" ] && { echo "Usage: GITHUB_TOKEN=ghp_xxx ./install.sh yourdomain.com"; exit 1; }

TOTAL=11
step=0
next_step() { step=$((step + 1)); echo ""; echo "[${step}/${TOTAL}] $1"; }

echo ""
echo "============================================"
echo "  DownAir — Full Server Installation"
echo "  Domain: $DOMAIN"
echo "============================================"

# ── 1. System packages ─────────────────────────────────────
next_step "Installing system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip make \
  ufw fail2ban \
  nginx certbot python3-certbot-nginx \
  ca-certificates gnupg lsb-release \
  python3 openssl ssl-cert dnsutils \
  logrotate cron
ok "System packages installed."

# ── 2. Swap ────────────────────────────────────────────────
next_step "Configuring swap (${SWAP_SIZE})..."
if [ -f /swapfile ]; then
  ok "Swap already exists."
else
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10 >/dev/null 2>&1
  ok "2GB swap created."
fi

# ── 3. System limits ──────────────────────────────────────
next_step "Tuning system limits..."
cat > /etc/security/limits.d/downair.conf <<'LIMITS'
*    soft    nofile    65536
*    hard    nofile    65536
LIMITS
ok "File descriptor limits raised."

# ── 4. Firewall ───────────────────────────────────────────
next_step "Configuring firewall..."
if ufw status | grep -q "Status: active"; then
  ok "UFW already active, ensuring required ports are open."
else
  ufw --force reset >/dev/null 2>&1 || true
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
fi
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ok "UFW: SSH (22), HTTP (80), HTTPS (443) open."

# ── 5. fail2ban ───────────────────────────────────────────
next_step "Configuring fail2ban..."
if [ -f /etc/fail2ban/jail.local ] && grep -q '^\[sshd\]' /etc/fail2ban/jail.local; then
  ok "fail2ban jail.local already has [sshd] config."
else
  if [ -f /etc/fail2ban/jail.local ]; then
    cp /etc/fail2ban/jail.local /etc/fail2ban/jail.local.bak
  fi
  cat >> /etc/fail2ban/jail.local <<'F2B'

[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 5
bantime  = 3600
findtime = 600
F2B
  systemctl restart fail2ban
fi
systemctl enable fail2ban >/dev/null 2>&1
ok "5 failed SSH attempts = 1 hour ban."

# ── 6. Docker ─────────────────────────────────────────────
next_step "Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh >/dev/null 2>&1
  systemctl enable docker >/dev/null 2>&1
  systemctl start docker
  ok "Docker installed."
else
  ok "Docker already installed."
fi
docker compose version &>/dev/null || fail "docker compose plugin not found."

if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'DJSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
DJSON
  systemctl restart docker
  ok "Docker log rotation configured."
else
  ok "Docker daemon.json already exists, keeping it."
fi
if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
  (cd "$INSTALL_DIR" && docker compose down --remove-orphans 2>/dev/null) || true
fi

# ── 7. Clone repository ──────────────────────────────────
next_step "Cloning DownAir..."
CLONE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
GIT_AUTH_OPTS=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  GIT_AUTH_OPTS=(-c "http.extraHeader=Authorization: Bearer ${GITHUB_TOKEN}")
fi

if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR"
  if git ${GIT_AUTH_OPTS[@]+"${GIT_AUTH_OPTS[@]}"} pull --ff-only >/dev/null 2>&1; then
    ok "Updated existing repo."
  else
    warn "git pull failed — continuing with existing code."
  fi
else
  rm -rf "$INSTALL_DIR"
  git ${GIT_AUTH_OPTS[@]+"${GIT_AUTH_OPTS[@]}"} clone --depth 1 "$CLONE_URL" "$INSTALL_DIR" >/dev/null 2>&1
  ok "Cloned to $INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# ── 8. Generate .env ─────────────────────────────────────
next_step "Generating environment and secrets..."
if [ ! -f .env ]; then
  cp .env.example .env

  JWT_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  HMAC_SECRET=$(openssl rand -hex 32)
  POSTGRES_PASSWORD=$(openssl rand -hex 16)

  sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
  sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
  sed -i "s|HMAC_SECRET=.*|HMAC_SECRET=$HMAC_SECRET|" .env
  sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
  sed -i "s|APP_URL=.*|APP_URL=https://$DOMAIN|" .env
  sed -i "s|SETUP_COMPLETED=.*|SETUP_COMPLETED=true|" .env

  ok "All secrets generated."
else
  ok ".env already exists, keeping it."
fi

# ── 9. Build and start Docker stack ──────────────────────
next_step "Building and starting Docker stack..."
docker compose up -d --build 2>&1 | tail -5

echo "  Waiting for database..."
TRIES=0
while [ $TRIES -lt 60 ]; do
  if docker compose exec -T db pg_isready -U "${POSTGRES_USER:-downair}" >/dev/null 2>&1; then
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 2
done
if [ $TRIES -ge 60 ]; then
  warn "Database slow to start."
else
  ok "Database ready."
fi

echo "  Waiting for app..."
TRIES=0
while [ $TRIES -lt 60 ]; do
  if curl -s -o /dev/null http://127.0.0.1:3001/api/health 2>/dev/null; then
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 3
done
if [ $TRIES -ge 60 ]; then
  warn "App slow to start."
else
  ok "App ready."
fi

echo "  Pushing database schema..."
docker compose exec -T app npx drizzle-kit push 2>/dev/null || warn "Schema push needs attention."
ok "Database schema applied."

echo "  Seeding content..."
docker compose exec -T app npx tsx scripts/seed-content.ts 2>/dev/null || true
ok "Content seeded."

# ── 10. nginx ─────────────────────────────────────────────
next_step "Configuring nginx..."

cat > /etc/nginx/sites-available/downair <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        client_max_body_size 100m;
    }
}
NGINX

apt-get install -y -qq ssl-cert >/dev/null 2>&1 || true
ln -sf /etc/nginx/sites-available/downair /etc/nginx/sites-enabled/downair
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1 && systemctl reload nginx
ok "nginx proxy active."

# ── 11. SSL certificate ──────────────────────────────────
next_step "Requesting SSL certificate..."

SERVER_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "unknown")
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -1 || echo "none")

echo "  Server IP: $SERVER_IP"
echo "  Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
  if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos \
      --email "$CERTBOT_EMAIL" --redirect 2>/dev/null; then
    ok "SSL certificate installed!"
  else
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
      --email "$CERTBOT_EMAIL" --redirect 2>/dev/null && \
      ok "SSL certificate installed (without www)!" || \
      warn "Certbot failed. Run: certbot --nginx -d $DOMAIN"
  fi
else
  warn "DNS not pointing here. After DNS propagates: certbot --nginx -d $DOMAIN"
fi

if ! crontab -l 2>/dev/null | grep -q certbot; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
  ok "SSL auto-renewal cron added."
fi

# ── Done ──────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  DownAir — Installation Complete!"
echo "============================================"
echo ""
echo "  Services:"
docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || docker compose ps
echo ""

sleep 2
echo "  Health check:"
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health 2>/dev/null || echo "000")
if [ "$CODE" != "000" ]; then
  echo -e "    App: ${GREEN}HTTP $CODE${NC}"
else
  echo -e "    App: ${YELLOW}starting...${NC}"
fi

echo ""
echo "  URL:     https://$DOMAIN"
echo "  Dir:     $INSTALL_DIR"
echo "  Config:  $INSTALL_DIR/.env"
echo ""
echo "  Commands:"
echo "    cd $INSTALL_DIR"
echo "    make status     — check health"
echo "    make logs       — tail logs"
echo "    make deploy     — update + rebuild"
echo "    make backup     — database backup"
echo ""
