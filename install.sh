#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_banner() {
  echo ""
  echo -e "${CYAN}  ____                    _ _    _ _ "
  echo -e " |  _ \\ _   _ _ __  _ __ (_) | _(_) |"
  echo -e " | | | | | | | '_ \\| '_ \\| |/ /| | |"
  echo -e " | |_| | |_| | | | | | | |   < | | |"
  echo -e " |____/ \\__,_|_| |_|_| |_|_|\\_\\|_|_|${NC}"
  echo ""
  echo -e "${GREEN}  Social Media Video & Audio Downloader${NC}"
  echo -e "  ${YELLOW}Installation Script v1.0${NC}"
  echo ""
}

print_step() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ▶ $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_ok() {
  echo -e "  ${GREEN}✓${NC} $1"
}

print_warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
}

print_err() {
  echo -e "  ${RED}✗${NC} $1"
}

command_exists() {
  command -v "$1" &>/dev/null
}

print_banner

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ──────────────────────────────────────────────
# 1. DETECT OS
# ──────────────────────────────────────────────
print_step "Detecting Operating System"

OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Linux*)  OS_TYPE="linux" ;;
  Darwin*) OS_TYPE="macos" ;;
  *)       OS_TYPE="unknown" ;;
esac

print_ok "OS: $OS ($ARCH)"

if [ "$OS_TYPE" = "unknown" ]; then
  print_err "Unsupported operating system: $OS"
  exit 1
fi

# ──────────────────────────────────────────────
# 2. CHECK / INSTALL SYSTEM DEPENDENCIES
# ──────────────────────────────────────────────
print_step "Checking System Dependencies"

if [ "$OS_TYPE" = "macos" ]; then
  if ! command_exists brew; then
    print_warn "Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  print_ok "Homebrew ready"
  PKG_MANAGER="brew"
elif [ "$OS_TYPE" = "linux" ]; then
  if command_exists apt-get; then
    PKG_MANAGER="apt"
  elif command_exists yum; then
    PKG_MANAGER="yum"
  elif command_exists dnf; then
    PKG_MANAGER="dnf"
  elif command_exists pacman; then
    PKG_MANAGER="pacman"
  else
    print_err "No supported package manager found"
    exit 1
  fi
  print_ok "Package manager: $PKG_MANAGER"
fi

# Install basic build tools
if [ "$OS_TYPE" = "macos" ]; then
  brew install -q curl wget git 2>/dev/null || true
elif [ "$PKG_MANAGER" = "apt" ]; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq curl wget git build-essential 2>/dev/null || true
elif [ "$PKG_MANAGER" = "yum" ]; then
  sudo yum install -y -q curl wget git gcc gcc-c++ make 2>/dev/null || true
elif [ "$PKG_MANAGER" = "dnf" ]; then
  sudo dnf install -y -q curl wget git gcc gcc-c++ make 2>/dev/null || true
elif [ "$PKG_MANAGER" = "pacman" ]; then
  sudo pacman -S --noconfirm --quiet curl wget git base-devel 2>/dev/null || true
fi
print_ok "Basic system packages installed"

# ──────────────────────────────────────────────
# 3. NODE.JS
# ──────────────────────────────────────────────
print_step "Installing Node.js (v20 LTS)"

if command_exists node; then
  NODE_VERSION=$(node -v 2>/dev/null)
  MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | tr -d 'v')
  if [ "$MAJOR" -ge 18 ]; then
    print_ok "Node.js $NODE_VERSION already installed"
  else
    print_warn "Node.js $NODE_VERSION found (need 18+). Upgrading..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null || true
    if [ "$OS_TYPE" = "macos" ]; then
      brew install node@20 2>/dev/null || brew link node@20 2>/dev/null || true
    elif [ "$PKG_MANAGER" = "apt" ]; then
      sudo apt-get install -y -qq nodejs
    fi
  fi
else
  if [ "$OS_TYPE" = "macos" ]; then
    brew install node@20 2>/dev/null || true
  elif [ "$PKG_MANAGER" = "apt" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
  elif [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo "$PKG_MANAGER" install -y -q nodejs
  elif [ "$PKG_MANAGER" = "pacman" ]; then
    sudo pacman -S --noconfirm nodejs npm
  fi
  print_ok "Node.js installed: $(node -v)"
fi

if command_exists npm; then
  print_ok "npm $(npm -v)"
else
  print_err "npm not found after Node.js installation"
  exit 1
fi

# ──────────────────────────────────────────────
# 4. POSTGRESQL
# ──────────────────────────────────────────────
print_step "Installing PostgreSQL"

if command_exists psql; then
  PG_VERSION=$(psql --version 2>/dev/null | head -1)
  print_ok "PostgreSQL already installed: $PG_VERSION"
else
  if [ "$OS_TYPE" = "macos" ]; then
    brew install postgresql@16 2>/dev/null || brew install postgresql 2>/dev/null || true
    brew services start postgresql 2>/dev/null || true
  elif [ "$PKG_MANAGER" = "apt" ]; then
    sudo apt-get install -y -qq postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
  elif [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
    sudo "$PKG_MANAGER" install -y -q postgresql-server postgresql-contrib
    sudo postgresql-setup initdb 2>/dev/null || true
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
  elif [ "$PKG_MANAGER" = "pacman" ]; then
    sudo pacman -S --noconfirm postgresql
    sudo -u postgres initdb -D /var/lib/postgres/data 2>/dev/null || true
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
  fi
  print_ok "PostgreSQL installed"
fi

# ──────────────────────────────────────────────
# 5. YT-DLP
# ──────────────────────────────────────────────
print_step "Installing yt-dlp"

if command_exists yt-dlp; then
  print_ok "yt-dlp $(yt-dlp --version)"
else
  if command_exists pip3; then
    pip3 install -q yt-dlp 2>/dev/null && print_ok "yt-dlp installed via pip3"
  elif command_exists pip; then
    pip install -q yt-dlp 2>/dev/null && print_ok "yt-dlp installed via pip"
  fi

  if ! command_exists yt-dlp; then
    sudo curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
    sudo chmod a+rx /usr/local/bin/yt-dlp
    print_ok "yt-dlp installed via direct download"
  fi
fi

# ──────────────────────────────────────────────
# 6. NPM DEPENDENCIES
# ──────────────────────────────────────────────
print_step "Installing Project Dependencies (npm install)"

if [ -f "package.json" ]; then
  npm install --legacy-peer-deps 2>&1 | tail -3
  print_ok "npm dependencies installed"
else
  print_err "package.json not found in $PROJECT_DIR"
  exit 1
fi

# ──────────────────────────────────────────────
# 7. SETUP POSTGRESQL DATABASE
# ──────────────────────────────────────────────
print_step "Setting Up PostgreSQL Database"

read -rp "  PostgreSQL host [localhost]: " DB_HOST
DB_HOST="${DB_HOST:-localhost}"

read -rp "  PostgreSQL port [5432]: " DB_PORT
DB_PORT="${DB_PORT:-5432}"

read -rp "  Database name [downair]: " DB_NAME
DB_NAME="${DB_NAME:-downair}"

read -rp "  Database user [postgres]: " DB_USER
DB_USER="${DB_USER:-postgres}"

read -sp "  Database password: " DB_PASSWORD
echo ""
DB_PASSWORD="${DB_PASSWORD:-}"

# Create database and user if needed
if [ "$OS_TYPE" = "macos" ]; then
  PG_USER="${USER}"
else
  PG_USER="postgres"
fi

DB_EXISTS=$(sudo -u "$PG_USER" psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME" && echo "yes" || echo "no")

if [ "$DB_EXISTS" = "no" ]; then
  if [ "$DB_USER" = "postgres" ]; then
    sudo -u "$PG_USER" psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && print_ok "Database '$DB_NAME' created" || print_warn "Could not create database (may already exist)"
  else
    sudo -u "$PG_USER" psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
    sudo -u "$PG_USER" psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null && print_ok "Database '$DB_NAME' created" || print_warn "Could not create database"
  fi
else
  print_ok "Database '$DB_NAME' already exists"
fi

# Build the DATABASE_URL
if [ -n "$DB_PASSWORD" ]; then
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
  DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# ──────────────────────────────────────────────
# 8. GENERATE SECRETS
# ──────────────────────────────────────────────
print_step "Generating Security Keys"

JWT_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)
HMAC_SECRET=$(openssl rand -hex 32)
print_ok "JWT_SECRET generated"
print_ok "ENCRYPTION_KEY generated"
print_ok "HMAC_SECRET generated"

# ──────────────────────────────────────────────
# 9. ADMIN CONFIGURATION
# ──────────────────────────────────────────────
print_step "Configure Admin Account"

read -rp "  Admin name [Admin]: " ADMIN_NAME
ADMIN_NAME="${ADMIN_NAME:-Admin}"

read -rp "  Admin email [admin@downair.net]: " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@downair.net}"

read -sp "  Admin password (min 8 chars): " ADMIN_PASSWORD
echo ""
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
  print_err "Password must be at least 8 characters"
  read -sp "  Admin password (min 8 chars): " ADMIN_PASSWORD
  echo ""
  if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    ADMIN_PASSWORD="admin$(date +%s | tail -c 5)"
    print_warn "Generated fallback password: $ADMIN_PASSWORD"
  fi
fi

# ──────────────────────────────────────────────
# 10. APP CONFIGURATION
# ──────────────────────────────────────────────
print_step "Configure Application"

read -rp "  App name [DownAir]: " APP_NAME
APP_NAME="${APP_NAME:-DownAir}"

read -rp "  App URL [http://localhost:5173]: " APP_URL
APP_URL="${APP_URL:-http://localhost:5173}"

read -rp "  Server port [3001]: " APP_PORT
APP_PORT="${APP_PORT:-3001}"

# ──────────────────────────────────────────────
# 11. WRITE .env FILE
# ──────────────────────────────────────────────
print_step "Writing Configuration (.env)"

cat > .env << ENVEOF
# DownAir Configuration - Generated by install.sh
# $(date)

# Application
APP_NAME=${APP_NAME}
APP_URL=${APP_URL}
APP_PORT=${APP_PORT}
NODE_ENV=production

# Database
DATABASE_URL=${DATABASE_URL}

# Security
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
HMAC_SECRET=${HMAC_SECRET}

# Admin
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Setup Status
SETUP_COMPLETED=true
ENVEOF

chmod 600 .env
print_ok ".env file created with secure permissions"

# ──────────────────────────────────────────────
# 12. PUSH DATABASE SCHEMA
# ──────────────────────────────────────────────
print_step "Pushing Database Schema (Drizzle)"

export DATABASE_URL
npx drizzle-kit push 2>&1 | tail -5
print_ok "Database schema pushed"

# ──────────────────────────────────────────────
# 13. SEED ADMIN USER
# ──────────────────────────────────────────────
print_step "Seeding Admin User"

npx tsx scripts/seed.ts 2>&1
print_ok "Admin user seeded"

# ──────────────────────────────────────────────
# 14. SEED CONTENT PAGES
# ──────────────────────────────────────────────
print_step "Seeding 150 Content Pages"

npx tsx scripts/seed-content.ts 2>&1 | tail -15
print_ok "Content pages seeded"

# ──────────────────────────────────────────────
# 15. BUILD FRONTEND
# ──────────────────────────────────────────────
print_step "Building Frontend (Vite)"

npx vite build 2>&1 | tail -8
print_ok "Frontend built successfully"

# ──────────────────────────────────────────────
# 16. VERIFY INSTALLATION
# ──────────────────────────────────────────────
print_step "Verifying Installation"

ERRORS=0

if command_exists node; then print_ok "Node.js: $(node -v)"; else print_err "Node.js not found"; ERRORS=$((ERRORS+1)); fi
if command_exists npm; then print_ok "npm: $(npm -v)"; else print_err "npm not found"; ERRORS=$((ERRORS+1)); fi
if command_exists psql; then print_ok "PostgreSQL: $(psql --version | head -1)"; else print_err "PostgreSQL not found"; ERRORS=$((ERRORS+1)); fi
if command_exists yt-dlp; then print_ok "yt-dlp: $(yt-dlp --version)"; else print_warn "yt-dlp not found (downloads will use fallback formats)"; fi
[ -f ".env" ] && print_ok ".env file exists" || { print_err ".env missing"; ERRORS=$((ERRORS+1)); }
[ -d "node_modules" ] && print_ok "node_modules exists" || { print_err "node_modules missing"; ERRORS=$((ERRORS+1)); }
[ -d "dist/client" ] && print_ok "Frontend build exists" || { print_err "Frontend build missing"; ERRORS=$((ERRORS+1)); }

# ──────────────────────────────────────────────
# DONE
# ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ INSTALLATION COMPLETE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}App Name:${NC}    $APP_NAME"
echo -e "  ${YELLOW}App URL:${NC}     $APP_URL"
echo -e "  ${YELLOW}Server Port:${NC} $APP_PORT"
echo -e "  ${YELLOW}Database:${NC}    $DB_NAME"
echo -e "  ${YELLOW}Admin Email:${NC} $ADMIN_EMAIL"
echo ""
echo -e "  ${GREEN}Start development:${NC}"
echo -e "    ${CYAN}npm run dev${NC}"
echo ""
echo -e "  ${GREEN}Start production server:${NC}"
echo -e "    ${CYAN}NODE_ENV=production npx tsx server/index.ts${NC}"
echo ""
echo -e "  ${GREEN}Admin Dashboard:${NC}"
echo -e "    ${CYAN}${APP_URL}/admin/login${NC}"
echo ""
echo -e "  ${GREEN}Content Pages:${NC}"
echo -e "    ${CYAN}${APP_URL}/guides${NC}"
echo ""
echo -e "  ${GREEN}Re-seed content:${NC}"
echo -e "    ${CYAN}npx tsx scripts/seed-content.ts${NC}"
echo ""
echo -e "  ${GREEN}Database management:${NC}"
echo -e "    ${CYAN}npx drizzle-kit studio${NC}  (opens DB GUI)"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo -e "  ${RED}⚠ $ERRORS issue(s) detected. Review output above.${NC}"
  echo ""
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
