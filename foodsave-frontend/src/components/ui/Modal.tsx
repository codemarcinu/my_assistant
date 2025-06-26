import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = React.memo(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Memoizacja funkcji obsługi Escape
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Memoizacja funkcji obsługi kliknięcia backdrop
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Memoizacja klas rozmiaru
  const sizeClasses = useMemo(() => ({
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  }), []);

  // Memoizacja klas modal
  const modalClasses = useMemo(() => {
    return cn(
      'relative w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
      'transform transition-all duration-300 ease-out',
      'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4',
      sizeClasses[size],
      className
    );
  }, [sizeClasses, size, className]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={modalClasses}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

Modal.displayName = 'Modal';

const ModalHeader: React.FC<ModalHeaderProps> = React.memo(({ children, className }) => {
  const headerClasses = useMemo(() => {
    return cn('flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700', className);
  }, [className]);

  return (
    <div className={headerClasses}>
      {children}
    </div>
  );
});

ModalHeader.displayName = 'ModalHeader';

const ModalContent: React.FC<ModalContentProps> = React.memo(({ children, className }) => {
  const contentClasses = useMemo(() => {
    return cn('p-6', className);
  }, [className]);

  return (
    <div className={contentClasses}>
      {children}
    </div>
  );
});

ModalContent.displayName = 'ModalContent';

const ModalFooter: React.FC<ModalFooterProps> = React.memo(({ children, className }) => {
  const footerClasses = useMemo(() => {
    return cn('flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700', className);
  }, [className]);

  return (
    <div className={footerClasses}>
      {children}
    </div>
  );
});

ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalHeader, ModalContent, ModalFooter }; 