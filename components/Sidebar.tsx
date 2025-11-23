'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useSidebarStore, useTranslation } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= window.innerWidth * 0.5) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!mounted) return null;

  const links = [
    { href: '/dashboard', labelKey: 'dashboard', icon: 'ri-dashboard-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/marks', labelKey: 'marks', icon: 'ri-bar-chart-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/attendance', labelKey: 'attendance', icon: 'ri-calendar-check-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/assignments', labelKey: 'assignments', icon: 'ri-file-list-3-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/syllabus', labelKey: 'syllabus', icon: 'ri-book-open-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/announcements', labelKey: 'announcements', icon: 'ri-megaphone-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/messages', labelKey: 'messages', icon: 'ri-message-3-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/notifications', labelKey: 'notifications', icon: 'ri-notification-3-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/settings', labelKey: 'settings', icon: 'ri-settings-3-line', roles: ['student', 'teacher', 'admin'] },
    { href: '/admin/approvals', labelKey: 'approvals', icon: 'ri-checkbox-circle-line', roles: ['admin'] },
    { href: '/admin/users', labelKey: 'manageUsers', icon: 'ri-group-line', roles: ['admin'] },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          glass border-r border-gray-200/50 dark:border-slate-800/50 
          fixed md:sticky top-0 md:top-20 left-0 z-50 md:z-40
          h-screen md:h-[calc(100vh-5rem)]
          transition-transform duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{ width: isCollapsed ? '80px' : `${sidebarWidth}px` }}
      >
        {/* Mobile Header */}
        <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-gray-200/50 dark:border-slate-800/50">
          <span className="font-bold text-lg text-sky-600 dark:text-blue-400">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="hidden md:block absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-sky-500 dark:hover:bg-blue-700 transition-colors group"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-sky-500 dark:bg-blue-700 rounded-l opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        <nav className="p-3 space-y-2 h-[calc(100%-4rem)] md:h-full overflow-y-auto scrollbar-thin">
          {links
            .filter(link => link.roles.includes(user?.role || ''))
            .map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all group ${pathname === link.href
                    ? 'bg-sky-500 dark:bg-blue-600 text-white shadow-md shadow-sky-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-blue-400'
                  }`}
              >
                <i className={`${link.icon} text-xl shrink-0`}></i>
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {t(link.labelKey)}
                  </span>
                )}
              </Link>
            ))}
        </nav>
      </aside>
    </>
  );
}
