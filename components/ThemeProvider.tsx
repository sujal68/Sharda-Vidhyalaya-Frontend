'use client';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/lib/store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Sync class for Tailwind dark mode
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // Set CSS design tokens
    document.documentElement.style.setProperty('--sv-sky-500', '#0ea5e9');
    document.documentElement.style.setProperty('--sv-navy-900', '#071025');
    if (isDark) {
      document.documentElement.style.setProperty('--sv-glass', 'rgba(8,12,20,0.48)');
      document.documentElement.style.setProperty('--sv-bg', '#071025');
    } else {
      document.documentElement.style.setProperty('--sv-glass', 'rgba(255,255,255,0.6)');
      document.documentElement.style.setProperty('--sv-bg', '#ffffff');
    }
  }, [isDark, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return <>{children}</>;
}
