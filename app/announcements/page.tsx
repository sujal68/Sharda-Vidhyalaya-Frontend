'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetClass: '',
    targetSection: '',
    type: 'info'
  });

  const classes = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['All', 'A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/notifications');
      setAnnouncements(data.notifications);
    } catch (error) {
      toast.error('Failed to fetch announcements');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notifications', {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetClass: formData.targetClass === 'All' ? null : formData.targetClass,
        targetSection: formData.targetSection === 'All' ? null : formData.targetSection
      });
      toast.success('Announcement sent successfully!');
      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        targetClass: '',
        targetSection: '',
        type: 'info'
      });
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to send announcement');
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'success': return 'ri-checkbox-circle-line';
      case 'warning': return 'ri-error-warning-line';
      case 'error': return 'ri-close-circle-line';
      default: return 'ri-information-line';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'success': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'error': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="container-12 space-y-8 py-6 px-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="h2 mb-2">📢 Announcements</h1>
          <p className="text-muted text-sm leading-relaxed">School-wide and class-specific announcements</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full sm:w-auto px-6 py-3 rounded-xl">
              <i className={`${showForm ? 'ri-close-line' : 'ri-add-line'} mr-2`}></i>
              {showForm ? 'Cancel' : 'New Announcement'}
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            title="Go Back"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="w-full">
          <div className="card max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Create Announcement</h2>
              <p className="text-muted text-sm">Send important updates to students</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Important Notice"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input min-h-[140px]"
                  placeholder="Enter your announcement message..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Class</label>
                  <select
                    value={formData.targetClass}
                    onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>
                        {cls === 'All' ? 'All Classes' : `Class ${cls}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Section</label>
                  <select
                    value={formData.targetSection}
                    onChange={(e) => setFormData({ ...formData, targetSection: e.target.value })}
                    className="input"
                    required
                    disabled={formData.targetClass === 'All'}
                  >
                    <option value="">Select Section</option>
                    {sections.map(sec => (
                      <option key={sec} value={sec}>
                        {sec === 'All' ? 'All Sections' : `Section ${sec}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Important</option>
                  </select>
                </div>
              </div>

              <div className="p-5 bg-sky-50 dark:bg-blue-900/20 rounded-xl border border-sky-200 dark:border-blue-800">
                <p className="text-sm leading-relaxed">
                  <i className="ri-information-line mr-2"></i>
                  This announcement will be sent to: 
                  <span className="font-semibold ml-1">
                    {formData.targetClass === 'All' ? 'All Students' : 
                     formData.targetClass && formData.targetSection ? 
                     `Class ${formData.targetClass}-${formData.targetSection}` : 
                     'Select class and section'}
                  </span>
                </p>
              </div>

              <button type="submit" className="btn-primary w-full py-4 text-lg rounded-xl">
                <i className="ri-send-plane-fill mr-2"></i>
                Send Announcement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="w-full">
        {announcements.length === 0 ? (
          <div className="card">
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <i className="ri-megaphone-line text-7xl mb-6 text-sky-500 dark:text-blue-400"></i>
              <p className="text-xl font-semibold mb-2">No announcements yet</p>
              <p className="text-sm text-muted">Announcements will appear here once created</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {announcements.map((announcement) => (
              <div key={announcement._id} className={`card border-l-4 hover:shadow-xl transition-shadow ${getTypeColor(announcement.type)}`}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${getTypeColor(announcement.type)}`}>
                    <i className={`${getTypeIcon(announcement.type)} text-3xl`}></i>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{announcement.title}</h3>
                        <p className="text-sm text-muted">
                          {new Date(announcement.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {announcement.targetClass && (
                          <span className="px-3 py-1.5 bg-sky-100 dark:bg-blue-900 text-sky-700 dark:text-blue-300 rounded-full text-xs font-semibold whitespace-nowrap">
                            <i className="ri-school-line mr-1"></i>
                            {announcement.targetClass === 'All' ? 'All Classes' : 
                             `Class ${announcement.targetClass}${announcement.targetSection ? `-${announcement.targetSection}` : ''}`}
                          </span>
                        )}
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getTypeColor(announcement.type)}`}>
                          {announcement.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {announcement.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
