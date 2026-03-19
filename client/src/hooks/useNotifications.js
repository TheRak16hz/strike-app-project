import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notifications_enabled');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('notifications_enabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Intentando activar: pedir permiso si es necesario
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          toast.success('¡Notificaciones activadas!');
          return true;
        } else {
          setNotificationsEnabled(false);
          toast.error('Permiso de notificación denegado');
          return false;
        }
      }
    }
    
    // Si ya estaba activado o no hay soporte, simplemente toggle a false
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    if (newState) {
      toast.success('¡Notificaciones activadas!');
    } else {
      toast.error('Notificaciones desactivadas', {
        icon: '🔕'
      });
    }
    return newState;
  };

  return { notificationsEnabled, setNotificationsEnabled, toggleNotifications };
}
