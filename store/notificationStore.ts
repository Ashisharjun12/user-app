/**
 * notificationStore for Mobile App (User side)
 *   • Socket.IO connection for order status updates
 *   • Real-time persistent notifications history
 *   • Unread badge count for home/header
 */
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import api from '../api/api';

export const SOCKET_URL = 'https://opposite-delivery-news-pickup.trycloudflare.com';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    time: string;
    read: boolean;
    data?: any;
}

interface NotificationState {
    socket: Socket | null;
    isConnected: boolean;
    isConnecting: boolean;
    notifications: AppNotification[];
    unreadCount: number;
    hasMore: boolean;
    loading: boolean;
    page: number;

    connect: (userId: string) => void;
    disconnect: () => void;
    fetchNotifications: (page?: number, shouldAppend?: boolean) => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
    socket: null,
    isConnected: false,
    isConnecting: false,
    notifications: [],
    unreadCount: 0,
    hasMore: true,
    loading: false,
    page: 1,

    connect: (userId: string) => {
        const existing = get().socket;
        if (existing?.connected) return;

        set({ isConnecting: true });

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('[Socket][User] Connected:', socket.id);
            socket.emit('join_user', { userId });
            set({ isConnected: true, isConnecting: false });
        });

        socket.on('order_status_update', (data: any) => {
            console.log('[Socket][User] status_update:', data.status);
            // Refresh notifications on status change
            get().fetchNotifications();
        });

        socket.on('connect_error', () => {
            set({ isConnected: false, isConnecting: false });
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        set({ socket });
    },

    disconnect: () => {
        get().socket?.disconnect();
        set({ socket: null, isConnected: false, isConnecting: false });
    },

    fetchNotifications: async (pageNum = 1, shouldAppend = false) => {
        set({ loading: true });
        try {
            const res = await api.get(`/users/notifications?page=${pageNum}&limit=10`);
            const { notifications: rawNotifications, totalNotifications, totalPages } = res.data;
            
            const mapped = rawNotifications.map((n: any) => ({
                id: n._id,
                title: n.title,
                message: n.message,
                type: n.type,
                time: n.createdAt,
                read: n.isRead,
                data: n.data
            }));

            set(state => ({
                notifications: shouldAppend ? [...state.notifications, ...mapped] : mapped,
                unreadCount: totalNotifications,
                hasMore: pageNum < totalPages,
                page: pageNum,
                loading: false
            }));
        } catch (error) {
            console.error('[NotificationStore] Fetch error:', error);
            set({ loading: false });
        }
    },

    markRead: async (id: string) => {
        // Optimistic: Remove from list
        set(state => {
            const notifications = state.notifications.filter(n => n.id !== id);
            return {
                notifications,
                unreadCount: Math.max(0, state.unreadCount - 1)
            };
        });
        try {
            await api.put(`/users/notifications/${id}/read`);
        } catch (_) {}
    },

    markAllRead: async () => {
        // Optimistic update - clear local list
        set({
            notifications: [],
            unreadCount: 0
        });
        try {
            await api.put('/users/notifications/read-all');
        } catch (error) {
            console.error('[NotificationStore] Read-all failed:', error);
        }
    }
}));

export default useNotificationStore;
