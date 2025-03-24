"use client";

import { useEffect } from 'react';
import { useNotificationStore, NotificationType } from '@/store/notification-store';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5" />;
    case 'error':
      return <AlertCircle className="h-5 w-5" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5" />;
    case 'info':
      return <Info className="h-5 w-5" />;
    default:
      return null;
  }
};

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getIconStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`${getNotificationStyles(notification.type)} border rounded-md p-4 shadow-md flex items-start gap-3`}
          >
            <div className={getIconStyles(notification.type)}>
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm">{notification.message}</p>
            </div>
            {notification.dismissible && (
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook pour ajouter facilement des notifications
export function useNotification() {
  const { addNotification } = useNotificationStore();
  
  return {
    success: (message: string, options?: { duration?: number, dismissible?: boolean }) => {
      addNotification({ type: 'success', message, ...options });
    },
    error: (message: string, options?: { duration?: number, dismissible?: boolean }) => {
      addNotification({ type: 'error', message, ...options });
    },
    warning: (message: string, options?: { duration?: number, dismissible?: boolean }) => {
      addNotification({ type: 'warning', message, ...options });
    },
    info: (message: string, options?: { duration?: number, dismissible?: boolean }) => {
      addNotification({ type: 'info', message, ...options });
    }
  };
}