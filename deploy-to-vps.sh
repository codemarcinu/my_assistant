#!/bin/bash

# Skrypt wdrożenia FoodSave AI na VPS z konfiguracją Telegram webhook
# Użycie: ./deploy-to-vps.sh VPS_IP DOMAIN_NAME

set -e

VPS_IP=${1:-"your-vps-ip"}
DOMAIN=${2:-"your-domain.com"}
SSH_USER=${3:-"root"}

echo "🚀 Wdrażanie FoodSave AI na VPS: $VPS_IP"
echo "🌐 Domena: $DOMAIN"

# 1. Kopiuj pliki na VPS
echo "📁 Kopiowanie plików na VPS..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
    --exclude='*.pyc' --exclude='.env' --exclude='logs/*' \
    ./ $SSH_USER@$VPS_IP:/opt/foodsave-ai/

# 2. Konfiguruj środowisko na VPS
echo "🔧 Konfiguracja środowiska na VPS..."
ssh $SSH_USER@$VPS_IP << 'EOF'
    cd /opt/foodsave-ai
    
    # Instalacja Docker i Docker Compose
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    
    # Instalacja nginx
    apt update
    apt install -y nginx certbot python3-certbot-nginx
    
    # Konfiguracja nginx
    cat > /etc/nginx/sites-available/foodsave-ai << 'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    
    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
    
    # Zastąp placeholder domeną
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/foodsave-ai
    
    # Aktywuj konfigurację
    ln -sf /etc/nginx/sites-available/foodsave-ai /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    
    # Uruchom aplikację
    cd /opt/foodsave-ai
    docker compose up -d
    
    echo "✅ Aplikacja uruchomiona na VPS!"
EOF

# 3. Konfiguruj SSL
echo "🔒 Konfiguracja SSL..."
ssh $SSH_USER@$VPS_IP "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN"

# 4. Aktualizuj konfigurację nginx z SSL
ssh $SSH_USER@$VPS_IP << EOF
    cat > /etc/nginx/sites-available/foodsave-ai << 'NGINX'
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX
    
    nginx -t && systemctl reload nginx
EOF

echo "✅ Wdrożenie zakończone!"
echo "🌐 Aplikacja dostępna pod adresem: https://$DOMAIN"
echo "🤖 Webhook URL: https://$DOMAIN/api/v2/telegram/webhook"
echo ""
echo "📝 Następne kroki:"
echo "1. Ustaw webhook: curl -X POST 'https://$DOMAIN/api/v2/telegram/set-webhook' -H 'Content-Type: application/json' -d '{\"webhook_url\": \"https://$DOMAIN/api/v2/telegram/webhook\"}'"
echo "2. Sprawdź status: curl 'https://$DOMAIN/api/v2/telegram/webhook-info'"
echo "3. Test połączenia: curl 'https://$DOMAIN/api/v2/telegram/test-connection'" 