import React, { useState, useEffect } from 'react';
import StudentView from './components/StudentView';
import AdminView from './components/AdminView';
import { Campaign, Student, Registration, Statistics } from './types';
import { initialCampaigns, initialStudents, initialRegistrations } from './data/mockData';
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
  AlertCircle
} from 'lucide-react';

const STORAGE_KEY_CAMPAIGNS = 'vol_portal_campaigns';
const STORAGE_KEY_STUDENTS = 'vol_portal_students';
const STORAGE_KEY_REGISTRATIONS = 'vol_portal_registrations';
const STORAGE_KEY_CURRENT_USER = 'vol_portal_current_user';
const STORAGE_KEY_ROLE = 'vol_portal_role';

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
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

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

  // Save state changes to localStorage for visual durability
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEY_ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_ROLE);
    }
  }, [currentUser, role]);

  // Handle registration via URL scan (QR Code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const campaignId = params.get('campaignId');

    if (action === 'register' && campaignId) {
      // Find the campaign
      const camp = campaigns.find(c => c.id === campaignId);
      if (!camp) {
        setAlertModal({
          title: 'Lỗi quét mã QR',
          message: 'Không tìm thấy thông tin hoạt động này trong hệ thống!'
        });
        // Clear URL search params
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Check if student is logged in
      if (!currentUser || role !== 'student') {
        setAlertModal({
          title: 'Yêu cầu đăng nhập',
          message: `Bạn đã quét mã đăng ký hoạt động: "${camp.title}". Vui lòng ĐĂNG NHẬP (hoặc ĐĂNG KÝ) tài khoản Đội viên để hệ thống tiến hành ghi nhận đăng ký của bạn!`
        });
        // Clear URL search params
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // If logged in, proceed to register
      const currentStudent = currentUser as Student;
      const alreadyRegistered = registrations.some(r => r.studentId === currentStudent.id && r.campaignId === campaignId);

      if (alreadyRegistered) {
        setAlertModal({
          title: 'Đăng ký đã tồn tại',
          message: `Bạn đã đăng ký hoạt động "${camp.title}" trước đó rồi!`
        });
      } else if (camp.status === 'paused') {
        setAlertModal({
          title: 'Hoạt động đang tạm dừng',
          message: `Hoạt động "${camp.title}" hiện đang tạm dừng nhận đăng ký!`
        });
      } else if (camp.status === 'completed') {
        setAlertModal({
          title: 'Hoạt động đã kết thúc',
          message: `Hoạt động "${camp.title}" đã kết thúc hoặc hoàn thành!`
        });
      } else if (camp.slotsRegistered >= camp.slotsTotal) {
        setAlertModal({
          title: 'Đầy chỉ tiêu',
          message: `Hoạt động "${camp.title}" đã đạt đủ chỉ tiêu suất đăng ký tối đa!`
        });
      } else {
        // Register successfully!
        const newRegistration: Registration = {
          id: `reg-${Date.now()}`,
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          studentClass: currentStudent.className,
          studentFaculty: currentStudent.faculty,
          campaignId: campaignId,
          campaignTitle: camp.title,
          registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          status: 'pending',
          attendanceStatus: 'none'
        };

        setCampaigns(prev => prev.map(c => {
          if (c.id === campaignId) {
            return { ...c, slotsRegistered: c.slotsRegistered + 1 };
          }
          return c;
        }));

        setRegistrations(prev => [newRegistration, ...prev]);

        setAlertModal({
          title: 'Đăng ký thành công',
          message: `Chúc mừng bạn! Bạn đã đăng ký tham gia hoạt động "${camp.title}" thành công qua mã QR.`
        });
      }

      // Clear search params from URL so it doesn't trigger again on subsequent re-renders
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, role, campaigns, registrations]);

  // Active student reference computed from current logged in user
  const activeStudent = (currentUser && role === 'student') ? (currentUser as Student) : students[0];

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
      if (loginAdminUser === 'admin' && loginAdminPass === 'admin') {
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

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegSuccess('');

    if (!regName || !regId || !regClass || !regEmail || !regPhone) {
      setLoginError('Vui lòng điền đầy đủ tất cả các trường!');
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
      name: regName,
      studentId: regId,
      faculty: regFaculty,
      className: regClass,
      email: regEmail,
      phone: regPhone,
      totalHours: 0,
      totalScore: 0,
      status: 'active',
      role: 'student'
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    
    // Auto fill login ID and show success
    setLoginStudentId(regId);
    setRegSuccess('Đăng ký tài khoản thành công! Nhập MSSV của bạn để đăng nhập ngay.');
    setShowSignUp(false);

    // Reset fields
    setRegName('');
    setRegId('');
    setRegClass('');
    setRegEmail('');
    setRegPhone('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginStudentId('');
    setLoginError('');
    setRegSuccess('');
  };

  // STUDENT ACTIONS
  // Registering for a campaign
  const handleRegisterCampaign = (campaignId: string) => {
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

    // Update campaign registered slots
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return { ...c, slotsRegistered: c.slotsRegistered + 1 };
      }
      return c;
    }));

    setRegistrations(prev => [newRegistration, ...prev]);
  };

  // Cancelling registration
  const handleCancelRegistration = (regId: string) => {
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

    // Decrement campaign registered slots
    setCampaigns(prev => prev.map(c => {
      if (c.id === reg.campaignId) {
        return { ...c, slotsRegistered: Math.max(0, c.slotsRegistered - 1) };
      }
      return c;
    }));

    setRegistrations(prev => prev.filter(r => r.id !== regId));
  };

  // ADMIN ACTIONS
  // Approve or Reject student registration
  const handleApproveRegistration = (regId: string, status: 'approved' | 'rejected') => {
    setRegistrations(prev => prev.map(r => {
      if (r.id === regId) {
        return { ...r, status: status };
      }
      return r;
    }));
  };

  // Create new campaign
  const handleCreateCampaign = (newCampData: Omit<Campaign, 'id' | 'slotsRegistered'>) => {
    const newCamp: Campaign = {
      ...newCampData,
      id: `camp-${Date.now()}`,
      slotsRegistered: 0
    };
    setCampaigns(prev => [newCamp, ...prev]);
  };

  // Toggle student account lock
  const handleToggleLockStudent = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const nextStatus = s.status === 'locked' ? 'active' : 'locked';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Toggle student leadership role
  const handleToggleLeaderRole = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const nextRole = s.role === 'leader' ? 'student' : 'leader';
        return { ...s, role: nextRole };
      }
      return s;
    }));
  };

  // Complete Campaign (Mark attendance & performance grade)
  const handleCompleteCampaignRegistration = (
    regId: string, 
    attendance: 'present' | 'absent' | 'excused', 
    score: number
  ) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    // Update registration status
    setRegistrations(prev => prev.map(r => {
      if (r.id === regId) {
        return { 
          ...r, 
          status: 'completed',
          attendanceStatus: attendance,
          performanceScore: score
        };
      }
      return r;
    }));

    // Credit Points & Hours to the student
    const campaign = campaigns.find(c => c.id === reg.campaignId);
    if (!campaign) return;

    setStudents(prev => prev.map(s => {
      if (s.id === reg.studentId) {
        let scoreToAward = 0;
        let hoursToAward = 0;

        if (attendance === 'present') {
          if (campaign.scoreType === 'Ngày') {
            scoreToAward = campaign.score;
          } else {
            hoursToAward = campaign.score;
          }
        }

        return {
          ...s,
          totalScore: s.totalScore + scoreToAward,
          totalHours: s.totalHours + hoursToAward
        };
      }
      return s;
    }));
  };

  // Delete student account
  const handleDeleteStudent = (studentId: string) => {
    setConfirmModal({
      title: 'Xác nhận xóa thành viên',
      message: 'Bạn có chắc muốn xóa thành viên này? Mọi thông tin đăng ký hoạt động của thành viên này cũng sẽ bị xóa.',
      onConfirm: () => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        setRegistrations(prev => prev.filter(r => r.studentId !== studentId));
        setConfirmModal(null);
      }
    });
  };

  // Update campaign status (Pause, Stop/Complete, Open)
  const handleUpdateCampaignStatus = (campaignId: string, status: 'open' | 'paused' | 'completed') => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return { ...c, status };
      }
      return c;
    }));
  };

  // Delete campaign
  const handleDeleteCampaign = (campaignId: string) => {
    setConfirmModal({
      title: 'Xác nhận xóa hoạt động',
      message: 'Bạn có chắc muốn xóa hoạt động này? Mọi thông tin đăng ký liên quan sẽ bị xóa.',
      onConfirm: () => {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setRegistrations(prev => prev.filter(r => r.campaignId !== campaignId));
        setConfirmModal(null);
      }
    });
  };

  // Reset state helper
  const handleResetDemoState = () => {
    setConfirmModal({
      title: 'Đặt lại toàn bộ dữ liệu',
      message: 'Bạn có chắc muốn đặt lại toàn bộ dữ liệu? Phiên đăng nhập hiện tại cũng sẽ được đăng xuất.',
      onConfirm: () => {
        localStorage.clear();
        setCampaigns(initialCampaigns);
        setStudents(initialStudents);
        setRegistrations(initialRegistrations);
        setCurrentUser(null);
        setConfirmModal(null);
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
            <div className="shrink-0">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_H%E1%BB%99i_Sinh_vi%C3%AAn_Vi%E1%BB%87t_Nam.svg" 
                alt="Logo Hội Sinh viên Việt Nam" 
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Logo_H%E1%BB%99i_Sinh_vi%C3%AAn_Vi%E1%BB%87t_Nam.svg/512px-Logo_H%E1%BB%99i_Sinh_vi%C3%AAn_Vi%E1%BB%87t_Nam.svg.png";
                }}
              />
            </div>

            <div>
              <h1 className="text-xs sm:text-sm font-display font-bold text-[#00529C] uppercase tracking-wide line-clamp-1">
                Phần mềm Quản lý Tình nguyện & Công tác Xã hội
              </h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Hội Sinh viên Trường Đại học Đồng Tháp
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
          <div className="max-w-md mx-auto px-4 py-12 flex flex-col justify-center min-h-[70vh]">
            
            {/* Dynamic Login / Registration Box */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-md flex flex-col justify-between">
              
              <div>
                {/* Header text */}
                <div className="mb-6 flex flex-col items-center text-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_H%E1%BB%99i_Sinh_vi%C3%AAn_Vi%E1%BB%87t_Nam.svg" 
                    alt="Logo Hội Sinh viên Việt Nam" 
                    className="w-16 h-16 object-contain mb-3"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Logo_H%E1%BB%99i_Sinh_vi%C3%AAn_Vi%E1%BB%87t_Nam.svg/512px-Logo_H%E1%BB%99i_Sinh_vi%C3%AAn_Vi%E1%BB%87t_Nam.svg.png";
                    }}
                  />
                  <h3 className="text-lg font-display font-bold text-gray-800">
                    {showSignUp ? 'Đăng ký tài khoản Đội viên' : 'Đăng nhập hệ thống'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    {showSignUp ? 'Vui lòng cung cấp chính xác thông tin để Đoàn trường tích luỹ ĐRL cho bạn' : 'Chọn phân hệ tương ứng bên dưới để bắt đầu sử dụng'}
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
                  /* SIGN UP FORM (Dynamic creation) */
                  <form onSubmit={handleSignUp} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-gray-500 font-semibold">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-500 font-semibold">MSSV *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: 0022110255"
                          value={regId}
                          onChange={(e) => setRegId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-gray-500 font-semibold">Lớp *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: ĐHSKHTN24A"
                          value={regClass}
                          onChange={(e) => setRegClass(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-500 font-semibold">Khoa *</label>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-500 font-semibold">Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="nguyenvana@student.edu.vn"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-gray-500 font-semibold">Số điện thoại *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0912..."
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5"
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

    </div>
  );
}

