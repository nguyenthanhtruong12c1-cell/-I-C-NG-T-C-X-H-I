import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Campaign, Registration, Student } from '../types';
import { generateAttendanceToken, getRemainingSeconds } from '../lib/attendanceUtils';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  Search, 
  UserCheck, 
  Power, 
  PowerOff,
  Ban,
  RefreshCw
} from 'lucide-react';

interface DynamicAttendanceQRModalProps {
  campaign: Campaign;
  registrations: Registration[];
  students: Student[];
  onClose: () => void;
  onManualCheckin?: (regId: string) => Promise<void> | void;
}

export default function DynamicAttendanceQRModal({
  campaign,
  registrations,
  students,
  onClose,
  onManualCheckin
}: DynamicAttendanceQRModalProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(getRemainingSeconds());
  const [currentToken, setCurrentToken] = useState<string>(() => generateAttendanceToken(campaign.id));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [attendeeTab, setAttendeeTab] = useState<'attended' | 'not_yet'>('attended');
  const [searchAttendee, setSearchAttendee] = useState('');
  const [isCheckingInId, setIsCheckingInId] = useState<string | null>(null);

  // Trạng thái bật / tắt điểm danh - Mặc định TẮT
  const isCompletedCampaign = campaign.status === 'completed';
  const [isAttendanceActive, setIsAttendanceActive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const activeSlotRef = useRef<number>(Math.floor(Date.now() / 20000));
  const isAttendanceActiveRef = useRef<boolean>(false);
  isAttendanceActiveRef.current = isAttendanceActive;

  // Cập nhật mã QR hiện tại lên Firestore và ghi đè mã cũ
  const syncActiveTokenToFirestore = async (token: string, slot: number) => {
    try {
      setIsSyncing(true);
      await setDoc(doc(db, 'attendance_sessions', campaign.id), {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        activeToken: token,
        slot: slot,
        active: true,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Lỗi cập nhật mã QR điểm danh lên Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Tắt điểm danh và xóa sạch phiên điểm danh trên Firestore
  const turnOffAttendanceInFirestore = async () => {
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'attendance_sessions', campaign.id));
    } catch (err) {
      console.error('Lỗi xóa phiên điểm danh trên Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Dọn dẹp phiên điểm danh khi đóng modal hoặc rời trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      turnOffAttendanceInFirestore();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      turnOffAttendanceInFirestore();
    };
  }, [campaign.id]);

  // Vòng lặp đếm ngược 20s và tự động sinh mã mới khi đang bật điểm danh
  useEffect(() => {
    const updateLoop = () => {
      if (!isAttendanceActiveRef.current) return;

      const remaining = getRemainingSeconds();
      setSecondsLeft(remaining);

      const currentSlot = Math.floor(Date.now() / 20000);
      if (currentSlot !== activeSlotRef.current) {
        activeSlotRef.current = currentSlot;
        const newToken = generateAttendanceToken(campaign.id, currentSlot);
        setCurrentToken(newToken);
        syncActiveTokenToFirestore(newToken, currentSlot);
      }
    };

    updateLoop();
    const interval = setInterval(updateLoop, 500);
    return () => clearInterval(interval);
  }, [campaign.id]);

  // Direct check-in URL mà mã QR mã hóa
  const hostUrl = window.location.origin;
  const checkinUrl = `${hostUrl}?action=checkin&token=${encodeURIComponent(currentToken)}`;

  // Tạo mã QR khi bật điểm danh
  useEffect(() => {
    if (!isAttendanceActive) {
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(checkinUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#00529C',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Lỗi tạo mã QR:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [checkinUrl, isAttendanceActive]);

  // Bật hoặc tắt điểm danh
  const handleToggleAttendance = async () => {
    if (isAttendanceActive) {
      setIsAttendanceActive(false);
      await turnOffAttendanceInFirestore();
    } else {
      setIsAttendanceActive(true);
      const newSlot = Math.floor(Date.now() / 20000);
      activeSlotRef.current = newSlot;
      const newToken = generateAttendanceToken(campaign.id, newSlot);
      setCurrentToken(newToken);
      await syncActiveTokenToFirestore(newToken, newSlot);
    }
  };

  // Đóng Modal: Đảm bảo tắt điểm danh và xóa mã
  const handleCloseModal = async () => {
    await turnOffAttendanceInFirestore();
    onClose();
  };

  // Xử lý danh sách thành viên
  const campRegs = registrations.filter(r => r.campaignId === campaign.id);
  const uniqueCampRegsMap = new Map<string, Registration>();
  campRegs.forEach(r => {
    const existing = uniqueCampRegsMap.get(r.studentId);
    if (!existing || (r.status === 'completed' && existing.status !== 'completed')) {
      uniqueCampRegsMap.set(r.studentId, r);
    }
  });
  const dedupedCampRegs = Array.from(uniqueCampRegsMap.values());

  const attendedRegs = dedupedCampRegs.filter(r => r.attendanceStatus === 'present' || r.status === 'completed');
  const notYetRegs = dedupedCampRegs.filter(r => r.attendanceStatus !== 'present' && r.status !== 'completed' && r.status !== 'rejected');

  // Timeline progress (0% -> 100%)
  const progressPercent = ((20 - secondsLeft) / 20) * 100;

  // Lọc tìm kiếm
  const filteredAttended = attendedRegs.filter(r => {
    const s = students.find(st => st.id === r.studentId);
    const mssv = s ? s.studentId : r.studentId;
    return r.studentName.toLowerCase().includes(searchAttendee.toLowerCase()) ||
           mssv.toLowerCase().includes(searchAttendee.toLowerCase());
  });

  const filteredNotYet = notYetRegs.filter(r => {
    const s = students.find(st => st.id === r.studentId);
    const mssv = s ? s.studentId : r.studentId;
    return r.studentName.toLowerCase().includes(searchAttendee.toLowerCase()) ||
           mssv.toLowerCase().includes(searchAttendee.toLowerCase());
  });

  const handleManualCheck = async (regId: string) => {
    if (!onManualCheckin) return;
    setIsCheckingInId(regId);
    try {
      await onManualCheckin(regId);
    } finally {
      setIsCheckingInId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div 
        className={`bg-white rounded-3xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-2 sm:inset-4 max-w-none max-h-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]' 
            : 'max-w-4xl max-h-[92vh]'
        }`}
      >
        {/* Header: Tên hoạt động & Nút Bật/Tắt điểm danh */}
        <div className="bg-gradient-to-r from-[#00529C] to-[#00AEEF] px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="min-w-0 pr-3">
            <h3 className="font-display font-bold text-sm sm:text-base tracking-tight truncate">
              {campaign.title}
            </h3>
            <p className="text-white/80 text-xs mt-0.5">
              Điểm danh bằng mã QR
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Nút BẬT / TẮT ĐIỂM DANH */}
            {!isCompletedCampaign && (
              <button
                onClick={handleToggleAttendance}
                disabled={isSyncing}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  isAttendanceActive
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
                title={isAttendanceActive ? 'Bấm để tắt điểm danh' : 'Bấm để bật điểm danh'}
              >
                {isAttendanceActive ? (
                  <>
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Tắt điểm danh</span>
                  </>
                ) : (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>Bật điểm danh</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white/80 hover:text-white p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleCloseModal}
              className="text-white/80 hover:text-white p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung chính: 2 Cột tối giản */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI: Timeline 20s & Mã QR */}
          <div className="lg:col-span-7 flex flex-col items-center text-center space-y-4">
            
            {isAttendanceActive ? (
              <>
                {/* 1. Timeline 20s */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#00529C]" />
                      <span>Thời gian đổi mã QR:</span>
                    </span>
                    <span className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg ${
                      secondsLeft <= 5 
                        ? 'bg-rose-100 text-rose-700 animate-pulse' 
                        : 'bg-blue-100 text-[#00529C]'
                    }`}>
                      {secondsLeft}s
                    </span>
                  </div>

                  {/* Thanh Timeline Progress 20s */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-linear rounded-full ${
                        secondsLeft <= 5 
                          ? 'bg-gradient-to-r from-orange-500 to-rose-600' 
                          : 'bg-gradient-to-r from-[#00529C] to-[#00AEEF]'
                      }`}
                      style={{ width: `${100 - progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 2. Khung Mã QR */}
                <div className="p-4 bg-white border-2 border-slate-200 rounded-3xl shadow-sm flex items-center justify-center">
                  <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Mã QR Điểm danh" 
                        className="w-full h-full object-contain animate-fade-in"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-[#00529C]" />
                        <span className="text-xs">Đang tải mã QR...</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : isCompletedCampaign ? (
              /* Trạng thái Hoạt động đã kết thúc */
              <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-gray-300 rounded-3xl space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <Ban className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-gray-800 text-base">
                  Hoạt động đã kết thúc
                </h4>
                <p className="text-xs text-gray-500 max-w-xs">
                  Hoạt động này đã kết thúc nên không hiển thị mã điểm danh QR nữa.
                </p>
              </div>
            ) : (
              /* Trạng thái TẮT ĐIỂM DANH (Mặc định) */
              <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <PowerOff className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h4 className="font-bold text-slate-800 text-base">
                    Điểm danh đang tắt
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bấm nút bên dưới để bắt đầu hiển thị mã QR điểm danh.
                  </p>
                </div>
                <button
                  onClick={handleToggleAttendance}
                  className="px-5 py-2.5 bg-[#00529C] hover:bg-[#00417c] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>Bật điểm danh</span>
                </button>
              </div>
            )}

          </div>

          {/* CỘT PHẢI: Danh sách đã điểm danh & chưa điểm danh */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-3 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
            
            {/* Tabs chuyển đổi: Đã điểm danh / Chưa điểm danh */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setAttendeeTab('attended')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                  attendeeTab === 'attended'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đã điểm danh ({attendedRegs.length})
              </button>
              <button
                onClick={() => setAttendeeTab('not_yet')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                  attendeeTab === 'not_yet'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chưa điểm danh ({notYetRegs.length})
              </button>
            </div>

            {/* Ô tìm kiếm nhanh */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Tìm tên hoặc MSSV..."
                value={searchAttendee}
                onChange={(e) => setSearchAttendee(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00529C]/15"
              />
            </div>

            {/* Danh sách 1: Đã điểm danh */}
            {attendeeTab === 'attended' && (
              filteredAttended.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-200 rounded-2xl min-h-[200px]">
                  <p className="text-xs text-gray-400">
                    {searchAttendee ? 'Không tìm thấy kết quả' : 'Chưa có sinh viên nào điểm danh'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {filteredAttended.map((reg) => {
                    const studentObj = students.find(s => s.id === reg.studentId);
                    const mssv = studentObj ? studentObj.studentId : reg.studentId;
                    return (
                      <div 
                        key={reg.id}
                        className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-gray-800 truncate">
                            {reg.studentName} <span className="text-[10px] text-gray-500 font-mono">({mssv})</span>
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {reg.studentClass}
                          </div>
                        </div>

                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Có mặt
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Danh sách 2: Chưa điểm danh */}
            {attendeeTab === 'not_yet' && (
              filteredNotYet.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-200 rounded-2xl min-h-[200px]">
                  <p className="text-xs text-emerald-600 font-semibold">
                    Tất cả thành viên đã điểm danh đầy đủ!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {filteredNotYet.map((reg) => {
                    const studentObj = students.find(s => s.id === reg.studentId);
                    const mssv = studentObj ? studentObj.studentId : reg.studentId;
                    return (
                      <div 
                        key={reg.id}
                        className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-gray-800 truncate">
                            {reg.studentName} <span className="text-[10px] text-gray-500 font-mono">({mssv})</span>
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {reg.studentClass}
                          </div>
                        </div>

                        {onManualCheckin && (
                          <button
                            onClick={() => handleManualCheck(reg.id)}
                            disabled={isCheckingInId === reg.id}
                            className="shrink-0 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#00529C] border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            title="Điểm danh thủ công"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>{isCheckingInId === reg.id ? '...' : 'Điểm danh'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

          </div>

        </div>

        {/* Footer tối giản: Nút đóng */}
        <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end shrink-0">
          <button
            onClick={handleCloseModal}
            className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
