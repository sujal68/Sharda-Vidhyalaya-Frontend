'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Attendance() {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{[key: string]: string}>({});

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/admin/users', {
        params: { role: 'student' }
      });
      const filtered = data.users.filter((s: any) => 
        s.class === selectedClass && s.section === selectedSection
      );
      setStudents(filtered);
      
      const initial: {[key: string]: string} = {};
      filtered.forEach((s: any) => {
        initial[s._id] = 'present';
      });
      setAttendanceData(initial);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/attendance');
      setAttendance(data.attendance);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    }
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select class and section');
      return;
    }

    try {
      await Promise.all(
        Object.entries(attendanceData).map(([studentId, status]) =>
          api.post('/attendance', {
            student: studentId,
            date: selectedDate,
            status
          })
        )
      );
      toast.success('Attendance marked successfully');
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const updateAttendance = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  return (
    <div className="container-12 space-y-8 py-6">
      <div className="grid-12">
        <div className="col-12">
          <div className="mb-8">
            <h1 className="h2 mb-2">📅 Attendance Management</h1>
            <p className="text-muted text-sm">Mark and track student attendance</p>
          </div>

          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <div className="card mb-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Mark Attendance</h2>
                <p className="text-muted text-sm">Select class, section, and date to mark attendance</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="input"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="input"
                  >
                    <option value="">Select Section</option>
                    {sections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {students.length > 0 && (
                <>
                  <div className="space-y-3 mb-8 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                    {students.map((student) => (
                      <div
                        key={student._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {student.rollNumber || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-base">{student.name}</p>
                            <p className="text-xs text-muted mt-1">
                              Roll No: {student.rollNumber} | Class {student.class}-{student.section}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                          {['present', 'absent', 'late', 'excused'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateAttendance(student._id, status)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                attendanceData[student._id] === status
                                  ? status === 'present'
                                    ? 'bg-green-500 text-white shadow-lg'
                                    : status === 'absent'
                                    ? 'bg-red-500 text-white shadow-lg'
                                    : status === 'late'
                                    ? 'bg-yellow-500 text-white shadow-lg'
                                    : 'bg-blue-500 text-white shadow-lg'
                                  : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmitAttendance}
                    className="btn-primary w-full py-4 text-lg"
                  >
                    <i className="ri-save-line mr-2"></i>
                    Submit Attendance
                  </button>
                </>
              )}

              {selectedClass && selectedSection && students.length === 0 && (
                <div className="text-center py-16 text-muted">
                  <i className="ri-user-search-line text-6xl mb-4 text-sky-500 dark:text-blue-400"></i>
                  <p className="text-lg">No students found in Class {selectedClass}-{selectedSection}</p>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">📋 Attendance Records</h2>
              <p className="text-muted text-sm">View recent attendance records</p>
            </div>
            
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <i className="ri-calendar-check-line text-7xl mb-6 text-sky-500 dark:text-blue-400"></i>
                <p className="text-xl font-semibold mb-2">No attendance records found</p>
                <p className="text-sm text-muted">Start by marking attendance above</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 whitespace-nowrap">Student</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 whitespace-nowrap">Class</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 whitespace-nowrap">Date</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {attendance.slice(0, 20).map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">{record.student?.name}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm">
                          {record.student?.class}-{record.student?.section}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              record.status === 'present'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : record.status === 'absent'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
