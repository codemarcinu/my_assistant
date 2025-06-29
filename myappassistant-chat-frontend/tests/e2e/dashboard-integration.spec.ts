import { test, expect } from '@playwright/test'

test.describe('Dashboard Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the dashboard successfully', async ({ page }) => {
    // Check if the app loads without errors
    await expect(page).toHaveTitle(/FoodSave AI/)
    
    // Check for main dashboard elements
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible()
    await expect(page.locator('[data-testid="quick-commands"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible()
  })

  test('should display welcome message when no messages', async ({ page }) => {
    // Check for welcome message
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
    await expect(page.locator('text=Witaj w FoodSave AI')).toBeVisible()
    await expect(page.locator('text=Centrum Dowodzenia AI')).toBeVisible()
  })

  test('should handle theme toggle', async ({ page }) => {
    // Test theme toggle functionality
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    await expect(themeToggle).toBeVisible()
    
    // Click theme toggle
    await themeToggle.click()
    
    // Verify theme changed (this might need adjustment based on actual implementation)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('should display agent status', async ({ page }) => {
    // Check agent status display
    const agentStatus = page.locator('[data-testid="agent-status"]')
    await expect(agentStatus).toBeVisible()
    await expect(agentStatus).toContainText('Agentów Aktywnych')
  })

  test('should handle quick commands', async ({ page }) => {
    // Test quick commands functionality
    const quickCommands = page.locator('[data-testid="quick-commands"]')
    await expect(quickCommands).toBeVisible()
    
    // Test shopping command
    const shoppingCommand = page.locator('[data-testid="quick-command-shopping"]')
    await expect(shoppingCommand).toBeVisible()
    await expect(shoppingCommand).toContainText('Zrobiłem zakupy')
    
    // Click shopping command
    await shoppingCommand.click()
    
    // Verify message was added to chat
    await expect(page.locator('text=Zrobiłem zakupy')).toBeVisible()
  })

  test('should handle all quick commands', async ({ page }) => {
    const commands = [
      { id: 'shopping', text: 'Zrobiłem zakupy' },
      { id: 'weather', text: 'Jaka pogoda?' },
      { id: 'breakfast', text: 'Co na śniadanie?' },
      { id: 'lunch', text: 'Co na obiad do pracy?' },
      { id: 'pantry', text: 'Co mam do jedzenia?' }
    ]
    
    for (const command of commands) {
      const commandButton = page.locator(`[data-testid="quick-command-${command.id}"]`)
      await expect(commandButton).toBeVisible()
      await expect(commandButton).toContainText(command.text)
    }
  })

  test('should handle chat message input', async ({ page }) => {
    // Test message input functionality
    const messageInput = page.locator('[data-testid="message-input"]')
    await expect(messageInput).toBeVisible()
    
    // Type a message
    await messageInput.fill('Test message from Playwright')
    
    // Verify message is in input
    await expect(messageInput).toHaveValue('Test message from Playwright')
  })

  test('should handle send message button', async ({ page }) => {
    // Test send message functionality
    const messageInput = page.locator('[data-testid="message-input"]')
    const sendButton = page.locator('[data-testid="send-message-button"]')
    
    // Initially button should be disabled
    await expect(sendButton).toBeDisabled()
    
    // Type a message
    await messageInput.fill('Hello AI Assistant')
    
    // Button should be enabled
    await expect(sendButton).toBeEnabled()
    
    // Click send
    await sendButton.click()
    
    // Verify message was sent
    await expect(page.locator('text=Hello AI Assistant')).toBeVisible()
  })

  test('should handle file upload area', async ({ page }) => {
    // Test file upload functionality
    const fileUploadArea = page.locator('[data-testid="file-upload-area"]')
    const dropZone = page.locator('[data-testid="drop-zone"]')
    
    await expect(fileUploadArea).toBeVisible()
    await expect(dropZone).toBeVisible()
    await expect(dropZone).toContainText('Przeciągnij pliki tutaj lub kliknij')
  })

  test('should handle file selection', async ({ page }) => {
    // Test file selection
    const fileInput = page.locator('[data-testid="file-input"]')
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('[data-testid="drop-zone"]')
    const fileChooser = await fileChooserPromise
    
    // Select test file
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg')
    
    // Verify file was selected
    await expect(page.locator('[data-testid="selected-file-0"]')).toBeVisible()
    await expect(page.locator('text=test_receipt.jpg')).toBeVisible()
  })

  test('should handle file upload process', async ({ page }) => {
    // Test complete file upload process
    const fileInput = page.locator('[data-testid="file-input"]')
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('[data-testid="drop-zone"]')
    const fileChooser = await fileChooserPromise
    
    // Select test file
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg')
    
    // Click upload button
    const uploadButton = page.locator('[data-testid="upload-button"]')
    await expect(uploadButton).toBeVisible()
    await uploadButton.click()
    
    // Verify upload progress (if implemented)
    // await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
  })

  test('should handle file removal', async ({ page }) => {
    // Test file removal functionality
    const fileInput = page.locator('[data-testid="file-input"]')
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('[data-testid="drop-zone"]')
    const fileChooser = await fileChooserPromise
    
    // Select test file
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg')
    
    // Verify file was selected
    await expect(page.locator('[data-testid="selected-file-0"]')).toBeVisible()
    
    // Remove file
    const removeButton = page.locator('[data-testid="remove-file-0"]')
    await removeButton.click()
    
    // Verify file was removed
    await expect(page.locator('[data-testid="selected-file-0"]')).not.toBeVisible()
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Enter key to send message
    const messageInput = page.locator('[data-testid="message-input"]')
    await messageInput.fill('Test message with Enter key')
    await messageInput.press('Enter')
    
    // Verify message was sent
    await expect(page.locator('text=Test message with Enter key')).toBeVisible()
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible()
  })

  test('should handle multiple messages', async ({ page }) => {
    // Send multiple messages
    const messageInput = page.locator('[data-testid="message-input"]')
    const sendButton = page.locator('[data-testid="send-message-button"]')
    
    const messages = [
      'First test message',
      'Second test message',
      'Third test message'
    ]
    
    for (const message of messages) {
      await messageInput.fill(message)
      await sendButton.click()
      await expect(page.locator(`text=${message}`)).toBeVisible()
    }
  })

  test('should handle app title and logo', async ({ page }) => {
    // Check app title
    const appTitle = page.locator('[data-testid="app-title"]')
    await expect(appTitle).toBeVisible()
    await expect(appTitle).toContainText('FoodSave AI')
    
    // Check app logo
    const appLogo = page.locator('[data-testid="app-logo"]')
    await expect(appLogo).toBeVisible()
  })

  test('should handle settings and notifications buttons', async ({ page }) => {
    // Check settings button
    const settingsButton = page.locator('[data-testid="settings-button"]')
    await expect(settingsButton).toBeVisible()
    
    // Check notifications button
    const notificationsButton = page.locator('[data-testid="notifications-button"]')
    await expect(notificationsButton).toBeVisible()
  })
})

test.describe('Performance Tests', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // App should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should handle multiple quick commands efficiently', async ({ page }) => {
    const startTime = Date.now()
    
    // Click multiple quick commands
    const commands = ['shopping', 'weather', 'breakfast']
    for (const commandId of commands) {
      await page.click(`[data-testid="quick-command-${commandId}"]`)
      await page.waitForTimeout(100) // Small delay between clicks
    }
    
    const totalTime = Date.now() - startTime
    
    // All commands should be processed within 2 seconds
    expect(totalTime).toBeLessThan(2000)
  })
})

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/**', route => route.abort())
    
    // Try to send a message
    const messageInput = page.locator('[data-testid="message-input"]')
    const sendButton = page.locator('[data-testid="send-message-button"]')
    
    await messageInput.fill('Test message with network error')
    await sendButton.click()
    
    // Should handle error gracefully (implementation dependent)
    // await expect(page.locator('text=Network error')).toBeVisible()
  })

  test('should handle invalid file uploads', async ({ page }) => {
    // Test invalid file type
    const fileInput = page.locator('[data-testid="file-input"]')
    
    // Create invalid file path
    const invalidFilePath = 'tests/fixtures/test_invalid.txt'
    
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('[data-testid="drop-zone"]')
    const fileChooser = await fileChooserPromise
    
    // Try to upload invalid file
    await fileChooser.setFiles(invalidFilePath)
    
    // Should not show invalid file in selected files
    await expect(page.locator('[data-testid="selected-file-0"]')).not.toBeVisible()
  })
}) 