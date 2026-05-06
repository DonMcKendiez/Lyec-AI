export const APP_VERSION = '1.0.0';

/**
 * Simulates checking for updates.
 */
export async function checkForUpdates(): Promise<{ updateAvailable: boolean; latestVersion: string }> {
  return {
    updateAvailable: false,
    latestVersion: APP_VERSION
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
