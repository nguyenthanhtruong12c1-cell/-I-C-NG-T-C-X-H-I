import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics'; // 👈 Thêm import này vì cấu hình mới của bạn có Analytics

// ĐÃ THAY THẾ: Cấu hình mới chính xác từ dự án ctxh-ea037 của bạn
const firebaseConfig = {
  apiKey: "AIzaSyDBy_sZJiw2Kd6oi8Piuu8epc7qhlPM0NU",
  authDomain: "ctxh-ea037.firebaseapp.com",
  projectId: "ctxh-ea037",
  storageBucket: "ctxh-ea037.firebasestorage.app",
  messagingSenderId: "687695716070",
  appId: "1:687695716070:web:7f8b3756dd2e059263e527",
  measurementId: "G-VSTV4HYNKS" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ĐÃ THAY THẾ: Khởi tạo Firestore về cơ sở dữ liệu mặc định (default) 
// để tránh lỗi kết nối nếu bạn không tạo cụ thể ID database này trên Console.
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true 
});

// Khởi tạo Analytics cho cấu hình mới
export const analytics = getAnalytics(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}