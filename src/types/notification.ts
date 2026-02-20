export interface AppNotification {
    id: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    [key: string]: any;
}
