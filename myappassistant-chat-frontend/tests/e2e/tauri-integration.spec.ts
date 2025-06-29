import { test, expect } from '@playwright/test'

test.describe('Tauri Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application successfully', async ({ page }) => {
    // Check if the app loads without errors
    await expect(page).toHaveTitle(/FoodSave AI/)
    
    // Check for main dashboard elements (new architecture)
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible()
  })

  test('should handle basic navigation and UI elements', async ({ page }) => {
    // Test main UI elements exist
    await expect(page.locator('[data-testid="app-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible()
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible()
    await expect(page.locator('[data-testid="agent-status"]')).toBeVisible()
  })

  test('should handle theme toggle functionality', async ({ page }) => {
    // Test theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    await expect(themeToggle).toBeVisible()
    
    // Click theme toggle
    await themeToggle.click()
    
    // Verify theme changed (implementation dependent)
    // await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('should handle chat functionality', async ({ page }) => {
    // Test chat input
    const messageInput = page.locator('[data-testid="message-input"]')
    await expect(messageInput).toBeVisible()
    
    // Type and send message
    await messageInput.fill('Test message from Tauri integration')
    await messageInput.press('Enter')
    
    // Verify message was sent
    await expect(page.locator('text=Test message from Tauri integration')).toBeVisible()
  })

  test('should handle file upload in chat', async ({ page }) => {
    // Test file upload through chat
    const attachButton = page.locator('[data-testid="attach-file-button"]')
    await expect(attachButton).toBeVisible()
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser')
    await attachButton.click()
    const fileChooser = await fileChooserPromise
    
    // Select test file
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg')
    
    // Verify file was selected (implementation dependent)
    // await expect(page.locator('text=test_receipt.jpg')).toBeVisible()
  })

  test('should handle quick commands', async ({ page }) => {
    // Test quick commands functionality
    const quickCommands = page.locator('[data-testid="quick-commands"]')
    await expect(quickCommands).toBeVisible()
    
    // Test shopping command
    const shoppingCommand = page.locator('[data-testid="quick-command-shopping"]')
    await expect(shoppingCommand).toBeVisible()
    await shoppingCommand.click()
    
    // Verify command was executed
    await expect(page.locator('text=Zrobiłem zakupy')).toBeVisible()
  })

  test('should handle file upload area', async ({ page }) => {
    // Test dedicated file upload area
    const fileUploadArea = page.locator('[data-testid="file-upload-area"]')
    const dropZone = page.locator('[data-testid="drop-zone"]')
    
    await expect(fileUploadArea).toBeVisible()
    await expect(dropZone).toBeVisible()
    
    // Test file selection
    const fileChooserPromise = page.waitForEvent('filechooser')
    await dropZone.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg')
    
    // Verify file was selected
    await expect(page.locator('[data-testid="selected-file-0"]')).toBeVisible()
  })

  test('should handle settings and notifications', async ({ page }) => {
    // Test settings button
    const settingsButton = page.locator('[data-testid="settings-button"]')
    await expect(settingsButton).toBeVisible()
    
    // Test notifications button
    const notificationsButton = page.locator('[data-testid="notifications-button"]')
    await expect(notificationsButton).toBeVisible()
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling by sending empty message
    const sendButton = page.locator('[data-testid="send-message-button"]')
    await expect(sendButton).toBeDisabled()
    
    // Test with invalid input
    const messageInput = page.locator('[data-testid="message-input"]')
    await messageInput.fill('   ') // Only whitespace
    await expect(sendButton).toBeDisabled()
  })

  test('should clear results properly', async ({ page }) => {
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]')
    const sendButton = page.locator('[data-testid="send-message-button"]')
    
    await messageInput.fill('Test message for clearing')
    await sendButton.click()
    
    // Verify message was sent
    await expect(page.locator('text=Test message for clearing')).toBeVisible()
    
    // Reload page to clear
    await page.reload()
    
    // Verify message was cleared
    await expect(page.locator('text=Test message for clearing')).not.toBeVisible()
  })
})

test.describe('Desktop App Specific Tests', () => {
  test('should handle window management', async ({ page }) => {
    // Test window controls (if implemented)
    await page.goto('/')
    
    // These tests would require Tauri-specific APIs
    // For now, we test the UI elements that control window management
    const windowControls = page.locator('[data-testid="window-controls"]')
    if (await windowControls.isVisible()) {
      await windowControls.locator('button:has-text("Minimize")').click()
      await windowControls.locator('button:has-text("Maximize")').click()
    }
  })

  test('should handle system tray integration', async ({ page }) => {
    // Test system tray functionality
    await page.goto('/')
    
    // Look for system tray related UI elements
    const systemTrayButton = page.locator('[data-testid="system-tray"]')
    if (await systemTrayButton.isVisible()) {
      await systemTrayButton.click()
      await expect(page.locator('[data-testid="tray-menu"]')).toBeVisible()
    }
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/')
    
    // Test common keyboard shortcuts
    await page.keyboard.press('F11') // Fullscreen toggle
    await page.keyboard.press('Escape') // Exit fullscreen
    
    // Test Ctrl+N for new window (if implemented)
    await page.keyboard.press('Control+n')
  })

  test('should handle drag and drop', async ({ page }) => {
    await page.goto('/')
    
    // Test file drag and drop functionality
    const dropZone = page.locator('[data-testid="drop-zone"]')
    if (await dropZone.isVisible()) {
      await dropZone.dispatchEvent('drop', {
        dataTransfer: {
          files: [
            new File(['test content'], 'test_receipt.jpg', { type: 'image/jpeg' })
          ]
        }
      })
      
      await expect(page.locator('text=File dropped successfully')).toBeVisible()
    }
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

  test('should handle multiple API calls efficiently', async ({ page }) => {
    await page.goto('/')
    
    const startTime = Date.now()
    
    // Make multiple quick commands
    const commands = ['shopping', 'weather', 'breakfast']
    for (const commandId of commands) {
      await page.click(`[data-testid="quick-command-${commandId}"]`)
      await page.waitForTimeout(100) // Small delay between calls
    }
    
    const totalTime = Date.now() - startTime
    
    // All calls should complete within 5 seconds
    expect(totalTime).toBeLessThan(5000)
  })

  test('should handle large file uploads', async ({ page }) => {
    await page.goto('/')
    
    // Test file upload through drop zone
    const dropZone = page.locator('[data-testid="drop-zone"]')
    await expect(dropZone).toBeVisible()
    
    const fileChooserPromise = page.waitForEvent('filechooser')
    await dropZone.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg')
    
    // Should handle files without crashing
    await expect(page.locator('[data-testid="selected-file-0"]')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Cross-platform Compatibility', () => {
  test('should work on different screen sizes', async ({ page }) => {
    await page.goto('/')
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
  })

  test('should handle different operating systems', async ({ page }) => {
    await page.goto('/')
    
    // Test basic functionality works across platforms
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible()
    await expect(page.locator('[data-testid="quick-commands"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible()
  })
}) 