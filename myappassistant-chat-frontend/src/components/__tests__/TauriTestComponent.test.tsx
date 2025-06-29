import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TauriTestComponent from '../tauri/TauriTestComponent'
import { useTauriAPI } from '../../hooks/useTauriAPI'

// Mock the useTauriAPI hook
jest.mock('../../hooks/useTauriAPI')

const mockUseTauriAPI = useTauriAPI as jest.MockedFunction<typeof useTauriAPI>

describe('TauriTestComponent', () => {
  const mockTauriAPI = {
    processReceipt: jest.fn(),
    showNotification: jest.fn(),
    greet: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTauriAPI.mockReturnValue(mockTauriAPI)
  })

  it('renders all test buttons', () => {
    render(<TauriTestComponent />)
    expect(screen.getByText('Greet from Rust')).toBeInTheDocument()
    expect(screen.getByText('Test Notification')).toBeInTheDocument()
    expect(screen.getByText('Test Receipt Processing')).toBeInTheDocument()
  })

  it('handles greet function successfully', async () => {
    const user = userEvent.setup()
    const mockGreeting = 'Hello, Test! You\'ve been greeted from Rust!'
    mockTauriAPI.greet.mockResolvedValue(mockGreeting)

    render(<TauriTestComponent />)
    const nameInput = screen.getByPlaceholderText('Enter your name')
    await user.type(nameInput, 'Test')
    const greetButton = screen.getByText('Greet from Rust')
    await user.click(greetButton)
    await waitFor(() => {
      expect(mockTauriAPI.greet).toHaveBeenCalledWith('Test')
    })
    expect(screen.getByText('Response from Rust:')).toBeInTheDocument()
    expect(screen.getByText(mockGreeting)).toBeInTheDocument()
  })

  it('handles notification function successfully', async () => {
    const user = userEvent.setup()
    mockTauriAPI.showNotification.mockResolvedValue(undefined)

    render(<TauriTestComponent />)
    const notificationButton = screen.getByText('Test Notification')
    await user.click(notificationButton)
    await waitFor(() => {
      expect(mockTauriAPI.showNotification).toHaveBeenCalledWith(
        'FoodSave AI',
        'This is a test notification from Tauri!'
      )
    })
  })

  it('handles receipt processing function successfully', async () => {
    const user = userEvent.setup()
    mockTauriAPI.processReceipt.mockResolvedValue({ items: [{}, {}] })

    render(<TauriTestComponent />)
    const receiptButton = screen.getByText('Test Receipt Processing')
    await user.click(receiptButton)
    await waitFor(() => {
      expect(mockTauriAPI.processReceipt).toHaveBeenCalledWith('/path/to/receipt.jpg')
    })
  })
}) 