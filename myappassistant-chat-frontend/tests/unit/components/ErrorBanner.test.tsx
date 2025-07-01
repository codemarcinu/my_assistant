import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBanner } from '@/components/chat/ErrorBanner';

describe('ErrorBanner', () => {
  const defaultProps = {
    error: 'Test error message',
    onRetry: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render error message', () => {
      render(<ErrorBanner {...defaultProps} />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render with error icon', () => {
      render(<ErrorBanner {...defaultProps} />);
      
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    it('should render retry and dismiss buttons when callbacks provided', () => {
      render(<ErrorBanner {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /spróbuj ponownie/i })).toBeInTheDocument();
      expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
    });

    it('should not render retry button when onRetry is not provided', () => {
      render(<ErrorBanner error="Test error" onDismiss={jest.fn()} />);
      
      expect(screen.queryByRole('button', { name: /spróbuj ponownie/i })).not.toBeInTheDocument();
      expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
    });

    it('should not render when error is null', () => {
      render(<ErrorBanner {...defaultProps} error={null} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });

    it('should not render when error is empty string', () => {
      render(<ErrorBanner {...defaultProps} error="" />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      render(<ErrorBanner {...defaultProps} onRetry={onRetry} />);
      
      fireEvent.click(screen.getByRole('button', { name: /spróbuj ponownie/i }));
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when close button is clicked', () => {
      const onDismiss = jest.fn();
      render(<ErrorBanner {...defaultProps} onDismiss={onDismiss} />);
      
      fireEvent.click(screen.getByTestId('CloseIcon').closest('button')!);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper alert role', () => {
      render(<ErrorBanner {...defaultProps} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      render(<ErrorBanner {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /spróbuj ponownie/i })).toHaveAccessibleName();
    });
  });

  describe('Material-UI Integration', () => {
    it('should use Material-UI Alert component', () => {
      render(<ErrorBanner {...defaultProps} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('MuiAlert-root');
      expect(alert).toHaveClass('MuiAlert-colorError');
    });

    it('should use Material-UI Button components', () => {
      render(<ErrorBanner {...defaultProps} />);
      
      const retryButton = screen.getByRole('button', { name: /spróbuj ponownie/i });
      expect(retryButton).toHaveClass('MuiButton-root');
    });
  });

  describe('Props and Configuration', () => {
    it('should handle different severity levels', () => {
      const { rerender } = render(<ErrorBanner {...defaultProps} severity="warning" />);
      expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();

      rerender(<ErrorBanner {...defaultProps} severity="info" />);
      expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();

      rerender(<ErrorBanner {...defaultProps} severity="error" />);
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<ErrorBanner {...defaultProps} title="Error Title" />);
      
      expect(screen.getByText('Error Title')).toBeInTheDocument();
    });

    it('should hide retry button when showRetry is false', () => {
      render(<ErrorBanner {...defaultProps} showRetry={false} />);
      
      expect(screen.queryByRole('button', { name: /spróbuj ponownie/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longError = 'A'.repeat(1000);
      render(<ErrorBanner {...defaultProps} error={longError} />);
      
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle HTML in error messages safely', () => {
      const htmlError = '<script>alert("xss")</script>Error message';
      render(<ErrorBanner {...defaultProps} error={htmlError} />);
      
      expect(screen.getByText(htmlError)).toBeInTheDocument();
      // Should not execute script
      expect(screen.queryByText('xss')).not.toBeInTheDocument();
    });

    it('should handle undefined callbacks gracefully', () => {
      render(<ErrorBanner error="Test error" />);
      
      // Should not throw when clicking close button without callback
      expect(() => {
        fireEvent.click(screen.getByTestId('CloseIcon').closest('button')!);
      }).not.toThrow();
    });
  });
}); 