import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ep_token');
    const socket = io('/', {
      path: '/socket.io',
      auth: token ? { token } : {},
      transports: ['polling', 'websocket'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  const joinEvent = (eventId) => socketRef.current?.emit('join:event', eventId);
  const leaveEvent = (eventId) => socketRef.current?.emit('leave:event', eventId);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinEvent, leaveEvent }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
