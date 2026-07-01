export interface Campaign {
  id: string;
  title: string;
  description: string;
  department: string; // "Đoàn Thanh niên" | "Hội Sinh viên" | "Khoa CNTT" etc.
  date: string;
  slotsTotal: number;
  slotsRegistered: number;
  status: 'open' | 'closing_soon' | 'completed' | 'draft' | 'paused';
  score: number; // Ngày hoặc giờ tích luỹ
  scoreType: 'Ngày' | 'Giờ'; // Loại điểm tích lũy (Giờ công tác xã hội hoặc Ngày công tác xã hội)
  type: string; // Thể loại: "Tiếp sức mùa thi", "Tập huấn kỹ năng", "Mùa hè xanh", v.v.
  location: string;
  imageUrl?: string;
  skillsRequired?: string[];
}

export interface Student {
  id: string;
  name: string;
  studentId: string; // MSSV
  faculty: string; // Khoa
  className: string; // Lớp
  email: string;
  phone: string;
  totalHours: number;
  totalScore: number; // Điểm rèn luyện tích lũy từ tình nguyện
  status: 'active' | 'locked' | 'pending';
  role: 'student' | 'leader' | 'admin';
}

export interface Registration {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentFaculty: string;
  campaignId: string;
  campaignTitle: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  attendanceStatus: 'present' | 'absent' | 'excused' | 'none';
  performanceScore?: number; // Điểm đánh giá hiệu suất (1-10)
  certificateUrl?: string; // Giấy chứng nhận nếu có
}

export interface Statistics {
  totalStudents: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalHoursContributed: number;
  totalScoreAwarded: number;
}
