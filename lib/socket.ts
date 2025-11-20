import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://sharda-vidhyalaya.vercel.app/';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = (userId: string) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit('register', userId);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
