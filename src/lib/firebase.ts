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
  writeBatch
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

let isQuotaExceeded = false;

function handleFirestoreError(context: string, error: any) {
  if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
    if (!isQuotaExceeded) {
      isQuotaExceeded = true;
      console.warn(`[Firebase Firestore] Quota harian tercapai (${context}). Aplikasi beralih ke mode penyimpanan lokal (LocalStorage).`);
    }
  } else {
    console.warn(`[Firebase Firestore] Notice (${context}):`, error?.message || error);
  }
}

/**
 * Save / sync the active CBT AppConfig to Firestore
 */
export async function saveConfigToFirebase(config: AppConfig): Promise<boolean> {
  if (isQuotaExceeded) return false;
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
  if (isQuotaExceeded) return null;
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
  if (isQuotaExceeded) return () => {};
  const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
  let unsubscribe: () => void = () => {};
  unsubscribe = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as AppConfig;
      if (data && data.questions) {
        onUpdate(data);
      }
    }
  }, (err) => {
    handleFirestoreError('subscribeConfig', err);
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {}
    }
  });
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
  if (isQuotaExceeded) return false;
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
  if (isQuotaExceeded) return [];
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
  if (isQuotaExceeded || !idsToDelete || idsToDelete.length === 0) return false;
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
  if (isQuotaExceeded) return () => {};
  let unsubscribe: () => void = () => {};
  unsubscribe = onSnapshot(collection(db, RESULTS_COLLECTION), (querySnap) => {
    const list: StudentResult[] = [];
    querySnap.forEach((docSnap) => {
      list.push(docSnap.data() as StudentResult);
    });
    onUpdate(list);
  }, (err) => {
    handleFirestoreError('subscribeStudentResults', err);
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {}
    }
  });
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
  if (isQuotaExceeded) return false;
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
  if (isQuotaExceeded) return false;
  try {
    await deleteDoc(doc(db, TEACHERS_COLLECTION, teacherId));
    return true;
  } catch (error) {
    handleFirestoreError('deleteTeacher', error);
    return false;
  }
}

export async function deleteSelectedTeachersFromFirebase(idsToDelete: string[]): Promise<boolean> {
  if (isQuotaExceeded || !idsToDelete || idsToDelete.length === 0) return false;
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
  if (isQuotaExceeded) return [];
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
  if (isQuotaExceeded || !teachers || teachers.length === 0) return false;
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
  if (isQuotaExceeded) return () => {};
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
  if (isQuotaExceeded) return false;
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
  if (isQuotaExceeded) return false;
  try {
    await deleteDoc(doc(db, ADMINS_COLLECTION, adminId));
    return true;
  } catch (error) {
    handleFirestoreError('deleteAdmin', error);
    return false;
  }
}

export async function deleteSelectedAdminsFromFirebase(idsToDelete: string[]): Promise<boolean> {
  if (isQuotaExceeded || !idsToDelete || idsToDelete.length === 0) return false;
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
  if (isQuotaExceeded) return [];
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
  if (isQuotaExceeded || !admins || admins.length === 0) return false;
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
  if (isQuotaExceeded) return () => {};
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
  if (isQuotaExceeded) return false;
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
  if (isQuotaExceeded) return false;
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
    return true;
  } catch (error) {
    handleFirestoreError('deleteStudent', error);
    return false;
  }
}

export async function deleteSelectedStudentsFromFirebase(idsToDelete: string[]): Promise<boolean> {
  if (isQuotaExceeded || !idsToDelete || idsToDelete.length === 0) return false;
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
  if (isQuotaExceeded) return [];
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
  if (isQuotaExceeded || !students || students.length === 0) return false;
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
  if (isQuotaExceeded) return () => {};
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
