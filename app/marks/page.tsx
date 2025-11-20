'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Marks() {
  const { user } = useAuthStore();
  const [marks, setMarks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    examType: '',
    marks: '',
    totalMarks: '',
    grade: '',
    term: '',
    academicYear: '2024-25'
  });

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const { data } = await api.get('/marks');
      setMarks(data.marks);
    } catch (error) {
      toast.error('Failed to fetch marks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/marks', formData);
      toast.success('Marks added successfully');
      setShowForm(false);
      fetchMarks();
    } catch (error) {
      toast.error('Failed to add marks');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Marks</h1>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Marks'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Add Marks</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Student ID"
              value={formData.student}
              onChange={(e) => setFormData({ ...formData, student: e.target.value })}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Exam Type"
              value={formData.examType}
              onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
              className="input"
              required
            />
            <input
              type="number"
              placeholder="Marks"
              value={formData.marks}
              onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
              className="input"
              required
            />
            <input
              type="number"
              placeholder="Total Marks"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Grade"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Term"
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              className="input"
              required
            />
            <button type="submit" className="btn-primary col-span-2">Submit</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Marks List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-2">Student</th>
                <th className="text-left p-2">Subject</th>
                <th className="text-left p-2">Exam</th>
                <th className="text-left p-2">Marks</th>
                <th className="text-left p-2">Grade</th>
                <th className="text-left p-2">Term</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((mark) => (
                <tr key={mark._id} className="border-b dark:border-gray-700">
                  <td className="p-2">{mark.student?.name}</td>
                  <td className="p-2">{mark.subject}</td>
                  <td className="p-2">{mark.examType}</td>
                  <td className="p-2">{mark.marks}/{mark.totalMarks}</td>
                  <td className="p-2">{mark.grade}</td>
                  <td className="p-2">{mark.term}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
