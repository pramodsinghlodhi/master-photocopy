import Swal from 'sweetalert2';
import { useToast } from './use-toast';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonColor?: string;
  cancelButtonColor?: string;
}

export interface SuccessToastOptions {
  title: string;
  description?: string;
}

export interface ErrorToastOptions {
  title: string;
  description?: string;
}

export function useConfirmationAlert() {
  const { toast } = useToast();

  const showConfirmation = async (options: ConfirmationOptions): Promise<boolean> => {
    const {
      title,
      message,
      confirmText = 'Yes, confirm!',
      cancelText = 'Cancel',
      type = 'warning',
      confirmButtonColor = '#3085d6',
      cancelButtonColor = '#d33'
    } = options;

    const result = await Swal.fire({
      title,
      text: message,
      icon: type,
      showCancelButton: true,
      confirmButtonColor,
      cancelButtonColor,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        confirmButton: 'swal2-confirm-btn',
        cancelButton: 'swal2-cancel-btn',
        popup: 'swal2-popup-custom'
      },
      buttonsStyling: false
    });

    return result.isConfirmed;
  };

  const showSuccessAlert = async (options: SuccessToastOptions & { showAlert?: boolean }) => {
    const { title, description, showAlert = false } = options;

    if (showAlert) {
      await Swal.fire({
        title,
        text: description,
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'swal2-confirm-btn',
          popup: 'swal2-popup-custom'
        },
        buttonsStyling: false
      });
    }

    // Always show toast
    toast({
      title,
      description,
      variant: 'default'
    });
  };

  const showErrorAlert = async (options: ErrorToastOptions & { showAlert?: boolean }) => {
    const { title, description, showAlert = false } = options;

    if (showAlert) {
      await Swal.fire({
        title,
        text: description,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'swal2-confirm-btn',
          popup: 'swal2-popup-custom'
        },
        buttonsStyling: false
      });
    }

    // Always show toast
    toast({
      title,
      description,
      variant: 'destructive'
    });
  };

  const confirmAndExecute = async (
    options: ConfirmationOptions,
    action: () => Promise<void> | void,
    successOptions?: SuccessToastOptions,
    errorOptions?: ErrorToastOptions
  ) => {
    try {
      const confirmed = await showConfirmation(options);
      
      if (confirmed) {
        await action();
        
        if (successOptions) {
          showSuccessAlert(successOptions);
        }
      }
    } catch (error: any) {
      console.error('Action failed:', error);
      
      const errorMessage = errorOptions || {
        title: 'Error',
        description: error.message || 'An unexpected error occurred'
      };
      
      showErrorAlert(errorMessage);
    }
  };

  return {
    showConfirmation,
    showSuccessAlert,
    showErrorAlert,
    confirmAndExecute,
    toast
  };
}