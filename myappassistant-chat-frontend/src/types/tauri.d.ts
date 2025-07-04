declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export interface TauriInvokeFunction {
  (command: string, args?: Record<string, unknown>): Promise<unknown>;
}

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

export {}; 