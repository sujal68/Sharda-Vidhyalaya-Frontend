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
    <div className="container-12 space-y-8 py-6">
      <div className="grid-12">
        <div className="col-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="h2 mb-2">📝 Assignments</h1>
              <p className="text-muted text-sm">Manage and track assignments</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {user?.role !== 'student' && (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input w-full sm:w-40"
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
                }} className="btn-primary w-full sm:w-auto">
                  <i className={`${showForm ? 'ri-close-line' : 'ri-add-line'} mr-2`}></i>
                  {showForm ? 'Cancel' : 'Create Assignment'}
                </button>
              )}
            </div>
          </div>

          {/* Form Section */}
          {showForm && (
            <div className="card mb-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{editingId ? 'Edit Assignment' : 'Create New Assignment'}</h2>
                <p className="text-muted text-sm">Fill in the details to create an assignment</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Assignment Title</label>
                  <input
                    type="text"
                    placeholder="Enter assignment title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Enter assignment description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[120px]"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g., Mathematics"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Class</label>
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Section</label>
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2">Total Marks</label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-4 text-lg">
                  <i className="ri-save-line mr-2"></i>
                  {editingId ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </form>
            </div>
          )}

          {/* Assignments Grid */}
          {assignments.length === 0 ? (
            <div className="card">
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <i className="ri-file-list-3-line text-7xl mb-6 text-sky-500 dark:text-blue-400"></i>
                <p className="text-xl font-semibold mb-2">No assignments available</p>
                <p className="text-sm text-muted">Assignments will appear here once created</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assignments.map((assignment) => {
                const submission = getSubmissionStatus(assignment);
                const isOverdue = new Date(assignment.dueDate) < new Date();
                
                return (
                  <div key={assignment._id} className="card hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold pr-2">{assignment.title}</h3>
                      {isOverdue && !submission && user?.role === 'student' && (
                        <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-semibold whitespace-nowrap">
                          Overdue
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted mb-4 line-clamp-2">{assignment.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <i className="ri-book-line text-sky-500 dark:text-blue-400"></i> {assignment.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-school-line text-sky-500 dark:text-blue-400"></i> Class {assignment.class}-{assignment.section}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-bar-chart-line text-sky-500 dark:text-blue-400"></i> {assignment.totalMarks} marks
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        {(user?.role === 'teacher' || user?.role === 'admin') && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(assignment)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-blue-900 text-sky-700 dark:text-blue-300 hover:opacity-80 transition-opacity"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(assignment._id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:opacity-80 transition-opacity"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      {user?.role === 'student' && (
                        submission ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              <i className="ri-check-line"></i> Submitted
                            </span>
                            {submission.marks && (
                              <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-blue-900 text-sky-700 dark:text-blue-300 text-sm font-semibold">
                                {submission.marks}/{assignment.totalMarks}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => submitAssignment(assignment._id)}
                            className="btn-primary text-sm px-6 py-2 w-full sm:w-auto"
                          >
                            <i className="ri-upload-line mr-1"></i>
                            Submit
                          </button>
                        )
                      )}

                      {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <span className="text-sm text-muted">
                          <i className="ri-file-list-line mr-1"></i>
                          {assignment.submissions?.length || 0} submissions
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
