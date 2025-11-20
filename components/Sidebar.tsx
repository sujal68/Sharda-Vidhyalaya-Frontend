'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['student', 'teacher', 'admin'] },
    { href: '/marks', label: 'Marks', icon: '📊', roles: ['student', 'teacher', 'admin'] },
    { href: '/attendance', label: 'Attendance', icon: '✅', roles: ['student', 'teacher', 'admin'] },
    { href: '/assignments', label: 'Assignments', icon: '📝', roles: ['student', 'teacher', 'admin'] },
    { href: '/syllabus', label: 'Syllabus', icon: '📚', roles: ['student', 'teacher', 'admin'] },
    { href: '/messages', label: 'Messages', icon: '💬', roles: ['student', 'teacher', 'admin'] },
    { href: '/notifications', label: 'Notifications', icon: '🔔', roles: ['student', 'teacher', 'admin'] },
    { href: '/admin/approvals', label: 'Approvals', icon: '✅', roles: ['admin'] },
    { href: '/admin/users', label: 'Manage Users', icon: '👥', roles: ['admin'] },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-sky-500 dark:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 glass border-r border-gray-200/50 dark:border-slate-800/50 min-h-screen
        fixed md:sticky top-20 z-40 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <nav className="p-4 space-y-2">
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
                <span className="text-xl">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
        </nav>
      </aside>
    </>
  );
}
