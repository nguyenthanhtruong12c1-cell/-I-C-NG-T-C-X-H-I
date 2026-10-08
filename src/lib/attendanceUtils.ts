// Utility functions for Dynamic 20-second Rotating Attendance QR Codes
export const QR_ROTATION_INTERVAL_MS = 20000; // 20 seconds
const SECRET_SALT = 'DTHU_VOLUNTEER_TOTP_SALT_2026';

/**
 * Generate a dynamic token for a specific 20-second time window.
 */
export function generateAttendanceToken(campaignId: string, slot?: number): string {
  const currentSlot = slot !== undefined ? slot : Math.floor(Date.now() / QR_ROTATION_INTERVAL_MS);
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
  const now = Math.floor(Date.now() / 1000);
  const elapsedInWindow = now % 20;
  return 20 - elapsedInWindow;
}

/**
 * Validate an attendance token.
 * Allows current window and previous window (tolerance for camera scan and network transit).
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

    const currentSlot = Math.floor(Date.now() / QR_ROTATION_INTERVAL_MS);

    // Expired check: allow current slot and the immediately preceding slot (total ~20-40s validity)
    if (tokenSlot < currentSlot - 1) {
      return { 
        valid: false, 
        campaignId,
        reason: 'Mã QR đã hết hạn! Vui lòng quét mã QR đang hiển thị trên màn hình chiếu (mã làm mới mỗi 20 giây để chống gian lận).' 
      };
    }

    // Future check (clock skew)
    if (tokenSlot > currentSlot + 1) {
      return { 
        valid: false, 
        campaignId,
        reason: 'Thời gian thiết bị không đồng bộ với máy chủ.' 
      };
    }

    // Signature verification for that slot
    const expectedToken = generateAttendanceToken(campaignId, tokenSlot);
    const expectedSig = expectedToken.split('.')[2];

    if (signature !== expectedSig) {
      return { 
        valid: false, 
        campaignId,
        reason: 'Chữ ký bảo mật của mã QR không chính xác hoặc đã bị chỉnh sửa.' 
      };
    }

    return { valid: true, campaignId };
  } catch (err) {
    return { valid: false, reason: 'Không thể giải mã dữ liệu điểm danh từ mã QR.' };
  }
}
