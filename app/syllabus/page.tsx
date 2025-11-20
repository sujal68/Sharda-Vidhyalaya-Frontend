'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Syllabus() {
  const { user } = useAuthStore();
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(user?.class || '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    class: '',
    section: '',
    term: '',
    academicYear: '2024-25',
    topics: [{ title: '', description: '', completed: false }]
  });

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    if (user?.role === 'student') {
      setSelectedClass(user.class || '');
    }
    fetchSyllabus();
  }, [selectedClass]);

  const fetchSyllabus = async () => {
    try {
      const params: any = {};
      if (selectedClass) params.class = selectedClass;
      if (user?.role === 'student' && user?.section) params.section = user.section;
      
      const { data } = await api.get('/syllabus', { params });
      setSyllabus(data.syllabus);
    } catch (error) {
      toast.error('Failed to fetch syllabus');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/syllabus/${editingId}`, formData);
        toast.success('Syllabus updated successfully');
      } else {
        await api.post('/syllabus', formData);
        toast.success('Syllabus added successfully');
      }
      setShowForm(false);
      setEditingId(null);
      fetchSyllabus();
      setFormData({
        subject: '',
        class: '',
        section: '',
        term: '',
        academicYear: '2024-25',
        topics: [{ title: '', description: '', completed: false }]
      });
    } catch (error) {
      toast.error(editingId ? 'Failed to update syllabus' : 'Failed to add syllabus');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item._id);
    setFormData({
      subject: item.subject,
      class: item.class,
      section: item.section,
      term: item.term,
      academicYear: item.academicYear,
      topics: item.topics
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;
    if (!confirm('This action cannot be undone. Delete anyway?')) return;
    
    try {
      await api.delete(`/syllabus/${id}`);
      toast.success('Syllabus deleted successfully');
      fetchSyllabus();
    } catch (error) {
      toast.error('Failed to delete syllabus');
    }
  };

  const addTopic = () => {
    setFormData({
      ...formData,
      topics: [...formData.topics, { title: '', description: '', completed: false }]
    });
  };

  const updateTopic = (index: number, field: string, value: any) => {
    const newTopics = [...formData.topics];
    newTopics[index] = { ...newTopics[index], [field]: value };
    setFormData({ ...formData, topics: newTopics });
  };

  const removeTopic = (index: number) => {
    if (formData.topics.length === 1) {
      toast.error('At least one topic is required');
      return;
    }
    const newTopics = formData.topics.filter((_, i) => i !== index);
    setFormData({ ...formData, topics: newTopics });
  };

  return (
    <div className="container-12 space-y-6">
      <div className="grid-12">
        <div className="col-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="h3">Syllabus</h1>
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
                    subject: '',
                    class: '',
                    section: '',
                    term: '',
                    academicYear: '2024-25',
                    topics: [{ title: '', description: '', completed: false }]
                  });
                }} className="btn-primary">
                  {showForm ? 'Cancel' : '+ Add Syllabus'}
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Syllabus' : 'Add New Syllabus'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    type="text"
                    placeholder="Term (e.g., Term 1)"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Topics</h3>
                    <button type="button" onClick={addTopic} className="text-sm text-sky-500 dark:text-blue-400">
                      + Add Topic
                    </button>
                  </div>
                  {formData.topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg flex-1">
                        <input
                          type="text"
                          placeholder="Topic Title"
                          value={topic.title}
                          onChange={(e) => updateTopic(index, 'title', e.target.value)}
                          className="input"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={topic.description}
                          onChange={(e) => updateTopic(index, 'description', e.target.value)}
                          className="input"
                        />
                      </div>
                      {formData.topics.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTopic(index)}
                          className="w-10 h-10 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button type="submit" className="btn-primary w-full">
                  {editingId ? 'Update Syllabus' : 'Add Syllabus'}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {syllabus.map((item) => (
              <div key={item._id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{item.subject}</h3>
                    <p className="text-sm text-muted">
                      Class {item.class} - {item.section} | {item.term}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-blue-900 text-sky-700 dark:text-blue-300 text-sm">
                    {item.academicYear}
                  </span>
                </div>

                {(user?.role === 'teacher' || user?.role === 'admin') && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 rounded-lg bg-sky-500 dark:bg-blue-700 text-white text-sm hover:opacity-80"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:opacity-80"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {item.topics.map((topic: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={topic.completed}
                        readOnly
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{topic.title}</p>
                        {topic.description && (
                          <p className="text-sm text-muted">{topic.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {syllabus.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-muted">No syllabus available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
