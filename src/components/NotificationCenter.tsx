import { useNotificationStore } from '@/stores/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationCenter() {
  const { notifications, removeNotification } = useNotificationStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
      default:
        return 'text-blue-900';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md w-full px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`mb-3 rounded-lg border p-4 ${getBackgroundColor(notification.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${getTextColor(notification.type)}`}>
                  {notification.title}
                </h3>
                <p className={`text-sm mt-1 ${getTextColor(notification.type)} opacity-90`}>
                  {notification.message}
                </p>
                {notification.action && (
                  <div className="mt-3">
                    <Button
                      onClick={notification.action.onClick}
                      size="sm"
                      className={`text-xs h-7 ${
                        notification.type === 'success'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : notification.type === 'error'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : notification.type === 'warning'
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {notification.action.label}
                    </Button>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className={`flex-shrink-0 ${getTextColor(notification.type)} hover:opacity-70 transition-opacity`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
