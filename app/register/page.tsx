'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student',
    studentClass: '',
    section: '',
    rollNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: any = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Indian mobile number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Student specific validations
    if (formData.role === 'student') {
      if (!formData.studentClass.trim()) {
        newErrors.class = 'Class is required for students';
      }
      if (!formData.section.trim()) {
        newErrors.section = 'Section is required for students';
      }
      if (!formData.rollNumber.trim()) {
        newErrors.rollNumber = 'Roll number is required for students';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 10) {
      setFormData({ ...formData, phone: value });
      if (errors.phone) {
        setErrors({ ...errors, phone: '' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting registration data:', formData);
      await api.post('/auth/register', formData);
      toast.success('Registration successful! Awaiting admin approval.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 to-blue-600 dark:from-blue-900 dark:to-blue-950 p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center p-2 shadow-lg">
            <Image src="/logo.PNG" alt="Sharda Vidhyalaya" width={64} height={64} className="rounded-full" priority />
          </div>
          <h1 className="text-3xl font-bold text-sky-600 dark:text-blue-400">
            Register - Sharda Vidhyalaya
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`input ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`input pl-12 ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              <p className="text-xs text-gray-500 mt-1">Enter 10-digit phone number</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <input
                    type="text"
                    value={formData.studentClass}
                    onChange={(e) => {
                      setFormData({ ...formData, studentClass: e.target.value });
                      if (errors.class) setErrors({ ...errors, class: '' });
                    }}
                    className={`input ${errors.class ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., 10th, 12th"
                  />
                  {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Section *</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => {
                      setFormData({ ...formData, section: e.target.value });
                      if (errors.section) setErrors({ ...errors, section: '' });
                    }}
                    className={`input ${errors.section ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., A, B, C"
                  />
                  {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Roll Number *</label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, rollNumber: e.target.value });
                      if (errors.rollNumber) setErrors({ ...errors, rollNumber: '' });
                    }}
                    className={`input ${errors.rollNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter roll number"
                  />
                  {errors.rollNumber && <p className="text-red-500 text-xs mt-1">{errors.rollNumber}</p>}
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </div>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-sky-600 dark:text-blue-400 hover:underline">
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
}