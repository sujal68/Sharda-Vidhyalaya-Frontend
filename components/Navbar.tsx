'use client';
import { useAuthStore, useSidebarStore, useTranslation } from '@/lib/store';
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
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg glass flex items-center justify-center">
        <i className="ri-notification-3-line text-lg sm:text-xl"></i>
      </div>
    );
  }

  return (
    <Link href="/notifications" className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg glass flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all">
      <i className="ri-notification-3-line text-lg sm:text-xl"></i>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { isCollapsed, toggleSidebar, setMobileOpen } = useSidebarStore();
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
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Left Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-lg glass flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
            >
              <i className="ri-menu-line text-lg sm:text-xl"></i>
            </button>
            
            {/* Desktop Sidebar Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex w-10 h-10 rounded-lg glass items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
              title="Toggle Sidebar"
            >
              <i className={`text-xl transition-transform duration-300 ${isCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'}`}></i>
            </button>
            
            {/* Logo */}
            <Logo className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
            
            {/* School Name */}
            <div>
              <h1 className="text-xs sm:text-sm md:text-base lg:text-xl font-bold text-sky-600 dark:text-blue-400 leading-tight">
                Sharda Vidhyalaya
              </h1>
              <p className="text-xs text-muted hidden lg:block">Excellence in Education</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            {/* User Profile - Hidden on small screens */}
            <div className="hidden lg:flex items-center gap-3 mr-4">
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

            {/* User Avatar - Visible on medium screens */}
            <div className="hidden md:flex lg:hidden">
              {(user as any)?.profilePic ? (
                <img
                  src={(user as any).profilePic}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-sky-200 dark:border-blue-800"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs border-2 border-sky-200 dark:border-blue-800">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Settings Button */}
            <Link
              href="/settings"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg glass flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-blue-400"
              title="Settings"
            >
              <i className="ri-settings-3-line text-lg sm:text-xl"></i>
            </Link>

            {/* Logout Button */}
            <button 
              onClick={handleLogout} 
              className="btn-primary text-xs sm:text-sm md:text-base px-2 py-1.5 sm:px-3 sm:py-2 md:px-6 md:py-2.5 whitespace-nowrap flex items-center gap-1 sm:gap-2"
              title="Logout"
            >
              {/* Icon only on very small screens */}
              <i className="ri-logout-box-line text-sm sm:text-base md:hidden"></i>
              {/* Text on small screens and up */}
              <span className="hidden md:inline">{t('logout')}</span>
              {/* Short text on small-medium screens */}
              <span className="hidden sm:inline md:hidden">Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}