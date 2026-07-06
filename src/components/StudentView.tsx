import React, { useState } from 'react';
import { Campaign, Student, Registration } from '../types';
import { 
  Calendar, 
  MapPin, 
  Award, 
  Clock, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Search, 
  Filter, 
  GraduationCap, 
  User, 
  Briefcase, 
  FileText, 
  Check, 
  X, 
  Activity 
} from 'lucide-react';

interface StudentViewProps {
  campaigns: Campaign[];
  registrations: Registration[];
  activeStudent: Student;
  onRegisterCampaign: (campaignId: string) => void;
  onCancelRegistration: (regId: string) => void;
}

export default function StudentView({
  campaigns,
  registrations,
  activeStudent,
  onRegisterCampaign,
  onCancelRegistration
}: StudentViewProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'profile'>('campaigns');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrganizer, setFilterOrganizer] = useState<'all' | 'Đoàn Thanh niên' | 'Hội Sinh viên'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closing_soon' | 'completed'>('all');
  const [filterFormat, setFilterFormat] = useState<'all' | 'Trực tiếp' | 'Trực tuyến'>('all');
  


  // Filter campaigns
  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          camp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          camp.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrganizer = filterOrganizer === 'all' || camp.department === filterOrganizer;
    const matchesStatus = filterStatus === 'all' || camp.status === filterStatus;
    const matchesFormat = filterFormat === 'all' || camp.format === filterFormat;
    return matchesSearch && matchesOrganizer && matchesStatus && matchesFormat;
  });

  // Get student's registrations
  const studentRegs = registrations.filter(reg => reg.studentId === activeStudent.id);

  // Calculate stats based on approved/completed registrations
  const completedRegs = studentRegs.filter(reg => reg.status === 'completed');
  const approvedRegs = studentRegs.filter(reg => reg.status === 'approved');



  return (
    <div className="w-full">
      {/* Banner Chào mừng */}
      <div className="bg-gradient-to-r from-[#00529C] to-[#00AEEF] text-white rounded-2xl p-6 md:p-8 mb-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-40 h-40 bg-white/5 rounded-full -mb-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="shrink-0 bg-white rounded-full shadow-md border border-white/20 w-16 h-16 overflow-hidden flex items-center justify-center">
             <img 
    src="https://i.postimg.cc/RFkjyCyr/a.png" 
    alt="Logo Hội Sinh viên Việt Nam" 
    className="w-full h-full object-cover rounded-full" 
  />
            </div>
            <div>
              <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Cổng thông tin Đội viên
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-bold mt-2">
                Xin chào, {activeStudent.name}!
              </h2>
            </div>
          </div>
          
          <div className="flex gap-4 md:self-end">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'campaigns'
                  ? 'bg-white text-[#00529C] shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              id="tab-campaign-board"
            >
              <Activity className="w-4 h-4 inline-block mr-2" />
              Bảng chiến dịch
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-white text-[#00529C] shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              id="tab-student-profile"
            >
              <User className="w-4 h-4 inline-block mr-2" />
              Cá nhân của tôi
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'campaigns' ? (
        <div className="space-y-6">
          {/* Bộ lọc Chiến dịch */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm chiến dịch, loại hình, địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/20 focus:border-[#00529C] transition-all text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Đơn vị:</span>
                <select
                  value={filterOrganizer}
                  onChange={(e: any) => setFilterOrganizer(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none text-gray-700 cursor-pointer"
                >
                  <option value="all">Tất cả</option>
                  <option value="Đoàn Thanh niên">Đoàn trường</option>
                  <option value="Hội Sinh viên">Hội Sinh viên</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Trạng thái:</span>
                <select
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none text-gray-700 cursor-pointer"
                >
                  <option value="all">Tất cả</option>
                  <option value="open">Đang mở đăng ký</option>
                  <option value="closing_soon">Sắp đóng</option>
                  <option value="completed">Đã kết thúc</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Hình thức:</span>
                <select
                  value={filterFormat}
                  onChange={(e: any) => setFilterFormat(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none text-gray-700 cursor-pointer"
                >
                  <option value="all">Tất cả hình thức</option>
                  <option value="Trực tiếp">Trực tiếp</option>
                  <option value="Trực tuyến">Trực tuyến</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid hiển thị các chiến dịch */}
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-xl py-12 px-4 border border-gray-100 text-center shadow-xs">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700">Không tìm thấy chiến dịch nào</h3>
              <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc đơn vị, trạng thái.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => {
                // Check registration status of active user for this campaign
                const userReg = studentRegs.find(r => r.campaignId === camp.id);
                const percentFull = Math.min(100, Math.round((camp.slotsRegistered / camp.slotsTotal) * 100));
                
                return (
                  <div 
                    key={camp.id} 
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group h-full"
                    id={`campaign-card-${camp.id}`}
                  >
                    {/* Hình ảnh & Đơn vị phụ trách */}
                    <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                      {camp.imageUrl ? (
                        <img 
                          src={camp.imageUrl} 
                          alt={camp.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#00529C]/5 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-[#00529C]/20" />
                        </div>
                      )}
                      
                      {/* Đơn vị Tag */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
                          camp.department === 'Đoàn Thanh niên' 
                            ? 'bg-[#00529C]' // Blue Đoàn
                            : 'bg-[#00AEEF]' // Sky Blue Hội
                        }`}>
                          {camp.department}
                        </span>
                      </div>

                      {/* Trạng thái Badge */}
                      <div className="absolute top-3 right-3">
                        {camp.status === 'open' && (
                          <span className="bg-emerald-500/95 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                            Đang mở
                          </span>
                        )}
                        {camp.status === 'closing_soon' && (
                          <span className="bg-amber-500/95 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                            Sắp đóng
                          </span>
                        )}
                        {camp.status === 'paused' && (
                          <span className="bg-orange-500/95 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                            Tạm dừng
                          </span>
                        )}
                        {camp.status === 'completed' && (
                          <span className="bg-gray-500/95 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                            Đã kết thúc
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nội dung Card */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Thể loại & Điểm tích lũy */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 flex-wrap gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium px-2 py-0.5 bg-gray-100 rounded-md text-gray-600">
                              {camp.type}
                            </span>
                            {camp.format && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                camp.format === 'Trực tiếp'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : 'bg-purple-50 text-purple-700 border border-purple-100'
                              }`}>
                                {camp.format}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <Award className="w-3.5 h-3.5 mr-1" />
                            +{camp.score} {camp.scoreType}
                          </span>
                        </div>

                        {/* Tên hoạt động */}
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#00529C] transition-colors line-clamp-1">
                          {camp.title}
                        </h3>

                        {/* Mô tả ngắn */}
                        <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                          {camp.description}
                        </p>

                        {/* Chi tiết hoạt động */}
                        <div className="mt-4 space-y-2 text-xs text-gray-500 border-t border-gray-50 pt-3">
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                            <span className="truncate">{camp.date}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                            <span className="truncate">{camp.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Thông số đăng ký và Nút đăng ký */}
                      <div className="mt-5 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span>Sĩ số dự kiến:</span>
                          <span className="font-semibold text-gray-700">
                            {camp.slotsRegistered}/{camp.slotsTotal} (đầy {percentFull}%)
                          </span>
                        </div>
                        {/* Tiến độ bar */}
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
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

                        {/* Nút tác vụ tùy theo trạng thái đăng ký */}
                        {userReg ? (
                          <div className="flex items-center gap-2">
                            {userReg.status === 'pending' && (
                              <>
                                <div className="flex-1 text-center py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  Chờ phê duyệt
                                </div>
                                <button
                                  onClick={() => onCancelRegistration(userReg.id)}
                                  className="px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-gray-200"
                                  title="Hủy đăng ký"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {userReg.status === 'approved' && (
                              <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-emerald-200">
                                <Check className="w-3.5 h-3.5" />
                                Đã duyệt (Sẽ tham gia)
                              </div>
                            )}
                            {userReg.status === 'completed' && (
                              <div className="w-full text-center py-2 bg-blue-50 text-[#00529C] rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-blue-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Hoàn thành xuất sắc
                              </div>
                            )}
                            {userReg.status === 'rejected' && (
                              <div className="w-full text-center py-2 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-red-200">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Đã bị từ chối
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => onRegisterCampaign(camp.id)}
                            disabled={camp.status === 'completed' || camp.status === 'paused' || camp.slotsRegistered >= camp.slotsTotal}
                            className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                              camp.status === 'completed'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : camp.status === 'paused'
                                ? 'bg-orange-50 text-orange-600 border border-orange-200 cursor-not-allowed'
                                : camp.slotsRegistered >= camp.slotsTotal
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#00529C] text-white hover:bg-[#003B70] hover:shadow-xs active:scale-98'
                            }`}
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            {camp.status === 'completed' 
                              ? 'Đã kết thúc chiến dịch' 
                              : camp.status === 'paused'
                              ? 'Tạm dừng nhận đăng ký'
                              : camp.slotsRegistered >= camp.slotsTotal 
                              ? 'Hết suất đăng ký' 
                              : 'Đăng ký tham gia'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TRANG CÁ NHÂN (PROFILE) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái: Thông tin cá nhân & Thống kê */}
          <div className="lg:col-span-1 space-y-6">
            {/* Thẻ định danh sinh viên */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00529C] to-[#00AEEF]" />
              
              {/* Mock Avatar */}
              <div className="w-24 h-24 bg-gradient-to-tr from-[#00529C] to-[#00AEEF] rounded-full p-1 mx-auto mt-4 shadow-md">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-xl font-display font-bold text-[#00529C]">NTT</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mt-4">{activeStudent.name}</h3>
              <p className="text-xs text-[#00529C] font-semibold uppercase">{activeStudent.studentId}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-left space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Khoa:</span>
                  <span className="font-medium text-gray-800">{activeStudent.faculty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lớp hành chính:</span>
                  <span className="font-medium text-gray-800">{activeStudent.className}</span>
                </div>
                {activeStudent.birthDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ngày sinh:</span>
                    <span className="font-medium text-gray-800">
                      {(() => {
                        if (activeStudent.birthDate.includes('-')) {
                          const parts = activeStudent.birthDate.split('-');
                          if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        }
                        return activeStudent.birthDate;
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Email SV:</span>
                  <span className="font-medium text-gray-800">{activeStudent.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Số điện thoại:</span>
                  <span className="font-medium text-gray-800">{activeStudent.phone}</span>
                </div>
              </div>
            </div>

            {/* Thống kê tích lũy */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-6">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2">
                Thành tích tích lũy
              </h4>

              {/* Progress bar Điểm tích lũy chiến dịch */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Điểm tích lũy rèn luyện / đánh giá</span>
                  <span className="font-bold text-[#00529C]">{activeStudent.totalScore} Điểm</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00529C] rounded-full" 
                    style={{ width: `${Math.min(100, (activeStudent.totalScore / 15) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Chỉ tiêu: 0</span>
                  <span>Đạt chuẩn: 15 Điểm</span>
                </div>
              </div>

              {/* Progress bar Số ngày CTXH đã tích lũy */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Số ngày CTXH đã tích lũy</span>
                  <span className="font-bold text-emerald-600">{(activeStudent.ctxhAccumulated ?? 0)} Ngày</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(100, ((activeStudent.ctxhAccumulated ?? 0) / 15) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Thiếu: {activeStudent.ctxhMissing ?? 0} Ngày</span>
                  <span>Đạt chuẩn: 15 Ngày</span>
                </div>
              </div>

              {/* Progress bar Số giờ công tác xã hội */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Số giờ công tác xã hội</span>
                  <span className="font-bold text-[#00AEEF]">{activeStudent.totalHours} Giờ</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00AEEF] rounded-full" 
                    style={{ width: `${Math.min(100, (activeStudent.totalHours / 40) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Chỉ tiêu: 0</span>
                  <span>Đạt chuẩn: 40 Giờ</span>
                </div>
              </div>

              {/* Progress bar Tổng điểm Ban tổ chức đánh giá */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Tổng điểm Ban tổ chức đánh giá</span>
                  <span className="font-bold text-amber-600">{activeStudent.totalPerformanceScore ?? 0} Điểm</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${Math.min(100, (((activeStudent.totalPerformanceScore ?? 0) / (completedRegs.length > 0 ? completedRegs.length * 10 : 10)) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Tối đa: {(completedRegs.length || 1) * 10} Điểm</span>
                  <span>Trung bình: {completedRegs.length > 0 ? ((activeStudent.totalPerformanceScore ?? 0) / completedRegs.length).toFixed(1) : 0}/10 Điểm</span>
                </div>
              </div>

              {/* Tóm tắt nhanh */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className="text-xs text-gray-400">Chiến dịch</div>
                  <div className="text-lg font-bold text-gray-800 mt-1">{studentRegs.length}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Đã đăng ký</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className="text-xs text-gray-400">Hoàn thành</div>
                  <div className="text-lg font-bold text-gray-800 mt-1">{completedRegs.length}</div>
                  <div className="text-[10px] text-blue-600 font-medium">Chiến dịch</div>
                </div>
              </div>
            </div>

          </div>

          {/* Cột phải: Hồ sơ chi tiết & Lịch sử hoạt động */}
          <div className="lg:col-span-2 space-y-6">
            {/* Khối Hồ sơ Đội viên chi tiết */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center border-b border-gray-100 pb-3">
                <User className="w-5 h-5 text-[#00529C] mr-2" />
                HỒ SƠ ĐỘI VIÊN CHI TIẾT
              </h3>

              <div className="space-y-6 text-xs">
                {/* Phần I */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#00529C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-[#00529C] rounded-full inline-block"></span>
                    Phần I: Thông tin cá nhân
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Họ và tên:</span>
                      <span className="font-bold text-gray-800 uppercase">{activeStudent.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Giới tính:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.gender || 'Nam'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Ngày sinh:</span>
                      <span className="font-semibold text-gray-800">
                        {(() => {
                          if (activeStudent.birthDate && activeStudent.birthDate.includes('-')) {
                            const parts = activeStudent.birthDate.split('-');
                            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                          }
                          return activeStudent.birthDate || 'Chưa cập nhật';
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Chi hội:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.subBranch || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Khoa:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.faculty}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Ngành học:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.major || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Số CCCD:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.idCard || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Thường trú:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.address || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Email liên hệ:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Số điện thoại:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.phone}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 block mb-0.5">CLB/Đội/Nhóm đang tham gia:</span>
                      <span className="font-semibold text-gray-800">{activeStudent.club || 'Không có'}</span>
                    </div>
                  </div>
                </div>

                {/* Phần II */}
                <div className="space-y-3">
                  <h4 className="font-bold text-emerald-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-emerald-500 rounded-full inline-block"></span>
                    Phần II: Đặc điểm cá nhân & Nguyện vọng
                  </h4>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-400 block mb-1.5">Hình thức hoạt động tình nguyện:</span>
                      {activeStudent.skills && activeStudent.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeStudent.skills.map((skill, index) => (
                            <span key={index} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded text-[10px] font-semibold">
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Chưa đăng ký hình thức hoạt động nào</span>
                      )}
                    </div>

                    {activeStudent.otherSkill && (
                      <div>
                        <span className="text-gray-400 block mb-0.5">Kỹ năng khác:</span>
                        <span className="font-medium text-gray-800">{activeStudent.otherSkill}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-gray-400 block mb-0.5">Công cụ AI sử dụng thành thạo nhất:</span>
                      <span className="font-bold text-gray-800">{activeStudent.aiTool || 'Chưa cập nhật'}</span>
                    </div>

                    {activeStudent.portfolioUrl && (
                      <div>
                        <span className="text-gray-400 block mb-0.5">Link sản phẩm đã thực hiện:</span>
                        <a 
                          href={activeStudent.portfolioUrl.startsWith('http') ? activeStudent.portfolioUrl : `https://${activeStudent.portfolioUrl}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#00529C] hover:underline font-semibold break-all"
                        >
                          {activeStudent.portfolioUrl}
                        </a>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-200/60">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Facebook:</span>
                        {activeStudent.facebook ? (
                          <span className="font-semibold text-gray-800 break-all">{activeStudent.facebook}</span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa cập nhật</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">TikTok:</span>
                        {activeStudent.tiktok ? (
                          <span className="font-semibold text-gray-800 break-all">{activeStudent.tiktok}</span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa cập nhật</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">MXH khác:</span>
                        {activeStudent.otherSocial ? (
                          <span className="font-semibold text-gray-800 break-all">{activeStudent.otherSocial}</span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa cập nhật</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200/60">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Số ngày CTXH đã tích lũy:</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded inline-block">
                          {activeStudent.ctxhAccumulated ?? 0} ngày
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Số ngày CTXH còn thiếu:</span>
                        <span className="font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded inline-block">
                          {activeStudent.ctxhMissing ?? 0} ngày
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400 block mb-0.5">Nguyện vọng / Kỳ vọng cá nhân:</span>
                      <p className="text-gray-700 bg-white p-2.5 rounded-lg border border-gray-150 italic leading-relaxed whitespace-pre-wrap">
                        {activeStudent.aspiration || 'Không có yêu cầu đặc biệt'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Khối Lịch sử hoạt động */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 text-[#00529C] mr-2" />
                Lịch sử hoạt động
              </h3>

              {studentRegs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Bạn chưa đăng ký chiến dịch nào</p>
                  <p className="text-xs text-gray-400 mt-1">Hãy chuyển qua "Bảng chiến dịch" để đăng ký!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentRegs.map((reg) => {
                    const campaignInfo = campaigns.find(c => c.id === reg.campaignId);
                    
                    return (
                      <div 
                        key={reg.id} 
                        className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        id={`reg-history-item-${reg.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{reg.campaignTitle}</h4>
                            
                            {/* Trạng thái duyệt */}
                            {reg.status === 'pending' && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                Đang chờ duyệt
                              </span>
                            )}
                            {reg.status === 'approved' && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                Đã phê duyệt
                              </span>
                            )}
                            {reg.status === 'completed' && (
                              <span className="bg-blue-50 text-[#00529C] border border-blue-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                Đã hoàn thành
                              </span>
                            )}
                            {reg.status === 'rejected' && (
                              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                Từ chối
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-gray-300" />
                              Đăng ký ngày: {reg.registeredAt}
                            </span>
                            {campaignInfo && (
                              <span className="flex items-center font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                                +{campaignInfo.score} {campaignInfo.scoreType}
                              </span>
                            )}
                          </div>

                          {/* Điểm chuyên cần & Hiệu suất sau điểm danh */}
                          {reg.status === 'completed' && (
                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                              <span>Chuyên cần: <strong className="text-emerald-600">{reg.attendanceStatus === 'present' ? 'Có mặt' : reg.attendanceStatus}</strong></span>
                              {reg.performanceScore && (
                                <span>Đánh giá BTC: <strong className="text-amber-600">{reg.performanceScore}/10</strong></span>
                              )}
                            </div>
                          )}
                        </div>


                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}



    </div>
  );
}
