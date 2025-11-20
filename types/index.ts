export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  class?: string;
  section?: string;
  rollNumber?: string;
  subjects?: string[];
  isApproved: boolean;
}

export interface Marks {
  _id: string;
  student: User;
  subject: string;
  examType: string;
  marks: number;
  totalMarks: number;
  grade: string;
  remarks?: string;
  term: string;
  academicYear: string;
}

export interface Attendance {
  _id: string;
  student: User;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  section: string;
  dueDate: string;
  totalMarks: number;
  attachments?: string[];
  submissions: Array<{
    student: User;
    submittedAt: string;
    files: string[];
    marks?: number;
    feedback?: string;
  }>;
}

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  readBy: string[];
  createdAt: string;
}
