import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Campaign, Registration, Student } from '../types';
import { generateAttendanceToken, getRemainingSeconds } from '../lib/attendanceUtils';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  X, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  Users, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Search,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Power,
  PowerOff,
  Ban
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
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [justRotated, setJustRotated] = useState(false);
  const [attendeeTab, setAttendeeTab] = useState<'attended' | 'not_yet'>('attended');
  const [searchAttendee, setSearchAttendee] = useState('');
  const [isCheckingInId, setIsCheckingInId] = useState<string | null>(null);

  // Trạng thái bật / tắt điểm danh hoạt động - chế độ mặc định là TẮT điểm danh
  const isCompletedCampaign = campaign.status === 'completed';
  const [isAttendanceActive, setIsAttendanceActive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const activeSlotRef = useRef<number>(Math.floor(Date.now() / 20000));
  const isAttendanceActiveRef = useRef<boolean>(false);
  isAttendanceActiveRef.current = isAttendanceActive;

  // Cập nhật mã QR hiện tại lên Firestore và ghi đè (xóa) mã QR cũ trước đó để nhẹ dữ liệu
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

  // Tắt điểm danh và xóa sạch phiên điểm danh trên Firestore để vô hiệu hóa mã cũ và nhẹ dữ liệu
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

  // Dọn dẹp phiên điểm danh khi đóng Modal hoặc rời trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      turnOffAttendanceInFirestore();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Dọn dẹp: Khi tắt/đóng điểm danh hoạt động thì xóa mã QR khỏi Firestore để nhẹ dữ liệu
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      turnOffAttendanceInFirestore();
    };
  }, [campaign.id]);

  // Vòng lặp đếm ngược 20s và tự động sinh mã mới, xóa mã cũ
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
        setJustRotated(true);
        setTimeout(() => setJustRotated(false), 2500);

        // Sau khi mã mới được tạo thành, mã cũ được ghi đè và xóa khỏi Firestore
        syncActiveTokenToFirestore(newToken, currentSlot);
      }
    };

    updateLoop();
    const interval = setInterval(updateLoop, 500);
    return () => clearInterval(interval);
  }, [campaign.id]);

  // Direct check-in URL that the QR code encodes
  const hostUrl = window.location.origin;
  const checkinUrl = `${hostUrl}?action=checkin&token=${encodeURIComponent(currentToken)}`;

  // Generate QR Code locally via qrcode package khi đang mở điểm danh
  useEffect(() => {
    if (!isAttendanceActive) {
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(checkinUrl, {
      width: 380,
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

  // Đổi mã ngay lập tức (Manual force refresh)
  const handleForceRefresh = () => {
    if (!isAttendanceActive) return;
    const newSlot = activeSlotRef.current + 1;
    activeSlotRef.current = newSlot;
    const newToken = generateAttendanceToken(campaign.id, newSlot);
    setCurrentToken(newToken);
    setJustRotated(true);
    setTimeout(() => setJustRotated(false), 2500);
    // Vô hiệu hóa mã cũ và lưu mã mới
    syncActiveTokenToFirestore(newToken, newSlot);
  };

  // Bật hoặc tắt điểm danh hoạt động
  const handleToggleAttendance = async () => {
    if (isAttendanceActive) {
      // Tắt điểm danh: Xóa mã khỏi Firestore để nhẹ dữ liệu và vô hiệu hóa tất cả mã trước đó
      setIsAttendanceActive(false);
      await turnOffAttendanceInFirestore();
    } else {
      // Bật lại điểm danh: Sinh mã mới và kích hoạt lên Firestore
      setIsAttendanceActive(true);
      const newSlot = Math.floor(Date.now() / 20000);
      activeSlotRef.current = newSlot;
      const newToken = generateAttendanceToken(campaign.id, newSlot);
      setCurrentToken(newToken);
      await syncActiveTokenToFirestore(newToken, newSlot);
    }
  };

  // Đóng Modal: Đảm bảo tắt điểm danh và xóa dữ liệu mã QR
  const handleCloseModal = async () => {
    await turnOffAttendanceInFirestore();
    onClose();
  };

  // Filter registrations for this campaign and deduplicate by studentId to guarantee uniqueness
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
  const pendingOrApprovedRegs = dedupedCampRegs.filter(r => r.attendanceStatus !== 'present' && r.status !== 'completed' && r.status !== 'rejected');
  const totalApproved = dedupedCampRegs.filter(r => r.status !== 'rejected');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Progress percentage (from 0 to 100%)
  const progressPercent = ((20 - secondsLeft) / 20) * 100;

  // Search filtered attendees
  const filteredAttended = attendedRegs.filter(r => {
    const s = students.find(st => st.id === r.studentId);
    const mssv = s ? s.studentId : r.studentId;
    return r.studentName.toLowerCase().includes(searchAttendee.toLowerCase()) ||
           mssv.toLowerCase().includes(searchAttendee.toLowerCase());
  });

  const filteredNotYet = pendingOrApprovedRegs.filter(r => {
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
            : 'max-w-4xl max-h-[94vh]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00529C] to-[#00AEEF] px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-sm sm:text-base tracking-tight">
                  Điểm danh tham gia hoạt động bằng mã QR
                </h3>
                {isCompletedCampaign ? (
                  <span className="bg-gray-700 text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 shadow-2xs">
                    <PowerOff className="w-2.5 h-2.5" />
                    Hoạt động đã kết thúc
                  </span>
                ) : isAttendanceActive ? (
                  <span className="bg-amber-400 text-blue-950 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 shadow-2xs">
                    <RefreshCw className={`w-2.5 h-2.5 ${secondsLeft <= 3 ? 'animate-spin' : ''}`} />
                    Đổi mã mỗi 20s (Tự hủy mã cũ)
                  </span>
                ) : (
                  <span className="bg-rose-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 shadow-2xs">
                    <PowerOff className="w-2.5 h-2.5" />
                    Đã tắt điểm danh
                  </span>
                )}
              </div>
              <p className="text-white/85 text-xs truncate max-w-md sm:max-w-xl mt-0.5 font-medium">
                {campaign.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Bật / Tắt điểm danh (Chỉ hiển thị khi hoạt động chưa kết thúc) */}
            {!isCompletedCampaign && (
              <button
                onClick={handleToggleAttendance}
                disabled={isSyncing}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  isAttendanceActive
                    ? 'bg-rose-500/90 hover:bg-rose-600 text-white border border-rose-400/40'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/40'
                }`}
                title={isAttendanceActive ? 'Tắt điểm danh (Vô hiệu hóa & xóa mã QR)' : 'Bật lại điểm danh (Sinh mã QR mới)'}
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
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Chế độ trình chiếu toàn màn hình (Máy chiếu)'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleCloseModal}
              className="text-white/80 hover:text-white p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
              title="Đóng cửa sổ và tắt phiên điểm danh"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Large QR Code & 20s Live Countdown Timer */}
          <div className="lg:col-span-7 flex flex-col items-center text-center space-y-4">
            
            {isAttendanceActive ? (
              <>
                {/* 20s Countdown Indicator Card */}
                <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#00529C]" />
                      <span>Mã QR sẽ tự làm mới sau:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg transition-colors ${
                        secondsLeft <= 5 
                          ? 'bg-amber-100 text-amber-700 animate-pulse' 
                          : 'bg-blue-100 text-[#00529C]'
                      }`}>
                        {secondsLeft} giây
                      </span>
                      <button
                        onClick={handleForceRefresh}
                        className="p-1 hover:bg-slate-200 rounded-md text-slate-500 hover:text-[#00529C] transition-colors cursor-pointer text-[10px] flex items-center gap-0.5"
                        title="Làm mới mã ngay lập tức (Mã cũ sẽ bị xóa & vô hiệu hóa)"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        secondsLeft <= 5 
                          ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                          : 'bg-gradient-to-r from-[#00529C] via-[#00AEEF] to-emerald-400'
                      }`}
                      style={{ width: `${100 - progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Mã cũ tự động vô hiệu hóa & xóa để nhẹ dữ liệu
                    </span>
                    {justRotated ? (
                      <span className="text-amber-600 font-bold animate-bounce text-[10px]">
                        ✨ Đã đổi mã mới (Mã cũ đã xóa)!
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Chu kỳ 20s tiêu chuẩn</span>
                    )}
                  </div>
                </div>

                {/* QR Code Canvas Frame */}
                <div className={`relative p-5 sm:p-6 bg-white border-2 border-dashed rounded-3xl shadow-sm transition-all duration-300 ${
                  justRotated ? 'border-amber-400 ring-4 ring-amber-100' : 'border-blue-200 hover:border-[#00529C]'
                }`}>
                  <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-white flex items-center justify-center rounded-2xl overflow-hidden shadow-inner">
                    {qrDataUrl ? (
                      <img 
                        key={currentToken}
                        src={qrDataUrl} 
                        alt="Mã QR Điểm danh Động" 
                        className="w-full h-full object-contain animate-fade-in"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-[#00529C]" />
                        <span className="text-xs">Đang sinh mã QR...</span>
                      </div>
                    )}
                  </div>

                  {/* Decorative Corner Badges */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00529C] rounded-tl-md"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00529C] rounded-tr-md"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00529C] rounded-bl-md"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00529C] rounded-br-md"></div>
                </div>

                {/* Instructions & Token code */}
                <div className="space-y-2 max-w-md text-center">
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Đội viên mở camera điện thoại hoặc bấm <strong>"Quét QR Điểm danh"</strong> trên Cổng Đội viên để quét mã này.
                  </p>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Chỉ sinh viên đã đăng ký mới quét được • Mã cũ bị hủy ngay</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã sao chép link' : 'Sao chép link điểm danh'}</span>
                    </button>
                    <button
                      onClick={handleForceRefresh}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00529C] border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Đổi mã ngay</span>
                    </button>
                  </div>
                </div>
              </>
            ) : isCompletedCampaign ? (
              /* Trạng thái HOẠT ĐỘNG ĐÃ KẾT THÚC */
              <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-gray-300 rounded-3xl space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shadow-inner">
                  <Ban className="w-8 h-8" />
                </div>

                <div className="text-center space-y-1.5 max-w-sm">
                  <h4 className="font-display font-bold text-gray-800 text-base">
                    Hoạt động đã kết thúc
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Hoạt động tình nguyện này đã chính thức <strong>kết thúc</strong>. Hệ thống <strong>không hiển thị mã điểm danh QR</strong> nữa để đảm bảo tính minh bạch và tránh phát sinh điểm danh sau sự kiện.
                  </p>
                </div>

                <div className="pt-2 text-xs text-gray-400 font-medium">
                  Quản trị viên có thể tiếp tục xem và chấm điểm thành viên ở cột bên phải.
                </div>
              </div>
            ) : (
              /* Trạng thái KHI TẮT ĐIỂM DANH (Mặc định) */
              <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-inner">
                  <PowerOff className="w-8 h-8" />
                </div>

                <div className="text-center space-y-1.5 max-w-sm">
                  <h4 className="font-display font-bold text-slate-800 text-base">
                    Điểm danh đang ở chế độ TẮT
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chế độ mặc định là <strong>tắt điểm danh</strong>. Khi Ban tổ chức sẵn sàng cho sinh viên điểm danh, hãy bấm nút <strong>"Bắt đầu phát sóng mã QR"</strong> bên dưới.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleToggleAttendance}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#00529C] to-[#00AEEF] hover:from-[#00417c] hover:to-[#0092c9] text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                    <span>Bắt đầu phát sóng mã QR</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Live Attendees Counter & Realtime List */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-4 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
            
            {/* Live Counter Card */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200/90 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đã điểm danh thành công
                </span>
                <span className="text-xl font-mono font-extrabold text-emerald-700">
                  {attendedRegs.length} / {totalApproved.length}
                </span>
              </div>
              <p className="text-xs text-emerald-700/85 mt-1 font-medium">
                Tỷ lệ có mặt: <strong>{totalApproved.length > 0 ? Math.round((attendedRegs.length / totalApproved.length) * 100) : 0}%</strong>
                {totalApproved.length > 0 && ` (${totalApproved.length - attendedRegs.length} bạn chưa điểm danh)`}
              </p>
            </div>

            {/* List Tabs & Search */}
            <div className="space-y-2.5 flex-1 flex flex-col min-h-[280px]">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setAttendeeTab('attended')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                    attendeeTab === 'attended'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Đã có mặt ({attendedRegs.length})
                </button>
                <button
                  onClick={() => setAttendeeTab('not_yet')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                    attendeeTab === 'not_yet'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Chưa điểm danh ({pendingOrApprovedRegs.length})
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Tìm theo tên hoặc MSSV..."
                  value={searchAttendee}
                  onChange={(e) => setSearchAttendee(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00529C]/15"
                />
              </div>

              {/* Tab 1: Attended List */}
              {attendeeTab === 'attended' && (
                filteredAttended.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-200 rounded-2xl">
                    <Clock className="w-8 h-8 text-gray-300 mb-2 animate-bounce" />
                    <p className="text-xs font-semibold text-gray-500">
                      {searchAttendee ? 'Không tìm thấy kết quả' : 'Chưa có ai điểm danh'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Sinh viên quét mã QR sẽ xuất hiện tại đây theo thời gian thực.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                    {filteredAttended.map((reg) => {
                      const studentObj = students.find(s => s.id === reg.studentId);
                      const mssv = studentObj ? studentObj.studentId : reg.studentId;
                      return (
                        <div 
                          key={reg.id}
                          className="p-2.5 bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-xs transition-colors animate-fade-in"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-gray-800 flex items-center gap-1.5">
                              <span>{reg.studentName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">({mssv})</span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {reg.studentClass} • {reg.studentFaculty}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Có mặt
                            </span>
                            {reg.attendedAt && (
                              <span className="block text-[9px] text-gray-400 font-mono mt-0.5">
                                {reg.attendedAt}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Tab 2: Not Yet Attended List */}
              {attendeeTab === 'not_yet' && (
                filteredNotYet.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-200 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-xs font-semibold text-gray-600">
                      Tất cả thành viên đã điểm danh đầy đủ!
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                    {filteredNotYet.map((reg) => {
                      const studentObj = students.find(s => s.id === reg.studentId);
                      const mssv = studentObj ? studentObj.studentId : reg.studentId;
                      return (
                        <div 
                          key={reg.id}
                          className="p-2.5 bg-gray-50 hover:bg-blue-50/40 border border-gray-100 rounded-xl flex items-center justify-between text-xs transition-colors animate-fade-in"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-gray-800 flex items-center gap-1.5">
                              <span>{reg.studentName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">({mssv})</span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {reg.studentClass} • {reg.studentFaculty}
                            </div>
                          </div>

                          {onManualCheckin && (
                            <button
                              onClick={() => handleManualCheck(reg.id)}
                              disabled={isCheckingInId === reg.id}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#00529C] border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                              title="Điểm danh thủ công cho sinh viên này"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>{isCheckingInId === reg.id ? 'Đang lưu...' : 'Điểm danh'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

            </div>

            {/* Campaign info metadata box */}
            <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
              <div>Thời gian: <strong>{campaign.date}</strong></div>
              <div>Địa điểm: <strong>{campaign.location}</strong></div>
              <div>Quy đổi: <strong>+{campaign.score} {campaign.scoreType} CTXH</strong></div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Mã bảo mật phiên: <strong className="font-mono text-gray-700">{currentToken.slice(-7)}</strong></span>
            <span className="text-gray-300">•</span>
            <span className="text-emerald-700 font-medium">⚡ Tự động vô hiệu hóa và xóa mã cũ khi sinh mã mới để nhẹ dữ liệu</span>
          </div>

          <button
            onClick={handleCloseModal}
            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
}
