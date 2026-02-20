const NOTIFICATIONS_API_ROUTE = '/api/notifications';

async function parseResponseOrEmpty<T = any>(response: Response): Promise<T | []> {
  if (!response.ok) {
    console.error('[SERVICE_WARNING] Failed to fetch notifications:', response.statusText);
    return [];
  }
  return response.json();
}

export async function getNotifications() {
  const response = await fetch(NOTIFICATIONS_API_ROUTE, { cache: 'no-store' });
  return parseResponseOrEmpty(response);
}

export async function markNotificationAsRead(_id: string) {
  // Placeholder: the backend endpoint is not implemented yet.
  return;
}

export async function markAllNotificationsAsRead() {
  // Placeholder: the backend endpoint is not implemented yet.
  return;
}

export async function getAllNotifications() {
  const serverModule = await import('./notificationService.server');
  return serverModule.getAllNotifications();
}
