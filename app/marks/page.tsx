'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Marks() {
  const { user } = useAuthStore();
  const [marks, setMarks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    rollNumber: '',
    class: '',
    section: '',
    subject: '',
    examType: '',
    marks: '',
    totalMarks: '',
    grade: '',
    term: '',
    academicYear: '2024-25'
  });

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D'];
  const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer'];
  const examTypes = ['Unit Test', 'Mid Term', 'Final', 'Practical'];
  const terms = ['Term 1', 'Term 2'];

  useEffect(() => {
    fetchMarks();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  const fetchMarks = async () => {
    try {
      const { data } = await api.get('/marks');
      setMarks(data.marks);
    } catch (error) {
      toast.error('Failed to fetch marks');
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/admin/users', {
        params: { role: 'student', class: selectedClass, section: selectedSection }
      });
      setStudents(data.users.filter((u: any) => u.role === 'student'));
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const student = students.find(s => s._id === e.target.value);
    if (student) {
      setFormData({
        ...formData,
        studentId: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        class: student.class,
        section: student.section
      });
    }
  };

  const calculateGrade = (marks: number, total: number) => {
    const percentage = (marks / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const grade = calculateGrade(parseInt(formData.marks), parseInt(formData.totalMarks));
    try {
      await api.post('/marks', { ...formData, grade, student: formData.studentId });
      toast.success('Marks added successfully');
      setShowForm(false);
      setFormData({
        studentId: '',
        studentName: '',
        rollNumber: '',
        class: '',
        section: '',
        subject: '',
        examType: '',
        marks: '',
        totalMarks: '',
        grade: '',
        term: '',
        academicYear: '2024-25'
      });
      setSelectedClass('');
      setSelectedSection('');
      fetchMarks();
    } catch (error) {
      toast.error('Failed to add marks');
    }
  };

  return (
    <div className="container-12 space-y-6 mt-6">
      <div className="grid-12">
        <div className="col-12">
          <div className="flex justify-between items-center">
            <h1 className="h3">Marks Management</h1>
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                {showForm ? 'Cancel' : '+ Add Marks'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="grid-12">
          <div className="col-12 lg:col-8">
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Add Student Marks</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Class & Section Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="input"
                      required
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
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Student Selection */}
                {selectedClass && selectedSection && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Student</label>
                    <select
                      value={formData.studentId}
                      onChange={handleStudentSelect}
                      className="input"
                      required
                    >
                      <option value="">Choose Student</option>
                      {students.map(student => (
                        <option key={student._id} value={student._id}>
                          {student.rollNumber} - {student.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Student Info Display */}
                {formData.studentId && (
                  <div className="p-4 bg-sky-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted">Name:</span>
                        <p className="font-semibold">{formData.studentName}</p>
                      </div>
                      <div>
                        <span className="text-muted">Roll No:</span>
                        <p className="font-semibold">{formData.rollNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted">Class:</span>
                        <p className="font-semibold">{formData.class}-{formData.section}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Marks Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Exam Type</label>
                    <select
                      value={formData.examType}
                      onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select Exam</option>
                      {examTypes.map(exam => (
                        <option key={exam} value={exam}>{exam}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Marks Obtained</label>
                    <input
                      type="number"
                      value={formData.marks}
                      onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                      className="input"
                      placeholder="85"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Total Marks</label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                      className="input"
                      placeholder="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Grade (Auto)</label>
                    <input
                      type="text"
                      value={formData.marks && formData.totalMarks ? calculateGrade(parseInt(formData.marks), parseInt(formData.totalMarks)) : ''}
                      className="input bg-gray-100 dark:bg-slate-800"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Term</label>
                    <select
                      value={formData.term}
                      onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select Term</option>
                      {terms.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Academic Year</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full">
                  <i className="ri-save-line mr-2"></i>
                  Save Marks
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="grid-12">
        <div className="col-12">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Marks Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left p-3">Roll No</th>
                    <th className="text-left p-3">Student Name</th>
                    <th className="text-left p-3">Class</th>
                    <th className="text-left p-3">Subject</th>
                    <th className="text-left p-3">Exam Type</th>
                    <th className="text-left p-3">Marks</th>
                    <th className="text-left p-3">Grade</th>
                    <th className="text-left p-3">Term</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark) => (
                    <tr key={mark._id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="p-3">{mark.student?.rollNumber}</td>
                      <td className="p-3 font-medium">{mark.student?.name}</td>
                      <td className="p-3">{mark.student?.class}-{mark.student?.section}</td>
                      <td className="p-3">{mark.subject}</td>
                      <td className="p-3">{mark.examType}</td>
                      <td className="p-3">
                        <span className="font-semibold">{mark.marks}</span>
                        <span className="text-muted">/{mark.totalMarks}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          mark.grade === 'A+' || mark.grade === 'A' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                          mark.grade === 'B+' || mark.grade === 'B' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                          mark.grade === 'C' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }`}>
                          {mark.grade}
                        </span>
                      </td>
                      <td className="p-3">{mark.term}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {marks.length === 0 && (
                <div className="text-center py-12 text-muted">
                  <i className="ri-file-list-line text-5xl mb-3 text-sky-500 dark:text-blue-400"></i>
                  <p>No marks records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
