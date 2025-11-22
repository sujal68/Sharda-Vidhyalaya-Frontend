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
    <div className="container-12 space-y-8 py-6 px-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="h2 mb-2">📚 Syllabus</h1>
          <p className="text-muted text-sm">View and download subject syllabus</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {user?.role !== 'student' && (
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input w-full sm:w-40">
              {classes.map(cls => <option key={cls} value={cls}>Std. {cls}</option>)}
            </select>
          )}
          {['11', '12'].includes(selectedClass) && (
            <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className="input w-full sm:w-40">
              {streams.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <button onClick={() => { setShowUpload(!showUpload); setEditingSubject(null); setUploadData({ subject: '', class: '', file: null }); }} className="btn-primary w-full sm:w-auto">
              <i className={`${showUpload ? 'ri-close-line' : 'ri-upload-line'} mr-2`}></i>
              {showUpload ? 'Cancel' : 'Upload PDF'}
            </button>
          )}
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="card">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">{editingSubject ? 'Edit Syllabus PDF' : 'Upload Syllabus PDF'}</h2>
            <p className="text-muted text-sm">Select class, subject, and upload PDF file</p>
          </div>
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <select value={uploadData.class} onChange={(e) => setUploadData({ ...uploadData, class: e.target.value })} className="input" required disabled={!!editingSubject}>
                <option value="">Select Class</option>
                {classes.map(cls => <option key={cls} value={cls}>Std. {cls}</option>)}
              </select>
            </div>
            {['11', '12'].includes(uploadData.class) && (
              <div>
                <label className="block text-sm font-medium mb-2">Stream</label>
                <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className="input" required>
                  {streams.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select value={uploadData.subject} onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })} className="input" required disabled={!!editingSubject}>
                <option value="">Select Subject</option>
                {(SUBJECTS_BY_CLASS[uploadData.class && ['11', '12'].includes(uploadData.class) ? `${uploadData.class}-${selectedStream}` : uploadData.class] || []).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PDF File</label>
              <input type="file" accept=".pdf" onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })} className="input" required />
            </div>
            <button type="submit" className="btn-primary w-full py-4 text-lg">
              <i className="ri-upload-cloud-line mr-2"></i>
              {editingSubject ? 'Update PDF' : 'Upload PDF'}
            </button>
          </form>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="card">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">📘 Std. {selectedClass} {['11', '12'].includes(selectedClass) && `- ${selectedStream}`} Subjects</h2>
          <p className="text-muted text-sm">Download syllabus PDFs for each subject</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => {
            const item = syllabusMap.get(subject);
            return (
              <div key={subject} className="p-5 rounded-xl border-2 border-sky-200 dark:border-blue-800 hover:border-sky-400 dark:hover:border-blue-600 hover:shadow-lg transition-all bg-white/5 dark:bg-slate-900/40">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-base leading-tight pr-2">{subject}</h3>
                  {item?.pdfUrl && <span className="text-3xl">📄</span>}
                </div>
                {item ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted truncate" title={item.pdfName}>PDF: {item.pdfName}</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleDownload(item._id)} className="flex-1 px-4 py-2.5 rounded-lg bg-sky-500 dark:bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                        <i className="ri-download-line mr-1"></i> Download
                      </button>
                      {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <>
                          <button onClick={() => handleEdit(subject)} className="px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">No PDF uploaded yet</p>
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <button onClick={() => handleEdit(subject)} className="w-full px-4 py-2.5 rounded-lg bg-sky-500 dark:bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                        <i className="ri-upload-line mr-1"></i> Upload
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
