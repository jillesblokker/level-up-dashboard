export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
    // Register the service worker
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  }
} 