import { test, expect } from '../fixtures/test-fixtures';
import { testHelpers } from '../fixtures/test-fixtures';

test.describe('Quick Commands', () => {
  test('should display all quick commands', async ({ dashboardPage }) => {
    // Check that all quick commands are visible
    const commands = [
      'Zrobiłem zakupy',
      'Jaka pogoda na dzisiaj i najbliższe 3 dni',
      'Co na śniadanie?',
      'Co na obiad do pracy?',
      'Co mam do jedzenia?'
    ];

    for (const command of commands) {
      await expect(dashboardPage.locator(`[data-testid^="quick-command-"]:has-text("${command}")`)).toBeVisible();
    }
  });

  test('should execute "Zrobiłem zakupy" command', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-shopping"]');
    
    await expect(commandButton).toBeVisible();
    await commandButton.click();
    
    // Verify command was executed by checking for message in chat
    await testHelpers.expectQuickCommandTextVisible(dashboardPage, 'Zrobiłem zakupy');
  });

  test('should execute "Jaka pogoda" command', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-weather"]');
    
    await expect(commandButton).toBeVisible();
    await commandButton.click();
    
    // Verify command was executed
    await testHelpers.expectQuickCommandTextVisible(dashboardPage, 'Jaka pogoda na dzisiaj i najbliższe 3 dni');
  });

  test('should execute "Co na śniadanie?" command', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-breakfast"]');
    
    await expect(commandButton).toBeVisible();
    await commandButton.click();
    
    // Verify command was executed
    await testHelpers.expectQuickCommandTextVisible(dashboardPage, 'Co na śniadanie?');
  });

  test('should execute "Co na obiad do pracy?" command', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-lunch"]');
    
    await expect(commandButton).toBeVisible();
    await commandButton.click();
    
    // Verify command was executed
    await testHelpers.expectQuickCommandTextVisible(dashboardPage, 'Co na obiad do pracy?');
  });

  test('should execute "Co mam do jedzenia?" command', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-pantry"]');
    
    await expect(commandButton).toBeVisible();
    await commandButton.click();
    
    // Verify command was executed
    await testHelpers.expectQuickCommandTextVisible(dashboardPage, 'Co mam do jedzenia?');
  });

  test('should handle command button hover effects', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-shopping"]');
    
    // Hover over button
    await commandButton.hover();
    
    // Wait for hover effect (if implemented)
    await dashboardPage.waitForTimeout(200);
    
    // Verify button is still visible and clickable
    await expect(commandButton).toBeVisible();
    await expect(commandButton).toBeEnabled();
  });

  test('should handle multiple command executions', async ({ dashboardPage }) => {
    const commands = [
      'quick-command-shopping',
      'quick-command-weather',
      'quick-command-breakfast'
    ];

    for (const commandId of commands) {
      const commandButton = dashboardPage.locator(`[data-testid="${commandId}"]`);
      await expect(commandButton).toBeVisible();
      await commandButton.click();
      
      // Wait between commands
      await dashboardPage.waitForTimeout(500);
    }
  });

  test('should verify command icons are displayed', async ({ dashboardPage }) => {
    const commandButtons = dashboardPage.locator('[data-testid^="quick-command-"]');
    
    // Check that all command buttons have icons
    const count = await commandButtons.count();
    for (let i = 0; i < count; i++) {
      const button = commandButtons.nth(i);
      // Check for icon presence (Material UI icons are typically SVG elements)
      await expect(button.locator('svg')).toBeVisible();
    }
  });

  test('should verify command descriptions are displayed', async ({ dashboardPage }) => {
    const commands = [
      { id: 'shopping', text: 'Zrobiłem zakupy' },
      { id: 'weather', text: 'Jaka pogoda na dzisiaj i najbliższe 3 dni' },
      { id: 'breakfast', text: 'Co na śniadanie?' },
      { id: 'lunch', text: 'Co na obiad do pracy?' },
      { id: 'pantry', text: 'Co mam do jedzenia?' }
    ];

    for (const command of commands) {
      const commandButton = dashboardPage.locator(`[data-testid="quick-command-${command.id}"]`);
      await expect(commandButton).toContainText(command.text);
    }
  });

  test('should handle command button accessibility', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-shopping"]');
    
    // Check that button is keyboard accessible
    await commandButton.focus();
    await expect(commandButton).toBeFocused();
    
    // Check that button can be activated with Enter key
    await commandButton.press('Enter');
    
    // Verify command was executed
    await testHelpers.expectQuickCommandTextVisible(dashboardPage, 'Zrobiłem zakupy');
  });

  test('should verify command button styling', async ({ dashboardPage }) => {
    const commandButton = dashboardPage.locator('[data-testid="quick-command-shopping"]');
    
    // Check button styling (basic checks)
    await expect(commandButton).toBeVisible();
    await expect(commandButton).toHaveCSS('display', 'flex');
    
    // Check that button has proper spacing and layout
    const buttonBox = await commandButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThan(100);
    expect(buttonBox?.height).toBeGreaterThan(40);
  });
}); 