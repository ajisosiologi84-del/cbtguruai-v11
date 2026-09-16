export interface Option {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
  isCorrect: boolean;
}

export interface CategoryStatement {
  id: string; // '1', '2', '3', etc.
  statement: string;
  correctCategory: string; // e.g. 'Benar' | 'Salah' or 'Ya' | 'Tidak'
}

export interface Question {
  id: number;
  question: string;
  options: Option[];
  explanation: string;
  image?: string; // Base64 data URL or image URL for question image / table / diagram
  isActive?: boolean; // Default true, toggle to enable/disable for exam
  mapel?: string; // Mata pelajaran (e.g. 'Sosiologi', 'Geografi', etc.)
  kompetensi?: string; // Kompetensi Dasar / Sub Topik / Capaian Pembelajaran (e.g. 'Perubahan Sosial', '3.1 KD Sosiologi', dll)
  subTopik?: string; // Sub Topik / Materi Ujian (e.g. 'Perubahan Sosial', 'Globalisasi', dll)
  bentukSoal?: 'Pilihan Ganda' | 'Pilihan Ganda Kompleks MCMA' | 'Pilihan Ganda Kompleks Kategori' | 'Pilihan Ganda Kompleks' | 'Menjodohkan' | 'Isian Singkat' | 'Uraian' | string; // Bentuk Soal (default 'Pilihan Ganda')
  kodeGuru?: string; // Kode Guru Pengampu (e.g. 'GURU01', 'GR-AJI')
  categoryOptions?: string[]; // Pilihan Kategori e.g. ['Benar', 'Salah'] atau ['Ya', 'Tidak']
  categoryStatements?: CategoryStatement[]; // Daftar Pernyataan & Kunci Kategori untuk Soal Kategori
  poin?: number; // Poin / Bobot Nilai Soal (default 10)
}

export interface StudentUser {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  isActive?: boolean; // Status aktif mengikuti ujian (default true)
  kodeGuru?: string; // Kode Guru Pengampu / Penanda Guru (e.g. 'GURU01')
}

export interface TeacherUser {
  id: string;
  nip: string;
  nama: string;
  mapel: string;
  kodeGuru?: string; // Kode unik Guru Pengampu
  username?: string; // Username opsional untuk login Guru
  password?: string; // Password Guru (jika kosong, default: NIP/kodeGuru/'guru')
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  nama: string;
  role?: 'superadmin' | 'proktor' | 'admin' | string;
  createdAt?: string;
}

export interface KopSekolahConfig {
  namaSekolah: string; // e.g. "SMA NEGERI 1 JAKARTA"
  dinas: string; // e.g. "DINAS PENDIDIKAN PROVINSI DKI JAKARTA"
  alamat: string; // e.g. "Jl. Budi Utomo No. 7, Jakarta Pusat"
  teleponWeb: string; // e.g. "Telp: (021) 3865001 | Website: www.sman1jakarta.sch.id"
  kotaTanggal: string; // e.g. "Jakarta, 26 Juli 2026"
  namaGuru: string; // e.g. "Drs. Aji Sosiologi, M.Pd"
  nipGuru: string; // e.g. "198501152010011002"
  jabatanGuru: string; // e.g. "Guru Mata Pelajaran Sosiologi"
  kodeGuru?: string; // e.g. "GURU01"
  namaKepalaSekolah?: string; // e.g. "Dr. H. Ahmad Sanusi, M.Si"
  nipKepalaSekolah?: string; // e.g. "197203101998021001"
  logoSekolah?: string; // Base64 Data URL or Image URL (Logo Sekolah / Sebelah Kanan)
  logoPemda?: string; // Base64 Data URL or Image URL (Logo Pemda / Dinas / Sebelah Kiri)
  paperSize?: 'a4' | 'f4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

export interface CheatingLog {
  timestamp: string; // e.g. "10:15:22"
  type: string; // e.g. "Pindah Tab / Keluar Layar", "Mengecilkan Window", "Shortcut Terlarang"
  details?: string;
}

export interface BroadcastAlert {
  id: string;
  message: string;
  targetStudentNis?: string; // empty / 'ALL' = broadcast to all students
  targetStudentName?: string;
  sender?: string;
  createdAt: string;
  type?: 'warning' | 'info' | 'urgent';
}

export interface ExamScheduleConfig {
  startTime?: string; // e.g. "2026-07-29T08:00"
  endTime?: string; // e.g. "2026-07-29T12:00"
  sessionStatus?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'FORCE_STOPPED';
  lateToleranceMinutes?: number;
  allowReviewAfterFinish?: boolean;
  showScoreImmediately?: boolean;
  strictAntiCheating?: boolean;
  maxCheatingAllowed?: number;
}

export interface TeacherConfigOverride {
  kodeGuru: string;
  mapel?: string;
  duration?: number;
  kkm?: number;
  examToken?: string;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  allowReview?: boolean;
  maxQuestionsToDisplay?: number;
  maxAttempts?: number;
  kopSekolah?: KopSekolahConfig;
  examSchedule?: ExamScheduleConfig;
}

export interface ExamScheduleToken {
  id: string; // e.g. "SCHED-01", "SESI-01"
  namaSesi: string; // e.g. "Sesi 1 - Utama (Kelas XII IPS 1 & 2)"
  tanggalUjian: string; // e.g. "2026-08-30"
  jamMulai: string; // e.g. "08:00"
  jamSelesai: string; // e.g. "09:30"
  durasiMenit: number; // e.g. 60 or 90
  kkm: number; // e.g. 75
  mapel: string; // e.g. "Sosiologi"
  kodeGuru?: string; // e.g. "GURU01"
  targetKelas: string; // e.g. "XII IPS 1, XII IPS 2" or "Semua Kelas"
  paketSoal: string; // e.g. "Paket A (Utama)", "Paket B (Variasi Acak)", "Paket C (Susulan)"
  kodePaket: string; // e.g. "PKT-SOS-A", "PKT-SOS-B"
  token: string; // e.g. "SOS2026", "TKA891", "CBT742"
  tokenCreatedAt?: string;
  status: 'ACTIVE' | 'STANDBY' | 'EXPIRED' | 'CLOSED';
  isPrimaryActive?: boolean; // Penanda token yang saat ini dijadikan default di portal login
  soalIds?: number[]; // Daftar ID soal spesifik dalam paket (kosong = semua soal aktif)
  totalSoal?: number;
  keterangan?: string;
}

export interface AppConfig {
  duration: number; // in minutes
  kkm: number; // 0 - 100
  questions: Question[];
  examToken: string; // Token Ujian saat ini
  updatedAt?: string; // Timestamp ISO update konfigurasi
  students: StudentUser[]; // Daftar user/siswa terdaftar
  teachers?: TeacherUser[]; // Daftar user/guru terdaftar
  admins?: AdminUser[]; // Daftar akun admin terdaftar
  mapel?: string; // e.g. 'Sosiologi'
  kodeGuru?: string; // e.g. 'GURU01' / 'G01' - Kode unik Guru Pengampu
  mapelTitle?: string; // e.g. 'Assessment TKA SMA'
  subTitle?: string; // e.g. 'Perubahan Sosial & Globalisasi'
  mapelList?: string[]; // Pilihan daftar mata pelajaran
  maxQuestionsToDisplay?: number; // Jumlah soal yang dikeluarkan/ditampilkan untuk ujian (0 = semua)
  maxAttempts?: number; // Batas maksimal percobaan ujian (default 1)
  randomizeQuestions?: boolean; // Acak urutan soal (default true)
  randomizeOptions?: boolean; // Acak urutan pilihan A, B, C, D, E (default true)
  kopSekolah?: KopSekolahConfig; // Pengaturan Kop Sekolah & Tanda Tangan Guru
  adminUsername?: string; // Username Admin Utama (default: 'admincbt')
  adminPassword?: string; // Password Admin Utama (default: 'JuniorCBT2026')
  driveUploadUrl?: string; // Link Google Drive untuk Upload Hasil Jawaban Siswa
  googleSheetsWebhookUrl?: string; // Web App URL Apps Script untuk Sinkronisasi Bank Soal ke Google Sheets
  youtubeGuideUrl?: string; // Link Video YouTube Panduan Guru (dikeloa Admin)
  customWarningAudioUrl?: string; // URL Audio MP3 Peringatan Kecurangan
  enableWarningAudio?: boolean; // Sakelar Suara Audio Peringatan (default true)
  examSchedule?: ExamScheduleConfig; // Detail Pengaturan Jadwal & Ketentuan Ujian
  scheduleTokens?: ExamScheduleToken[]; // Daftar Tabel Token & Jadwal Ujian Terstruktur per Paket
  broadcastAlert?: BroadcastAlert | null; // Pesan Peringatan Broadcast Proktor Real-time
  teacherConfigs?: Record<string, TeacherConfigOverride>; // Multi-Guru Isolated Config Overrides
}

export type ViewState = 'login' | 'admin' | 'pre-test' | 'test' | 'result' | 'review';

export interface StudentInfo {
  name: string;
  noPeserta: string;
  mapel: string;
  kodeGuru?: string;
  role?: 'student' | 'teacher';
  kelas?: string;
  kodeSoal?: string;
}

export interface StudentResult {
  id: string;
  studentInfo: StudentInfo;
  score: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  kkm: number;
  isPassed: boolean;
  answers: (string | null)[];
  warnings: number;
  submittedAt: string;
  durationSpentMinutes?: number;
  timeSpentSeconds?: number;
  questionSnapshots?: Question[];
  cheatingLogs?: CheatingLog[];
  ipAddress?: string;
  locationInfo?: string;
  deviceInfo?: string;
  userAgent?: string;
}

export interface EncryptedResultPayload {
  version: string;
  data: StudentResult;
  hash: string;
}
