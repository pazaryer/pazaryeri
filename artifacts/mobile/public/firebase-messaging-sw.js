/* eslint-disable no-undef */
/* Firebase Cloud Messaging — arka plan bildirimleri */
importScripts('https://www.gstatic.com/firebasejs/11.3.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.3.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB6W3BBz1_SpD-jp8dcpvFTjeBwnZlw4Dg',
  authDomain: 'pazaryeri0.firebaseapp.com',
  projectId: 'pazaryeri0',
  storageBucket: 'pazaryeri0.firebasestorage.app',
  messagingSenderId: '445495602976',
  appId: '1:445495602976:web:a9d405b30d0cab7d85f145',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Pazaryeri';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = '/favicon.ico';
  self.registration.showNotification(title, {
    body,
    icon,
    badge: icon,
    data: payload.data || {},
    tag: payload.data?.type || 'pazaryeri',
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let path = '/notifications';
  if (data.type === 'message' && data.conversationId) {
    path = `/chat/${data.conversationId}`;
  } else if (data.listingId) {
    path = `/listing/${data.listingId}`;
  } else if (data.screen === 'explore') {
    path = '/kesfet';
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(path);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(path);
    }),
  );
});
