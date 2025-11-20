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
      
      // Initialize attendance data
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
    <div className="container-12 space-y-6">
      <div className="grid-12">
        <div className="col-12">
          <h1 className="h3 mb-6">Attendance</h1>

          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
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

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input"
                />
              </div>

              {students.length > 0 && (
                <>
                  <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                    {students.map((student) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
                            {student.rollNumber || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-xs text-muted">
                              Roll No: {student.rollNumber} | Class {student.class}-{student.section}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {['present', 'absent', 'late', 'excused'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateAttendance(student._id, status)}
                              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                                attendanceData[student._id] === status
                                  ? status === 'present'
                                    ? 'bg-green-500 text-white'
                                    : status === 'absent'
                                    ? 'bg-red-500 text-white'
                                    : status === 'late'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-blue-500 text-white'
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
                    className="btn-primary w-full"
                  >
                    Submit Attendance
                  </button>
                </>
              )}

              {selectedClass && selectedSection && students.length === 0 && (
                <p className="text-center text-muted py-8">
                  No students found in Class {selectedClass}-{selectedSection}
                </p>
              )}
            </div>
          )}

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Attendance Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Class</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 20).map((record) => (
                    <tr key={record._id} className="border-b dark:border-gray-700">
                      <td className="p-2">{record.student?.name}</td>
                      <td className="p-2">
                        {record.student?.class}-{record.student?.section}
                      </td>
                      <td className="p-2">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
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
          </div>
        </div>
      </div>
    </div>
  );
}
