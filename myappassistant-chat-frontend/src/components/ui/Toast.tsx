import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const ToastProvider = () => {
  const { t } = useTranslation();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
          border: '1px solid var(--toast-border)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
};

// Utility functions for showing toasts
export const showToast = {
  success: (message: string) => {
    import('react-hot-toast').then(({ toast }) => {
      toast.success(message);
    });
  },
  error: (message: string) => {
    import('react-hot-toast').then(({ toast }) => {
      toast.error(message);
    });
  },
  loading: (message: string) => {
    import('react-hot-toast').then(({ toast }) => {
      toast.loading(message);
    });
  },
  dismiss: () => {
    import('react-hot-toast').then(({ toast }) => {
      toast.dismiss();
    });
  },
}; 