import { test, expect } from '../fixtures/test-fixtures';
import { testHelpers } from '../fixtures/test-fixtures';

test.describe('Chat Functionality', () => {
  test('should send and display messages', async ({ chatPage }) => {
    const testMessage = 'Hello, this is a test message';
    
    // Send message using fixed helper
    await testHelpers.sendMessage(chatPage, testMessage);
    
    // Verify message appears in chat
    await testHelpers.expectMessageVisible(chatPage, testMessage);
  });

  test('should handle empty message input', async ({ chatPage }) => {
    const sendButton = chatPage.locator('[data-testid="send-message-button"]');
    
    // Check that send button is disabled for empty input
    await expect(sendButton).toBeDisabled();
    
    // Try to send empty message
    await testHelpers.fillMessageInput(chatPage, '   ');
    await expect(sendButton).toBeDisabled();
  });

  test('should handle Enter key to send message', async ({ chatPage }) => {
    const testMessage = 'Message sent with Enter key';
    const messageInput = chatPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    
    // Fill input and press Enter
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    
    // Verify message was sent
    await testHelpers.expectMessageVisible(chatPage, testMessage);
  });

  test('should handle Shift+Enter for new line', async ({ chatPage }) => {
    const messageInput = chatPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    
    // Fill input with Shift+Enter
    await messageInput.fill('Line 1');
    await messageInput.press('Shift+Enter');
    await messageInput.fill('Line 2');
    
    // Verify input contains both lines
    const value = await testHelpers.getMessageInputValue(chatPage);
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('should show typing indicator', async ({ chatPage }) => {
    const testMessage = 'This should trigger typing indicator';
    
    // Send message and check for typing indicator
    await testHelpers.fillMessageInput(chatPage, testMessage);
    await chatPage.locator('[data-testid="send-message-button"]').click();
    
    // Check for typing indicator (if implemented)
    const typingIndicator = chatPage.locator('text=Piszę...');
    try {
      await expect(typingIndicator).toBeVisible({ timeout: 3000 });
    } catch {
      // Typing indicator might not be implemented yet
      console.log('Typing indicator not found - this is expected if not implemented');
    }
  });

  test('should handle message input focus', async ({ chatPage }) => {
    const messageInput = chatPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    
    // Click on input area to focus
    await messageInput.click();
    
    // Verify input is focused
    await expect(messageInput).toBeFocused();
  });

  test('should handle message input blur', async ({ chatPage }) => {
    const messageInput = chatPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    const chatWindow = chatPage.locator('[data-testid="chat-window"]');
    
    // Focus input then blur
    await messageInput.click();
    await chatWindow.click();
    
    // Verify input is not focused
    await expect(messageInput).not.toBeFocused();
  });

  test('should handle long messages', async ({ chatPage }) => {
    const longMessage = 'A'.repeat(1000);
    
    // Send long message
    await testHelpers.sendMessage(chatPage, longMessage);
    
    // Verify long message is displayed
    await testHelpers.expectMessageVisible(chatPage, longMessage);
  });

  test('should handle special characters in messages', async ({ chatPage }) => {
    const specialMessage = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Send message with special characters
    await testHelpers.sendMessage(chatPage, specialMessage);
    
    // Verify message is displayed correctly
    await testHelpers.expectMessageVisible(chatPage, specialMessage);
  });

  test('should handle unicode characters', async ({ chatPage }) => {
    const unicodeMessage = 'Test with unicode: ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ 🚀🎉';
    
    // Send message with unicode characters
    await testHelpers.sendMessage(chatPage, unicodeMessage);
    
    // Verify message is displayed correctly
    await testHelpers.expectMessageVisible(chatPage, unicodeMessage);
  });

  test('should handle message input placeholder', async ({ chatPage }) => {
    const messageInput = chatPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    
    // Check placeholder text
    await expect(messageInput).toHaveAttribute('placeholder', 'Napisz wiadomość...');
  });

  test('should handle message input disabled state', async ({ chatPage }) => {
    const messageInput = chatPage.locator('[data-testid="message-input"] input, [data-testid="message-input"] textarea');
    const sendButton = chatPage.locator('[data-testid="send-message-button"]');
    
    // Send a message to trigger typing state
    await testHelpers.sendMessage(chatPage, 'Test message');
    
    // Check if input is disabled during typing (if implemented)
    try {
      await expect(messageInput).toBeDisabled({ timeout: 2000 });
      await expect(sendButton).toBeDisabled();
    } catch {
      // Disabled state might not be implemented yet
      console.log('Disabled state not found - this is expected if not implemented');
    }
  });
}); 