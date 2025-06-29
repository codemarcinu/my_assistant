import { test, expect } from '@playwright/test'

test.describe('Tauri Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application successfully', async ({ page }) => {
    // Check if the app loads without errors
    await expect(page).toHaveTitle(/FoodSave AI/)
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should handle Tauri API calls', async ({ page }) => {
    // Navigate to Tauri test component if it exists
    // This test assumes there's a way to access the Tauri test component
    await page.goto('/tauri-test')
    
    // Test greet functionality
    await page.click('button:has-text("Test Greet")')
    await expect(page.locator('text=Hello, Test! You\'ve been greeted from Rust!')).toBeVisible()
  })

  test('should handle system notifications', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // Test notification functionality
    await page.click('button:has-text("Test Notification")')
    await expect(page.locator('text=Notification sent successfully!')).toBeVisible()
  })

  test('should handle API requests', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // Test API request functionality
    await page.click('button:has-text("Test API Request")')
    await expect(page.locator('text=API Response:')).toBeVisible()
  })

  test('should handle file operations', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // Test file upload functionality
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('input[type="file"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg')
    
    // Check if file was processed
    await expect(page.locator('text=Receipt processed')).toBeVisible()
  })

  test('should handle app data directory access', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // Test app data directory access
    await page.click('button:has-text("Get App Data Dir")')
    await expect(page.locator('text=App Data Dir:')).toBeVisible()
  })

  test('should handle custom notifications', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // Test custom notification functionality
    await page.click('button:has-text("Test Custom Notification")')
    await expect(page.locator('text=Custom notification sent successfully!')).toBeVisible()
  })

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // Test error handling by triggering an invalid operation
    await page.click('button:has-text("Test Error")')
    await expect(page.locator('text=Error:')).toBeVisible()
  })

  test('should clear results properly', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // First trigger a result
    await page.click('button:has-text("Test Greet")')
    await expect(page.locator('text=Hello, Test! You\'ve been greeted from Rust!')).toBeVisible()
    
    // Then clear results
    await page.click('button:has-text("Clear Results")')
    await expect(page.locator('text=Hello, Test! You\'ve been greeted from Rust!')).not.toBeVisible()
  })
})

test.describe('Desktop App Specific Tests', () => {
  test('should handle window management', async ({ page }) => {
    // Test window minimize/maximize functionality
    await page.goto('/')
    
    // These tests would require Tauri-specific APIs
    // For now, we'll test the UI elements that control window management
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
    await page.goto('/tauri-test')
    
    const startTime = Date.now()
    
    // Make multiple API calls
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Test API Request")')
      await page.waitForTimeout(100) // Small delay between calls
    }
    
    const totalTime = Date.now() - startTime
    
    // All calls should complete within 5 seconds
    expect(totalTime).toBeLessThan(5000)
  })

  test('should handle large file uploads', async ({ page }) => {
    await page.goto('/tauri-test')
    
    // Create a large test file (1MB)
    const largeFileContent = 'x'.repeat(1024 * 1024)
    const largeFile = new File([largeFileContent], 'large_receipt.jpg', { type: 'image/jpeg' })
    
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('input[type="file"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(largeFile)
    
    // Should handle large files without crashing
    await expect(page.locator('text=File uploaded successfully')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Cross-platform Compatibility', () => {
  test('should work on different screen sizes', async ({ page }) => {
    await page.goto('/')
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('nav')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('nav')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should handle different themes', async ({ page }) => {
    await page.goto('/')
    
    // Test light theme
    await page.click('[data-testid="theme-toggle"]')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    
    // Test dark theme
    await page.click('[data-testid="theme-toggle"]')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
}) 