import { Campaign, Student, Registration } from '../types';

export const initialCampaigns: Campaign[] = [];

export const initialStudents: Student[] = [
  {
    id: 'std-001',
    name: 'NGUYỄN VĂN A',
    studentId: '0024415123',
    faculty: 'Khoa Công nghệ Thông tin',
    className: 'DK24CNTT',
    email: 'nguyenvana@dthu.edu.vn',
    phone: '0987654321',
    totalHours: 0,
    totalScore: 0,
    status: 'active',
    role: 'student',
    birthDate: '2004-05-18',
    gender: 'Nam',
    subBranch: 'Chi hội 24CNTT',
    major: 'Công nghệ Thông tin',
    idCard: '012345678912',
    address: 'Thành phố Cao Lãnh, Đồng Tháp',
    club: 'Đội Công tác xã hội',
    skills: ['Tình nguyện viên trực tiếp (hậu cần)', 'Thiết kế Canva', 'Ứng dụng AI sáng tạo'],
    otherSkill: 'Biết lập trình web cơ bản',
    aiTool: 'Gemini, ChatGPT',
    portfolioUrl: 'https://drive.google.com/file/d/sample',
    facebook: 'https://facebook.com/nguyenvana',
    tiktok: 'https://tiktok.com/@nguyenvana',
    ctxhAccumulated: 5,
    ctxhMissing: 10,
    aspiration: 'Mong muốn được đóng góp tích cực cho các hoạt động tình nguyện của Đội và rèn luyện kỹ năng mềm.'
  }
];

export const initialRegistrations: Registration[] = [];
