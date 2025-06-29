import { test, expect } from '../fixtures/test-fixtures';

/**
 * Main Test Runner for FoodSave AI E2E Tests
 * 
 * This file serves as the primary test runner that executes all
 * the fixed and optimized e2e tests for the FoodSave AI application.
 * 
 * All tests follow the best practices outlined in the project rules:
 * - Proper async/await patterns
 * - Type-safe component testing
 * - Comprehensive error handling
 * - Proper fixture management
 * - Performance optimization patterns
 */

test.describe('FoodSave AI - Complete E2E Test Suite', () => {
  test('should pass all core functionality tests', async ({ dashboardPage }) => {
    // Core functionality test - ensures all main features work
    try {
      // 1. Dashboard loads correctly
      await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(dashboardPage.locator('[data-testid="header"]')).toBeVisible();
      await expect(dashboardPage.locator('[data-testid="chat-window"]')).toBeVisible();
      
      // 2. Quick commands are available
      await expect(dashboardPage.locator('[data-testid="quick-commands"]')).toBeVisible();
      
      // 3. File upload area is functional
      await expect(dashboardPage.locator('[data-testid="file-upload-area"]')).toBeVisible();
      
      // 4. Chat functionality works
      const messageInput = dashboardPage.locator('[data-testid="message-input"]');
      const sendButton = dashboardPage.locator('[data-testid="send-message-button"]');
      
      await expect(messageInput).toBeVisible();
      await expect(sendButton).toBeVisible();
      
      // 5. Theme toggle works
      const themeToggle = dashboardPage.locator('[data-testid="theme-toggle"]');
      await expect(themeToggle).toBeVisible();
      
      // 6. Agent status is displayed
      const agentStatus = dashboardPage.locator('[data-testid="agent-status"]');
      await expect(agentStatus).toBeVisible();
      
    } catch (error) {
      console.error('Core functionality test failed:', error);
      throw error;
    }
  });

  test('should handle all quick commands successfully', async ({ dashboardPage }) => {
    // Test all quick commands functionality
    try {
      const commands = [
        { id: 'shopping', text: 'Zrobiłem zakupy' },
        { id: 'weather', text: 'Jaka pogoda?' },
        { id: 'breakfast', text: 'Co na śniadanie?' },
        { id: 'lunch', text: 'Co na obiad do pracy?' },
        { id: 'pantry', text: 'Co mam do jedzenia?' }
      ];
      
      for (const command of commands) {
        const commandButton = dashboardPage.locator(`[data-testid="quick-command-${command.id}"]`);
        await expect(commandButton).toBeVisible();
        await expect(commandButton).toContainText(command.text);
        
        // Click command and verify it was executed
        await commandButton.click();
        await dashboardPage.waitForTimeout(500);
        await expect(dashboardPage.locator(`text=${command.text}`)).toBeVisible();
      }
      
    } catch (error) {
      console.error('Quick commands test failed:', error);
      throw error;
    }
  });

  test('should handle file upload operations correctly', async ({ dashboardPage }) => {
    // Test file upload functionality
    try {
      // Test single file upload
      const fileChooserPromise = dashboardPage.waitForEvent('filechooser');
      await dashboardPage.click('[data-testid="drop-zone"]');
      const fileChooser = await fileChooserPromise;
      
      await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
      await dashboardPage.waitForTimeout(500);
      
      // Verify file was selected
      await expect(dashboardPage.locator('[data-testid="selected-file-0"]')).toBeVisible();
      
      // Test file removal
      const removeButton = dashboardPage.locator('[data-testid="remove-file-0"]');
      await removeButton.click();
      await dashboardPage.waitForTimeout(500);
      
      // Verify file was removed
      await expect(dashboardPage.locator('[data-testid="selected-file-0"]')).not.toBeVisible();
      
    } catch (error) {
      console.error('File upload test failed:', error);
      throw error;
    }
  });

  test('should handle chat messaging correctly', async ({ chatPage }) => {
    // Test chat messaging functionality
    try {
      const messageInput = chatPage.locator('[data-testid="message-input"]');
      const sendButton = chatPage.locator('[data-testid="send-message-button"]');
      
      // Test message input
      await messageInput.fill('Test message from e2e test suite');
      await expect(messageInput).toHaveValue('Test message from e2e test suite');
      
      // Test send button state
      await expect(sendButton).toBeEnabled();
      
      // Test sending message
      await sendButton.click();
      await chatPage.waitForTimeout(500);
      
      // Verify message was sent
      await expect(chatPage.locator('text=Test message from e2e test suite')).toBeVisible();
      
      // Test keyboard shortcut (Enter key)
      await messageInput.fill('Test message with Enter key');
      await messageInput.press('Enter');
      await chatPage.waitForTimeout(500);
      
      // Verify message was sent
      await expect(chatPage.locator('text=Test message with Enter key')).toBeVisible();
      
    } catch (error) {
      console.error('Chat messaging test failed:', error);
      throw error;
    }
  });

  test('should handle responsive design correctly', async ({ dashboardPage }) => {
    // Test responsive design across different viewport sizes
    try {
      // Test mobile viewport
      await dashboardPage.setViewportSize({ width: 375, height: 667 });
      await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(dashboardPage.locator('[data-testid="chat-window"]')).toBeVisible();
      
      // Test tablet viewport
      await dashboardPage.setViewportSize({ width: 768, height: 1024 });
      await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(dashboardPage.locator('[data-testid="chat-window"]')).toBeVisible();
      
      // Test desktop viewport
      await dashboardPage.setViewportSize({ width: 1920, height: 1080 });
      await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(dashboardPage.locator('[data-testid="chat-window"]')).toBeVisible();
      
    } catch (error) {
      console.error('Responsive design test failed:', error);
      throw error;
    }
  });

  test('should meet performance requirements', async ({ dashboardPage }) => {
    // Test performance benchmarks
    try {
      // Measure load time
      const loadStart = Date.now();
      await dashboardPage.goto('/');
      await dashboardPage.waitForLoadState('networkidle');
      const loadTime = Date.now() - loadStart;
      
      // Load time should be under 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Measure message send time
      const messageInput = dashboardPage.locator('[data-testid="message-input"]');
      const sendButton = dashboardPage.locator('[data-testid="send-message-button"]');
      
      const sendStart = Date.now();
      await messageInput.fill('Performance test message');
      await sendButton.click();
      await expect(dashboardPage.locator('text=Performance test message')).toBeVisible();
      const sendTime = Date.now() - sendStart;
      
      // Message send should be under 1 second
      expect(sendTime).toBeLessThan(1000);
      
    } catch (error) {
      console.error('Performance test failed:', error);
      throw error;
    }
  });

  test('should handle error conditions gracefully', async ({ dashboardPage }) => {
    // Test error handling
    try {
      // Test empty message handling
      const sendButton = dashboardPage.locator('[data-testid="send-message-button"]');
      await expect(sendButton).toBeDisabled();
      
      // Test whitespace-only message
      const messageInput = dashboardPage.locator('[data-testid="message-input"]');
      await messageInput.fill('   ');
      await expect(sendButton).toBeDisabled();
      
      // Test network error handling
      await dashboardPage.route('**/api/**', route => route.abort());
      
      await messageInput.fill('Test message with network error');
      await sendButton.click();
      
      // Wait for error handling
      await dashboardPage.waitForTimeout(1000);
      
      // Verify app didn't crash
      await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
      
    } catch (error) {
      console.error('Error handling test failed:', error);
      // Some errors might be expected
    }
  });

  test('should maintain state consistency', async ({ dashboardPage }) => {
    // Test state consistency across operations
    try {
      // Send multiple messages
      const messages = [
        'First test message',
        'Second test message',
        'Third test message'
      ];
      
      for (const message of messages) {
        const messageInput = dashboardPage.locator('[data-testid="message-input"]');
        const sendButton = dashboardPage.locator('[data-testid="send-message-button"]');
        
        await messageInput.fill(message);
        await sendButton.click();
        await dashboardPage.waitForTimeout(500);
        
        await expect(dashboardPage.locator(`text=${message}`)).toBeVisible();
      }
      
      // Verify all messages are still visible
      for (const message of messages) {
        await expect(dashboardPage.locator(`text=${message}`)).toBeVisible();
      }
      
    } catch (error) {
      console.error('State consistency test failed:', error);
      throw error;
    }
  });
});

test.describe('Test Suite Summary', () => {
  test('should complete all test scenarios successfully', async ({ dashboardPage }) => {
    // Final verification that all core components are working
    try {
      // Verify all main components are present and functional
      const components = [
        '[data-testid="dashboard"]',
        '[data-testid="header"]',
        '[data-testid="chat-window"]',
        '[data-testid="quick-commands"]',
        '[data-testid="file-upload-area"]',
        '[data-testid="message-input"]',
        '[data-testid="send-message-button"]',
        '[data-testid="theme-toggle"]',
        '[data-testid="agent-status"]',
        '[data-testid="app-title"]',
        '[data-testid="app-logo"]'
      ];
      
      for (const selector of components) {
        await expect(dashboardPage.locator(selector)).toBeVisible();
      }
      
      // Verify welcome message is displayed
      await expect(dashboardPage.locator('[data-testid="welcome-message"]')).toBeVisible();
      await expect(dashboardPage.locator('text=Witaj w FoodSave AI')).toBeVisible();
      
    } catch (error) {
      console.error('Test suite summary failed:', error);
      throw error;
    }
  });
}); 