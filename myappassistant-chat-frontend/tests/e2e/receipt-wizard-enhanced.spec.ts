import { test, expect } from '../fixtures/test-fixtures';

test.describe('Enhanced Receipt Wizard - E2E Tests', () => {
  test('should load receipt wizard page successfully', async ({ page }) => {
    await page.goto('/ocr');
    
    // Check if the enhanced ReceiptWizard component is loaded
    await expect(page.locator('[data-testid="receipt-wizard"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
  });

  test('should display single-screen wizard interface', async ({ page }) => {
    await page.goto('/ocr');
    
    // Verify single-screen layout
    await expect(page.locator('[data-testid="wizard-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-section"]')).toBeVisible();
    
    // Check that all sections are in one view (no multi-step navigation)
    await expect(page.locator('[data-testid="step-navigation"]')).not.toBeVisible();
  });

  test('should handle image upload with immediate preview', async ({ page }) => {
    await page.goto('/ocr');
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    
    // Select test receipt image
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for immediate preview
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-image"]')).toBeVisible();
    
    // Check quality indicators appear
    await expect(page.locator('[data-testid="quality-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="sharpness-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="contrast-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="brightness-score"]')).toBeVisible();
  });

  test('should show contour detection overlay', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for contour detection
    await expect(page.locator('[data-testid="contour-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="contour-confidence"]')).toBeVisible();
    
    // Check contour confidence score
    const confidenceText = await page.locator('[data-testid="contour-confidence"]').textContent();
    expect(confidenceText).toMatch(/\d+%/);
  });

  test('should display real-time quality warnings', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload a low-quality image (if available)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Check for warnings section
    await expect(page.locator('[data-testid="quality-warnings"]')).toBeVisible();
    
    // Verify warning messages if quality is low
    const warnings = page.locator('[data-testid="warning-message"]');
    const warningCount = await warnings.count();
    
    if (warningCount > 0) {
      await expect(warnings.first()).toBeVisible();
      const warningText = await warnings.first().textContent();
      expect(warningText).toMatch(/blur|contrast|brightness|resolution/i);
    }
  });

  test('should show compression feedback', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Check compression feedback
    await expect(page.locator('[data-testid="compression-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="compression-ratio"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-size-reduction"]')).toBeVisible();
    
    // Verify compression ratio is displayed
    const ratioText = await page.locator('[data-testid="compression-ratio"]').textContent();
    expect(ratioText).toMatch(/\d+%/);
  });

  test('should process receipt and display results', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for processing
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
    
    // Wait for results
    await expect(page.locator('[data-testid="receipt-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="store-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
  });

  test('should allow inline editing of receipt items', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload and process image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for results
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    
    // Find first editable item
    const firstItem = page.locator('[data-testid="receipt-item"]').first();
    await expect(firstItem).toBeVisible();
    
    // Click edit button
    await firstItem.locator('[data-testid="edit-item-button"]').click();
    
    // Verify edit mode is active
    await expect(firstItem.locator('[data-testid="edit-mode"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="product-name-input"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="quantity-input"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="price-input"]')).toBeVisible();
  });

  test('should save inline edits successfully', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload and process image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for results
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    
    // Edit first item
    const firstItem = page.locator('[data-testid="receipt-item"]').first();
    await firstItem.locator('[data-testid="edit-item-button"]').click();
    
    // Modify product name
    const nameInput = firstItem.locator('[data-testid="product-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Edited Product Name');
    
    // Save changes
    await firstItem.locator('[data-testid="save-edit-button"]').click();
    
    // Verify edit mode is closed
    await expect(firstItem.locator('[data-testid="edit-mode"]')).not.toBeVisible();
    
    // Verify changes are saved
    await expect(firstItem.locator('text=Edited Product Name')).toBeVisible();
  });

  test('should cancel inline edits', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload and process image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for results
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    
    // Get original text
    const firstItem = page.locator('[data-testid="receipt-item"]').first();
    const originalText = await firstItem.locator('[data-testid="product-name"]').textContent();
    
    // Edit item
    await firstItem.locator('[data-testid="edit-item-button"]').click();
    
    // Modify product name
    const nameInput = firstItem.locator('[data-testid="product-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Temporary Edit');
    
    // Cancel changes
    await firstItem.locator('[data-testid="cancel-edit-button"]').click();
    
    // Verify edit mode is closed
    await expect(firstItem.locator('[data-testid="edit-mode"]')).not.toBeVisible();
    
    // Verify original text is restored
    await expect(firstItem.locator(`text=${originalText}`)).toBeVisible();
  });

  test('should handle multiple item edits', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload and process image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for results
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    
    // Edit multiple items
    const items = page.locator('[data-testid="receipt-item"]');
    const itemCount = await items.count();
    
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = items.nth(i);
      await item.locator('[data-testid="edit-item-button"]').click();
      
      // Verify only one item is in edit mode at a time
      const editModes = page.locator('[data-testid="edit-mode"]');
      const editModeCount = await editModes.count();
      expect(editModeCount).toBe(1);
      
      // Cancel edit
      await item.locator('[data-testid="cancel-edit-button"]').click();
    }
  });

  test('should validate inline edit inputs', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload and process image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for results
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    
    // Edit first item
    const firstItem = page.locator('[data-testid="receipt-item"]').first();
    await firstItem.locator('[data-testid="edit-item-button"]').click();
    
    // Try invalid price
    const priceInput = firstItem.locator('[data-testid="price-input"]');
    await priceInput.clear();
    await priceInput.fill('-5.00');
    
    // Try to save
    await firstItem.locator('[data-testid="save-edit-button"]').click();
    
    // Verify validation error
    await expect(firstItem.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(firstItem.locator('text=Price must be positive')).toBeVisible();
  });

  test('should show processing progress', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Check progress indicators
    await expect(page.locator('[data-testid="processing-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-step"]')).toBeVisible();
    
    // Verify progress steps
    const steps = page.locator('[data-testid="processing-step"]');
    await expect(steps.first()).toContainText('Uploading');
    await expect(steps.nth(1)).toContainText('Processing');
    await expect(steps.nth(2)).toContainText('Analyzing');
  });

  test('should handle processing errors gracefully', async ({ page }) => {
    await page.goto('/ocr');
    
    // Mock network error by uploading invalid file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    
    // Create invalid file
    const invalidFile = new File(['invalid content'], 'invalid.txt', { type: 'text/plain' });
    await fileChooser.setFiles(invalidFile);
    
    // Check error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Invalid file type')).toBeVisible();
    
    // Verify retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should provide keyboard shortcuts for editing', async ({ page }) => {
    await page.goto('/ocr');
    
    // Upload and process image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test_receipt.jpg');
    
    // Wait for results
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    
    // Test Enter key to edit
    const firstItem = page.locator('[data-testid="receipt-item"]').first();
    await firstItem.click();
    await page.keyboard.press('Enter');
    
    // Verify edit mode is activated
    await expect(firstItem.locator('[data-testid="edit-mode"]')).toBeVisible();
    
    // Test Escape key to cancel
    await page.keyboard.press('Escape');
    
    // Verify edit mode is closed
    await expect(firstItem.locator('[data-testid="edit-mode"]')).not.toBeVisible();
  });

  test('should maintain responsive design on different screen sizes', async ({ page }) => {
    await page.goto('/ocr');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="receipt-wizard"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="receipt-wizard"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="receipt-wizard"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
  });

  test('should support drag and drop file upload', async ({ page }) => {
    await page.goto('/ocr');
    
    // Get drop zone
    const dropZone = page.locator('[data-testid="drop-zone"]');
    await expect(dropZone).toBeVisible();
    
    // Create test file
    const testFile = new File(['test content'], 'test_receipt.jpg', { type: 'image/jpeg' });
    
    // Simulate drag and drop
    await dropZone.dispatchEvent('drop', {
      dataTransfer: {
        files: [testFile]
      }
    });
    
    // Verify file was accepted
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });

  test('should show accessibility features', async ({ page }) => {
    await page.goto('/ocr');
    
    // Check ARIA labels
    await expect(page.locator('[aria-label="Upload receipt image"]')).toBeVisible();
    await expect(page.locator('[aria-label="Quality analysis"]')).toBeVisible();
    await expect(page.locator('[aria-label="Receipt processing progress"]')).toBeVisible();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="upload-button"]')).toBeFocused();
    
    // Check screen reader support
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should handle large file uploads', async ({ page }) => {
    await page.goto('/ocr');
    
    // Create large file (simulate)
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large_receipt.jpg', { type: 'image/jpeg' });
    
    // Upload large file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(largeFile);
    
    // Check file size warning
    await expect(page.locator('[data-testid="file-size-warning"]')).toBeVisible();
    await expect(page.locator('text=File is large')).toBeVisible();
    
    // Verify compression is applied
    await expect(page.locator('[data-testid="compression-info"]')).toBeVisible();
  });

  test('should support batch processing', async ({ page }) => {
    await page.goto('/ocr');
    
    // Enable batch mode
    await page.locator('[data-testid="batch-mode-toggle"]').click();
    
    // Upload multiple files
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="upload-button"]').click();
    const fileChooser = await fileChooserPromise;
    
    const files = [
      new File(['content1'], 'receipt1.jpg', { type: 'image/jpeg' }),
      new File(['content2'], 'receipt2.jpg', { type: 'image/jpeg' }),
      new File(['content3'], 'receipt3.jpg', { type: 'image/jpeg' })
    ];
    
    await fileChooser.setFiles(files);
    
    // Verify batch processing
    await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="batch-item"]')).toHaveCount(3);
  });
}); 