import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const { socket } = useSocket();

  const load = () => {
    api.get('/notifications?limit=8').then(({ data }) => { setNotifications(data.notifications); setUnread(data.unreadCount); });
  };
  useEffect(load, []);

  useEffect(() => {
    if (!socket) return;
    const onNotif = () => load();
    socket.on('notification:new', onNotif);
    return () => socket.off('notification:new', onNotif);
  }, [socket]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
        <Bell size={18} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon-500 text-[9px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-bold text-gray-500">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-maroon-600 hover:underline dark:text-gold-400">Mark all read</button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n._id} className={`rounded-lg p-2 text-xs ${!n.isRead ? 'bg-maroon-50 dark:bg-maroon-900/20' : ''}`}>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{n.title}</p>
                <p className="text-gray-500 dark:text-gray-400">{n.message}</p>
              </div>
            ))}
            {notifications.length === 0 && <p className="p-3 text-center text-xs text-gray-400">No notifications yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
