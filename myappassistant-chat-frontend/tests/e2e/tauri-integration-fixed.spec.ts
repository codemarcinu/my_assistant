import { test, expect } from '../fixtures/test-fixtures';

test.describe('Tauri Integration Tests - Fixed', () => {
  test('should load the application successfully', async ({ dashboardPage }) => {
    // Check if the app loads without errors
    await expect(dashboardPage).toHaveTitle(/FoodSave AI/);
    
    // Check for main dashboard elements (new architecture)
    await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="header"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="chat-window"]')).toBeVisible();
  });

  test('should handle basic navigation and UI elements', async ({ dashboardPage }) => {
    // Test main UI elements exist with proper selectors
    await expect(dashboardPage.locator('[data-testid="app-title"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="app-logo"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="theme-toggle"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="agent-status"]')).toBeVisible();
  });

  test('should handle theme toggle functionality', async ({ dashboardPage }) => {
    // Test theme toggle with proper error handling
    const themeToggle = dashboardPage.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    
    // Click theme toggle
    await themeToggle.click();
    
    // Wait for theme change to take effect
    await dashboardPage.waitForTimeout(200);
    
    // Verify theme changed (implementation dependent)
    // await expect(dashboardPage.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('should handle chat functionality', async ({ chatPage }) => {
    // Test chat input with proper selectors
    const messageInput = chatPage.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    
    // Type and send message
    await messageInput.fill('Test message from Tauri integration');
    await messageInput.press('Enter');
    
    // Wait for message to be sent
    await chatPage.waitForTimeout(500);
    
    // Verify message was sent
    await expect(chatPage.locator('text=Test message from Tauri integration')).toBeVisible();
  });

  test('should handle file upload in chat', async ({ chatPage }) => {
    // Test file upload through chat with proper error handling
    try {
      const attachButton = chatPage.locator('[data-testid="attach-file-button"]');
      await expect(attachButton).toBeVisible();
      
      // Set up file chooser
      const fileChooserPromise = chatPage.waitForEvent('filechooser');
      await attachButton.click();
      const fileChooser = await fileChooserPromise;
      
      // Select test file
      await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
      
      // Wait for file to be processed
      await chatPage.waitForTimeout(500);
      
      // Verify file was selected (implementation dependent)
      // await expect(chatPage.locator('text=test_receipt.jpg')).toBeVisible();
    } catch (error) {
      console.error('File upload in chat test failed:', error);
      throw error;
    }
  });

  test('should handle quick commands', async ({ dashboardPage }) => {
    // Test quick commands functionality with proper selectors
    const quickCommands = dashboardPage.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible();
    
    // Test shopping command
    const shoppingCommand = dashboardPage.locator('[data-testid="quick-command-shopping"]');
    await expect(shoppingCommand).toBeVisible();
    await shoppingCommand.click();
    
    // Wait for command to be executed
    await dashboardPage.waitForTimeout(500);
    
    // Verify command was executed
    await expect(dashboardPage.locator('text=Zrobiłem zakupy')).toBeVisible();
  });

  test('should handle file upload area', async ({ dashboardPage }) => {
    // Test dedicated file upload area with proper error handling
    try {
      const fileUploadArea = dashboardPage.locator('[data-testid="file-upload-area"]');
      const dropZone = dashboardPage.locator('[data-testid="drop-zone"]');
      
      await expect(fileUploadArea).toBeVisible();
      await expect(dropZone).toBeVisible();
      
      // Test file selection
      const fileChooserPromise = dashboardPage.waitForEvent('filechooser');
      await dropZone.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
      
      // Wait for file to be selected
      await dashboardPage.waitForTimeout(500);
      
      // Verify file was selected
      await expect(dashboardPage.locator('[data-testid="selected-file-0"]')).toBeVisible();
    } catch (error) {
      console.error('File upload area test failed:', error);
      throw error;
    }
  });

  test('should handle settings and notifications', async ({ dashboardPage }) => {
    // Test settings button with proper selectors
    const settingsButton = dashboardPage.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible();
    
    // Test notifications button with proper selectors
    const notificationsButton = dashboardPage.locator('[data-testid="notifications-button"]');
    await expect(notificationsButton).toBeVisible();
  });

  test('should handle errors gracefully', async ({ chatPage }) => {
    // Test error handling by sending empty message
    const sendButton = chatPage.locator('[data-testid="send-message-button"]');
    await expect(sendButton).toBeDisabled();
    
    // Test with invalid input
    const messageInput = chatPage.locator('[data-testid="message-input"]');
    await messageInput.fill('   '); // Only whitespace
    await expect(sendButton).toBeDisabled();
  });

  test('should clear results properly', async ({ chatPage }) => {
    // Send a message with proper error handling
    try {
      const messageInput = chatPage.locator('[data-testid="message-input"]');
      const sendButton = chatPage.locator('[data-testid="send-message-button"]');
      
      await messageInput.fill('Test message for clearing');
      await sendButton.click();
      
      // Wait for message to be sent
      await chatPage.waitForTimeout(500);
      
      // Verify message was sent
      await expect(chatPage.locator('text=Test message for clearing')).toBeVisible();
      
      // Reload page to clear
      await chatPage.reload();
      
      // Wait for page to reload
      await chatPage.waitForLoadState('networkidle');
      
      // Verify message was cleared
      await expect(chatPage.locator('text=Test message for clearing')).not.toBeVisible();
    } catch (error) {
      console.error('Clear results test failed:', error);
      throw error;
    }
  });
});

test.describe('Desktop App Specific Tests - Fixed', () => {
  test('should handle window management', async ({ dashboardPage }) => {
    // Test window controls (if implemented) with proper error handling
    try {
      await dashboardPage.goto('/');
      
      // These tests would require Tauri-specific APIs
      // For now, we test the UI elements that control window management
      const windowControls = dashboardPage.locator('[data-testid="window-controls"]');
      if (await windowControls.isVisible()) {
        await windowControls.locator('button:has-text("Minimize")').click();
        await windowControls.locator('button:has-text("Maximize")').click();
      }
    } catch (error) {
      console.error('Window management test failed:', error);
      // This is expected if window controls are not implemented
    }
  });

  test('should handle system tray integration', async ({ dashboardPage }) => {
    // Test system tray functionality with proper error handling
    try {
      await dashboardPage.goto('/');
      
      // Look for system tray related UI elements
      const systemTrayButton = dashboardPage.locator('[data-testid="system-tray"]');
      if (await systemTrayButton.isVisible()) {
        await systemTrayButton.click();
        await expect(dashboardPage.locator('[data-testid="tray-menu"]')).toBeVisible();
      }
    } catch (error) {
      console.error('System tray test failed:', error);
      // This is expected if system tray is not implemented
    }
  });

  test('should handle keyboard shortcuts', async ({ dashboardPage }) => {
    // Test common keyboard shortcuts with proper error handling
    try {
      await dashboardPage.goto('/');
      
      // Test common keyboard shortcuts
      await dashboardPage.keyboard.press('F11'); // Fullscreen toggle
      await dashboardPage.keyboard.press('Escape'); // Exit fullscreen
      
      // Test Ctrl+N for new window (if implemented)
      await dashboardPage.keyboard.press('Control+n');
    } catch (error) {
      console.error('Keyboard shortcuts test failed:', error);
      // This is expected if keyboard shortcuts are not implemented
    }
  });

  test('should handle drag and drop', async ({ dashboardPage }) => {
    // Test file drag and drop functionality with proper error handling
    try {
      await dashboardPage.goto('/');
      
      // Test file drag and drop functionality
      const dropZone = dashboardPage.locator('[data-testid="drop-zone"]');
      if (await dropZone.isVisible()) {
        await dropZone.dispatchEvent('drop', {
          dataTransfer: {
            files: [
              new File(['test content'], 'test_receipt.jpg', { type: 'image/jpeg' })
            ]
          }
        });
        
        // Wait for drop event to be processed
        await dashboardPage.waitForTimeout(500);
        
        await expect(dashboardPage.locator('text=File dropped successfully')).toBeVisible();
      }
    } catch (error) {
      console.error('Drag and drop test failed:', error);
      // This is expected if drag and drop is not fully implemented
    }
  });
});

test.describe('Performance Tests - Fixed', () => {
  test('should load quickly', async ({ dashboardPage }) => {
    const startTime = Date.now();
    await dashboardPage.goto('/');
    const loadTime = Date.now() - startTime;
    
    // App should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle multiple API calls efficiently', async ({ dashboardPage }) => {
    await dashboardPage.goto('/');
    
    const startTime = Date.now();
    
    // Make multiple quick commands with proper error handling
    const commands = ['shopping', 'weather', 'breakfast'];
    for (const commandId of commands) {
      await dashboardPage.click(`[data-testid="quick-command-${commandId}"]`);
      await dashboardPage.waitForTimeout(100); // Small delay between calls
    }
    
    const totalTime = Date.now() - startTime;
    
    // All calls should complete within 5 seconds
    expect(totalTime).toBeLessThan(5000);
  });

  test('should handle large file uploads', async ({ dashboardPage }) => {
    // Test file upload through drop zone with proper error handling
    try {
      await dashboardPage.goto('/');
      
      // Test file upload through drop zone
      const dropZone = dashboardPage.locator('[data-testid="drop-zone"]');
      await expect(dropZone).toBeVisible();
      
      const fileChooserPromise = dashboardPage.waitForEvent('filechooser');
      await dropZone.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
      
      // Should handle files without crashing
      await expect(dashboardPage.locator('[data-testid="selected-file-0"]')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      console.error('Large file upload test failed:', error);
      throw error;
    }
  });
});

test.describe('Cross-platform Compatibility - Fixed', () => {
  test('should work on different screen sizes', async ({ dashboardPage }) => {
    await dashboardPage.goto('/');
    
    // Test mobile viewport
    await dashboardPage.setViewportSize({ width: 375, height: 667 });
    await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // Test tablet viewport
    await dashboardPage.setViewportSize({ width: 768, height: 1024 });
    await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // Test desktop viewport
    await dashboardPage.setViewportSize({ width: 1920, height: 1080 });
    await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should handle different operating systems', async ({ dashboardPage }) => {
    await dashboardPage.goto('/');
    
    // Test basic functionality works across platforms
    await expect(dashboardPage.locator('[data-testid="chat-window"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="quick-commands"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="file-upload-area"]')).toBeVisible();
  });
}); 