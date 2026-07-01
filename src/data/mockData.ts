import { Campaign, Student, Registration } from '../types';

export const initialCampaigns: Campaign[] = [];

export const initialStudents: Student[] = [
  {
    id: 'std-001',
    name: 'Nguyễn Văn A',
    studentId: '0024415123',
    faculty: 'Khoa Công nghệ Thông tin',
    className: 'DK24CNTT',
    email: 'nguyenvana@dthu.edu.vn',
    phone: '0987654321',
    totalHours: 0,
    totalScore: 0,
    status: 'active',
    role: 'student'
  }
];

export const initialRegistrations: Registration[] = [];
