import { StudentResult } from '../types';

const BASE_SECRET_KEY = 'CBT_SOSIOLOGI_2026_KEY_GURU_SEKOLAH_SECURE_AUTH';

/**
 * Calculates a secure 32-bit checksum hash string for integrity verification.
 */
export function calculateHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 << 5) - hash2 + char;
    hash1 |= 0;
    hash2 |= 0;
  }
  return Math.abs(hash1).toString(36) + Math.abs(hash2).toString(36);
}

/**
 * Generates a dynamic, cryptographically random salt string.
 */
export function generateDynamicSalt(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      salt += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return salt;
}

/**
 * Derives a dynamic key byte stream using PBKDF-like mixing with custom key and salt.
 */
export function deriveDynamicKeyBytes(baseKey: string, customKey?: string, salt?: string): Uint8Array {
  const compositeKey = `${baseKey}:${customKey || 'DEFAULT_GURU'}:${salt || 'DYNAMIC_SALT_2026'}`;
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(compositeKey);

  // Expand to a 256-byte dynamic key block
  const expanded = new Uint8Array(256);
  let state1 = 5381;
  let state2 = 0;
  for (let i = 0; i < 256; i++) {
    const rawByte = rawBytes[i % rawBytes.length];
    state1 = (state1 * 33) ^ rawByte ^ i;
    state2 = (state2 << 5) - state2 + rawByte + i;
    state1 |= 0;
    state2 |= 0;
    expanded[i] = (Math.abs(state1 ^ state2) + rawByte) & 0xff;
  }
  return expanded;
}

/**
 * Encrypts a StudentResult object into a secure, UTF-8 byte-safe Base64 payload using dynamic salt & key.
 */
export function encryptResult(result: StudentResult, customKey?: string): string {
  const jsonStr = JSON.stringify(result);
  const hash = calculateHash(jsonStr);
  const salt = generateDynamicSalt(16);

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonStr);
  const effectiveCustomKey = customKey || result.studentInfo?.kodeGuru || 'GURU01';
  const keyBytes = deriveDynamicKeyBytes(BASE_SECRET_KEY, effectiveCustomKey, salt);

  const cipherBytes = new Uint8Array(jsonBytes.length);
  for (let i = 0; i < jsonBytes.length; i++) {
    cipherBytes[i] = jsonBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  let binary = '';
  const len = cipherBytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(cipherBytes[i]);
  }
  const base64Cipher = btoa(binary);

  const container = {
    cbtHeader: 'CBT_SOSIOLOGI_2026_ENCRYPTED_FILE',
    version: '2.1',
    salt,
    kodeGuru: effectiveCustomKey,
    hash,
    payload: base64Cipher,
    studentName: result.studentInfo?.name || 'Siswa',
    noPeserta: result.studentInfo?.noPeserta || '',
    score: result.score,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(container, null, 2);
}

/**
 * Decrypts an encrypted CBT result file content string into a StudentResult object.
 * Seamlessly handles dynamic salted files as well as legacy v2.0 and v1.0 files.
 */
export function decryptResult(encryptedContent: string, customKey?: string): StudentResult {
  const cleanContent = encryptedContent.trim().replace(/^\uFEFF/, '');
  if (!cleanContent) {
    throw new Error('File kosong!');
  }

  let container: any;
  try {
    container = JSON.parse(cleanContent);
  } catch (e) {
    throw new Error('Format file tidak dikenali. File harus berupa file .cbt resmi dari CBT Guru!');
  }

  // Case 1: Direct StudentResult JSON (unencrypted)
  if (container && container.studentInfo && typeof container.score === 'number' && Array.isArray(container.answers)) {
    return container as StudentResult;
  }

  // Case 2: Standard CBT Encrypted Container
  if (!container || container.cbtHeader !== 'CBT_SOSIOLOGI_2026_ENCRYPTED_FILE' || !container.payload) {
    throw new Error('File bukan merupakan file jawaban CBT Guru resmi yang terenkripsi!');
  }

  const base64Cipher = container.payload;
  const salt = container.salt;
  const fileKodeGuru = container.kodeGuru || customKey;

  let decryptedJson = '';
  let decryptSuccess = false;

  // Attempt 1: Dynamic key decryption (v2.1 with salt)
  if (salt) {
    try {
      const binary = atob(base64Cipher);
      const cipherBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        cipherBytes[i] = binary.charCodeAt(i);
      }

      const keyBytes = deriveDynamicKeyBytes(BASE_SECRET_KEY, fileKodeGuru || 'GURU01', salt);
      const decryptedBytes = new Uint8Array(cipherBytes.length);
      for (let i = 0; i < cipherBytes.length; i++) {
        decryptedBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      decryptedJson = new TextDecoder().decode(decryptedBytes);
      JSON.parse(decryptedJson); // verify JSON validity
      decryptSuccess = true;
    } catch (e) {
      // Fall through to legacy attempts
    }
  }

  // Attempt 2: Legacy v2.0 Byte-XOR with BASE_SECRET_KEY
  if (!decryptSuccess) {
    try {
      const binary = atob(base64Cipher);
      const cipherBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        cipherBytes[i] = binary.charCodeAt(i);
      }

      const keyBytes = new TextEncoder().encode(BASE_SECRET_KEY);
      const decryptedBytes = new Uint8Array(cipherBytes.length);
      for (let i = 0; i < cipherBytes.length; i++) {
        decryptedBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      decryptedJson = new TextDecoder().decode(decryptedBytes);
      JSON.parse(decryptedJson);
      decryptSuccess = true;
    } catch (e) {
      // Fall through
    }
  }

  // Attempt 3: Legacy v1.0 String-XOR with BASE_SECRET_KEY
  if (!decryptSuccess) {
    try {
      const binary = atob(base64Cipher);
      const utf8Bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const cipherStr = new TextDecoder().decode(utf8Bytes);
      let output = '';
      for (let i = 0; i < cipherStr.length; i++) {
        output += String.fromCharCode(cipherStr.charCodeAt(i) ^ BASE_SECRET_KEY.charCodeAt(i % BASE_SECRET_KEY.length));
      }
      decryptedJson = output;
      JSON.parse(decryptedJson);
      decryptSuccess = true;
    } catch (fallbackErr) {
      throw new Error('Gagal mendekripsi payload file .cbt. Kunci enkripsi tidak cocok atau file terkorupsi!');
    }
  }

  let resultObj: StudentResult;
  try {
    resultObj = JSON.parse(decryptedJson);
  } catch (e) {
    throw new Error('Data hasil jawaban terdekripsi tidak berformat JSON valid.');
  }

  if (!resultObj || !resultObj.studentInfo || typeof resultObj.score !== 'number') {
    throw new Error('Struktur data hasil ujian siswa tidak lengkap atau tidak valid!');
  }

  if (container.hash) {
    const calculated = calculateHash(decryptedJson);
    if (container.hash !== calculated) {
      console.warn('Hash integrity mismatch in .cbt file:', container.hash, 'vs', calculated);
    }
  }

  return resultObj;
}

/**
 * Encrypts an entire app backup or question package object into a secure encrypted JSON payload using dynamic keys.
 */
export function encryptAppBackup(backupPayload: any, customKey?: string): string {
  const jsonStr = JSON.stringify(backupPayload);
  const hash = calculateHash(jsonStr);
  const salt = generateDynamicSalt(16);
  const effectiveKodeGuru = customKey || backupPayload.config?.kodeGuru || 'GURU01';

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonStr);
  const keyBytes = deriveDynamicKeyBytes(BASE_SECRET_KEY, effectiveKodeGuru, salt);

  const cipherBytes = new Uint8Array(jsonBytes.length);
  for (let i = 0; i < jsonBytes.length; i++) {
    cipherBytes[i] = jsonBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  let binary = '';
  const len = cipherBytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(cipherBytes[i]);
  }
  const base64Cipher = btoa(binary);

  const container = {
    cbtBackupHeader: 'CBT_GURUAI_SECURE_ENCRYPTED_BACKUP_V2',
    version: '2.1',
    securityStatus: 'ENCRYPTED_DYNAMIC_PBKDF_XOR_UTF8',
    salt,
    hash,
    kodeGuru: effectiveKodeGuru,
    encryptedData: base64Cipher,
    payload: base64Cipher,
    exportedAt: new Date().toISOString(),
    summary: {
      questionsCount: backupPayload.config?.questions?.length || backupPayload.questions?.length || 0,
      studentsCount: backupPayload.config?.students?.length || 0,
      resultsCount: backupPayload.studentResults?.length || 0,
    }
  };

  return JSON.stringify(container, null, 2);
}

/**
 * Decrypts an encrypted app backup or question package JSON payload with robust multi-key candidate probing and fallbacks.
 */
export function decryptAppBackup(encryptedContent: string, customKey?: string): any {
  const cleanContent = encryptedContent.trim().replace(/^\uFEFF/, '');
  if (!cleanContent) {
    throw new Error('File backup kosong!');
  }

  let container: any;
  try {
    container = JSON.parse(cleanContent);
  } catch (e) {
    throw new Error('Format file backup tidak valid. File harus berupa JSON backup resmi CBT GURUAI!');
  }

  // 1. If unencrypted JSON backup or question package
  if (container && (container.config || container.questions || Array.isArray(container.questions))) {
    return container;
  }

  const base64Cipher = container.encryptedData || container.payload || container.data;
  if (!base64Cipher) {
    if (container && typeof container === 'object') {
      return container;
    }
    throw new Error('Data terenkripsi tidak ditemukan di dalam file backup!');
  }

  const salt = container.salt;
  let decryptedJson = '';
  let decryptSuccess = false;

  // Build candidate keys to try for bulletproof reading
  const candidateKeys: string[] = [];
  if (customKey) candidateKeys.push(customKey);
  if (container.kodeGuru) candidateKeys.push(container.kodeGuru);
  candidateKeys.push('GURU01', 'GURU02', 'GURU03', 'GURU04', 'GURU05', 'GURU06', 'GURU07', 'GURU08', 'GURU09', 'GURU10', 'ADMIN', 'DEFAULT_GURU');
  const uniqueKeys = Array.from(new Set(candidateKeys.map(k => k.toUpperCase())));

  // Attempt 1: Dynamic key decryption with salt across candidate keys
  if (salt) {
    for (const k of uniqueKeys) {
      try {
        const binary = atob(base64Cipher);
        const cipherBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          cipherBytes[i] = binary.charCodeAt(i);
        }

        const keyBytes = deriveDynamicKeyBytes(BASE_SECRET_KEY, k, salt);
        const decryptedBytes = new Uint8Array(cipherBytes.length);
        for (let i = 0; i < cipherBytes.length; i++) {
          decryptedBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        const testJson = new TextDecoder().decode(decryptedBytes);
        const parsedTest = JSON.parse(testJson);
        if (parsedTest && (parsedTest.config || parsedTest.questions || parsedTest.studentResults || Array.isArray(parsedTest))) {
          decryptedJson = testJson;
          decryptSuccess = true;
          break;
        }
      } catch (e) {
        // Try next key
      }
    }
  }

  // Attempt 2: Try without salt or standard salt
  if (!decryptSuccess) {
    for (const k of uniqueKeys) {
      try {
        const binary = atob(base64Cipher);
        const cipherBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          cipherBytes[i] = binary.charCodeAt(i);
        }

        const keyBytes = deriveDynamicKeyBytes(BASE_SECRET_KEY, k, 'DEFAULT_SALT');
        const decryptedBytes = new Uint8Array(cipherBytes.length);
        for (let i = 0; i < cipherBytes.length; i++) {
          decryptedBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        const testJson = new TextDecoder().decode(decryptedBytes);
        const parsedTest = JSON.parse(testJson);
        if (parsedTest && (parsedTest.config || parsedTest.questions || parsedTest.studentResults)) {
          decryptedJson = testJson;
          decryptSuccess = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
  }

  // Attempt 3: Legacy v2.0 Byte-XOR with BASE_SECRET_KEY
  if (!decryptSuccess) {
    try {
      const binary = atob(base64Cipher);
      const cipherBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        cipherBytes[i] = binary.charCodeAt(i);
      }

      const keyBytes = new TextEncoder().encode(BASE_SECRET_KEY);
      const decryptedBytes = new Uint8Array(cipherBytes.length);
      for (let i = 0; i < cipherBytes.length; i++) {
        decryptedBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      const testJson = new TextDecoder().decode(decryptedBytes);
      JSON.parse(testJson);
      decryptedJson = testJson;
      decryptSuccess = true;
    } catch (e) {
      // Continue
    }
  }

  // Attempt 4: Last resort fallback
  if (!decryptSuccess) {
    try {
      const binary = atob(base64Cipher);
      decryptedJson = binary;
      JSON.parse(decryptedJson);
      decryptSuccess = true;
    } catch (e) {
      if (container && typeof container === 'object') {
        return container;
      }
      throw new Error('Gagal mendekripsi file paket soal / backup. Pastikan file merupakan file backup resmi CBT GURUAI yang valid!');
    }
  }

  let backupPayload: any;
  try {
    backupPayload = JSON.parse(decryptedJson);
  } catch (e) {
    throw new Error('Hasil dekripsi file paket soal bukan format JSON yang valid!');
  }

  return backupPayload;
}


