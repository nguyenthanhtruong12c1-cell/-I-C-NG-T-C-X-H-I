import React, { useState } from 'react';
import { Campaign, Student, Registration, Statistics } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  FolderGit2, 
  Plus, 
  Search, 
  Lock, 
  Unlock, 
  Shield, 
  ShieldAlert, 
  Check, 
  X, 
  Calendar, 
  MapPin, 
  Award, 
  Clock, 
  PlusCircle, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  Filter,
  CheckCircle2,
  GraduationCap,
  Trash2,
  Play,
  Pause,
  Ban,
  QrCode,
  Clipboard,
  ExternalLink
} from 'lucide-react';

interface AdminViewProps {
  campaigns: Campaign[];
  students: Student[];
  registrations: Registration[];
  stats: Statistics;
  onCreateCampaign: (newCampaign: Omit<Campaign, 'id' | 'slotsRegistered'>) => void;
  onApproveRegistration: (regId: string, status: 'approved' | 'rejected') => void;
  onToggleLockStudent: (studentId: string) => void;
  onToggleLeaderRole: (studentId: string) => void;
  onCompleteCampaignRegistration: (regId: string, attendance: 'present' | 'absent' | 'excused', score: number) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onUpdateCampaignStatus?: (campaignId: string, status: 'open' | 'paused' | 'completed') => void;
}

export default function AdminView({
  campaigns,
  students,
  registrations,
  stats,
  onCreateCampaign,
  onApproveRegistration,
  onToggleLockStudent,
  onToggleLeaderRole,
  onCompleteCampaignRegistration,
  onDeleteStudent,
  onDeleteCampaign,
  onUpdateCampaignStatus
}: AdminViewProps) {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'students' | 'campaigns' | 'reports'>('dashboard');
  
  // Registration list modal state
  const [viewingCampRegsId, setViewingCampRegsId] = useState<string | null>(null);
  const [campRegsSearch, setCampRegsSearch] = useState('');
  
  // QR code modal state
  const [viewingQrCampId, setViewingQrCampId] = useState<string | null>(null);
  const [qrCopied, setQrCopied] = useState(false);
  
  // Search and filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFacultyFilter, setStudentFacultyFilter] = useState('all');
  const [campaignSearch, setCampaignSearch] = useState('');
  
  // Modal State for New Campaign
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampDept, setNewCampDept] = useState<'Đoàn Thanh niên' | 'Hội Sinh viên'>('Đoàn Thanh niên');
  const [newCampDate, setNewCampDate] = useState('2026-07-15 đến 2026-07-25');
  const [newCampType, setNewCampType] = useState('Chiến dịch hè');
  const [newCampLocation, setNewCampLocation] = useState('Trực tiếp tại trường');
  const [newCampSlots, setNewCampSlots] = useState(50);
  const [newCampScore, setNewCampScore] = useState<number | string>(1.5);
  const [newCampScoreType, setNewCampScoreType] = useState<'Ngày' | 'Giờ'>('Ngày');

  // Attendance and Performance grading states
  const [selectedEvaluationReg, setSelectedEvaluationReg] = useState<Registration | null>(null);
  const [evalAttendance, setEvalAttendance] = useState<'present' | 'absent' | 'excused'>('present');
  const [evalScore, setEvalScore] = useState<number>(9);

  // Filter lists
  const filteredStudents = students.filter(std => {
    const matchesSearch = std.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          std.studentId.includes(studentSearch);
    const matchesFaculty = studentFacultyFilter === 'all' || std.faculty === studentFacultyFilter;
    return matchesSearch && matchesFaculty;
  });

  const filteredCampaigns = campaigns.filter(camp => 
    camp.title.toLowerCase().includes(campaignSearch.toLowerCase()) || 
    camp.department.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  // List of unique faculties for filter dropdown
  const faculties = Array.from(new Set(students.map(s => s.faculty)));

  // Get pending registrations
  const pendingRegs = registrations.filter(r => r.status === 'pending');
  
  // Get approved but incomplete registrations for attendance/evaluation grading
  const gradableRegs = registrations.filter(r => r.status === 'approved');

  // Handle campaign form submission
  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampTitle || !newCampDesc) {
      alert('Vui lòng nhập đầy đủ Tên và Mô tả chiến dịch!');
      return;
    }
    onCreateCampaign({
      title: newCampTitle,
      description: newCampDesc,
      department: newCampDept,
      date: newCampDate,
      status: 'open',
      slotsTotal: Number(newCampSlots),
      score: Number(newCampScore),
      scoreType: newCampScoreType,
      type: newCampType,
      location: newCampLocation,
      skillsRequired: ['Nhiệt huyết', 'Đúng giờ']
    });
    // Reset form & close
    setNewCampTitle('');
    setNewCampDesc('');
    setNewCampSlots(50);
    setNewCampScore(1.5);
    setShowCreateModal(false);
  };

  // Submit Evaluation
  const handleEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvaluationReg) return;
    onCompleteCampaignRegistration(
      selectedEvaluationReg.id,
      evalAttendance,
      evalScore
    );
    setSelectedEvaluationReg(null);
  };

  // CSV Report Generator Simulator
  const handleExportCSV = (reportType: string) => {
    let headers = '';
    let rows: string[][] = [];
    let filename = '';

    if (reportType === 'students') {
      headers = 'Họ tên,MSSV,Khoa,Lớp,Số giờ đóng góp,Số ngày CTXH,Trạng thái\n';
      rows = students.map(s => [s.name, s.studentId, s.faculty, s.className, s.totalHours.toString(), s.totalScore.toString(), s.status]);
      filename = 'Bao_cao_sinh_vien_tinh_nguyen.csv';
    } else {
      headers = 'Tên hoạt động,Ban tổ chức,Ngày diễn ra,Thể loại,Địa điểm,Sĩ số dự kiến,Đã đăng ký\n';
      rows = campaigns.map(c => [c.title, c.department, c.date, c.type, c.location, c.slotsTotal.toString(), c.slotsRegistered.toString()]);
      filename = 'Danh_sach_chien_dich_tinh_nguyen.csv';
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers 
      + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* SIDEBAR NAVIGATION - Styled beautifully */}
      <div className="w-full lg:w-64 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs h-fit space-y-2">
        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          HỆ THỐNG ĐIỀU HÀNH
        </div>

        <button
          onClick={() => setActiveMenu('dashboard')}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeMenu === 'dashboard'
              ? 'bg-[#00529C] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          id="menu-dashboard"
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Tổng quan</span>
          </div>
          {pendingRegs.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeMenu === 'dashboard' ? 'bg-white text-[#00529C]' : 'bg-red-500 text-white'}`}>
              {pendingRegs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMenu('students')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeMenu === 'students'
              ? 'bg-[#00529C] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          id="menu-students"
        >
          <Users className="w-4 h-4" />
          <span>Quản lý Sinh viên</span>
        </button>

        <button
          onClick={() => setActiveMenu('campaigns')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeMenu === 'campaigns'
              ? 'bg-[#00529C] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          id="menu-campaigns"
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Quản lý Chiến dịch</span>
        </button>

        <button
          onClick={() => setActiveMenu('reports')}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeMenu === 'reports'
              ? 'bg-[#00529C] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          id="menu-reports"
        >
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4" />
            <span>Đánh giá & Chấm điểm</span>
          </div>
          {gradableRegs.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white`}>
              {gradableRegs.length}
            </span>
          )}
        </button>
      </div>

      {/* MAIN ADMIN WORKSPACE */}
      <div className="flex-1 space-y-6">
        
        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeMenu === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Thống kê Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tổng số sinh viên</span>
                <span className="text-2xl font-bold text-gray-800 block mt-1">{stats.totalStudents}</span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center mt-1">Đã kích hoạt hoạt động</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Chiến dịch đang mở</span>
                <span className="text-2xl font-bold text-[#00529C] block mt-1">{stats.activeCampaigns} / {stats.totalCampaigns}</span>
                <span className="text-[10px] text-gray-500 font-medium flex items-center mt-1">Hoạt động Đoàn / Hội</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tổng giờ đóng góp</span>
                <span className="text-2xl font-bold text-[#00AEEF] block mt-1">{stats.totalHoursContributed} Giờ</span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center mt-1">Công tác xã hội</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Ngày CTXH quy đổi</span>
                <span className="text-2xl font-bold text-amber-600 block mt-1">+{stats.totalScoreAwarded} Ngày</span>
                <span className="text-[10px] text-[#00529C] font-semibold flex items-center mt-1">Hội Sinh viên quy đổi</span>
              </div>
            </div>

            {/* Vùng duyệt Đăng ký khẩn cấp (Pending Registrations Approval List) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center">
                  <Clock className="w-4 h-4 text-[#00529C] mr-1.5" />
                  Yêu cầu đăng ký chờ duyệt ({pendingRegs.length})
                </h3>
                <span className="text-[10px] text-gray-400 font-semibold">Cần phê duyệt trước hoạt động</span>
              </div>

              {pendingRegs.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400">Không có đơn đăng ký nào đang chờ phê duyệt.</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                  {pendingRegs.map((reg) => (
                    <div 
                      key={reg.id} 
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between flex-wrap gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-gray-900 font-semibold">{reg.studentName}</strong>
                          <span className="text-gray-400">({reg.studentClass} • {reg.studentFaculty})</span>
                        </div>
                        <p className="text-gray-500 mt-0.5 font-medium">Đăng ký tham gia: <span className="text-[#00529C]">{reg.campaignTitle}</span></p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApproveRegistration(reg.id, 'rejected')}
                          className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-semibold transition-all flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Từ chối
                        </button>
                        <button
                          onClick={() => onApproveRegistration(reg.id, 'approved')}
                          className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Duyệt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Biểu đồ Cột tiến độ chiến dịch - Rendered with pure responsive HTML/SVG */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Biểu đồ tiến độ thu hút chiến dịch</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Tỷ lệ đăng ký thực tế so với giới hạn của chiến dịch</p>
                </div>
                <span className="text-xs font-bold text-[#00529C] bg-blue-50 px-2.5 py-1 rounded-lg">Cập nhật thời gian thực</span>
              </div>

              {/* Progress visual bar list */}
              <div className="space-y-4">
                {campaigns.map((camp) => {
                  const percent = Math.min(100, Math.round((camp.slotsRegistered / camp.slotsTotal) * 100));
                  return (
                    <div key={camp.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700 truncate max-w-xs md:max-w-md">{camp.title}</span>
                        <span className="text-gray-500 font-mono font-medium">{camp.slotsRegistered}/{camp.slotsTotal} suất ({percent}%)</span>
                      </div>
                      
                      <div className="relative w-full h-4 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                        <div 
                          className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 ${
                            camp.department === 'Đoàn Thanh niên' 
                              ? 'bg-gradient-to-r from-blue-700 to-[#00529C]' 
                              : 'bg-gradient-to-r from-sky-400 to-[#00AEEF]'
                          }`}
                          style={{ width: `${percent}%` }}
                        >
                          {percent > 15 && (
                            <span className="text-[8px] text-white font-extrabold">{percent}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Decorative SVG Axes for a high fidelity feel */}
              <div className="border-t border-gray-100 mt-6 pt-3 flex justify-between text-[10px] text-gray-400 font-mono">
                <span>0% Khởi động</span>
                <span>25% Đăng ký nhiều</span>
                <span>50% Sắp đầy</span>
                <span>75% Quá tải</span>
                <span>100% Đóng form</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: STUDENT MANAGEMENT */}
        {activeMenu === 'students' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">Danh mục Quản lý Sinh viên</h3>
                <p className="text-xs text-gray-400 mt-0.5">Quản lý trạng thái, cấp quyền nhóm trưởng và theo dõi thành tích tích lũy</p>
              </div>

              <button
                onClick={() => handleExportCSV('students')}
                className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start md:self-auto"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Xuất danh sách (Excel)
              </button>
            </div>

            {/* Trình tìm kiếm & Bộ lọc khoa */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên sinh viên, MSSV..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-500">Khoa:</span>
                <select
                  value={studentFacultyFilter}
                  onChange={(e) => setStudentFacultyFilter(e.target.value)}
                  className="bg-transparent border-none font-semibold focus:outline-none text-gray-700 cursor-pointer text-xs"
                >
                  <option value="all">Tất cả khoa</option>
                  {faculties.map((fac) => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bảng dữ liệu sinh viên */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
                    <th className="p-3.5">Họ & Tên / MSSV</th>
                    <th className="p-3.5">Khoa / Lớp</th>
                    <th className="p-3.5">Vai trò</th>
                    <th className="p-3.5 text-center">Hoạt động / Ngày CTXH</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-800">{std.name}</div>
                        <div className="font-mono text-[10px] text-gray-400 mt-0.5">{std.studentId}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-gray-700 font-medium">{std.faculty}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">{std.className}</div>
                      </td>
                      <td className="p-3.5">
                        {std.role === 'leader' ? (
                          <span className="bg-blue-50 text-[#00529C] border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                            Nhóm trưởng
                          </span>
                        ) : std.role === 'admin' ? (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                            Ban điều hành
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px]">
                            Đội viên
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="font-bold text-gray-800">{std.totalHours} giờ</div>
                        <div className="text-emerald-600 font-semibold text-[10px] mt-0.5">+{std.totalScore} ngày</div>
                      </td>
                      <td className="p-3.5">
                        {std.status === 'active' && (
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium text-[10px]">
                            Đang hoạt động
                          </span>
                        )}
                        {std.status === 'pending' && (
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium text-[10px]">
                            Chờ kích hoạt
                          </span>
                        )}
                        {std.status === 'locked' && (
                          <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-medium text-[10px]">
                            Đã khóa sổ
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {/* Phân nhóm trưởng */}
                        <button
                          onClick={() => onToggleLeaderRole(std.id)}
                          className={`p-1.5 rounded-lg border transition-colors inline-flex`}
                          title={std.role === 'leader' ? 'Hạ cấp Đội viên' : 'Phong chức Nhóm trưởng'}
                        >
                          <Shield className={`w-3.5 h-3.5 ${std.role === 'leader' ? 'text-amber-600' : 'text-gray-400'}`} />
                        </button>

                        {/* Khóa mở tài khoản */}
                        <button
                          onClick={() => onToggleLockStudent(std.id)}
                          className={`p-1.5 rounded-lg border transition-colors inline-flex`}
                          title={std.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        >
                          {std.status === 'locked' ? (
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </button>

                        {/* Xóa thành viên */}
                        <button
                          onClick={() => onDeleteStudent(std.id)}
                          className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 transition-colors inline-flex"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: CAMPAIGNS MANAGEMENT */}
        {activeMenu === 'campaigns' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">Quản lý Chiến dịch Tình nguyện</h3>
                <p className="text-xs text-gray-400 mt-0.5">Khởi tạo và thiết lập các hoạt động cho Đoàn viên tham gia đăng ký</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleExportCSV('campaigns')}
                  className="px-3 py-2 text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
                >
                  Xuất báo cáo
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-2 bg-[#00529C] hover:bg-[#003B70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  Tạo chiến dịch mới
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm chiến dịch bằng tên hoặc đơn vị..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15 text-xs"
              />
            </div>

            {/* Campaign Grid List in Admin Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCampaigns.map((camp) => (
                <div key={camp.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase text-white ${
                        camp.department === 'Đoàn Thanh niên' ? 'bg-[#00529C]' : 'bg-[#00AEEF]'
                      }`}>
                        {camp.department}
                      </span>
                      <h4 className="font-semibold text-gray-900 text-sm mt-1.5">{camp.title}</h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        camp.status === 'open' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : camp.status === 'closing_soon' 
                          ? 'bg-amber-50 text-amber-700' 
                          : camp.status === 'paused'
                          ? 'bg-orange-50 text-orange-700 border border-orange-100'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {camp.status === 'open' 
                          ? 'Đang tuyển' 
                          : camp.status === 'closing_soon' 
                          ? 'Sắp đóng' 
                          : camp.status === 'paused' 
                          ? 'Tạm dừng' 
                          : 'Đã kết thúc'}
                      </span>
                      <button
                        onClick={() => onDeleteCampaign(camp.id)}
                        className="p-1 text-red-500 hover:bg-red-50 border border-red-100 rounded-md transition-colors"
                        title="Xóa hoạt động"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs line-clamp-2">{camp.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                    <div>📅 Lịch: <strong className="text-gray-700 font-medium">{camp.date}</strong></div>
                    <div>📍 Nơi: <strong className="text-gray-700 font-medium truncate inline-block w-28 align-bottom">{camp.location}</strong></div>
                    <div>🎯 Chỉ tiêu: <strong className="text-gray-700 font-medium">{camp.slotsRegistered} / {camp.slotsTotal}</strong></div>
                    <div>💎 Tích luỹ: <strong className="text-emerald-700 font-semibold">+{camp.score} {camp.scoreType}</strong></div>
                  </div>

                  {/* Tác vụ quản lý hoạt động */}
                  <div className="flex gap-1.5 flex-wrap items-center pt-2 border-t border-gray-100/30">
                    {/* Nút tạm dừng / tiếp tục */}
                    {onUpdateCampaignStatus && camp.status !== 'completed' && (
                      <button
                        onClick={() => {
                          if (camp.status === 'paused') {
                            onUpdateCampaignStatus(camp.id, 'open');
                          } else {
                            onUpdateCampaignStatus(camp.id, 'paused');
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          camp.status === 'paused'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                        }`}
                        title={camp.status === 'paused' ? 'Mở lại hoạt động đăng ký' : 'Tạm dừng hoạt động đăng ký'}
                      >
                        {camp.status === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        {camp.status === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                      </button>
                    )}

                    {/* Nút Kết thúc hoạt động */}
                    {onUpdateCampaignStatus && camp.status !== 'completed' && (
                      <button
                        onClick={() => onUpdateCampaignStatus(camp.id, 'completed')}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Kết thúc hoạt động"
                      >
                        <Ban className="w-3 h-3" />
                        Kết thúc
                      </button>
                    )}

                    {/* Nút tạo mã QR đăng ký */}
                    <button
                      onClick={() => {
                        setViewingQrCampId(camp.id);
                        setQrCopied(false);
                      }}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ml-auto cursor-pointer"
                      title="Tạo mã QR Đăng ký"
                    >
                      <QrCode className="w-3 h-3" />
                      Mã QR Đăng ký
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setViewingCampRegsId(camp.id);
                      setCampRegsSearch('');
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#00529C] hover:text-[#003B70] border border-blue-200 hover:border-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    Danh sách đăng ký ({registrations.filter(r => r.campaignId === camp.id).length})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: ASSESSMENT & GRADING */}
        {activeMenu === 'reports' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4 animate-fade-in">
            <div>
              <h3 className="text-base font-bold text-gray-800">Cổng điểm danh & Đánh giá hiệu suất</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tiến hành điểm danh, ghi nhận giờ và phê duyệt phát chứng chỉ số sau khi hoàn tất chiến dịch</p>
            </div>

            {gradableRegs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Không có sinh viên nào cần đánh giá vào lúc này.</p>
                <p className="text-xs text-gray-400 mt-1">Duyệt sinh viên tham gia chiến dịch ở phần "Dashboard Tổng quan" trước.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
                      <th className="p-3">Họ Tên Sinh Viên</th>
                      <th className="p-3">Hoạt động / Chiến dịch</th>
                      <th className="p-3 text-center">Trạng thái duyệt</th>
                      <th className="p-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {gradableRegs.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50/40">
                        <td className="p-3">
                          <div className="font-semibold text-gray-800">{reg.studentName}</div>
                          <div className="text-gray-400 text-[10px] mt-0.5">{reg.studentClass} • {reg.studentFaculty}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-700">{reg.campaignTitle}</div>
                          <div className="text-gray-400 text-[10px] mt-0.5">Thời gian tuyển hè 2026</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-medium text-[10px]">
                            Đã phê duyệt tham gia
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedEvaluationReg(reg)}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#00529C] to-[#00AEEF] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
                            id={`btn-evaluate-${reg.id}`}
                          >
                            Điểm danh & Chấm điểm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: TẠO CHIẾN DỊCH MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-800 text-sm">
                Khởi tạo Chiến dịch Tình nguyện Mới
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Tên chiến dịch */}
              <div className="space-y-1">
                <label className="text-gray-500 font-semibold">Tên hoạt động/chiến dịch *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tập huấn kỹ năng số 2026..."
                  value={newCampTitle}
                  onChange={(e) => setNewCampTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15"
                />
              </div>

              {/* Đơn vị tổ chức & Loại hình */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-500 font-semibold">Đơn vị chủ quản *</label>
                  <select
                    value={newCampDept}
                    onChange={(e: any) => setNewCampDept(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15 font-semibold text-gray-700"
                  >
                    <option value="Đoàn Thanh niên">Đoàn Thanh niên</option>
                    <option value="Hội Sinh viên">Hội Sinh viên</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 font-semibold">Thể loại hoạt động *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tập huấn, Tiếp sức..."
                    value={newCampType}
                    onChange={(e) => setNewCampType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Mô tả chiến dịch */}
              <div className="space-y-1">
                <label className="text-gray-500 font-semibold">Mô tả công việc và Quyền lợi *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mô tả cụ thể yêu cầu của Đoàn/Hội khi tham gia..."
                  value={newCampDesc}
                  onChange={(e) => setNewCampDesc(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15"
                />
              </div>

              {/* Địa điểm & Cài đặt thời gian */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-500 font-semibold">Địa điểm diễn ra *</label>
                  <input
                    type="text"
                    required
                    placeholder="Địa điểm hoặc Online"
                    value={newCampLocation}
                    onChange={(e) => setNewCampLocation(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 font-semibold">Cài đặt thời gian (Date Picker) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 2026-07-15 đến 2026-07-20"
                    value={newCampDate}
                    onChange={(e) => setNewCampDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Giới hạn chỉ tiêu & Số ngày quy đổi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 font-semibold">Chỉ tiêu suất *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newCampSlots}
                    onChange={(e) => setNewCampSlots(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 font-semibold">Số ngày quy đổi *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min={0}
                    placeholder="Ví dụ: 1.5"
                    value={newCampScore}
                    onChange={(e) => setNewCampScore(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold text-gray-500 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00529C] hover:bg-[#003B70] text-white rounded-xl font-semibold shadow-xs hover:shadow transition-all"
                  id="btn-submit-campaign"
                >
                  Khởi chạy chiến dịch
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EVALUATION / ATTENDANCE & PERFORMANCE GRADING MODAL */}
      {selectedEvaluationReg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-800 text-sm">
                Điểm danh & Chấm điểm hoạt động
              </h3>
              <button 
                onClick={() => setSelectedEvaluationReg(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvaluationSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Đối tượng Đánh giá</div>
                <div className="text-gray-800 font-bold text-sm mt-0.5">{selectedEvaluationReg.studentName}</div>
                <div className="text-gray-500 font-medium mt-0.5">{selectedEvaluationReg.studentFaculty} • Lớp {selectedEvaluationReg.studentClass}</div>
                <div className="text-[#00529C] font-semibold mt-1">Chiến dịch: {selectedEvaluationReg.campaignTitle}</div>
              </div>

              {/* Chuyên cần */}
              <div className="space-y-1">
                <label className="text-gray-500 font-semibold block mb-1">Điểm danh Chuyên cần *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setEvalAttendance('present')}
                    className={`py-2 px-3 border rounded-xl font-semibold text-center transition-all ${
                      evalAttendance === 'present' 
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs' 
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
                    }`}
                  >
                    Có mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalAttendance('excused')}
                    className={`py-2 px-3 border rounded-xl font-semibold text-center transition-all ${
                      evalAttendance === 'excused' 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
                    }`}
                  >
                    Nghỉ có phép
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalAttendance('absent')}
                    className={`py-2 px-3 border rounded-xl font-semibold text-center transition-all ${
                      evalAttendance === 'absent' 
                        ? 'bg-red-500 text-white border-red-500 shadow-xs' 
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
                    }`}
                  >
                    Vắng không phép
                  </button>
                </div>
              </div>

              {/* Điểm hiệu suất (1-10) */}
              <div className="space-y-1">
                <label className="text-gray-500 font-semibold block mb-1">Đánh giá hiệu suất làm việc (Thang điểm 1-10) *</label>
                <select
                  value={evalScore}
                  onChange={(e) => setEvalScore(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15 font-semibold text-gray-700 text-xs cursor-pointer"
                >
                  <option value={10}>10 - Xuất sắc vượt trội (Hoàn thành vượt mục tiêu)</option>
                  <option value={9}>9 - Rất tốt (Đóng góp tích cực, năng nổ)</option>
                  <option value={8}>8 - Tốt (Hoàn thành đầy đủ nhiệm vụ)</option>
                  <option value={7}>7 - Khá (Có cố gắng hoàn thành)</option>
                  <option value={6}>6 - Đạt yêu cầu (Cần nhắc nhở thêm)</option>
                  <option value={5}>5 - Trung bình (Làm việc hời hợt)</option>
                  <option value={4}>4 - Kém (Không hợp tác)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedEvaluationReg(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold text-gray-500 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-xs hover:shadow transition-all"
                  id="btn-submit-evaluation"
                >
                  Hoàn tất & Cấp Chứng nhận số
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: DANH SÁCH ĐỘI VIÊN ĐĂNG KÝ THEO CHIẾN DỊCH */}
      {viewingCampRegsId && (
        (() => {
          const viewingCampaign = campaigns.find(c => c.id === viewingCampRegsId);
          const campRegs = registrations.filter(r => r.campaignId === viewingCampRegsId);
          const filteredCampRegs = campRegs.filter(r => 
            r.studentName.toLowerCase().includes(campRegsSearch.toLowerCase()) || 
            (r.studentClass && r.studentClass.toLowerCase().includes(campRegsSearch.toLowerCase())) ||
            (r.studentFaculty && r.studentFaculty.toLowerCase().includes(campRegsSearch.toLowerCase()))
          );

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-display font-bold text-gray-800 text-sm">
                      Danh sách Đăng ký tham gia
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wider">
                      Chiến dịch: {viewingCampaign?.title}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setViewingCampRegsId(null);
                      setCampRegsSearch('');
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar inside Modal */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên Đội viên, lớp, khoa..."
                      value={campRegsSearch}
                      onChange={(e) => setCampRegsSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15 text-xs"
                    />
                  </div>
                </div>

                {/* Registrations List Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {filteredCampRegs.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs text-gray-400">Không tìm thấy Đội viên nào đăng ký hoạt động này.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCampRegs.map((reg) => (
                        <div 
                          key={reg.id}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between flex-wrap gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-gray-900 font-semibold">{reg.studentName}</strong>
                              <span className="text-gray-400">({reg.studentClass} • {reg.studentFaculty})</span>
                            </div>
                            <div className="text-gray-400 text-[10px] mt-0.5">
                              Đăng ký lúc: {reg.registeredAt}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {/* Status Badge */}
                            {reg.status === 'pending' && (
                              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                Chờ duyệt
                              </span>
                            )}
                            {reg.status === 'approved' && (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                Đã duyệt
                              </span>
                            )}
                            {reg.status === 'rejected' && (
                              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                Đã từ chối
                              </span>
                            )}
                            {reg.status === 'completed' && (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                Đã hoàn thành (Điểm: {reg.performanceScore}/10)
                              </span>
                            )}

                            {/* Direct Actions inside Campaign Details */}
                            <div className="flex gap-1.5">
                              {reg.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => onApproveRegistration(reg.id, 'rejected')}
                                    className="px-2 py-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-bold text-[10px] transition-all flex items-center gap-0.5 cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                  <button
                                    onClick={() => onApproveRegistration(reg.id, 'approved')}
                                    className="px-2 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-[10px] transition-all flex items-center gap-0.5 cursor-pointer"
                                  >
                                    Duyệt
                                  </button>
                                </>
                              )}
                              {reg.status === 'approved' && (
                                <button
                                  onClick={() => {
                                    setViewingCampRegsId(null);
                                    setActiveMenu('reports');
                                    setSelectedEvaluationReg(reg);
                                  }}
                                  className="px-2 py-1 text-white bg-[#00529C] hover:bg-[#00417C] rounded-lg font-bold text-[10px] transition-all flex items-center gap-0.5 cursor-pointer"
                                >
                                  Điểm danh & Chấm điểm
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer of modal */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                  <button
                    onClick={() => {
                      setViewingCampRegsId(null);
                      setCampRegsSearch('');
                    }}
                    className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* MODAL: MÃ QR ĐĂNG KÝ HOẠT ĐỘNG */}
      {viewingQrCampId && (
        (() => {
          const camp = campaigns.find(c => c.id === viewingQrCampId);
          if (!camp) return null;
          const hostUrl = window.location.origin;
          const regUrl = `${hostUrl}?action=register&campaignId=${camp.id}`;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(regUrl)}`;

          const handleCopyLink = () => {
            navigator.clipboard.writeText(regUrl);
            setQrCopied(true);
            setTimeout(() => setQrCopied(false), 2000);
          };

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 text-center space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-display font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <QrCode className="w-5 h-5 text-purple-600" />
                    Mã QR Đăng ký Hoạt động
                  </h3>
                  <button 
                    onClick={() => setViewingQrCampId(null)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-1">
                  <h4 className="font-bold text-gray-900 text-xs line-clamp-2 leading-snug">{camp.title}</h4>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider">
                    Đơn vị tổ chức: {camp.department}
                  </p>
                </div>

                {/* QR Code Frame */}
                <div className="mx-auto p-4 bg-gray-50 rounded-2xl border border-gray-200/50 inline-block">
                  <img 
                    src={qrImageUrl} 
                    alt="Mã QR Đăng ký" 
                    className="w-44 h-44 rounded-lg shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <p className="text-[10px] text-gray-500 leading-relaxed px-2">
                  Chụp lại màn hình hoặc in mã QR này dán tại bảng tin Đoàn - Hội để Đội viên quét nhanh và đăng ký tham gia trực tiếp.
                </p>

                {/* Registration URL Copy Box */}
                <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2 text-left">
                  <div className="text-[9px] text-purple-700 font-bold uppercase tracking-wider">Đường dẫn đăng ký trực tiếp:</div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={regUrl} 
                      className="w-full bg-white border border-purple-100 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-purple-900 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-white hover:bg-purple-100/50 border border-purple-200 text-purple-700 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Sao chép liên kết"
                    >
                      {qrCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {qrCopied && (
                    <div className="text-[9px] text-emerald-600 font-bold text-right">✓ Đã sao chép liên kết!</div>
                  )}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setViewingQrCampId(null)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

    </div>
  );
}
