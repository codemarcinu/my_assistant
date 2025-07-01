import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TauriTestComponent } from '../tauri/TauriTestComponent'
import { useTauriAPI } from '../../hooks/useTauriAPI'
import { useTauriContext } from '../../hooks/useTauriContext'

// Mock the hooks
jest.mock('../../hooks/useTauriAPI')
jest.mock('../../hooks/useTauriContext')

const mockUseTauriAPI = useTauriAPI as jest.MockedFunction<typeof useTauriAPI>
const mockUseTauriContext = useTauriContext as jest.MockedFunction<typeof useTauriContext>

describe('TauriTestComponent', () => {
  const mockTauriAPI = {
    greet: jest.fn(),
    isTauriAvailable: true,
  }

  const mockTauriContext = {
    isInitialized: true,
    isAvailable: true,
    error: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTauriAPI.mockReturnValue(mockTauriAPI)
    mockUseTauriContext.mockReturnValue(mockTauriContext)
  })

  it('renders Tauri API test component', () => {
    render(<TauriTestComponent />)
    expect(screen.getByText('Tauri API Test')).toBeInTheDocument()
    expect(screen.getByText('Test Greet Function')).toBeInTheDocument()
  })

  it('displays Tauri context status', () => {
    render(<TauriTestComponent />)
    expect(screen.getByText('Tauri Context Status')).toBeInTheDocument()
    expect(screen.getByText(/Initialized:/)).toBeInTheDocument()
    expect(screen.getByText('Available:')).toBeInTheDocument()
    expect(screen.getByText('Hook Available:')).toBeInTheDocument()
  })

  it('handles greet function successfully', async () => {
    const user = userEvent.setup()
    const mockGreeting = 'Hello, Test User! You\'ve been greeted from Rust!'
    mockTauriAPI.greet.mockResolvedValue(mockGreeting)

    render(<TauriTestComponent />)
    const greetButton = screen.getByText('Test Greet Function')
    await user.click(greetButton)
    
    await waitFor(() => {
      expect(mockTauriAPI.greet).toHaveBeenCalledWith('Test User')
    })
    
    expect(screen.getByText('Greet Result:')).toBeInTheDocument()
    expect(screen.getByText(mockGreeting)).toBeInTheDocument()
  })

  it('handles greet function error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Greet function failed'
    mockTauriAPI.greet.mockRejectedValue(new Error(errorMessage))

    render(<TauriTestComponent />)
    const greetButton = screen.getByText('Test Greet Function')
    await user.click(greetButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('shows warning when Tauri is not available', () => {
    mockUseTauriContext.mockReturnValue({
      ...mockTauriContext,
      isInitialized: true,
      isAvailable: false,
    })

    render(<TauriTestComponent />)
    expect(screen.getByText(/Tauri API is not available in this context/)).toBeInTheDocument()
  })

  it('shows success message when Tauri is available', () => {
    render(<TauriTestComponent />)
    expect(screen.getByText(/Tauri API is available and ready to use/)).toBeInTheDocument()
  })

  it('disables button when Tauri is not available', () => {
    mockUseTauriContext.mockReturnValue({
      ...mockTauriContext,
      isAvailable: false,
    })

    render(<TauriTestComponent />)
    const greetButton = screen.getByText('Test Greet Function')
    expect(greetButton).toBeDisabled()
  })

  it('shows loading state during greet operation', async () => {
    const user = userEvent.setup()
    let resolveGreet: (value: string) => void
    const greetPromise = new Promise<string>((resolve) => {
      resolveGreet = resolve
    })
    mockTauriAPI.greet.mockReturnValue(greetPromise)

    render(<TauriTestComponent />)
    const greetButton = screen.getByText('Test Greet Function')
    await user.click(greetButton)
    
    expect(screen.getByText('Testing...')).toBeInTheDocument()
    
    // Resolve the promise
    resolveGreet!('Hello!')
    await waitFor(() => {
      expect(screen.getByText('Test Greet Function')).toBeInTheDocument()
    })
  })
}) 