import { invoke as tauriInvoke } from '@/lib/tauri-client';

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

const invoke = typeof tauriInvoke === 'function' ? tauriInvoke : null;

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
      if (!invoke) throw new Error('Brak wsparcia dla invoke w tym środowisku');
      return await (invoke('process_receipt_image', { path }) as Promise<ReceiptData>);
    } else {
      throw new Error('Receipt processing is only available in the desktop app');
    }
  };

  const showNotification = async (title: string, body: string): Promise<void> => {
    if (isTauriAvailable()) {
      if (!invoke) throw new Error('Brak wsparcia dla invoke w tym środowisku');
      await (invoke('show_system_notification', { title, body }) as Promise<void>);
    } else {
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
      if (!invoke) throw new Error('Brak wsparcia dla invoke w tym środowisku');
      await (invoke('show_custom_notification', { notification }) as Promise<void>);
    } else {
      await showNotification(notification.title, notification.body);
    }
  };

  const saveReceiptData = async (receipt: ReceiptData): Promise<string> => {
    if (isTauriAvailable()) {
      if (!invoke) throw new Error('Brak wsparcia dla invoke w tym środowisku');
      return await (invoke('save_receipt_data', { receipt }) as Promise<string>);
    } else {
      const receipts = JSON.parse(localStorage.getItem('receipts') || '[]');
      receipts.push({ ...receipt, id: Date.now().toString() });
      localStorage.setItem('receipts', JSON.stringify(receipts));
      return 'Receipt saved to browser storage';
    }
  };

  const getAppDataDir = async (): Promise<string> => {
    if (isTauriAvailable()) {
      if (!invoke) throw new Error('Brak wsparcia dla invoke w tym środowisku');
      const path = await (invoke('get_app_data_dir') as Promise<string>);
      return typeof path === 'string' ? path : String(path);
    } else {
      return '/app-data';
    }
  };

  const makeApiRequest = async (
    method: string,
    url: string, 
    body?: string
  ): Promise<string> => {
    if (isTauriAvailable()) {
      if (!invoke) throw new Error('Brak wsparcia dla invoke w tym środowisku');
      return await (invoke('make_api_request', { url, method, body }) as Promise<string>);
    } else {
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8001${url}`;
      return await webApiClient.request(fullUrl, method, body);
    }
  };

  const greet = async (name: string): Promise<string> => {
    if (isTauriAvailable()) {
      if (!invoke) throw new Error('Brak wsparcia dla invoke w tym środowisku');
      return await (invoke('greet', { name }) as Promise<string>);
    } else {
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