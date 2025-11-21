'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useSidebarStore, useTranslation } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
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
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-sky-500 dark:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
      >
        <i className={isOpen ? 'ri-close-line' : 'ri-menu-line'}></i>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          glass border-r border-gray-200/50 dark:border-slate-800/50 h-[calc(100vh-5rem)] relative
          fixed md:sticky top-20 z-40 overflow-hidden transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: isCollapsed ? '80px' : `${sidebarWidth}px` }}
      >
        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="hidden md:block absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-sky-500 dark:hover:bg-blue-700 transition-colors group"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-sky-500 dark:bg-blue-700 rounded-l opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <nav className="p-4 space-y-2 h-full overflow-y-auto scrollbar-thin">
          {links
            .filter(link => link.roles.includes(user?.role || ''))
            .map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  pathname === link.href
                    ? 'bg-sky-500 dark:bg-blue-700 text-white shadow-lg'
                    : 'hover:bg-white/80 dark:hover:bg-slate-800/80'
                }`}
              >
                <i className={`${link.icon} text-xl`}></i>
                {!isCollapsed && (
                  <span className="font-medium">{t(link.labelKey)}</span>
                )}
              </Link>
            ))}
        </nav>
      </aside>
    </>
  );
}
