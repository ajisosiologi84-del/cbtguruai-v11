import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  disableNetwork,
  enableNetwork,
  setLogLevel,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppConfig, StudentResult, TeacherUser, StudentUser, AdminUser } from '../types';

// Silence verbose internal Firestore log messages (like backoff warnings)
try {
  setLogLevel('silent');
} catch (e) {}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Database instance (using custom firestoreDatabaseId if specified)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth instance
export const auth = getAuth(app);

const CONFIG_DOC_ID = 'main';
const CONFIG_COLLECTION = 'cbt_config';
const RESULTS_COLLECTION = 'student_results';
const TEACHERS_COLLECTION = 'teacher_accounts';
const STUDENTS_COLLECTION = 'cbt_students';
const ADMINS_COLLECTION = 'admin_accounts';

const QUOTA_STORAGE_KEY = 'cbt_firestore_quota_exceeded_timestamp';
const LEGACY_QUOTA_STORAGE_KEY = 'cbt_firestore_quota_exceeded_date';
let isQuotaExceeded = false;

export function isQuotaExceededStatus(): boolean {
  if (isQuotaExceeded) return true;
  try {
    const savedTimeStr = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (savedTimeStr) {
      const savedTime = Number(savedTimeStr);
      // Quota resets every 24 hours on Google Cloud
      if (Date.now() - savedTime < 24 * 60 * 60 * 1000) {
        isQuotaExceeded = true;
        return true;
      }
    }
    const legacyDate = localStorage.getItem(LEGACY_QUOTA_STORAGE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (legacyDate === today) {
      isQuotaExceeded = true;
      return true;
    }
  } catch (e) {}
  return false;
}

export function markQuotaExceeded(context?: string) {
  isQuotaExceeded = true;
  try {
    const now = Date.now();
    localStorage.setItem(QUOTA_STORAGE_KEY, String(now));
    localStorage.setItem(LEGACY_QUOTA_STORAGE_KEY, new Date().toISOString().slice(0, 10));
  } catch (e) {}
  
  // Immediately shut down Firestore network stream to eliminate repetitive retry/backoff loops
  try {
    disableNetwork(db).catch(() => {});
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cbt_quota_exceeded'));
  }
  console.warn(`[Firebase Firestore] Kuota harian gratis tercapai ${context ? `(${context})` : ''}. Mode offline LocalStorage diaktifkan.`);
}

export async function resetQuotaExceededStatus() {
  isQuotaExceeded = false;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    localStorage.removeItem(LEGACY_QUOTA_STORAGE_KEY);
  } catch (e) {}

  try {
    await enableNetwork(db);
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cbt_quota_reset'));
  }
}

// If quota is already flagged as exceeded from previous session, disconnect network proactively
if (typeof window !== 'undefined' && isQuotaExceededStatus()) {
  try {
    disableNetwork(db).catch(() => {});
  } catch (e) {}
}

// Global interceptor for unhandled Firestore errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const errMsg = String(reason?.message || reason || '');
    const errCode = String(reason?.code || '');
    if (
      errCode === 'resource-exhausted' ||
      errMsg.includes('Quota limit exceeded') ||
      errMsg.includes('resource-exhausted') ||
      errMsg.includes('Free daily write units per project')
    ) {
      markQuotaExceeded('global-unhandledrejection');
      event.preventDefault();
    }
  });
}

function handleFirestoreError(context: string, error: any) {
  const errMsg = String(error?.message || error || '');
  const errCode = String(error?.code || '');
  if (
    errCode === 'resource-exhausted' ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Free daily write units per project')
  ) {
    markQuotaExceeded(context);
  } else {
    console.warn(`[Firebase Firestore] Notice (${context}):`, errMsg);
  }
}

/**
 * Save / sync the active CBT AppConfig to Firestore
 */
export async function saveConfigToFirebase(config: AppConfig): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError('saveConfig', error);
    return false;
  }
}

/**
 * Fetch CBT AppConfig from Firestore
 */
export async function loadConfigFromFirebase(): Promise<AppConfig | null> {
  if (isQuotaExceededStatus()) return null;
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError('loadConfig', error);
    return null;
  }
}

/**
 * Subscribe to real-time updates for AppConfig from Firestore
 */
export function subscribeConfigFromFirebase(onUpdate: (config: AppConfig) => void): () => void {
  if (isQuotaExceededStatus()) return () => {};
  const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
  let unsubscribe: () => void = () => {};
  try {
    unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppConfig;
        if (data && data.questions) {
          onUpdate(data);
        }
      }
    }, (err) => {
      handleFirestoreError('subscribeConfig', err);
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {}
    });
  } catch (err) {
    handleFirestoreError('subscribeConfig', err);
  }
  return () => {
    try {
      if (unsubscribe) unsubscribe();
    } catch (e) {}
  };
}

/**
 * Save a student exam result to Firestore
 */
export async function saveStudentResultToFirebase(result: StudentResult): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    const docRef = doc(db, RESULTS_COLLECTION, result.id);
    await setDoc(docRef, result, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError('saveStudentResult', error);
    return false;
  }
}

/**
 * Load all student exam results from Firestore
 */
export async function loadStudentResultsFromFirebase(): Promise<StudentResult[]> {
  if (isQuotaExceededStatus()) return [];
  try {
    const querySnap = await getDocs(collection(db, RESULTS_COLLECTION));
    const list: StudentResult[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as StudentResult);
    });
    return list;
  } catch (error) {
    handleFirestoreError('loadStudentResults', error);
    return [];
  }
}

/**
 * Delete a batch of student result IDs from Firestore
 */
export async function deleteSelectedStudentResultsFromFirebase(idsToDelete: string[]): Promise<boolean> {
  if (isQuotaExceededStatus() || !idsToDelete || idsToDelete.length === 0) return false;
  try {
    const batch = writeBatch(db);
    idsToDelete.forEach((id) => {
      const docRef = doc(db, RESULTS_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError('deleteSelectedStudentResults', error);
    return false;
  }
}

/**
 * Subscribe to real-time student results
 */
export function subscribeStudentResultsFromFirebase(onUpdate: (results: StudentResult[]) => void): () => void {
  if (isQuotaExceededStatus()) return () => {};
  let unsubscribe: () => void = () => {};
  try {
    unsubscribe = onSnapshot(collection(db, RESULTS_COLLECTION), (querySnap) => {
      const list: StudentResult[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data() as StudentResult);
      });
      onUpdate(list);
    }, (err) => {
      handleFirestoreError('subscribeStudentResults', err);
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {}
    });
  } catch (err) {
    handleFirestoreError('subscribeStudentResults', err);
  }
  return () => {
    try {
      if (unsubscribe) unsubscribe();
    } catch (e) {}
  };
}

/**
 * Teacher accounts management in Firestore
 */
export async function saveTeacherToFirebase(teacher: TeacherUser): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    const docRef = doc(db, TEACHERS_COLLECTION, teacher.id);
    await setDoc(docRef, teacher, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError('saveTeacher', error);
    return false;
  }
}

export async function deleteTeacherFromFirebase(teacherId: string): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    await deleteDoc(doc(db, TEACHERS_COLLECTION, teacherId));
    return true;
  } catch (error) {
    handleFirestoreError('deleteTeacher', error);
    return false;
  }
}

export async function deleteSelectedTeachersFromFirebase(idsToDelete: string[]): Promise<boolean> {
  if (isQuotaExceededStatus() || !idsToDelete || idsToDelete.length === 0) return false;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
      const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        if (id) {
          const docRef = doc(db, TEACHERS_COLLECTION, id);
          batch.delete(docRef);
        }
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError('deleteSelectedTeachers', error);
    return false;
  }
}

export async function loadTeachersFromFirebase(): Promise<TeacherUser[]> {
  if (isQuotaExceededStatus()) return [];
  try {
    const querySnap = await getDocs(collection(db, TEACHERS_COLLECTION));
    const list: TeacherUser[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as TeacherUser);
    });
    return list;
  } catch (error) {
    handleFirestoreError('loadTeachers', error);
    return [];
  }
}

export async function saveAllTeachersToFirebase(teachers: TeacherUser[]): Promise<boolean> {
  if (isQuotaExceededStatus() || !teachers || teachers.length === 0) return false;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < teachers.length; i += CHUNK_SIZE) {
      const chunk = teachers.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((teacher) => {
        if (teacher && teacher.id) {
          const docRef = doc(db, TEACHERS_COLLECTION, teacher.id);
          batch.set(docRef, teacher, { merge: true });
        }
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError('saveAllTeachers', error);
    return false;
  }
}

export function subscribeTeachersFromFirebase(onUpdate: (teachers: TeacherUser[]) => void): () => void {
  if (isQuotaExceededStatus()) return () => {};
  let unsubscribe: () => void = () => {};
  try {
    const colRef = collection(db, TEACHERS_COLLECTION);
    unsubscribe = onSnapshot(colRef, (querySnap) => {
      const list: TeacherUser[] = [];
      querySnap.forEach((docSnap) => {
        if (docSnap.exists()) {
          list.push(docSnap.data() as TeacherUser);
        }
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (err) => {
      handleFirestoreError('subscribeTeachers', err);
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {}
    });
  } catch (err) {
    handleFirestoreError('subscribeTeachers', err);
  }
  return () => {
    try {
      if (unsubscribe) unsubscribe();
    } catch (e) {}
  };
}

/**
 * Admin accounts management in Firestore
 */
export async function saveAdminToFirebase(admin: AdminUser): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    const docRef = doc(db, ADMINS_COLLECTION, admin.id);
    await setDoc(docRef, admin, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError('saveAdmin', error);
    return false;
  }
}

export async function deleteAdminFromFirebase(adminId: string): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    await deleteDoc(doc(db, ADMINS_COLLECTION, adminId));
    return true;
  } catch (error) {
    handleFirestoreError('deleteAdmin', error);
    return false;
  }
}

export async function deleteSelectedAdminsFromFirebase(idsToDelete: string[]): Promise<boolean> {
  if (isQuotaExceededStatus() || !idsToDelete || idsToDelete.length === 0) return false;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
      const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        if (id) {
          const docRef = doc(db, ADMINS_COLLECTION, id);
          batch.delete(docRef);
        }
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError('deleteSelectedAdmins', error);
    return false;
  }
}

export async function loadAdminsFromFirebase(): Promise<AdminUser[]> {
  if (isQuotaExceededStatus()) return [];
  try {
    const querySnap = await getDocs(collection(db, ADMINS_COLLECTION));
    const list: AdminUser[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as AdminUser);
    });
    return list;
  } catch (error) {
    handleFirestoreError('loadAdmins', error);
    return [];
  }
}

export async function saveAllAdminsToFirebase(admins: AdminUser[]): Promise<boolean> {
  if (isQuotaExceededStatus() || !admins || admins.length === 0) return false;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < admins.length; i += CHUNK_SIZE) {
      const chunk = admins.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((admin) => {
        if (admin && admin.id) {
          const docRef = doc(db, ADMINS_COLLECTION, admin.id);
          batch.set(docRef, admin, { merge: true });
        }
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError('saveAllAdmins', error);
    return false;
  }
}

export function subscribeAdminsFromFirebase(onUpdate: (admins: AdminUser[]) => void): () => void {
  if (isQuotaExceededStatus()) return () => {};
  let unsubscribe: () => void = () => {};
  try {
    const colRef = collection(db, ADMINS_COLLECTION);
    unsubscribe = onSnapshot(colRef, (querySnap) => {
      const list: AdminUser[] = [];
      querySnap.forEach((docSnap) => {
        if (docSnap.exists()) {
          list.push(docSnap.data() as AdminUser);
        }
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (err) => {
      handleFirestoreError('subscribeAdmins', err);
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {}
    });
  } catch (err) {
    handleFirestoreError('subscribeAdmins', err);
  }
  return () => {
    try {
      if (unsubscribe) unsubscribe();
    } catch (e) {}
  };
}

/**
 * Student accounts management in Firestore
 */
export async function saveStudentToFirebase(student: StudentUser): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, student.id);
    await setDoc(docRef, student, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError('saveStudent', error);
    return false;
  }
}

export async function deleteStudentFromFirebase(studentId: string): Promise<boolean> {
  if (isQuotaExceededStatus()) return false;
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
    return true;
  } catch (error) {
    handleFirestoreError('deleteStudent', error);
    return false;
  }
}

export async function deleteSelectedStudentsFromFirebase(idsToDelete: string[]): Promise<boolean> {
  if (isQuotaExceededStatus() || !idsToDelete || idsToDelete.length === 0) return false;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
      const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        if (id) {
          const docRef = doc(db, STUDENTS_COLLECTION, id);
          batch.delete(docRef);
        }
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError('deleteSelectedStudents', error);
    return false;
  }
}

export async function loadStudentsFromFirebase(): Promise<StudentUser[]> {
  if (isQuotaExceededStatus()) return [];
  try {
    const querySnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    const list: StudentUser[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as StudentUser);
    });
    return list;
  } catch (error) {
    handleFirestoreError('loadStudents', error);
    return [];
  }
}

export async function saveAllStudentsToFirebase(students: StudentUser[]): Promise<boolean> {
  if (isQuotaExceededStatus() || !students || students.length === 0) return false;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        if (student && student.id) {
          const docRef = doc(db, STUDENTS_COLLECTION, student.id);
          batch.set(docRef, student, { merge: true });
        }
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError('saveAllStudents', error);
    return false;
  }
}

export function subscribeStudentsFromFirebase(onUpdate: (students: StudentUser[]) => void): () => void {
  if (isQuotaExceededStatus()) return () => {};
  let unsubscribe: () => void = () => {};
  try {
    const colRef = collection(db, STUDENTS_COLLECTION);
    unsubscribe = onSnapshot(colRef, (querySnap) => {
      const list: StudentUser[] = [];
      querySnap.forEach((docSnap) => {
        if (docSnap.exists()) {
          list.push(docSnap.data() as StudentUser);
        }
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (err) => {
      handleFirestoreError('subscribeStudents', err);
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {}
    });
  } catch (err) {
    handleFirestoreError('subscribeStudents', err);
  }
  return () => {
    try {
      if (unsubscribe) unsubscribe();
    } catch (e) {}
  };
}
