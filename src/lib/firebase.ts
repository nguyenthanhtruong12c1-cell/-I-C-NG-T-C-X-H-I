import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// Cấu hình Firebase chính thức được cấp bởi AI Studio
const firebaseConfig = {
  apiKey: "AIzaSyAlu4pVWAd8lh-yD3ZytdXBEfb3ElI8nuc",
  authDomain: "angular-apricot-nxhgq.firebaseapp.com",
  projectId: "angular-apricot-nxhgq",
  storageBucket: "angular-apricot-nxhgq.firebasestorage.app",
  messagingSenderId: "353690584670",
  appId: "1:353690584670:web:c54762f2783e832e5156cf"
};

const databaseId = "ai-studio-qunltnhnguyntrng-597232d4-afd4-4c45-8ada-ef4e17fc6aea";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true // Crucial to prevent errors if we save objects with undefined fields
}, databaseId);

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