/**
 * Telegram Bot Settings Component for FoodSave AI.
 * 
 * This component provides a user interface for configuring
 * Telegram Bot integration settings.
 */

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { telegramAPI } from '../../services/telegramApi';
import type { TelegramBotSettings } from '../../types';

export default function TelegramSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [webhookStatus, setWebhookStatus] = useState<string>('');

  const [botSettings, setBotSettings] = useState<TelegramBotSettings>({
    enabled: false,
    botToken: '',
    botUsername: '',
    webhookUrl: '',
    webhookSecret: '',
    maxMessageLength: 4096,
    rateLimitPerMinute: 30
  });

  useEffect(() => {
    loadBotSettings();
    checkWebhookStatus();
  }, []);

  const loadBotSettings = async () => {
    try {
      const response = await telegramAPI.getBotSettings();
      if (response.status === 'success') {
        setBotSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading bot settings:', error);
    }
  };

  const checkWebhookStatus = async () => {
    try {
      const response = await telegramAPI.getWebhookInfo();
      if (response.status === 'success') {
        const webhookInfo = response.data;
        if (webhookInfo.ok && webhookInfo.result.url) {
          setWebhookStatus('✅ Webhook aktywny');
        } else {
          setWebhookStatus('❌ Webhook nieaktywny');
        }
      }
    } catch (error) {
      setWebhookStatus('❌ Błąd sprawdzania webhook');
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await telegramAPI.updateBotSettings(botSettings);
      if (response.status === 'success') {
        updateSettings({
          integrations: {
            ...settings.integrations,
            telegram: botSettings
          }
        });
        alert('Ustawienia zapisane pomyślnie!');
      }
    } catch (error) {
      alert('Błąd podczas zapisywania ustawień');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetWebhook = async () => {
    if (!botSettings.webhookUrl) {
      alert('Podaj URL webhook');
      return;
    }

    setIsLoading(true);
    try {
      const response = await telegramAPI.setWebhook(botSettings.webhookUrl);
      if (response.status === 'success') {
        alert('Webhook ustawiony pomyślnie!');
        checkWebhookStatus();
      }
    } catch (error) {
      alert('Błąd podczas ustawiania webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const response = await telegramAPI.testConnection();
      if (response.status === 'success') {
        setTestResult('✅ Połączenie z botem działa poprawnie');
      } else {
        setTestResult('❌ Błąd połączenia z botem');
      }
    } catch (error) {
      setTestResult('❌ Błąd testowania połączenia');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-cosmic-primary-container-bg rounded-xl p-6 shadow-xl border border-cosmic-neutral-3 dark:bg-cosmic-neutral-9 dark:text-cosmic-bg dark:border-cosmic-neutral-8 transition-colors duration-300">
      <h3 className="text-xl font-semibold mb-4 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">
        Integracja z Telegram Bot
      </h3>

      {/* Status Webhook */}
      <div className="mb-4 p-3 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8">
        <p className="text-sm text-cosmic-neutral-8 dark:text-cosmic-neutral-3">
          Status Webhook: {webhookStatus}
        </p>
      </div>

      {/* Konfiguracja Bota */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-1">
            Token BotFather:
          </label>
          <input
            type="password"
            value={botSettings.botToken}
            onChange={(e) => setBotSettings({ ...botSettings, botToken: e.target.value })}
            placeholder="Wprowadź token z BotFather"
            className="w-full p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-1">
            Username Bota:
          </label>
          <input
            type="text"
            value={botSettings.botUsername}
            onChange={(e) => setBotSettings({ ...botSettings, botUsername: e.target.value })}
            placeholder="np. foodsave_ai_bot"
            className="w-full p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-1">
            URL Webhook:
          </label>
          <input
            type="url"
            value={botSettings.webhookUrl}
            onChange={(e) => setBotSettings({ ...botSettings, webhookUrl: e.target.value })}
            placeholder="https://your-domain.com/api/v2/telegram/webhook"
            className="w-full p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-1">
            Secret Token:
          </label>
          <input
            type="text"
            value={botSettings.webhookSecret}
            onChange={(e) => setBotSettings({ ...botSettings, webhookSecret: e.target.value })}
            placeholder="Automatycznie generowany"
            className="w-full p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green"
            readOnly
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-1">
              Maksymalna długość wiadomości:
            </label>
            <input
              type="number"
              value={botSettings.maxMessageLength}
              onChange={(e) => setBotSettings({ ...botSettings, maxMessageLength: parseInt(e.target.value) })}
              className="w-full p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-1">
              Limit wiadomości na minutę:
            </label>
            <input
              type="number"
              value={botSettings.rateLimitPerMinute}
              onChange={(e) => setBotSettings({ ...botSettings, rateLimitPerMinute: parseInt(e.target.value) })}
              className="w-full p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="telegram-enabled"
            checked={botSettings.enabled}
            onChange={(e) => setBotSettings({ ...botSettings, enabled: e.target.checked })}
            className="mr-2 h-4 w-4 text-cosmic-bright-green focus:ring-cosmic-bright-green border-gray-300 rounded"
          />
          <label htmlFor="telegram-enabled" className="text-sm text-cosmic-neutral-8 dark:text-cosmic-neutral-3">
            Włącz integrację z Telegram
          </label>
        </div>
      </div>

      {/* Przyciski Akcji */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={handleTestConnection}
          disabled={isLoading || !botSettings.botToken}
          className="bg-cosmic-neutral-4 hover:bg-cosmic-neutral-5 text-cosmic-text p-2 rounded-lg font-semibold shadow-md transition-all duration-200 dark:bg-cosmic-neutral-7 dark:text-cosmic-bg dark:hover:bg-cosmic-neutral-6 disabled:opacity-50"
        >
          {isLoading ? 'Testowanie...' : 'Test Połączenia'}
        </button>

        <button
          onClick={handleSetWebhook}
          disabled={isLoading || !botSettings.webhookUrl}
          className="bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 p-2 rounded-lg font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Ustawianie...' : 'Ustaw Webhook'}
        </button>

        <button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="bg-cosmic-accent hover:bg-cosmic-accent-dark text-cosmic-neutral-0 p-2 rounded-lg font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
        </button>
      </div>

      {/* Wynik Testu */}
      {testResult && (
        <div className="mt-4 p-3 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8">
          <p className="text-sm text-cosmic-neutral-8 dark:text-cosmic-neutral-3">
            {testResult}
          </p>
        </div>
      )}

      {/* Instrukcje */}
      <div className="mt-6 p-4 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8">
        <h4 className="font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">
          Instrukcje Konfiguracji:
        </h4>
        <ol className="list-decimal list-inside text-sm text-cosmic-neutral-8 dark:text-cosmic-neutral-3 space-y-1">
          <li>Otwórz Telegram i znajdź @BotFather</li>
          <li>Wyślij komendę /newbot</li>
          <li>Podaj nazwę i username dla bota</li>
          <li>Skopiuj otrzymany token</li>
          <li>Wklej token w pole powyżej</li>
          <li>Ustaw URL webhook (HTTPS wymagany)</li>
          <li>Kliknij "Ustaw Webhook"</li>
          <li>Przetestuj połączenie</li>
        </ol>
      </div>
    </div>
  );
} 