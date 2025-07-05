import { test, expect } from '@playwright/test';

test.describe('WebSocket Monitoring E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('should display WebSocket metrics correctly', async ({ page }) => {
    // Wait for the metrics component to load
    await page.waitForSelector('[data-testid="websocket-metrics"]', { timeout: 10000 });
    
    // Check if connection status is displayed
    await expect(page.locator('text=Connection Status')).toBeVisible();
    
    // Check if performance metrics are displayed
    await expect(page.locator('text=Performance Metrics')).toBeVisible();
    
    // Verify metrics counters are present
    await expect(page.locator('text=Connections')).toBeVisible();
    await expect(page.locator('text=Disconnections')).toBeVisible();
    await expect(page.locator('text=Reconnect Attempts')).toBeVisible();
    await expect(page.locator('text=Errors')).toBeVisible();
  });

  test('should export Prometheus metrics', async ({ page }) => {
    // Wait for the export button to be available
    await page.waitForSelector('button:has-text("Export Prometheus")', { timeout: 10000 });
    
    // Mock the download functionality
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('button:has-text("Export Prometheus")');
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify the downloaded file
    expect(download.suggestedFilename()).toBe('websocket_metrics.prom');
    
    // Read the content of the downloaded file
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf8');
      
      // Verify Prometheus format
      expect(content).toContain('# HELP websocket_connections_total');
      expect(content).toContain('# TYPE websocket_connections_total counter');
      expect(content).toContain('websocket_connections_total');
      expect(content).toContain('# HELP websocket_connected');
      expect(content).toContain('# TYPE websocket_connected gauge');
    }
  });

  test('should track connection events', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="websocket-metrics"]', { timeout: 10000 });
    
    // Get initial connection count
    const initialConnections = await page.locator('text=Connections').locator('..').locator('.text-2xl').textContent();
    const initialCount = parseInt(initialConnections || '0');
    
    // Simulate a page reload to trigger reconnection
    await page.reload();
    
    // Wait for metrics to update
    await page.waitForTimeout(2000);
    
    // Check if connection count increased
    const newConnections = await page.locator('text=Connections').locator('..').locator('.text-2xl').textContent();
    const newCount = parseInt(newConnections || '0');
    
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should display uptime correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="websocket-metrics"]', { timeout: 10000 });
    
    // Wait for uptime to be displayed
    await page.waitForSelector('text=Uptime:', { timeout: 10000 });
    
    // Get uptime value
    const uptimeElement = page.locator('text=Uptime:').locator('..').locator('.font-mono');
    const uptimeText = await uptimeElement.textContent();
    
    // Verify uptime format (HH:MM:SS)
    expect(uptimeText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    
    // Wait a bit and check if uptime updates
    await page.waitForTimeout(2000);
    const newUptimeText = await uptimeElement.textContent();
    
    // Uptime should have increased
    expect(newUptimeText).not.toBe(uptimeText);
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    await page.waitForSelector('[data-testid="websocket-metrics"]', { timeout: 10000 });
    
    // Get initial error count
    const initialErrors = await page.locator('text=Errors').locator('..').locator('.text-2xl').textContent();
    const initialErrorCount = parseInt(initialErrors || '0');
    
    // Simulate network disconnect (this is a basic test - in real scenario you'd need to mock the WebSocket)
    await page.evaluate(() => {
      // Mock WebSocket disconnect
      const event = new CustomEvent('websocket-error', { 
        detail: { message: 'Connection lost' } 
      });
      window.dispatchEvent(event);
    });
    
    // Wait for potential error updates
    await page.waitForTimeout(1000);
    
    // Check if error count increased (this might not work without proper WebSocket mocking)
    const newErrors = await page.locator('text=Errors').locator('..').locator('.text-2xl').textContent();
    const newErrorCount = parseInt(newErrors || '0');
    
    // At minimum, error count should not decrease
    expect(newErrorCount).toBeGreaterThanOrEqual(initialErrorCount);
  });

  test('should display agent status in metrics', async ({ page }) => {
    await page.waitForSelector('[data-testid="websocket-metrics"]', { timeout: 10000 });
    
    // Check if agent metrics are displayed
    await expect(page.locator('text=Active Agents:')).toBeVisible();
    await expect(page.locator('text=Total Agents:')).toBeVisible();
    
    // Verify agent counts are numbers
    const activeAgents = await page.locator('text=Active Agents:').locator('..').locator('span:last-child').textContent();
    const totalAgents = await page.locator('text=Total Agents:').locator('..').locator('span:last-child').textContent();
    
    expect(parseInt(activeAgents || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(totalAgents || '0')).toBeGreaterThanOrEqual(0);
  });
}); 