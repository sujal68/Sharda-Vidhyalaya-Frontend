import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null });
  },
}));

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: typeof window !== 'undefined' ? localStorage.getItem('theme') === 'dark' : false,
  toggleTheme: () => set((state) => {
    const newTheme = !state.isDark;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
    return { isDark: newTheme };
  }),
}));

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));

interface LanguageState {
  language: 'en' | 'hi' | 'gu';
  setLanguage: (lang: 'en' | 'hi' | 'gu') => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: typeof window !== 'undefined' ? (localStorage.getItem('language') as 'en' | 'hi' | 'gu') || 'en' : 'en',
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
    set({ language: lang });
  },
}));

export const useTranslation = () => {
  const { language } = useLanguageStore();
  const translations = require('./translations').translations;

  const t = (key: string) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return { t, language };
};
