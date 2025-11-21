'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { socket, connectSocket } from '@/lib/socket';

export default function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    
    if (user?.id) {
      connectSocket(user.id);
      
      socket.on('receiveMessage', async (data) => {
        try {
          let senderName = 'Someone';
          let senderRole = 'user';
          
          try {
            const { data: connections } = await api.get('/connections/list');
            const sender = connections.connections.find((u: any) => u._id === data.sender);
            if (sender) {
              senderName = sender.name;
              senderRole = sender.role;
            }
          } catch (error) {
            console.error('Failed to fetch sender info');
          }
          
          const messageType = data.type === 'voice' ? 'voice message' : 'message';
          
          const newNotif = {
            _id: Date.now().toString(),
            title: `New ${messageType}`,
            message: `${senderName} (${senderRole}) sent you a ${messageType}`,
            type: 'message',
            isRead: false,
            createdAt: new Date().toISOString(),
            sender: data.sender
          };
          setNotifications(prev => [newNotif, ...prev]);
          toast.success(`New ${messageType} from ${senderName}!`);
        } catch (error) {
          console.error('Failed to process notification');
        }
      });

      socket.on('newConnection', (data) => {
        const newNotif = {
          _id: Date.now().toString(),
          title: 'Connection Request',
          message: `${data.name} wants to connect with you`,
          type: 'connection',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
      });
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark as read on server');
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All marked as read');
    try {
      await Promise.all(
        notifications
          .filter(n => !n.isRead)
          .map(n => api.put(`/notifications/${n._id}/read`).catch(() => {}))
      );
    } catch (error) {
      console.error('Failed to mark all as read on server');
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    toast.success('Notification deleted');
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch(type) {
      case 'message': return 'ri-message-3-line';
      case 'connection': return 'ri-group-line';
      case 'assignment': return 'ri-file-list-3-line';
      case 'marks': return 'ri-bar-chart-line';
      default: return 'ri-notification-3-line';
    }
  };

  return (
    <div className="container-12">
      <div className="grid-12">
        <div className="col-12">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="h3">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted mt-1">
                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-sky-500 dark:bg-blue-700 text-white'
                      : 'glass hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'unread'
                      ? 'bg-sky-500 dark:bg-blue-700 text-white'
                      : 'glass hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 rounded-lg glass hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <i className="ri-notification-3-line text-6xl mb-4 text-sky-500 dark:text-blue-400"></i>
                  <p>No notifications yet</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      if (notif.type === 'message' && notif.sender) {
                        markAsRead(notif._id);
                        window.location.href = '/messages';
                      }
                    }}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                      notif.type === 'message' ? 'cursor-pointer hover:scale-[1.02]' : ''
                    } ${
                      notif.isRead
                        ? 'bg-gray-50 dark:bg-slate-800/50'
                        : 'bg-sky-50 dark:bg-blue-900/20 border-l-4 border-sky-500 dark:border-blue-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-blue-900 flex items-center justify-center">
                      <i className={`${getIcon(notif.type)} text-2xl text-sky-600 dark:text-blue-400`}></i>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {notif.title}
                            {notif.type === 'message' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-blue-900 text-sky-700 dark:text-blue-300">
                                New
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted mt-1">{notif.message}</p>
                          <p className="text-xs text-muted mt-2">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif._id)}
                              className="px-3 py-1 text-sm rounded-lg bg-sky-500 dark:bg-blue-700 text-white hover:opacity-80"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif._id)}
                            className="w-8 h-8 rounded-lg glass hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
