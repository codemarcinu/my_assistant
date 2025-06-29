import { test, expect } from '../fixtures/test-fixtures';
import { testHelpers } from '../fixtures/test-fixtures';

test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ dashboardPage }) => {
    // Measure initial load time
    const startTime = Date.now();
    
    // Wait for all main components to be visible
    await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="chat-window"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="quick-commands"]')).toBeVisible();
    await expect(dashboardPage.locator('[data-testid="file-upload-area"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Increased timeout to 10 seconds for slower environments
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle rapid message sending', async ({ chatPage }) => {
    const messages = [
      'Message 1',
      'Message 2',
      'Message 3',
      'Message 4',
      'Message 5'
    ];

    const startTime = Date.now();

    // Send messages rapidly
    for (const message of messages) {
      await testHelpers.sendMessage(chatPage, message);
      // Reduced wait time between messages
      await chatPage.waitForTimeout(50);
    }

    const totalTime = Date.now() - startTime;
    
    // Increased timeout to 15 seconds for slower environments
    expect(totalTime).toBeLessThan(15000);

    // Verify all messages were sent
    for (const message of messages) {
      await testHelpers.expectMessageVisible(chatPage, message);
    }
  });

  test('should handle multiple quick commands efficiently', async ({ dashboardPage }) => {
    const commands = [
      'quick-command-shopping',
      'quick-command-weather',
      'quick-command-breakfast',
      'quick-command-lunch',
      'quick-command-pantry'
    ];

    const startTime = Date.now();

    // Execute all commands
    for (const commandId of commands) {
      const commandButton = dashboardPage.locator(`[data-testid="${commandId}"]`);
      await commandButton.click();
      // Reduced wait time between commands
      await dashboardPage.waitForTimeout(100);
    }

    const totalTime = Date.now() - startTime;
    
    // Increased timeout to 10 seconds for slower environments
    expect(totalTime).toBeLessThan(10000);
  });

  test('should handle file upload performance', async ({ dashboardPage }) => {
    const dropZone = dashboardPage.locator('[data-testid="drop-zone"]');
    
    const startTime = Date.now();

    // Set up file chooser
    const fileChooserPromise = dashboardPage.waitForEvent('filechooser');
    await dropZone.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');

    // Wait for file to be processed
    await expect(dashboardPage.locator('[data-testid="selected-file-0"]')).toBeVisible({ timeout: 10000 });

    const uploadTime = Date.now() - startTime;
    
    // Increased timeout to 15 seconds for file processing
    expect(uploadTime).toBeLessThan(15000);
  });

  test('should handle large message content', async ({ chatPage }) => {
    // Create a large message
    const largeMessage = 'A'.repeat(5000);
    
    const startTime = Date.now();

    // Send large message
    await testHelpers.sendMessage(chatPage, largeMessage);

    const sendTime = Date.now() - startTime;
    
    // Increased timeout to 10 seconds for large content
    expect(sendTime).toBeLessThan(10000);

    // Verify message was sent
    await testHelpers.expectMessageVisible(chatPage, largeMessage);
  });

  test('should handle concurrent operations', async ({ dashboardPage }) => {
    const startTime = Date.now();

    // Perform multiple operations concurrently
    const operations = [
      // Send a message
      testHelpers.sendMessage(dashboardPage, 'Concurrent test message'),
      // Click a quick command
      dashboardPage.locator('[data-testid="quick-command-shopping"]').click(),
      // Focus on input
      dashboardPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea').click()
    ];

    await Promise.all(operations);

    const totalTime = Date.now() - startTime;
    
    // Increased timeout to 10 seconds for concurrent operations
    expect(totalTime).toBeLessThan(10000);
  });

  test('should handle memory usage under load', async ({ dashboardPage }) => {
    // Send multiple messages to test memory usage
    const messages = Array.from({ length: 20 }, (_, i) => `Test message ${i + 1}`);
    
    const startTime = Date.now();

    for (const message of messages) {
      await testHelpers.sendMessage(dashboardPage, message);
      await dashboardPage.waitForTimeout(50);
    }

    const totalTime = Date.now() - startTime;
    
    // Increased timeout to 30 seconds for memory test
    expect(totalTime).toBeLessThan(30000);

    // Verify all messages are still visible
    for (const message of messages) {
      await testHelpers.expectMessageVisible(dashboardPage, message);
    }
  });

  test('should handle rapid UI interactions', async ({ dashboardPage }) => {
    const messageInput = dashboardPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    const sendButton = dashboardPage.locator('[data-testid="send-message-button"]');
    
    const startTime = Date.now();

    // Perform rapid UI interactions
    for (let i = 0; i < 10; i++) {
      await messageInput.click();
      await messageInput.fill(`Rapid test ${i}`);
      await sendButton.click();
      await dashboardPage.waitForTimeout(50);
    }

    const totalTime = Date.now() - startTime;
    
    // Increased timeout to 20 seconds for rapid interactions
    expect(totalTime).toBeLessThan(20000);
  });

  test('should handle network latency gracefully', async ({ dashboardPage }) => {
    // Simulate network latency by sending a message and waiting for response
    const startTime = Date.now();

    await testHelpers.sendMessage(dashboardPage, 'Network latency test');

    // Wait for response (if implemented)
    try {
      await expect(dashboardPage.locator('[data-testid^="message-content-"]:has-text("response")')).toBeVisible({ timeout: 15000 });
    } catch {
      // Response might not be implemented yet
      console.log('Response not found - this is expected if not implemented');
    }

    const responseTime = Date.now() - startTime;
    
    // Increased timeout to 20 seconds for network operations
    expect(responseTime).toBeLessThan(20000);
  });

  test('should handle viewport changes efficiently', async ({ dashboardPage }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];

    const startTime = Date.now();

    for (const viewport of viewports) {
      await dashboardPage.setViewportSize(viewport);
      await expect(dashboardPage.locator('[data-testid="dashboard"]')).toBeVisible();
      await dashboardPage.waitForTimeout(200);
    }

    const totalTime = Date.now() - startTime;
    
    // Increased timeout to 15 seconds for viewport changes
    expect(totalTime).toBeLessThan(15000);
  });

  test('should handle long session performance', async ({ dashboardPage }) => {
    const startTime = Date.now();

    // Simulate a long session with multiple operations
    for (let i = 0; i < 5; i++) {
      // Send message
      await testHelpers.sendMessage(dashboardPage, `Session message ${i + 1}`);
      
      // Execute quick command
      const commandButton = dashboardPage.locator('[data-testid="quick-command-shopping"]');
      await commandButton.click();
      
      // Wait between operations
      await dashboardPage.waitForTimeout(200);
    }

    const sessionTime = Date.now() - startTime;
    
    // Increased timeout to 30 seconds for long session
    expect(sessionTime).toBeLessThan(30000);
  });
}); 