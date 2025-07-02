#!/bin/bash

# Skrypt konfiguracji subdomeny mikr.us dla Telegram webhook
# Użycie: ./setup-mikrus-subdomain.sh SUBDOMAIN PORT BOT_TOKEN

set -e

SUBDOMAIN=${1:-"foodsave-ai"}
PORT=${2:-"8001"}
BOT_TOKEN=${3:-"your_bot_token"}

echo "🌐 Konfiguracja subdomeny mikr.us: $SUBDOMAIN.byst.re"
echo "🔌 Port aplikacji: $PORT"

# 1. Sprawdź czy aplikacja działa lokalnie
echo "🔍 Sprawdzanie aplikacji lokalnej..."
if ! curl -s "http://localhost:$PORT/api/v2/telegram/settings" > /dev/null; then
    echo "❌ Aplikacja nie jest dostępna na porcie $PORT"
    echo "   Uruchom: docker compose up -d"
    exit 1
fi

echo "✅ Aplikacja lokalna działa"

# 2. Ustaw subdomenę mikr.us
echo "🔗 Ustawianie subdomeny mikr.us..."
echo "   Uruchom na VPS: domena $SUBDOMAIN.byst.re $PORT"

# 3. Poczekaj na aktywację subdomeny
echo "⏳ Czekam na aktywację subdomeny..."
echo "   Sprawdź czy subdomena działa: https://$SUBDOMAIN.byst.re"

# 4. Sprawdź czy subdomena działa
echo "🔍 Sprawdzanie subdomeny..."
for i in {1..30}; do
    if curl -s "https://$SUBDOMAIN.byst.re/api/v2/telegram/settings" > /dev/null 2>&1; then
        echo "✅ Subdomena działa!"
        break
    fi
    echo "   Próba $i/30 - czekam..."
    sleep 10
done

# 5. Sprawdź aktualne ustawienia
echo "📋 Aktualne ustawienia Telegram:"
curl -s "https://$SUBDOMAIN.byst.re/api/v2/telegram/settings" | jq .

# 6. Ustaw webhook
echo "🔗 Ustawianie webhook..."
WEBHOOK_URL="https://$SUBDOMAIN.byst.re/api/v2/telegram/webhook"

curl -X POST "https://$SUBDOMAIN.byst.re/api/v2/telegram/set-webhook" \
  -H "Content-Type: application/json" \
  -d "{\"webhook_url\": \"$WEBHOOK_URL\"}" | jq .

# 7. Sprawdź status webhook
echo "📊 Status webhook:"
curl -s "https://$SUBDOMAIN.byst.re/api/v2/telegram/webhook-info" | jq .

# 8. Test połączenia (jeśli token jest podany)
if [ "$BOT_TOKEN" != "your_bot_token" ]; then
    echo "🔗 Test połączenia z botem..."
    curl -s "https://$SUBDOMAIN.byst.re/api/v2/telegram/test-connection" | jq .
fi

echo ""
echo "🎉 Konfiguracja zakończona!"
echo ""
echo "🌐 Twoja aplikacja: https://$SUBDOMAIN.byst.re"
echo "🤖 Webhook URL: https://$SUBDOMAIN.byst.re/api/v2/telegram/webhook"
echo ""
echo "📝 Aby przetestować bota:"
echo "1. Otwórz Telegram"
echo "2. Znajdź swojego bota (@foodsave_ai_bot)"
echo "3. Wyślij wiadomość: 'Cześć, jak się masz?'"
echo "4. Sprawdź czy bot odpowiada"
echo ""
echo "🔧 Przydatne komendy:"
echo "   Sprawdź status: curl 'https://$SUBDOMAIN.byst.re/api/v2/telegram/webhook-info'"
echo "   Test połączenia: curl 'https://$SUBDOMAIN.byst.re/api/v2/telegram/test-connection'"
echo "   Logi aplikacji: docker compose logs -f backend"
echo ""
echo "📋 Ważne informacje:"
echo "   - Subdomena jest automatycznie HTTPS"
echo "   - Nie wymaga konfiguracji SSL"
echo "   - Działa tylko gdy aplikacja jest uruchomiona"
echo "   - Aplikacja musi słuchać na IPv6" 