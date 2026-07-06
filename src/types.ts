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
  format?: 'Trực tiếp' | 'Trực tuyến';
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
  birthDate?: string; // Ngày sinh
  gender?: 'Nam' | 'Nữ' | string;
  subBranch?: string; // Chi hội
  major?: string; // Ngành học
  idCard?: string; // Số căn cước công dân
  address?: string; // Địa chỉ thường trú
  club?: string; // Tên câu lạc bộ/ đội/ nhóm bạn đang tham gia
  skills?: string[]; // Danh sách sở trường và kỹ năng bản thân
  otherSkill?: string; // Kỹ năng khác
  aiTool?: string; // Tên công cụ AI bạn sử dụng thành thạo nhất
  portfolioUrl?: string; // Sản phẩm đã thực hiện (link google drive, share link...)
  facebook?: string;
  tiktok?: string;
  otherSocial?: string;
  ctxhAccumulated?: number; // Số ngày CTXH đã tích lũy
  ctxhMissing?: number; // Số ngày CTXH còn thiếu
  aspiration?: string; // Nguyện vọng / Kỳ vọng cá nhân khi tham gia
  totalPerformanceScore?: number; // Tổng điểm Ban tổ chức đánh giá tích lũy
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
