'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore, useThemeStore, useLanguageStore, useTranslation } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function Settings() {
  const { user, setAuth } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { language: currentLang, setLanguage: setGlobalLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'preferences'>('profile');
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [showCrop, setShowCrop] = useState(false);
  const [tempImage, setTempImage] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>(currentLang);

  useEffect(() => {
    setMounted(true);
    setLanguage(currentLang);
    fetchConnections();
  }, [currentLang]);

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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      
      if (ctx) {
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
        
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        setProfilePic(croppedImage);
        setShowCrop(false);
        setZoom(1);
        setRotation(0);
        toast.success('Photo updated! Click Save Changes to apply.');
      }
    };
    
    img.src = tempImage;
  };

  const handleLanguageChange = (lang: 'en' | 'hi' | 'gu') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!mounted) return null;

  return (
    <div className="container-12 space-y-6 mt-6">
      <div className="grid-12">
        <div className="col-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="h3 mb-2">{t('settings')}</h1>
              <p className="text-muted">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
              title="Go Back"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="grid-12">
        <div className="col-12">
          <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'text-sky-500 dark:text-blue-400 border-b-2 border-sky-500 dark:border-blue-400'
                  : 'text-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className="ri-user-line mr-2"></i>
              {t('profile')}
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'account'
                  ? 'text-sky-500 dark:text-blue-400 border-b-2 border-sky-500 dark:border-blue-400'
                  : 'text-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className="ri-lock-line mr-2"></i>
              {t('account')}
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'preferences'
                  ? 'text-sky-500 dark:text-blue-400 border-b-2 border-sky-500 dark:border-blue-400'
                  : 'text-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className="ri-settings-3-line mr-2"></i>
              {t('preferences')}
            </button>
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="col-12 lg:col-8">
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Profile Information</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profilePic ? (
                      <Image 
                        src={profilePic} 
                        alt="Profile" 
                        width={100} 
                        height={100} 
                        className="w-24 h-24 rounded-full object-cover border-4 border-sky-200 dark:border-blue-800"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-sky-200 dark:border-blue-800">
                        {getInitials(name)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-sky-500 dark:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-sky-600 dark:hover:bg-blue-800 transition-colors"
                    >
                      <i className="ri-camera-line text-white"></i>
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted capitalize">{user?.role}</p>
                    <p className="text-xs text-muted mt-1">{user?.email}</p>
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Class</label>
                      <input type="text" value={user?.class || ''} className="input" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Section</label>
                      <input type="text" value={user?.section || ''} className="input" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Roll Number</label>
                      <input type="text" value={user?.rollNumber || ''} className="input" disabled />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? t('loading') : t('saveChanges')}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="col-12 lg:col-8">
            <div className="card">
              <h2 className="text-xl font-bold mb-6">{t('changePassword')}</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
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
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    minLength={6}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? t('loading') : t('changePassword')}
                </button>
              </form>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-bold mb-4">Your Connections</h2>
              <div className="flex items-center justify-between p-4 bg-sky-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-500 dark:bg-blue-700 rounded-full flex items-center justify-center">
                    <i className="ri-group-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{connections.length}</p>
                    <p className="text-sm text-muted">Total Connections</p>
                  </div>
                </div>
                <a href="/messages" className="text-sm text-sky-600 dark:text-blue-400 hover:underline">
                  View All →
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="col-12 lg:col-8">
            <div className="card space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-6">Preferences</h2>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-500 dark:bg-blue-700 rounded-full flex items-center justify-center">
                    <i className={`${isDark ? 'ri-moon-line' : 'ri-sun-line'} text-2xl text-white`}></i>
                  </div>
                  <div>
                    <p className="font-semibold">{t('theme')}</p>
                    <p className="text-sm text-muted">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-sky-500 dark:bg-blue-700 text-white rounded-lg hover:opacity-80 transition-opacity"
                >
                  Switch to {isDark ? 'Light' : 'Dark'}
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-sky-500 dark:bg-blue-700 rounded-full flex items-center justify-center">
                    <i className="ri-global-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <p className="font-semibold">{t('language')}</p>
                    <p className="text-sm text-muted">Choose your preferred language</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { code: 'en', name: 'English', flag: '🇬🇧' },
                    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
                    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        handleLanguageChange(lang.code as 'en' | 'hi' | 'gu');
                        setGlobalLanguage(lang.code as 'en' | 'hi' | 'gu');
                      }}
                      className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                        language === lang.code
                          ? 'bg-sky-500 dark:bg-blue-700 text-white'
                          : 'bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                      {language === lang.code && <i className="ri-check-line text-lg"></i>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold mb-4">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Role</span>
                    <span className="font-medium capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Account Status</span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="col-12 lg:col-4">
          <div className="card">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <i className="ri-message-3-line text-sky-600 dark:text-blue-400"></i>
                  <span className="text-sm">Messages</span>
                </div>
                <span className="font-bold text-sky-600 dark:text-blue-400">{connections.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCrop && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Crop & Adjust Photo</h3>
            <div className="relative w-full h-96 mb-4 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              <img 
                src={tempImage} 
                alt="Crop" 
                className="w-full h-full object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s'
                }}
              />
              <div className="absolute inset-0 border-2 border-dashed border-sky-500 dark:border-blue-400 pointer-events-none" />
            </div>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span><i className="ri-zoom-in-line mr-2"></i>Zoom</span>
                  <span className="text-sky-600 dark:text-blue-400">{Math.round(zoom * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span><i className="ri-rotate-lock-line mr-2"></i>Rotate</span>
                  <span className="text-sky-600 dark:text-blue-400">{rotation}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCrop(false);
                  setZoom(1);
                  setRotation(0);
                }}
                className="flex-1 px-4 py-2 glass rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <i className="ri-close-line mr-2"></i>Cancel
              </button>
              <button
                onClick={handleCropSave}
                className="flex-1 px-4 py-2 bg-sky-500 dark:bg-blue-700 text-white rounded-lg hover:opacity-80"
              >
                <i className="ri-check-line mr-2"></i>Save Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
