import { useNotificationStore } from '@/stores/notificationStore';

export function useNotification() {
  const { addNotification } = useNotificationStore();

  return {
    success: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'success', title, message, duration }),
    error: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration }),
    warning: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'warning', title, message, duration }),
    info: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'info', title, message, duration }),
    custom: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration?: number, action?: { label: string; onClick: () => void }) =>
      addNotification({ type, title, message, duration, action }),
  };
}
