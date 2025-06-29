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

export const useTauriAPI = () => {
  const processReceipt = async (path: string): Promise<ReceiptData> => {
    return await invoke('process_receipt_image', { path });
  };

  const showNotification = async (title: string, body: string): Promise<void> => {
    return await invoke('show_system_notification', { title, body });
  };

  const showCustomNotification = async (notification: NotificationData): Promise<void> => {
    return await invoke('show_custom_notification', { notification });
  };

  const saveReceiptData = async (receipt: ReceiptData): Promise<string> => {
    return await invoke('save_receipt_data', { receipt });
  };

  const getAppDataDir = async (): Promise<string> => {
    return await invoke('get_app_data_dir');
  };

  const makeApiRequest = async (
    url: string, 
    method: string, 
    body?: string
  ): Promise<string> => {
    return await invoke('make_api_request', { url, method, body });
  };

  const greet = async (name: string): Promise<string> => {
    return await invoke('greet', { name });
  };

  return {
    processReceipt,
    showNotification,
    showCustomNotification,
    saveReceiptData,
    getAppDataDir,
    makeApiRequest,
    greet,
  };
}; 