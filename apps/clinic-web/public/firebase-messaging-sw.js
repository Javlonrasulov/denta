/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker for Clinic CRM browser push.
// Keep messagingSenderId / apiKey in sync with NEXT_PUBLIC_FIREBASE_* env.

importScripts(
  'https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js',
);

firebase.initializeApp({
  apiKey: 'AIzaSyCPnHQQlavCqvrO9_Zjya1RemQe9Rw-XP0',
  authDomain: 'dentauz.firebaseapp.com',
  projectId: 'dentauz',
  storageBucket: 'dentauz.firebasestorage.app',
  messagingSenderId: '741284650128',
  appId: '1:741284650128:web:1a2a35244d71b4bb3e4c15',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'DENTA.UZ';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    data: payload.data || {},
  });
});
