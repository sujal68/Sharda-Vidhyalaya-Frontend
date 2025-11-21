'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  '1': ['English', 'Hindi / Gujarati', 'Maths', 'EVS (Environment Studies)', 'Drawing / Art', 'Computer Basics', 'Moral Education'],
  '2': ['English', 'Hindi / Gujarati', 'Maths', 'EVS', 'Drawing', 'Computer', 'Moral Education'],
  '3': ['English', 'Hindi / Gujarati', 'Maths', 'EVS', 'Computer', 'Art & Craft', 'Moral Science'],
  '4': ['English', 'Hindi / Gujarati', 'Maths', 'EVS', 'Computer', 'General Knowledge', 'Art & Craft', 'Moral Science'],
  '5': ['English', 'Hindi / Gujarati', 'Maths', 'Science', 'Social Science', 'Computer', 'GK', 'Art'],
  '6': ['English', 'Hindi / Gujarati', 'Maths', 'Science', 'Social Science', 'Sanskrit (optional)', 'Computer', 'GK', 'Art'],
  '7': ['English', 'Hindi / Gujarati', 'Maths', 'Science', 'Social Science', 'Sanskrit (optional)', 'Computer', 'GK', 'Art'],
  '8': ['English', 'Hindi / Gujarati', 'Maths', 'Science', 'Social Science', 'Sanskrit / Additional Language', 'Computer', 'GK'],
  '9': ['English', 'Hindi / Gujarati', 'Maths', 'Science (Physics + Chemistry + Biology)', 'Social Science', 'IT / Computer', 'Sanskrit (optional)'],
  '10': ['English', 'Hindi / Gujarati', 'Maths (Basic / Standard)', 'Science (Physics, Chemistry, Biology)', 'Social Science', 'Computer (optional)'],
  '11-Science': ['Physics', 'Chemistry', 'Maths / Biology', 'English', 'Computer Science', 'Physical Education (optional)'],
  '11-Commerce': ['Accountancy', 'Economics', 'Business Studies', 'English', 'Statistics', 'Computer (optional)'],
  '11-Arts': ['Sociology', 'Psychology', 'Geography', 'Political Science', 'English', 'Economics (optional)'],
  '12-Science': ['Physics', 'Chemistry', 'Maths / Biology', 'English', 'Computer Science', 'Physical Education (optional)'],
  '12-Commerce': ['Accountancy', 'Economics', 'Business Studies', 'Statistics', 'English', 'Computer (optional)'],
  '12-Arts': ['Geography', 'History', 'Sociology', 'Psychology', 'Political Science', 'English']
};

export default function Syllabus() {
  const { user } = useAuthStore();
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedStream, setSelectedStream] = useState('Science');
  const [showUpload, setShowUpload] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({ subject: '', class: '', file: null as File | null });

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const streams = ['Science', 'Commerce', 'Arts'];

  useEffect(() => {
    if (user?.class) setSelectedClass(user.class);
  }, [user]);

  useEffect(() => {
    fetchSyllabus();
  }, [selectedClass, selectedStream]);

  const fetchSyllabus = async () => {
    try {
      const classKey = ['11', '12'].includes(selectedClass) ? `${selectedClass}-${selectedStream}` : selectedClass;
      const { data } = await api.get('/syllabus', { params: { class: classKey } });
      setSyllabus(data.syllabus);
    } catch (error) {
      toast.error('Failed to fetch syllabus');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return toast.error('Please select a PDF file');

    const formData = new FormData();
    formData.append('pdf', uploadData.file);
    formData.append('subject', uploadData.subject);
    formData.append('class', ['11', '12'].includes(uploadData.class) ? `${uploadData.class}-${selectedStream}` : uploadData.class);

    try {
      await api.post('/syllabus/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editingSubject ? 'Syllabus updated successfully' : 'Syllabus uploaded successfully');
      setShowUpload(false);
      setEditingSubject(null);
      setUploadData({ subject: '', class: '', file: null });
      fetchSyllabus();
    } catch (error) {
      toast.error('Failed to upload syllabus');
    }
  };

  const handleEdit = (subject: string) => {
    setEditingSubject(subject);
    setUploadData({ subject, class: selectedClass, file: null });
    setShowUpload(true);
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/syllabus/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'syllabus.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this syllabus?')) return;
    try {
      await api.delete(`/syllabus/${id}`);
      toast.success('Syllabus deleted');
      fetchSyllabus();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const classKey = ['11', '12'].includes(selectedClass) ? `${selectedClass}-${selectedStream}` : selectedClass;
  const subjects = SUBJECTS_BY_CLASS[classKey] || [];
  const syllabusMap = new Map(syllabus.map(s => [s.subject, s]));

  return (
    <div className="container-12 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="h3">📚 Syllabus</h1>
        <div className="flex items-center gap-4">
          {user?.role !== 'student' && (
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input w-32">
              {classes.map(cls => <option key={cls} value={cls}>Std. {cls}</option>)}
            </select>
          )}
          {['11', '12'].includes(selectedClass) && (
            <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className="input w-32">
              {streams.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <button onClick={() => { setShowUpload(!showUpload); setEditingSubject(null); setUploadData({ subject: '', class: '', file: null }); }} className="btn-primary">
              {showUpload ? 'Cancel' : '+ Upload PDF'}
            </button>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">{editingSubject ? 'Edit Syllabus PDF' : 'Upload Syllabus PDF'}</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <select value={uploadData.class} onChange={(e) => setUploadData({ ...uploadData, class: e.target.value })} className="input" required disabled={!!editingSubject}>
              <option value="">Select Class</option>
              {classes.map(cls => <option key={cls} value={cls}>Std. {cls}</option>)}
            </select>
            {['11', '12'].includes(uploadData.class) && (
              <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className="input" required>
                {streams.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <select value={uploadData.subject} onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })} className="input" required disabled={!!editingSubject}>
              <option value="">Select Subject</option>
              {(SUBJECTS_BY_CLASS[uploadData.class && ['11', '12'].includes(uploadData.class) ? `${uploadData.class}-${selectedStream}` : uploadData.class] || []).map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            <input type="file" accept=".pdf" onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })} className="input" required />
            <button type="submit" className="btn-primary w-full">{editingSubject ? 'Update PDF' : 'Upload PDF'}</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">📘 Std. {selectedClass} {['11', '12'].includes(selectedClass) && `- ${selectedStream}`} Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const item = syllabusMap.get(subject);
            return (
              <div key={subject} className="p-4 rounded-lg border-2 border-sky-200 dark:border-blue-800 hover:border-sky-400 dark:hover:border-blue-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg">{subject}</h3>
                  {item?.pdfUrl && <span className="text-2xl">📄</span>}
                </div>
                {item ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted">PDF: {item.pdfName}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDownload(item._id)} className="px-3 py-1 rounded bg-sky-500 dark:bg-blue-600 text-white text-sm hover:opacity-80">
                        <i className="ri-download-line"></i> Download
                      </button>
                      {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <>
                          <button onClick={() => handleEdit(subject)} className="px-3 py-1 rounded bg-orange-500 text-white text-sm hover:opacity-80">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:opacity-80">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted">No PDF uploaded yet</p>
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <button onClick={() => handleEdit(subject)} className="px-3 py-1 rounded bg-sky-500 dark:bg-blue-600 text-white text-sm hover:opacity-80">
                        <i className="ri-upload-line"></i> Upload
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
