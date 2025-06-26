/**
 * Telegram Bot API service for FoodSave AI Frontend.
 * 
 * This service provides methods for interacting with the Telegram Bot API
 * through the FoodSave AI backend.
 */

import axios from 'axios';
import type { TelegramBotSettings, TelegramWebhookUpdate, ApiResponse } from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance for Telegram API
const telegramApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const telegramAPI = {
  /**
   * Sets webhook URL for the Telegram bot.
   * 
   * @param webhookUrl - The webhook URL to set
   * @returns Promise with API response
   */
  setWebhook: async (webhookUrl: string): Promise<ApiResponse<{ webhook_url: string }>> => {
    const response = await telegramApiClient.post('/api/v2/telegram/set-webhook', { 
      webhook_url: webhookUrl 
    });
    return response.data;
  },

  /**
   * Gets information about the current webhook.
   * 
   * @returns Promise with webhook information
   */
  getWebhookInfo: async (): Promise<ApiResponse<any>> => {
    const response = await telegramApiClient.get('/api/v2/telegram/webhook-info');
    return response.data;
  },

  /**
   * Sends a message through Telegram Bot API.
   * 
   * @param chatId - Telegram chat ID
   * @param message - Message text to send
   * @returns Promise with send result
   */
  sendMessage: async (chatId: number, message: string): Promise<ApiResponse<void>> => {
    const response = await telegramApiClient.post('/api/v2/telegram/send-message', { 
      chat_id: chatId, 
      message 
    });
    return response.data;
  },

  /**
   * Tests connection with Telegram Bot API.
   * 
   * @returns Promise with bot information
   */
  testConnection: async (): Promise<ApiResponse<{ bot_info: any }>> => {
    const response = await telegramApiClient.get('/api/v2/telegram/test-connection');
    return response.data;
  },

  /**
   * Updates Telegram bot settings.
   * 
   * @param settings - Partial settings to update
   * @returns Promise with updated settings
   */
  updateBotSettings: async (settings: Partial<TelegramBotSettings>): Promise<ApiResponse<TelegramBotSettings>> => {
    const response = await telegramApiClient.put('/api/v2/telegram/settings', settings);
    return response.data;
  },

  /**
   * Gets current Telegram bot settings.
   * 
   * @returns Promise with current settings
   */
  getBotSettings: async (): Promise<ApiResponse<TelegramBotSettings>> => {
    const response = await telegramApiClient.get('/api/v2/telegram/settings');
    return response.data;
  },

  /**
   * Validates Telegram bot token.
   * 
   * @param token - Bot token to validate
   * @returns Promise with validation result
   */
  validateToken: async (token: string): Promise<ApiResponse<{ valid: boolean; bot_info?: any }>> => {
    try {
      const response = await telegramApiClient.post('/api/v2/telegram/validate-token', { token });
      return response.data;
    } catch (error) {
      return {
        data: { valid: false },
        status: 'error',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Gets webhook status and configuration.
   * 
   * @returns Promise with webhook status
   */
  getWebhookStatus: async (): Promise<ApiResponse<{
    isActive: boolean;
    url?: string;
    lastError?: string;
    pendingUpdates?: number;
  }>> => {
    try {
      const response = await telegramApiClient.get('/api/v2/telegram/webhook-info');
      const webhookInfo = response.data.data;
      
      return {
        data: {
          isActive: webhookInfo.ok && !!webhookInfo.result.url,
          url: webhookInfo.result.url,
          lastError: webhookInfo.result.last_error_message,
          pendingUpdates: webhookInfo.result.pending_update_count
        },
        status: 'success',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: { isActive: false },
        status: 'error',
        message: 'Failed to get webhook status',
        timestamp: new Date().toISOString()
      };
    }
  }
}; 