'use client';
import { useAuthStore, useThemeStore, useSidebarStore, useTranslation } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { socket, connectSocket } from '@/lib/socket';

function NotificationBell() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notifications');
        const unread = data.notifications.filter((n: any) => !n.readBy?.includes(user?.id)).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch notifications');
      }
    };

    fetchCount();

    if (user?.id) {
      connectSocket(user.id);
      socket.on('receiveMessage', () => {
        setUnreadCount(prev => prev + 1);
      });
    }
  }, [user, mounted]);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
        <i className="ri-notification-3-line text-xl"></i>
      </div>
    );
  }

  return (
    <Link href="/notifications" className="relative w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all">
      <i className="ri-notification-3-line text-xl"></i>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="glass border-b border-gray-200/50 dark:border-slate-800/50 sticky top-0 z-50">
      <div className="container-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex w-10 h-10 rounded-lg glass items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
              title="Toggle Sidebar"
            >
              <i className={`text-xl transition-transform duration-300 ${isCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'}`}></i>
            </button>
            <Logo className="w-8 h-8 md:w-10 md:h-10" />
            <div>
              <h1 className="text-base md:text-xl font-bold text-sky-600 dark:text-blue-400">Sharda Vidhyalaya</h1>
              <p className="text-xs text-muted hidden md:block">Excellence in Education</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-3 mr-2 md:mr-4 hidden sm:flex">
              <div className="text-right">
                <p className="font-semibold text-sm md:text-base">{user?.name}</p>
                <p className="text-xs text-muted capitalize">{user?.role}</p>
              </div>
              {(user as any)?.profilePic ? (
                <img 
                  src={(user as any).profilePic} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-sky-200 dark:border-blue-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-sky-200 dark:border-blue-800">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
            </div>
            
            <NotificationBell />
            
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
            >
              <i className={isDark ? 'ri-sun-line text-xl' : 'ri-moon-line text-xl'}></i>
            </button>
            
            <button onClick={handleLogout} className="btn-primary text-sm md:text-base px-3 py-2 md:px-6 md:py-3">
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
