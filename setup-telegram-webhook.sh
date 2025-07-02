#!/bin/bash

# Skrypt konfiguracji Telegram webhook
# Użycie: ./setup-telegram-webhook.sh DOMAIN BOT_TOKEN

set -e

DOMAIN=${1:-"your-domain.com"}
BOT_TOKEN=${2:-"your_bot_token"}

echo "🤖 Konfiguracja Telegram webhook dla domeny: $DOMAIN"

# 1. Sprawdź czy aplikacja działa
echo "🔍 Sprawdzanie statusu aplikacji..."
if ! curl -s "https://$DOMAIN/api/v2/telegram/settings" > /dev/null; then
    echo "❌ Aplikacja nie jest dostępna pod adresem https://$DOMAIN"
    echo "   Sprawdź czy VPS jest uruchomiony i nginx jest skonfigurowany"
    exit 1
fi

echo "✅ Aplikacja jest dostępna"

# 2. Sprawdź aktualne ustawienia
echo "📋 Aktualne ustawienia Telegram:"
curl -s "https://$DOMAIN/api/v2/telegram/settings" | jq .

# 3. Test połączenia z botem (jeśli token jest podany)
if [ "$BOT_TOKEN" != "your_bot_token" ]; then
    echo "🔗 Test połączenia z botem..."
    curl -s "https://$DOMAIN/api/v2/telegram/test-connection" | jq .
fi

# 4. Ustaw webhook
echo "🔗 Ustawianie webhook..."
WEBHOOK_URL="https://$DOMAIN/api/v2/telegram/webhook"

curl -X POST "https://$DOMAIN/api/v2/telegram/set-webhook" \
  -H "Content-Type: application/json" \
  -d "{\"webhook_url\": \"$WEBHOOK_URL\"}" | jq .

# 5. Sprawdź status webhook
echo "📊 Status webhook:"
curl -s "https://$DOMAIN/api/v2/telegram/webhook-info" | jq .

# 6. Instrukcje testowania
echo ""
echo "🎉 Konfiguracja zakończona!"
echo ""
echo "📝 Aby przetestować bota:"
echo "1. Otwórz Telegram"
echo "2. Znajdź swojego bota (@foodsave_ai_bot)"
echo "3. Wyślij wiadomość: 'Cześć, jak się masz?'"
echo "4. Sprawdź czy bot odpowiada"
echo ""
echo "🔧 Przydatne komendy:"
echo "   Sprawdź status: curl 'https://$DOMAIN/api/v2/telegram/webhook-info'"
echo "   Test połączenia: curl 'https://$DOMAIN/api/v2/telegram/test-connection'"
echo "   Logi aplikacji: docker compose logs -f backend"
echo ""
echo "📁 Pliki konfiguracyjne:"
echo "   Nginx: /etc/nginx/sites-available/foodsave-ai"
echo "   SSL: /etc/letsencrypt/live/$DOMAIN/"
echo "   Aplikacja: /opt/foodsave-ai/" 