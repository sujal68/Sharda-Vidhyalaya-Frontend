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

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

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

  if (!mounted) return null;

  // Admin Dashboard
  if (user?.role === 'admin') {
    return (
      <div className="container-12 space-y-8 animate-fade-in">
        <div className="grid-12">
          <div className="col-12 glass rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="h2 mb-2">Welcome, {user?.name}</h1>
                <p className="text-muted">Admin Control Panel</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/notifications" className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all">
                  🔔
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-12">
          <div className="col-3">
            <StatCard icon="👥" label="Total Students" value={stats?.totalStudents || 0} color="sky" />
          </div>
          <div className="col-3">
            <StatCard icon="👨🏫" label="Total Teachers" value={stats?.totalTeachers || 0} color="green" />
          </div>
          <div className="col-3">
            <StatCard icon="📊" label="Total Marks" value={stats?.totalMarks || 0} color="purple" />
          </div>
          <div className="col-3">
            <StatCard icon="✅" label="Attendance Records" value={stats?.totalAttendance || 0} color="orange" />
          </div>
        </div>

        <div className="grid-12">
          <div className="col-4">
            <Link href="/admin/approvals" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">✅</div>
              <h4 className="h4 mb-2">User Approvals</h4>
              <p className="text-muted">Manage pending registrations</p>
            </Link>
          </div>
          <div className="col-4">
            <Link href="/admin/users" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">👥</div>
              <h4 className="h4 mb-2">Manage Users</h4>
              <p className="text-muted">View and edit all users</p>
            </Link>
          </div>
          <div className="col-4">
            <Link href="/marks" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="h4 mb-2">Marks System</h4>
              <p className="text-muted">View all student marks</p>
            </Link>
          </div>
        </div>

        <div className="grid-12">
          <div className="col-4">
            <Link href="/attendance" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">📅</div>
              <h4 className="h4 mb-2">Attendance</h4>
              <p className="text-muted">Track daily attendance</p>
            </Link>
          </div>
          <div className="col-4">
            <Link href="/syllabus" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">📚</div>
              <h4 className="h4 mb-2">Syllabus</h4>
              <p className="text-muted">Manage course content</p>
            </Link>
          </div>
          <div className="col-4">
            <Link href="/notifications" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">📢</div>
              <h4 className="h4 mb-2">Announcements</h4>
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
      <div className="container-12 space-y-8 animate-fade-in">
        <div className="grid-12">
          <div className="col-12 glass rounded-2xl p-8">
            <h1 className="h2 mb-2">Welcome, {user?.name}</h1>
            <p className="text-muted">Teacher Dashboard</p>
          </div>
        </div>

        <div className="grid-12">
          <div className="col-4">
            <StatCard icon="📊" label="Marks Entered" value={stats?.totalMarks || 0} color="sky" />
          </div>
          <div className="col-4">
            <StatCard icon="✅" label="Attendance Marked" value={stats?.totalAttendance || 0} color="green" />
          </div>
          <div className="col-4">
            <StatCard icon="📝" label="Assignments Created" value={stats?.totalAssignments || 0} color="purple" />
          </div>
        </div>

        <div className="grid-12">
          <div className="col-4">
            <Link href="/marks" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="h4 mb-2">Add Marks</h4>
              <p className="text-muted">Enter student marks</p>
            </Link>
          </div>
          <div className="col-4">
            <Link href="/attendance" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">✅</div>
              <h4 className="h4 mb-2">Mark Attendance</h4>
              <p className="text-muted">Daily attendance</p>
            </Link>
          </div>
          <div className="col-4">
            <Link href="/assignments" className="card block hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="h4 mb-2">Assignments</h4>
              <p className="text-muted">Create & grade</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="container-12 space-y-8 animate-fade-in">
      <div className="grid-12">
        <div className="col-12 bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-800 dark:to-blue-900 rounded-2xl p-8 text-white">
          <h1 className="h2 mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-lg opacity-90">Class {user?.class} - {user?.section} | Roll No: {user?.rollNumber}</p>
        </div>
      </div>

      <div className="grid-12">
        <div className="col-4">
          <StatCard icon="📊" label="My Marks" value={stats?.myMarks || 0} color="sky" />
        </div>
        <div className="col-4">
          <StatCard icon="✅" label="Attendance" value={stats?.myAttendance || 0} color="green" />
        </div>
        <div className="col-4">
          <StatCard icon="📝" label="Assignments" value={stats?.myAssignments || 0} color="purple" />
        </div>
      </div>

      <div className="grid-12">
        <div className="col-4">
          <Link href="/marks" className="card block hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="h4 mb-2">My Marks</h4>
            <p className="text-muted">View all marks</p>
          </Link>
        </div>
        <div className="col-4">
          <Link href="/attendance" className="card block hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">✅</div>
            <h4 className="h4 mb-2">Attendance</h4>
            <p className="text-muted">Check attendance</p>
          </Link>
        </div>
        <div className="col-4">
          <Link href="/assignments" className="card block hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">📝</div>
            <h4 className="h4 mb-2">Assignments</h4>
            <p className="text-muted">Submit work</p>
          </Link>
        </div>
      </div>

      <div className="grid-12">
        <div className="col-4">
          <Link href="/syllabus" className="card block hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">📚</div>
            <h4 className="h4 mb-2">Syllabus</h4>
            <p className="text-muted">Course content</p>
          </Link>
        </div>
        <div className="col-4">
          <Link href="/messages" className="card block hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">💬</div>
            <h4 className="h4 mb-2">Messages</h4>
            <p className="text-muted">Chat with teachers</p>
          </Link>
        </div>
        <div className="col-4">
          <Link href="/notifications" className="card block hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🔔</div>
            <h4 className="h4 mb-2">Notifications</h4>
            <p className="text-muted">View updates</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
