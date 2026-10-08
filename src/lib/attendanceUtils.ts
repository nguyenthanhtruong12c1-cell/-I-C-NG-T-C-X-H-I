// Utility functions for Dynamic 20-second Rotating Attendance QR Codes
export const QR_ROTATION_INTERVAL_MS = 20000; // 20 seconds
const SECRET_SALT = 'DTHU_VOLUNTEER_TOTP_SALT_2026';

let serverTimeOffsetMs = 0;

/**
 * Periodically or lazily calibrate with network/server time to handle device clock skew.
 */
export async function syncServerTime(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const t0 = Date.now();
    const res = await fetch(window.location.origin + window.location.pathname, {
      method: 'HEAD',
      cache: 'no-store'
    });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverTime = Date.parse(dateHeader);
      const rtt = Date.now() - t0;
      serverTimeOffsetMs = (serverTime + Math.floor(rtt / 2)) - Date.now();
    }
  } catch {
    // If offline or blocked, keep existing offset
  }
  return serverTimeOffsetMs;
}

// Auto-sync in browser
if (typeof window !== 'undefined') {
  syncServerTime().catch(() => {});
  window.addEventListener('focus', () => {
    syncServerTime().catch(() => {});
  });
}

function getAdjustedNow(): number {
  return Date.now() + serverTimeOffsetMs;
}

/**
 * Generate a dynamic token for a specific 20-second time window.
 */
export function generateAttendanceToken(campaignId: string, slot?: number): string {
  const currentSlot = slot !== undefined ? slot : Math.floor(getAdjustedNow() / QR_ROTATION_INTERVAL_MS);
  const base = `${campaignId}_${currentSlot}_${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const signature = Math.abs(hash).toString(36).toUpperCase().padStart(5, '0');
  return `${campaignId}.${currentSlot}.${signature}`;
}

/**
 * Extract the remaining seconds (1 - 20) in the current 20-second time window.
 */
export function getRemainingSeconds(): number {
  const now = Math.floor(getAdjustedNow() / 1000);
  const elapsedInWindow = now % 20;
  return 20 - elapsedInWindow;
}

/**
 * Validate an attendance token.
 * Validates cryptographic signature and checks time freshness.
 * Accounts for real-world device clock drift (e.g. phone vs computer) without breaking anti-fraud.
 */
export function validateAttendanceToken(tokenStr: string): {
  valid: boolean;
  campaignId?: string;
  reason?: string;
} {
  try {
    if (!tokenStr || typeof tokenStr !== 'string') {
      return { valid: false, reason: 'Dữ liệu mã QR trống hoặc không hợp lệ.' };
    }

    // Support token directly, embedded in URL, JSON, or query string
    let cleanToken = tokenStr.trim();
    if (cleanToken.startsWith('{')) {
      try {
        const parsed = JSON.parse(cleanToken);
        if (parsed.token) cleanToken = parsed.token;
      } catch {}
    }
    if (cleanToken.includes('token=')) {
      try {
        const queryPart = cleanToken.includes('?') ? cleanToken.split('?')[1] : cleanToken;
        const params = new URLSearchParams(queryPart);
        const extracted = params.get('token');
        if (extracted) cleanToken = extracted;
      } catch {}
    }

    const parts = cleanToken.split('.');
    if (parts.length < 3) {
      return { valid: false, reason: 'Mã QR không đúng định dạng điểm danh của hệ thống.' };
    }

    const [campaignId, slotStr, signature] = parts;
    const tokenSlot = parseInt(slotStr, 10);
    if (isNaN(tokenSlot)) {
      return { valid: false, reason: 'Mã QR không chứa thời gian hợp lệ.' };
    }

    // 1. Verify cryptographic signature for the tokenSlot first
    const expectedToken = generateAttendanceToken(campaignId, tokenSlot);
    const expectedSig = expectedToken.split('.')[2];

    if (signature !== expectedSig) {
      return { 
        valid: false, 
        campaignId,
        reason: 'Chữ ký bảo mật của mã QR không chính xác hoặc không hợp lệ.' 
      };
    }

    // 2. Validate time freshness against current time slot
    const currentSlot = Math.floor(getAdjustedNow() / QR_ROTATION_INTERVAL_MS);
    const slotDiff = tokenSlot - currentSlot;

    // Past check: if token was generated more than 3-4 slots ago (> 60-80 seconds ago), it has expired
    if (slotDiff < -3) {
      return { 
        valid: false, 
        campaignId,
        reason: 'Mã QR đã hết hạn! Vui lòng quét mã QR mới đang hiển thị trên màn hình chiếu (mã làm mới mỗi 20 giây để chống điểm danh hộ).' 
      };
    }

    // Future check: only trigger if the device clock is severely drifted (> 10 minutes)
    // Positive slotDiff is safe because a student cannot obtain future tokens unless the presenter's
    // machine clock is ahead of the phone's clock.
    if (slotDiff > 30) {
      return { 
        valid: false, 
        campaignId,
        reason: 'Đồng hồ trên điện thoại của bạn bị lệch quá nhiều so với máy chủ. Vui lòng bật "Tự động cập nhật ngày & giờ" trong cài đặt thiết bị.' 
      };
    }

    return { valid: true, campaignId };
  } catch (err) {
    return { valid: false, reason: 'Không thể giải mã dữ liệu điểm danh từ mã QR.' };
  }
}
