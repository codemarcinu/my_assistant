import { invoke } from '@tauri-apps/api/core';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface ReceiptData {
  items: ReceiptItem[];
  total: number;
  store: string;
  date: string;
  receipt_id: string;
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
}

// Check if we're running in Tauri context
const isTauriAvailable = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};

// Fallback API client for web browser usage
const webApiClient = {
  async request(url: string, method: string, body?: string): Promise<string> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body || undefined,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Web API request failed:', error);
      throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const useTauriAPI = () => {
  const processReceipt = async (path: string): Promise<ReceiptData> => {
    if (isTauriAvailable()) {
      return await invoke('process_receipt_image', { path });
    } else {
      // Fallback for web browser - you might want to implement file upload handling
      throw new Error('Receipt processing is only available in the desktop app');
    }
  };

  const showNotification = async (title: string, body: string): Promise<void> => {
    if (isTauriAvailable()) {
      return await invoke('show_system_notification', { title, body });
    } else {
      // Fallback for web browser - use browser notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
  };

  const showCustomNotification = async (notification: NotificationData): Promise<void> => {
    if (isTauriAvailable()) {
      return await invoke('show_custom_notification', { notification });
    } else {
      // Fallback for web browser
      await showNotification(notification.title, notification.body);
    }
  };

  const saveReceiptData = async (receipt: ReceiptData): Promise<string> => {
    if (isTauriAvailable()) {
      return await invoke('save_receipt_data', { receipt });
    } else {
      // Fallback for web browser - save to localStorage or send to backend
      const receipts = JSON.parse(localStorage.getItem('receipts') || '[]');
      receipts.push({ ...receipt, id: Date.now().toString() });
      localStorage.setItem('receipts', JSON.stringify(receipts));
      return 'Receipt saved to browser storage';
    }
  };

  const getAppDataDir = async (): Promise<string> => {
    if (isTauriAvailable()) {
      const path = await invoke('get_app_data_dir');
      return typeof path === 'string' ? path : String(path);
    } else {
      // Fallback for web browser
      return '/app-data';
    }
  };

  const makeApiRequest = async (
    method: string,
    url: string, 
    body?: string
  ): Promise<string> => {
    if (isTauriAvailable()) {
      return await invoke('make_api_request', { url, method, body });
    } else {
      // Fallback for web browser - use fetch API
      // Ensure the URL is properly formatted
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;
      return await webApiClient.request(fullUrl, method, body);
    }
  };

  const greet = async (name: string): Promise<string> => {
    if (isTauriAvailable()) {
      return await invoke('greet', { name });
    } else {
      // Fallback for web browser
      return `Hello, ${name}! You've been greeted from the web browser!`;
    }
  };

  return {
    processReceipt,
    showNotification,
    showCustomNotification,
    saveReceiptData,
    getAppDataDir,
    makeApiRequest,
    greet,
    isTauriAvailable: isTauriAvailable(),
  };
}; 