// ✅ REQUIRED: Strict interface definitions for FoodSave AI Chat Frontend

// Base API response types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

// Chat and messaging types
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestedActions?: string[];
    attachments?: Attachment[];
  };
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'receipt';
  url: string;
  filename: string;
  size: number;
}

// Food and pantry types
export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  expirationDate: Date;
  quantity: number;
  unit: string;
  status: FoodStatus;
  addedDate: Date;
  imageUrl?: string;
  barcode?: string;
}

export enum FoodCategory {
  PRODUCE = 'produce',
  DAIRY = 'dairy',
  MEAT = 'meat',
  BAKERY = 'bakery',
  CANNED = 'canned',
  FROZEN = 'frozen',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  CONDIMENTS = 'condiments',
  OTHER = 'other'
}

export enum FoodStatus {
  FRESH = 'fresh',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  CONSUMED = 'consumed'
}

// Shopping list types
export interface ShoppingItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

// OCR and receipt processing
export interface ReceiptData {
  id: string;
  items: ReceiptItem[];
  total: number;
  store: string;
  date: Date;
  imageUrl: string;
  status: ReceiptStatus;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  category?: FoodCategory;
}

export enum ReceiptStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VERIFIED = 'verified'
}

// Weather widget types
export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  location: string;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  icon: string;
}

// Settings and configuration
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  telegram: boolean;
  expirationWarnings: boolean;
  lowStockAlerts: boolean;
}

export interface IntegrationSettings {
  telegram: {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
  };
  weather: {
    enabled: boolean;
    location: string;
    units: 'metric' | 'imperial';
  };
}

// AI Agent types
export interface AgentStatus {
  id: string;
  name: string;
  type: AgentType;
  status: 'online' | 'offline' | 'error';
  lastHeartbeat: Date;
  capabilities: string[];
}

export enum AgentType {
  CHAT = 'chat',
  OCR = 'ocr',
  CLASSIFICATION = 'classification',
  INVENTORY = 'inventory',
  PLANNING = 'planning'
}

// Navigation and UI types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  active?: boolean;
}

// Form and validation types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'file';
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email';
  value?: any;
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userFriendly?: boolean;
}

// Loading and state types
export interface LoadingState {
  isLoading: boolean;
  error?: AppError;
  progress?: number;
}

// Pagination types
export interface PaginationParams {
  page: number;
  size: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// Search and filter types
export interface SearchParams {
  query: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Analytics and metrics types
export interface AnalyticsData {
  totalItems: number;
  expiringSoon: number;
  expired: number;
  categories: Record<FoodCategory, number>;
  monthlySpending: number;
  wasteReduction: number;
} 