'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore, useThemeStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { user, setAuth } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'preferences'>('profile');
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Profile
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [showCrop, setShowCrop] = useState(false);
  const [tempImage, setTempImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Language
  const [language, setLanguage] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en'
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      fetchConnections();
    }
  }, [isOpen, mounted]);

  const fetchConnections = async () => {
    try {
      const { data } = await api.get('/connections/list');
      setConnections(data.connections);
    } catch (error) {
      console.error('Failed to fetch connections');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updatedUser = { ...user, name, phone, profilePic };
      setAuth(updatedUser as any, token || '');
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = () => {
    setProfilePic(tempImage);
    setShowCrop(false);
    toast.success('Photo updated! Click Save Changes to apply.');
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    toast.success(`Language changed to ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Gujarati'}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const translations = {
    en: {
      settings: 'Settings',
      profile: 'Profile',
      account: 'Account',
      preferences: 'Preferences',
      saveChanges: 'Save Changes',
      changePassword: 'Change Password',
      theme: 'Theme',
      language: 'Language',
      connections: 'Connections',
    },
    hi: {
      settings: 'सेटिंग्स',
      profile: 'प्रोफ़ाइल',
      account: 'खाता',
      preferences: 'प्राथमिकताएं',
      saveChanges: 'परिवर्तन सहेजें',
      changePassword: 'पासवर्ड बदलें',
      theme: 'थीम',
      language: 'भाषा',
      connections: 'कनेक्शन',
    },
    gu: {
      settings: 'સેટિંગ્સ',
      profile: 'પ્રોફાઇલ',
      account: 'ખાતું',
      preferences: 'પસંદગીઓ',
      saveChanges: 'ફેરફારો સાચવો',
      changePassword: 'પાસવર્ડ બદલો',
      theme: 'થીમ',
      language: 'ભાષા',
      connections: 'કનેક્શન્સ',
    },
  };

  const t = translations[language as keyof typeof translations];

  if (!mounted || !isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
      />

      {/* Settings Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-slate-950 z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">{t.settings}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-4 border-b border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-sky-500 dark:bg-blue-700 text-white'
                : 'glass hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <i className="ri-user-line mr-2"></i>
            {t.profile}
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'account'
                ? 'bg-sky-500 dark:bg-blue-700 text-white'
                : 'glass hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <i className="ri-lock-line mr-2"></i>
            {t.account}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'preferences'
                ? 'bg-sky-500 dark:bg-blue-700 text-white'
                : 'glass hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <i className="ri-settings-3-line mr-2"></i>
            {t.preferences}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {profilePic ? (
                    <Image 
                      src={profilePic} 
                      alt="Profile" 
                      width={120} 
                      height={120} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-sky-200 dark:border-blue-800"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-sky-200 dark:border-blue-800">
                      {getInitials(name)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-sky-500 dark:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-sky-600 dark:hover:bg-blue-800 transition-colors shadow-lg"
                  >
                    <i className="ri-camera-line text-white text-xl"></i>
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{user?.name}</h3>
                  <p className="text-sm text-muted capitalize">{user?.role}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  placeholder="Enter phone number"
                />
              </div>

              {user?.role === 'student' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Class</label>
                    <input type="text" value={user?.class || ''} className="input" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Section</label>
                    <input type="text" value={user?.section || ''} className="input" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Roll</label>
                    <input type="text" value={user?.rollNumber || ''} className="input" disabled />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Saving...' : t.saveChanges}
              </button>
            </form>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="font-semibold text-lg">{t.changePassword}</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    minLength={6}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Changing...' : t.changePassword}
                </button>
              </form>

              <div className="card">
                <h3 className="font-semibold mb-3">{t.connections}</h3>
                <div className="flex items-center justify-between p-4 bg-sky-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <i className="ri-group-line text-2xl text-sky-600 dark:text-blue-400"></i>
                    <div>
                      <p className="font-semibold text-lg">{connections.length}</p>
                      <p className="text-sm text-muted">Total Connections</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              {/* Theme */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <i className={`${isDark ? 'ri-moon-line' : 'ri-sun-line'} text-2xl text-sky-600 dark:text-blue-400`}></i>
                    <div>
                      <p className="font-semibold">{t.theme}</p>
                      <p className="text-sm text-muted">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="px-4 py-2 bg-sky-500 dark:bg-blue-700 text-white rounded-lg hover:opacity-80"
                  >
                    Switch
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <i className="ri-global-line text-2xl text-sky-600 dark:text-blue-400"></i>
                    <p className="font-semibold">{t.language}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { code: 'en', name: 'English', flag: '🇬🇧' },
                    { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
                    { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                        language === lang.code
                          ? 'bg-sky-500 dark:bg-blue-700 text-white'
                          : 'glass hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-2xl">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      {language === lang.code && <i className="ri-check-line text-xl"></i>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Info */}
              <div className="card">
                <h3 className="font-semibold mb-3">Account Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Role</span>
                    <span className="font-medium capitalize">{user?.role}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crop Modal */}
      {showCrop && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Crop Photo</h3>
            <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-lg">
              <Image 
                src={tempImage} 
                alt="Crop" 
                fill
                className="object-cover"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCrop(false)}
                className="flex-1 px-4 py-2 glass rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                className="flex-1 px-4 py-2 bg-sky-500 dark:bg-blue-700 text-white rounded-lg hover:opacity-80"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
