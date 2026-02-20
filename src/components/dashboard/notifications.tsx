'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from '@/components/ui/popover';
import { 
    getNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from '@/services/notificationService';
import { AppNotification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Notifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        fetchNotifications(); // Re-fetch para atualizar a UI
    };
    
    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        fetchNotifications();
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Notificações</h3>
                </div>
                <div className="divide-y">
                    {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">Nenhuma notificação nova.</p>
                    ) : (
                       notifications.slice(0, 5).map(notif => (
                           <div key={notif.id} className={`p-3 ${!notif.isRead ? 'bg-blue-50' : ''}`}>
                               <Link href={notif.link || '#'} className="block" onClick={() => handleMarkAsRead(notif.id)}>
                                   <h4 className="font-semibold text-sm">{notif.title}</h4>
                                   <p className="text-sm text-gray-600">{notif.message}</p>
                                   <p className="text-xs text-gray-400 mt-1">
                                       {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                                   </p>
                               </Link>
                           </div>
                       ))
                    )}
                </div>
                {unreadCount > 0 && (
                    <div className="p-2 border-t bg-gray-50">
                        <Button variant="ghost" size="sm" className="w-full text-primary" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4"/>
                            Marcar todas como lidas
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
