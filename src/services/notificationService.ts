export const APP_VERSION = '1.2.0';

/**
 * Simulates checking for updates. In a real app, this would fetch 
 * from a remote config or a static file on the server.
 */
export async function checkForUpdates(): Promise<{ updateAvailable: boolean; latestVersion: string }> {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const LATEST_VERSION = '1.3.1'; // Bumped version
  
  // Check if we've already acknowledged/seen this specific version
  const lastSeen = localStorage.getItem('lyec_last_update_seen');
  
  return {
    updateAvailable: (APP_VERSION as string) !== LATEST_VERSION && lastSeen !== LATEST_VERSION,
    latestVersion: LATEST_VERSION
  };
}

export function acknowledgeUpdate(version: string) {
  localStorage.setItem('lyec_last_update_seen', version);
}

/**
 * Notification helper
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') return true;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      ...options
    });
  }
}
