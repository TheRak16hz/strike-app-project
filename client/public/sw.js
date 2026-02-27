self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: "Strike - Recordatorio", body: "No olvides completar tus hábitos." };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Failed to parse push data as JSON:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/vite.svg',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: { url: self.location.origin }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Acciones Personalizadas de la Alerta (v3.0)
  if (event.action === 'complete') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Enviar mensaje a la ventana activa para hacer el Toggle via API
        for (const client of clientList) {
          if ('postMessage' in client) {
            client.postMessage({
              type: 'ACTION_COMPLETE',
              habitId: event.notification.data.habitId
            });
            return;
          }
        }
      })
    );
    return;
  }

  if (event.action === 'snooze') {
    // Comunicar a la app para manejar el pospuesto
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('postMessage' in client) {
            client.postMessage({
              type: 'ACTION_SNOOZE',
              habitId: event.notification.data.habitId
            });
            return;
          }
        }
      })
    );
    return;
  }

  // Click normal (Abrir la app)
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is open, focus it
      for (const client of clientList) {
        if (event.notification.data && client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow && event.notification.data && event.notification.data.url) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});
