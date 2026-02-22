import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://opposite-delivery-news-pickup.trycloudflare.com';

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    connect: (userId: string) => void;
    disconnect: () => void;
}

const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,

    connect: (userId: string) => {
        const existing = get().socket;
        if (existing?.connected) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('[Socket][User] Connected:', socket.id);
            socket.emit('join_user', { userId });
            set({ isConnected: true });
        });

        socket.on('disconnect', () => {
            console.log('[Socket][User] Disconnected');
            set({ isConnected: false });
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        socket?.disconnect();
        set({ socket: null, isConnected: false });
    },
}));

export default useSocketStore;
