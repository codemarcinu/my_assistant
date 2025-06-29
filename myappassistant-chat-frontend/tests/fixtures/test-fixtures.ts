import { test as baseTest, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Custom fixtures for FoodSave AI tests
export const test = baseTest.extend<{
  authenticatedPage: Page;
  dashboardPage: Page;
  chatPage: Page;
}>({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Setup - navigate to dashboard (assuming no auth required for now)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for main dashboard elements to be visible
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
    
    await use(page);
    
    // Teardown - no specific cleanup needed for now
  },

  // Dashboard page fixture with pre-loaded state
  dashboardPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure all main components are loaded
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-commands"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible();
    
    await use(page);
  },

  // Chat page fixture with chat functionality
  chatPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure chat window is ready
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-message-button"]')).toBeVisible();
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Helper functions for common test operations
export const testHelpers = {
  // Send a message in chat - fixed for Material UI TextField
  async sendMessage(page: Page, message: string) {
    // For Material UI TextField, we need to target the input element inside the TextField
    const messageInput = page.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    const sendButton = page.locator('[data-testid="send-message-button"]');
    
    await messageInput.fill(message);
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    
    // Wait for message to appear - use more specific selector
    await expect(page.locator(`[data-testid^="message-content-"]:has-text("${message}")`)).toBeVisible();
  },

  // Upload a file
  async uploadFile(page: Page, filePath: string) {
    const dropZone = page.locator('[data-testid="drop-zone"]');
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    await dropZone.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    
    // Wait for file to be selected
    await expect(page.locator('[data-testid="selected-file-0"]')).toBeVisible();
  },

  // Click a quick command
  async clickQuickCommand(page: Page, commandId: string) {
    const commandButton = page.locator(`[data-testid="quick-command-${commandId}"]`);
    await expect(commandButton).toBeVisible();
    await commandButton.click();
    
    // Wait for command to be executed
    await page.waitForTimeout(500);
  },

  // Toggle theme
  async toggleTheme(page: Page) {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    
    // Wait for theme change
    await page.waitForTimeout(200);
  },

  // Check if element is visible with proper error handling
  async expectElementVisible(page: Page, selector: string, timeout = 10000) {
    try {
      await expect(page.locator(selector)).toBeVisible({ timeout });
    } catch (error) {
      console.error(`Element ${selector} not visible:`, error);
      throw error;
    }
  },

  // Wait for network idle with timeout
  async waitForNetworkIdle(page: Page, timeout = 10000) {
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch (error) {
      console.warn('Network did not reach idle state within timeout');
    }
  },

  // Fill message input - fixed for Material UI TextField
  async fillMessageInput(page: Page, message: string) {
    const messageInput = page.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    await messageInput.fill(message);
  },

  // Get message input value - fixed for Material UI TextField
  async getMessageInputValue(page: Page) {
    const messageInput = page.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    return await messageInput.inputValue();
  },

  // Check if message exists in chat - more specific selector
  async expectMessageVisible(page: Page, message: string) {
    await expect(page.locator(`[data-testid^="message-content-"]:has-text("${message}")`)).toBeVisible();
  },

  // Check if quick command text exists - more specific selector
  async expectQuickCommandTextVisible(page: Page, text: string) {
    await expect(page.locator(`[data-testid^="message-content-"]:has-text("${text}")`)).toBeVisible();
  }
}; 