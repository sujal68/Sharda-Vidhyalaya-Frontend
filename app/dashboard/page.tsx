'use client';
import { useAuthStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import api from '@/lib/api';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      if (user?.role === 'admin') {
        const [users, marks, attendance] = await Promise.all([
          api.get('/admin/users').catch(() => ({ data: { users: [] } })),
          api.get('/marks').catch(() => ({ data: { marks: [] } })),
          api.get('/attendance').catch(() => ({ data: { attendance: [] } }))
        ]);
        
        const students = users.data.users.filter((u: any) => u.role === 'student');
        const teachers = users.data.users.filter((u: any) => u.role === 'teacher');
        
        setStats({
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalMarks: marks.data.marks.length,
          totalAttendance: attendance.data.attendance.length
        });
      } else if (user?.role === 'teacher') {
        const [marks, attendance, assignments] = await Promise.all([
          api.get('/marks').catch(() => ({ data: { marks: [] } })),
          api.get('/attendance').catch(() => ({ data: { attendance: [] } })),
          api.get('/assignments').catch(() => ({ data: { assignments: [] } }))
        ]);
        
        setStats({
          totalMarks: marks.data.marks.length,
          totalAttendance: attendance.data.attendance.length,
          totalAssignments: assignments.data.assignments.length
        });
      } else {
        const [marks, attendance, assignments] = await Promise.all([
          api.get('/marks').catch(() => ({ data: { marks: [] } })),
          api.get('/attendance').catch(() => ({ data: { attendance: [] } })),
          api.get('/assignments').catch(() => ({ data: { assignments: [] } }))
        ]);
        
        setStats({
          myMarks: marks.data.marks.length,
          myAttendance: attendance.data.attendance.length,
          myAssignments: assignments.data.assignments.length
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  if (!mounted) {
    return <div className="container-12 py-8 px-4"><div className="text-center">Loading...</div></div>;
  }

  // Admin Dashboard
  if (user?.role === 'admin') {
    return (
      <div className="container-12 space-y-10 py-8 px-4 animate-fade-in">
        {/* Welcome Header */}
        <div className="glass rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                Welcome, {user?.name}
              </h1>
              <p className="text-muted text-lg">Admin Control Panel</p>
            </div>
            <Link href="/notifications" className="w-14 h-14 rounded-xl glass flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all hover:scale-110 shadow-lg">
              <i className="ri-notification-3-line text-2xl text-sky-600 dark:text-blue-400"></i>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon="ri-user-line" label="Total Students" value={stats?.totalStudents || 0} color="sky" />
          <StatCard icon="ri-user-star-line" label="Total Teachers" value={stats?.totalTeachers || 0} color="green" />
          <StatCard icon="ri-bar-chart-line" label="Total Marks" value={stats?.totalMarks || 0} color="purple" />
          <StatCard icon="ri-calendar-check-line" label="Attendance Records" value={stats?.totalAttendance || 0} color="orange" />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-slate-700"></div>

        {/* Main Action Tiles */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/approvals" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-sky-500/50">
                <i className="ri-checkbox-circle-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">User Approvals</h4>
              <p className="text-muted">Manage pending registrations</p>
            </Link>
            <Link href="/admin/users" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-600 dark:to-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-green-500/50">
                <i className="ri-group-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Manage Users</h4>
              <p className="text-muted">View and edit all users</p>
            </Link>
            <Link href="/marks" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-purple-500/50">
                <i className="ri-bar-chart-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Marks System</h4>
              <p className="text-muted">View all student marks</p>
            </Link>
            <Link href="/attendance" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-orange-500/50">
                <i className="ri-calendar-check-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Attendance</h4>
              <p className="text-muted">Track daily attendance</p>
            </Link>
            <Link href="/syllabus" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 dark:from-pink-600 dark:to-pink-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-pink-500/50">
                <i className="ri-book-open-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Syllabus</h4>
              <p className="text-muted">Manage course content</p>
            </Link>
            <Link href="/announcements" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-indigo-500/50">
                <i className="ri-megaphone-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Announcements</h4>
              <p className="text-muted">Send notifications</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Teacher Dashboard
  if (user?.role === 'teacher') {
    return (
      <div className="container-12 space-y-10 py-8 px-4 animate-fade-in">
        <div className="glass rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700/50">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
            Welcome, {user?.name}
          </h1>
          <p className="text-muted text-lg">Teacher Dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon="ri-bar-chart-line" label="Marks Entered" value={stats?.totalMarks || 0} color="sky" />
          <StatCard icon="ri-calendar-check-line" label="Attendance Marked" value={stats?.totalAttendance || 0} color="green" />
          <StatCard icon="ri-file-list-3-line" label="Assignments Created" value={stats?.totalAssignments || 0} color="purple" />
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700"></div>

        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/marks" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-sky-500/50">
                <i className="ri-bar-chart-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Add Marks</h4>
              <p className="text-muted">Enter student marks</p>
            </Link>
            <Link href="/attendance" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-600 dark:to-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-green-500/50">
                <i className="ri-calendar-check-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Mark Attendance</h4>
              <p className="text-muted">Daily attendance</p>
            </Link>
            <Link href="/assignments" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-purple-500/50">
                <i className="ri-file-list-3-line text-5xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Assignments</h4>
              <p className="text-muted">Create & grade</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="container-12 space-y-10 py-8 px-4 animate-fade-in">
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-md p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              Welcome, {user?.name}! 
              <i className="ri-hand-heart-line"></i>
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-base md:text-lg opacity-90">
              <span>Class {user?.class || 'N/A'}</span>
              <span className="hidden md:inline">•</span>
              <span>Section {user?.section || 'N/A'}</span>
              <span className="hidden md:inline">•</span>
              <span>Roll No: {user?.rollNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon="ri-bar-chart-line" label="My Marks" value={stats?.myMarks || 0} color="sky" />
        <StatCard icon="ri-calendar-check-line" label="Attendance" value={stats?.myAttendance || 0} color="green" />
        <StatCard icon="ri-file-list-3-line" label="Assignments" value={stats?.myAssignments || 0} color="purple" />
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700"></div>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/marks" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-sky-500/50">
              <i className="ri-bar-chart-line text-5xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold mb-2">My Marks</h4>
            <p className="text-muted">View all marks</p>
          </Link>
          <Link href="/attendance" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-600 dark:to-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-green-500/50">
              <i className="ri-calendar-check-line text-5xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold mb-2">Attendance</h4>
            <p className="text-muted">Check attendance</p>
          </Link>
          <Link href="/assignments" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-purple-500/50">
              <i className="ri-file-list-3-line text-5xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold mb-2">Assignments</h4>
            <p className="text-muted">Submit work</p>
          </Link>
          <Link href="/syllabus" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 dark:from-pink-600 dark:to-pink-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-pink-500/50">
              <i className="ri-book-open-line text-5xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold mb-2">Syllabus</h4>
            <p className="text-muted">Course content</p>
          </Link>
          <Link href="/messages" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-indigo-500/50">
              <i className="ri-message-3-line text-5xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold mb-2">Messages</h4>
            <p className="text-muted">Chat with teachers</p>
          </Link>
          <Link href="/notifications" className="group card hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[200px] flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-orange-500/50">
              <i className="ri-notification-3-line text-5xl text-white"></i>
            </div>
            <h4 className="text-xl font-bold mb-2">Notifications</h4>
            <p className="text-muted">View updates</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
