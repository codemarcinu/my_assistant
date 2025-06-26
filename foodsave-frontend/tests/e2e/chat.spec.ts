import { test, expect } from '@playwright/test';

test.describe('Chat Page', () => {
  test('should display chat interface', async ({ page }) => {
    await page.goto('/');
    
    // Check if chat page is loaded
    await expect(page.getByText('Chat with FoodSave AI')).toBeVisible();
    await expect(page.getByText('Your intelligent assistant')).toBeVisible();
    
    // Check if chat container is present
    await expect(page.getByText('Conversation')).toBeVisible();
    await expect(page.getByText('AI Online')).toBeVisible();
  });

  test('should send and display message', async ({ page }) => {
    await page.goto('/');
    
    // Type a message
    const messageInput = page.getByPlaceholder('Type your message...');
    await messageInput.fill('Hello, AI!');
    
    // Send the message
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Check if message is displayed
    await expect(page.getByText('Hello, AI!')).toBeVisible();
    
    // Check if AI response appears (mock response)
    await expect(page.getByText(/I received your message/)).toBeVisible();
  });

  test('should handle empty message', async ({ page }) => {
    await page.goto('/');
    
    // Try to send empty message
    const sendButton = page.getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeDisabled();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to OCR page
    await page.getByRole('link', { name: 'OCR' }).click();
    await expect(page.getByText('Receipt Scanner')).toBeVisible();
    
    // Navigate to Weather page
    await page.getByRole('link', { name: 'Weather' }).click();
    await expect(page.getByText('Weather')).toBeVisible();
    
    // Navigate to Shopping page
    await page.getByRole('link', { name: 'Shopping' }).click();
    await expect(page.getByText('Shopping List')).toBeVisible();
    
    // Navigate to Settings page
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByText('Settings')).toBeVisible();
    
    // Navigate back to Chat
    await page.getByRole('link', { name: 'Chat' }).click();
    await expect(page.getByText('Chat with FoodSave AI')).toBeVisible();
  });
}); 