import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, Camera, AlertCircle, Upload, CheckCircle2, RefreshCw } from 'lucide-react';

interface QRScannerModalProps {
  onScanSuccess: (decodedText: string) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function QRScannerModal({
  onScanSuccess,
  onClose
}: QRScannerModalProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [scannerStarted, setScannerStarted] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-camera-viewfinder';
  const isScanningLockedRef = useRef(false);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  // Start camera on mount
  useEffect(() => {
    let isMounted = true;

    if (activeTab === 'camera') {
      const qrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      qrCode
        .start(
          { facingMode: 'environment' },
          config,
          async (decodedText) => {
            if (!isMounted) return;
            handleDetectedCode(decodedText);
          },
          () => {
            // Scanning in progress, ignore routine non-detection frames
          }
        )
        .then(() => {
          if (isMounted) setScannerStarted(true);
        })
        .catch((err) => {
          console.warn('Camera start error:', err);
          if (isMounted) {
            setErrorMessage('Không thể mở camera. Vui lòng cấp quyền camera hoặc chọn tab "Tải ảnh QR"!');
            setActiveTab('upload');
          }
        });
    }

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
            try {
              html5QrCodeRef.current?.clear();
            } catch {}
          });
        }
      }
    };
  }, [activeTab]);

  // Handler for detected QR Code text
  const handleDetectedCode = async (code: string) => {
    // Synchronous immediate lock
    if (isScanningLockedRef.current) return;

    // Debounce duplicate scans within 4 seconds
    const now = Date.now();
    if (lastScannedRef.current && lastScannedRef.current.code === code && (now - lastScannedRef.current.time < 4000)) {
      return;
    }

    isScanningLockedRef.current = true;
    lastScannedRef.current = { code, time: now };
    setIsProcessing(true);
    setErrorMessage(null);

    // Immediately pause scanner stream so no subsequent video frames fire
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        html5QrCodeRef.current.pause(true);
      } catch {}
    }

    try {
      const result = await onScanSuccess(code);
      if (result.success) {
        // Stop camera once scan succeeds
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {}
        }
        setScanResult(result.message);
      } else {
        setErrorMessage(result.message || 'Mã QR không hợp lệ!');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi xử lý điểm danh!');
      setIsProcessing(false);
    }
  };

  // Handle image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const qrCode = new Html5Qrcode('file-qr-temp-div');
      const result = await qrCode.scanFile(file, true);
      await handleDetectedCode(result);
    } catch (err) {
      setErrorMessage('Không nhận diện được mã QR trong hình ảnh. Vui lòng thử lại với ảnh rõ hơn!');
      setIsProcessing(false);
    }
  };

  // Handle manual code submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await handleDetectedCode(manualInput.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col text-xs">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00529C] to-[#00AEEF] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-white" />
            <h3 className="font-display font-bold text-sm">Quét mã QR Điểm danh</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex gap-2">
          <button
            onClick={() => {
              setActiveTab('camera');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-[#00529C] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#00529C] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải ảnh QR</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('manual');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#00529C] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>Nhập link/mã</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 space-y-4">
          
          {/* Success State */}
          {scanResult ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Điểm danh thành công!</h4>
              <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">{scanResult}</p>
              
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Error Box */}
              {errorMessage && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 flex items-start justify-between gap-2 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      isScanningLockedRef.current = false;
                      setIsProcessing(false);
                      if (html5QrCodeRef.current) {
                        try {
                          html5QrCodeRef.current.resume();
                        } catch {}
                      }
                    }}
                    className="text-[11px] font-bold text-red-700 underline hover:text-red-900 shrink-0 cursor-pointer ml-1"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* TAB 1: Camera Scanner */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center shadow-inner">
                    <div id={scannerContainerId} className="w-full h-full" />
                    
                    {!scannerStarted && !errorMessage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2 bg-black/60">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#00AEEF]" />
                        <span>Đang khởi động camera...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-gray-400 text-[11px]">
                    Căn chỉnh mã QR trên màn hình vào khung quét camera
                  </p>
                </div>
              )}

              {/* TAB 2: Upload QR Image */}
              {activeTab === 'upload' && (
                <div className="space-y-4 text-center py-4">
                  <div id="file-qr-temp-div" className="hidden" />
                  
                  <label className="border-2 border-dashed border-gray-300 hover:border-[#00529C] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50 hover:bg-blue-50/30 transition-all block">
                    <div className="w-12 h-12 rounded-full bg-blue-100/70 text-[#00529C] flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-700 block">Chọn ảnh chứa mã QR</span>
                      <span className="text-[10px] text-gray-400">Hỗ trợ JPG, PNG, WebP</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                    />
                  </label>
                </div>
              )}

              {/* TAB 3: Manual Input */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-gray-600 font-semibold">Nhập mã điểm danh hoặc link quét:</label>
                    <textarea
                      rows={3}
                      placeholder="Dán link hoặc chuỗi mã điểm danh..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00529C]/15 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing || !manualInput.trim()}
                    className="w-full py-2 bg-[#00529C] hover:bg-[#003B70] text-white rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? 'Đang xác thực...' : 'Xác nhận điểm danh'}
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
