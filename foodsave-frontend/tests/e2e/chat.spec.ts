import { test, expect } from '@playwright/test';

test.describe('Dashboard/Chat Page', () => {
  test('should display chat interface', async ({ page }) => {
    await page.goto('/');
    
    // Check if dashboard page is loaded with correct title
    await expect(page.getByRole('heading', { name: 'Czat AI' })).toBeVisible();
    await expect(page.getByText('Inteligentny asystent do zarządzania produktami i planowania posiłków')).toBeVisible();
    
    // Check if chat container is present with correct elements
    await expect(page.getByRole('heading', { name: 'FoodSave AI', exact: true })).toBeVisible();
    await expect(page.getByText('Online')).toBeVisible();
    await expect(page.getByText('Aktywny')).toBeVisible();
    
    // Check welcome message
    await expect(page.getByRole('heading', { name: 'Witaj w FoodSave AI!' })).toBeVisible();
    await expect(page.getByText('Jestem Twoim asystentem do zarządzania spiżarnią i zakupami.')).toBeVisible();
  });

  test('should send and display message', async ({ page }) => {
    await page.goto('/');
    
    // Type a message
    const messageInput = page.getByPlaceholder('Napisz wiadomość...');
    await messageInput.fill('Hello, AI!');
    
    // Send the message
    await page.getByRole('button', { name: /wyślij/i }).click();
    
    // Check if message is displayed
    await expect(page.getByText('Hello, AI!')).toBeVisible();
    
    // Check if AI response appears (should show typing indicator)
    await expect(page.getByText('AI pisze...')).toBeVisible();
  });

  test('should handle empty message', async ({ page }) => {
    await page.goto('/');
    
    // Try to send empty message - button should be disabled or not clickable
    const sendButton = page.getByRole('button', { name: /wyślij/i });
    await expect(sendButton).toBeDisabled();
    
    // Try to click empty input - should not send
    const messageInput = page.getByPlaceholder('Napisz wiadomość...');
    await messageInput.fill('');
    await sendButton.click();
    
    // Should not have any user messages
    await expect(page.getByText('Hello, AI!')).not.toBeVisible();
  });

  test('should navigate between pages using bottom navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Shopping page
    await page.getByRole('button', { name: 'Zakupy' }).click();
    await expect(page.getByRole('heading', { name: /historia zakupów/i })).toBeVisible();
    
    // Navigate to Products page
    await page.getByRole('button', { name: 'Produkty' }).click();
    await expect(page.getByRole('heading', { name: /spiżarnia|lista produktów/i })).toBeVisible();
    
    // Navigate to Settings page
    await page.getByRole('button', { name: 'Ustawienia' }).click();
    await expect(page.getByRole('heading', { name: /ustawienia/i })).toBeVisible();
    
    // Navigate back to Chat
    await page.getByRole('button', { name: 'Czat' }).click();
    await expect(page.getByRole('heading', { name: 'Czat AI' })).toBeVisible();
  });

  test('should show typing indicator when AI is responding', async ({ page }) => {
    await page.goto('/');
    
    // Send a message to trigger AI response
    const messageInput = page.getByPlaceholder('Napisz wiadomość...');
    await messageInput.fill('Test message');
    await page.getByRole('button', { name: /wyślij/i }).click();
    
    // Should show typing indicator
    await expect(page.getByText('AI pisze...')).toBeVisible();
    
    // Should show "Pisze..." in header
    await expect(page.getByText('Pisze...')).toBeVisible();
  });

  test('should display welcome message when no messages exist', async ({ page }) => {
    await page.goto('/');
    
    // Check welcome message elements
    await expect(page.getByRole('img', { name: /logo/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Witaj w FoodSave AI!' })).toBeVisible();
    await expect(page.getByText('Jestem Twoim asystentem do zarządzania spiżarnią i zakupami.')).toBeVisible();
    await expect(page.getByText('Jak mogę Ci dzisiaj pomóc?')).toBeVisible();
  });
}); 