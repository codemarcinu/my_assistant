import { renderHook, act } from '@testing-library/react'
import { useTauriAPI } from '../useTauriAPI'
import { invoke } from '@tauri-apps/api/tauri'

// Mock Tauri invoke function
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn(),
}))

const mockInvoke = invoke as jest.MockedFunction<typeof invoke>

describe('useTauriAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('processReceipt', () => {
    it('should process receipt image successfully', async () => {
      const mockReceiptData = {
        items: [
          {
            name: 'Milk',
            quantity: 1,
            price: 3.99,
            category: 'Dairy',
          },
        ],
        total: 3.99,
        store: 'Local Supermarket',
        date: '2024-01-01T00:00:00.000Z',
        receipt_id: 'test-id',
      }

      mockInvoke.mockResolvedValue(mockReceiptData)

      const { result } = renderHook(() => useTauriAPI())

      let receiptData
      await act(async () => {
        receiptData = await result.current.processReceipt('/path/to/image.jpg')
      })

      expect(mockInvoke).toHaveBeenCalledWith('process_receipt_image', {
        path: '/path/to/image.jpg',
      })
      expect(receiptData).toEqual(mockReceiptData)
    })

    it('should handle process receipt error', async () => {
      const errorMessage = 'Failed to process receipt'
      mockInvoke.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useTauriAPI())

      await expect(
        act(async () => {
          await result.current.processReceipt('/path/to/image.jpg')
        })
      ).rejects.toThrow(errorMessage)
    })
  })

  describe('showNotification', () => {
    it('should show system notification successfully', async () => {
      mockInvoke.mockResolvedValue(undefined)

      const { result } = renderHook(() => useTauriAPI())

      await act(async () => {
        await result.current.showNotification('Test Title', 'Test Body')
      })

      expect(mockInvoke).toHaveBeenCalledWith('show_system_notification', {
        title: 'Test Title',
        body: 'Test Body',
      })
    })

    it('should handle notification error', async () => {
      const errorMessage = 'Failed to show notification'
      mockInvoke.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useTauriAPI())

      await expect(
        act(async () => {
          await result.current.showNotification('Test Title', 'Test Body')
        })
      ).rejects.toThrow(errorMessage)
    })
  })

  describe('showCustomNotification', () => {
    it('should show custom notification successfully', async () => {
      mockInvoke.mockResolvedValue(undefined)

      const notificationData = {
        title: 'Custom Title',
        body: 'Custom Body',
        icon: 'icon.png',
      }

      const { result } = renderHook(() => useTauriAPI())

      await act(async () => {
        await result.current.showCustomNotification(notificationData)
      })

      expect(mockInvoke).toHaveBeenCalledWith('show_custom_notification', {
        notification: notificationData,
      })
    })
  })

  describe('saveReceiptData', () => {
    it('should save receipt data successfully', async () => {
      const successMessage = 'Receipt saved successfully'
      mockInvoke.mockResolvedValue(successMessage)

      const receiptData = {
        items: [
          {
            name: 'Milk',
            quantity: 1,
            price: 3.99,
            category: 'Dairy',
          },
        ],
        total: 3.99,
        store: 'Local Supermarket',
        date: '2024-01-01T00:00:00.000Z',
        receipt_id: 'test-id',
      }

      const { result } = renderHook(() => useTauriAPI())

      let response
      await act(async () => {
        response = await result.current.saveReceiptData(receiptData)
      })

      expect(mockInvoke).toHaveBeenCalledWith('save_receipt_data', {
        receipt: receiptData,
      })
      expect(response).toBe(successMessage)
    })
  })

  describe('getAppDataDir', () => {
    it('should get app data directory successfully', async () => {
      const appDataPath = '/home/user/.foodsave-ai'
      mockInvoke.mockResolvedValue(appDataPath)

      const { result } = renderHook(() => useTauriAPI())

      let response
      await act(async () => {
        response = await result.current.getAppDataDir()
      })

      expect(mockInvoke).toHaveBeenCalledWith('get_app_data_dir')
      expect(response).toBe(appDataPath)
    })
  })

  describe('makeApiRequest', () => {
    it('should make GET request successfully', async () => {
      const responseData = '{"status": "success"}'
      mockInvoke.mockResolvedValue(responseData)

      const { result } = renderHook(() => useTauriAPI())

      let response
      await act(async () => {
        response = await result.current.makeApiRequest('GET', 'https://api.example.com')
      })

      expect(mockInvoke).toHaveBeenCalledWith('make_api_request', {
        url: 'https://api.example.com',
        method: 'GET',
        body: undefined,
      })
      expect(response).toBe(responseData)
    })

    it('should make POST request with body successfully', async () => {
      const responseData = '{"status": "created"}'
      mockInvoke.mockResolvedValue(responseData)

      const { result } = renderHook(() => useTauriAPI())

      let response
      await act(async () => {
        response = await result.current.makeApiRequest(
          'POST',
          'https://api.example.com',
          '{"data": "test"}'
        )
      })

      expect(mockInvoke).toHaveBeenCalledWith('make_api_request', {
        url: 'https://api.example.com',
        method: 'POST',
        body: '{"data": "test"}',
      })
      expect(response).toBe(responseData)
    })
  })

  describe('greet', () => {
    it('should greet user successfully', async () => {
      const greeting = 'Hello, John! You\'ve been greeted from Rust!'
      mockInvoke.mockResolvedValue(greeting)

      const { result } = renderHook(() => useTauriAPI())

      let response
      await act(async () => {
        response = await result.current.greet('John')
      })

      expect(mockInvoke).toHaveBeenCalledWith('greet', { name: 'John' })
      expect(response).toBe(greeting)
    })
  })
}) 