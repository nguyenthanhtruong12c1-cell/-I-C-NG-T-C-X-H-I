import React, { useState, useEffect } from 'react';
import StudentView from './components/StudentView';
import AdminView from './components/AdminView';
import { Campaign, Student, Registration, Statistics } from './types';
import { initialCampaigns, initialStudents, initialRegistrations } from './data/mockData';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { 
  GraduationCap, 
  Award, 
  Heart, 
  Info, 
  Users, 
  Shield, 
  LogIn, 
  LogOut, 
  Lock, 
  UserCheck, 
  Check, 
  UserPlus, 
  Sparkles,
  Calendar,
  MapPin,
  AlertCircle,
  FileText,
  X,
  Download,
  QrCode,
  Clock,
  BookOpen
} from 'lucide-react';

const STORAGE_KEY_CAMPAIGNS = 'vol_portal_campaigns';
const STORAGE_KEY_STUDENTS = 'vol_portal_students';
const STORAGE_KEY_REGISTRATIONS = 'vol_portal_registrations';
const STORAGE_KEY_CURRENT_USER = 'vol_portal_current_user';
const STORAGE_KEY_ROLE = 'vol_portal_role';

const AVAILABLE_SKILLS = [
  'Trực tiếp',
  'Trực tuyến'
];

export default function App() {
  // Session States
  const [currentUser, setCurrentUser] = useState<Student | { id: string; name: string; role: 'admin' } | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRole] = useState<'student' | 'admin'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE);
    return saved ? (saved as 'student' | 'admin') : 'student';
  });
  
  // App States
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    return saved ? JSON.parse(saved) : initialCampaigns;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
    return saved ? JSON.parse(saved) : initialRegistrations;
  });

  // Login Form States
  const [loginTab, setLoginTab] = useState<'student' | 'admin'>('student');
  const [loginStudentId, setLoginStudentId] = useState('');
  const [loginAdminUser, setLoginAdminUser] = useState('');
  const [loginAdminPass, setLoginAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sign Up Form States (for dynamic empty state/new profile creation)
  const [showSignUp, setShowSignUp] = useState(false);
  const [regName, setRegName] = useState('');
  const [regId, setRegId] = useState('');
  const [regFaculty, setRegFaculty] = useState('Khoa Giáo dục Tiểu học - Mầm non');
  const [regClass, setRegClass] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('Nam');
  const [regSubBranch, setRegSubBranch] = useState('');
  const [regMajor, setRegMajor] = useState('');
  const [regIdCard, setRegIdCard] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regClub, setRegClub] = useState('');
  const [regSkills, setRegSkills] = useState<string[]>([]);
  const [regOtherSkill, setRegOtherSkill] = useState('');
  const [regAiTool, setRegAiTool] = useState('');
  const [regPortfolioUrl, setRegPortfolioUrl] = useState('');
  const [regFacebook, setRegFacebook] = useState('');
  const [regTikTok, setRegTikTok] = useState('');
  const [regOtherSocial, setRegOtherSocial] = useState('');
  const [regCtxhAccumulated, setRegCtxhAccumulated] = useState('');
  const [regCtxhMissing, setRegCtxhMissing] = useState('');
  const [regAspiration, setRegAspiration] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Custom alert modal state
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Campaign ID detected from scanned QR Code Link
  const [qrCampaignId, setQrCampaignId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    return action === 'register' ? params.get('campaignId') : null;
  });

  // Firestore Real-time Synchronization
  useEffect(() => {
    const unsubscribeCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      const list: Campaign[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Campaign);
      });
      setCampaigns(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'campaigns');
    });

    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      if (snapshot.empty) {
        // Set local state immediately so UI is interactive while seeding
        setStudents(initialStudents);
        // Seed initialStudents to database if empty
        initialStudents.forEach((student) => {
          setDoc(doc(db, 'students', student.id), student).catch((err) => {
            handleFirestoreError(err, OperationType.CREATE, `students/${student.id}`);
          });
        });
      } else {
        const list: Student[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Student);
        });
        setStudents(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'students');
    });

    const unsubscribeRegistrations = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      const list: Registration[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Registration);
      });
      setRegistrations(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'registrations');
    });

    return () => {
      unsubscribeCampaigns();
      unsubscribeStudents();
      unsubscribeRegistrations();
    };
  }, []);

  // Update currentUser reference dynamically if profile changes on another device
  useEffect(() => {
    if (currentUser && role === 'student') {
      const studentId = (currentUser as Student).id;
      const found = students.find(s => s.id === studentId);
      if (found) {
        if (JSON.stringify(found) !== JSON.stringify(currentUser)) {
          setCurrentUser(found);
        }
      }
    }
  }, [students, currentUser, role]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEY_ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_ROLE);
    }
  }, [currentUser, role]);

  // Handle registration via URL scan (QR Code) - Set qrCampaignId when URL contains register action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const campaignId = params.get('campaignId');

    if (action === 'register' && campaignId) {
      setQrCampaignId(campaignId);
    }
  }, []);

  // Active student reference computed dynamically from the students array to prevent stale data
  const activeStudent = (currentUser && role === 'student') 
    ? (students.find(s => s.id === currentUser.id || s.studentId === (currentUser as Student).studentId) || (currentUser as Student)) 
    : students[0];

  // Dynamic statistics calculation
  const stats: Statistics = {
    totalStudents: students.length,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'open' || c.status === 'closing_soon').length,
    totalHoursContributed: students.reduce((sum, s) => sum + s.totalHours, 0),
    totalScoreAwarded: students.reduce((sum, s) => sum + s.totalScore, 0),
  };

  // HANDLE ACTIONS
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginTab === 'student') {
      if (!loginStudentId.trim()) {
        setLoginError('Vui lòng nhập Mã số sinh viên (MSSV)!');
        return;
      }

      // Find student by MSSV
      const found = students.find(s => s.studentId.trim() === loginStudentId.trim());
      if (found) {
        if (found.status === 'pending') {
          setLoginError('Hồ sơ Đội viên của bạn đang chờ Ban điều hành (Admin) phê duyệt! Vui lòng quay lại sau.');
          return;
        }
        if (found.status === 'locked') {
          setLoginError('Tài khoản sinh viên này đã bị khóa!');
          return;
        }
        setCurrentUser(found);
        setRole('student');
      } else {
        setLoginError('Không tìm thấy MSSV này trong hệ thống! Bạn có thể nhấn Đăng ký tài khoản mới ở dưới.');
      }
    } else {
      // Admin Login Check
      if (loginAdminUser === 'admin' && loginAdminPass === 'admin123') {
        const adminUser = {
          id: 'admin-001',
          name: 'Hội Sinh viên Trường Đại học Đồng Tháp',
          role: 'admin' as const
        };
        setCurrentUser(adminUser);
        setRole('admin');
      } else {
        setLoginError('Sai tài khoản hoặc mật khẩu quản trị viên!');
      }
    }
  };

  const handleDownloadDocx = (student: Student) => {
    const birthDateFormatted = (() => {
      if (student.birthDate && student.birthDate.includes('-')) {
        const parts = student.birthDate.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return student.birthDate || '........................';
    })();

    const pairedSkills: string[] = [];
    for (let i = 0; i < AVAILABLE_SKILLS.length; i += 2) {
      const s1 = AVAILABLE_SKILLS[i];
      const s2 = AVAILABLE_SKILLS[i + 1] || '';
      const checked1 = student.skills?.includes(s1);
      const checked2 = s2 ? student.skills?.includes(s2) : false;
      
      pairedSkills.push(`
        <tr>
          <td style="width: 50%; font-size: 11pt; padding: 4px 0; vertical-align: top;">
            ${checked1 ? '&#x2612;' : '&#x2610;'} ${s1}
          </td>
          <td style="width: 50%; font-size: 11pt; padding: 4px 0; vertical-align: top;">
            ${s2 ? (checked2 ? '&#x2612;' : '&#x2610;') + ' ' + s2 : ''}
          </td>
        </tr>
      `);
    }

    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Don dang ky tham gia Doi CTXH - ${student.name}</title>
        <style>
          @page {
            size: 8.27in 11.69in; /* A4 */
            margin: 1.0in 1.0in 1.0in 1.0in;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.25;
            color: #000000;
          }
          .header-section {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .header-section td {
            vertical-align: top;
            padding: 0;
          }
          .bold {
            font-weight: bold;
          }
          .uppercase {
            text-transform: uppercase;
          }
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .skills-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .signature-section {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
          }
          .signature-section td {
            width: 50%;
            text-align: center;
            vertical-align: top;
          }
        </style>
      </head>
      <body>
        <table class="header-section">
          <tr>
            <td style="width: 60%; text-align: center;">
              <span class="bold" style="font-size: 11pt;">HỘI SINH VIÊN VIỆT NAM</span><br>
              <span class="bold" style="font-size: 11pt;">BCH HỘI SINH VIÊN VIỆT NAM</span><br>
              <span class="bold" style="font-size: 11pt; border-bottom: 1px solid #000; padding-bottom: 3px; display: inline-block;">TRƯỜNG ĐẠI HỌC ĐỒNG THÁP</span><br>
              <span style="font-size: 10pt; display: block; margin-top: 4px;">***</span>
            </td>
            <td style="width: 40%; text-align: right; font-size: 11pt; font-style: italic; padding-right: 20px;">
              Số: ....................
            </td>
          </tr>
        </table>

        <!-- Photo box and Title alignment -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="width: 25%; vertical-align: top;">
              <div style="border: 1px solid #000000; width: 100px; height: 133px; text-align: center; font-size: 9pt; display: table-cell; vertical-align: middle; padding: 5px;">
                Dán<br>ảnh 3x4<br>hoặc<br>4x6
              </div>
            </td>
            <td style="width: 75%; vertical-align: top; text-align: center; padding-top: 10px;">
              <div class="bold" style="font-size: 14pt;">ĐƠN ĐĂNG KÝ THAM GIA</div>
              <div class="bold" style="font-size: 13pt;">ĐỘI CÔNG TÁC XÃ HỘI TRƯỜNG ĐẠI HỌC ĐỒNG THÁP</div>
              <div style="margin-top: 5px; font-size: 11pt;">-------------------------</div>
            </td>
          </tr>
        </table>

        <div class="kính-gửi" style="font-size: 12pt; font-weight: bold; text-align: center; margin-top: 20px; margin-bottom: 20px;">
          Kính gửi: Ban Thư ký Hội Sinh viên Trường Đại học Đồng Tháp
        </div>

        <div class="section-title">PHẦN I. THÔNG TIN CÁ NHÂN</div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td colspan="2" style="padding: 4px 0;">1. Họ và tên (<i>viết in hoa</i>): <span style="font-weight: bold; text-transform: uppercase;">${student.name}</span></td>
          </tr>
          <tr>
            <td style="width: 45%; padding: 4px 0;">2. Giới tính: &nbsp;&nbsp; ${student.gender === 'Nam' ? '&#x2612; Nam' : '&#x2610; Nam'}&nbsp;&nbsp;&nbsp;&nbsp;${student.gender === 'Nữ' ? '&#x2612; Nữ' : '&#x2610; Nữ'}</td>
            <td style="width: 55%; padding: 4px 0;">Ngày, tháng, năm sinh: <span style="font-weight: bold;">${birthDateFormatted}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">3. Chi hội: <span style="font-weight: bold;">${student.subBranch || '................................................'}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">4. Khoa: <span style="font-weight: bold;">${student.faculty}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">5. Ngành học: <span style="font-weight: bold;">${student.major || '................................................'}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">6. Số căn cước công dân: <span style="font-weight: bold;">${student.idCard || '................................................'}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">7. Địa chỉ thường trú (<i>xã/phường, tỉnh</i>): <span style="font-weight: bold;">${student.address || '................................................'}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">8. Địa chỉ email: <span style="font-weight: bold;">${student.email}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">9. Số điện thoại liên hệ: <span style="font-weight: bold;">${student.phone}</span></td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 0;">10. Tên câu lạc bộ/ đội/ nhóm bạn đang tham gia (nếu có): <span style="font-weight: bold;">${student.club || 'Không tham gia'}</span></td>
          </tr>
        </table>

        <div class="section-title">PHẦN II. ĐẶC ĐIỂM CÁ NHÂN VÀ NGUYỆN VỌNG</div>
        
        <div style="margin-bottom: 8px; font-weight: bold;">1. Hình thức hoạt động tình nguyện (<i>Đánh dấu &checkmark; vào ô phù hợp</i>):</div>
        
        <table class="skills-table">
          ${pairedSkills.join('')}
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px;">
          <tr>
            <td style="padding: 4px 0; vertical-align: top;">Kỹ năng khác (ghi rõ): <span style="font-weight: bold;">${student.otherSkill || 'Không có'}</span></td>
          </tr>
          <tr>
            <td style="padding: 4px 0; vertical-align: top;">Tên công cụ AI bạn sử dụng thành thạo nhất: <span style="font-weight: bold;">${student.aiTool || 'Không có'}</span></td>
          </tr>
          <tr>
            <td style="padding: 4px 0; vertical-align: top; line-height: 1.4;">
              Sản phẩm của bạn đã thực hiện được: <span style="font-weight: bold;">${student.portfolioUrl || 'Chưa cập nhật'}</span>
            </td>
          </tr>
        </table>

        <div style="margin-bottom: 8px; font-weight: bold;">2. Địa chỉ mạng xã hội cá nhân:</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; margin-left: 15px;">
          <tr>
            <td style="padding: 3px 0;">- Facebook: <span style="font-weight: bold;">${student.facebook || '................................................'}</span></td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">- TikTok: <span style="font-weight: bold;">${student.tiktok || '................................................'}</span></td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">- Khác (nếu có): <span style="font-weight: bold;">${student.otherSocial || '................................................'}</span></td>
          </tr>
        </table>

        <div style="margin-bottom: 8px; font-weight: bold;">3. Tiến độ tích lũy ngày Công tác xã hội:</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; margin-left: 15px;">
          <tr>
            <td style="width: 50%; padding: 3px 0;">Số ngày CTXH đã tích lũy: <span style="font-weight: bold;">${student.ctxhAccumulated ?? 0} ngày</span></td>
            <td style="width: 50%; padding: 3px 0;">Số ngày CTXH còn thiếu: <span style="font-weight: bold;">${student.ctxhMissing ?? 0} ngày</span></td>
          </tr>
        </table>

        <div style="margin-bottom: 8px; font-weight: bold;">4. Nguyện vọng / Kỳ vọng cá nhân khi tham gia Đội Công tác xã hội:</div>
        <div style="border: 1px solid #cccccc; padding: 10px; min-height: 60px; font-style: italic; margin-bottom: 20px; line-height: 1.4; text-align: justify;">
          ${student.aspiration || 'Không có nguyện vọng đặc biệt.'}
        </div>

        <div style="text-align: justify; line-height: 1.4; margin-top: 15px; font-size: 11pt;">
          <span class="bold">CAM KẾT:</span> Tôi xin cam kết toàn bộ thông tin khai báo trong đơn này là hoàn toàn trung thực, chính xác và chịu hoàn toàn trách nhiệm trước Ban Chấp hành Hội Sinh viên Trường về tính xác thực của các thông tin đã cung cấp.
        </div>

        <table class="signature-section">
          <tr>
            <td style="width: 45%;"></td>
            <td style="width: 55%; font-size: 11pt;">
              <i>Đồng Tháp, ngày ${currentDay} tháng ${currentMonth} năm ${currentYear}</i><br>
              <span class="bold" style="display: block; margin-top: 5px;">NGƯỜI ĐĂNG KÝ</span>
              <span style="font-size: 9pt; display: block; margin-top: 2px;"><i>(Ký và ghi rõ họ tên)</i></span>
              <br><br><br><br>
              <span class="bold" style="text-transform: uppercase;">${student.name}</span>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Don_Dang_Ky_CTXH_${student.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmSignUp = async () => {
    if (!pendingStudent) return;

    try {
      await setDoc(doc(db, 'students', pendingStudent.id), pendingStudent);
      
      // Auto fill login ID and show success
      setLoginStudentId(pendingStudent.studentId);
      setRegSuccess('Đăng ký Đội viên thành công! Hồ sơ của bạn đã được chuyển đến Ban điều hành (Admin) để phê duyệt.');
      setShowSignUp(false);

      // Reset states
      setPendingStudent(null);
      setRegName('');
      setRegId('');
      setRegClass('');
      setRegBirthDate('');
      setRegEmail('');
      setRegPhone('');
      setRegGender('Nam');
      setRegSubBranch('');
      setRegMajor('');
      setRegIdCard('');
      setRegAddress('');
      setRegClub('');
      setRegSkills([]);
      setRegOtherSkill('');
      setRegAiTool('');
      setRegPortfolioUrl('');
      setRegFacebook('');
      setRegTikTok('');
      setRegOtherSocial('');
      setRegCtxhAccumulated('');
      setRegCtxhMissing('');
      setRegAspiration('');
    } catch (error) {
      console.error('Error signing up:', error);
      setLoginError('Có lỗi xảy ra khi lưu thông tin đăng ký. Vui lòng thử lại!');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegSuccess('');

    if (!regName || !regId || !regClass || !regBirthDate || !regEmail || !regPhone || !regIdCard || !regAddress || !regMajor) {
      setLoginError('Vui lòng điền đầy đủ các thông tin cá nhân bắt buộc (có dấu *)!');
      return;
    }

    // Check if MSSV already exists
    const exists = students.some(s => s.studentId === regId);
    if (exists) {
      setLoginError('MSSV này đã tồn tại trong hệ thống!');
      return;
    }

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: regName.trim().toUpperCase(),
      studentId: regId.trim(),
      faculty: regFaculty,
      className: regClass.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      birthDate: regBirthDate,
      gender: regGender,
      subBranch: regSubBranch.trim(),
      major: regMajor.trim(),
      idCard: regIdCard.trim(),
      address: regAddress.trim(),
      club: regClub.trim(),
      skills: regSkills,
      otherSkill: regOtherSkill.trim(),
      aiTool: regAiTool.trim(),
      portfolioUrl: regPortfolioUrl.trim(),
      facebook: regFacebook.trim(),
      tiktok: regTikTok.trim(),
      otherSocial: regOtherSocial.trim(),
      ctxhAccumulated: regCtxhAccumulated ? parseFloat(String(regCtxhAccumulated).replace(',', '.')) : 0,
      ctxhMissing: regCtxhMissing ? parseFloat(String(regCtxhMissing).replace(',', '.')) : 0,
      totalPerformanceScore: 0,
      aspiration: regAspiration.trim(),
      totalHours: 0,
      totalScore: 0,
      status: 'pending',
      role: 'student'
    };

    // Open confirmation preview document instead of saving directly
    setPendingStudent(newStudent);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginStudentId('');
    setLoginError('');
    setRegSuccess('');
  };

  // STUDENT ACTIONS
  // Registering for a campaign
  const handleRegisterCampaign = async (campaignId: string) => {
    if (!currentUser || role !== 'student') return;
    const currentStudent = currentUser as Student;

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Check if already registered
    const exists = registrations.some(r => r.studentId === currentStudent.id && r.campaignId === campaignId);
    if (exists) return;

    // Check status
    if (campaign.status === 'paused') {
      setAlertModal({
        title: 'Đăng ký không thành công',
        message: 'Hoạt động này đang tạm dừng nhận đăng ký từ Đội viên!'
      });
      return;
    }

    if (campaign.status === 'completed') {
      setAlertModal({
        title: 'Đăng ký không thành công',
        message: 'Hoạt động này đã kết thúc hoặc hoàn thành!'
      });
      return;
    }

    // Check capacity
    if (campaign.slotsRegistered >= campaign.slotsTotal) {
      setAlertModal({
        title: 'Đăng ký không thành công',
        message: 'Chiến dịch này đã đạt đủ chỉ tiêu suất đăng ký tối đa. Không cho phép đăng ký hoạt động này!'
      });
      return;
    }

    const newRegistration: Registration = {
      id: `reg-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentClass: currentStudent.className,
      studentFaculty: currentStudent.faculty,
      campaignId: campaignId,
      campaignTitle: campaign.title,
      registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'pending',
      attendanceStatus: 'none'
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'registrations', newRegistration.id), newRegistration);
      
      const newSlotsRegistered = (campaign.slotsRegistered || 0) + 1;
      const campaignUpdates: any = {
        slotsRegistered: newSlotsRegistered
      };

      // Automatically stop/pause recruitment if target is fully reached
      if (newSlotsRegistered >= campaign.slotsTotal) {
        campaignUpdates.status = 'paused';
      }

      batch.update(doc(db, 'campaigns', campaignId), campaignUpdates);
      await batch.commit();
    } catch (error) {
      console.error('Error registering campaign:', error);
      handleFirestoreError(error, OperationType.WRITE, `registrations/${newRegistration.id}`);
    }
  };

  // Cancelling registration
  const handleCancelRegistration = async (regId: string) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    // Only allow cancelling if still pending
    if (reg.status !== 'pending') {
      setAlertModal({
        title: 'Thông báo',
        message: 'Không thể hủy đăng ký đã được duyệt hoặc hoàn thành!'
      });
      return;
    }

    const campaign = campaigns.find(c => c.id === reg.campaignId);

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'registrations', regId));
      if (campaign) {
        const newSlotsRegistered = Math.max(0, (campaign.slotsRegistered || 0) - 1);
        const campaignUpdates: any = {
          slotsRegistered: newSlotsRegistered
        };

        // If the campaign was paused and now has slots available, automatically open it back up
        if (campaign.status === 'paused' && newSlotsRegistered < campaign.slotsTotal) {
          campaignUpdates.status = 'open';
        }

        batch.update(doc(db, 'campaigns', reg.campaignId), campaignUpdates);
      }
      await batch.commit();
    } catch (error) {
      console.error('Error cancelling registration:', error);
      handleFirestoreError(error, OperationType.DELETE, `registrations/${regId}`);
    }
  };

  // ADMIN ACTIONS
  // Approve or Reject student registration
  const handleApproveRegistration = async (regId: string, status: 'approved' | 'rejected') => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'registrations', regId), { status });

      const campaign = campaigns.find(c => c.id === reg.campaignId);
      if (campaign) {
        // If transitioning from non-rejected to rejected: free up slot
        if (status === 'rejected' && reg.status !== 'rejected') {
          const newSlotsRegistered = Math.max(0, (campaign.slotsRegistered || 0) - 1);
          const campaignUpdates: any = {
            slotsRegistered: newSlotsRegistered
          };

          // If campaign was paused and now has slots, automatically open it back up
          if (campaign.status === 'paused' && newSlotsRegistered < campaign.slotsTotal) {
            campaignUpdates.status = 'open';
          }

          batch.update(doc(db, 'campaigns', reg.campaignId), campaignUpdates);
        }
        // If transitioning from rejected back to approved/pending: occupy slot
        else if (status === 'approved' && reg.status === 'rejected') {
          const newSlotsRegistered = (campaign.slotsRegistered || 0) + 1;
          const campaignUpdates: any = {
            slotsRegistered: newSlotsRegistered
          };

          // Automatically stop/pause recruitment if target is fully reached
          if (newSlotsRegistered >= campaign.slotsTotal) {
            campaignUpdates.status = 'paused';
          }

          batch.update(doc(db, 'campaigns', reg.campaignId), campaignUpdates);
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error approving registration:', error);
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${regId}`);
    }
  };

  // Create new campaign
  const handleCreateCampaign = async (newCampData: Omit<Campaign, 'id' | 'slotsRegistered'>) => {
    const newCampId = `camp-${Date.now()}`;
    const newCamp: Campaign = {
      ...newCampData,
      id: newCampId,
      slotsRegistered: 0,
      status: 'open'
    };
    try {
      await setDoc(doc(db, 'campaigns', newCampId), newCamp);
    } catch (error) {
      console.error('Error creating campaign:', error);
      handleFirestoreError(error, OperationType.CREATE, `campaigns/${newCampId}`);
    }
  };

  // Toggle student account lock
  const handleToggleLockStudent = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const nextStatus = student.status === 'locked' ? 'active' : 'locked';
    try {
      await updateDoc(doc(db, 'students', studentId), { status: nextStatus });
    } catch (error) {
      console.error('Error toggling lock student:', error);
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
    }
  };

  // Approve or reject student registration
  const handleApproveStudent = async (studentId: string, approved: boolean) => {
    const status = approved ? 'active' : 'locked';
    try {
      await updateDoc(doc(db, 'students', studentId), { status });
    } catch (error) {
      console.error('Error approving student:', error);
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
    }
  };

  // Toggle student leadership role
  const handleToggleLeaderRole = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const nextRole = student.role === 'leader' ? 'student' : 'leader';
    try {
      await updateDoc(doc(db, 'students', studentId), { role: nextRole });
    } catch (error) {
      console.error('Error toggling leader role:', error);
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
    }
  };

  // Complete Campaign (Mark attendance & performance grade)
  const handleCompleteCampaignRegistration = async (
    regId: string, 
    attendance: 'present' | 'absent' | 'excused', 
    score: number
  ) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    const campaign = campaigns.find(c => c.id === reg.campaignId);
    if (!campaign) return;

    const student = students.find(s => s.id === reg.studentId);
    if (!student) return;

    // Check if we are editing an already completed registration
    const isEditing = reg.status === 'completed';

    // Calculate old awarded values (if it was completed)
    let oldScoreToAward = 0;
    let oldHoursToAward = 0;
    const oldPerformanceScore = isEditing ? (reg.performanceScore || 0) : 0;

    if (isEditing && reg.attendanceStatus === 'present') {
      if (campaign.scoreType === 'Ngày') {
        oldScoreToAward = campaign.score;
      } else {
        oldHoursToAward = campaign.score;
      }
    }

    // Calculate new awarded values
    let newScoreToAward = 0;
    let newHoursToAward = 0;
    const newPerformanceScore = score;

    if (attendance === 'present') {
      if (campaign.scoreType === 'Ngày') {
        newScoreToAward = campaign.score;
      } else {
        newHoursToAward = campaign.score;
      }
    }

    // Deltas
    const deltaScore = newScoreToAward - oldScoreToAward;
    const deltaHours = newHoursToAward - oldHoursToAward;
    const deltaPerformanceScore = newPerformanceScore - oldPerformanceScore;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'registrations', regId), {
        status: 'completed',
        attendanceStatus: attendance,
        performanceScore: score
      });

      const updatedCtxhAccumulated = (student.ctxhAccumulated || 0) + deltaScore;
      const updatedCtxhMissing = Math.max(0, (student.ctxhMissing || 0) - deltaScore);
      const updatedTotalPerformanceScore = (student.totalPerformanceScore || 0) + deltaPerformanceScore;

      batch.update(doc(db, 'students', student.id), {
        totalScore: (student.totalScore || 0) + deltaScore,
        totalHours: (student.totalHours || 0) + deltaHours,
        ctxhAccumulated: updatedCtxhAccumulated,
        ctxhMissing: updatedCtxhMissing,
        totalPerformanceScore: updatedTotalPerformanceScore
      });
      await batch.commit();
    } catch (error) {
      console.error('Error completing campaign registration:', error);
      handleFirestoreError(error, OperationType.WRITE, `registrations/${regId}`);
    }
  };

  // Sync and recalculate all student accumulated performance scores based on registrations
  const handleSyncAllStudentScores = async (): Promise<{ success: boolean; count: number }> => {
    try {
      const batch = writeBatch(db);
      let count = 0;

      for (const student of students) {
        // Find completed registrations with performanceScore for this student
        const studentCompletedRegs = registrations.filter(
          (r) => r.studentId === student.id && r.status === 'completed'
        );

        let calculatedTotalPerformanceScore = 0;
        studentCompletedRegs.forEach((reg) => {
          if (reg.performanceScore !== undefined) {
            calculatedTotalPerformanceScore += reg.performanceScore;
          }
        });

        // Check if there's any mismatch
        if ((student.totalPerformanceScore || 0) !== calculatedTotalPerformanceScore) {
          batch.update(doc(db, 'students', student.id), {
            totalPerformanceScore: calculatedTotalPerformanceScore
          });
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
      return { success: true, count };
    } catch (error) {
      console.error('Error syncing student scores:', error);
      handleFirestoreError(error, OperationType.WRITE, 'students_bulk_sync');
      throw error;
    }
  };

  // Delete student account
  const handleDeleteStudent = (studentId: string) => {
    setConfirmModal({
      title: 'Xác nhận xóa thành viên',
      message: 'Bạn có chắc muốn xóa thành viên này? Mọi thông tin đăng ký hoạt động của thành viên này cũng sẽ bị xóa.',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'students', studentId));
          
          const studentRegs = registrations.filter(r => r.studentId === studentId);
          const campaignsToUpdate: Record<string, number> = {};

          studentRegs.forEach(reg => {
            batch.delete(doc(db, 'registrations', reg.id));
            if (reg.status !== 'rejected') {
              campaignsToUpdate[reg.campaignId] = (campaignsToUpdate[reg.campaignId] || 0) + 1;
            }
          });

          // Decrement slotsRegistered for each campaign
          for (const [campId, count] of Object.entries(campaignsToUpdate)) {
            const campaign = campaigns.find(c => c.id === campId);
            if (campaign) {
              const newSlotsRegistered = Math.max(0, (campaign.slotsRegistered || 0) - count);
              const campaignUpdates: any = {
                slotsRegistered: newSlotsRegistered
              };
              if (campaign.status === 'paused' && newSlotsRegistered < campaign.slotsTotal) {
                campaignUpdates.status = 'open';
              }
              batch.update(doc(db, 'campaigns', campId), campaignUpdates);
            }
          }
          
          await batch.commit();
          setConfirmModal(null);
        } catch (error) {
          console.error('Error deleting student:', error);
          handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
        }
      }
    });
  };

  // Update campaign status (Pause, Stop/Complete, Open)
  const handleUpdateCampaignStatus = async (campaignId: string, status: 'open' | 'paused' | 'completed') => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), { status });
    } catch (error) {
      console.error('Error updating campaign status:', error);
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = (campaignId: string) => {
    setConfirmModal({
      title: 'Xác nhận xóa hoạt động',
      message: 'Bạn có chắc muốn xóa hoạt động này? Mọi thông tin đăng ký liên quan sẽ bị xóa.',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'campaigns', campaignId));
          
          const campRegs = registrations.filter(r => r.campaignId === campaignId);
          campRegs.forEach(reg => {
            batch.delete(doc(db, 'registrations', reg.id));
          });
          
          await batch.commit();
          setConfirmModal(null);
        } catch (error) {
          console.error('Error deleting campaign:', error);
          handleFirestoreError(error, OperationType.DELETE, `campaigns/${campaignId}`);
        }
      }
    });
  };

  // Reset state helper
  const handleResetDemoState = () => {
    setConfirmModal({
      title: 'Đặt lại toàn bộ dữ liệu trên hệ thống',
      message: 'Bạn có chắc muốn xóa sạch toàn bộ dữ liệu trên Firebase và khôi phục cài đặt gốc? Tất cả tài khoản, đăng ký, chiến dịch sẽ bị xóa và đăng xuất.',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          
          students.forEach(s => {
            batch.delete(doc(db, 'students', s.id));
          });
          
          campaigns.forEach(c => {
            batch.delete(doc(db, 'campaigns', c.id));
          });
          
          registrations.forEach(r => {
            batch.delete(doc(db, 'registrations', r.id));
          });
          
          initialStudents.forEach(s => {
            batch.set(doc(db, 'students', s.id), s);
          });
          
          await batch.commit();
          
          localStorage.clear();
          setCurrentUser(null);
          setConfirmModal(null);
        } catch (error) {
          console.error('Error resetting system:', error);
          handleFirestoreError(error, OperationType.DELETE, 'reset_demo_state');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      
      {/* 🇻🇳 GLOBAL DECORATIVE HEADER BAR */}
      <div className="bg-white border-b border-gray-100 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Logo & Scholastic Identity */}
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 bg-white rounded-full border border-gray-100 shadow-xs overflow-hidden flex items-center justify-center">
  <img 
    src="https://i.postimg.cc/RFkjyCyr/a.png" 
    alt="Logo Hội Sinh viên Việt Nam" 
    className="w-full h-full object-cover rounded-full"
  />
</div>

            <div>
              <h1 className="text-xs sm:text-sm font-display font-bold text-[#00529C] uppercase tracking-wide line-clamp-1">
                HỘI SINH VIÊN TRƯỜNG ĐẠI HỌC ĐỒNG THÁP
              </h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Đội công tác xã hội
              </p>
            </div>
          </div>

          {/* User Session Info / Logout */}
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-bold text-gray-800 block">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">
                  {role === 'admin' ? 'Quyền Ban Điều Hành' : `MSSV: ${(currentUser as Student).studentId}`}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-red-200"
                id="btn-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Đăng xuất</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* CORE CONTENT SWITCHER */}
      <div className="flex-1">
        
        {/* VIEW A: NOT LOGGED IN - SHOW BEAUTIFUL LOGIN SCREEN */}
        {!currentUser ? (
          <div className={`${showSignUp ? 'max-w-2xl' : 'max-w-md'} mx-auto px-4 py-12 flex flex-col justify-center min-h-[70vh] transition-all duration-300`}>
            
            {/* Dynamic Login / Registration Box */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-md flex flex-col justify-between">
              
              <div>
                {/* Header text */}
                <div className="mb-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center mb-3 overflow-hidden">
  <img 
    src="https://i.postimg.cc/RFkjyCyr/a.png" 
    alt="Logo Hội Sinh viên Việt Nam" 
    className="w-full h-full object-cover rounded-full"
  />
</div>
                  <h3 className="text-lg font-display font-bold text-gray-800">
                    {showSignUp ? 'Đăng ký tài khoản Đội viên' : 'Đăng nhập hệ thống'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    {showSignUp ? '' : 'Chọn phân hệ tương ứng bên dưới để bắt đầu sử dụng'}
                  </p>
                </div>

                {/* Show status errors/successes */}
                {loginError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-4 flex items-start gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs mb-4 flex items-start gap-2 border border-emerald-200">
                    <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                {!showSignUp ? (
                  <>
                    {/* Role selections tabs */}
                    <div className="bg-gray-100 p-1 rounded-xl flex gap-1 mb-6 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => { setLoginTab('student'); setLoginError(''); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          loginTab === 'student'
                            ? 'bg-white text-[#00529C] shadow-xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Sinh viên (Đội viên)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLoginTab('admin'); setLoginError(''); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          loginTab === 'admin'
                            ? 'bg-white text-[#00529C] shadow-xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Quản trị (Admin)
                      </button>
                    </div>

                    {/* Form rendering */}
                    <form onSubmit={handleLogin} className="space-y-4 text-xs">
                      {loginTab === 'student' ? (
                        <div className="space-y-1">
                          <label className="text-gray-500 font-semibold">Nhập Mã số Sinh viên (MSSV) của bạn *</label>
                          <input
                            type="text"
                            required
                            placeholder="Nhập 0024415123 để đăng nhập demo..."
                            value={loginStudentId}
                            onChange={(e) => setLoginStudentId(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15"
                            id="login-student-id"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-gray-500 font-semibold">Tên tài khoản quản trị *</label>
                            <input
                              type="text"
                              required
                              placeholder=""
                              value={loginAdminUser}
                              onChange={(e) => setLoginAdminUser(e.target.value)}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                              id="login-admin-user"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-gray-500 font-semibold">Mật khẩu *</label>
                            <input
                              type="password"
                              required
                              placeholder=""
                              value={loginAdminPass}
                              onChange={(e) => setLoginAdminPass(e.target.value)}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                              id="login-admin-pass"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#00529C] hover:bg-[#003B70] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5"
                        id="btn-submit-login"
                      >
                        <LogIn className="w-4 h-4" />
                        Đăng nhập ngay
                      </button>
                    </form>
                  </>
                ) : (
                  /* SIGN UP FORM (Dynamic creation with expanded fields) */
                  <form onSubmit={handleSignUp} className="space-y-6 text-xs text-left" id="register-container">
                    {/* PART I: PERSONAL INFO */}
                    <div className="space-y-4 border-b border-gray-100 pb-5">
                      <h4 className="font-bold text-[#00529C] text-sm border-l-4 border-[#00529C] pl-2 uppercase tracking-wide">
                        PHẦN I. THÔNG TIN CÁ NHÂN
                      </h4>
                      
                      <div className="space-y-1">
                        <label className="text-gray-600 font-semibold flex items-center justify-between">
                          <span>1. Họ và tên (viết in hoa) *</span>
                          <span className="text-[10px] text-gray-400 font-normal">Sẽ tự động viết hoa</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="VÍ DỤ: NGUYỄN VĂN A"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value.toUpperCase())}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15 font-semibold text-gray-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">2. Giới tính *</label>
                          <div className="flex gap-4 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
                              <input
                                type="radio"
                                name="gender"
                                value="Nam"
                                checked={regGender === 'Nam'}
                                onChange={() => setRegGender('Nam')}
                                className="accent-[#00529C]"
                              />
                              Nam
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
                              <input
                                type="radio"
                                name="gender"
                                value="Nữ"
                                checked={regGender === 'Nữ'}
                                onChange={() => setRegGender('Nữ')}
                                className="accent-[#00529C]"
                              />
                              Nữ
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">Ngày, tháng, năm sinh (dd/mm/yyyy) *</label>
                          <input
                            type="date"
                            required
                            value={regBirthDate}
                            onChange={(e) => setRegBirthDate(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">3. Chi hội *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Chi hội 24CNTT"
                            value={regSubBranch}
                            onChange={(e) => setRegSubBranch(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">4. Khoa *</label>
                          <select
                            value={regFaculty}
                            onChange={(e) => setRegFaculty(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-semibold text-gray-700 cursor-pointer text-xs"
                          >
                            <option value="Khoa Giáo dục Tiểu học - Mầm non">Khoa Giáo dục Tiểu học - Mầm non</option>
                            <option value="Khoa Sư phạm Toán - Tin">Khoa Sư phạm Toán - Tin</option>
                            <option value="Khoa Sư phạm Khoa học tự nhiên">Khoa Sư phạm Khoa học tự nhiên</option>
                            <option value="Khoa Sư phạm Khoa học xã hội">Khoa Sư phạm Khoa học xã hội</option>
                            <option value="Khoa Giáo dục Chính trị và Quản lý giáo dục">Khoa Giáo dục Chính trị và Quản lý giáo dục</option>
                            <option value="Khoa Giáo dục Thể chất - Sư phạm Nghệ thuật">Khoa Giáo dục Thể chất - Sư phạm Nghệ thuật</option>
                            <option value="Khoa Công nghệ và Kỹ thuật">Khoa Công nghệ và Kỹ thuật</option>
                            <option value="Khoa Kinh tế - Luật">Khoa Kinh tế - Luật</option>
                            <option value="Khoa Nông nghiệp, Tài nguyên và Môi trường">Khoa Nông nghiệp, Tài nguyên và Môi trường</option>
                            <option value="Khoa Ngoại ngữ">Khoa Ngoại ngữ</option>
                            <option value="Khoa Văn hóa - Du lịch và Công tác xã hội">Khoa Văn hóa - Du lịch và Công tác xã hội</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">5. Ngành học *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Công nghệ Thông tin"
                            value={regMajor}
                            onChange={(e) => setRegMajor(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">6. Số căn cước công dân *</label>
                          <input
                            type="text"
                            required
                            placeholder="Nhập số CCCD"
                            value={regIdCard}
                            onChange={(e) => setRegIdCard(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-600 font-semibold">7. Địa chỉ thường trú (xã/phường, tỉnh) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Phường 1, TP. Cao Lãnh, Đồng Tháp"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">8. Địa chỉ email *</label>
                          <input
                            type="email"
                            required
                            placeholder="nguyenvana@dthu.edu.vn"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">9. Số điện thoại liên hệ *</label>
                          <input
                            type="tel"
                            required
                            placeholder="Ví dụ: 0912345678"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-600 font-semibold">10. Tên câu lạc bộ/ đội/ nhóm bạn đang tham gia (nếu có)</label>
                        <input
                          type="text"
                          placeholder="Nhập tên CLB/đội/nhóm đang tham gia"
                          value={regClub}
                          onChange={(e) => setRegClub(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">Mã số Sinh viên (MSSV) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: 0024415123"
                            value={regId}
                            onChange={(e) => setRegId(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-600 font-semibold">Lớp *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: DK24CNTT"
                            value={regClass}
                            onChange={(e) => setRegClass(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PART II: PERSONAL FEATURES & ASPIRATIONS */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-emerald-600 text-sm border-l-4 border-emerald-500 pl-2 uppercase tracking-wide">
                        PHẦN II. ĐẶC ĐIỂM CÁ NHÂN VÀ NGUYỆN VỌNG
                      </h4>

                      <div className="space-y-2">
                        <label className="text-gray-600 font-semibold block">
                          1. Hình thức hoạt động tình nguyện (Có thể chọn cả 2 hình thức):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          {AVAILABLE_SKILLS.map((skill) => {
                            const isChecked = regSkills.includes(skill);
                            return (
                              <label key={skill} className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-[11px] text-gray-700 font-medium">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setRegSkills(regSkills.filter(s => s !== skill));
                                    } else {
                                      setRegSkills([...regSkills, skill]);
                                    }
                                  }}
                                  className="mt-0.5 accent-[#00529C]"
                                />
                                <span>{skill}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-600 font-semibold">Kỹ năng khác (ghi rõ):</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Biết chơi guitar, thiết kế web..."
                          value={regOtherSkill}
                          onChange={(e) => setRegOtherSkill(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-600 font-semibold">Tên công cụ AI bạn sử dụng thành thạo nhất:</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Gemini, ChatGPT, Midjourney..."
                          value={regAiTool}
                          onChange={(e) => setRegAiTool(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-600 font-semibold text-[11px]">Sản phẩm của bạn đã thực hiện được (bài hát, ảnh chụp, tin đã viết, video đã thiết kế/ thực hiện,... đính kèm lên link google, share link nếu có):</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: https://drive.google.com/drive/folders/..."
                          value={regPortfolioUrl}
                          onChange={(e) => setRegPortfolioUrl(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-600 font-semibold block">2. Địa chỉ mạng xã hội cá nhân:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Facebook:</span>
                            <input
                              type="text"
                              placeholder="Facebook link hoặc tên"
                              value={regFacebook}
                              onChange={(e) => setRegFacebook(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-[11px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">TikTok:</span>
                            <input
                              type="text"
                              placeholder="TikTok link hoặc tên"
                              value={regTikTok}
                              onChange={(e) => setRegTikTok(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-[11px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Mạng xã hội khác (nếu có):</span>
                            <input
                              type="text"
                              placeholder="Zalo, Instagram..."
                              value={regOtherSocial}
                              onChange={(e) => setRegOtherSocial(e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-[11px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-600 font-semibold block">3. Tiến độ tích lũy ngày Công tác xã hội:</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Số ngày CTXH đã tích lũy:</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="Nhập số ngày"
                              value={regCtxhAccumulated}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^[0-9.,]*$/.test(val)) {
                                  setRegCtxhAccumulated(val);
                                }
                              }}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-[11px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Số ngày CTXH còn thiếu:</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="Nhập số ngày"
                              value={regCtxhMissing}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^[0-9.,]*$/.test(val)) {
                                  setRegCtxhMissing(val);
                                }
                              }}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-[11px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-600 font-semibold">4. Nguyện vọng / Kỳ vọng cá nhân khi tham gia Đội Công tác xã hội:</label>
                        <textarea
                          placeholder="Thông tin này có thể bỏ trống, không cần bắt buộc phải điền"
                          value={regAspiration}
                          onChange={(e) => setRegAspiration(e.target.value)}
                          rows={3}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none resize-none text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-[#00529C] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 mt-4"
                    >
                      <UserPlus className="w-4 h-4" />
                      Xác nhận đăng ký Đội viên
                    </button>
                  </form>
                )}
              </div>

              {/* Toggle Sign Up button */}
              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                {!showSignUp ? (
                  <button
                    type="button"
                    onClick={() => { setShowSignUp(true); setLoginError(''); setRegSuccess(''); }}
                    className="text-[#00529C] hover:underline font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <UserPlus className="w-4 h-4" />
                    Chưa có tài khoản? Đăng ký ngay
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setShowSignUp(false); setLoginError(''); setRegSuccess(''); }}
                    className="text-[#00529C] hover:underline font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <LogIn className="w-4 h-4" />
                    Đã có tài khoản? Đăng nhập ngay
                  </button>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* VIEW B: LOGGED IN - RENDER CORRECT COMPONENT DYNAMICALLY */
          <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full animate-fade-in">
            {role === 'student' ? (
              <StudentView
                campaigns={campaigns}
                registrations={registrations}
                activeStudent={activeStudent}
                onRegisterCampaign={handleRegisterCampaign}
                onCancelRegistration={handleCancelRegistration}
              />
            ) : (
              <AdminView
                campaigns={campaigns}
                students={students}
                registrations={registrations}
                stats={stats}
                onCreateCampaign={handleCreateCampaign}
                onApproveRegistration={handleApproveRegistration}
                onToggleLockStudent={handleToggleLockStudent}
                onToggleLeaderRole={handleToggleLeaderRole}
                onCompleteCampaignRegistration={handleCompleteCampaignRegistration}
                onDeleteStudent={handleDeleteStudent}
                onDeleteCampaign={handleDeleteCampaign}
                onUpdateCampaignStatus={handleUpdateCampaignStatus}
                onApproveStudent={handleApproveStudent}
                onDownloadDocx={handleDownloadDocx}
                onSyncAllStudentScores={handleSyncAllStudentScores}
              />
            )}
          </main>
        )}

      </div>



      {/* CUSTOM CONFIRMATION DIALOG */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 p-6 space-y-4 text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-display font-bold text-gray-800 text-sm">
                {confirmModal.title}
              </h3>
            </div>
            
            <p className="text-gray-500 leading-relaxed text-xs">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold text-gray-500 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT DIALOG */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 p-6 space-y-4 text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-[#00529C]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-display font-bold text-gray-800 text-sm">
                {alertModal.title}
              </h3>
            </div>
            
            <p className="text-gray-500 leading-relaxed text-xs">
              {alertModal.message}
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className="px-5 py-2 bg-[#00529C] hover:bg-[#00417C] text-white rounded-xl font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR CAMPAIGN DETAILS */}
      {qrCampaignId && (
        (() => {
          const camp = campaigns.find(c => c.id === qrCampaignId);
          if (!camp) return null;
          const percentFull = Math.min(100, Math.round(((camp.slotsRegistered || 0) / camp.slotsTotal) * 100));

          const handleClose = () => {
            setQrCampaignId(null);
            // Clear URL search params
            window.history.replaceState({}, document.title, window.location.pathname);
          };

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-fade-in text-xs">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#00529C] to-[#00AEEF] px-6 py-4.5 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-white" />
                    <h3 className="font-display font-bold text-sm">Thông tin Chiến dịch (Mã QR)</h3>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-5 max-h-[60vh]">
                  {/* Image banner */}
                  {camp.imageUrl ? (
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-xs">
                      <img 
                        src={camp.imageUrl} 
                        alt={camp.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-blue-50/50 rounded-2xl flex items-center justify-center border border-dashed border-blue-200">
                      <BookOpen className="w-8 h-8 text-[#00529C]/30" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white ${
                      camp.department === 'Đoàn Thanh niên' ? 'bg-[#00529C]' : 'bg-[#00AEEF]'
                    }`}>
                      {camp.department}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-semibold text-[10px]">
                      {camp.type}
                    </span>
                    <span className="flex items-center font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px]">
                      <Award className="w-3.5 h-3.5 mr-1" />
                      +{camp.score} {camp.scoreType}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                      {camp.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-justify whitespace-pre-wrap">
                      {camp.description}
                    </p>
                  </div>

                  {/* Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      <Calendar className="w-4 h-4 text-[#00529C] shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Thời gian tổ chức</span>
                        <span className="font-semibold text-gray-700">{camp.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      <MapPin className="w-4 h-4 text-[#00529C] shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Địa điểm diễn ra</span>
                        <span className="font-semibold text-gray-700 truncate block max-w-[200px]">{camp.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Sĩ số đăng ký dự kiến:</span>
                      <span className="font-bold text-gray-800">
                        {camp.slotsRegistered}/{camp.slotsTotal} suất (đầy {percentFull}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          percentFull >= 100 
                            ? 'bg-red-500' 
                            : percentFull >= 80 
                            ? 'bg-amber-500' 
                            : 'bg-[#00529C]'
                        }`}
                        style={{ width: `${percentFull}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4.5 bg-gray-50 border-t border-gray-100 shrink-0">
                  {(() => {
                    if (!currentUser) {
                      return (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center space-y-3">
                          <p className="text-[11px] text-blue-800 font-semibold leading-relaxed">
                            Mã QR yêu cầu đăng nhập: Vui lòng <strong>Đăng nhập</strong> hoặc <strong>Đăng ký tài khoản Đội viên mới</strong> ở bên dưới để đăng ký tham gia hoạt động này!
                          </p>
                          <div className="flex gap-2.5 justify-center">
                            <button
                              onClick={() => {
                                handleClose();
                                setShowSignUp(false);
                                setTimeout(() => {
                                  const el = document.getElementById('login-student-id');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }}
                              className="px-4 py-2 bg-[#00529C] hover:bg-[#00417C] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all shadow-sm cursor-pointer"
                            >
                              Đăng nhập ngay
                            </button>
                            <button
                              onClick={() => {
                                handleClose();
                                setShowSignUp(true);
                                setTimeout(() => {
                                  const el = document.getElementById('register-container');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all shadow-sm cursor-pointer"
                            >
                              Đăng ký tài khoản mới
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (role === 'admin') {
                      return (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-800 font-semibold">
                          Bạn đang đăng nhập bằng tài khoản Quản trị viên (Admin). Vui lòng sử dụng tài khoản Đội viên (Sinh viên) để đăng ký tham gia hoạt động này!
                        </div>
                      );
                    }

                    // Student role
                    const currentStudent = currentUser as Student;
                    const studentReg = registrations.find(r => r.studentId === currentStudent.id && r.campaignId === camp.id);
                    if (studentReg) {
                      let statusText = 'Chờ phê duyệt';
                      let statusStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                      if (studentReg.status === 'approved') {
                        statusText = 'Đã phê duyệt (Sẽ tham gia)';
                        statusStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      } else if (studentReg.status === 'completed') {
                        statusText = 'Đã hoàn thành xuất sắc';
                        statusStyle = 'bg-blue-100 text-blue-800 border-blue-200';
                      } else if (studentReg.status === 'rejected') {
                        statusText = 'Đã bị từ chối';
                        statusStyle = 'bg-red-100 text-red-800 border-red-200';
                      }

                      return (
                        <div className={`border rounded-2xl p-3.5 text-center font-bold text-xs ${statusStyle}`}>
                          Hệ thống ghi nhận: Bạn đã đăng ký hoạt động này ({statusText})
                        </div>
                      );
                    }

                    if (camp.status === 'paused') {
                      return (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 text-center text-orange-700 font-bold">
                          Hoạt động này hiện đang tạm dừng nhận đăng ký từ Đội viên!
                        </div>
                      );
                    }

                    if (camp.status === 'completed') {
                      return (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center text-gray-500 font-bold">
                          Hoạt động này đã kết thúc hoặc hoàn thành!
                        </div>
                      );
                    }

                    if (camp.slotsRegistered >= camp.slotsTotal) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-center text-red-700 font-bold">
                          Đã đủ chỉ tiêu số lượng suất đăng ký tối đa cho hoạt động này!
                        </div>
                      );
                    }

                    return (
                      <button
                        onClick={async () => {
                          await handleRegisterCampaign(camp.id);
                          setAlertModal({
                            title: 'Đăng ký thành công',
                            message: `Chúc mừng bạn! Bạn đã đăng ký tham gia hoạt động "${camp.title}" thành công.`
                          });
                          handleClose();
                        }}
                        className="w-full py-3 bg-[#00529C] hover:bg-[#00417C] text-white rounded-2xl font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        ĐĂNG KÝ THAM GIA HOẠT ĐỘNG NGAY
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* MODAL: DOCUMENT PREVIEW */}
      {pendingStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-100 rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[95vh] animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#00529C] to-blue-600 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileText className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">
                    Xác nhận Thông tin & Ký tên Đơn đăng ký Đội viên
                  </h3>
                  <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold mt-0.5">
                    Hội Sinh viên Trường Đại học Đồng Tháp • Đội Công tác Xã hội
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDocx(pendingStudent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#00529C] hover:bg-blue-50 active:scale-98 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border border-transparent"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải biểu mẫu (.doc)</span>
                </button>
                <button 
                  onClick={() => setPendingStudent(null)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content Container (Simulating A4 paper) */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-200/50 flex justify-center">
              <div className="bg-white max-w-3xl w-full shadow-lg border border-gray-200 p-8 md:p-14 text-xs text-black font-serif leading-relaxed relative min-h-[1100px]">
                
                {/* Standard Document Header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
                  <div className="text-center font-bold font-sans tracking-wide text-[10px] sm:text-xs">
                    <p className="text-gray-900">HỘI SINH VIÊN VIỆT NAM</p>
                    <p className="text-gray-900 text-[10px]">BCH HỘI SINH VIÊN VIỆT NAM</p>
                    <p className="text-[#00529C] border-b border-black pb-1.5 inline-block">TRƯỜNG ĐẠI HỌC ĐỒNG THÁP</p>
                    <p className="mt-1 font-normal text-[8px] text-gray-500">***</p>
                  </div>
                  <div className="text-right font-sans italic text-gray-400 text-[10px] pt-1">
                    Số: ....................
                  </div>
                </div>

                {/* Photo space & Document Title */}
                <div className="grid grid-cols-4 gap-4 items-center mb-8">
                  <div className="col-span-1">
                    <div className="border border-dashed border-gray-400 w-24 h-32 rounded flex flex-col items-center justify-center text-center p-2 text-[10px] text-gray-400 font-sans">
                      <span className="font-bold">Ảnh 3x4</span>
                      <span>hoặc 4x6</span>
                    </div>
                  </div>
                  <div className="col-span-3 text-center">
                    <h2 className="font-sans font-extrabold text-gray-900 text-sm sm:text-base leading-tight uppercase tracking-wider">
                      ĐƠN ĐĂNG KÝ THAM GIA
                    </h2>
                    <h3 className="font-sans font-extrabold text-[#00529C] text-xs sm:text-sm mt-1 uppercase tracking-wide">
                      ĐỘI CÔNG TÁC XÃ HỘI TRƯỜNG ĐẠI HỌC ĐỒNG THÁP
                    </h3>
                    <div className="text-gray-400 tracking-widest font-sans font-light mt-1 text-xs">-------------------------</div>
                  </div>
                </div>

                {/* Salutation */}
                <div className="text-center font-bold text-gray-900 mb-6 font-sans text-xs sm:text-sm">
                  Kính gửi: Ban Thư ký Hội Sinh viên Trường Đại học Đồng Tháp
                </div>

                {/* Section I */}
                <div className="space-y-3 font-sans text-gray-800">
                  <h4 className="font-bold text-[#00529C] text-[11px] uppercase tracking-wide border-l-4 border-[#00529C] pl-2 mb-4">
                    PHẦN I. THÔNG TIN CÁ NHÂN
                  </h4>
                  
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-gray-500 font-medium">1. Họ và tên (viết in hoa):</span>
                      <span className="ml-2 font-bold text-gray-900 uppercase border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[200px]">{pendingStudent.name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500 font-medium">2. Giới tính:</span>
                        <span className="ml-2 font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {pendingStudent.gender || 'Nam'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Ngày, tháng, năm sinh:</span>
                        <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block">
                          {(() => {
                            if (pendingStudent.birthDate && pendingStudent.birthDate.includes('-')) {
                              const parts = pendingStudent.birthDate.split('-');
                              if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                            }
                            return pendingStudent.birthDate || 'Chưa cập nhật';
                          })()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">3. Chi hội:</span>
                      <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[300px]">{pendingStudent.subBranch || 'Chưa đăng ký'}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">4. Khoa:</span>
                      <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[300px]">{pendingStudent.faculty}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">5. Ngành học:</span>
                      <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[300px]">{pendingStudent.major || 'Chưa cập nhật'}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">6. Số căn cước công dân:</span>
                      <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[200px]">{pendingStudent.idCard || 'Chưa cập nhật'}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">7. Địa chỉ thường trú (xã/phường, tỉnh):</span>
                      <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[350px]">{pendingStudent.address || 'Chưa cập nhật'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500 font-medium">8. Địa chỉ email:</span>
                        <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block">{pendingStudent.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">9. Số điện thoại liên hệ:</span>
                        <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block">{pendingStudent.phone}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">10. Tên CLB/đội/nhóm đang tham gia (nếu có):</span>
                      <span className="ml-2 font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[250px]">{pendingStudent.club || 'Không tham gia'}</span>
                    </div>
                  </div>
                </div>

                {/* Section II */}
                <div className="space-y-4 font-sans text-gray-800 mt-8">
                  <h4 className="font-bold text-emerald-600 text-[11px] uppercase tracking-wide border-l-4 border-emerald-500 pl-2 mb-4">
                    PHẦN II. ĐẶC ĐIỂM CÁ NHÂN VÀ NGUYỆN VỌNG
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-500 font-semibold block mb-2">1. Hình thức hoạt động tình nguyện:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 bg-gray-50 p-4 rounded-xl border border-gray-150">
                        {AVAILABLE_SKILLS.map((skill) => {
                          const checked = pendingStudent.skills?.includes(skill);
                          return (
                            <div key={skill} className="flex items-center gap-2 text-[10px] font-medium text-gray-700">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}>
                                {checked && <Check className="w-2.5 h-2.5 font-bold" />}
                              </span>
                              <span>{skill}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-gray-500 font-medium block">Kỹ năng khác (ghi rõ):</span>
                        <span className="font-semibold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[150px]">{pendingStudent.otherSkill || 'Không có'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium block">Công cụ AI thành thạo nhất:</span>
                        <span className="font-bold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 inline-block min-w-[150px]">{pendingStudent.aiTool || 'Không có'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium block">Đường dẫn sản phẩm thiết kế/đã làm:</span>
                      <span className="font-semibold text-blue-600 break-all">{pendingStudent.portfolioUrl || 'Chưa cập nhật'}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-gray-500 font-semibold block">2. Địa chỉ mạng xã hội cá nhân:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-3">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Facebook</span>
                          <span className="font-semibold text-gray-900">{pendingStudent.facebook || 'Chưa cập nhật'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">TikTok</span>
                          <span className="font-semibold text-gray-900">{pendingStudent.tiktok || 'Chưa cập nhật'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Khác</span>
                          <span className="font-semibold text-gray-900">{pendingStudent.otherSocial || 'Chưa cập nhật'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-gray-100">
                      <span className="text-gray-500 font-semibold block">3. Tiến độ tích lũy ngày Công tác xã hội:</span>
                      <div className="grid grid-cols-2 gap-4 pl-3">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Đã tích luỹ</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block">{pendingStudent.ctxhAccumulated ?? 0} ngày</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Còn thiếu</span>
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded inline-block">{pendingStudent.ctxhMissing ?? 0} ngày</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 font-semibold block">4. Nguyện vọng / Kỳ vọng cá nhân khi tham gia Đội Công tác xã hội:</span>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 italic leading-relaxed text-[10.5px]">
                        {pendingStudent.aspiration || 'Không có nguyện vọng đặc biệt.'}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-gray-200 text-justify text-[10px] text-gray-600 leading-relaxed">
                      <p className="font-semibold text-gray-800 uppercase mb-1">CAM KẾT:</p>
                      Tôi xin cam kết toàn bộ thông tin khai báo trong đơn này là hoàn toàn trung thực, chính xác và chịu hoàn toàn trách nhiệm trước Ban Chấp hành Hội Sinh viên Trường về tính xác thực của các thông tin đã cung cấp.
                    </div>

                    {/* Date and Sign signature placeholder */}
                    <div className="grid grid-cols-2 gap-4 pt-8 font-sans">
                      <div></div>
                      <div className="text-center space-y-1">
                        <p className="italic text-gray-500 text-[10px]">Đồng Tháp, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                        <p className="font-bold text-gray-800">NGƯỜI ĐĂNG KÝ</p>
                        <p className="text-[9px] text-gray-400 italic">(Ký và ghi rõ họ tên)</p>
                        <div className="h-16"></div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide text-xs">{pendingStudent.name}</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Footer containing interaction buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <span className="text-[11px] text-gray-500 font-semibold text-center sm:text-left">
                * Vui lòng kiểm tra kỹ thông tin. Nhấn "Xác nhận đăng ký" để gửi hồ sơ đến Ban điều hành (Admin).
              </span>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setPendingStudent(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-600 font-bold transition-colors cursor-pointer text-center text-xs"
                >
                  Quay lại chỉnh sửa
                </button>
                <button
                  onClick={handleConfirmSignUp}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

