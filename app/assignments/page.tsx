'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Assignments() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(user?.class || '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    section: '',
    dueDate: '',
    totalMarks: ''
  });

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    if (user?.role === 'student') {
      setSelectedClass(user.class || '');
    }
    fetchAssignments();
  }, [selectedClass]);

  const fetchAssignments = async () => {
    try {
      const params: any = {};
      if (selectedClass) params.class = selectedClass;
      if (user?.role === 'student' && user?.section) params.section = user.section;
      
      const { data } = await api.get('/assignments', { params });
      setAssignments(data.assignments);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/assignments/${editingId}`, formData);
        toast.success('Assignment updated successfully');
      } else {
        await api.post('/assignments', formData);
        toast.success('Assignment created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      fetchAssignments();
      setFormData({
        title: '',
        description: '',
        subject: '',
        class: '',
        section: '',
        dueDate: '',
        totalMarks: ''
      });
    } catch (error) {
      toast.error(editingId ? 'Failed to update assignment' : 'Failed to create assignment');
    }
  };

  const handleEdit = (assignment: any) => {
    setEditingId(assignment._id);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      class: assignment.class,
      section: assignment.section,
      dueDate: assignment.dueDate.split('T')[0],
      totalMarks: assignment.totalMarks.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    if (!confirm('All submissions will be lost. Delete anyway?')) return;
    
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const submitAssignment = async (assignmentId: string) => {
    try {
      await api.post(`/assignments/${assignmentId}/submit`, { files: [] });
      toast.success('Assignment submitted!');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to submit assignment');
    }
  };

  const getSubmissionStatus = (assignment: any) => {
    if (user?.role !== 'student') return null;
    const submission = assignment.submissions?.find((s: any) => s.student === user.id);
    return submission;
  };

  return (
    <div className="container-12 space-y-6">
      <div className="grid-12">
        <div className="col-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="h3">Assignments</h1>
            <div className="flex items-center gap-4">
              {user?.role !== 'student' && (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input w-32"
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              )}
              {(user?.role === 'teacher' || user?.role === 'admin') && (
                <button onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    description: '',
                    subject: '',
                    class: '',
                    section: '',
                    dueDate: '',
                    totalMarks: ''
                  });
                }} className="btn-primary">
                  {showForm ? 'Cancel' : '+ Create Assignment'}
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Assignment' : 'Create New Assignment'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Assignment Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[100px]"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    required
                  />
                  <select
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                </div>
                <button type="submit" className="btn-primary w-full">
                  {editingId ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((assignment) => {
              const submission = getSubmissionStatus(assignment);
              const isOverdue = new Date(assignment.dueDate) < new Date();
              
              return (
                <div key={assignment._id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold">{assignment.title}</h3>
                    {isOverdue && !submission && user?.role === 'student' && (
                      <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs">
                        Overdue
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted mb-3">{assignment.description}</p>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="flex items-center gap-1">
                      📚 {assignment.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      🏫 Class {assignment.class}-{assignment.section}
                    </span>
                    <span className="flex items-center gap-1">
                      📊 {assignment.totalMarks} marks
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                      {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-xs px-2 py-1 rounded bg-sky-100 dark:bg-blue-900 text-sky-700 dark:text-blue-300 hover:opacity-80"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(assignment._id)}
                            className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:opacity-80"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {user?.role === 'student' && (
                      submission ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600 dark:text-green-400">
                            ✓ Submitted
                          </span>
                          {submission.marks && (
                            <span className="px-2 py-1 rounded bg-sky-100 dark:bg-blue-900 text-sky-700 dark:text-blue-300 text-sm">
                              {submission.marks}/{assignment.totalMarks}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => submitAssignment(assignment._id)}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          Submit
                        </button>
                      )
                    )}

                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <span className="text-sm text-muted">
                        {assignment.submissions?.length || 0} submissions
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {assignments.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-muted">No assignments available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
