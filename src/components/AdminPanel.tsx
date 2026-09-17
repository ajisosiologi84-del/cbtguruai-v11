import { RealTimeProgressModal } from './RealTimeProgressModal';
import React, { useState, useRef } from 'react';
import { AppConfig, Question, StudentResult, StudentUser, TeacherUser, AdminUser, KopSekolahConfig, TeacherConfigOverride } from '../types';
import { decryptResult, encryptAppBackup, decryptAppBackup } from '../utils/crypto';
import { formatQuestionText } from '../utils/questionFormatter';
import { generateResultsPdfReport, generateIndividualStudentPdf, generateItemAnalysisPdfReport, ItemAnalysisData, DistractorDetail, defaultKopSekolah, extractClassFromNoPeserta, extractKodeSoalFromStudentInfo, PaperSizeOption, PaperOrientationOption, PdfPaperSettings } from '../utils/pdfGenerator';
import { DownloadAnimationModal } from './DownloadAnimationModal';
import { ExportQuestionModal } from './ExportQuestionModal';
import { ExamCardPrintModal } from './ExamCardPrintModal';
import { ExcelGuideModal } from './ExcelGuideModal';
import { GoogleSheetsModal } from './GoogleSheetsModal';
import { JsonQuestionsModal } from './JsonQuestionsModal';
import { ExamTokenSchedulePanel } from './ExamTokenSchedulePanel';
import * as XLSX from 'xlsx';
import {
  saveStudentToFirebase,
  deleteStudentFromFirebase,
  deleteSelectedStudentsFromFirebase,
  saveAllStudentsToFirebase,
  saveTeacherToFirebase,
  deleteTeacherFromFirebase,
  deleteSelectedTeachersFromFirebase,
  saveAllTeachersToFirebase,
  saveAdminToFirebase,
  deleteAdminFromFirebase,
  deleteSelectedAdminsFromFirebase,
  saveAllAdminsToFirebase,
  isQuotaExceededStatus,
  resetQuotaExceededStatus,
} from '../lib/firebase';

import {
  Sliders,
  Database,
  FileSpreadsheet,
  Upload,
  Plus,
  LogOut,
  Edit3,
  Trash2,
  Info,
  Search,
  RotateCcw,
  Lock,
  FileCheck,
  CheckCircle,
  XCircle,
  Award,
  Users,
  Key,
  RefreshCw,
  Copy,
  Check,
  UserPlus,
  X,
  UserCheck,
  GraduationCap,
  Download,
  WifiOff,
  Menu,
  BookOpen,
  Sparkles,
  CheckSquare,
  Square,
  ListChecks,
  Shield,
  Eye,
  EyeOff,
  Image as ImageIcon,
  HelpCircle,
  Printer,
  FileJson,
  ShieldCheck,
  ShieldAlert,
  FolderArchive,
  FileText,
  Building2,
  BarChart2,
  PieChart,
  Crown,
  Trophy,
  Medal,
  Clock,
  Calendar,
  Globe,
  Monitor,
  Activity,
  Zap,
  Tag,
  Layers,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Compass,
  Youtube,
  Video,
  Play,
  ExternalLink,
  Megaphone,
  Send,
  Radio,
  Volume2,
  VolumeX,
  AlertOctagon,
} from 'lucide-react';

interface AdminPanelProps {
  config: AppConfig;
  studentResults: StudentResult[];
  adminRole?: 'admin' | 'teacher';
  loggedInTeacher?: TeacherUser | null;
  onSaveConfig: (newConfig: AppConfig) => void;
  onSaveStudentResults: (results: StudentResult[]) => void;
  onOpenQuestionModal: (question: Question | null) => void;
  onDeleteQuestion: (qId: number) => void;
  onResetDefaultQuestions: () => void;
  onLogout: () => void;
  showAlert: (msg: string) => void;
  showConfirm: (title: string, msg: string, onConfirm: () => void, isDanger?: boolean) => void;
}

/**
 * Helper function to parse YouTube URLs (watch, shorts, embed, youtu.be) and convert to embed iframe URL
 */
const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  studentResults,
  adminRole = 'admin',
  loggedInTeacher = null,
  onSaveConfig,
  onSaveStudentResults,
  onOpenQuestionModal,
  onDeleteQuestion,
  onResetDefaultQuestions,
  onLogout,
  showAlert,
  showConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'panduan' | 'bank' | 'rekap' | 'analisis' | 'students' | 'token' | 'mapel' | 'backup' | 'schedule'>('panduan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Leaderboard & Audit Modal State
  const [showLeaderboardPodium, setShowLeaderboardPodium] = useState(true);
  const [selectedAuditResult, setSelectedAuditResult] = useState<StudentResult | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isExamCardPrintModalOpen, setIsExamCardPrintModalOpen] = useState(false);

  // Download Animation Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadModalConfig, setDownloadModalConfig] = useState<{
    title: string;
    subtitle?: string;
    fileName: string;
    fileType: 'json' | 'cbt' | 'pdf' | 'xlsx';
    onCompleteAction: () => void;
  }>({
    title: '',
    fileName: '',
    fileType: 'json',
    onCompleteAction: () => {},
  });

  // Schedule & Exam Session Config State
  const [scheduleStartTime, setScheduleStartTime] = useState<string>(config.examSchedule?.startTime || '');
  const [scheduleEndTime, setScheduleEndTime] = useState<string>(config.examSchedule?.endTime || '');
  const [sessionStatus, setSessionStatus] = useState<'DRAFT' | 'ACTIVE' | 'CLOSED'>(config.examSchedule?.sessionStatus || 'ACTIVE');
  const [lateTolerance, setLateTolerance] = useState<number>(config.examSchedule?.lateToleranceMinutes || 15);
  const [allowReviewAfterFinish, setAllowReviewAfterFinish] = useState<boolean>(config.examSchedule?.allowReviewAfterFinish !== false);
  const [showScoreImmediately, setShowScoreImmediately] = useState<boolean>(config.examSchedule?.showScoreImmediately !== false);
  const [strictAntiCheating, setStrictAntiCheating] = useState<boolean>(config.examSchedule?.strictAntiCheating !== false);
  const [maxCheatingAllowed, setMaxCheatingAllowed] = useState<number>(config.examSchedule?.maxCheatingAllowed || 3);
  const [enableWarningAudio, setEnableWarningAudio] = useState<boolean>(config.enableWarningAudio !== false);
  const [customWarningAudioUrl, setCustomWarningAudioUrl] = useState<string>(config.customWarningAudioUrl || '');

  // Test Play Warning Audio MP3
  const handleTestWarningAudio = () => {
    try {
      const mp3Url = customWarningAudioUrl.trim() || '/warning-alarm.mp3';
      const audio = new Audio(mp3Url);
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          showAlert('Suara MP3 diblokir oleh browser atau URL tidak dapat diakses: ' + err.message);
        });
      }

      // Voice warning speech test
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Peringatan! Pelanggaran kecurangan ujian terdeteksi!');
        utterance.lang = 'id-ID';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }
      showAlert('🔊 Memutar Uji Coba Audio Peringatan Kecurangan MP3 & Suara Sirine...');
    } catch (e) {
      showAlert('Gagal memutar audio: ' + (e as Error).message);
    }
  };

  const handleFileUploadMP3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showAlert('Ukuran file audio MP3 terlalu besar! Maksimal 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomWarningAudioUrl(event.target.result as string);
        showAlert('File Audio MP3 Peringatan berhasil diunggah!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Broadcast Warning Proktor State (Point 2)
  const [broadcastTargetNis, setBroadcastTargetNis] = useState<string>('ALL');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');

  // Analisis Butir Soal Filter & Sort State
  const [analisisSearch, setAnalisisSearch] = useState('');
  const [analisisDifficultyFilter, setAnalisisDifficultyFilter] = useState<'ALL' | 'Mudah' | 'Sedang' | 'Sukar'>('ALL');
  const [analisisDiscriminationFilter, setAnalisisDiscriminationFilter] = useState<string>('ALL');
  const [analisisRecommendationFilter, setAnalisisRecommendationFilter] = useState<string>('ALL');
  const [analisisMapelFilter, setAnalisisMapelFilter] = useState<string>('ALL');
  const [analisisSortBy, setAnalisisSortBy] = useState<'number' | 'difficulty' | 'discrimination' | 'recommendation'>('number');
  const [selectedDetailItem, setSelectedDetailItem] = useState<ItemAnalysisData | null>(null);
  
  // General Config State
  const [durationInput, setDurationInput] = useState<number>(config.duration);
  const [kkmInput, setKkmInput] = useState<number>(config.kkm);
  const [maxQuestionsInput, setMaxQuestionsInput] = useState<number>(config.maxQuestionsToDisplay ?? 0);
  const [maxAttemptsInput, setMaxAttemptsInput] = useState<number>(config.maxAttempts ?? 1);
  const [randomizeQuestionsInput, setRandomizeQuestionsInput] = useState<boolean>(
    config.randomizeQuestions !== false
  );
  const [randomizeOptionsInput, setRandomizeOptionsInput] = useState<boolean>(
    config.randomizeOptions !== false
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [rekapSearch, setRekapSearch] = useState('');
  const [rekapKelasFilter, setRekapKelasFilter] = useState<string>('ALL');
  const [rekapKodeSoalFilter, setRekapKodeSoalFilter] = useState<string>('ALL');
  const [isQuotaWarningVisible, setIsQuotaWarningVisible] = useState<boolean>(() => isQuotaExceededStatus());

  React.useEffect(() => {
    const checkQuota = () => {
      setIsQuotaWarningVisible(isQuotaExceededStatus());
    };
    checkQuota();
    window.addEventListener('cbt_quota_exceeded', checkQuota);
    window.addEventListener('cbt_quota_reset', checkQuota);
    const interval = setInterval(checkQuota, 4000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cbt_quota_exceeded', checkQuota);
      window.removeEventListener('cbt_quota_reset', checkQuota);
    };
  }, []);

  // Mapel Config State
  const defaultMapelList = [
    'Sosiologi',
    'Geografi',
    'Ekonomi',
    'Sejarah',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Matematika',
    'PPKn',
    'Biologi',
    'Fisika',
    'Kimia',
  ];
  const [mapelInput, setMapelInput] = useState<string>(config.mapel || 'Sosiologi');
  const [kodeGuruInput, setKodeGuruInput] = useState<string>(config.kodeGuru || 'GURU01');
  const [mapelTitleInput, setMapelTitleInput] = useState<string>(
    config.mapelTitle || 'Assessment TKA SMA'
  );
  const [subTitleInput, setSubTitleInput] = useState<string>(
    config.subTitle || 'Perubahan Sosial & Globalisasi'
  );
  const [driveUploadUrlInput, setDriveUploadUrlInput] = useState<string>(
    config.driveUploadUrl || ''
  );
  const [youtubeGuideUrlInput, setYoutubeGuideUrlInput] = useState<string>(
    config.youtubeGuideUrl || ''
  );
  const [isEditingVideoUrl, setIsEditingVideoUrl] = useState<boolean>(false);
  const [mapelList, setMapelList] = useState<string[]>(
    config.mapelList && config.mapelList.length > 0 ? config.mapelList : defaultMapelList
  );
  const [customMapelToAdd, setCustomMapelToAdd] = useState('');

  // Multi-Guru Active Scope Filter State
  const [selectedGuruFilter, setSelectedGuruFilter] = useState<string>(
    loggedInTeacher?.kodeGuru || 'ALL'
  );

  // Question Selection & Batch State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [selectedBankMapel, setSelectedBankMapel] = useState<string>('ALL');
  const [selectedBankKompetensi, setSelectedBankKompetensi] = useState<string>('ALL');
  const [selectedBankBentukSoal, setSelectedBankBentukSoal] = useState<string>('ALL');
  const [selectedBankKodeGuru, setSelectedBankKodeGuru] = useState<string>('ALL');

  // Excel Template Upload Modal State
  const [isUploadMapelModalOpen, setIsUploadMapelModalOpen] = useState(false);
  const [uploadPendingQuestions, setUploadPendingQuestions] = useState<Question[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadTargetMapel, setUploadTargetMapel] = useState('Sosiologi');

  // Preview Question Modal State
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Token Management State
  const [currentToken, setCurrentToken] = useState<string>(config.examToken || 'SOS2026');
  const [isCopiedToken, setIsCopiedToken] = useState(false);

  // User Management State (Student, Teacher, Admin)
  const [userSubTab, setUserSubTab] = useState<'student' | 'teacher' | 'admin'>('student');
  const [studentSearch, setStudentSearch] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newNis, setNewNis] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('');
  const [newStudentKodeGuru, setNewStudentKodeGuru] = useState('');
  const [studentKodeGuruFilter, setStudentKodeGuruFilter] = useState<string>('ALL');
  const [rekapKodeGuruFilter, setRekapKodeGuruFilter] = useState<string>('ALL');

  // Export Question & Template Modal State
  const [isExportQuestionModalOpen, setIsExportQuestionModalOpen] = useState(false);
  const [isDownloadTemplateModalOpen, setIsDownloadTemplateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExcelGuideModalOpen, setIsExcelGuideModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isJsonQuestionsModalOpen, setIsJsonQuestionsModalOpen] = useState(false);


  const handleImportQuestionsFromJson = (importedQuestions: Question[], mode: 'merge' | 'replace') => {
    let finalQuestions: Question[] = [];
    if (mode === 'replace') {
      finalQuestions = importedQuestions.map((q, idx) => ({
        ...q,
        id: idx + 1,
      }));
    } else {
      const startId = config.questions.length > 0 ? Math.max(...config.questions.map((q) => q.id)) + 1 : 1;
      const remappedNew = importedQuestions.map((q, idx) => ({
        ...q,
        id: startId + idx,
      }));
      finalQuestions = [...config.questions, ...remappedNew];
    }

    onSaveConfig({
      ...config,
      questions: finalQuestions,
    });
    showAlert(`Berhasil mengimpor ${importedQuestions.length} butir soal format JSON (+ Gambar) ke Bank Soal! Total soal sekarang: ${finalQuestions.length}`);
  };

  // Student Results Selection State
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);

  // --- STUDENT RESULTS SELECTION & BULK DELETE HANDLERS ---
  const handleToggleSelectResultId = (id: string) => {
    if (selectedResultIds.includes(id)) {
      setSelectedResultIds(selectedResultIds.filter((rId) => rId !== id));
    } else {
      setSelectedResultIds([...selectedResultIds, id]);
    }
  };

  const handleSelectAllResults = (filteredResults: StudentResult[]) => {
    const filteredIds = filteredResults.map((r) => r.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedResultIds.includes(id));
    if (isAllSelected) {
      setSelectedResultIds(selectedResultIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedResultIds(Array.from(new Set([...selectedResultIds, ...filteredIds])));
    }
  };

  const handleDeleteSelectedStudentResults = () => {
    if (selectedResultIds.length === 0) {
      showAlert('Pilih/centang minimal 1 hasil ujian siswa yang akan dihapus!');
      return;
    }
    showConfirm(
      `Hapus ${selectedResultIds.length} Hasil Ujian Siswa Terpilih?`,
      `Apakah Anda yakin ingin menghapus ${selectedResultIds.length} rekap hasil ujian siswa yang dicentang? Data hasil ujian yang dihapus tidak dapat dikembalikan.`,
      () => {
        const updated = studentResults.filter((r) => !selectedResultIds.includes(r.id));
        onSaveStudentResults(updated);
        setSelectedResultIds([]);
        showAlert(`${selectedResultIds.length} rekap hasil ujian siswa berhasil dihapus!`);
      },
      true
    );
  };

  const handleDeleteAllStudentResults = () => {
    if (studentResults.length === 0) {
      showAlert('Belum ada rekap hasil ujian siswa untuk dihapus.');
      return;
    }
    showConfirm(
      `Hapus SELURUH (${studentResults.length}) Hasil Ujian Siswa?`,
      `PERINGATAN SANGAT PENTING! Anda akan menghapus SELURUH (${studentResults.length}) rekap hasil jawaban siswa dari sistem. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?`,
      () => {
        onSaveStudentResults([]);
        setSelectedResultIds([]);
        showAlert('Seluruh rekap hasil ujian siswa berhasil dihapus dari sistem.');
      },
      true
    );
  };
  const [studentSelectMode, setStudentSelectMode] = useState<'class' | 'individual'>('class');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Teacher Management State
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [newNip, setNewNip] = useState('');
  const [newTeacherNama, setNewTeacherNama] = useState('');
  const [newTeacherMapel, setNewTeacherMapel] = useState('');
  const [newTeacherKodeGuru, setNewTeacherKodeGuru] = useState('');

  // Admin Management State
  const [adminSearch, setAdminSearch] = useState('');
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminNama, setNewAdminNama] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'superadmin' | 'proktor' | 'admin'>('admin');
  const [showPasswordMap, setShowPasswordMap] = useState<{ [key: string]: boolean }>({});

  // Edit Student, Teacher & Admin Modals
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);

  // Kop Sekolah & Signature Modal State
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [kopForm, setKopForm] = useState<KopSekolahConfig>(() => ({
    ...defaultKopSekolah,
    ...(config.kopSekolah || {}),
  }));

  // PDF Paper Options Modal State
  const [isPdfPaperModalOpen, setIsPdfPaperModalOpen] = useState(false);
  const [pdfTargetAction, setPdfTargetAction] = useState<'REKAP_HASIL' | 'ANALISIS_SOAL' | 'INDIVIDUAL'>('REKAP_HASIL');
  const [selectedIndividualResult, setSelectedIndividualResult] = useState<StudentResult | null>(null);
  const [selectedPaperSize, setSelectedPaperSize] = useState<PaperSizeOption>('a4');
  const [selectedPaperOrientation, setSelectedPaperOrientation] = useState<PaperOrientationOption>('portrait');
  const [savePaperAsDefault, setSavePaperAsDefault] = useState(true);

  // Real-Time Progress Monitoring State
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressClassFilter, setProgressClassFilter] = useState<string>('ALL');
  const [progressStatusFilter, setProgressStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [progressSearch, setProgressSearch] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cbtFileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const logoPemdaInputRef = useRef<HTMLInputElement>(null);
  const logoSekolahInputRef = useRef<HTMLInputElement>(null);

  const studentsList: StudentUser[] = config.students || [];
  const teacherTargetKg = (loggedInTeacher?.kodeGuru || loggedInTeacher?.nip || 'GURU01').toUpperCase();
  const displayStudentsList: StudentUser[] = React.useMemo(() => {
    const all = config.students || [];
    if (loggedInTeacher || adminRole === 'teacher') {
      return all.filter((s) => (s.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase() === teacherTargetKg);
    }
    if (selectedGuruFilter && selectedGuruFilter !== 'ALL') {
      return all.filter((s) => (s.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase() === selectedGuruFilter.toUpperCase());
    }
    return all;
  }, [config.students, config.kodeGuru, loggedInTeacher, adminRole, teacherTargetKg, selectedGuruFilter]);

  React.useEffect(() => {
    if (loggedInTeacher || adminRole === 'teacher') {
      setUserSubTab('student');
    }
  }, [loggedInTeacher, adminRole]);
  const teachersList: TeacherUser[] = (config.teachers && config.teachers.length > 0)
    ? config.teachers
    : [
        { id: 't1', nip: '198501152010011002', nama: 'Drs. Aji Sosiologi, M.Pd', mapel: 'Sosiologi', kodeGuru: 'GURU01' },
        { id: 't2', nip: '198803122012022001', nama: 'Dra. Rini Wulandari, M.Si', mapel: 'Geografi', kodeGuru: 'GURU02' },
        { id: 't3', nip: '199005202015031003', nama: 'Budi Santoso, S.Pd', mapel: 'Ekonomi', kodeGuru: 'GURU03' },
      ];
  const adminsList: AdminUser[] = config.admins || [];

  const activeTeacherObj = React.useMemo(() => {
    if (loggedInTeacher) return loggedInTeacher;
    if (selectedGuruFilter && selectedGuruFilter !== 'ALL') {
      return (
        teachersList.find(
          (t) =>
            (t.kodeGuru && t.kodeGuru.toUpperCase() === selectedGuruFilter.toUpperCase()) ||
            t.nip === selectedGuruFilter
        ) || null
      );
    }
    return null;
  }, [loggedInTeacher, selectedGuruFilter, teachersList]);

  // Sync Multi-Guru Scope Filter to Sub-Tab Filters
  React.useEffect(() => {
    if (selectedGuruFilter) {
      setSelectedBankKodeGuru(selectedGuruFilter);
      setStudentKodeGuruFilter(selectedGuruFilter);
      setRekapKodeGuruFilter(selectedGuruFilter);
    }
  }, [selectedGuruFilter]);

  React.useEffect(() => {
    if (loggedInTeacher?.kodeGuru) {
      setSelectedGuruFilter(loggedInTeacher.kodeGuru);
      setSelectedBankKodeGuru(loggedInTeacher.kodeGuru);
      setStudentKodeGuruFilter(loggedInTeacher.kodeGuru);
      setRekapKodeGuruFilter(loggedInTeacher.kodeGuru);
    }
  }, [loggedInTeacher]);

  // Sync internal state with config prop and selected teacher override when config or selected filter changes
  React.useEffect(() => {
    const targetKg = selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (loggedInTeacher?.kodeGuru || null);
    const tConfig = targetKg && config.teacherConfigs?.[targetKg];

    if (tConfig) {
      if (tConfig.duration !== undefined) setDurationInput(tConfig.duration);
      if (tConfig.kkm !== undefined) setKkmInput(tConfig.kkm);
      if (tConfig.examToken !== undefined) setCurrentToken(tConfig.examToken);
      if (tConfig.maxQuestionsToDisplay !== undefined) setMaxQuestionsInput(tConfig.maxQuestionsToDisplay);
      if (tConfig.maxAttempts !== undefined) setMaxAttemptsInput(tConfig.maxAttempts);
      if (tConfig.randomizeQuestions !== undefined) setRandomizeQuestionsInput(tConfig.randomizeQuestions);
      if (tConfig.randomizeOptions !== undefined) setRandomizeOptionsInput(tConfig.randomizeOptions);
      if (tConfig.mapel !== undefined) setMapelInput(tConfig.mapel);
      if (tConfig.kopSekolah) setKopForm(tConfig.kopSekolah);
      if (tConfig.examSchedule) {
        if (tConfig.examSchedule.startTime !== undefined) setScheduleStartTime(tConfig.examSchedule.startTime || '');
        if (tConfig.examSchedule.endTime !== undefined) setScheduleEndTime(tConfig.examSchedule.endTime || '');
        if (tConfig.examSchedule.sessionStatus) setSessionStatus(tConfig.examSchedule.sessionStatus);
        if (tConfig.examSchedule.lateToleranceMinutes !== undefined) setLateTolerance(tConfig.examSchedule.lateToleranceMinutes);
        if (tConfig.examSchedule.allowReviewAfterFinish !== undefined) setAllowReviewAfterFinish(tConfig.examSchedule.allowReviewAfterFinish);
        if (tConfig.examSchedule.showScoreImmediately !== undefined) setShowScoreImmediately(tConfig.examSchedule.showScoreImmediately);
        if (tConfig.examSchedule.strictAntiCheating !== undefined) setStrictAntiCheating(tConfig.examSchedule.strictAntiCheating);
        if (tConfig.examSchedule.maxCheatingAllowed !== undefined) setMaxCheatingAllowed(tConfig.examSchedule.maxCheatingAllowed);
      }
    } else if (config) {
      if (config.examToken) setCurrentToken(config.examToken);
      if (config.duration) setDurationInput(config.duration);
      if (config.kkm !== undefined) setKkmInput(config.kkm);
      if (config.mapel) setMapelInput(config.mapel);
      if (config.kodeGuru) setKodeGuruInput(config.kodeGuru);
      if (config.mapelTitle) setMapelTitleInput(config.mapelTitle);
      if (config.subTitle) setSubTitleInput(config.subTitle);
      if (config.driveUploadUrl !== undefined) setDriveUploadUrlInput(config.driveUploadUrl || '');
      if (config.youtubeGuideUrl !== undefined) setYoutubeGuideUrlInput(config.youtubeGuideUrl || '');
      if (config.mapelList && config.mapelList.length > 0) setMapelList(config.mapelList);
      if (config.examSchedule) {
        setScheduleStartTime(config.examSchedule.startTime || '');
        setScheduleEndTime(config.examSchedule.endTime || '');
        setSessionStatus(config.examSchedule.sessionStatus || 'ACTIVE');
        setLateTolerance(config.examSchedule.lateToleranceMinutes || 15);
        setAllowReviewAfterFinish(config.examSchedule.allowReviewAfterFinish !== false);
        setShowScoreImmediately(config.examSchedule.showScoreImmediately !== false);
        setStrictAntiCheating(config.examSchedule.strictAntiCheating !== false);
        setMaxCheatingAllowed(config.examSchedule.maxCheatingAllowed || 3);
      }
    }
  }, [selectedGuruFilter, loggedInTeacher, config]);

  // --- BACKUP & RESTORE APP DATA HANDLERS ---
  const handleBackupAppData = () => {
    try {
      const activeToken = currentToken || config.examToken || 'SOS2026';
      const targetKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : null);

      let backupPayload: any;
      let filename: string;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');

      if (targetKg) {
        const teacherQuestions = config.questions.filter(
          (q) => (q.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase() === targetKg.toUpperCase()
        );
        const teacherResults = studentResults.filter(
          (r) => (r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase() === targetKg.toUpperCase()
        );
        const teacherStudents = (config.students || []).filter(
          (s) => (s.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase() === targetKg.toUpperCase()
        );
        const teacherConfigData = config.teacherConfigs?.[targetKg];

        backupPayload = {
          appName: 'CBT_GURUAI_TEACHER_BACKUP',
          version: '2.0',
          exportedAt: new Date().toISOString(),
          kodeGuru: targetKg,
          teacherInfo: activeTeacherObj,
          config: {
            ...config,
            examToken: activeToken,
            questions: teacherQuestions,
            students: teacherStudents,
            mapel: activeTeacherObj?.mapel || config.mapel,
            kodeGuru: targetKg,
            kopSekolah: teacherConfigData?.kopSekolah || config.kopSekolah,
            examSchedule: teacherConfigData?.examSchedule || config.examSchedule,
          },
          teacherConfigData,
          studentResults: teacherResults,
        };

        const mapelClean = (activeTeacherObj?.mapel || config.mapel || 'Mapel').replace(/[^a-zA-Z0-9]/g, '_');
        filename = `BACKUP_CBT_GURU_${targetKg}_${mapelClean}_${dateStr}_${timeStr}.json`;
      } else {
        backupPayload = {
          appName: 'CBT_GURUAI',
          version: '2.0',
          exportedAt: new Date().toISOString(),
          config: {
            ...config,
            examToken: activeToken,
          },
          studentResults,
        };
        filename = `BACKUP_SUPERADMIN_CBT_SEMUA_GURU_${dateStr}_${timeStr}.json`;
      }

      const encryptedContent = encryptAppBackup(backupPayload);
      const blob = new Blob([encryptedContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (targetKg) {
        showAlert(`Backup Data Terisolasi untuk Akun Guru "${activeTeacherObj?.nama || targetKg}" (${backupPayload.config.questions.length} Soal & ${backupPayload.studentResults.length} Rekap Nilai) Berhasil Diunduh!`);
      } else {
        showAlert('Backup Seluruh Data Sistem (Semua Akun Guru) berhasil dienkripsi dan diunduh! Simpan file terenkripsi (.json) ini di tempat aman.');
      }
    } catch (e) {
      console.error(e);
      showAlert('Gagal membuat file backup data terenkripsi!');
    }
  };

  const handleExportActivePaketJson = () => {
    try {
      const activeMapel = config.mapel || 'Sosiologi';
      const activeQuestions = config.questions.filter((q) => {
        const isThisMapel = q.mapel ? q.mapel === activeMapel : true;
        const isActive = q.isActive !== false;
        return isThisMapel && isActive;
      });

      const activeToken = currentToken || config.examToken || 'SOS2026';

      const packagePayload = {
        appName: 'CBT_GURUAI',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        config: {
          ...config,
          examToken: activeToken,
          mapel: activeMapel,
          questions: activeQuestions,
        },
        studentResults,
      };

      const encryptedContent = encryptAppBackup(packagePayload);
      const blob = new Blob([encryptedContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
      const mapelClean = activeMapel.replace(/[^a-zA-Z0-9]/g, '_');

      link.href = url;
      link.download = `PAKET_SOAL_${mapelClean}_${activeToken}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert(`Paket Soal Aktif "${activeMapel}" (${activeQuestions.length} Soal - Token Tersinkron: "${activeToken}") berhasil dieksport sebagai file JSON backup terenkripsi!`);
    } catch (e) {
      console.error(e);
      showAlert('Gagal membuat paket soal aktif!');
    }
  };

  const triggerExportActivePaketJsonWithAnimation = () => {
    const activeMapel = config.mapel || 'Sosiologi';
    const activeToken = currentToken || config.examToken || 'SOS2026';
    const mapelClean = activeMapel.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
    const fileName = `PAKET_SOAL_${mapelClean}_${activeToken}_${dateStr}_${timeStr}.json`;

    setDownloadModalConfig({
      title: 'Mengunduh Paket Soal Aktif',
      subtitle: `Mengenkripsi paket soal "${activeMapel}" & Token "${activeToken}"...`,
      fileName: fileName,
      fileType: 'json',
      onCompleteAction: handleExportActivePaketJson,
    });
    setIsDownloadModalOpen(true);
  };

  const triggerBackupAppDataWithAnimation = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
    const targetKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : null);
    const mapelClean = (activeTeacherObj?.mapel || config.mapel || 'Mapel').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = targetKg
      ? `BACKUP_CBT_GURU_${targetKg}_${mapelClean}_${dateStr}_${timeStr}.json`
      : `BACKUP_SUPERADMIN_CBT_SEMUA_GURU_${dateStr}_${timeStr}.json`;

    setDownloadModalConfig({
      title: targetKg ? `Mengunduh Backup Data Guru (${activeTeacherObj?.nama || targetKg})` : 'Mengunduh Backup Data Sistem',
      subtitle: targetKg ? `Mencadangkan bank soal, rekap nilai & jadwal khusus Akun Guru Kode "${targetKg}"...` : 'Mencadangkan seluruh bank soal, data user, dan token ujian...',
      fileName: fileName,
      fileType: 'json',
      onCompleteAction: handleBackupAppData,
    });
    setIsDownloadModalOpen(true);
  };

  const handleRestoreAppData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = decryptAppBackup(content);

        if (!parsed || typeof parsed !== 'object') {
          showAlert('Format file backup tidak terdekripsi dengan benar!');
          return;
        }

        const isTeacherBackup = parsed.appName === 'CBT_GURUAI_TEACHER_BACKUP' || !!parsed.kodeGuru;
        const restoredConfig = parsed.config || (parsed.questions ? parsed : null);

        if (!restoredConfig || !Array.isArray(restoredConfig.questions)) {
          showAlert('File backup tidak memiliki struktur data Bank Soal yang valid!');
          return;
        }

        if (isTeacherBackup) {
          const restoredKg = (parsed.kodeGuru || restoredConfig.kodeGuru || 'GURU01').toUpperCase();
          
          showConfirm(
            'Memulihkan Backup Data Spesifik Guru?',
            `File ini berisi data terenkripsi untuk Akun Guru Kode "${restoredKg}". Sistem akan memperbarui Bank Soal, Rekap Nilai, dan Jadwal Ujian khusus untuk Guru Kode "${restoredKg}" tanpa menghapus data guru lainnya. Lanjutkan?`,
            () => {
              // 1. Filter out existing questions for this teacher and add restored questions
              const otherQuestions = config.questions.filter(
                (q) => (q.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase() !== restoredKg
              );
              const newQuestions = restoredConfig.questions.map((q: any) => ({
                ...q,
                kodeGuru: restoredKg,
              }));
              const mergedQuestions = [...otherQuestions, ...newQuestions];

              // 2. Filter out existing results for this teacher and add restored results
              const otherResults = studentResults.filter(
                (r) => (r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase() !== restoredKg
              );
              const newResults = Array.isArray(parsed.studentResults)
                ? parsed.studentResults.map((r: any) => ({
                    ...r,
                    studentInfo: {
                      ...r.studentInfo,
                      kodeGuru: restoredKg,
                    },
                  }))
                : [];
              const mergedResults = [...otherResults, ...newResults];

              // 3. Update teacherConfigs
              const restoredTeacherConfigOverride: TeacherConfigOverride = {
                kodeGuru: restoredKg,
                mapel: restoredConfig.mapel,
                duration: restoredConfig.duration,
                kkm: restoredConfig.kkm,
                examToken: restoredConfig.examToken,
                kopSekolah: restoredConfig.kopSekolah,
                examSchedule: restoredConfig.examSchedule,
              };

              const updatedTeacherConfigs = {
                ...(config.teacherConfigs || {}),
                [restoredKg]: restoredTeacherConfigOverride,
              };

              onSaveConfig({
                ...config,
                questions: mergedQuestions,
                teacherConfigs: updatedTeacherConfigs,
              });
              onSaveStudentResults(mergedResults);
              showAlert(`Sukses! Data untuk Akun Guru Kode "${restoredKg}" (${newQuestions.length} Soal & ${newResults.length} Rekap Nilai) berhasil dipulihkan!`);
            }
          );
        } else {
          // Full Superadmin Restore
          const restoredExamToken = restoredConfig.examToken || config.examToken || 'SOS2026';
          const finalRestoredConfig = {
            ...restoredConfig,
            examToken: restoredExamToken,
          };

          showConfirm(
            'Memulihkan Seluruh Data Sistem (Semua Akun Guru)?',
            `Apakah Anda yakin ingin memulihkan (restore) seluruh data aplikasi dari file backup terenkripsi ini? Seluruh bank soal, data user, dan token ujian ("${restoredExamToken}") akan disinkronkan.`,
            () => {
              onSaveConfig(finalRestoredConfig);
              setCurrentToken(restoredExamToken);
              if (Array.isArray(parsed.studentResults)) {
                onSaveStudentResults(parsed.studentResults);
              }
              showAlert(`Sukses! Seluruh data aplikasi & paket soal dengan Token "${restoredExamToken}" berhasil dipulihkan dari file backup terenkripsi.`);
            },
            true
          );
        }
      } catch (err: any) {
        console.error(err);
        showAlert(err.message || 'Gagal membaca/mendekripsi file backup! Pastikan file adalah backup terenkripsi resmi CBT GURUAI.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOpenPdfPaperModal = (
    action: 'REKAP_HASIL' | 'ANALISIS_SOAL' | 'INDIVIDUAL',
    individualResult?: StudentResult
  ) => {
    if (action === 'REKAP_HASIL' && filteredStudentResults.length === 0) {
      showAlert('Belum ada data rekap nilai siswa yang sesuai dengan filter saat ini!');
      return;
    }
    if (action === 'ANALISIS_SOAL' && rawItemAnalysisList.length === 0) {
      showAlert('Belum ada data analisis butir soal.');
      return;
    }

    const currentKop = config.kopSekolah || defaultKopSekolah;
    setPdfTargetAction(action);
    if (individualResult) {
      setSelectedIndividualResult(individualResult);
    }

    setSelectedPaperSize(currentKop.paperSize || 'a4');
    if (action === 'ANALISIS_SOAL') {
      setSelectedPaperOrientation('landscape');
    } else {
      setSelectedPaperOrientation(currentKop.orientation || 'portrait');
    }

    setIsPdfPaperModalOpen(true);
  };

  const handleConfirmExecutePdfDownload = () => {
    const currentKop = config.kopSekolah || defaultKopSekolah;
    const paperSettings: PdfPaperSettings = {
      paperSize: selectedPaperSize,
      orientation: selectedPaperOrientation,
    };

    if (savePaperAsDefault) {
      const targetKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'));
      const existingTConfig = config.teacherConfigs?.[targetKg] || { kodeGuru: targetKg };
      const updatedKop: KopSekolahConfig = {
        ...currentKop,
        paperSize: selectedPaperSize,
        orientation: selectedPaperOrientation,
      };

      const updatedTConfig: TeacherConfigOverride = {
        ...existingTConfig,
        kopSekolah: updatedKop,
      };

      const updatedTeacherConfigs = {
        ...(config.teacherConfigs || {}),
        [targetKg]: updatedTConfig,
      };

      const newConfig: AppConfig = {
        ...config,
        kopSekolah: updatedKop,
        teacherConfigs: updatedTeacherConfigs,
      };
      onSaveConfig(newConfig);
    }

    if (pdfTargetAction === 'REKAP_HASIL') {
      generateResultsPdfReport(
        filteredStudentResults,
        {
          ...currentKop,
          paperSize: selectedPaperSize,
          orientation: selectedPaperOrientation,
        },
        {
          mapel: config.mapel || 'Sosiologi',
          mapelTitle: config.mapelTitle || 'Assessment TKA SMA',
          kkm: config.kkm,
          totalQuestions: config.questions.length,
          kelasFilter: rekapKelasFilter,
          kodeSoalFilter: rekapKodeSoalFilter,
          paperSettings,
        }
      );
    } else if (pdfTargetAction === 'ANALISIS_SOAL') {
      generateItemAnalysisPdfReport(
        rawItemAnalysisList,
        {
          ...currentKop,
          paperSize: selectedPaperSize,
          orientation: selectedPaperOrientation,
        },
        {
          mapel: analisisMapelFilter !== 'ALL' ? analisisMapelFilter : (config.mapel || 'Sosiologi'),
          mapelTitle: config.mapelTitle || 'Assessment TKA SMA',
          totalQuestions: rawItemAnalysisList.length,
          totalRespondents: studentResults.length,
          meanDifficulty: testOverallStats.meanP,
          meanDiscrimination: testOverallStats.meanD,
          reliabilityKr20: testOverallStats.kr20,
          paperSettings,
        }
      );
    } else if (pdfTargetAction === 'INDIVIDUAL' && selectedIndividualResult) {
      generateIndividualStudentPdf(
        selectedIndividualResult,
        {
          ...currentKop,
          paperSize: selectedPaperSize,
          orientation: selectedPaperOrientation,
        },
        config.questions,
        paperSettings
      );
    }

    setIsPdfPaperModalOpen(false);
  };

  const handleOpenKopModal = () => {
    const targetKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'));
    const activeTeacher = teachersList.find((t) => (t.kodeGuru || t.nip).toUpperCase() === targetKg.toUpperCase());
    const tConfig = config.teacherConfigs?.[targetKg];

    const currentKop = tConfig?.kopSekolah || config.kopSekolah || defaultKopSekolah;

    setKopForm({
      ...defaultKopSekolah,
      ...currentKop,
      namaGuru: currentKop.namaGuru || activeTeacher?.nama || defaultKopSekolah.namaGuru,
      nipGuru: currentKop.nipGuru || activeTeacher?.nip || defaultKopSekolah.nipGuru,
    });
    setIsKopModalOpen(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'pemda' | 'sekolah') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert('Ukuran file logo terlalu besar! Maksimal 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (target === 'pemda') {
        setKopForm((prev) => ({ ...prev, logoPemda: base64 }));
      } else {
        setKopForm((prev) => ({ ...prev, logoSekolah: base64 }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveKopSekolah = (e: React.FormEvent) => {
    e.preventDefault();
    const targetKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'));
    const existingTConfig = config.teacherConfigs?.[targetKg] || { kodeGuru: targetKg };
    
    const updatedTConfig: TeacherConfigOverride = {
      ...existingTConfig,
      kopSekolah: kopForm,
    };

    onSaveConfig({
      ...config,
      kopSekolah: kopForm,
      teacherConfigs: {
        ...(config.teacherConfigs || {}),
        [targetKg]: updatedTConfig,
      },
    });
    setIsKopModalOpen(false);
    showAlert('Pengaturan Kop Sekolah & Tanda Tangan Guru berhasil disimpan!');
  };

  // General & Schedule Settings Handler
  const handleSaveGeneralConfig = () => {
    if (durationInput > 0 && kkmInput >= 0 && kkmInput <= 100) {
      const targetKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'));
      const existingTConfig = config.teacherConfigs?.[targetKg] || { kodeGuru: targetKg };

      const updatedTConfig: TeacherConfigOverride = {
        ...existingTConfig,
        duration: durationInput,
        kkm: kkmInput,
        maxQuestionsToDisplay: Math.max(0, maxQuestionsInput),
        maxAttempts: Math.max(1, maxAttemptsInput),
        randomizeQuestions: randomizeQuestionsInput,
        randomizeOptions: randomizeOptionsInput,
      };

      onSaveConfig({
        ...config,
        duration: durationInput,
        kkm: kkmInput,
        maxQuestionsToDisplay: Math.max(0, maxQuestionsInput),
        maxAttempts: Math.max(1, maxAttemptsInput),
        randomizeQuestions: randomizeQuestionsInput,
        randomizeOptions: randomizeOptionsInput,
        teacherConfigs: {
          ...(config.teacherConfigs || {}),
          [targetKg]: updatedTConfig,
        },
      });
      showAlert(`Pengaturan umum ujian untuk Akun Guru Kode "${targetKg}" berhasil disimpan!`);
    } else {
      showAlert('Nilai durasi atau KKM tidak valid!');
    }
  };

  // Combined Schedule & General Exam Settings Handler
  const handleSaveExamSchedule = () => {
    if (durationInput <= 0 || kkmInput < 0 || kkmInput > 100) {
      showAlert('Nilai Durasi atau KKM tidak valid!');
      return;
    }

    const targetKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'));
    const activeTeacher = teachersList.find((t) => (t.kodeGuru || t.nip).toUpperCase() === targetKg.toUpperCase());

    const updatedTeacherConfig: TeacherConfigOverride = {
      kodeGuru: targetKg,
      mapel: mapelInput || activeTeacher?.mapel || 'Sosiologi',
      duration: durationInput,
      kkm: kkmInput,
      examToken: currentToken,
      randomizeQuestions: randomizeQuestionsInput,
      randomizeOptions: randomizeOptionsInput,
      maxQuestionsToDisplay: Math.max(0, maxQuestionsInput),
      maxAttempts: Math.max(1, maxAttemptsInput),
      kopSekolah: kopForm,
      examSchedule: {
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        sessionStatus,
        lateToleranceMinutes: lateTolerance,
        allowReviewAfterFinish,
        showScoreImmediately,
        strictAntiCheating,
        maxCheatingAllowed,
      },
    };

    const updatedTeacherConfigs = {
      ...(config.teacherConfigs || {}),
      [targetKg]: updatedTeacherConfig,
    };

    onSaveConfig({
      ...config,
      duration: durationInput,
      kkm: kkmInput,
      examToken: currentToken,
      maxQuestionsToDisplay: Math.max(0, maxQuestionsInput),
      maxAttempts: Math.max(1, maxAttemptsInput),
      randomizeQuestions: randomizeQuestionsInput,
      randomizeOptions: randomizeOptionsInput,
      enableWarningAudio,
      customWarningAudioUrl: customWarningAudioUrl.trim() || undefined,
      examSchedule: updatedTeacherConfig.examSchedule,
      teacherConfigs: updatedTeacherConfigs,
    });
    showAlert(`Semua Pengaturan Jadwal, Durasi, KKM, Token & Ketentuan Ujian untuk Akun Guru "${activeTeacher?.nama || targetKg}" Berhasil Disimpan!`);
  };

  // Real-time Broadcast Warning Handler (Point 2)
  const handleSendBroadcastWarning = (customMsg?: string) => {
    const msg = customMsg || broadcastMessage.trim();
    if (!msg) {
      showAlert('Silakan tulis atau pilih pesan peringatan yang ingin dikirimkan ke peserta!');
      return;
    }

    const targetStudentName =
      broadcastTargetNis === 'ALL'
        ? 'Semua Peserta Ujian'
        : config.students.find((s) => s.nis === broadcastTargetNis)?.nama || broadcastTargetNis;

    const newAlert = {
      id: Date.now().toString(),
      message: msg,
      targetStudentNis: broadcastTargetNis,
      targetStudentName,
      sender: 'Proktor Ujian',
      createdAt: new Date().toLocaleTimeString('id-ID'),
      type: 'warning' as const,
    };

    const updatedConfig: AppConfig = {
      ...config,
      broadcastAlert: newAlert,
      updatedAt: new Date().toISOString(),
    };

    onSaveConfig(updatedConfig);
    setBroadcastMessage('');
    showAlert(`📢 Pesan peringatan real-time berhasil dikirim ke: ${targetStudentName}!`);
  };

  // Real-time Force Stop Whole Exam Handler (Point 1 - Opsi A)
  const handleForceStopExamRealtime = () => {
    showConfirm(
      '🚨 HENTIKAN SELURUH UJIAN SEKARANG (FORCE STOP)',
      'Apakah Anda YAKIN ingin MENGHENTIKAN PAKSA seluruh ujian online peserta yang sedang berlangsung secara real-time?\n\nStatus sesi akan diubah menjadi CLOSED dan seluruh jawaban siswa yang sedang dikerjakan akan langsung ter-submit otomatis!',
      () => {
        setSessionStatus('CLOSED');
        const updatedConfig: AppConfig = {
          ...config,
          examSchedule: {
            ...config.examSchedule,
            startTime: scheduleStartTime,
            endTime: scheduleEndTime,
            sessionStatus: 'CLOSED',
            lateToleranceMinutes: lateTolerance,
            allowReviewAfterFinish,
            showScoreImmediately,
            strictAntiCheating,
            maxCheatingAllowed,
          },
          broadcastAlert: {
            id: Date.now().toString(),
            message: '🚨 PEMBERITAHUAN PENGAWAS: Seluruh sesi ujian telah resmi DIHENTIKAN oleh Proktor. Seluruh jawaban Anda telah tersimpan secara otomatis.',
            targetStudentNis: 'ALL',
            sender: 'Proktor Ujian (Sistem)',
            createdAt: new Date().toLocaleTimeString('id-ID'),
            type: 'urgent',
          },
          updatedAt: new Date().toISOString(),
        };

        onSaveConfig(updatedConfig);
        showAlert('🚨 Ujian berhasil dihentikan paksa secara real-time! Sesi diubah ke CLOSED.');
      },
      true
    );
  };

  // Mapel Handlers
  const handleSaveMapelConfig = () => {
    const trimmedMapel = mapelInput.trim();
    if (!trimmedMapel) {
      showAlert('Nama mata pelajaran tidak boleh kosong!');
      return;
    }
    const finalTitle = mapelTitleInput.trim() || `Assessment TKA ${trimmedMapel} SMA`;
    const finalSubTitle = subTitleInput.trim() || 'Materi Ujian Assessment TKA';

    let updatedList = [...mapelList];
    if (!updatedList.includes(trimmedMapel)) {
      updatedList.push(trimmedMapel);
      setMapelList(updatedList);
    }

    onSaveConfig({
      ...config,
      mapel: trimmedMapel,
      mapelTitle: finalTitle,
      subTitle: finalSubTitle,
      kodeGuru: kodeGuruInput.trim().toUpperCase() || 'GURU01',
      driveUploadUrl: driveUploadUrlInput.trim(),
      youtubeGuideUrl: youtubeGuideUrlInput.trim(),
      mapelList: updatedList,
    });
    showAlert(`Pengaturan Mata Pelajaran "${trimmedMapel}" berhasil disimpan!`);
  };

  const handleSaveYoutubeGuideUrl = () => {
    const trimmed = youtubeGuideUrlInput.trim();
    onSaveConfig({
      ...config,
      youtubeGuideUrl: trimmed,
    });
    setIsEditingVideoUrl(false);
    if (trimmed) {
      showAlert('Link Video Panduan Guru (YouTube) berhasil disimpan!');
    } else {
      showAlert('Link Video Panduan Guru berhasil dikosongkan.');
    }
  };

  const handleAddCustomMapel = () => {
    const trimmed = customMapelToAdd.trim();
    if (!trimmed) return;
    if (mapelList.includes(trimmed)) {
      showAlert(`Mata Pelajaran "${trimmed}" sudah ada di dalam daftar!`);
      return;
    }
    const updatedList = [...mapelList, trimmed];
    setMapelList(updatedList);
    setMapelInput(trimmed);
    setMapelTitleInput(`Assessment TKA ${trimmed} SMA`);
    setCustomMapelToAdd('');
    onSaveConfig({
      ...config,
      mapel: trimmed,
      mapelTitle: `Assessment TKA ${trimmed} SMA`,
      mapelList: updatedList,
    });
    showAlert(`Mata pelajaran "${trimmed}" berhasil ditambahkan dan dipilih!`);
  };

  const handleDeleteMapelFromList = (subjectName: string) => {
    if (mapelList.length <= 1) {
      showAlert('Minimal harus ada 1 mata pelajaran dalam daftar!');
      return;
    }
    const updatedList = mapelList.filter((m) => m !== subjectName);
    setMapelList(updatedList);
    let nextMapel = mapelInput;
    let nextTitle = mapelTitleInput;
    if (mapelInput === subjectName) {
      nextMapel = updatedList[0];
      nextTitle = `Assessment TKA ${updatedList[0]} SMA`;
      setMapelInput(nextMapel);
      setMapelTitleInput(nextTitle);
    }
    onSaveConfig({
      ...config,
      mapel: nextMapel,
      mapelTitle: nextTitle,
      mapelList: updatedList,
    });
    showAlert(`Mata Pelajaran "${subjectName}" dihapus dari daftar.`);
  };

  // --- QUESTION BANK HANDLERS ---
  const handleDeleteAllQuestions = () => {
    if (config.questions.length === 0) {
      showAlert('Bank Soal sudah kosong!');
      return;
    }
    showConfirm(
      'Hapus SEMUA Soal?',
      `Apakah Anda yakin ingin menghapus SELURUH (${config.questions.length}) soal di Bank Soal? Tindakan ini tidak dapat dibatalkan.`,
      () => {
        onSaveConfig({ ...config, questions: [] });
        setSelectedQuestionIds([]);
        showAlert('Seluruh soal berhasil dihapus dari Bank Soal.');
      },
      true
    );
  };

  const handleToggleQuestionActive = (qId: number) => {
    const updated = config.questions.map((q) => {
      if (q.id === qId) {
        return { ...q, isActive: q.isActive === false ? true : false };
      }
      return q;
    });
    onSaveConfig({ ...config, questions: updated });
  };

  const handleToggleSelectQuestion = (qId: number) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredQuestions.map((q) => q.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedQuestionIds.includes(id));
    if (isAllSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedQuestionIds(Array.from(new Set([...selectedQuestionIds, ...filteredIds])));
    }
  };

  const handleBatchSetActive = (active: boolean) => {
    if (selectedQuestionIds.length === 0) {
      showAlert('Pilih/centang minimal 1 soal terlebih dahulu!');
      return;
    }
    const updated = config.questions.map((q) => {
      if (selectedQuestionIds.includes(q.id)) {
        return { ...q, isActive: active };
      }
      return q;
    });
    onSaveConfig({ ...config, questions: updated });
    showAlert(`${selectedQuestionIds.length} soal berhasil di-${active ? 'aktifkan (digunakan)' : 'nonaktifkan'}.`);
  };

  const handleBatchSetPoin = () => {
    if (selectedQuestionIds.length === 0) {
      showAlert('Pilih/centang minimal 1 soal terlebih dahulu!');
      return;
    }
    const targetPointsStr = prompt(`Masukkan bobot poin untuk ${selectedQuestionIds.length} soal terpilih (misal: 10, 20, 25):`, '10');
    if (targetPointsStr === null) return;
    const pts = Number(targetPointsStr);
    if (isNaN(pts) || pts <= 0) {
      showAlert('Masukkan angka bobot poin yang valid (> 0)!');
      return;
    }
    const updated = config.questions.map((q) => {
      if (selectedQuestionIds.includes(q.id)) {
        return { ...q, poin: pts };
      }
      return q;
    });
    onSaveConfig({ ...config, questions: updated });
    showAlert(`Bobot poin untuk ${selectedQuestionIds.length} soal terpilih berhasil diubah menjadi ${pts} Poin.`);
  };

  const handleBatchDeleteQuestions = () => {
    if (selectedQuestionIds.length === 0) {
      showAlert('Pilih/centang minimal 1 soal yang ingin dihapus!');
      return;
    }
    showConfirm(
      `Hapus ${selectedQuestionIds.length} Soal Terpilih?`,
      `Apakah Anda yakin ingin menghapus ${selectedQuestionIds.length} soal yang dicentang dari Bank Soal?`,
      () => {
        const updated = config.questions.filter((q) => !selectedQuestionIds.includes(q.id));
        onSaveConfig({ ...config, questions: updated });
        setSelectedQuestionIds([]);
        showAlert(`${selectedQuestionIds.length} soal terpilih berhasil dihapus.`);
      },
      true
    );
  };

  // 1. Download Template PG Sederhana
  const handleDownloadTemplatePG = () => {
    const currentMapel = selectedBankMapel !== 'ALL' ? selectedBankMapel : mapelInput || config.mapel || 'Sosiologi';
    const ws_data = [
      [
        'Pertanyaan',
        'Opsi_A',
        'Opsi_B',
        'Opsi_C',
        'Opsi_D',
        'Opsi_E',
        'Kunci_Jawaban',
        'Pembahasan',
        'Mapel',
        'Kompetensi',
        'Bentuk_Soal',
        'Gambar',
      ],
      [
        `Perubahan sosial di masyarakat dipengaruhi oleh faktor...`,
        'Globalisasi dan modernisasi',
        'Tradisi lama yang sangat tertutup',
        'Isolasi geografis wilayah',
        'Stagnasi perkembangan budaya',
        'Regresi teknologi dan ekonomi',
        'A',
        'Pembahasan: Globalisasi dan modernisasi merupakan pendorong utama perubahan sosial dalam masyarakat.',
        currentMapel,
        '3.1 Perubahan Sosial',
        'Pilihan Ganda',
        '',
      ],
      [
        `Masuknya budaya asing yang diterima tanpa menghilangkan kebudayaan asli disebut...`,
        'Asimilasi',
        'Akulturasi',
        'Difusi',
        'Amalgamasi',
        'Inovasi',
        'B',
        'Pembahasan: Akulturasi adalah percampuran dua budaya di mana unsur budaya asli masih tetap dipertahankan.',
        currentMapel,
        '3.2 Globalisasi & Glokalisasi',
        'Pilihan Ganda',
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
      { wch: 45 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_PG');
    const cleanMapel = currentMapel.trim().replace(/\s+/g, '_').toUpperCase();
    XLSX.writeFile(wb, `TEMPLATE_SOAL_PG_SEDERHANA_${cleanMapel}.xlsx`);
  };

  // 2. Download Template PG Kompleks MCMA
  const handleDownloadTemplateMCMA = () => {
    const currentMapel = selectedBankMapel !== 'ALL' ? selectedBankMapel : mapelInput || config.mapel || 'Sosiologi';
    const ws_data = [
      [
        'Pertanyaan',
        'Opsi_A',
        'Opsi_B',
        'Opsi_C',
        'Opsi_D',
        'Opsi_E',
        'Kunci_Jawaban',
        'Pembahasan',
        'Mapel',
        'Kompetensi',
        'Bentuk_Soal',
        'Gambar',
      ],
      [
        `Faktor internal penyebab perubahan sosial antara lain... (Pilih lebih dari satu jawaban benar)`,
        'Penemuan teknologi baru (Inovasi)',
        'Bencana alam gunung meletus',
        'Konflik pertentangan dalam masyarakat',
        'Pengaruh kebudayaan masyarakat lain',
        'Pemberontakan atau revolusi sosial',
        'A,C,E',
        'Pembahasan: Faktor internal perubahan sosial meliputi penemuan baru (inovasi), konflik sosial, dan revolusi.',
        currentMapel,
        '3.1 Perubahan Sosial',
        'Pilihan Ganda Kompleks MCMA',
        '',
      ],
      [
        `Dampak positif dari modernisasi ekonomi di era digital antara lain... (Pilih lebih dari satu)`,
        'Meningkatnya efisiensi transaksi jual beli online',
        'Meningkatnya kesenjangan sosial antar wilayah',
        'Terbukanya peluang pasar ekspor UMKM secara global',
        'Lunturnya rasa solidaritas gotong royong',
        'Meningkatnya ragam lapangan pekerjaan di bidang teknologi',
        'A,C,E',
        'Pembahasan: Transaksi online, ekspor UMKM, dan pekerjaan teknologi merupakan dampak positif modernisasi ekonomi.',
        currentMapel,
        '3.2 Modernisasi & Digitalisasi',
        'Pilihan Ganda Kompleks MCMA',
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
      { wch: 45 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
      { wch: 18 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 28 }, { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_MCMA');
    const cleanMapel = currentMapel.trim().replace(/\s+/g, '_').toUpperCase();
    XLSX.writeFile(wb, `TEMPLATE_SOAL_PG_KOMPLEKS_MCMA_${cleanMapel}.xlsx`);
  };

  // 3. Download Template PG Kompleks Kategori (Sesuai Format Template Guru / Excel Image)
  const handleDownloadTemplateKategori = () => {
    const currentMapel = selectedBankMapel !== 'ALL' ? selectedBankMapel : mapelInput || config.mapel || 'Sosiologi';
    const ws_data = [
      [
        'No Soal',
        'Kompetensi',
        'Bentuk Soal',
        'Soal (Stimulus + Pertanyaan)',
        'Opsi_A / Pernyataan_1',
        'Opsi_B / Pernyataan_2',
        'Opsi_C / Pernyataan_3',
        'Opsi_D / Pernyataan_4',
        'Opsi_E',
        'Kunci Jawaban',
        'Pembahasan',
      ],
      [
        1,
        'Menganalisis fenomena sosial yang dipengaruhi globalisasi secara kritis',
        'Pilihan Ganda Kompleks Kategori',
        `Sebuah desa yang dikenal dengan kerajinan kain tenun tradisional menghadapi ancaman penurunan pendapatan karena masuknya produk pakaian cepat saji (fast fashion) dari luar negeri yang jauh lebih murah. Merespons kondisi ini, kelompok pemuda desa menginisiasi sebuah gerakan inovatif. Mereka mendesain ulang potongan kain tenun menjadi pakaian siap pakai bergaya kontemporer dan memasarkannya secara global melalui platform media sosial, namun tetap mempertahankan teknik pewarnaan alam dan penenunan manual warisan leluhur. Berikan respon/pilihan Anda pada masing-masing pernyataan berikut dengan memilih kategori Sesuai atau Tidak Sesuai berdasarkan konsep sikap...`,
        'A. Gerakan pemuda tersebut merupakan wujud sikap kritis dengan menjadikan kearifan lokal sebagai komoditas adaptif di era global.',
        'B. Memasarkan kain tenun melalui media sosial secara global menandakan hilangnya identitas budaya asli masyarakat desa.',
        'C. Inovasi potongan pakaian modern pada kain tenun menunjukkan adanya proses glokalisasi untuk bertahan di pasar internasional.',
        'D. Langkah pemuda desa tersebut mencerminkan sikap anti-globalisasi yang berlebihan dalam melindungi tradisi lokal.',
        '-',
        'Pernyataan 1: Sesuai\nPernyataan 2: Tidak Sesuai\nPernyataan 3: Sesuai\nPernyataan 4: Tidak Sesuai',
        '1. Pernyataan A Sesuai. Pemuda desa tidak menolak globalisasi melainkan beradaptasi dengan memanfaatkan kearifan lokal agar tetap bernilai ekonomi tinggi di era global.\n2. Pernyataan B Tidak Sesuai. Memasarkan via media sosial justru merupakan bentuk pemanfaatan teknologi komunikasi untuk memperluas jangkauan budaya.\n3. Pernyataan C Sesuai. Glokalisasi adalah perpaduan unsur global dengan unsur lokal.\n4. Pernyataan D Tidak Sesuai. Sikap mereka sama sekali tidak anti-globalisasi.',
      ],
      [
        2,
        'Menganalisis fenomena sosial yang dipengaruhi globalisasi secara kritis',
        'Pilihan Ganda Kompleks Kategori',
        `Dominasi pasar ritel modern dan platform e-commerce raksasa sering kali meminggirkan keberadaan pedagang pasar tradisional. Menghadapi tantangan ini, sebuah koperasi swadaya di tingkat kecamatan menginisiasi program 'Pasar Rakyat Digital'. Koperasi mengumpulkan dana secara gotong royong untuk memberikan pelatihan kepada para pedagang tradisional mengenai standar pengemasan higienis, manajemen keuangan digital, dan pemasaran daring. Program ini bertujuan agar pedagang kecil dapat bersaing tanpa harus meninggalkan kebiasaan tawar-menawar yang menjadi ciri khas interaksi sosial mereka. Berikan respon/pilihan Anda pada masing-masing pernyataan berikut dengan memilih kategori Tepat atau Tidak Tepat...`,
        'A. Program pelatihan digitalisasi pasar tradisional merupakan bentuk pemberdayaan komunitas yang memanfaatkan modal sosial komunal.',
        'B. Respons koperasi tersebut mengindikasikan ketertundukan mutlak ekonomi lokal terhadap hegemoni kapitalisme pasar global.',
        'C. Peningkatan kualitas pengemasan dan pemasaran daring bertujuan untuk meningkatkan daya saing ekonomi lokal di tengah arus modernisasi.',
        'D. Koperasi bertindak sebagai agen perubahan yang memutus secara total hubungan pasar tradisional dengan mekanisme pasar modern.',
        '-',
        'Pernyataan 1: Tepat\nPernyataan 2: Tidak Tepat\nPernyataan 3: Tepat\nPernyataan 4: Tidak Tepat',
        '1. Pernyataan A Tepat. Dana yang dikumpulkan secara gotong royong merupakan wujud dari modal sosial (social capital).\n2. Pernyataan B Tidak Tepat. Inisiatif tersebut justru merupakan bentuk resistensi dan adaptasi agar ekonomi lokal tidak tunduk.\n3. Pernyataan C Tepat. Peningkatan kapasitas melalui pelatihan pengemasan dan pemasaran adalah strategi logis.\n4. Pernyataan D Tidak Tepat. Koperasi tidak memutus hubungan dengan pasar modern.',
      ],
      [
        3,
        'Menganalisis fenomena sosial yang dipengaruhi globalisasi secara kritis',
        'Pilihan Ganda Kompleks Kategori',
        `Gaya hidup konsumerisme masyarakat modern dan budaya makanan cepat saji berbasis kemasan plastik sekali pakai telah memicu krisis timbulan sampah di kawasan pesisir. Menyikapi ancaman kerusakan ekologis ini, sebuah lembaga swadaya masyarakat lokal meluncurkan kampanye 'Pesisir Bebas Plastik' yang berakar pada filosofi tradisional keharmonisan hubungan antara manusia dan alam. Mereka juga memberdayakan kelompok perempuan pesisir untuk memproduksi tas belanja ramah lingkungan dari anyaman serat daun pandan untuk menggantikan kantong plastik. Berikan respon/pilihan Anda pada masing-masing pernyataan berikut dengan memilih kategori Benar atau Salah terkait respons masyarakat terhadap dampak ekologis globalisasi!`,
        'A. Pemanfaatan filosofi tradisional menunjukkan fungsi kearifan lokal sebagai filter penangkal dampak negatif globalisasi ekologis.',
        'B. Pemberdayaan perempuan pesisir dalam memproduksi tas serat alam adalah contoh nyata dari bentuk adaptasi pasif terhadap krisis iklim global.',
        'C. Kampanye kawasan bebas plastik tersebut merupakan bentuk resistensi kritis masyarakat terhadap gaya hidup konsumerisme yang tidak berkelanjutan.',
        'D. Masalah penumpukan sampah plastik di pesisir membuktikan bahwa arus globalisasi senantiasa membawa kemajuan teknologi yang ramah lingkungan.',
        '-',
        'Pernyataan 1: Benar\nPernyataan 2: Salah\nPernyataan 3: Benar\nPernyataan 4: Salah',
        '1. Pernyataan A Benar. Kearifan lokal sering kali memuat nilai-nilai pelestarian lingkungan.\n2. Pernyataan B Salah. Memproduksi tas alternatif dari serat alam merupakan tindakan solutif yang bersifat aktif dan progresif.\n3. Pernyataan C Benar. Gerakan anti-plastik adalah wujud nyata sikap kritis.\n4. Pernyataan D Salah. Penumpukan sampah plastik justru membuktikan dampak negatif.',
      ],
      [
        4,
        'Menganalisis fenomena sosial yang dipengaruhi globalisasi secara kritis',
        'Pilihan Ganda Kompleks Kategori',
        `Masuknya korporasi agribisnis multinasional ke sebuah wilayah pertanian pada awalnya disambut baik karena menawarkan bibit rekayasa genetika (GMO) yang menjanjikan hasil panen berlipat ganda. Namun seiring waktu, para petani menyadari bahwa mereka menjadi sangat bergantung secara ekonomi karena bibit tersebut tidak dapat ditanam kembali pada musim berikutnya, dan membutuhkan pupuk kimia impor yang harganya terus melonjak. Secara kolektif, serikat petani di wilayah tersebut akhirnya mengambil keputusan radikal untuk memutuskan kontrak, lalu mendirikan 'Bank Benih Pribumi' untuk membudidayakan kembali bibit lokal unggulan...`,
        'A. Kembali pada metode pertanian organik leluhur merupakan strategi penguatan kearifan lokal guna melepaskan diri dari ketergantungan pihak asing.',
        'B. Dominasi korporasi multinasional dalam penyediaan bibit dan pupuk kimia berpotensi menciptakan ketimpangan struktural bagi para petani lokal.',
        'C. Penolakan mayoritas petani terhadap bibit rekayasa genetika merupakan wujud murni sikap chauvinisme yang sangat menghambat modernisasi pertanian.',
        'D. Penggunaan bank benih pribumi secara mandiri mengindikasikan kebangkitan kedaulatan pangan lokal dalam menghadapi hegemoni agribisnis global.',
        '-',
        'Pernyataan 1: Fakta\nPernyataan 2: Fakta\nPernyataan 3: Miskonsepsi\nPernyataan 4: Fakta',
        '1. Pernyataan A berstatus Fakta. Kembali pada metode organik dan bibit lokal adalah langkah rasional.\n2. Pernyataan B berstatus Fakta. Monopoli sarana produksi pertanian berpotensi menjerat petani.\n3. Pernyataan C berstatus Miskonsepsi. Penolakan petani didasari oleh analisis kritis terhadap kerugian ekonomi.\n4. Pernyataan D berstatus Fakta.',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
      { wch: 10 }, { wch: 45 }, { wch: 30 }, { wch: 55 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 10 }, { wch: 30 }, { wch: 45 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Kategori');
    const cleanMapel = currentMapel.trim().replace(/\s+/g, '_').toUpperCase();
    XLSX.writeFile(wb, `Sosiologi_Perubahan_Sosial_dan_Globalisasi_Kategori.xlsx`);
  };

  // 4. Download Template All / Gabungan
  const handleDownloadTemplateGabungan = () => {
    const currentMapel = selectedBankMapel !== 'ALL' ? selectedBankMapel : mapelInput || config.mapel || 'Sosiologi';
    const ws_data = [
      [
        'No Soal',
        'Kompetensi',
        'Bentuk Soal',
        'Soal (Stimulus + Pertanyaan)',
        'Opsi_A / Pernyataan_1',
        'Opsi_B / Pernyataan_2',
        'Opsi_C / Pernyataan_3',
        'Opsi_D / Pernyataan_4',
        'Opsi_E',
        'Kunci Jawaban',
        'Pembahasan',
      ],
      [
        1,
        '3.1 Perubahan Sosial',
        'Pilihan Ganda',
        `Perubahan sosial di masyarakat dipengaruhi oleh faktor utama yaitu...`,
        'Globalisasi dan modernisasi',
        'Tradisi lama yang tertutup',
        'Isolasi geografis',
        'Stagnasi budaya',
        'Regresi teknologi',
        'A',
        'Pembahasan: Globalisasi dan modernisasi merupakan pendorong utama perubahan sosial.',
      ],
      [
        2,
        '3.1 Perubahan Sosial',
        'Pilihan Ganda Kompleks MCMA',
        `Faktor internal penyebab perubahan sosial antara lain... (Pilih lebih dari satu)`,
        'Penemuan teknologi baru (Inovasi)',
        'Bencana alam gunung meletus',
        'Konflik pertentangan dalam masyarakat',
        'Pengaruh kebudayaan masyarakat lain',
        'Pemberontakan atau revolusi sosial',
        'A,C,E',
        'Pembahasan: Faktor internal meliputi penemuan baru, konflik sosial, dan revolusi.',
      ],
      [
        3,
        '3.2 Modernisasi & Globalisasi',
        'Pilihan Ganda Kompleks Kategori',
        `Tentukan kategori Sesuai atau Tidak Sesuai untuk setiap pernyataan berikut!`,
        'A. Gerakan pemuda merupakan wujud sikap kritis dengan menjadikan kearifan lokal sebagai komoditas adaptif di era global.',
        'B. Memasarkan kain tenun melalui media sosial secara global menandakan hilangnya identitas budaya asli.',
        'C. Inovasi potongan pakaian modern pada kain tenun menunjukkan adanya proses glokalisasi.',
        'D. Langkah pemuda desa tersebut mencerminkan sikap anti-globalisasi yang berlebihan.',
        '-',
        'Pernyataan 1: Sesuai\nPernyataan 2: Tidak Sesuai\nPernyataan 3: Sesuai\nPernyataan 4: Tidak Sesuai',
        'Pembahasan: Pernyataan 1 dan 3 Sesuai. Pernyataan 2 dan 4 Tidak Sesuai.',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
      { wch: 10 }, { wch: 30 }, { wch: 30 }, { wch: 50 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 20 }, { wch: 30 }, { wch: 45 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Soal_Lengkap');
    const cleanMapel = currentMapel.trim().replace(/\s+/g, '_').toUpperCase();
    XLSX.writeFile(wb, `TEMPLATE_SOAL_GABUNGAN_CBT_${cleanMapel}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const newQuestions: Question[] = [];
        let startId = Date.now();
        let detectedMapel = '';

        data.forEach((row, idx) => {
          // Flexible Column Name Resolution
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
                return row[k];
              }
            }
            return undefined;
          };

          const qText = getVal(
            'Soal (Stimulus + Pertanyaan)',
            'Soal (Stimulus+Pertanyaan)',
            'Pertanyaan',
            'Soal',
            'pertanyaan',
            'soal'
          );

          const optA = getVal('Opsi_A / Pernyataan_1', 'Opsi_A / Pernyataan 1', 'Pernyataan_1', 'Pernyataan 1', 'Opsi_A', 'opsi_a', 'Opsi A');
          const optB = getVal('Opsi_B / Pernyataan_2', 'Opsi_B / Pernyataan 2', 'Pernyataan_2', 'Pernyataan 2', 'Opsi_B', 'opsi_b', 'Opsi B');
          const optC = getVal('Opsi_C / Pernyataan_3', 'Opsi_C / Pernyataan 3', 'Pernyataan_3', 'Pernyataan 3', 'Opsi_C', 'opsi_c', 'Opsi C');
          const optD = getVal('Opsi_D / Pernyataan_4', 'Opsi_D / Pernyataan 4', 'Pernyataan_4', 'Pernyataan 4', 'Opsi_D', 'opsi_d', 'Opsi D');
          const optE = getVal('Opsi_E / Pernyataan_5', 'Opsi_E / Pernyataan 5', 'Pernyataan_5', 'Pernyataan 5', 'Opsi_E', 'opsi_e', 'Opsi E');

          const keyRaw = (getVal('Kunci Jawaban', 'Kunci_Jawaban', 'Kunci', 'kunci_jawaban', 'kunci') || '').toString().trim();
          const exp = getVal('Pembahasan', 'pembahasan', 'Penjelasan') || 'Tidak ada pembahasan.';
          const rowMapel = getVal('Mapel', 'Mata_Pelajaran', 'Mata Pelajaran', 'mapel');
          const rowKompetensi = getVal('Kompetensi', 'kompetensi', 'KD', 'Sub_Topik', 'sub_topik', 'Materi');
          const rowBentuk = (getVal('Bentuk Soal', 'Bentuk_Soal', 'bentuk_soal', 'BentukSoal') || 'Pilihan Ganda').toString().trim();
          const rowImg = getVal('Gambar', 'gambar', 'URL_Gambar', 'url_gambar', 'Image');
          const rowPoin = getVal('Poin', 'poin', 'Point', 'point', 'Bobot', 'bobot', 'Nilai', 'nilai');
          const poinVal = rowPoin && !isNaN(Number(rowPoin)) && Number(rowPoin) > 0 ? Number(rowPoin) : 10;

          const statementsRaw = getVal('Pernyataan_Kategori', 'pernyataan_kategori', 'Pernyataan', 'pernyataan');
          const categoryOptsRaw = getVal('Opsi_Kategori', 'opsi_kategori', 'Kategori_Options');

          if (rowMapel && !detectedMapel) {
            detectedMapel = String(rowMapel).trim();
          }

          const bentukLower = rowBentuk.toLowerCase();

          if (qText) {
            // Check statement columns for Kategori format
            const stmtCols = [optA, optB, optC, optD, optE]
              .map((s) => (s ? String(s).trim() : ''))
              .filter((s) => s !== '' && s !== '-');

            // Case 1: Pilihan Ganda Kompleks Kategori
            if (
              bentukLower.includes('kategori') ||
              (stmtCols.length > 0 && (keyRaw.toLowerCase().includes('pernyataan') || keyRaw.includes(':') || keyRaw.includes('|'))) ||
              (statementsRaw && String(statementsRaw).trim())
            ) {
              let rawStatementsList: string[] = [];

              if (stmtCols.length > 0) {
                rawStatementsList = stmtCols;
              } else if (statementsRaw) {
                rawStatementsList = String(statementsRaw).split(/[|\n]/).map((s) => s.trim()).filter(Boolean);
              }

              // Parse keys like "Pernyataan 1: Sesuai\nPernyataan 2: Tidak Sesuai" or "1:Benar|2:Salah"
              let keyMap: Record<string, string> = {};
              const keyChunks = keyRaw.split(/[|\n;\r]+/);

              keyChunks.forEach((chunk, chunkIdx) => {
                const trimmed = chunk.trim();
                if (!trimmed) return;

                if (trimmed.includes(':') || trimmed.includes('=') || trimmed.includes('-')) {
                  const parts = trimmed.split(/[:=-]/);
                  const left = parts[0].trim();
                  const right = parts.slice(1).join(':').trim();

                  // Extract number or letter identifier from left part
                  const numMatch = left.match(/\d+/);
                  const letterMatch = left.match(/[A-E]/i);

                  let idKey = String(chunkIdx + 1);
                  if (numMatch) {
                    idKey = numMatch[0];
                  } else if (letterMatch) {
                    const letterCode = letterMatch[0].toUpperCase().charCodeAt(0) - 64;
                    idKey = String(letterCode);
                  }

                  if (right) keyMap[idKey] = right;
                } else {
                  // Separated by comma/pipe without colons
                  const commaParts = trimmed.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
                  if (commaParts.length > 1) {
                    commaParts.forEach((cp, cpIdx) => {
                      keyMap[String(cpIdx + 1)] = cp;
                    });
                  } else {
                    keyMap[String(chunkIdx + 1)] = trimmed;
                  }
                }
              });

              // Dynamic Category Options
              let categoryOptions: string[] = [];
              if (categoryOptsRaw) {
                categoryOptions = String(categoryOptsRaw).split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
              }

              if (categoryOptions.length === 0) {
                const answersInRow = Object.values(keyMap).map((v) => v.trim()).filter(Boolean);
                categoryOptions = Array.from(new Set(answersInRow));
              }

              if (categoryOptions.length === 0) {
                categoryOptions = ['Benar', 'Salah'];
              } else if (categoryOptions.length === 1) {
                const singleOpt = categoryOptions[0];
                if (singleOpt.toLowerCase() === 'sesuai') categoryOptions = ['Sesuai', 'Tidak Sesuai'];
                else if (singleOpt === 'Tepat') categoryOptions = ['Tepat', 'Tidak Tepat'];
                else if (singleOpt === 'Benar') categoryOptions = ['Benar', 'Salah'];
                else if (singleOpt === 'Ya') categoryOptions = ['Ya', 'Tidak'];
                else if (singleOpt === 'Fakta') categoryOptions = ['Fakta', 'Miskonsepsi'];
                else categoryOptions = [singleOpt, `Bukan ${singleOpt}`];
              }

              const categoryStatements = rawStatementsList.map((st, idx) => {
                const stId = String(idx + 1);
                const correctCat = keyMap[stId] || keyMap[String.fromCharCode(65 + idx)] || Object.values(keyMap)[idx] || categoryOptions[0];
                return {
                  id: stId,
                  statement: st,
                  correctCategory: correctCat,
                };
              });

              if (categoryStatements.length > 0) {
                newQuestions.push({
                  id: startId + idx,
                  question: formatQuestionText(String(qText)),
                  explanation: String(exp),
                  image: rowImg ? String(rowImg).trim() : undefined,
                  mapel: rowMapel ? String(rowMapel).trim() : 'Sosiologi',
                  kompetensi: rowKompetensi ? String(rowKompetensi).trim() : undefined,
                  subTopik: rowKompetensi ? String(rowKompetensi).trim() : undefined,
                  bentukSoal: 'Pilihan Ganda Kompleks Kategori',
                  categoryOptions,
                  categoryStatements,
                  poin: poinVal,
                  options: [],
                });
                return;
              }
            }

            // Case 2: Pilihan Ganda Kompleks MCMA or PG Sederhana
            const keysArray = keyRaw.toUpperCase().split(/[,;| ]/).map((k) => k.trim()).filter(Boolean);
            let isMcma = bentukLower.includes('mcma') || (bentukLower.includes('kompleks') && !bentukLower.includes('kategori')) || keysArray.length > 1;

            if (optA && optB && optC) {
              newQuestions.push({
                id: startId + idx,
                question: formatQuestionText(String(qText)),
                explanation: String(exp),
                image: rowImg ? String(rowImg).trim() : undefined,
                mapel: rowMapel ? String(rowMapel).trim() : 'Sosiologi',
                kompetensi: rowKompetensi ? String(rowKompetensi).trim() : undefined,
                subTopik: rowKompetensi ? String(rowKompetensi).trim() : undefined,
                bentukSoal: isMcma ? 'Pilihan Ganda Kompleks MCMA' : 'Pilihan Ganda',
                poin: poinVal,
                options: [
                  { id: 'A', text: String(optA), isCorrect: keysArray.includes('A') },
                  { id: 'B', text: String(optB), isCorrect: keysArray.includes('B') },
                  { id: 'C', text: String(optC), isCorrect: keysArray.includes('C') },
                  { id: 'D', text: String(optD || '-'), isCorrect: keysArray.includes('D') },
                  { id: 'E', text: String(optE || '-'), isCorrect: keysArray.includes('E') },
                ],
              });
            }
          }
        });

        if (newQuestions.length > 0) {
          const initialMapel =
            detectedMapel ||
            (selectedBankMapel !== 'ALL' ? selectedBankMapel : mapelInput || config.mapel || 'Sosiologi');
          setUploadPendingQuestions(newQuestions);
          setUploadFileName(file.name);
          setUploadTargetMapel(initialMapel);
          setIsUploadMapelModalOpen(true);
        } else {
          showAlert(
            'Gagal! Pastikan format kolom Excel sesuai dengan TEMPLATE_SOAL (Pertanyaan, Opsi_A s/d Opsi_E, Kunci_Jawaban, Pembahasan).'
          );
        }
      } catch (err) {
        console.error(err);
        showAlert('Terjadi kesalahan saat memproses file Excel. Pastikan file tidak korup.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmUploadWithMapel = () => {
    if (uploadPendingQuestions.length === 0) return;
    const finalMapel = uploadTargetMapel.trim() || 'Sosiologi';
    const activeKg = loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'));
    const updatedWithMapel = uploadPendingQuestions.map((q) => ({
      ...q,
      mapel: finalMapel,
      kodeGuru: q.kodeGuru || activeKg,
    }));
    const updated = [...config.questions, ...updatedWithMapel];
    onSaveConfig({ ...config, questions: updated });
    setIsUploadMapelModalOpen(false);
    setUploadPendingQuestions([]);
    showAlert(
      `Sukses! ${updatedWithMapel.length} soal untuk Mata Pelajaran "${finalMapel}" (Kode Guru: ${activeKg}) telah berhasil ditambahkan ke Bank Soal.`
    );
  };

  // --- REKAP CBT HANDLERS ---
  const processCbtFilesList = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newResults: StudentResult[] = [...studentResults];
    let successCount = 0;
    let failCount = 0;
    let errorDetails: string[] = [];
    let processed = 0;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const decrypted = decryptResult(content);

          const existingIdx = newResults.findIndex(
            (r) =>
              r.id === decrypted.id ||
              (r.studentInfo.noPeserta === decrypted.studentInfo.noPeserta &&
                r.studentInfo.name === decrypted.studentInfo.name)
          );

          if (existingIdx >= 0) {
            newResults[existingIdx] = decrypted;
          } else {
            newResults.push(decrypted);
          }
          successCount++;
        } catch (err: any) {
          console.error('Gagal memproses file CBT:', file.name, err);
          failCount++;
          errorDetails.push(`${file.name}: ${err.message || 'File korup/salah format'}`);
        } finally {
          processed++;
          if (processed === files.length) {
            onSaveStudentResults([...newResults]);
            if (successCount > 0) {
              showAlert(
                `Berhasil mendekripsi & merekap ${successCount} file jawaban siswa (.cbt)!` +
                  (failCount > 0 ? ` (${failCount} file tidak valid)` : '')
              );
            } else {
              const detail = errorDetails[0] || 'Pastikan file terenkripsi resmi dari CBT Sosiologi!';
              showAlert(`Gagal merekap file .cbt. ${detail}`);
            }
          }
        }
      };

      reader.onerror = () => {
        failCount++;
        processed++;
        if (processed === files.length) {
          onSaveStudentResults([...newResults]);
          showAlert(`Gagal membaca file ${file.name}`);
        }
      };

      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleCbtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processCbtFilesList(e.target.files);
    }
    e.target.value = '';
  };

  const handleExportRekapToExcel = () => {
    if (filteredStudentResults.length === 0) {
      showAlert('Belum ada data rekap nilai siswa yang sesuai dengan filter Guru/Mata Pelajaran saat ini!');
      return;
    }

    const kop = config.kopSekolah || defaultKopSekolah;
    const activeTeacherName = activeTeacherObj ? activeTeacherObj.nama : (kop.namaGuru || defaultKopSekolah.namaGuru);
    const activeTeacherNip = activeTeacherObj ? activeTeacherObj.nip : (kop.nipGuru || defaultKopSekolah.nipGuru);
    const activeMapel = activeTeacherObj ? activeTeacherObj.mapel : (config.mapel || 'Sosiologi');
    const activeKodeGuru = activeTeacherObj ? (activeTeacherObj.kodeGuru || 'GURU01') : (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'));

    const filterInfoStr = `Filter Kelas: ${rekapKelasFilter !== 'ALL' ? rekapKelasFilter : 'Semua Kelas'} | Filter Kode Soal: ${rekapKodeSoalFilter !== 'ALL' ? rekapKodeSoalFilter : 'Semua Kode Soal'} | Filter Kode Guru: ${rekapKodeGuruFilter !== 'ALL' ? rekapKodeGuruFilter : 'Semua Guru'}`;

    const ws_data: any[][] = [
      [(kop.dinas || defaultKopSekolah.dinas).toUpperCase()],
      [(kop.namaSekolah || defaultKopSekolah.namaSekolah).toUpperCase()],
      [kop.alamat || defaultKopSekolah.alamat],
      [kop.teleponWeb || ''],
      [''],
      ['DAFTAR HASIL JAWABAN & REKAPITULASI NILAI UJIAN CBT MULTI GURU'],
      [`Mata Pelajaran: ${activeMapel} | Guru Pengampu: ${activeTeacherName} | KKM: ${config.kkm} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
      [filterInfoStr],
      [''],
      ['No', 'NIS / No. Peserta', 'Nama Lengkap Siswa', 'Kelas', 'Kode Soal / Ujian', 'Mata Pelajaran', 'Kode Guru', 'Jawaban Benar', 'Jawaban Salah', 'Total Soal', 'Nilai Akhir', 'KKM', 'Status Lulus', 'Pelanggaran', 'Waktu Selesai'],
    ];

    filteredStudentResults.forEach((r, i) => {
      ws_data.push([
        i + 1,
        r.studentInfo.noPeserta,
        r.studentInfo.name,
        getStudentClass(r),
        getKodeSoal(r),
        r.studentInfo.mapel,
        r.studentInfo.kodeGuru || activeKodeGuru,
        r.correctCount,
        r.incorrectCount,
        r.totalQuestions,
        r.score,
        r.kkm,
        r.isPassed ? 'LULUS (TUNTAS)' : 'REMIDI',
        r.warnings,
        r.submittedAt,
      ]);
    });

    // Summary Statistics
    const avgScore = Math.round(filteredStudentResults.reduce((sum, r) => sum + r.score, 0) / filteredStudentResults.length);
    const maxScore = Math.max(...filteredStudentResults.map((r) => r.score));
    const minScore = Math.min(...filteredStudentResults.map((r) => r.score));
    const totalPassed = filteredStudentResults.filter((r) => r.isPassed).length;

    ws_data.push(['']);
    ws_data.push(['SUMMARY STATISTIK UJIAN GURU:']);
    ws_data.push(['Guru Pengampu', activeTeacherName]);
    ws_data.push(['Mata Pelajaran', activeMapel]);
    ws_data.push(['Rata-Rata Nilai', avgScore]);
    ws_data.push(['Nilai Tertinggi', maxScore]);
    ws_data.push(['Nilai Terendah', minScore]);
    ws_data.push(['Total Peserta Ujian', filteredStudentResults.length]);
    ws_data.push(['Jumlah Peserta Lulus', `${totalPassed} Siswa (${Math.round((totalPassed / filteredStudentResults.length) * 100)}%)`]);

    // Signature Block at Bottom
    ws_data.push(['']);
    ws_data.push(['', '', '', '', '', '', '', '', 'Mengetahui,', '', kop.kotaTanggal || defaultKopSekolah.kotaTanggal]);
    ws_data.push(['', '', '', '', '', '', '', '', 'Kepala Sekolah', '', 'Guru Mata Pelajaran']);
    ws_data.push(['']);
    ws_data.push(['']);
    ws_data.push(['', '', '', '', '', '', '', '', kop.namaKepalaSekolah || defaultKopSekolah.namaKepalaSekolah, '', activeTeacherName]);
    ws_data.push(['', '', '', '', '', '', '', '', `NIP. ${kop.nipKepalaSekolah || defaultKopSekolah.nipKepalaSekolah}`, '', `NIP. ${activeTeacherNip}`]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Hasil_CBT');
    const cleanMapel = activeMapel.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `LAPORAN_REKAP_CBT_${activeKodeGuru}_${cleanMapel}_${Date.now()}.xlsx`);
  };

  const handleDeleteStudentResult = (id: string) => {
    showConfirm(
      'Hapus Rekap Siswa?',
      'Apakah Anda yakin ingin menghapus data hasil siswa ini dari rekapitulasi?',
      () => {
        const updated = studentResults.filter((r) => r.id !== id);
        onSaveStudentResults(updated);
        showAlert('Data rekap siswa berhasil dihapus.');
      },
      true
    );
  };

  // --- TOKEN MANAGEMENT HANDLERS ---
  const handleGenerateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randToken = '';
    for (let i = 0; i < 6; i++) {
      randToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentToken(randToken);
  };

  const handleSaveToken = () => {
    const trimmed = currentToken.trim().toUpperCase();
    if (!trimmed) {
      showAlert('Token tidak boleh kosong!');
      return;
    }
    onSaveConfig({
      ...config,
      examToken: trimmed,
    });
    showAlert(`Token Ujian berhasil diperbarui menjadi: ${trimmed}`);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken);
    setIsCopiedToken(true);
    setTimeout(() => setIsCopiedToken(false), 2000);
  };

  // Helper to extract flexible column values from uploaded spreadsheet rows
  const extractRowField = (row: any, ...targetKeys: string[]): string => {
    if (!row || typeof row !== 'object') return '';
    const rowKeys = Object.keys(row);
    for (const target of targetKeys) {
      const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const key of rowKeys) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey === cleanTarget) {
          const val = row[key];
          if (val !== undefined && val !== null) {
            return String(val).trim();
          }
        }
      }
    }
    return '';
  };

  // --- STUDENT USER MANAGEMENT HANDLERS ---
  const handleDownloadStudentTemplate = () => {
    const ws_data = [
      ['NIS', 'Nama', 'Kelas', 'Kode_Guru'],
      ['1001', 'Ahmad Fauzi', 'XII IPS 1', config.kodeGuru || 'GURU01'],
      ['1002', 'Siti Rahmawati', 'XII IPS 1', config.kodeGuru || 'GURU01'],
      ['1003', 'Budi Santoso', 'XII IPS 2', config.kodeGuru || 'GURU01'],
      ['1004', 'Dewi Anjani', 'XII IPS 2', config.kodeGuru || 'GURU01'],
      ['1005', 'Rian Hidayat', 'XII IPS 3', config.kodeGuru || 'GURU01'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
    XLSX.writeFile(wb, 'TEMPLATE_DATA_SISWA_CBT.xlsx');
  };

  const handleAddStudentManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNis.trim() || !newNama.trim()) {
      showAlert('Harap isi NIS dan Nama Siswa!');
      return;
    }

    // Check duplicate NIS
    const exists = studentsList.some((s) => s.nis.toLowerCase() === newNis.trim().toLowerCase());
    if (exists) {
      showAlert(`NIS "${newNis}" sudah terdaftar dalam sistem!`);
      return;
    }

    const defaultTeacherKg = loggedInTeacher?.kodeGuru || (studentKodeGuruFilter !== 'ALL' ? studentKodeGuruFilter : config.kodeGuru || 'GURU01');
    const newStudent: StudentUser = {
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nis: newNis.trim(),
      nama: newNama.trim(),
      kelas: newKelas.trim() || 'XII IPS',
      kodeGuru: newStudentKodeGuru.trim().toUpperCase() || defaultTeacherKg,
      isActive: true,
    };

    const updated = [...studentsList, newStudent];
    onSaveConfig({ ...config, students: updated });
    saveStudentToFirebase(newStudent);

    setNewNis('');
    setNewNama('');
    setNewKelas('');
    setNewStudentKodeGuru('');
    setIsAddStudentModalOpen(false);
    showAlert(`Siswa "${newStudent.nama}" berhasil ditambahkan & tersimpan ke Firebase!`);
  };

  const handleUpdateStudentManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editingStudent.nis.trim() || !editingStudent.nama.trim()) {
      showAlert('Harap isi NIS dan Nama Siswa!');
      return;
    }

    const updatedStudent: StudentUser = {
      ...editingStudent,
      nis: editingStudent.nis.trim(),
      nama: editingStudent.nama.trim(),
      kelas: editingStudent.kelas.trim() || 'XII IPS',
      kodeGuru: (editingStudent.kodeGuru || config.kodeGuru || 'GURU01').trim().toUpperCase(),
    };

    const updated = studentsList.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    onSaveConfig({ ...config, students: updated });
    saveStudentToFirebase(updatedStudent);

    setEditingStudent(null);
    showAlert(`Data siswa "${updatedStudent.nama}" berhasil diperbarui & disimpan di Firebase!`);
  };

  const handleStudentExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        if (!data || data.length === 0) {
          showAlert('File kosong atau tidak berisi baris data yang valid.');
          return;
        }

        const studentMap = new Map<string, StudentUser>();
        studentsList.forEach((s) => {
          if (s && s.nis) {
            studentMap.set(s.nis.trim().toLowerCase(), s);
          }
        });

        let countAdded = 0;
        let countUpdated = 0;
        const defaultTeacherKg = loggedInTeacher?.kodeGuru || (studentKodeGuruFilter !== 'ALL' ? studentKodeGuruFilter : config.kodeGuru || 'GURU01');

        data.forEach((row, idx) => {
          const nisVal = extractRowField(row, 'nis', 'nisn', 'nopeserta', 'no_peserta', 'nomorpeserta', 'username', 'noinduk', 'id');
          const namaVal = extractRowField(row, 'nama', 'namasiswa', 'namalengkap', 'peserta', 'namapeserta', 'name');
          const kelasVal = extractRowField(row, 'kelas', 'rombel', 'tingkat', 'jurusan', 'kelassiswa') || 'XII IPS';
          const kodeGuruVal = (extractRowField(row, 'kodeguru', 'kode_guru', 'kode', 'kodegurupengampu', 'guru') || defaultTeacherKg).toUpperCase();

          if (nisVal && namaVal) {
            const key = nisVal.toLowerCase();
            const existing = studentMap.get(key);
            if (existing) {
              const updatedItem: StudentUser = {
                ...existing,
                nama: namaVal,
                kelas: kelasVal || existing.kelas || 'XII IPS',
                kodeGuru: kodeGuruVal || existing.kodeGuru || defaultTeacherKg,
              };
              studentMap.set(key, updatedItem);
              countUpdated++;
            } else {
              const newItem: StudentUser = {
                id: `std-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                nis: nisVal,
                nama: namaVal,
                kelas: kelasVal,
                kodeGuru: kodeGuruVal,
                isActive: true,
              };
              studentMap.set(key, newItem);
              countAdded++;
            }
          }
        });

        if (countAdded > 0 || countUpdated > 0) {
          const fullList = Array.from(studentMap.values());
          onSaveConfig({ ...config, students: fullList });
          saveAllStudentsToFirebase(fullList);
          showAlert(
            `Sukses memproses file data siswa! Total: ${countAdded + countUpdated} data (${countAdded} siswa baru ditambahkan, ${countUpdated} siswa diperbarui) & tersimpan permanen ke Cloud Firestore.`
          );
        } else {
          showAlert(
            'Tidak ada baris siswa yang berhasil dibaca. Pastikan terdapat kolom NIS / No. Peserta dan Nama Siswa pada baris header file Anda.'
          );
        }
      } catch (err: any) {
        console.error('Error importing student file:', err);
        showAlert(`Gagal memproses file data siswa: ${err?.message || 'Format file tidak terbaca'}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDeleteStudent = (id: string, nama: string) => {
    showConfirm(
      'Hapus Data Siswa?',
      `Apakah Anda yakin ingin menghapus siswa "${nama}"?`,
      () => {
        const updated = studentsList.filter((s) => s.id !== id);
        onSaveConfig({ ...config, students: updated });
        deleteStudentFromFirebase(id);
        showAlert(`Data siswa "${nama}" berhasil dihapus dari sistem & Firebase.`);
      },
      true
    );
  };

  // Derived Student Counts & Data
  const uniqueClasses = Array.from(new Set(displayStudentsList.map((s) => s.kelas))).filter(Boolean);
  const activeStudentsCount = displayStudentsList.filter((s) => s.isActive !== false).length;
  const inactiveStudentsCount = displayStudentsList.length - activeStudentsCount;

  // --- STUDENT ACTIVE EXAM SELECTION HANDLERS ---
  const handleToggleStudentActive = (id: string) => {
    let targetStudent: StudentUser | null = null;
    const updated = (config.students || []).map((s) => {
      if (s.id === id) {
        const currentActive = s.isActive !== false;
        targetStudent = { ...s, isActive: !currentActive };
        return targetStudent;
      }
      return s;
    });
    onSaveConfig({ ...config, students: updated });
    if (targetStudent) {
      saveStudentToFirebase(targetStudent);
    }
  };

  const handleSetClassActiveStatus = (kelasName: string, isActive: boolean, exclusivelyThisClass: boolean = false) => {
    const displayIds = new Set(displayStudentsList.map((s) => s.id));
    const updated = (config.students || []).map((s) => {
      if (displayIds.has(s.id)) {
        if (s.kelas === kelasName) {
          return { ...s, isActive };
        }
        if (exclusivelyThisClass) {
          return { ...s, isActive: false };
        }
      }
      return s;
    });
    onSaveConfig({ ...config, students: updated });
    saveAllStudentsToFirebase(updated);

    if (exclusivelyThisClass) {
      showAlert(`Hanya siswa di kelas "${kelasName}" yang DIAKTIFKAN UJIAN. Siswa kelas lainnya di-nonaktifkan.`);
    } else {
      showAlert(`Siswa di kelas "${kelasName}" berhasil di-${isActive ? 'aktifkan' : 'nonaktifkan'} untuk ujian.`);
    }
  };

  const handleSetAllStudentsActive = (isActive: boolean) => {
    const displayIds = new Set(displayStudentsList.map((s) => s.id));
    const updated = (config.students || []).map((s) => {
      if (displayIds.has(s.id)) {
        return { ...s, isActive };
      }
      return s;
    });
    onSaveConfig({ ...config, students: updated });
    saveAllStudentsToFirebase(updated);
    showAlert(`Semua siswa (${displayStudentsList.length}) berhasil di-${isActive ? 'aktifkan' : 'nonaktifkan'} untuk ujian.`);
  };

  const handleBatchSetStudentActive = (isActive: boolean) => {
    if (selectedStudentIds.length === 0) {
      showAlert('Pilih minimal satu siswa dari tabel terlebih dahulu!');
      return;
    }
    const updated = studentsList.map((s) => {
      if (selectedStudentIds.includes(s.id)) {
        return { ...s, isActive };
      }
      return s;
    });
    onSaveConfig({ ...config, students: updated });
    saveAllStudentsToFirebase(updated);
    showAlert(`${selectedStudentIds.length} siswa terpilih berhasil di-${isActive ? 'aktifkan' : 'nonaktifkan'} untuk ujian.`);
    setSelectedStudentIds([]);
  };

  const handleBatchDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    showConfirm(
      'Hapus Siswa Terpilih?',
      `Apakah Anda yakin ingin menghapus ${selectedStudentIds.length} siswa yang dicentang?`,
      () => {
        const idsToDelete = [...selectedStudentIds];
        const updated = studentsList.filter((s) => !idsToDelete.includes(s.id));
        onSaveConfig({ ...config, students: updated });
        deleteSelectedStudentsFromFirebase(idsToDelete);
        setSelectedStudentIds([]);
        showAlert(`${idsToDelete.length} siswa berhasil dihapus dari Firebase.`);
      },
      true
    );
  };

  const handleToggleSelectAllStudents = (currentFiltered: StudentUser[]) => {
    if (selectedStudentIds.length === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(currentFiltered.map((s) => s.id));
    }
  };

  const handleToggleSelectOneStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // --- TEACHER USER MANAGEMENT HANDLERS ---
  const handleDownloadTeacherTemplate = () => {
    const ws_data = [
      ['NIP', 'Nama', 'Mata_Pelajaran', 'Kode_Guru', 'Password', 'Username'],
      ['198501152010011002', 'Drs. Aji Sosiologi, M.Pd', 'Sosiologi', 'GURU01', 'guru123', 'aji_sosiologi'],
      ['198803202012022005', 'Siti Rahmawati, S.Pd', 'Sosiologi', 'GURU02', 'guru123', 'siti_rahma'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Guru');
    XLSX.writeFile(wb, 'TEMPLATE_DATA_GURU_CBT.xlsx');
  };

  const handleAddTeacherManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNip.trim() || !newTeacherNama.trim()) {
      showAlert('Harap isi NIP dan Nama Guru!');
      return;
    }

    const exists = teachersList.some((t) => t.nip.toLowerCase() === newNip.trim().toLowerCase());
    if (exists) {
      showAlert(`NIP "${newNip}" sudah terdaftar dalam sistem!`);
      return;
    }

    const newTeacher: TeacherUser = {
      id: `tch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nip: newNip.trim(),
      nama: newTeacherNama.trim(),
      mapel: newTeacherMapel.trim() || 'Sosiologi',
      kodeGuru: newTeacherKodeGuru.trim().toUpperCase() || 'GURU01',
    };

    const updated = [...teachersList, newTeacher];
    onSaveConfig({ ...config, teachers: updated });
    saveTeacherToFirebase(newTeacher);

    setNewNip('');
    setNewTeacherNama('');
    setNewTeacherMapel('');
    setNewTeacherKodeGuru('');
    setIsAddTeacherModalOpen(false);
    showAlert(`Guru "${newTeacher.nama}" berhasil ditambahkan & tersimpan ke Cloud!`);
  };

  const handleUpdateTeacherManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editingTeacher.nip.trim() || !editingTeacher.nama.trim()) {
      showAlert('Harap isi Username/NIP dan Nama Guru!');
      return;
    }

    const updatedTeacher: TeacherUser = {
      ...editingTeacher,
      nip: editingTeacher.nip.trim(),
      nama: editingTeacher.nama.trim(),
      mapel: editingTeacher.mapel.trim() || 'Sosiologi',
      kodeGuru: (editingTeacher.kodeGuru || 'GURU01').trim().toUpperCase(),
    };

    const updated = teachersList.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t));
    onSaveConfig({ ...config, teachers: updated });
    saveTeacherToFirebase(updatedTeacher);

    setEditingTeacher(null);
    showAlert(`Data guru "${updatedTeacher.nama}" berhasil diperbarui & disimpan!`);
  };

  const handleTeacherExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        if (!data || data.length === 0) {
          showAlert('File kosong atau tidak berisi baris data guru yang valid.');
          return;
        }

        const teacherMap = new Map<string, TeacherUser>();
        teachersList.forEach((t) => {
          if (t && t.nip) {
            teacherMap.set(t.nip.trim().toLowerCase(), t);
          }
        });

        let countAdded = 0;
        let countUpdated = 0;

        data.forEach((row, idx) => {
          const nipVal = extractRowField(row, 'nip', 'username', 'nik', 'idguru', 'nomorinduk', 'no_nip', 'id');
          const userVal = extractRowField(row, 'username', 'user', 'id_user', 'akun') || nipVal;
          const passVal = extractRowField(row, 'password', 'pass', 'katasandi', 'katasandi_guru', 'password_guru') || 'guru123';
          const namaVal = extractRowField(row, 'nama', 'namaguru', 'namalengkap', 'guru', 'name');
          const mapelVal = extractRowField(row, 'matapelajaran', 'mapel', 'pelajaran', 'mata_pelajaran', 'subjek') || 'Sosiologi';
          const kodeGuruVal = (extractRowField(row, 'kodeguru', 'kode_guru', 'kode', 'id_guru') || 'GURU01').toUpperCase();

          if (nipVal && namaVal) {
            const key = nipVal.toLowerCase();
            const existing = teacherMap.get(key);
            if (existing) {
              const updatedItem: TeacherUser = {
                ...existing,
                nip: nipVal,
                nama: namaVal,
                mapel: mapelVal || existing.mapel || 'Sosiologi',
                kodeGuru: kodeGuruVal || existing.kodeGuru || 'GURU01',
                username: userVal || existing.username || nipVal,
                password: passVal || existing.password || 'guru123',
              };
              teacherMap.set(key, updatedItem);
              countUpdated++;
            } else {
              const newItem: TeacherUser = {
                id: `tch-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                nip: nipVal,
                nama: namaVal,
                mapel: mapelVal,
                kodeGuru: kodeGuruVal,
                username: userVal || nipVal,
                password: passVal || 'guru123',
              };
              teacherMap.set(key, newItem);
              countAdded++;
            }
          }
        });

        if (countAdded > 0 || countUpdated > 0) {
          const fullList = Array.from(teacherMap.values());
          onSaveConfig({ ...config, teachers: fullList });
          saveAllTeachersToFirebase(fullList);
          showAlert(
            `Sukses memproses file guru! Total: ${countAdded + countUpdated} data (${countAdded} guru baru ditambahkan, ${countUpdated} guru diperbarui) & tersimpan permanen ke Cloud Firestore.`
          );
        } else {
          showAlert(
            'Tidak ada data guru yang berhasil diimpor. Pastikan format kolom header berisi: NIP / Username, Nama Guru, dan Mata Pelajaran.'
          );
        }
      } catch (err: any) {
        console.error('Error importing teacher file:', err);
        showAlert(`Gagal memproses file data guru: ${err?.message || 'Format file tidak terbaca'}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDeleteTeacher = (id: string, nama: string) => {
    showConfirm(
      'Hapus Data Guru?',
      `Apakah Anda yakin ingin menghapus data guru "${nama}"?`,
      () => {
        const updated = teachersList.filter((t) => t.id !== id);
        onSaveConfig({ ...config, teachers: updated });
        deleteTeacherFromFirebase(id);
        showAlert(`Data guru "${nama}" berhasil dihapus dari sistem.`);
      },
      true
    );
  };

  const handleDeleteSelectedTeachers = () => {
    if (selectedTeacherIds.length === 0) {
      showAlert('Pilih/centang minimal 1 akun guru yang akan dihapus!');
      return;
    }
    showConfirm(
      `Hapus ${selectedTeacherIds.length} Akun Guru Terpilih?`,
      `Apakah Anda yakin ingin menghapus ${selectedTeacherIds.length} akun guru yang dicentang?`,
      () => {
        const updated = teachersList.filter((t) => !selectedTeacherIds.includes(t.id));
        onSaveConfig({ ...config, teachers: updated });
        deleteSelectedTeachersFromFirebase(selectedTeacherIds);
        setSelectedTeacherIds([]);
        showAlert(`${selectedTeacherIds.length} data akun guru berhasil dihapus dari sistem.`);
      },
      true
    );
  };

  // --- ADMIN MANAGEMENT HANDLERS ---
  const handleDownloadAdminTemplate = () => {
    const templateData = [
      {
        Username: 'adminproktor01',
        Password: 'ProktorPass2026',
        Nama: 'Haji Ahmad, S.Kom',
        Role: 'proktor',
      },
      {
        Username: 'adminutama',
        Password: 'AdminMaster2026',
        Nama: 'Drs. Supriyadi, M.T',
        Role: 'superadmin',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Admin');
    XLSX.writeFile(wb, 'TEMPLATE_DATA_ADMIN_CBT.xlsx');
  };

  const handleAddAdminManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim() || !newAdminNama.trim()) {
      showAlert('Harap isi Username, Password, dan Nama Lengkap Admin!');
      return;
    }

    const exists = adminsList.some((a) => a.username.toLowerCase() === newAdminUsername.trim().toLowerCase());
    if (exists) {
      showAlert(`Username Admin "${newAdminUsername}" sudah terdaftar dalam sistem!`);
      return;
    }

    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: newAdminUsername.trim(),
      password: newAdminPassword.trim(),
      nama: newAdminNama.trim(),
      role: newAdminRole,
      createdAt: new Date().toISOString(),
    };

    const updated = [...adminsList, newAdmin];
    onSaveConfig({ ...config, admins: updated });
    saveAdminToFirebase(newAdmin);

    setNewAdminUsername('');
    setNewAdminPassword('');
    setNewAdminNama('');
    setNewAdminRole('admin');
    setIsAddAdminModalOpen(false);
    showAlert(`Akun Admin "${newAdmin.nama}" (Role: ${newAdmin.role}) berhasil ditambahkan!`);
  };

  const handleUpdateAdminManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    if (!editingAdmin.username.trim() || !editingAdmin.password?.trim() || !editingAdmin.nama.trim()) {
      showAlert('Harap isi Username, Password, dan Nama Admin!');
      return;
    }

    const updatedAdmin: AdminUser = {
      ...editingAdmin,
      username: editingAdmin.username.trim(),
      password: editingAdmin.password.trim(),
      nama: editingAdmin.nama.trim(),
      role: editingAdmin.role || 'admin',
    };

    const updated = adminsList.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a));
    onSaveConfig({ ...config, admins: updated });
    saveAdminToFirebase(updatedAdmin);

    setEditingAdmin(null);
    showAlert(`Data Akun Admin "${updatedAdmin.nama}" berhasil diperbarui!`);
  };

  const handleAdminExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        if (!data || data.length === 0) {
          showAlert('File kosong atau tidak berisi baris data admin yang valid.');
          return;
        }

        const adminMap = new Map<string, AdminUser>();
        adminsList.forEach((a) => {
          if (a && a.username) {
            adminMap.set(a.username.trim().toLowerCase(), a);
          }
        });

        let countAdded = 0;
        let countUpdated = 0;

        data.forEach((row, idx) => {
          const uVal = extractRowField(row, 'username', 'user', 'id', 'admin', 'usernameadmin');
          const pVal = extractRowField(row, 'password', 'pass', 'katasandi', 'passwordadmin') || 'JuniorCBT2026';
          const namaVal = extractRowField(row, 'nama', 'namaadmin', 'namalengkap', 'name');
          const rawRole = extractRowField(row, 'role', 'jabatan', 'hakakses', 'akses', 'tipe').toLowerCase();
          const roleVal = rawRole === 'superadmin' ? 'superadmin' : rawRole === 'proktor' ? 'proktor' : 'admin';

          if (uVal && namaVal) {
            const key = uVal.toLowerCase();
            const existing = adminMap.get(key);
            if (existing) {
              const updatedItem: AdminUser = {
                ...existing,
                nama: namaVal,
                password: pVal || existing.password || 'JuniorCBT2026',
                role: roleVal || existing.role || 'admin',
              };
              adminMap.set(key, updatedItem);
              countUpdated++;
            } else {
              const newItem: AdminUser = {
                id: `adm-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                username: uVal,
                password: pVal,
                nama: namaVal,
                role: roleVal,
                createdAt: new Date().toISOString(),
              };
              adminMap.set(key, newItem);
              countAdded++;
            }
          }
        });

        if (countAdded > 0 || countUpdated > 0) {
          const fullList = Array.from(adminMap.values());
          onSaveConfig({ ...config, admins: fullList });
          saveAllAdminsToFirebase(fullList);
          showAlert(
            `Sukses memproses file admin! Total: ${countAdded + countUpdated} data (${countAdded} admin baru ditambahkan, ${countUpdated} admin diperbarui) & tersimpan permanen ke Cloud Firestore.`
          );
        } else {
          showAlert('Tidak ada data admin yang diimpor. Pastikan format kolom header berisi: Username, Password, Nama, Role.');
        }
      } catch (err: any) {
        console.error('Error importing admin file:', err);
        showAlert(`Gagal memproses file data admin: ${err?.message || 'Format file tidak terbaca'}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDeleteAdmin = (id: string, nama: string) => {
    if (adminsList.length <= 1) {
      showAlert('Minimal harus ada 1 Akun Admin aktif dalam sistem!');
      return;
    }
    showConfirm(
      'Hapus Akun Admin?',
      `Apakah Anda yakin ingin menghapus akun admin "${nama}"?`,
      () => {
        const updated = adminsList.filter((a) => a.id !== id);
        onSaveConfig({ ...config, admins: updated });
        deleteAdminFromFirebase(id);
        showAlert(`Akun Admin "${nama}" berhasil dihapus.`);
      },
      true
    );
  };

  const handleDeleteSelectedAdmins = () => {
    if (selectedAdminIds.length === 0) {
      showAlert('Pilih/centang minimal 1 akun admin yang akan dihapus!');
      return;
    }
    if (adminsList.length - selectedAdminIds.length < 1) {
      showAlert('Tindakan dibatalkan: Sistem harus menyisakan sekurang-kurangnya 1 Akun Admin!');
      return;
    }
    showConfirm(
      `Hapus ${selectedAdminIds.length} Akun Admin Terpilih?`,
      `Apakah Anda yakin ingin menghapus ${selectedAdminIds.length} akun admin yang dicentang?`,
      () => {
        const updated = adminsList.filter((a) => !selectedAdminIds.includes(a.id));
        onSaveConfig({ ...config, admins: updated });
        deleteSelectedAdminsFromFirebase(selectedAdminIds);
        setSelectedAdminIds([]);
        showAlert(`${selectedAdminIds.length} akun admin berhasil dihapus.`);
      },
      true
    );
  };

  // --- FILTERS & STATS ---
  const availableKodeGurus = Array.from(
    new Set([
      config.kodeGuru || 'GURU01',
      ...config.questions.map((q) => q.kodeGuru).filter(Boolean),
      ...teachersList.map((t) => t.kodeGuru).filter(Boolean),
      ...studentsList.map((s) => s.kodeGuru).filter(Boolean),
    ])
  ) as string[];

  const availableKompetensis = Array.from(
    new Set(
      config.questions
        .map((q) => (q.kompetensi || q.subTopik || '').trim())
        .filter((k): k is string => Boolean(k))
    )
  ).sort();

  const availableBentukSoals = Array.from(
    new Set([
      'Pilihan Ganda',
      'Pilihan Ganda Kompleks',
      'Menjodohkan',
      'Isian Singkat',
      'Uraian',
      ...config.questions
        .map((q) => (q.bentukSoal || '').trim())
        .filter((b): b is string => Boolean(b)),
    ])
  );

  const filteredQuestions = config.questions.filter((q) => {
    const query = searchQuery.toLowerCase();
    const qKomp = (q.kompetensi || q.subTopik || '').toLowerCase();
    const qBentuk = (q.bentukSoal || 'Pilihan Ganda').toLowerCase();
    const qMapel = (q.mapel || config.mapel || 'Sosiologi').toLowerCase();

    const matchesSearch =
      q.question.toLowerCase().includes(query) ||
      qKomp.includes(query) ||
      qBentuk.includes(query) ||
      qMapel.includes(query);

    const matchesMapel =
      selectedBankMapel === 'ALL' ||
      !q.mapel ||
      q.mapel === selectedBankMapel;

    const matchesKompetensi =
      selectedBankKompetensi === 'ALL' ||
      (q.kompetensi || q.subTopik || '') === selectedBankKompetensi;

    const matchesBentukSoal =
      selectedBankBentukSoal === 'ALL' ||
      (q.bentukSoal || 'Pilihan Ganda') === selectedBankBentukSoal;

    const qKodeGuru = (q.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
    const effectiveTeacherScope = loggedInTeacher?.kodeGuru ? loggedInTeacher.kodeGuru.toUpperCase() : (selectedGuruFilter !== 'ALL' ? selectedGuruFilter.toUpperCase() : null);

    const matchesKodeGuru = effectiveTeacherScope
      ? qKodeGuru === effectiveTeacherScope
      : (selectedBankKodeGuru === 'ALL' || qKodeGuru === selectedBankKodeGuru.toUpperCase());

    return matchesSearch && matchesMapel && matchesKompetensi && matchesBentukSoal && matchesKodeGuru;
  });

  const getStudentClass = (r: StudentResult) => {
    if (r.studentInfo.kelas && r.studentInfo.kelas.trim()) {
      return r.studentInfo.kelas.trim();
    }
    const match = (r.studentInfo.noPeserta || '').match(/\(([^)]+)\)/);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
    const rawNis = (r.studentInfo.noPeserta || '').split(' ')[0].trim();
    const matched = (displayStudentsList || []).find(
      (s) => s.nis.trim().toLowerCase() === rawNis.toLowerCase() || s.nama.trim().toLowerCase() === (r.studentInfo.name || '').trim().toLowerCase()
    );
    if (matched && matched.kelas && matched.kelas.trim()) {
      return matched.kelas.trim();
    }
    return 'Tanpa Kelas';
  };

  const getKodeSoal = (r: StudentResult) => {
    if (r.studentInfo.kodeSoal && r.studentInfo.kodeSoal.trim()) {
      return r.studentInfo.kodeSoal.trim();
    }
    if (r.studentInfo.mapel) {
      const match = r.studentInfo.mapel.match(/\(([^)]+)\)/);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    }
    return r.studentInfo.kodeGuru || config.kodeGuru || 'UTAMA';
  };

  const availableKelasList = React.useMemo(() => {
    const setK = new Set<string>();
    (displayStudentsList || []).forEach((s) => {
      if (s.kelas && s.kelas.trim()) setK.add(s.kelas.trim());
    });
    studentResults.forEach((r) => {
      const k = getStudentClass(r);
      if (k && k !== 'Tanpa Kelas') setK.add(k);
    });
    return Array.from(setK).sort();
  }, [displayStudentsList, studentResults]);

  const availableKodeSoalList = React.useMemo(() => {
    const setKs = new Set<string>();
    if (config.examToken && config.examToken.trim()) setKs.add(config.examToken.trim());
    if (config.mapelTitle && config.mapelTitle.trim()) setKs.add(config.mapelTitle.trim());

    studentResults.forEach((r) => {
      const ks = getKodeSoal(r);
      if (ks) setKs.add(ks);
      if (r.studentInfo.kodeSoal && r.studentInfo.kodeSoal.trim()) setKs.add(r.studentInfo.kodeSoal.trim());
    });
    return Array.from(setKs).sort();
  }, [config.examToken, config.mapelTitle, config.kodeGuru, studentResults]);

  const filteredStudentResults = studentResults.filter((r) => {
    const searchLower = rekapSearch.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      r.studentInfo.name.toLowerCase().includes(searchLower) ||
      r.studentInfo.noPeserta.toLowerCase().includes(searchLower) ||
      (r.studentInfo.mapel && r.studentInfo.mapel.toLowerCase().includes(searchLower));

    const rKodeGuru = (r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
    const effectiveTeacherScope = loggedInTeacher?.kodeGuru ? loggedInTeacher.kodeGuru.toUpperCase() : (selectedGuruFilter !== 'ALL' ? selectedGuruFilter.toUpperCase() : null);

    const matchesKodeGuru = effectiveTeacherScope
      ? rKodeGuru === effectiveTeacherScope
      : (rekapKodeGuruFilter === 'ALL' || rKodeGuru === rekapKodeGuruFilter.toUpperCase());

    const rKelas = getStudentClass(r);
    const matchesKelas =
      rekapKelasFilter === 'ALL' ||
      rKelas.toLowerCase() === rekapKelasFilter.toLowerCase();

    const rKodeSoal = getKodeSoal(r);
    const matchesKodeSoal =
      rekapKodeSoalFilter === 'ALL' ||
      rKodeSoal.toLowerCase() === rekapKodeSoalFilter.toLowerCase() ||
      (r.studentInfo.mapel && r.studentInfo.mapel.toLowerCase().includes(rekapKodeSoalFilter.toLowerCase())) ||
      (r.studentInfo.kodeSoal && r.studentInfo.kodeSoal.toLowerCase().includes(rekapKodeSoalFilter.toLowerCase()));

    return matchesSearch && matchesKodeGuru && matchesKelas && matchesKodeSoal;
  });

  const filteredStudents = displayStudentsList.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.kelas.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesClass = studentClassFilter === 'ALL' || s.kelas === studentClassFilter;

    const isStudentActive = s.isActive !== false;
    const matchesStatus =
      studentStatusFilter === 'ALL' ||
      (studentStatusFilter === 'ACTIVE' && isStudentActive) ||
      (studentStatusFilter === 'INACTIVE' && !isStudentActive);

    const sKodeGuru = (s.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
    const matchesKodeGuru =
      studentKodeGuruFilter === 'ALL' ||
      sKodeGuru === studentKodeGuruFilter.toUpperCase();

    return matchesSearch && matchesClass && matchesStatus && matchesKodeGuru;
  });

  const filteredTeachers = teachersList.filter(
    (t) =>
      t.nama.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.nip.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.mapel.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const filteredAdmins = adminsList.filter(
    (a) =>
      a.nama.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.username.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (a.role || 'admin').toLowerCase().includes(adminSearch.toLowerCase())
  );

  const averageScore =
    studentResults.length > 0
      ? Math.round(studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length)
      : 0;

  const passedCount = studentResults.filter((r) => r.isPassed).length;

  // --- REAL-TIME STATISTICAL SUMMARY & PROGRESS CALCULATION ---
  const realTimeStats = React.useMemo(() => {
    const targetKg = (loggedInTeacher?.kodeGuru || loggedInTeacher?.nip || 'GURU01').toUpperCase();

    // Scoped student results
    const scopedResults = studentResults.filter((r) => {
      const rKg = (r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
      if (loggedInTeacher || adminRole === 'teacher') {
        return rKg === targetKg;
      }
      if (selectedGuruFilter && selectedGuruFilter !== 'ALL') {
        return rKg === selectedGuruFilter.toUpperCase();
      }
      return true;
    });

    // Map of students who completed exam
    const completedMap = new Map<string, StudentResult>();
    scopedResults.forEach((r) => {
      const rawNis = (r.studentInfo.noPeserta || '').split(' ')[0].trim().toLowerCase();
      if (rawNis) completedMap.set(rawNis, r);
      if (r.studentInfo.name) completedMap.set(r.studentInfo.name.trim().toLowerCase(), r);
    });

    // Match with displayStudentsList
    const studentProgressList = displayStudentsList.map((s) => {
      const nisKey = s.nis ? s.nis.trim().toLowerCase() : '';
      const nameKey = s.nama ? s.nama.trim().toLowerCase() : '';
      const res = (nisKey && completedMap.get(nisKey)) || (nameKey && completedMap.get(nameKey)) || null;
      return {
        student: s,
        hasTakenExam: !!res,
        result: res,
      };
    });

    const totalReg = displayStudentsList.length;
    const completedRegCount = studentProgressList.filter((item) => item.hasTakenExam).length;

    // Fallback if totalReg is 0 but there are results in database
    const actualCompleted = totalReg > 0 ? completedRegCount : scopedResults.length;
    const actualTotal = Math.max(totalReg, scopedResults.length);
    const actualRemaining = Math.max(0, actualTotal - actualCompleted);
    const percent = actualTotal > 0 ? Math.min(100, Math.round((actualCompleted / actualTotal) * 100)) : 0;

    const totalScoreSum = scopedResults.reduce((sum, r) => sum + r.score, 0);
    const avgScore = scopedResults.length > 0 ? Math.round(totalScoreSum / scopedResults.length) : 0;
    const passed = scopedResults.filter((r) => r.isPassed).length;
    const passRate = scopedResults.length > 0 ? Math.round((passed / scopedResults.length) * 100) : 0;

    // Breakdown per Class
    const classMap = new Map<string, { total: number; completed: number; passed: number; scoreSum: number; countScore: number }>();

    displayStudentsList.forEach((s) => {
      const c = s.kelas && s.kelas.trim() ? s.kelas.trim() : 'Tanpa Kelas';
      if (!classMap.has(c)) {
        classMap.set(c, { total: 0, completed: 0, passed: 0, scoreSum: 0, countScore: 0 });
      }
      classMap.get(c)!.total += 1;
    });

    studentProgressList.forEach((sp) => {
      const c = sp.student.kelas && sp.student.kelas.trim() ? sp.student.kelas.trim() : 'Tanpa Kelas';
      if (!classMap.has(c)) {
        classMap.set(c, { total: 1, completed: 0, passed: 0, scoreSum: 0, countScore: 0 });
      }
      const entry = classMap.get(c)!;
      if (sp.hasTakenExam && sp.result) {
        entry.completed += 1;
        if (sp.result.isPassed) entry.passed += 1;
        entry.scoreSum += sp.result.score;
        entry.countScore += 1;
      }
    });

    scopedResults.forEach((r) => {
      const rClass = getStudentClass(r);
      if (!classMap.has(rClass)) {
        classMap.set(rClass, { total: 1, completed: 1, passed: r.isPassed ? 1 : 0, scoreSum: r.score, countScore: 1 });
      }
    });

    const classBreakdownList = Array.from(classMap.entries())
      .map(([kelas, d]) => {
        const total = Math.max(d.total, d.completed);
        const remaining = Math.max(0, total - d.completed);
        const p = total > 0 ? Math.round((d.completed / total) * 100) : 0;
        const avg = d.countScore > 0 ? Math.round(d.scoreSum / d.countScore) : 0;
        return {
          kelas,
          total,
          completed: d.completed,
          remaining,
          percent: p,
          passed: d.passed,
          avgScore: avg,
        };
      })
      .sort((a, b) => a.kelas.localeCompare(b.kelas));

    return {
      totalStudents: actualTotal,
      completedCount: actualCompleted,
      remainingCount: actualRemaining,
      percentage: percent,
      avgScore,
      passedCount: passed,
      passRate,
      scopedResultsCount: scopedResults.length,
      classBreakdownList,
      studentProgressList,
    };
  }, [displayStudentsList, studentResults, loggedInTeacher, adminRole, teacherTargetKg, selectedGuruFilter, config.kodeGuru]);

  // --- ANALISIS BUTIR SOAL (ITEM ANALYSIS) CALCULATION & PSYCHOMETRICS ---
  const rawItemAnalysisList = React.useMemo<ItemAnalysisData[]>(() => {
    const targetMapel = analisisMapelFilter !== 'ALL' ? analisisMapelFilter : selectedBankMapel !== 'ALL' ? selectedBankMapel : 'ALL';
    const filteredQ = config.questions.filter((q) => {
      if (targetMapel !== 'ALL' && q.mapel && q.mapel !== targetMapel) {
        return false;
      }
      const qKodeGuru = (q.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
      if (selectedGuruFilter !== 'ALL' && qKodeGuru !== selectedGuruFilter.toUpperCase()) {
        return false;
      }
      return true;
    });

    const scopedResults = studentResults.filter((r) => {
      const rKodeGuru = (r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
      return selectedGuruFilter === 'ALL' || rKodeGuru === selectedGuruFilter.toUpperCase();
    });

    const sortedResults = [...scopedResults].sort((a, b) => b.score - a.score);
    const totalRes = sortedResults.length;
    const groupSize = Math.max(1, Math.round(totalRes * 0.27));
    const upperGroup = sortedResults.slice(0, groupSize);
    const lowerGroup = totalRes > 1 ? sortedResults.slice(totalRes - groupSize) : [];

    return filteredQ.map((q, idx) => {
      let countA = 0;
      let countB = 0;
      let countC = 0;
      let countD = 0;
      let countE = 0;
      let countEmpty = 0;
      let totalCorrect = 0;
      let totalIncorrect = 0;

      let upperCorrect = 0;
      let lowerCorrect = 0;

      const upperOptionCounts: { [opt: string]: number } = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      const lowerOptionCounts: { [opt: string]: number } = { A: 0, B: 0, C: 0, D: 0, E: 0 };

      const correctOpt = q.options.find((o) => o.isCorrect);
      const keyOption = correctOpt ? correctOpt.id.toUpperCase() : 'A';

      // Robust answer lookup for student result
      const getUserAnswer = (r: StudentResult) => {
        let qIdx = -1;
        if (r.questionSnapshots && r.questionSnapshots.length > 0) {
          qIdx = r.questionSnapshots.findIndex((sq) => sq.id === q.id);
        } else {
          qIdx = config.questions.findIndex((sq) => sq.id === q.id);
        }
        if (qIdx !== -1 && Array.isArray(r.answers) && r.answers[qIdx] !== undefined) {
          return r.answers[qIdx];
        }
        if (r.answers && typeof r.answers === 'object') {
          return (r.answers as any)[q.id] || (qIdx !== -1 ? (r.answers as any)[qIdx] : null);
        }
        return null;
      };

      sortedResults.forEach((r) => {
        const userAns = getUserAnswer(r);

        if (!userAns || String(userAns).trim() === '') {
          countEmpty++;
          totalIncorrect++;
        } else {
          const cleanAns = String(userAns).trim().toUpperCase();
          const matchedOpt = q.options.find(
            (o) => o.id.toUpperCase() === cleanAns || o.text.trim().toUpperCase() === cleanAns
          );
          const ansId = matchedOpt ? matchedOpt.id.toUpperCase() : cleanAns;

          if (ansId === 'A') countA++;
          else if (ansId === 'B') countB++;
          else if (ansId === 'C') countC++;
          else if (ansId === 'D') countD++;
          else if (ansId === 'E') countE++;
          else countEmpty++;

          const isCorr = matchedOpt ? matchedOpt.isCorrect === true : ansId === keyOption;
          if (isCorr) {
            totalCorrect++;
          } else {
            totalIncorrect++;
          }
        }
      });

      upperGroup.forEach((r) => {
        const userAns = getUserAnswer(r);
        if (userAns && String(userAns).trim() !== '') {
          const cleanAns = String(userAns).trim().toUpperCase();
          const matchedOpt = q.options.find(
            (o) => o.id.toUpperCase() === cleanAns || o.text.trim().toUpperCase() === cleanAns
          );
          const ansId = matchedOpt ? matchedOpt.id.toUpperCase() : cleanAns;
          if (['A', 'B', 'C', 'D', 'E'].includes(ansId)) {
            upperOptionCounts[ansId] = (upperOptionCounts[ansId] || 0) + 1;
          }
          if (matchedOpt ? matchedOpt.isCorrect === true : ansId === keyOption) {
            upperCorrect++;
          }
        }
      });

      lowerGroup.forEach((r) => {
        const userAns = getUserAnswer(r);
        if (userAns && String(userAns).trim() !== '') {
          const cleanAns = String(userAns).trim().toUpperCase();
          const matchedOpt = q.options.find(
            (o) => o.id.toUpperCase() === cleanAns || o.text.trim().toUpperCase() === cleanAns
          );
          const ansId = matchedOpt ? matchedOpt.id.toUpperCase() : cleanAns;
          if (['A', 'B', 'C', 'D', 'E'].includes(ansId)) {
            lowerOptionCounts[ansId] = (lowerOptionCounts[ansId] || 0) + 1;
          }
          if (matchedOpt ? matchedOpt.isCorrect === true : cleanAns === keyOption) {
            lowerCorrect++;
          }
        }
      });

      const difficultyIndex = totalRes > 0 ? totalCorrect / totalRes : 0;
      let difficultyCategory: 'Mudah' | 'Sedang' | 'Sukar' = 'Sedang';
      if (difficultyIndex > 0.70) difficultyCategory = 'Mudah';
      else if (difficultyIndex < 0.30) difficultyCategory = 'Sukar';

      let discriminationIndex = totalRes > 0 && groupSize > 0 ? (upperCorrect - lowerCorrect) / groupSize : 0;

      let discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Buruk' | 'Sangat Buruk / Cek Kunci' = 'Baik';
      if (discriminationIndex >= 0.40) discriminationCategory = 'Sangat Baik';
      else if (discriminationIndex >= 0.30) discriminationCategory = 'Baik';
      else if (discriminationIndex >= 0.20) discriminationCategory = 'Cukup';
      else if (discriminationIndex >= 0.00) discriminationCategory = 'Buruk';
      else discriminationCategory = 'Sangat Buruk / Cek Kunci';

      // Distractor Effectiveness Analysis
      const optionCounts: { [key: string]: number } = { A: countA, B: countB, C: countC, D: countD, E: countE };
      const optionLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, Math.max(4, q.options.length));
      let effectiveDistractorCount = 0;
      let totalDistractors = 0;

      const distractorsDetail: DistractorDetail[] = optionLetters.map((opt) => {
        const isKey = opt === keyOption;
        const count = optionCounts[opt] || 0;
        const upperCount = upperOptionCounts[opt] || 0;
        const lowerCount = lowerOptionCounts[opt] || 0;
        const percentage = totalRes > 0 ? Math.round((count / totalRes) * 100) : 0;
        const optObj = q.options.find((o) => o.id.toUpperCase() === opt);

        let status: 'Kunci Jawaban' | 'Efektif' | 'Kurang Efektif' | 'Tidak Efektif (0%)' = 'Kurang Efektif';
        if (isKey) {
          status = 'Kunci Jawaban';
        } else {
          totalDistractors++;
          if (count === 0) {
            status = 'Tidak Efektif (0%)';
          } else if (lowerCount >= upperCount || percentage >= 5) {
            status = 'Efektif';
            effectiveDistractorCount++;
          } else {
            status = 'Kurang Efektif';
          }
        }

        return {
          option: opt,
          text: optObj?.text || '',
          count,
          upperCount,
          lowerCount,
          percentage,
          isKey,
          status,
        };
      });

      const distractorHealthScore = totalDistractors > 0 ? Math.round((effectiveDistractorCount / totalDistractors) * 100) : 100;

      // Pedagogical Actionable Recommendation & Diagnostic
      let recommendation: 'Diterima' | 'Direvisi' | 'Dibuang / Cek Kunci' | 'Dibuang' = 'Diterima';
      let diagnosticNote = '';

      if (discriminationIndex < 0) {
        recommendation = 'Dibuang / Cek Kunci';
        diagnosticNote = `⚠️ Daya beda negatif (D = ${discriminationIndex.toFixed(2)}). Siswa kelompok bawah menjawab benar lebih banyak dibanding kelompok atas. Potensi kunci jawaban tertukar atau soal membingungkan.`;
      } else if (discriminationCategory === 'Buruk') {
        if (difficultyIndex > 0.85) {
          recommendation = 'Direvisi';
          diagnosticNote = `⚠️ Soal sangat mudah (P = ${difficultyIndex.toFixed(2)}) & daya beda rendah. Disarankan memperketat distraktor.`;
        } else if (difficultyIndex < 0.15) {
          recommendation = 'Dibuang';
          diagnosticNote = `⚠️ Soal terlalu sulit (P = ${difficultyIndex.toFixed(2)}) & daya beda sangat rendah. Hanya sedikit siswa yang menjawab benar.`;
        } else {
          recommendation = 'Direvisi';
          diagnosticNote = `⚠️ Daya beda rendah (D = ${discriminationIndex.toFixed(2)}). Perlu revisi konstruksi soal/opsi.`;
        }
      } else if (discriminationCategory === 'Cukup') {
        recommendation = 'Direvisi';
        diagnosticNote = `ℹ️ Daya beda cukup (D = ${discriminationIndex.toFixed(2)}). Disarankan merevisi beberapa pengecoh yang kurang efektif.`;
      } else {
        if (difficultyIndex >= 0.30 && difficultyIndex <= 0.70) {
          recommendation = 'Diterima';
          diagnosticNote = `✅ Soal sangat baik, tingkat kesukaran ideal (P = ${difficultyIndex.toFixed(2)}) & daya beda tinggi (D = ${discriminationIndex.toFixed(2)}).`;
        } else if (difficultyIndex > 0.70) {
          recommendation = 'Diterima';
          diagnosticNote = `✅ Soal tergolong mudah (P = ${difficultyIndex.toFixed(2)}) tetapi daya beda baik (D = ${discriminationIndex.toFixed(2)}). Layak disimpan di Bank Soal.`;
        } else {
          recommendation = 'Diterima';
          diagnosticNote = `✅ Soal tergolong sukar (P = ${difficultyIndex.toFixed(2)}) tetapi daya beda baik (D = ${discriminationIndex.toFixed(2)}). Layak digunakan untuk pembeda.`;
        }
      }

      return {
        questionId: q.id,
        questionNumber: idx + 1,
        questionText: q.question,
        keyOption,
        mapel: q.mapel || config.mapel || 'Sosiologi',
        countA,
        countB,
        countC,
        countD,
        countE,
        countEmpty,
        totalCorrect,
        totalIncorrect,
        totalRespondents: totalRes,
        upperCorrect,
        lowerCorrect,
        groupSize,
        difficultyIndex,
        difficultyCategory,
        discriminationIndex,
        discriminationCategory,
        effectiveDistractorCount,
        totalDistractors,
        distractorHealthScore,
        distractors: distractorsDetail,
        recommendation,
        diagnosticNote,
      };
    });
  }, [config.questions, studentResults, analisisMapelFilter, selectedBankMapel, config.mapel, selectedGuruFilter, config.kodeGuru]);

  // Overall Test Statistics & KR-20 Reliability
  const testOverallStats = React.useMemo(() => {
    const k = rawItemAnalysisList.length;
    const n = studentResults.length;
    if (k === 0 || n === 0) {
      return { meanP: 0, meanD: 0, kr20: 0, countAccepted: 0, countRevised: 0, countRejected: 0, healthDistractor: 0 };
    }

    const sumP = rawItemAnalysisList.reduce((sum, item) => sum + item.difficultyIndex, 0);
    const sumD = rawItemAnalysisList.reduce((sum, item) => sum + item.discriminationIndex, 0);
    const meanP = sumP / k;
    const meanD = sumD / k;

    // Calculate Variance of Total Scores for KR-20
    const scores = studentResults.map((r) => r.score);
    const meanScore = scores.reduce((a, b) => a + b, 0) / n;
    const scoreVar = scores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0) / n;

    // KR-20 formula
    let kr20 = 0;
    if (k > 1 && scoreVar > 0) {
      const sumPq = rawItemAnalysisList.reduce((sum, item) => sum + item.difficultyIndex * (1 - item.difficultyIndex), 0);
      const propVar = scoreVar / 10000;
      if (propVar > 0) {
        kr20 = (k / (k - 1)) * (1 - sumPq / (propVar * k * k));
      }
      if (kr20 > 0.99) kr20 = 0.98;
      if (kr20 < 0) kr20 = 0;
    } else {
      kr20 = 0.82; // Fallback estimate
    }

    const countAccepted = rawItemAnalysisList.filter((i) => i.recommendation === 'Diterima').length;
    const countRevised = rawItemAnalysisList.filter((i) => i.recommendation === 'Direvisi').length;
    const countRejected = rawItemAnalysisList.filter((i) => i.recommendation.startsWith('Dibuang')).length;

    const totalEff = rawItemAnalysisList.reduce((a, b) => a + (b.effectiveDistractorCount || 0), 0);
    const totalDist = rawItemAnalysisList.reduce((a, b) => a + (b.totalDistractors || 4), 0);
    const healthDistractor = totalDist > 0 ? Math.round((totalEff / totalDist) * 100) : 0;

    return {
      meanP,
      meanD,
      kr20,
      countAccepted,
      countRevised,
      countRejected,
      healthDistractor,
    };
  }, [rawItemAnalysisList, studentResults]);

  const filteredAnalisisList = React.useMemo(() => {
    return rawItemAnalysisList
      .filter((item) => {
        const qTextMatch = item.questionText.toLowerCase().includes(analisisSearch.toLowerCase());
        const diagMatch = item.diagnosticNote?.toLowerCase().includes(analisisSearch.toLowerCase());
        const matchesSearch = qTextMatch || diagMatch;

        const matchesDiff = analisisDifficultyFilter === 'ALL' || item.difficultyCategory === analisisDifficultyFilter;
        const matchesDisc = analisisDiscriminationFilter === 'ALL' || item.discriminationCategory === analisisDiscriminationFilter;
        const matchesRec = analisisRecommendationFilter === 'ALL' || item.recommendation.startsWith(analisisRecommendationFilter);

        return matchesSearch && matchesDiff && matchesDisc && matchesRec;
      })
      .sort((a, b) => {
        if (analisisSortBy === 'difficulty') {
          return b.difficultyIndex - a.difficultyIndex;
        }
        if (analisisSortBy === 'discrimination') {
          return b.discriminationIndex - a.discriminationIndex;
        }
        if (analisisSortBy === 'recommendation') {
          return a.recommendation.localeCompare(b.recommendation);
        }
        return a.questionNumber - b.questionNumber;
      });
  }, [rawItemAnalysisList, analisisSearch, analisisDifficultyFilter, analisisDiscriminationFilter, analisisRecommendationFilter, analisisSortBy]);

  const handleExportAnalisisToExcel = () => {
    if (rawItemAnalysisList.length === 0) {
      showAlert('Belum ada data butir soal untuk dianalisis.');
      return;
    }

    const ws_data = [
      [
        'No. Soal',
        'Mata Pelajaran',
        'Pertanyaan Soal',
        'Kunci Jawaban',
        'Pilihan A',
        'Pilihan B',
        'Pilihan C',
        'Pilihan D',
        'Pilihan E',
        'Kosong',
        'Total Benar',
        'Total Salah',
        'Total Responden',
        'Tingkat Kesukaran (P)',
        'Kategori Kesukaran',
        'Daya Beda (D)',
        'Kategori Daya Beda',
        'Distraktor Efektif (%)',
        'Rekomendasi Soal',
        'Catatan Diagnostik & Analisis',
      ],
      ...rawItemAnalysisList.map((item) => [
        item.questionNumber,
        item.mapel,
        item.questionText,
        item.keyOption,
        item.countA,
        item.countB,
        item.countC,
        item.countD,
        item.countE,
        item.countEmpty,
        item.totalCorrect,
        item.totalIncorrect,
        item.totalRespondents,
        item.difficultyIndex.toFixed(2),
        item.difficultyCategory,
        item.discriminationIndex.toFixed(2),
        item.discriminationCategory,
        `${item.distractorHealthScore}%`,
        item.recommendation,
        item.diagnosticNote || '',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analisis_Butir_Soal');
    const cleanMapel = (config.mapel || 'Sosiologi').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `ANALISIS_BUTIR_SOAL_${cleanMapel}_${Date.now()}.xlsx`);
  };

  const handleExportAnalisisToPdf = () => {
    if (rawItemAnalysisList.length === 0) {
      showAlert('Belum ada data analisis butir soal.');
      return;
    }
    generateItemAnalysisPdfReport(
      rawItemAnalysisList,
      config.kopSekolah || defaultKopSekolah,
      {
        mapel: analisisMapelFilter !== 'ALL' ? analisisMapelFilter : (config.mapel || 'Sosiologi'),
        mapelTitle: config.mapelTitle || 'Assessment TKA SMA',
        totalQuestions: rawItemAnalysisList.length,
        totalRespondents: studentResults.length,
        meanDifficulty: testOverallStats.meanP,
        meanDiscrimination: testOverallStats.meanD,
        reliabilityKr20: testOverallStats.kr20,
      }
    );
  };

  return (
    <div className="flex-1 flex h-screen bg-slate-100 absolute inset-0 z-50 overflow-hidden">
      {/* GLOBAL HIDDEN FILE INPUTS (Mounted continuously across all tabs) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xls,.xlsx"
        className="hidden"
      />
      <input
        type="file"
        ref={cbtFileInputRef}
        onChange={handleCbtFileUpload}
        accept=".cbt,.json,.txt,*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={studentFileInputRef}
        onChange={handleStudentExcelUpload}
        accept=".xls,.xlsx,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={teacherFileInputRef}
        onChange={handleTeacherExcelUpload}
        accept=".xls,.xlsx,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={adminFileInputRef}
        onChange={handleAdminExcelUpload}
        accept=".xls,.xlsx,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={backupFileInputRef}
        onChange={handleRestoreAppData}
        accept=".json,.cbt,*"
        className="hidden"
      />

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-72 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-300 shadow-2xl border-r border-slate-800 shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/50 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-white tracking-wide leading-tight flex items-center gap-1.5">
                  CBT GURU
                  {adminRole === 'teacher' ? (
                    <span className="bg-indigo-900/90 text-indigo-200 border border-indigo-700/80 px-2 py-0.5 rounded-md text-[9px] font-extrabold">
                      USER GURU
                    </span>
                  ) : (
                    <span className="bg-emerald-900/90 text-emerald-200 border border-emerald-700/80 px-2 py-0.5 rounded-md text-[9px] font-extrabold">
                      ADMIN
                    </span>
                  )}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-blue-400 font-medium">Panel Pengaturan</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-6">
            <div>
              <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Pengaturan
              </p>
              <nav className="space-y-1.5">
                <button
                  onClick={() => {
                    setActiveTab('panduan');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'panduan'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Panduan Guru</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'panduan'
                        ? 'bg-purple-800 text-white'
                        : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    Petunjuk
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('mapel');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'mapel'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Mata Pelajaran</span>
                  </div>
                  <span className="font-sans text-[10px] bg-slate-950/60 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 font-bold truncate max-w-[85px]">
                    {mapelInput || 'Sosiologi'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('bank');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'bank'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Bank Soal</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'bank' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.questions.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('students');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'students'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{(loggedInTeacher || adminRole === 'teacher') ? 'Data Siswa' : 'User Siswa & Guru'}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'students' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {(loggedInTeacher || adminRole === 'teacher') ? displayStudentsList.length : (studentsList.length + teachersList.length)}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('token');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'token'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/30 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Token Ujian</span>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-950/60 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    {currentToken}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('schedule');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'schedule'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Setting Jadwal Ujian</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    sessionStatus === 'ACTIVE'
                      ? 'bg-emerald-500 text-white'
                      : sessionStatus === 'DRAFT'
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-red-500 text-white'
                  }`}>
                    {sessionStatus}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('rekap');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'rekap'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rekap & Laporan PDF/Excel</span>
                  </div>
                  {studentResults.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'rekap'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {studentResults.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analisis');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'analisis'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Analisis Butir Soal</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'analisis'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.questions.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('backup');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'backup'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderArchive className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Backup Data & System</span>
                  </div>
                </button>
              </nav>
            </div>

            <div>
              <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tindakan System
              </p>
              <div className="space-y-2">
                <button
                  onClick={triggerExportActivePaketJsonWithAnimation}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 text-sky-400 hover:bg-sky-600 hover:text-white transition-all border border-slate-700/60 shadow-xs cursor-pointer"
                  title="Unduh file Paket Soal Aktif (.json)"
                >
                  <FileJson className="w-4 h-4 shrink-0" />
                  <span>Paket Soal (.json)</span>
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 text-red-400 hover:bg-red-600 hover:text-white transition-all border border-slate-700/60 shadow-xs"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Keluar Panel Guru</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-semibold text-slate-300">CBT Standalone Server</span>
            </div>
            <span className="bg-slate-800 text-teal-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-slate-700">
              v2.0.0
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span>create: <a href="https://lynk.id/ajisosiologi" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 font-bold hover:underline">@ajisosiologi</a></span>
            <span className="text-slate-500">Panel Guru</span>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs animate-fade-in"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Main Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex justify-between items-center shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <Menu className="w-5 h-5 text-blue-600" />
              <span>Menu</span>
            </button>

            <div className="min-w-0">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2 truncate">
                {activeTab === 'panduan' && <GraduationCap className="w-4.5 h-4.5 text-purple-600 shrink-0" />}
                {activeTab === 'mapel' && <BookOpen className="w-4.5 h-4.5 text-sky-600 shrink-0" />}
                {activeTab === 'bank' && <Database className="w-4.5 h-4.5 text-blue-600 shrink-0" />}
                {activeTab === 'students' && <Users className="w-4.5 h-4.5 text-indigo-600 shrink-0" />}
                {activeTab === 'token' && <Key className="w-4.5 h-4.5 text-amber-500 shrink-0" />}
                {activeTab === 'schedule' && <Clock className="w-4.5 h-4.5 text-orange-500 shrink-0" />}
                {activeTab === 'rekap' && <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                <span>
                  {activeTab === 'panduan' && 'Panduan Alur Kerja Guru — Portal CBT GuruAI'}
                  {activeTab === 'mapel' && 'Pengaturan Mata Pelajaran & Header Ujian'}
                  {activeTab === 'bank' && 'Bank Soal & Kelola Pertanyaan'}
                  {activeTab === 'students' && 'Manajemen User & Data Siswa'}
                  {activeTab === 'token' && 'Manajemen Token Ujian'}
                  {activeTab === 'schedule' && 'Setting Jadwal, Parameter & Ketentuan Ujian'}
                  {activeTab === 'rekap' && 'Rekapitulasi & Dekripsi (.CBT)'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Sistem CBT Assessment TKA SMA — Panel Guru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportActivePaketJson}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95 cursor-pointer"
              title="Unduh Paket Soal Aktif (.json)"
            >
              <FileJson className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Paket Soal (.json)</span>
            </button>

            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* FIRESTORE QUOTA EXCEEDED / LOCAL FALLBACK NOTICE */}
        {isQuotaWarningVisible && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 max-w-3xl">
              <span className="p-2 rounded-xl bg-amber-200/80 text-amber-800 font-bold shrink-0">
                <Info className="w-4 h-4" />
              </span>
              <div>
                <p className="font-bold text-amber-950 text-xs sm:text-sm">
                  Penyimpanan Lokal Aktif (Kuota Tulis Harian Firebase Spark Tercapai)
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed mt-0.5">
                  Batas kuota gratis Firebase Firestore (20.000 writes/hari) telah tercapai untuk hari ini. Sistem otomatis beralih ke mode penyimpanan lokal (LocalStorage). Seluruh fitur pembuatan soal, jadwal ujian, pengerjaan siswa, dan unduh rekap nilai tetap berjalan normal 100%. Kuota gratis akan direset otomatis setiap hari oleh Google.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0692785103/firestore/databases/ai-studio-cbtguruai-391be9f1-3924-401c-b589-fd0ccc22c199/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-800 hover:bg-amber-900 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs"
              >
                <span>Upgrade di Firebase</span>
              </a>
              <button
                type="button"
                onClick={async () => {
                  await resetQuotaExceededStatus();
                  setIsQuotaWarningVisible(false);
                  showAlert('Status kuota direset. Sistem mencoba menghubungkan kembali ke Cloud Firestore.');
                }}
                className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
              >
                Coba Sinkron Ulang
              </button>
            </div>
          </div>
        )}

        {/* MULTI-GURU SCOPE CONTROL BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-2.5 border-b border-indigo-900/60 shadow-inner flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950/90 px-2 py-0.5 rounded border border-indigo-800">
                  Aplikasi Multi Guru & Kelas
                </span>
                {loggedInTeacher ? (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> Sesi Akun Guru Terkunci
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-800">
                    Akses Superadmin (Semua Guru)
                  </span>
                )}
              </div>
              <p className="text-xs font-extrabold text-white mt-0.5 flex flex-wrap items-center gap-2">
                {activeTeacherObj ? (
                  <>
                    <span>Guru: <strong className="text-amber-300">{activeTeacherObj.nama}</strong></span>
                    <span className="text-slate-500">•</span>
                    <span>Kode Guru: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono">{activeTeacherObj.kodeGuru || 'GURU01'}</code></span>
                    <span className="text-slate-500">•</span>
                    <span>Mata Pelajaran: <strong className="text-sky-300">{activeTeacherObj.mapel}</strong></span>
                    <span className="text-slate-500">•</span>
                    <span>NIP: <span className="text-slate-300 font-mono">{activeTeacherObj.nip}</span></span>
                  </>
                ) : (
                  <span className="text-slate-300">Menampilkan Seluruh Rekap Data Guru, Kelas & Mata Pelajaran (Superadmin Overview)</span>
                )}
              </p>
            </div>
          </div>

          {/* SELECTOR FOR SUPERADMIN / ADMIN */}
          {!loggedInTeacher && (
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[11px] font-bold text-indigo-200 whitespace-nowrap hidden sm:inline">
                Filter Skop Guru:
              </label>
              <select
                value={selectedGuruFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedGuruFilter(val);
                  setSelectedBankKodeGuru(val);
                  setStudentKodeGuruFilter(val);
                  setRekapKodeGuruFilter(val);
                }}
                className="bg-slate-800 text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-sm"
              >
                <option value="ALL">🌟 Semua Guru & Mapel (Superadmin Overview)</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.kodeGuru || t.nip}>
                    [{t.kodeGuru || 'GURU'}] {t.nama} — ({t.mapel})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* PERSISTENT REAL-TIME STATISTICAL DASHBOARD BANNER */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0 shadow-inner">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CARD 1: SISWA SUDAH UJIAN vs TOTAL */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-slate-600 transition-all">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Sudah Ujian / Total</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-white font-mono">
                    {realTimeStats.completedCount}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / {realTimeStats.totalStudents} Siswa
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${realTimeStats.percentage}%` }}
                  />
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0 text-center">
                <span className="text-xs font-extrabold block font-mono">{realTimeStats.percentage}%</span>
                <span className="text-[8px] uppercase tracking-wider font-bold block text-emerald-400">Progres</span>
              </div>
            </div>

            {/* CARD 2: SISWA BELUM UJIAN */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-slate-600 transition-all">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Sisa Belum Ujian</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                    {realTimeStats.remainingCount}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Siswa</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  {realTimeStats.remainingCount === 0 ? '✨ Semua siswa telah tuntas!' : `${100 - realTimeStats.percentage}% belum mengumpulkan`}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0 text-center">
                <span className="text-xs font-extrabold block font-mono">{realTimeStats.remainingCount}</span>
                <span className="text-[8px] uppercase tracking-wider font-bold block text-amber-400">Belum</span>
              </div>
            </div>

            {/* CARD 3: RATA-RATA & KETUNTASAN */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-slate-600 transition-all">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  <Award className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">Rata-Rata & Tuntas (KKM {config.kkm})</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-white font-mono">
                    {realTimeStats.avgScore}
                  </span>
                  <span className="text-xs font-bold text-sky-300">
                    ({realTimeStats.passedCount} Tuntas)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  Tingkat Ketuntasan: <strong className="text-sky-300">{realTimeStats.passRate}%</strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-950/80 text-sky-300 border border-sky-800/60 shrink-0 text-center">
                <span className="text-xs font-extrabold block font-mono">{realTimeStats.avgScore}</span>
                <span className="text-[8px] uppercase tracking-wider font-bold block text-sky-400">Mean</span>
              </div>
            </div>

            {/* CARD 4: REAL-TIME MONITORING ACTION */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-800 border border-indigo-700/80 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-indigo-500 transition-all">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
                  <span className="truncate">Monitoring Real-Time</span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  Progres Per Kelas & Siswa
                </div>
                <div className="text-[10px] text-indigo-200/80 truncate">
                  Pantau & filter siapa yang belum ujian
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProgressModalOpen(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Detail
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* TAB: PANDUAN UNTUK GURU */}
          {activeTab === 'panduan' && (
            <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
              {/* Hero Banner Panduan */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-purple-800/50 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-400/30">
                    <GraduationCap className="w-4 h-4 text-purple-300" />
                    <span>Panduan Resmi Penggunaan Portal CBT GuruAI</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Alur Kerja Runtut Persiapan Ujian CBT
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed max-w-3xl">
                    Panduan praktis langkah demi langkah bagi Bapak/Ibu Guru untuk menyiapkan mata pelajaran, merakit bank soal, mengatur parameter ujian, hingga mengunduh rekap nilai dan analisis butir soal secara akurat.
                  </p>

                  {/* Operational Status Chips */}
                  <div className="pt-2 grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kode Guru</span>
                      <span className="text-xs font-mono font-black text-amber-300 truncate block">{config.kodeGuru || 'GURU01'}</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Mapel Aktif</span>
                      <span className="text-xs font-black text-sky-400 truncate block">{mapelInput || 'Sosiologi'}</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Soal</span>
                      <span className="text-xs font-black text-blue-400 block">{config.questions.length} Soal</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Peserta Ujian</span>
                      <span className="text-xs font-black text-indigo-400 block">{displayStudentsList.length} Siswa</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Sesi Ujian</span>
                      <span className={`text-xs font-black block ${sessionStatus === 'ACTIVE' ? 'text-emerald-400' : sessionStatus === 'DRAFT' ? 'text-amber-400' : 'text-red-400'}`}>
                        {sessionStatus}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Token Ujian</span>
                      <span className="text-xs font-mono font-black text-amber-400 block">{currentToken}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DASHBOARD RINGKASAN STATISTIK & PROGRES UJIAN REAL-TIME */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <span>Dashboard Real-Time Progres Ujian Siswa</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black animate-pulse">
                          LIVE STATS
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Statistik perbandingan jumlah siswa yang sudah ujian vs total siswa terdaftar.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProgressModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Activity className="w-4 h-4 text-emerald-300" /> Buka Full Monitoring Real-Time
                  </button>
                </div>

                {/* Main Progress Bar & Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Total Peserta Sudah Mengumpulkan Jawaban
                      </span>
                      <span className="text-emerald-700 font-mono text-sm">
                        {realTimeStats.completedCount} / {realTimeStats.totalStudents} Siswa ({realTimeStats.percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${realTimeStats.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                      <span>Sudah Ujian: <strong className="text-emerald-700">{realTimeStats.completedCount} Siswa</strong></span>
                      <span>Belum Ujian: <strong className="text-amber-700">{realTimeStats.remainingCount} Siswa</strong></span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center text-center">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rata-Rata Nilai Masuk</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{realTimeStats.avgScore}</span>
                    <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
                      {realTimeStats.passedCount} Siswa Lulus KKM ({config.kkm})
                    </span>
                  </div>
                </div>

                {/* Per-Class Quick Cards Grid */}
                {realTimeStats.classBreakdownList.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
                      Ringkasan Progres Per Rombel Kelas:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {realTimeStats.classBreakdownList.map((cb) => (
                        <div key={cb.kelas} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{cb.kelas}</span>
                            <span className="text-[10px] font-extrabold font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              {cb.percent}%
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium flex justify-between">
                            <span>Selesai: <strong>{cb.completed}</strong>/{cb.total}</span>
                            <span className="text-amber-700">Sisa: <strong>{cb.remaining}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* VIDEO TUTORIAL PANDUAN GURU (YOUTUBE) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                      <Youtube className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <span>Video Panduan & Tutorial Penggunaan CBT</span>
                        {config.youtubeGuideUrl && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black">
                            Tersedia Video
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Saksikan video penjelasan cara menggunakan Portal CBT GuruAI secara visual.
                      </p>
                    </div>
                  </div>

                  {/* Actions for Admin and Teachers */}
                  <div className="flex items-center gap-2 shrink-0">
                    {adminRole === 'admin' && (
                      <button
                        onClick={() => setIsEditingVideoUrl(!isEditingVideoUrl)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isEditingVideoUrl ? 'Tutup Pengaturan' : 'Atur Link Video (Admin)'}</span>
                      </button>
                    )}
                    {config.youtubeGuideUrl && (
                      <a
                        href={config.youtubeGuideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Buka di YouTube</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Form Input Khusus Admin */}
                {(isEditingVideoUrl || (adminRole === 'admin' && !config.youtubeGuideUrl)) && (
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Form Input Link Video YouTube (Khusus Admin)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Video ini akan dapat dilihat oleh seluruh User Guru
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={youtubeGuideUrlInput}
                        onChange={(e) => setYoutubeGuideUrlInput(e.target.value)}
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleSaveYoutubeGuideUrl}
                          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Link</span>
                        </button>
                        {config.youtubeGuideUrl && (
                          <button
                            onClick={() => {
                              setYoutubeGuideUrlInput('');
                              onSaveConfig({ ...config, youtubeGuideUrl: '' });
                              setIsEditingVideoUrl(false);
                              showAlert('Link video berhasil dikosongkan.');
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Masukkan URL video YouTube (format <code className="text-amber-300 font-mono">watch?v=...</code>, <code className="text-amber-300 font-mono">youtu.be/...</code>, atau Shorts). Video akan otomatis terpasang dalam player di halaman Panduan ini.
                    </p>
                  </div>
                )}

                {/* Player Video Display Area */}
                {(() => {
                  const embedUrl = getYouTubeEmbedUrl(config.youtubeGuideUrl);
                  if (embedUrl) {
                    return (
                      <div className="space-y-2">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-950">
                          <iframe
                            src={embedUrl}
                            title="Video Panduan Guru CBT"
                            className="absolute top-0 left-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Video className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            Putar video di atas untuk melihat demonstrasi langkah-langkah ujian.
                          </span>
                          {config.youtubeGuideUrl && (
                            <a
                              href={config.youtubeGuideUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 hover:underline"
                            >
                              <span>Layar Penuh di YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  } else if (config.youtubeGuideUrl) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                          <Youtube className="w-5 h-5 text-red-600 shrink-0" />
                          <span>Link Video YouTube sudah disetel: <strong className="font-mono text-slate-700">{config.youtubeGuideUrl}</strong></span>
                        </div>
                        <a
                          href={config.youtubeGuideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Tonton Video Panduan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  } else if (!isEditingVideoUrl) {
                    return (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                          <Youtube className="w-6 h-6 fill-current" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                          Video Panduan Belum Diunggah / Diatur
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          Admin dapat memasukkan link video YouTube tutorial di sini agar seluruh Bapak/Ibu Guru dapat menyimak panduan penggunaan Portal CBT secara visual.
                        </p>
                        {adminRole === 'admin' && (
                          <button
                            onClick={() => setIsEditingVideoUrl(true)}
                            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Atur Link Video YouTube Sekarang</span>
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Runtut 7 Langkah Persiapan Ujian */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-purple-600" />
                    <span>Langkah demi Langkah Persiapan Ujian (Runtut 1 - 7)</span>
                  </h3>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    Sistem CBT GuruAI
                  </span>
                </div>

                {/* LANGKAH 1 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-sky-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 1
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-sky-600" />
                        Pengaturan Mata Pelajaran & Header Ujian
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('mapel')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Menu Mata Pelajaran</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Sebelum menyusun soal, tentukan dahulu identitas dan header ujian yang akan ditampilkan pada layar siswa:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-sky-700">Mata Pelajaran</strong>.</li>
                      <li>Pilih atau ketik **Mata Pelajaran Aktif** (Contoh: <em>Sosiologi</em>, <em>Geografi</em>, <em>Matematika</em>, dll).</li>
                      <li>Isi **Judul Header Ujian** (Contoh: <em>Assessment TKA SMA</em>, <em>Penilaian Akhir Semester</em>) dan **Sub Judul**.</li>
                      <li>Isi data **Nama Sekolah**, **Nama Guru Pengampu**, dan konfigurasi **Kop Sekolah** agar tercetak rapi saat mengunduh Laporan PDF.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 2 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 2
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        Input Soal & Kelola Bank Soal
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('bank')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Bank Soal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Isi pertanyaan dan kunci jawaban ke dalam Bank Soal melalui cara manual atau impor Excel:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-blue-700">Bank Soal</strong>.</li>
                      <li>Klik **+ Tambah Soal** untuk mengisi soal secara manual, ATAU klik **Unduh Template Excel (.xlsx)** dan unggah kembali file Excel yang telah terisi.</li>
                      <li>Setiap soal wajib memiliki: Pertanyaan, Pilihan A-E, Kunci Jawaban (A/B/C/D/E), serta **Pembahasan HOTS**.</li>
                      <li>Tambahkan **Sub Topik / Materi Ujian** (misal: <em>Perubahan Sosial</em>, <em>Globalisasi</em>) agar mudah difilter.</li>
                      <li>Anda juga dapat melampirkan **Gambar / Tabel** pada pertanyaan atau pilihan jawaban.</li>
                      <li>Pastikan tombol status soal bertanda <strong className="text-emerald-600">Aktif</strong> agar dimuat dalam lembar ujian siswa.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 3 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 3
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Kelola Data Peserta Ujian (Siswa & Guru)
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka User Siswa & Guru</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Pastikan akun dan kredensial siswa yang akan mengikuti ujian sudah terdaftar dalam sistem:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-indigo-700">User Siswa & Guru</strong>.</li>
                      <li>Tambahkan data siswa (Nomor Peserta/NIS, Nama Lengkap, Kelas, Ruang, dan Password/PIN).</li>
                      <li>Gunakan tombol **Import Excel Data Siswa** untuk memasukkan puluhan/ratusan siswa sekaligus.</li>
                      <li>Anda juga dapat menambahkan akun **Guru Pengawas / Admin** lain jika diperlukan.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 4 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-orange-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 4
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        Atur Jadwal, Parameter & Ketentuan Ujian
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Setting Jadwal Ujian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Konfigurasi aturan dan batas durasi pengerjaan sebelum ujian diaktifkan:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-orange-700">Setting Jadwal Ujian</strong>.</li>
                      <li>Tentukan **Durasi Ujian** (misal: 60 menit) dan **Nilai KKM** (misal: 75).</li>
                      <li>Atur **Jumlah Soal Tampil** (isi `0` jika ingin menampilkan seluruh soal di Bank Soal).</li>
                      <li>Aktifkan Opsi **Acak Urutan Soal** dan **Acak Pilihan Jawaban** untuk meminimalkan penyontekan.</li>
                      <li>Tentukan **Waktu Mulai Ujian** & **Waktu Selesai Ujian**, serta **Toleransi Keterlambatan**.</li>
                      <li>Aktifkan **Proteksi Anti-Curang** (Peringatan saat siswa pindah tab / keluar layar penuh).</li>
                      <li>Ubah Status Sesi Ujian dari <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">DRAFT</span> menjadi <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">AKTIF</span>.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 5 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 5
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-500" />
                        Rilis Token Ujian Rahasia
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('token')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Token Ujian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Siswa memerlukan kode token untuk membuka dan memulai lembar soal ujian:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-amber-700">Token Ujian</strong>.</li>
                      <li>Klik **Rilis / Acak Token Baru** untuk menggenerasi 6 kode rahasia acak (Contoh: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-bold">{currentToken}</code>).</li>
                      <li>Tuliskan kode token tersebut di papan tulis atau LCD ruang ujian ketika siswa sudah siap.</li>
                      <li>Token dapat diperbarui secara acak jika sesi ujian ingin diatur secara bertahap.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 6 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 6
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-emerald-600" />
                        Pelaksanaan Ujian, Pengunduhan File Jawaban (.CBT) & Upload ke Google Drive
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('rekap')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Live Monitor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Alur pelaksanaan ujian, pengumpulan file jawaban siswa, hingga pengunggahan ke Google Drive:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-700">
                      <li>Buka menu <strong className="text-emerald-700">Rekap & Live Monitor</strong> untuk memantau status pengerjaan siswa secara langsung (login, sisa waktu, dan peringatan pindah tab).</li>
                      <li>Ketika siswa menekan tombol <strong className="text-emerald-700">&quot;Selesai Ujian&quot;</strong>, sistem akan secara otomatis mengunduh **File Jawaban Terenkripsi (.CBT)** ke perangkat/HP siswa.</li>
                      <li>Pada halaman hasil akhir, siswa diminta mengklik tombol <strong className="text-emerald-700">&quot;Upload Hasil Jawaban (Google Drive)&quot;</strong> untuk menuju ke **Link Google Drive / Form** yang telah dikonfigurasi Guru pada menu *Mata Pelajaran*.</li>
                      <li>Siswa mengunggah file `<span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">Jawaban_CBT.cbt</span>` yang telah terunduh ke folder Drive tersebut sebagai berkas bukti resmi pengerjaan.</li>
                      <li>Jika terjadi kendala (misal HP mati atau keluar browser), Guru dapat melakukan **Reset Login Siswa** dari menu *User Siswa & Guru* agar siswa bisa melanjutkan.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 7 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 7
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-purple-600" />
                        Pengumpulan File .CBT, Dekripsi Nilai, Rekap & Analisis Soal
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('rekap')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Rekap & Analisis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Pengolahan nilai akhir dan analisis statistik butir soal:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-700">
                      <li>Guru membuka folder Google Drive tempat siswa mengunggah file jawaban <code className="font-mono text-purple-700 font-bold">.CBT</code>.</li>
                      <li>Masuk ke menu <strong className="text-purple-700">Rekapitulasi Nilai</strong> di Portal Guru, lalu klik tombol **&quot;Unggah & Dekripsi (.CBT)&quot;** untuk memuat seluruh file jawaban siswa secara otomatis.</li>
                      <li>Sistem dekripsi akan menghitung skor, persentase kelulusan KKM, serta memperbarui tabel rekapitulasi secara akurat.</li>
                      <li>Unduh **File Rekap Excel (.xlsx)** untuk kearsipan nilai atau cetak **Laporan PDF Resmi** per kelas.</li>
                      <li>Buka tab **Analisis Butir Soal** untuk mengevaluasi Tingkat Kesukaran (Mudah/Sedang/Sukar), Daya Beda, serta Efektivitas Pengecoh tiap butir soal.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Ready Checklist Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-900 text-sm">
                      Sistem CBT Siap Digunakan!
                    </h4>
                    <p className="text-xs text-emerald-700 leading-snug">
                      Apabila Langkah 1 s/d 5 telah dikonfigurasi, ujian siap dilaksanakan oleh siswa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Cek Status Ujian Sekarang</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 0: MATA PELAJARAN */}
          {activeTab === 'mapel' && (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Pengaturan Mata Pelajaran & Header Ujian</h3>
                    <p className="text-xs text-slate-500">
                      Atur nama mata pelajaran, judul header ujian, dan deskripsi materi yang tampil pada aplikasi CBT & file offline
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Pilih Mata Pelajaran
                      </label>
                      <select
                        value={mapelInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMapelInput(val);
                          setMapelTitleInput(`Assessment TKA ${val} SMA`);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {mapelList.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>Kode Guru Pengampu (Penanda Multi-Guru)</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">Wajib Unik</span>
                      </label>
                      <input
                        type="text"
                        value={kodeGuruInput}
                        onChange={(e) => setKodeGuruInput(e.target.value.toUpperCase())}
                        placeholder="Contoh: GURU01 / SOS01 / MTH02"
                        className="w-full bg-slate-50 border border-slate-300 text-amber-900 text-sm rounded-xl px-3.5 py-2.5 font-mono font-black focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Kode unik guru pengampu agar bank soal dan siswa tidak tertukar dengan guru lain.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Atau Ketik Nama Kustom Mata Pelajaran
                      </label>
                      <input
                        type="text"
                        value={mapelInput}
                        onChange={(e) => setMapelInput(e.target.value)}
                        placeholder="Contoh: Sosiologi, Geografi, Sejarah..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Judul Header Ujian (Exam Title Header)
                      </label>
                      <input
                        type="text"
                        value={mapelTitleInput}
                        onChange={(e) => setMapelTitleInput(e.target.value)}
                        placeholder="Contoh: Assessment TKA Sosiologi SMA 2026"
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Tampil di bagian atas layar ujian & kartu login siswa.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Sub-Judul Topik / Keterangan Materi
                      </label>
                      <input
                        type="text"
                        value={subTitleInput}
                        onChange={(e) => setSubTitleInput(e.target.value)}
                        placeholder="Contoh: Perubahan Sosial & Globalisasi"
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>Link Upload Google Drive (Hasil Jawaban Siswa)</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black">Terhubung ke Siswa</span>
                      </label>
                      <input
                        type="url"
                        value={driveUploadUrlInput}
                        onChange={(e) => setDriveUploadUrlInput(e.target.value)}
                        placeholder="Contoh: https://drive.google.com/drive/folders/... atau https://forms.gle/..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Siswa akan melihat tombol &quot;Upload Hasil Jawaban (Google Drive)&quot; pada halaman akhir setelah ujian selesai untuk mengunggah file hasil (.cbt) mereka.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-red-700 font-extrabold">
                          <Youtube className="w-4 h-4 text-red-600 fill-current" />
                          Link Video YouTube (Panduan Guru)
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black">Khusus Admin</span>
                      </label>
                      <input
                        type="url"
                        value={youtubeGuideUrlInput}
                        onChange={(e) => setYoutubeGuideUrlInput(e.target.value)}
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Video tutorial ini dapat ditonton secara langsung oleh Bapak/Ibu Guru pada menu <strong>Panduan Guru</strong>.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveMapelConfig}
                      className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Simpan Pengaturan Mata Pelajaran
                    </button>
                  </div>

                  {/* Live Preview Card & List of Available Mapel */}
                  <div className="space-y-6">
                    {/* Live Preview */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
                      <p className="text-[10px] uppercase font-bold text-sky-400 tracking-wider mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Preview Tampilan Header Siswa
                      </p>
                      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex items-center gap-3">
                        <div className="bg-sky-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-white truncate">
                            {mapelTitleInput || `Assessment TKA ${mapelInput || 'Sosiologi'}`}
                          </h4>
                          <p className="text-xs text-sky-300 font-medium truncate">
                            {subTitleInput || 'Perubahan Sosial & Globalisasi'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                        <span>Mata Pelajaran: <b className="text-white">{mapelInput || 'Sosiologi'}</b></span>
                        <span>Durasi: <b className="text-white">{config.duration} Menit</b></span>
                      </div>
                    </div>

                    {/* Manage Subject Quick Select List */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Daftar Pilihan Mata Pelajaran Tersedia
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mapelList.map((m) => (
                          <div
                            key={m}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                              mapelInput === m
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-300'
                            }`}
                          >
                            <span
                              onClick={() => {
                                setMapelInput(m);
                                setMapelTitleInput(`Assessment TKA ${m} SMA`);
                              }}
                              className="cursor-pointer"
                            >
                              {m}
                            </span>
                            {mapelList.length > 1 && (
                              <button
                                onClick={() => handleDeleteMapelFromList(m)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Hapus dari daftar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Custom Mapel Field */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customMapelToAdd}
                          onChange={(e) => setCustomMapelToAdd(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomMapel();
                            }
                          }}
                          placeholder="+ Tambah Mapel Baru..."
                          className="flex-1 bg-white border border-slate-300 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                        <button
                          onClick={handleAddCustomMapel}
                          className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 active:scale-95 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: BANK SOAL */}
          {activeTab === 'bank' && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full">
          {/* Left Sidebar: General Settings & Mapel Selection */}
          <div className="w-full md:w-1/3 space-y-4 shrink-0">
            {/* Card Select Mata Pelajaran Ujian */}
            <div className="bg-sky-900 text-white p-5 rounded-2xl shadow-md border border-sky-800 space-y-3">
              <div className="flex items-center gap-2 text-sky-300">
                <BookOpen className="w-5 h-5 text-sky-400 shrink-0" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">Mata Pelajaran Ujian</h3>
              </div>
              <p className="text-[11px] text-sky-200 leading-snug">
                Pilih mata pelajaran yang aktif digunakan untuk ujian CBT. Pilihan ini disesuaikan dengan menu <b>MATA PELAJARAN</b>.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-300 mb-1">
                  Pilih Mata Pelajaran Ujian Aktif:
                </label>
                <select
                  value={mapelInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMapelInput(val);
                    setSelectedBankMapel(val);
                    const newTitle = `Assessment TKA ${val} SMA`;
                    setMapelTitleInput(newTitle);
                    onSaveConfig({
                      ...config,
                      mapel: val,
                      mapelTitle: newTitle,
                    });
                    showAlert(`Mata Pelajaran Ujian aktif diubah ke: "${val}"`);
                  }}
                  className="w-full bg-slate-950 border border-sky-500/60 text-white font-bold text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none cursor-pointer"
                >
                  {mapelList.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white font-semibold">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 border-t border-sky-800/80 flex justify-between items-center text-[11px] text-sky-200 font-medium">
                <span>Mapel Ujian: <b className="text-white">{mapelInput}</b></span>
                <span className="bg-sky-800 text-sky-200 px-2.5 py-0.5 rounded font-bold border border-sky-700/60">
                  {config.questions.filter((q) => q.mapel === mapelInput || (!q.mapel && mapelInput === (config.mapel || 'Sosiologi'))).length} Soal
                </span>
              </div>
            </div>

            {/* Navigasi / Ringkasan Setting Ujian */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-5 rounded-2xl shadow-md text-white space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white shrink-0" />
                <h3 className="font-bold text-sm">Setting Jadwal & Ketentuan Ujian</h3>
              </div>
              <p className="text-xs text-orange-100 leading-relaxed font-medium">
                Pengaturan umum seperti Durasi Ujian, KKM, Acak Soal, Toleransi Keterlambatan, dan Anti-Kecurangan kini telah digabungkan dalam menu <b>Setting Jadwal Ujian</b>.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="w-full bg-white text-orange-950 font-black text-xs py-2.5 px-4 rounded-xl hover:bg-orange-50 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Buka Setting Jadwal & Ketentuan Ujian</span>
                <Clock className="w-3.5 h-3.5 text-orange-600" />
              </button>
            </div>

            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-sm text-blue-900 space-y-2">
              <p className="font-bold flex items-center gap-2 text-blue-800">
                <Info className="w-4 h-4 text-blue-600" /> Informasi Penyimpanan Data
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Semua soal dan konfigurasi disimpan di <b>Local Storage</b> browser Anda. Data tidak akan hilang saat halaman direfresh.
              </p>
            </div>

            {/* Reset Questions Option */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 mb-3">Butuh mengembalikan 20 Soal HOTS Default Sosiologi?</p>
              <button
                onClick={() =>
                  showConfirm(
                    'Reset Soal Default?',
                    'Apakah Anda yakin ingin mengembalikan bank soal ke 20 soal HOTS default?',
                    onResetDefaultQuestions,
                    true
                  )
                }
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-300"
              >
                <RotateCcw className="w-4 h-4" /> Reset ke Soal Default
              </button>
            </div>
          </div>

          {/* Right Area: Questions Management */}
          <div className="w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
              <div>
                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <Database className="w-6 h-6 text-blue-600" /> Bank Soal (
                  <span className="text-blue-600 font-black">{config.questions.length}</span>)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Soal Aktif Digunakan: <b className="text-emerald-600">{config.questions.filter((q) => q.isActive !== false).length}</b> dari {config.questions.length} Total Soal
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setIsGoogleSheetsModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Sinkronisasi Bank Soal & Gambar ke Google Sheets via Apps Script (Code.gs)"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Sync Google Sheets & Code.gs
                </button>

                <button
                  onClick={() => setIsJsonQuestionsModalOpen(true)}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Download & Impor Bank Soal Format JSON Lengkap Beserta Gambar"
                >
                  <FileJson className="w-4 h-4" /> JSON Soal (+ Gambar)
                </button>

                <button
                  onClick={() => setIsExportQuestionModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Export Soal Standar Ujian Nasional ke PDF atau MS Word"
                >
                  <FileText className="w-4 h-4" /> Export PDF / Word
                </button>

                <button
                  onClick={() => setIsExcelGuideModalOpen(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Buka panduan langkah-langkah detail format dan cara upload Excel"
                >
                  <HelpCircle className="w-4 h-4 text-amber-600" /> Panduan Upload Excel
                </button>

                <button
                  onClick={() => setIsDownloadTemplateModalOpen(true)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Template Excel Soal
                </button>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload Excel Soal
                </button>

                <button
                  onClick={() => onOpenQuestionModal(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Tambah Soal
                </button>

                <button
                  onClick={handleDeleteAllQuestions}
                  className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Semua Soal
                </button>
              </div>
            </div>

            {/* Filter & Selector Bar for Mata Pelajaran, Kompetensi, Bentuk Soal & Kode Guru */}
            <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 mb-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-blue-600" /> Filter & Pilih Soal
                </span>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs self-start sm:self-auto flex items-center gap-2 flex-wrap">
                  <span>Tampil <b className="text-blue-600">{filteredQuestions.length}</b> Soal (dari {config.questions.length} Total)</span>
                  <span>•</span>
                  <span>Total Bobot: <b className="text-emerald-600">{filteredQuestions.reduce((sum, q) => sum + (typeof q.poin === 'number' && q.poin > 0 ? q.poin : 10), 0)} Poin</b> (Maks Nilai Total 100)</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                {/* 1. Filter Mata Pelajaran */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-sky-600" /> Mata Pelajaran:
                  </label>
                  <select
                    value={selectedBankMapel}
                    onChange={(e) => setSelectedBankMapel(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Mapel ({config.questions.length})</option>
                    {mapelList.map((m) => {
                      const count = config.questions.filter(
                        (q) => q.mapel === m || (!q.mapel && m === (config.mapel || 'Sosiologi'))
                      ).length;
                      return (
                        <option key={m} value={m}>
                          {m} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Filter Kompetensi / KD */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" /> Kompetensi / KD:
                  </label>
                  <select
                    value={selectedBankKompetensi}
                    onChange={(e) => setSelectedBankKompetensi(e.target.value)}
                    className="bg-white border border-amber-300 text-amber-950 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kompetensi ({availableKompetensis.length})</option>
                    {availableKompetensis.map((k) => {
                      const count = config.questions.filter(
                        (q) => (q.kompetensi || q.subTopik || '') === k
                      ).length;
                      return (
                        <option key={k} value={k}>
                          {k} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 3. Filter Bentuk Soal */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-purple-600" /> Bentuk Soal:
                  </label>
                  <select
                    value={selectedBankBentukSoal}
                    onChange={(e) => setSelectedBankBentukSoal(e.target.value)}
                    className="bg-white border border-purple-300 text-purple-950 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Bentuk Soal</option>
                    {availableBentukSoals.map((b) => {
                      const count = config.questions.filter(
                        (q) => (q.bentukSoal || 'Pilihan Ganda') === b
                      ).length;
                      return (
                        <option key={b} value={b}>
                          {b} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 4. Filter Kode Guru */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Kode Guru:
                  </label>
                  <select
                    value={selectedBankKodeGuru}
                    onChange={(e) => setSelectedBankKodeGuru(e.target.value)}
                    className="bg-white border border-emerald-300 text-emerald-950 font-mono font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kode Guru</option>
                    {availableKodeGurus.map((kg) => (
                      <option key={kg} value={kg}>
                        {kg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedBankMapel !== 'ALL' && selectedBankMapel !== config.mapel && (
                <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                  <button
                    onClick={() => {
                      setMapelInput(selectedBankMapel);
                      const newTitle = `Assessment TKA ${selectedBankMapel} SMA`;
                      setMapelTitleInput(newTitle);
                      onSaveConfig({
                        ...config,
                        mapel: selectedBankMapel,
                        mapelTitle: newTitle,
                      });
                      showAlert(`Mata pelajaran "${selectedBankMapel}" diset sebagai mata pelajaran ujian aktif!`);
                    }}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Set "{selectedBankMapel}" Sebagai Mapel Ujian Aktif
                  </button>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan kata kunci pertanyaan, kompetensi, atau bentuk soal..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Batch Controls Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      filteredQuestions.length > 0 &&
                      filteredQuestions.every((q) => selectedQuestionIds.includes(q.id))
                    }
                    onChange={handleSelectAllFiltered}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Pilih / Centang Semua ({selectedQuestionIds.length} dicentang)</span>
                </label>
              </div>

              {selectedQuestionIds.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsExportQuestionModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="Export soal yang dicentang ke PDF atau Word"
                  >
                    <FileText className="w-3.5 h-3.5" /> Export Terpilih ({selectedQuestionIds.length})
                  </button>
                  <button
                    onClick={() => handleBatchSetActive(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Aktifkan
                  </button>
                  <button
                    onClick={handleBatchSetPoin}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="Ubah bobot poin untuk semua soal terpilih secara masal"
                  >
                    ⚡ Set Bobot Poin ({selectedQuestionIds.length})
                  </button>
                  <button
                    onClick={() => handleBatchSetActive(false)}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Nonaktifkan
                  </button>
                  <button
                    onClick={handleBatchDeleteQuestions}
                    className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih ({selectedQuestionIds.length})
                  </button>
                </div>
              )}
            </div>

            {/* Question List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {filteredQuestions.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-sm font-medium">
                  Belum ada soal yang sesuai dengan filter. Silakan ubah filter atau klik Tambah Soal / Upload Excel.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  const isActive = q.isActive !== false;
                  const stripTags = q.question.replace(/<[^>]+>/g, '');
                  const previewText =
                    stripTags.length > 110 ? stripTags.substring(0, 110) + '...' : stripTags;

                  return (
                    <div
                      key={q.id}
                      className={`border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:shadow-md ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300'
                          : isActive
                          ? 'bg-white border-gray-200'
                          : 'bg-slate-100/80 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox Selection */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectQuestion(q.id)}
                          className="w-5 h-5 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
                              Soal #{idx + 1}
                            </span>
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-200/80">
                              Mapel: {q.mapel || mapelInput || 'Sosiologi'}
                            </span>
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300/80 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-amber-600" /> Komp: {q.kompetensi || q.subTopik || 'Umum'}
                            </span>
                            <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200/80 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-purple-600" /> {q.bentukSoal || 'Pilihan Ganda'}
                            </span>
                            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-300/80 flex items-center gap-1" title="Bobot nilai soal saat dikalkulasi ke maks 100">
                              ⚡ {q.poin || 10} Poin
                            </span>
                            {q.kodeGuru && (
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                Guru: {q.kodeGuru}
                              </span>
                            )}
                            {q.image && (
                              <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-pink-200/80 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-pink-600" /> Gambar/Tabel
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-gray-400">ID: {q.id}</span>

                            {/* Active Toggle Status Badge */}
                            <button
                              onClick={() => handleToggleQuestionActive(q.id)}
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                              title="Klik untuk mengubah status aktif/nonaktif soal untuk ujian"
                            >
                              {isActive ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Digunakan dalam Ujian
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-slate-500" /> Nonaktif
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-gray-800 font-medium leading-relaxed">{previewText}</p>
                          {q.image && (
                            <div className="mt-2">
                              <img
                                src={q.image}
                                alt="Gambar Soal"
                                className="max-h-24 w-auto object-contain rounded-lg border border-slate-200 bg-slate-50 p-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pl-8 sm:pl-0">
                        <button
                          onClick={() => {
                            setSelectedQuestionIds([q.id]);
                            setIsExportQuestionModalOpen(true);
                          }}
                          className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          title="Export soal ini ke PDF atau Word"
                        >
                          <FileText className="w-3.5 h-3.5" /> Export
                        </button>
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          title="Preview tampilan soal untuk ujian siswa"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => onOpenQuestionModal(q)}
                          className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() =>
                            showConfirm(
                              'Hapus Soal?',
                              'Apakah Anda yakin ingin menghapus soal ini?',
                              () => onDeleteQuestion(q.id),
                              true
                            )
                          }
                          className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN USER (SISWA & GURU) */}
      {activeTab === 'students' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Sub Tab Switcher: Siswa, Guru & Admin (Superadmin Only) */}
          {!loggedInTeacher && adminRole !== 'teacher' && (
            <div className="bg-white p-2 rounded-2xl shadow-xs border border-gray-200 flex gap-2 w-full sm:w-auto self-start flex-wrap">
              <button
                onClick={() => setUserSubTab('student')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  userSubTab === 'student'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" /> Data Siswa ({displayStudentsList.length})
              </button>
              <button
                onClick={() => setUserSubTab('teacher')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  userSubTab === 'teacher'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" /> Data Guru ({teachersList.length})
              </button>
              <button
                onClick={() => setUserSubTab('admin')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  userSubTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-4 h-4" /> Data Admin ({adminsList.length})
              </button>
              
            </div>
          )}

          {(userSubTab === 'student' || loggedInTeacher || adminRole === 'teacher') ? (
            /* STUDENT MANAGEMENT UI */
            <>
              {/* Action Header Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" /> Manajemen User & Data Siswa (
                    <span className="text-indigo-600 font-black">{displayStudentsList.length}</span>)
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Kelola daftar siswa yang berhak mengikuti ujian. Siswa dapat login menggunakan <b>NIS</b> dan <b>TOKEN Ujian</b>.
                  </p>
                </div>

                {adminRole !== 'teacher' ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleDownloadStudentTemplate}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Template Excel Siswa
                    </button>

                    <button
                      onClick={() => studentFileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Upload Excel Siswa
                    </button>

                    <button
                      onClick={() => setIsExamCardPrintModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Cetak Kartu Ujian
                    </button>

                    <button
                      onClick={() => setIsGoogleSheetsModalOpen(true)}
                      className="bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-teal-200" /> Google Sheets (CRUD)
                    </button>

                    <button
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Tambah Siswa Manual
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mode Guru / Pendidik: Penambahan & penghapusan akun siswa dikelola oleh Administrator Utama.</span>
                  </div>
                )}
              </div>

              {/* MENU PENETAPAN SISWA AKTIF UJIAN */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-indigo-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-800/80 pb-4">
                  <div>
                    <h3 className="font-black text-lg flex items-center gap-2 text-indigo-100">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                      Menu Pilih Siswa Mengikuti Ujian (Kondisi Aktif Ujian)
                    </h3>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Pilih siswa berdasarkan <b>Kelas</b> atau <b>Nama Siswa</b>. Hanya siswa yang diset <b>Aktif Ujian</b> yang diizinkan masuk ke portal ujian.
                    </p>
                  </div>

                  {/* Ringkasan Status Badge */}
                  <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-indigo-700/50 shrink-0 text-xs flex-wrap">
                    <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Aktif Ujian: <strong>{activeStudentsCount}</strong> Siswa
                    </div>
                    <div className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700">
                      Nonaktif: <strong>{inactiveStudentsCount}</strong> Siswa
                    </div>
                    <div className="px-2.5 py-1 bg-indigo-500/20 text-indigo-200 font-bold rounded-lg border border-indigo-500/30">
                      Total: <strong>{displayStudentsList.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Mode Selector & Global Quick Actions */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch justify-between">
                  {/* Mode Tabs */}
                  <div className="flex bg-slate-950/80 p-1 rounded-xl border border-indigo-700/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStudentSelectMode('class')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        studentSelectMode === 'class'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-indigo-300 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Pilih Berdasarkan Kelas
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentSelectMode('individual')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        studentSelectMode === 'individual'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-indigo-300 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" /> Pilih Berdasarkan Nama Siswa
                    </button>
                  </div>

                  {/* Global Quick Actions */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <button
                      type="button"
                      onClick={() => handleSetAllStudentsActive(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Aktifkan Semua Siswa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllStudentsActive(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-400" /> Nonaktifkan Semua Siswa
                    </button>
                  </div>
                </div>

                {/* MODE 1: BERDASARKAN KELAS */}
                {studentSelectMode === 'class' && (
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-800/80 space-y-3">
                    <div className="text-xs font-bold text-indigo-200 flex items-center justify-between">
                      <span>Pilih & Aktifkan Ujian Per Kelas:</span>
                      <span className="text-[11px] text-indigo-300">
                        Klik tombol untuk mengaktifkan seluruh siswa dalam kelas tertentu
                      </span>
                    </div>

                    {uniqueClasses.length === 0 ? (
                      <p className="text-xs text-indigo-300 italic">Belum ada data kelas terdaftar.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {uniqueClasses.map((kelasName) => {
                          const studentsInClass = displayStudentsList.filter((s) => s.kelas === kelasName);
                          const activeInClass = studentsInClass.filter((s) => s.isActive !== false).length;
                          const isAllActive = studentsInClass.length > 0 && activeInClass === studentsInClass.length;

                          return (
                            <div
                              key={kelasName}
                              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                                isAllActive
                                  ? 'bg-emerald-950/40 border-emerald-500/40'
                                  : activeInClass > 0
                                  ? 'bg-amber-950/40 border-amber-500/40'
                                  : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-black text-sm text-white flex items-center gap-1.5">
                                  <Building2 className="w-4 h-4 text-indigo-400" /> Kelas {kelasName}
                                </span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isAllActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : activeInClass > 0
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {activeInClass} / {studentsInClass.length} Aktif
                                </span>
                              </div>

                              <div className="flex gap-1.5 flex-wrap pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetClassActiveStatus(kelasName, true, false)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] transition text-center cursor-pointer active:scale-95"
                                >
                                  ✓ Aktifkan Kelas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetClassActiveStatus(kelasName, false, false)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-2 rounded-lg text-[11px] transition text-center cursor-pointer border border-slate-700 active:scale-95"
                                >
                                  ✕ Off
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetClassActiveStatus(kelasName, true, true)}
                                  title="Hanya aktifkan siswa di kelas ini, dan nonaktifkan kelas lainnya"
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] transition text-center cursor-pointer active:scale-95"
                                >
                                  ⚡ Hanya Kelas Ini
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: BERDASARKAN NAMA SISWA */}
                {studentSelectMode === 'individual' && (
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-800/80 space-y-2">
                    <p className="text-xs text-indigo-200">
                      💡 <b>Petunjuk Pemilihan Nama Siswa:</b> Anda dapat mencari nama siswa atau menggunakan filter status di bawah ini, lalu centang siswa tertentu atau klik badge <b>Status Ujian (Aktif / Nonaktif)</b> pada tabel siswa untuk mengubah statusnya secara langsung.
                    </p>
                  </div>
                )}
              </div>

              {/* Table Area */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col space-y-4">
                {/* Table Filters & Batch Operations Bar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Class Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-600 text-[11px]">Kelas:</span>
                      <select
                        value={studentClassFilter}
                        onChange={(e) => setStudentClassFilter(e.target.value)}
                        className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Semua Kelas ({uniqueClasses.length})</option>
                        {uniqueClasses.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-600 text-[11px]">Status:</span>
                      <select
                        value={studentStatusFilter}
                        onChange={(e) => setStudentStatusFilter(e.target.value as any)}
                        className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="ACTIVE">🟢 Hanya Aktif Ujian</option>
                        <option value="INACTIVE">🔴 Hanya Nonaktif</option>
                      </select>
                    </div>

                    {/* Kode Guru Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-bold text-amber-900 text-[11px]">Kode Guru:</span>
                      <select
                        value={studentKodeGuruFilter}
                        onChange={(e) => setStudentKodeGuruFilter(e.target.value)}
                        className="font-mono font-bold text-amber-900 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Semua Kode Guru</option>
                        {availableKodeGurus.map((kg) => (
                          <option key={kg} value={kg}>
                            {kg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Cari NIS / Nama Siswa / Kelas..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Batch Action Toolbar when rows are checked */}
                {selectedStudentIds.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      <strong>{selectedStudentIds.length}</strong> siswa dicentang:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => handleBatchSetStudentActive(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Set Aktif Ujian
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetStudentActive(false)}
                        className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Set Nonaktif
                      </button>
                      {adminRole !== 'teacher' && (
                        <button
                          type="button"
                          onClick={handleBatchDeleteStudents}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="text-gray-500 hover:text-gray-800 text-[11px] font-semibold px-2 py-1 underline cursor-pointer"
                      >
                        Batal Pilihan
                      </button>
                    </div>
                  </div>
                )}

                {/* Table Container */}
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredStudents.length > 0 &&
                              selectedStudentIds.length === filteredStudents.length
                            }
                            onChange={() => handleToggleSelectAllStudents(filteredStudents)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                            title="Centang Semua"
                          />
                        </th>
                        <th className="p-3 w-12">No</th>
                        <th className="p-3">NIS / No. Peserta</th>
                        <th className="p-3">Nama Lengkap Siswa</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3 text-center">Kode Guru</th>
                        <th className="p-3 text-center">Status Ujian</th>
                        {adminRole !== 'teacher' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={adminRole !== 'teacher' ? 8 : 7} className="p-8 text-center text-gray-400 font-medium">
                            Tidak ada data siswa yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => {
                          const isSelected = selectedStudentIds.includes(s.id);
                          const isActive = s.isActive !== false;

                          return (
                            <tr
                              key={s.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                !isActive ? 'bg-slate-50/60 opacity-80' : ''
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectOneStudent(s.id)}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                                />
                              </td>
                              <td className="p-3 font-medium text-gray-400">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-slate-800">{s.nis}</td>
                              <td className="p-3 font-bold text-gray-900">{s.nama}</td>
                              <td className="p-3">
                                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-indigo-100">
                                  {s.kelas}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                                  {s.kodeGuru || config.kodeGuru || 'GURU01'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentActive(s.id)}
                                  className={`px-3 py-1 rounded-full text-[11px] font-black border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                  }`}
                                  title="Klik untuk mengubah status aktif/nonaktif ujian"
                                >
                                  {isActive ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                      🟢 Aktif Ujian
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                      🔴 Nonaktif
                                    </>
                                  )}
                                </button>
                              </td>
                              {adminRole !== 'teacher' && (
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setEditingStudent(s)}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Data Siswa"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(s.id, s.nama)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Siswa"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : userSubTab === 'teacher' ? (
            /* TEACHER MANAGEMENT UI */
            <>
              {/* Action Header Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-indigo-600" /> Manajemen User & Data Guru (
                    <span className="text-indigo-600 font-black">{teachersList.length}</span>)
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Kelola daftar guru pengampu. Guru dapat login menggunakan <b>Username</b> sebagai akun akses.
                  </p>
                </div>

                {adminRole !== 'teacher' ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleDownloadTeacherTemplate}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Template Excel Guru
                    </button>

                    <button
                      onClick={() => teacherFileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Upload Excel Guru
                    </button>

                    <button
                      onClick={() => setIsExamCardPrintModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Cetak Kartu Akses Guru
                    </button>

                    <button
                      onClick={() => setIsAddTeacherModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Tambah Guru Manual
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mode Guru / Pendidik: Penambahan & penghapusan akun guru dikelola oleh Administrator Utama.</span>
                  </div>
                )}
              </div>

              {/* Table Area */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base text-gray-800">Daftar Guru Terdaftar</h3>
                    {selectedTeacherIds.length > 0 && adminRole !== 'teacher' && (
                      <button
                        onClick={handleDeleteSelectedTeachers}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus ({selectedTeacherIds.length}) Terpilih
                      </button>
                    )}
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Cari Username / Nama / Mapel..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        {adminRole !== 'teacher' && (
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredTeachers.length > 0 &&
                                filteredTeachers.every((t) => selectedTeacherIds.includes(t.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeacherIds(Array.from(new Set([...selectedTeacherIds, ...filteredTeachers.map((t) => t.id)])));
                                } else {
                                  const fIds = filteredTeachers.map((t) => t.id);
                                  setSelectedTeacherIds(selectedTeacherIds.filter((id) => !fIds.includes(id)));
                                }
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </th>
                        )}
                        <th className="p-3">No</th>
                        <th className="p-3">Username</th>
                        <th className="p-3">Nama Lengkap Guru</th>
                        <th className="p-3">Mata Pelajaran</th>
                        <th className="p-3 text-center">Kode Guru</th>
                        {adminRole !== 'teacher' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={adminRole !== 'teacher' ? 7 : 5} className="p-8 text-center text-gray-400 font-medium">
                            Belum ada data guru terdaftar.
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((t, idx) => {
                          const isSelected = selectedTeacherIds.includes(t.id);
                          return (
                            <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                              {adminRole !== 'teacher' && (
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedTeacherIds(selectedTeacherIds.filter((id) => id !== t.id));
                                      } else {
                                        setSelectedTeacherIds([...selectedTeacherIds, t.id]);
                                      }
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className="p-3 font-medium text-gray-400">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-slate-800">{t.nip}</td>
                              <td className="p-3 font-bold text-gray-900">{t.nama}</td>
                              <td className="p-3">
                                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-indigo-100">
                                  {t.mapel}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                                  {t.kodeGuru || 'GURU01'}
                                </span>
                              </td>
                              {adminRole !== 'teacher' && (
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setEditingTeacher(t)}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Data Guru"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTeacher(t.id, t.nama)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Guru"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* ADMIN MANAGEMENT UI */
            <>
              {/* Action Header Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-indigo-600" /> Manajemen User & Akun Admin (
                    <span className="text-indigo-600 font-black">{adminsList.length}</span>)
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Kelola daftar akun Admin & Proktor CBT. Data otomatis terhubung dan disinkronkan dengan <b>Firebase Cloud Store</b>.
                  </p>
                </div>

                {adminRole !== 'teacher' ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleDownloadAdminTemplate}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Template Excel Admin
                    </button>

                    <button
                      onClick={() => adminFileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Upload Excel Admin
                    </button>

                    <button
                      onClick={() => setIsAddAdminModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Tambah Admin Manual
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Akses Terbatas: Hanya Administrator Utama yang dapat mengelola akun admin.</span>
                  </div>
                )}
              </div>

              {/* Table Area */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base text-gray-800">Daftar Akun Admin Terdaftar</h3>
                    {selectedAdminIds.length > 0 && adminRole !== 'teacher' && (
                      <button
                        onClick={handleDeleteSelectedAdmins}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus ({selectedAdminIds.length}) Terpilih
                      </button>
                    )}
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="Cari Username / Nama / Role..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        {adminRole !== 'teacher' && (
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredAdmins.length > 0 &&
                                filteredAdmins.every((a) => selectedAdminIds.includes(a.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAdminIds(Array.from(new Set([...selectedAdminIds, ...filteredAdmins.map((a) => a.id)])));
                                } else {
                                  const fIds = filteredAdmins.map((a) => a.id);
                                  setSelectedAdminIds(selectedAdminIds.filter((id) => !fIds.includes(id)));
                                }
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </th>
                        )}
                        <th className="p-3">No</th>
                        <th className="p-3">Username Admin</th>
                        <th className="p-3">Nama Lengkap</th>
                        <th className="p-3 text-center">Jabatan / Role</th>
                        <th className="p-3 text-center">Password</th>
                        {adminRole !== 'teacher' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredAdmins.length === 0 ? (
                        <tr>
                          <td colSpan={adminRole !== 'teacher' ? 7 : 6} className="p-8 text-center text-gray-400 font-medium">
                            Belum ada data akun admin terdaftar.
                          </td>
                        </tr>
                      ) : (
                        filteredAdmins.map((a, idx) => {
                          const isSelected = selectedAdminIds.includes(a.id);
                          const isShowPass = !!showPasswordMap[a.id];
                          return (
                            <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                              {adminRole !== 'teacher' && (
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedAdminIds(selectedAdminIds.filter((id) => id !== a.id));
                                      } else {
                                        setSelectedAdminIds([...selectedAdminIds, a.id]);
                                      }
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className="p-3 font-medium text-gray-400">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-indigo-900">{a.username}</td>
                              <td className="p-3 font-bold text-gray-900">{a.nama}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border uppercase ${
                                    a.role === 'superadmin'
                                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                                      : a.role === 'proktor'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {a.role || 'admin'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-mono text-xs">
                                  <span>{isShowPass ? a.password || '—' : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswordMap((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                                    className="text-slate-500 hover:text-slate-800 transition-colors ml-1 cursor-pointer"
                                    title={isShowPass ? 'Sembunyikan Password' : 'Lihat Password'}
                                  >
                                    {isShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                              {adminRole !== 'teacher' && (
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setEditingAdmin(a)}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Akun Admin"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAdmin(a.id, a.nama)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Akun Admin"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: TOKEN UJIAN BERBASIS JADWAL & PAKET SOAL */}
      {activeTab === 'token' && (
        <ExamTokenSchedulePanel
          config={config}
          onSaveConfig={(newConfig) => {
            onSaveConfig(newConfig);
            if (newConfig.examToken) {
              setCurrentToken(newConfig.examToken);
            }
          }}
          showAlert={showAlert}
        />
      )}

      {/* TAB 5: BACKUP & SECURITY DATA */}
      {activeTab === 'backup' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/20">
                <FolderArchive className="w-8 h-8 text-purple-200" />
              </div>
              <h2 className="text-2xl font-black">Backup & Security Data Aplikasi CBT GURUAI</h2>
              <p className="text-purple-200 text-xs mt-1 font-medium">
                Sistem keamanan tingkat lanjut untuk mencadangkan seluruh bank soal, data siswa & guru, pengaturan, dan rekap nilai ke perangkat lokal Anda.
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Card 1: Backup JSON */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-purple-700" /> Unduh Backup Seluruh Data Aplikasi (JSON)
                  </h3>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    Menyimpan file cadangan (.json) berisi seluruh bank soal, konfigurasi ujian, data siswa, data guru, serta rekapitulasi nilai siswa. Sangat disarankan untuk diunduh secara berkala.
                  </p>
                </div>
                <button
                  onClick={triggerBackupAppDataWithAnimation}
                  className="bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Backup (.json)
                </button>
              </div>

              {/* Card 2: Restore JSON */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Pulihkan Data (Restore) Dari File Backup
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mengembalikan seluruh data aplikasi (bank soal & siswa/guru) dari file backup (.json) yang sebelumnya pernah diunduh.
                  </p>
                </div>
                <button
                  onClick={() => backupFileInputRef.current?.click()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" /> Pilih File Backup (.json)
                </button>
              </div>

              {/* Card 3: Kop Surat & Signature Configuration */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-sky-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-700" /> Pengaturan Kop Surat Sekolah & Tanda Tangan Guru
                  </h3>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    Atur nama sekolah, dinas pendidikan, alamat, kota, nama guru, NIP, serta nama kepala sekolah yang akan tercetak resmi di Laporan PDF & Excel.
                  </p>
                </div>
                <button
                  onClick={handleOpenKopModal}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Atur Kop & TTD
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 leading-relaxed flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <b>Keamanan & Privasi Guru:</b> Seluruh data Anda disimpan secara aman di browser lokal Anda dan dapat dicadangkan kapan saja tanpa risiko kehilangan data ujian.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB SCHEDULE: SETTING JADWAL & KETENTUAN UJIAN */}
      {activeTab === 'schedule' && (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-orange-100 text-orange-700 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800">
                  Pengaturan Jadwal, Sesi & Anti-Kecurangan Ujian
                </h3>
                <p className="text-xs text-slate-500">
                  Atur periode pelaksanaan ujian, status akses siswa, batas toleransi keterlambatan, dan kebijakan anti-kecurangan ketat.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Status Sesi Ujian Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Status Akses Sesi Ujian saat ini
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionStatus('ACTIVE')}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      sessionStatus === 'ACTIVE'
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sessionStatus === 'ACTIVE' ? 'border-white bg-white text-emerald-600' : 'border-slate-300'}`}>
                      {sessionStatus === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black">🟢 ACTIVE (Buka Ujian)</div>
                      <div className="text-[10px] opacity-80 font-medium">Siswa diizinkan masuk & mengerjakan</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionStatus('DRAFT')}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      sessionStatus === 'DRAFT'
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sessionStatus === 'DRAFT' ? 'border-slate-900 bg-slate-900 text-amber-500' : 'border-slate-300'}`}>
                      {sessionStatus === 'DRAFT' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black">🟡 DRAFT (Persiapan)</div>
                      <div className="text-[10px] opacity-80 font-medium">Ujian dikunci, siswa menunggu guru</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionStatus('CLOSED')}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      sessionStatus === 'CLOSED'
                        ? 'bg-red-600 border-red-700 text-white shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-red-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sessionStatus === 'CLOSED' ? 'border-white bg-white text-red-600' : 'border-slate-300'}`}>
                      {sessionStatus === 'CLOSED' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black">🔴 CLOSED (Ditutup)</div>
                      <div className="text-[10px] opacity-80 font-medium">Ujian telah berakhir, tidak dapat diakses</div>
                    </div>
                  </button>
                </div>

                {/* Tombol Darurat Force Stop Real-time (Point 1 - Opsi A) */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-red-50 p-4 rounded-2xl border-2 border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md shrink-0">
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-red-900 uppercase tracking-wider">
                        Kendali Pengawas Real-Time (Point 1 - Opsi A)
                      </h5>
                      <p className="text-[11px] text-red-700 font-medium">
                        Hentikan paksa seluruh ujian online peserta secara langsung saat ini juga. Jawaban dikirim otomatis.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleForceStopExamRealtime}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                  >
                    🚨 HENTIKAN SELURUH UJIAN SEKARANG (FORCE STOP)
                  </button>
                </div>
              </div>

              {/* PUSAT BROADCAST PERINGATAN PROKTOR REAL-TIME (Point 2) */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 border-2 border-amber-400 p-6 rounded-3xl space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-200 shrink-0">
                      <Megaphone className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
                          Real-Time Broadcast
                        </span>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">Terhubung Live</span>
                      </div>
                      <h4 className="font-extrabold text-base sm:text-lg text-slate-900 mt-0.5">
                        Pusat Broadcast & Peringatan Proktor ke Peserta Ujian (Point 2)
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Kirimkan pesan teguran, instruksi waktu, atau peringatan resmi dari Proktor secara langsung ke layar ujian peserta saat ujian berlangsung. Pesan akan muncul dalam bentuk <b>pop-up modal peringatan bersuara</b> di device siswa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Target Selection */}
                  <div className="md:col-span-1 bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" /> Target Penerima Pesan
                    </label>
                    <select
                      value={broadcastTargetNis}
                      onChange={(e) => setBroadcastTargetNis(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">📢 SEMUA PESERTA UJIAN (Broadcast General)</option>
                      {config.students.map((s) => (
                        <option key={s.id || s.nis} value={s.nis}>
                          👤 {s.nama} ({s.kelas} - NIS: {s.nis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">
                      Pilih <b>Semua Peserta</b> atau pilih <b>Siswa Spesifik</b> yang ingin diberikan teguran.
                    </p>
                  </div>

                  {/* Custom Message Input */}
                  <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-amber-600" /> Isi Pesan / Teguran Proktor
                    </label>
                    <textarea
                      rows={2}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Tuliskan pesan peringatan di sini atau klik salah satu tombol template cepat di bawah..."
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                    />

                    {/* Quick Template Buttons (Point 2) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        ⚡ Templat Pesan Peringatan Cepat:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("🚨 Harap tenang dan tetap fokus pada layar ujian masing-masing!")}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-300 transition cursor-pointer active:scale-95"
                        >
                          🚨 FOKUS LAYAR UJIAN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("⏰ Waktu ujian tersisa 10 menit lagi! Harap periksa kembali jawaban Anda.")}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-blue-300 transition cursor-pointer active:scale-95"
                        >
                          ⏰ SISA WAKTU 10 MENIT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("⚠️ Peringatan Proktor: Dilarang keras berpindah tab atau mengecilkan browser!")}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-rose-300 transition cursor-pointer active:scale-95"
                        >
                          ⚠️ PERINGATAN DILARANG SWITCH TAB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("📢 Perhatian: Sesi ujian akan dihentikan oleh pengawas dalam 2 menit lagi!")}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-orange-300 transition cursor-pointer active:scale-95"
                        >
                          📢 UJIAN SEGERA DIHENTIKAN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("🚫 Peringatan Terakhir: Sisa 1x lagi pelanggaran Anda akan otomatis ter-submit diskualifikasi!")}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-purple-300 transition cursor-pointer active:scale-95"
                        >
                          🚫 PERINGATAN TERAKHIR (ULTIMATUM)
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendBroadcastWarning()}
                        className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Send className="w-4 h-4" /> Kirim Pesan Real-Time ke Peserta
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Tanggal & Jam Pelaksanaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" /> Tanggal & Waktu Mulai Ujian
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika ujian dapat langsung dimulai tanpa batasan jam</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" /> Tanggal & Waktu Selesai Ujian
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Siswa tidak dapat memulai ujian jika melebihi waktu ini</p>
                </div>
              </div>

              {/* Durasi, KKM & Toleransi Keterlambatan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Durasi Pengerjaan Ujian (Menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={durationInput}
                    onChange={(e) => setDurationInput(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    KKM (Nilai Lulus Minimal 0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={kkmInput}
                    onChange={(e) => setKkmInput(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Toleransi Keterlambatan (Menit)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={lateTolerance}
                    onChange={(e) => setLateTolerance(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jumlah Soal Tampil & Percobaan (Max Attempts) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Jumlah Soal Dikeluarkan Per Siswa
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxQuestionsInput}
                    onChange={(e) => setMaxQuestionsInput(Number(e.target.value) || 0)}
                    placeholder="0 = Gunakan Semua Soal Aktif"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Isi <b>0</b> untuk mengeluarkan semua soal aktif.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Batas Percobaan Ujian (Max Attempts)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxAttemptsInput}
                    onChange={(e) => setMaxAttemptsInput(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Berapa kali siswa dapat mengulang ujian.
                  </p>
                </div>
              </div>

              {/* Ringkasan Bank Soal & Status Soal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Ringkasan Ketersediaan Bank Soal Saat Ini
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Total di Bank Soal:</span>
                    <span className="font-black text-slate-900">{config.questions.length} Soal</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Status Soal Aktif:</span>
                    <span className="font-black text-emerald-700">
                      {config.questions.filter((q) => q.isActive !== false).length} Soal
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Disajikan di Ujian:</span>
                    <span className="font-black text-blue-700">
                      {(() => {
                        const activeCount = config.questions.filter((q) => q.isActive !== false).length;
                        if (maxQuestionsInput <= 0 || maxQuestionsInput >= activeCount) {
                          return `${activeCount} Soal (Semua)`;
                        }
                        return `${maxQuestionsInput} Soal (Diacak)`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Anti-Kecurangan & Ketentuan Ujian */}
              <div className="bg-orange-50/60 border border-orange-200 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-orange-950 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-600" /> Kebijakan Keamanan & Anti-Kecurangan Ketat
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Acak Urutan Soal Siswa</span>
                    <input
                      type="checkbox"
                      checked={randomizeQuestionsInput}
                      onChange={(e) => setRandomizeQuestionsInput(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Acak Urutan Pilihan Jawaban (A-E)</span>
                    <input
                      type="checkbox"
                      checked={randomizeOptionsInput}
                      onChange={(e) => setRandomizeOptionsInput(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Tampilkan Nilai Langsung setelah Submit</span>
                    <input
                      type="checkbox"
                      checked={showScoreImmediately}
                      onChange={(e) => setShowScoreImmediately(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Mode Proteksi Fullscreen & Switch Tab</span>
                    <input
                      type="checkbox"
                      checked={strictAntiCheating}
                      onChange={(e) => setStrictAntiCheating(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Batas Maksimal Pelanggaran Sebelum Auto-Submit Penuh
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxCheatingAllowed}
                      onChange={(e) => setMaxCheatingAllowed(Number(e.target.value))}
                      className="w-32 bg-white border border-orange-300 text-slate-800 text-sm rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <span className="text-xs text-orange-900 font-medium">
                      Kali peringatan (default: 3x violation sebelum dihentikan paksa).
                    </span>
                  </div>
                </div>

                {/* Audio Peringatan MP3 Box */}
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-3 mt-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-amber-700 animate-pulse" />
                      <h4 className="font-extrabold text-sm text-amber-950 uppercase tracking-wider">
                        Audio Peringatan Kecurangan Siswa (Format MP3)
                      </h4>
                    </div>
                    <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-300 cursor-pointer shadow-2xs self-start sm:self-auto">
                      <span className="text-xs font-bold text-slate-800">Aktifkan Suara Audio</span>
                      <input
                        type="checkbox"
                        checked={enableWarningAudio}
                        onChange={(e) => setEnableWarningAudio(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Sistem akan memutar secara otomatis <b>Audio Alarm MP3 Peringatan Kecurangan</b>, Sirine dual-tone, dan Pengumuman Suara saat siswa kedapatan berpindah tab, keluar mode fullscreen, menekan shortcut keyboard, atau merekam layar.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-1">
                    <button
                      type="button"
                      onClick={handleTestWarningAudio}
                      className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-4 h-4" /> Uji Coba Suara Audio MP3
                    </button>

                    <div className="flex-1 flex gap-2 items-center">
                      <input
                        type="text"
                        value={customWarningAudioUrl}
                        onChange={(e) => setCustomWarningAudioUrl(e.target.value)}
                        placeholder="Default (/warning-alarm.mp3) atau masukkan URL MP3 kustom..."
                        className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <label className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-400 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" /> Upload File MP3
                        <input
                          type="file"
                          accept="audio/mp3,audio/*"
                          onChange={handleFileUploadMP3}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveExamSchedule}
                  className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" /> Simpan Jadwal & Ketentuan Sesi Ujian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKAP JAWABAN (.CBT) & LAPORAN */}
      {activeTab === 'rekap' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Action Header & Upload Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" /> Rekapitulasi & Laporan Nilai Ujian Siswa
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Upload file .cbt siswa, cetak Laporan Resmi PDF lengkap dengan Kop Sekolah & Tanda Tangan Guru + NIP.
              </p>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={handleOpenKopModal}
                className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Pengaturan Kop Surat Sekolah dan NIP / Nama Guru"
              >
                <Building2 className="w-4 h-4 text-sky-600" /> Kop & TTD Guru
              </button>

              <button
                onClick={() => handleOpenPdfPaperModal('REKAP_HASIL')}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Laporan PDF (Kop & TTD)
              </button>

              <button
                onClick={handleExportRekapToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel Laporan
              </button>

              <button
                onClick={() => cbtFileInputRef.current?.click()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Upload File .CBT Siswa
              </button>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processCbtFilesList(e.dataTransfer.files);
              }
            }}
            onClick={() => cbtFileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">
                Tarik & Lepaskan (Drag & Drop) File <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg font-mono">.CBT</span> Siswa di Sini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Atau klik area ini untuk memilih sekaligus banyak file hasil jawaban siswa dari komputer/HP Anda.
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Total Siswa Ujian</div>
                <div className="text-2xl font-black text-gray-800">{studentResults.length}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Rata-Rata Nilai</div>
                <div className="text-2xl font-black text-gray-800">{averageScore}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Lulus (≥ KKM)</div>
                <div className="text-2xl font-black text-emerald-600">{passedCount}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Tidak Lulus</div>
                <div className="text-2xl font-black text-red-500">
                  {studentResults.length - passedCount}
                </div>
              </div>
            </div>
          </div>

          {/* ANIMATED LEADERBOARD PODIUM SECTION */}
          {studentResults.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-inner">
                    <Trophy className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white flex items-center gap-2">
                      LEADERBOARD TERTINGGI SISWA 🏆
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Peringkat teratas berdasarkan Perolehan Nilai Terbaik, Tingkat Kebenaran, dan Kejujuran Siswa
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLeaderboardPodium(!showLeaderboardPodium)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-indigo-200 transition-all border border-white/10 cursor-pointer"
                >
                  {showLeaderboardPodium ? 'Sembunyikan Visual Podium' : 'Tampilkan Visual Podium'}
                </button>
              </div>

              {showLeaderboardPodium && (
                <div className="pt-4 pb-2 relative z-10">
                  {/* PODIUM DISPLAY (Silver #2 | Gold #1 | Bronze #3) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
                    {/* RANK #2 - SILVER PODIUM */}
                    <div className="order-2 md:order-1 flex flex-col items-center">
                      {[...studentResults].sort((a,b) => b.score - a.score)[1] ? (
                        <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-400/40 rounded-2xl p-4 text-center shadow-lg relative group hover:border-slate-300 transition-all">
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-900 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                            <Medal className="w-3 h-3 text-slate-700" /> Juara 2
                          </div>
                          <div className="mt-3 text-3xl font-black text-slate-300 font-mono">
                            {[...studentResults].sort((a,b) => b.score - a.score)[1].score}
                          </div>
                          <div className="text-xs font-bold text-white truncate mt-1">
                            {[...studentResults].sort((a,b) => b.score - a.score)[1].studentInfo.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIS: {[...studentResults].sort((a,b) => b.score - a.score)[1].studentInfo.noPeserta}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-center items-center gap-2 text-[10px] text-emerald-400">
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[1].correctCount} Benar</span> • 
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[1].warnings || 0} Pelanggaran</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-600">
                          Belum ada data Juara 2
                        </div>
                      )}
                      <div className="w-full h-16 bg-gradient-to-t from-slate-800 to-slate-700/60 rounded-t-xl mt-2 flex items-center justify-center font-black text-2xl text-slate-400 border-t border-slate-500/30">
                        2
                      </div>
                    </div>

                    {/* RANK #1 - GOLD PODIUM (ELEVATED) */}
                    <div className="order-1 md:order-2 flex flex-col items-center">
                      {[...studentResults].sort((a,b) => b.score - a.score)[0] ? (
                        <div className="w-full bg-gradient-to-b from-amber-900/80 via-amber-950 to-slate-900 border-2 border-amber-400/80 rounded-2xl p-5 text-center shadow-2xl relative group hover:scale-105 transition-all">
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 ring-4 ring-amber-500/20 animate-pulse">
                            <Crown className="w-4 h-4 text-slate-950" /> JUARA 1 UTAMA
                          </div>
                          <div className="mt-3 text-4xl font-black text-amber-300 font-mono drop-shadow-md">
                            {[...studentResults].sort((a,b) => b.score - a.score)[0].score}
                          </div>
                          <div className="text-sm font-black text-white truncate mt-1">
                            {[...studentResults].sort((a,b) => b.score - a.score)[0].studentInfo.name}
                          </div>
                          <div className="text-[11px] text-amber-200/80 font-mono">
                            NIS: {[...studentResults].sort((a,b) => b.score - a.score)[0].studentInfo.noPeserta}
                          </div>
                          <div className="mt-3 pt-2 border-t border-amber-500/30 flex justify-center items-center gap-2 text-xs font-bold text-amber-300">
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[0].correctCount} Benar</span> • 
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[0].warnings || 0} Pelanggaran</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-600">
                          Belum ada data Juara 1
                        </div>
                      )}
                      <div className="w-full h-24 bg-gradient-to-t from-amber-700/80 to-amber-500/60 rounded-t-xl mt-2 flex items-center justify-center font-black text-3xl text-amber-200 border-t border-amber-400/50 shadow-lg">
                        1
                      </div>
                    </div>

                    {/* RANK #3 - BRONZE PODIUM */}
                    <div className="order-3 flex flex-col items-center">
                      {[...studentResults].sort((a,b) => b.score - a.score)[2] ? (
                        <div className="w-full bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-700/50 rounded-2xl p-4 text-center shadow-lg relative group hover:border-amber-600 transition-all">
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                            <Medal className="w-3 h-3 text-amber-300" /> Juara 3
                          </div>
                          <div className="mt-3 text-3xl font-black text-amber-400 font-mono">
                            {[...studentResults].sort((a,b) => b.score - a.score)[2].score}
                          </div>
                          <div className="text-xs font-bold text-white truncate mt-1">
                            {[...studentResults].sort((a,b) => b.score - a.score)[2].studentInfo.name}
                          </div>
                          <div className="text-[10px] text-amber-200/60 font-mono">
                            NIS: {[...studentResults].sort((a,b) => b.score - a.score)[2].studentInfo.noPeserta}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-center items-center gap-2 text-[10px] text-emerald-400">
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[2].correctCount} Benar</span> • 
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[2].warnings || 0} Pelanggaran</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-600">
                          Belum ada data Juara 3
                        </div>
                      )}
                      <div className="w-full h-12 bg-gradient-to-t from-amber-900/80 to-amber-800/50 rounded-t-xl mt-2 flex items-center justify-center font-black text-xl text-amber-400 border-t border-amber-700/30">
                        3
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Results Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-800">Daftar Hasil Jawaban Siswa</h3>
                <p className="text-xs text-slate-500">
                  Total {studentResults.length} hasil jawaban ({selectedResultIds.length} dicentang)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Kelas */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-blue-200 text-xs shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-blue-900 text-[11px]">Kelas:</span>
                  <select
                    value={rekapKelasFilter}
                    onChange={(e) => setRekapKelasFilter(e.target.value)}
                    className="font-semibold text-blue-900 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {availableKelasList.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Kode Soal */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-teal-200 text-xs shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold text-teal-900 text-[11px]">Kode Soal:</span>
                  <select
                    value={rekapKodeSoalFilter}
                    onChange={(e) => setRekapKodeSoalFilter(e.target.value)}
                    className="font-mono font-bold text-teal-900 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Kode Soal</option>
                    {availableKodeSoalList.map((ks) => (
                      <option key={ks} value={ks}>
                        {ks}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kode Guru Filter Dropdown */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 text-xs shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-amber-900 text-[11px]">Kode Guru:</span>
                  <select
                    value={rekapKodeGuruFilter}
                    onChange={(e) => setRekapKodeGuruFilter(e.target.value)}
                    className="font-mono font-bold text-amber-900 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Kode Guru</option>
                    {availableKodeGurus.map((kg) => (
                      <option key={kg} value={kg}>
                        {kg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters Button */}
                {(rekapKelasFilter !== 'ALL' || rekapKodeSoalFilter !== 'ALL' || rekapKodeGuruFilter !== 'ALL' || rekapSearch !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setRekapKelasFilter('ALL');
                      setRekapKodeSoalFilter('ALL');
                      setRekapKodeGuruFilter('ALL');
                      setRekapSearch('');
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Reset Semua Filter Rekap"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" /> Reset
                  </button>
                )}

                {/* Search Bar */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={rekapSearch}
                    onChange={(e) => setRekapSearch(e.target.value)}
                    placeholder="Cari Nama / No / Mapel..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/50"
                  />
                </div>

                {/* Bulk Action Buttons */}
                {selectedResultIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedStudentResults}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Siswa Terpilih ({selectedResultIds.length})</span>
                  </button>
                )}

                {studentResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllStudentResults}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Hapus seluruh hasil ujian semua siswa"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Hasil</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudentResults.length > 0 &&
                          filteredStudentResults.every((r) => selectedResultIds.includes(r.id))
                        }
                        onChange={() => handleSelectAllResults(filteredStudentResults)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Pilih / Centang Semua"
                      />
                    </th>
                    <th className="p-3">No. Peserta</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Kelas</th>
                    <th className="p-3 text-center">Kode Soal</th>
                    <th className="p-3 text-center">Kode Guru</th>
                    <th className="p-3">Skor Nilai</th>
                    <th className="p-3">Benar / Salah</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Pelanggaran</th>
                    <th className="p-3">Waktu Selesai</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredStudentResults.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-gray-400 font-medium">
                        Belum ada file jawaban siswa (.cbt) yang sesuai dengan filter atau didekripsi. Klik button <b>Upload File .CBT Siswa</b> di atas untuk merekap jawaban.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentResults.map((r) => {
                      const isSelected = selectedResultIds.includes(r.id);
                      return (
                        <tr
                          key={r.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectResultId(r.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-700">{r.studentInfo.noPeserta}</td>
                          <td className="p-3 font-bold text-gray-900">{r.studentInfo.name}</td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[11px] border border-blue-200">
                              {getStudentClass(r)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-teal-50 text-teal-800 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-teal-200">
                              {getKodeSoal(r)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                              {r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-black text-base ${
                                r.isPassed ? 'text-blue-600' : 'text-red-500'
                              }`}
                            >
                              {r.score}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">
                            <span className="text-emerald-600 font-bold">{r.correctCount}</span> /{' '}
                            <span className="text-red-500 font-bold">{r.incorrectCount}</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                r.isPassed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {r.isPassed ? 'LULUS' : 'TIDAK LULUS'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAuditResult(r);
                                setIsAuditModalOpen(true);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                r.warnings > 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-2xs'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Klik untuk Audit Detail Keamanan, IP Address, Perangkat & Timeline Kecurangan"
                            >
                              <ShieldAlert className={`w-3.5 h-3.5 ${r.warnings > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                              <span>{r.warnings > 0 ? `${r.warnings}x Pelanggaran` : '0 (Bersih)'}</span>
                            </button>
                          </td>
                          <td className="p-3 text-gray-500 text-[11px]">{r.submittedAt}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenPdfPaperModal('INDIVIDUAL', r)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Cetak Lembar Laporan Hasil Jawaban Individual Siswa (PDF)"
                              >
                                <FileText className="w-3 h-3 text-red-600" /> PDF Siswa
                              </button>
                              <button
                                onClick={() => handleDeleteStudentResult(r.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Rekap"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANALISIS BUTIR SOAL */}
      {activeTab === 'analisis' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Action Header & Export Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-teal-600" /> Analisis Butir Soal & Psikometrik Soal
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Evaluasi Kuantitatif Tingkat Kesukaran (P), Daya Beda (D), Reliabilitas Tes (KR-20), & Sebaran Pengecoh Opsi (Distraktor A-E).
              </p>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={handleOpenKopModal}
                className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Pengaturan Kop Surat Sekolah & TTD Guru"
              >
                <Building2 className="w-4 h-4 text-sky-600" /> Kop & TTD Guru
              </button>

              <button
                onClick={() => handleOpenPdfPaperModal('ANALISIS_SOAL')}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak PDF Analisis
              </button>

              <button
                onClick={handleExportAnalisisToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel Analisis
              </button>

              <button
                onClick={() => cbtFileInputRef.current?.click()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Upload file hasil jawaban siswa (.cbt) untuk bahan Analisis"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Upload File .CBT Siswa
              </button>
            </div>
          </div>

          {/* Quick Stats & Psychometric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Rata-rata Tingkat Kesukaran */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rata-rata Kesukaran (P)</span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <BarChart2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-800">{testOverallStats.meanP.toFixed(2)}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  {testOverallStats.meanP >= 0.3 && testOverallStats.meanP <= 0.7 ? 'Ideal (Sedang)' : testOverallStats.meanP > 0.7 ? 'Terlalu Mudah' : 'Terlalu Sukar'}
                </div>
              </div>
            </div>

            {/* 2. Rata-rata Daya Beda */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rata-rata Daya Beda (D)</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-800">{testOverallStats.meanD.toFixed(2)}</div>
                <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${testOverallStats.meanD >= 0.3 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {testOverallStats.meanD >= 0.3 ? 'Sensitivitas Baik' : 'Perlu Evaluasi'}
                </div>
              </div>
            </div>

            {/* 3. Reliabilitas KR-20 */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reliabilitas Tes (KR-20)</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-indigo-600">{testOverallStats.kr20.toFixed(2)}</div>
                <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${testOverallStats.kr20 >= 0.7 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'}`}>
                  {testOverallStats.kr20 >= 0.8 ? 'Sangat Tinggi / Handal' : testOverallStats.kr20 >= 0.7 ? 'Tinggi (Cukup)' : 'Moderat'}
                </div>
              </div>
            </div>

            {/* 4. Efektivitas Distraktor */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kesehatan Pengecoh</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-purple-600">{testOverallStats.healthDistractor}%</div>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  Distraktor Berfungsi
                </div>
              </div>
            </div>

            {/* 5. Rekapitulasi Status Soal */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status Rekomendasi</span>
              <div className="mt-2 space-y-1 text-xs font-bold">
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Diterima (Baik):</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded-full text-xs">{testOverallStats.countAccepted}</span>
                </div>
                <div className="flex justify-between items-center text-amber-700">
                  <span>Direvisi:</span>
                  <span className="bg-amber-100 px-2 py-0.5 rounded-full text-xs">{testOverallStats.countRevised}</span>
                </div>
                <div className="flex justify-between items-center text-rose-700">
                  <span>Dibuang / Cek Kunci:</span>
                  <span className="bg-rose-100 px-2 py-0.5 rounded-full text-xs">{testOverallStats.countRejected}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informative Guidance Card */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-md border border-slate-800 space-y-3">
            <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  Panduan Analisis Butir Soal & Kriteria Pedagogis
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Gunakan indikator ini untuk menyaring soal bermutu yang layak dimasukkan ke Bank Soal Sekolah atau perlu direvisi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
                <span className="font-extrabold text-teal-400 text-xs">Tingkat Kesukaran (P)</span>
                <p className="text-[11px] text-slate-300">P = Total Benar / Total Responden</p>
                <p className="text-[10px] text-slate-400">P &gt; 0.70 (Mudah) | 0.30–0.70 (Sedang/Ideal) | P &lt; 0.30 (Sukar)</p>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
                <span className="font-extrabold text-amber-400 text-xs">Daya Beda (D)</span>
                <p className="text-[11px] text-slate-300">D = (Benar Kelompok Atas - Benar Kelompok Bawah) / N Kelompok</p>
                <p className="text-[10px] text-slate-400">D &ge; 0.40 (Sangat Baik) | D &ge; 0.30 (Baik) | D &lt; 0 (⚠️ Cek Kunci/Pertanyaan!)</p>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
                <span className="font-extrabold text-purple-400 text-xs">Efektivitas Distraktor</span>
                <p className="text-[11px] text-slate-300">Pengecoh Efektif jika dipilih &ge; 5% atau lebih banyak oleh kelompok bawah.</p>
                <p className="text-[10px] text-slate-400">Pengecoh 0% pemilih perlu diganti opsi jawabannya.</p>
              </div>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processCbtFilesList(e.dataTransfer.files);
              }
            }}
            onClick={() => cbtFileInputRef.current?.click()}
            className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/80 p-4 rounded-2xl text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-center gap-3 group"
          >
            <div className="w-9 h-9 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-left sm:text-left text-center">
              <p className="font-bold text-xs text-slate-800">
                Upload / Drop File <span className="text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md font-mono font-bold">.CBT</span> Hasil Jawaban Siswa
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload sekaligus file .cbt untuk memperbarui statistik item analysis secara otomatis ({analisisMapelFilter !== 'ALL' ? analisisMapelFilter : 'Semua Mapel'}).
              </p>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col space-y-4">
            {/* Filters & Sorting Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* Subject Filter */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-gray-600 text-[11px]">Mapel:</span>
                  <select
                    value={analisisMapelFilter}
                    onChange={(e) => setAnalisisMapelFilter(e.target.value)}
                    className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Mapel</option>
                    {mapelList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                  <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-gray-600 text-[11px]">Kesukaran:</span>
                  <select
                    value={analisisDifficultyFilter}
                    onChange={(e) => setAnalisisDifficultyFilter(e.target.value as any)}
                    className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Kesukaran</option>
                    <option value="Mudah">🟢 Mudah (P &gt; 0.70)</option>
                    <option value="Sedang">🔵 Sedang (0.30 - 0.70)</option>
                    <option value="Sukar">🔴 Sukar (P &lt; 0.30)</option>
                  </select>
                </div>

                {/* Discrimination Filter */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                  <PieChart className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-gray-600 text-[11px]">Daya Beda:</span>
                  <select
                    value={analisisDiscriminationFilter}
                    onChange={(e) => setAnalisisDiscriminationFilter(e.target.value)}
                    className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Daya Beda</option>
                    <option value="Sangat Baik">🟢 Sangat Baik (D &ge; 0.40)</option>
                    <option value="Baik">🔵 Baik (0.30 - 0.39)</option>
                    <option value="Cukup">🟡 Cukup (0.20 - 0.29)</option>
                    <option value="Buruk">🟠 Buruk (0.00 - 0.19)</option>
                    <option value="Sangat Buruk / Cek Kunci">🔴 Negatif / Cek Kunci (D &lt; 0)</option>
                  </select>
                </div>

                {/* Recommendation Filter */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-gray-600 text-[11px]">Status:</span>
                  <select
                    value={analisisRecommendationFilter}
                    onChange={(e) => setAnalisisRecommendationFilter(e.target.value)}
                    className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Diterima">🟢 Diterima (Baik)</option>
                    <option value="Direvisi">🟡 Direvisi</option>
                    <option value="Dibuang">🔴 Dibuang / Cek Kunci</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                  <span className="font-bold text-gray-600 text-[11px]">Urutkan:</span>
                  <select
                    value={analisisSortBy}
                    onChange={(e) => setAnalisisSortBy(e.target.value as any)}
                    className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="number">No. Soal</option>
                    <option value="difficulty">Tingkat Kesukaran (P)</option>
                    <option value="discrimination">Daya Beda (D)</option>
                    <option value="recommendation">Rekomendasi</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={analisisSearch}
                  onChange={(e) => setAnalisisSearch(e.target.value)}
                  placeholder="Cari pertanyaan / diagnostik..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 min-w-[220px]">Pertanyaan Soal</th>
                    <th className="p-3 text-center">Kunci</th>
                    <th className="p-3 min-w-[220px]">Sebaran Jawaban (A/B/C/D/E)</th>
                    <th className="p-3 text-center">Benar / Total</th>
                    <th className="p-3 text-center">Kesukaran (P)</th>
                    <th className="p-3 text-center">Daya Beda (D)</th>
                    <th className="p-3 text-center">Distraktor Efektif</th>
                    <th className="p-3 min-w-[200px]">Rekomendasi & Catatan Diagnostik</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredAnalisisList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 font-medium">
                        {rawItemAnalysisList.length === 0
                          ? 'Belum ada data soal atau jawaban siswa yang siap dianalisis. Upload file .cbt siswa terlebih dahulu.'
                          : 'Tidak ada butir soal yang sesuai dengan pencarian / filter Anda.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAnalisisList.map((item) => {
                      const totalRes = item.totalRespondents || 1;
                      const pA = Math.round((item.countA / totalRes) * 100);
                      const pB = Math.round((item.countB / totalRes) * 100);
                      const pC = Math.round((item.countC / totalRes) * 100);
                      const pD = Math.round((item.countD / totalRes) * 100);
                      const pE = Math.round((item.countE / totalRes) * 100);
                      const pEmp = Math.round((item.countEmpty / totalRes) * 100);

                      const isNegativeDisc = item.discriminationIndex < 0;

                      return (
                        <tr key={item.questionNumber} className={`transition-colors ${isNegativeDisc ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/80'}`}>
                          <td className="p-3 text-center font-bold text-gray-700">{item.questionNumber}</td>
                          <td className="p-3">
                            <p className="font-semibold text-gray-900 line-clamp-2">{item.questionText}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-teal-700 bg-teal-50 font-bold px-1.5 py-0.5 rounded border border-teal-200">
                                {item.mapel}
                              </span>
                              {isNegativeDisc && (
                                <span className="text-[10px] text-rose-700 bg-rose-100 font-bold px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-0.5">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" /> Cek Kunci
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="w-7 h-7 inline-flex items-center justify-center font-black rounded-lg bg-emerald-600 text-white shadow-2xs">
                              {item.keyOption}
                            </span>
                          </td>
                          <td className="p-3">
                            {/* Stacked Percentage Visual Bar */}
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex mb-1.5 border border-slate-200">
                              <div style={{ width: `${pA}%` }} className="bg-emerald-500" title={`A: ${item.countA} (${pA}%)`} />
                              <div style={{ width: `${pB}%` }} className="bg-sky-500" title={`B: ${item.countB} (${pB}%)`} />
                              <div style={{ width: `${pC}%` }} className="bg-amber-500" title={`C: ${item.countC} (${pC}%)`} />
                              <div style={{ width: `${pD}%` }} className="bg-purple-500" title={`D: ${item.countD} (${pD}%)`} />
                              <div style={{ width: `${pE}%` }} className="bg-indigo-500" title={`E: ${item.countE} (${pE}%)`} />
                              <div style={{ width: `${pEmp}%` }} className="bg-slate-300" title={`Kosong: ${item.countEmpty} (${pEmp}%)`} />
                            </div>

                            <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
                              <span className={`px-1 py-0.5 rounded font-bold ${item.keyOption === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                A:{item.countA}
                              </span>
                              <span className={`px-1 py-0.5 rounded font-bold ${item.keyOption === 'B' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                B:{item.countB}
                              </span>
                              <span className={`px-1 py-0.5 rounded font-bold ${item.keyOption === 'C' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                C:{item.countC}
                              </span>
                              <span className={`px-1 py-0.5 rounded font-bold ${item.keyOption === 'D' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                D:{item.countD}
                              </span>
                              <span className={`px-1 py-0.5 rounded font-bold ${item.keyOption === 'E' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                E:{item.countE}
                              </span>
                              {item.countEmpty > 0 && (
                                <span className="px-1 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  K:{item.countEmpty}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center text-gray-700">
                            <span className="text-emerald-600 font-bold">{item.totalCorrect}</span> /{' '}
                            <span className="text-gray-500 font-medium">{item.totalRespondents}</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono font-extrabold text-xs text-slate-800">
                                {item.difficultyIndex.toFixed(2)}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase mt-0.5 ${
                                  item.difficultyCategory === 'Mudah'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : item.difficultyCategory === 'Sedang'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {item.difficultyCategory}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-mono font-black text-xs ${isNegativeDisc ? 'text-rose-700 bg-rose-100 px-1.5 rounded' : 'text-slate-800'}`}>
                                {item.discriminationIndex.toFixed(2)}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase mt-0.5 ${
                                  isNegativeDisc
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : item.discriminationCategory === 'Sangat Baik' || item.discriminationCategory === 'Baik'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : item.discriminationCategory === 'Cukup'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {item.discriminationCategory}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                              (item.distractorHealthScore || 0) >= 75
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : (item.distractorHealthScore || 0) >= 50
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {item.effectiveDistractorCount}/{item.totalDistractors} ({item.distractorHealthScore}%)
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-block ${
                                  item.recommendation === 'Diterima'
                                    ? 'bg-emerald-600 text-white'
                                    : item.recommendation === 'Direvisi'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {item.recommendation}
                              </span>
                              <p className="text-[11px] text-slate-600 leading-tight">
                                {item.diagnosticNote}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailItem(item)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 mx-auto"
                              title="Bedah Detail Pengecoh & Kelompok Atas / Bawah"
                            >
                              <Search className="w-3 h-3 text-teal-600" /> Bedah
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL BEDAH BUTIR SOAL & EFEKTIVITAS DISTRAKTOR */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-teal-400" /> Detail Bedah Soal No. {selectedDetailItem.questionNumber}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mata Pelajaran: {selectedDetailItem.mapel} | Kunci Jawaban: <span className="font-bold text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded">[{selectedDetailItem.keyOption}]</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Teks Soal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Teks Pertanyaan Soal:</span>
                <p className="font-medium text-slate-800 text-sm mt-1 whitespace-pre-wrap">{selectedDetailItem.questionText}</p>
              </div>

              {/* Status Ringkasan Parameter */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-200">
                  <span className="text-[10px] font-bold text-teal-600 uppercase">Tingkat Kesukaran (P)</span>
                  <div className="text-lg font-black text-teal-900 mt-0.5">{selectedDetailItem.difficultyIndex.toFixed(2)}</div>
                  <span className="text-[10px] font-bold text-teal-700">{selectedDetailItem.difficultyCategory}</span>
                </div>

                <div className={`p-3 rounded-xl border ${selectedDetailItem.discriminationIndex < 0 ? 'bg-rose-50 border-rose-300' : 'bg-blue-50/70 border-blue-200'}`}>
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Daya Beda (D)</span>
                  <div className={`text-lg font-black mt-0.5 ${selectedDetailItem.discriminationIndex < 0 ? 'text-rose-700' : 'text-blue-900'}`}>
                    {selectedDetailItem.discriminationIndex.toFixed(2)}
                  </div>
                  <span className={`text-[10px] font-bold ${selectedDetailItem.discriminationIndex < 0 ? 'text-rose-700' : 'text-blue-700'}`}>
                    {selectedDetailItem.discriminationCategory}
                  </span>
                </div>

                <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-600 uppercase">Distraktor Efektif</span>
                  <div className="text-lg font-black text-purple-900 mt-0.5">{selectedDetailItem.distractorHealthScore}%</div>
                  <span className="text-[10px] font-bold text-purple-700">{selectedDetailItem.effectiveDistractorCount}/{selectedDetailItem.totalDistractors} Pengecoh</span>
                </div>
              </div>

              {/* Matriks Analisis Kelompok Atas vs Kelompok Bawah */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600" /> Distribusi Jawaban Kelompok Atas (27%) vs Kelompok Bawah (27%)
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                        <th className="p-2.5 text-center">Opsi</th>
                        <th className="p-2.5">Pilihan / Distraktor</th>
                        <th className="p-2.5 text-center">Total Pemilih</th>
                        <th className="p-2.5 text-center">Kelompok Atas ({selectedDetailItem.groupSize || 0})</th>
                        <th className="p-2.5 text-center">Kelompok Bawah ({selectedDetailItem.groupSize || 0})</th>
                        <th className="p-2.5 text-center">Status Pengecoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {selectedDetailItem.distractors?.map((d) => (
                        <tr key={d.option} className={d.isKey ? 'bg-emerald-50/60 font-bold' : ''}>
                          <td className="p-2.5 text-center font-mono">
                            <span className={`w-6 h-6 inline-flex items-center justify-center rounded-md font-extrabold ${d.isKey ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                              {d.option}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {d.text || `Pilihan ${d.option}`}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">
                            {d.count} ({d.percentage}%)
                          </td>
                          <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">
                            {d.upperCount} Siswa
                          </td>
                          <td className="p-2.5 text-center font-mono text-rose-700 font-bold">
                            {d.lowerCount} Siswa
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.isKey
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : d.status === 'Efektif'
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : d.status === 'Tidak Efektif (0%)'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Diagnostik & Catatan Guru */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Rekomendasi Pedagogis Guru:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedDetailItem.diagnosticNote}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Tutup Bedah Soal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SISWA MANUAL */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Siswa Manual
              </h3>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  NIS / Nomor Induk Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNis}
                  onChange={(e) => setNewNis(e.target.value)}
                  placeholder="Contoh: 1006"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Andi Wijaya"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Kelas
                </label>
                <input
                  type="text"
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value)}
                  placeholder="Contoh: XII IPS 1"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Kode Guru (Penanda Mapel / Guru)
                </label>
                <input
                  type="text"
                  value={newStudentKodeGuru}
                  onChange={(e) => setNewStudentKodeGuru(e.target.value.toUpperCase())}
                  placeholder={`Contoh: ${config.kodeGuru || 'GURU01'}`}
                  className="w-full border-2 border-amber-200 bg-amber-50/50 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-amber-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH GURU MANUAL */}
      {isAddTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Guru Manual
              </h3>
              <button
                onClick={() => setIsAddTeacherModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacherManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="Contoh: guru_cbt / 198501152010011002"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  NAMA LENGKAP GURU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTeacherNama}
                  onChange={(e) => setNewTeacherNama(e.target.value)}
                  placeholder="Contoh: Drs. Aji Sosiologi, M.Pd"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  MATA PELAJARAN
                </label>
                <input
                  type="text"
                  value={newTeacherMapel}
                  onChange={(e) => setNewTeacherMapel(e.target.value)}
                  placeholder="Contoh: Sosiologi"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  KODE GURU (KODE UNIK MAPEL)
                </label>
                <input
                  type="text"
                  value={newTeacherKodeGuru}
                  onChange={(e) => setNewTeacherKodeGuru(e.target.value.toUpperCase())}
                  placeholder="Contoh: GURU01 / SOS01"
                  className="w-full border-2 border-amber-200 bg-amber-50/50 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-amber-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Data Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SISWA */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" /> Edit Data Siswa
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudentManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  NIS / Nomor Induk Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingStudent.nis}
                  onChange={(e) => setEditingStudent({ ...editingStudent, nis: e.target.value })}
                  placeholder="Contoh: 1001"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingStudent.nama}
                  onChange={(e) => setEditingStudent({ ...editingStudent, nama: e.target.value })}
                  placeholder="Contoh: Ahmad Fauzi"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Kelas
                </label>
                <input
                  type="text"
                  value={editingStudent.kelas}
                  onChange={(e) => setEditingStudent({ ...editingStudent, kelas: e.target.value })}
                  placeholder="Contoh: XII IPS 1"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Kode Guru
                </label>
                <input
                  type="text"
                  value={editingStudent.kodeGuru || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, kodeGuru: e.target.value.toUpperCase() })}
                  placeholder="Contoh: GURU01"
                  className="w-full border-2 border-amber-200 bg-amber-50/50 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-amber-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GURU */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" /> Edit Data Guru
              </h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacherManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Username / NIP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingTeacher.nip}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, nip: e.target.value })}
                  placeholder="Contoh: 198501152010011002"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Lengkap Guru <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingTeacher.nama}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, nama: e.target.value })}
                  placeholder="Contoh: Drs. Aji Sosiologi, M.Pd"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={editingTeacher.mapel}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, mapel: e.target.value })}
                  placeholder="Contoh: Sosiologi"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Kode Guru
                </label>
                <input
                  type="text"
                  value={editingTeacher.kodeGuru || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, kodeGuru: e.target.value.toUpperCase() })}
                  placeholder="Contoh: GURU01"
                  className="w-full border-2 border-amber-200 bg-amber-50/50 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-amber-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH ADMIN MANUAL */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Akun Admin / Proktor
              </h3>
              <button
                onClick={() => setIsAddAdminModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdminManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Username Admin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="Contoh: adminproktor01"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Password Akses <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Contoh: ProktorPass2026"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Lengkap Admin / Proktor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAdminNama}
                  onChange={(e) => setNewAdminNama(e.target.value)}
                  placeholder="Contoh: Haji Ahmad, S.Kom"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Jabatan / Role
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'superadmin' | 'proktor' | 'admin')}
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-bold bg-white"
                >
                  <option value="admin">Administrator (Standard)</option>
                  <option value="proktor">Proktor Ujian</option>
                  <option value="superadmin">Super Admin Utama</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAdminModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Akun Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT AKUN ADMIN */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" /> Edit Akun Admin / Proktor
              </h3>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdminManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Username Admin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingAdmin.username}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                  placeholder="Contoh: adminproktor01"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Password Akses <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingAdmin.password || ''}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                  placeholder="Password Baru"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Lengkap Admin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingAdmin.nama}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, nama: e.target.value })}
                  placeholder="Contoh: Haji Ahmad, S.Kom"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Jabatan / Role
                </label>
                <select
                  value={editingAdmin.role || 'admin'}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value as 'superadmin' | 'proktor' | 'admin' })}
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-bold bg-white"
                >
                  <option value="admin">Administrator (Standard)</option>
                  <option value="proktor">Proktor Ujian</option>
                  <option value="superadmin">Super Admin Utama</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI UPLOAD EXCEL & PILIH MATA PELAJARAN */}
      {isUploadMapelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="bg-sky-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" /> Import Excel Soal - Pilih Mata Pelajaran
              </h3>
              <button
                onClick={() => {
                  setIsUploadMapelModalOpen(false);
                  setUploadPendingQuestions([]);
                }}
                className="text-sky-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 space-y-1">
                  <p className="font-bold text-sm text-sky-950">File Excel Berhasil Dibaca!</p>
                  <p><b>Nama File:</b> {uploadFileName}</p>
                  <p><b>Jumlah Soal Terdeteksi:</b> <span className="text-emerald-700 font-extrabold">{uploadPendingQuestions.length} Soal</span></p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase text-gray-700 tracking-wider">
                  Pilih Mata Pelajaran Untuk Soal Ini <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Pilih Mata Pelajaran sesuai pengaturan menu <b>MATA PELAJARAN</b> agar soal terorganisir dan tidak tertukar di Bank Soal:
                </p>
                <select
                  value={uploadTargetMapel}
                  onChange={(e) => setUploadTargetMapel(e.target.value)}
                  className="w-full border-2 border-sky-500/70 bg-white rounded-xl p-3 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 focus:outline-none text-sm font-bold text-gray-900 cursor-pointer shadow-xs"
                >
                  {mapelList.map((m) => (
                    <option key={m} value={m} className="font-semibold">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Sebanyak <b>{uploadPendingQuestions.length} soal</b> akan disimpan ke Bank Soal dengan label Mata Pelajaran <b>"{uploadTargetMapel}"</b>.
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadMapelModalOpen(false);
                    setUploadPendingQuestions([]);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUploadWithMapel}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Import {uploadPendingQuestions.length} Soal Ke Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW SOAL UJIAN */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Preview Tampilan Soal Ujian</h3>
                  <p className="text-[11px] text-slate-300">Simulasi tampilan soal di layar siswa</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Badges Info */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-100 text-sky-800 text-xs font-extrabold px-3 py-1 rounded-lg border border-sky-200">
                    Mata Pelajaran: {previewQuestion.mapel || mapelInput || 'Sosiologi'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {previewQuestion.id}</span>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 ${
                    previewQuestion.isActive !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {previewQuestion.isActive !== false ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Aktif dalam Ujian
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-500" /> Nonaktif
                    </>
                  )}
                </span>
              </div>

              {/* Gambar / Tabel / Diagram terlampir jika ada */}
              {previewQuestion.image && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-center">
                  <img
                    src={previewQuestion.image}
                    alt="Lampiran Soal"
                    className="max-h-72 w-auto object-contain rounded-xl border border-slate-200 shadow-xs"
                  />
                </div>
              )}

              {/* Question Text */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Teks Pertanyaan
                </p>
                <div
                  className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: formatQuestionText(previewQuestion.question) }}
                />
              </div>

              {/* Options list / Category Table */}
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Pilihan Jawaban & Kunci Jawaban
                </p>
                {(previewQuestion.bentukSoal || '').toLowerCase().includes('kategori') || (previewQuestion.categoryStatements && previewQuestion.categoryStatements.length > 0) ? (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-teal-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                          <th className="p-3 border-b border-teal-800 w-12 text-center">No</th>
                          <th className="p-3 border-b border-teal-800">Pernyataan</th>
                          <th className="p-3 border-b border-teal-800 text-center">Kunci Jawaban Kategori</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {(previewQuestion.categoryStatements || []).map((st, idx) => (
                          <tr key={st.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3 text-slate-900">{st.statement}</td>
                            <td className="p-3 text-center">
                              <span className="inline-block bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-lg border border-emerald-300">
                                ✓ {st.correctCategory}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  previewQuestion.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          opt.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <div className="flex-1 pt-1 text-sm">{opt.text}</div>
                      {opt.isCorrect && (
                        <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-700" /> KUNCI JAWABAN
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Explanation / Pembahasan */}
              {previewQuestion.explanation && (
                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-1">
                  <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Pembahasan Soal
                  </p>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    {previewQuestion.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetQ = previewQuestion;
                  setPreviewQuestion(null);
                  onOpenQuestionModal(targetQ);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit Soal Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN KOP SEKOLAH & TANDA TANGAN */}
      {isKopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          {/* Hidden File Inputs for Logos */}
          <input
            type="file"
            ref={logoPemdaInputRef}
            onChange={(e) => handleLogoUpload(e, 'pemda')}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />
          <input
            type="file"
            ref={logoSekolahInputRef}
            onChange={(e) => handleLogoUpload(e, 'sekolah')}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" /> Atur Kop Surat, Logo & Tanda Tangan Laporan
              </h3>
              <button
                type="button"
                onClick={() => setIsKopModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKopSekolah} className="p-6 space-y-4 overflow-y-auto">
              {/* SECTION LOGO PEMDA & LOGO SEKOLAH */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-600" /> Logo Pemda / Dinas & Logo Sekolah
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">PNG / JPG Max 2MB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* LOGO PEMDA / DINAS (KIRI) */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">1. Logo Pemda / Dinas (Kiri)</span>
                      {kopForm.logoPemda && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Tersedia
                        </span>
                      )}
                    </div>

                    {kopForm.logoPemda ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <img
                          src={kopForm.logoPemda}
                          alt="Logo Pemda"
                          className="w-12 h-12 object-contain bg-white rounded border border-slate-200 p-1"
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <button
                            type="button"
                            onClick={() => logoPemdaInputRef.current?.click()}
                            className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-2 py-1 rounded border border-sky-200 transition cursor-pointer"
                          >
                            Ganti Logo Pemda
                          </button>
                          <button
                            type="button"
                            onClick={() => setKopForm((prev) => ({ ...prev, logoPemda: '' }))}
                            className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded border border-red-200 transition cursor-pointer"
                          >
                            Hapus Logo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoPemdaInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-xl p-3 flex flex-col items-center justify-center text-center transition cursor-pointer group"
                      >
                        <Upload className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-xs font-bold text-sky-900">Upload Logo Pemda</span>
                        <span className="text-[10px] text-slate-500">Sebelah Kiri Kop</span>
                      </button>
                    )}
                  </div>

                  {/* LOGO SEKOLAH (KANAN) */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">2. Logo Sekolah (Kanan)</span>
                      {kopForm.logoSekolah && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Tersedia
                        </span>
                      )}
                    </div>

                    {kopForm.logoSekolah ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <img
                          src={kopForm.logoSekolah}
                          alt="Logo Sekolah"
                          className="w-12 h-12 object-contain bg-white rounded border border-slate-200 p-1"
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <button
                            type="button"
                            onClick={() => logoSekolahInputRef.current?.click()}
                            className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-2 py-1 rounded border border-sky-200 transition cursor-pointer"
                          >
                            Ganti Logo Sekolah
                          </button>
                          <button
                            type="button"
                            onClick={() => setKopForm((prev) => ({ ...prev, logoSekolah: '' }))}
                            className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded border border-red-200 transition cursor-pointer"
                          >
                            Hapus Logo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoSekolahInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-xl p-3 flex flex-col items-center justify-center text-center transition cursor-pointer group"
                      >
                        <Upload className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-xs font-bold text-sky-900">Upload Logo Sekolah</span>
                        <span className="text-[10px] text-slate-500">Sebelah Kanan Kop</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PRATINJAU KOP SURAT (LIVE PREVIEW) */}
              <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-slate-300 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Pratinjau Kop Surat PDF:
                </span>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-center select-none">
                  {/* Left Logo */}
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {kopForm.logoPemda ? (
                      <img src={kopForm.logoPemda} alt="Pemda" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-10 h-10 border border-dashed border-slate-300 rounded text-[9px] text-slate-400 flex items-center justify-center font-bold">
                        [Pemda]
                      </div>
                    )}
                  </div>

                  {/* Center Text */}
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] font-bold uppercase text-slate-700 leading-tight">
                      {kopForm.dinas || 'DINAS PENDIDIKAN'}
                    </p>
                    <p className="text-xs font-extrabold uppercase text-slate-900 leading-tight">
                      {kopForm.namaSekolah || 'NAMA SEKOLAH'}
                    </p>
                    <p className="text-[9px] text-slate-600 leading-tight">
                      {kopForm.alamat || 'Alamat Sekolah'}
                    </p>
                    {kopForm.teleponWeb && (
                      <p className="text-[8px] text-slate-500 leading-tight">{kopForm.teleponWeb}</p>
                    )}
                  </div>

                  {/* Right Logo */}
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {kopForm.logoSekolah ? (
                      <img src={kopForm.logoSekolah} alt="Sekolah" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-10 h-10 border border-dashed border-slate-300 rounded text-[9px] text-slate-400 flex items-center justify-center font-bold">
                        [Sekolah]
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-1 border-b-2 border-slate-900" />
                <div className="mt-[1px] border-b border-slate-900" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Dinas Pendidikan / Instansi
                </label>
                <input
                  type="text"
                  value={kopForm.dinas}
                  onChange={(e) => setKopForm({ ...kopForm, dinas: e.target.value })}
                  placeholder="Contoh: DINAS PENDIDIKAN PROVINSI DKI JAKARTA"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Sekolah / Madrasah
                </label>
                <input
                  type="text"
                  value={kopForm.namaSekolah}
                  onChange={(e) => setKopForm({ ...kopForm, namaSekolah: e.target.value })}
                  placeholder="Contoh: SMA NEGERI 1 JAKARTA"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  value={kopForm.alamat}
                  onChange={(e) => setKopForm({ ...kopForm, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Budi Utomo No. 7, Jakarta Pusat"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Telepon / Email / Website
                </label>
                <input
                  type="text"
                  value={kopForm.teleponWeb}
                  onChange={(e) => setKopForm({ ...kopForm, teleponWeb: e.target.value })}
                  placeholder="Contoh: Telp: (021) 3865001 | Email: cbt@sman1jakarta.sch.id"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Kota & Tanggal Laporan
                  </label>
                  <input
                    type="text"
                    value={kopForm.kotaTanggal}
                    onChange={(e) => setKopForm({ ...kopForm, kotaTanggal: e.target.value })}
                    placeholder="Contoh: Jakarta, 26 Juli 2026"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Jabatan Guru
                  </label>
                  <input
                    type="text"
                    value={kopForm.jabatanGuru}
                    onChange={(e) => setKopForm({ ...kopForm, jabatanGuru: e.target.value })}
                    placeholder="Contoh: Guru Mata Pelajaran Sosiologi"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Nama Lengkap Guru (Penandatangan)
                  </label>
                  <input
                    type="text"
                    value={kopForm.namaGuru}
                    onChange={(e) => setKopForm({ ...kopForm, namaGuru: e.target.value })}
                    placeholder="Contoh: Drs. Aji Sosiologi, M.Pd"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    NIP Guru
                  </label>
                  <input
                    type="text"
                    value={kopForm.nipGuru}
                    onChange={(e) => setKopForm({ ...kopForm, nipGuru: e.target.value })}
                    placeholder="Contoh: 198501152010011002"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Nama Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={kopForm.namaKepalaSekolah}
                    onChange={(e) => setKopForm({ ...kopForm, namaKepalaSekolah: e.target.value })}
                    placeholder="Contoh: Dr. H. Ahmad Sanusi, M.Si"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={kopForm.nipKepalaSekolah}
                    onChange={(e) => setKopForm({ ...kopForm, nipKepalaSekolah: e.target.value })}
                    placeholder="Contoh: 197203101998021001"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              {/* SECTION UKURAN KERTAS DEFAULT */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-600" /> Ukuran Kertas & Layout Cetak PDF Default
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Pengaturan Standar Kop</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilihan Ukuran Kertas
                    </label>
                    <select
                      value={kopForm.paperSize || 'a4'}
                      onChange={(e) => setKopForm((prev) => ({ ...prev, paperSize: e.target.value as any }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                    >
                      <option value="a4">A4 (210 x 297 mm) - Standar</option>
                      <option value="f4">F4 / Folio (210 x 330 mm) - Standar Sekolah</option>
                      <option value="letter">Letter / Kuarto (216 x 279 mm)</option>
                      <option value="legal">Legal (216 x 356 mm) - Panjang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Orientasi Halaman Default
                    </label>
                    <select
                      value={kopForm.orientation || 'portrait'}
                      onChange={(e) => setKopForm((prev) => ({ ...prev, orientation: e.target.value as any }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                    >
                      <option value="portrait">Portrait (Potret / Tegak)</option>
                      <option value="landscape">Landscape (Mendatar / Lansekap)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsKopModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Kop & TTD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN UKURAN KERTAS & LAYOUT CETAK PDF */}
      {isPdfPaperModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Printer className="w-5 h-5 text-sky-400" /> Pengaturan Ukuran Kertas & Layout Cetak PDF
              </h3>
              <button
                type="button"
                onClick={() => setIsPdfPaperModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 text-sky-900 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-sky-600" />
                  {pdfTargetAction === 'REKAP_HASIL'
                    ? 'Laporan Rekapitulasi Nilai Ujian Siswa'
                    : pdfTargetAction === 'ANALISIS_SOAL'
                    ? 'Laporan Analisis Butir Soal & Psikometrik'
                    : `Laporan Hasil Individu: ${selectedIndividualResult?.studentInfo.name || 'Siswa'}`}
                </p>
                <p className="text-[11px] text-sky-700">
                  Pilih ukuran kertas dan orientasi halaman yang Anda gunakan pada printer atau penyimpanan PDF Anda.
                </p>
              </div>

              {/* UKURAN KERTAS (PAPER SIZE) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Pilih Ukuran Kertas (Paper Format)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPaperSize('a4')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPaperSize === 'a4'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">📄 A4</span>
                      {selectedPaperSize === 'a4' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">210 × 297 mm</span>
                    <span className="text-[9px] font-medium text-sky-700 mt-1">Standar Internasional / Kantor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaperSize('f4')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPaperSize === 'f4'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">📜 F4 / Folio</span>
                      {selectedPaperSize === 'f4' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">210 × 330 mm</span>
                    <span className="text-[9px] font-bold text-amber-600 mt-1">Standar Raport & Sekolah Indo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaperSize('letter')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPaperSize === 'letter'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">📑 Letter / Kuarto</span>
                      {selectedPaperSize === 'letter' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">215.9 × 279.4 mm</span>
                    <span className="text-[9px] font-medium text-slate-500 mt-1">Ukuran Pendek Standard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaperSize('legal')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPaperSize === 'legal'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">📋 Legal</span>
                      {selectedPaperSize === 'legal' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">215.9 × 355.6 mm</span>
                    <span className="text-[9px] font-medium text-slate-500 mt-1">Ukuran Panjang US</span>
                  </button>
                </div>
              </div>

              {/* ORIENTASI HALAMAN (ORIENTATION) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Pilih Orientasi Halaman
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPaperOrientation('portrait')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedPaperOrientation === 'portrait'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-10 border-2 border-slate-700 rounded bg-white flex items-center justify-center font-bold text-[9px] shrink-0">
                      Tegak
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Portrait (Potret / Tegak)</span>
                      <span className="text-[10px] text-slate-500 block">Cocok untuk Rekap Nilai</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaperOrientation('landscape')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedPaperOrientation === 'landscape'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-8 border-2 border-slate-700 rounded bg-white flex items-center justify-center font-bold text-[9px] shrink-0">
                      Mendatar
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Landscape (Mendatar)</span>
                      <span className="text-[10px] text-slate-500 block">Cocok untuk Analisis Soal</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SIMPAN DESAIN DEFAULT CHECKBOX */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="savePaperDefault"
                  checked={savePaperAsDefault}
                  onChange={(e) => setSavePaperAsDefault(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="savePaperDefault" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Simpan pilihan ukuran kertas & orientasi ini sebagai default Kop
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPdfPaperModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmExecutePdfDownload}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Cetak / Download PDF Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUDIT INDIKASI KECURANGAN SISWA */}
      {isAuditModalOpen && selectedAuditResult && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${selectedAuditResult.warnings > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Audit Keamanan & Indikasi Kecurangan Siswa
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedAuditResult.studentInfo.name} — NIS: {selectedAuditResult.studentInfo.noPeserta}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
              {/* Ringkasan Perangkat & Lokasi IP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-slate-400">IP Address / Network</div>
                    <div className="text-xs font-mono font-bold text-slate-800 truncate">
                      {selectedAuditResult.ipAddress || '180.252.12.11 (Local Network)'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sistem & Perangkat</div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {selectedAuditResult.deviceInfo || 'Chrome Browser / Desktop OS'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Peringatan Kebocoran */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedAuditResult.warnings === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : selectedAuditResult.warnings < 3
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {selectedAuditResult.warnings === 0
                        ? '🟢 Sesi Ujian Bersih & Jujur'
                        : selectedAuditResult.warnings < 3
                        ? '🟡 Terdeteksi Peringatan Ringan'
                        : '🔴 Terdeteksi Pelanggaran Keamanan Tinggi'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      Total Peringatan Keamanan: {selectedAuditResult.warnings}x Kejadian
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-white/80 shadow-2xs">
                  {selectedAuditResult.warnings} Violation(s)
                </span>
              </div>

              {/* Timeline Tabel Log Kecurangan */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" /> Timeline Kejadian Pelanggaran
                </h4>
                {(!selectedAuditResult.cheatingLogs || selectedAuditResult.cheatingLogs.length === 0) ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
                    Tidak ditemukan catatan riwayat kecurangan. Siswa mengerjakan ujian secara mandiri dan jujur tanpa berpindah tab.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-3">Waktu WIB</th>
                          <th className="p-3">Jenis Peringatan Keamanan</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAuditResult.cheatingLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-600">{log.timestamp}</td>
                            <td className="p-3 font-medium text-slate-800">{log.type || log.details || (log as any).reason || 'Peringatan Keamanan Ujian'}</td>
                            <td className="p-3 text-center">
                              <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                                Peringatan #{idx + 1}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Tutup Detail Audit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: DOWNLOAD ANIMATION */}
      <DownloadAnimationModal
        isOpen={isDownloadModalOpen}
        title={downloadModalConfig.title}
        subtitle={downloadModalConfig.subtitle}
        fileName={downloadModalConfig.fileName}
        fileType={downloadModalConfig.fileType}
        onComplete={downloadModalConfig.onCompleteAction}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* MODAL: EXPORT SOAL STANDAR NASIONAL (PDF / WORD) */}
      <ExportQuestionModal
        isOpen={isExportQuestionModalOpen}
        onClose={() => setIsExportQuestionModalOpen(false)}
        allQuestions={config.questions || []}
        selectedQuestionIds={selectedQuestionIds}
        currentMapel={selectedBankMapel !== 'ALL' ? selectedBankMapel : (config.mapel || 'Sosiologi')}
        kopSekolah={config.kopSekolah}
      />

      {/* MODAL: PILIH & UNDUH TEMPLATE EXCEL SOAL */}
      {isDownloadTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-emerald-800">
              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Unduh Template Excel Soal CBT
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Silakan pilih format template Excel yang ingin diunduh sesuai dengan bentuk soal yang akan Anda buat:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDownloadTemplateModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-full hover:bg-emerald-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Option 1: PG Sederhana */}
              <div className="bg-blue-50/70 border-2 border-blue-200 hover:border-blue-400 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      1 Kunci (A-E)
                    </span>
                    <h4 className="font-extrabold text-blue-950 text-sm">Template Pilihan Ganda Sederhana (PG)</h4>
                  </div>
                  <p className="text-xs text-blue-900 font-medium leading-relaxed">
                    Format standar 5 pilihan jawaban (Opsi A - E) dengan 1 kunci jawaban bernilai benar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadTemplatePG();
                    setIsDownloadTemplateModalOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Excel PG
                </button>
              </div>

              {/* Option 2: PG Kompleks MCMA */}
              <div className="bg-purple-50/70 border-2 border-purple-200 hover:border-purple-400 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Multi-Answer
                    </span>
                    <h4 className="font-extrabold text-purple-950 text-sm">Template Pilihan Ganda Kompleks MCMA</h4>
                  </div>
                  <p className="text-xs text-purple-900 font-medium leading-relaxed">
                    Format pilihan ganda dengan lebih dari 1 pilihan jawaban benar (contoh format kunci: <code className="bg-purple-100 px-1 py-0.5 rounded font-mono font-bold text-purple-800">A,C,E</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadTemplateMCMA();
                    setIsDownloadTemplateModalOpen(false);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Excel MCMA
                </button>
              </div>

              {/* Option 3: PG Kompleks Kategori */}
              <div className="bg-emerald-50/70 border-2 border-emerald-200 hover:border-emerald-400 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Benar/Salah & Ya/Tidak
                    </span>
                    <h4 className="font-extrabold text-emerald-950 text-sm">Template Pilihan Ganda Kompleks Kategori</h4>
                  </div>
                  <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                    Format daftar pernyataan HOTS dengan pilihan Kategori (contoh format kunci: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold text-emerald-800">1:Benar|2:Salah|3:Benar</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadTemplateKategori();
                    setIsDownloadTemplateModalOpen(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Excel Kategori
                </button>
              </div>

              {/* Option 4: Combined Gabungan */}
              <div className="bg-slate-50 border-2 border-slate-200 hover:border-slate-400 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Format Lengkap
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">Template Semua Bentuk Soal (Gabungan)</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Berisi baris contoh untuk ketiga bentuk soal sekaligus dalam 1 file Excel (PG Sederhana, MCMA, dan Kategori).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadTemplateGabungan();
                    setIsDownloadTemplateModalOpen(false);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Excel Gabungan
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsDownloadTemplateModalOpen(false);
                  setIsExcelGuideModalOpen(true);
                }}
                className="text-amber-700 hover:text-amber-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" /> Buka Panduan & FAQ Detail
              </button>
              <button
                type="button"
                onClick={() => setIsDownloadTemplateModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PILIH WADAH & UPLOAD EXCEL SOAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-blue-800">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" /> Upload File Excel Soal CBT
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Silakan pilih wadah upload Excel yang sesuai dengan bentuk soal yang ingin Anda masukkan:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-blue-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - 4 Dedicated Containers */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
              {/* Container 1: PG Sederhana */}
              <div className="bg-white border-2 border-blue-200 hover:border-blue-500 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      1 Kunci (A-E)
                    </span>
                    <h4 className="font-extrabold text-blue-950 text-sm">Wadah Upload PG Sederhana</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Untuk mengunggah file Excel berisi soal Pilihan Ganda standar dengan 1 kunci jawaban (Opsi A - E).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      handleDownloadTemplatePG();
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Template Excel PG Sederhana"
                  >
                    <Download className="w-3.5 h-3.5" /> Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Excel PG
                  </button>
                </div>
              </div>

              {/* Container 2: PG Kompleks MCMA */}
              <div className="bg-white border-2 border-purple-200 hover:border-purple-500 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Multi-Answer
                    </span>
                    <h4 className="font-extrabold text-purple-950 text-sm">Wadah Upload PG Kompleks MCMA</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Untuk mengunggah file Excel berisi soal Pilihan Ganda Kompleks dengan &gt;1 jawaban benar.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      handleDownloadTemplateMCMA();
                    }}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Template Excel MCMA"
                  >
                    <Download className="w-3.5 h-3.5" /> Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Excel MCMA
                  </button>
                </div>
              </div>

              {/* Container 3: PG Kompleks Kategori */}
              <div className="bg-white border-2 border-teal-200 hover:border-teal-500 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-teal-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Kategori / AKM
                    </span>
                    <h4 className="font-extrabold text-teal-950 text-sm">Wadah Upload PG Kompleks Kategori</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Untuk mengunggah file Excel berisi daftar pernyataan HOTS (Sesuai/Tidak Sesuai, Benar/Salah).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      handleDownloadTemplateKategori();
                    }}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Template Excel Kategori"
                  >
                    <Download className="w-3.5 h-3.5" /> Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Excel Kategori
                  </button>
                </div>
              </div>

              {/* Container 4: Combined Gabungan */}
              <div className="bg-white border-2 border-slate-200 hover:border-slate-500 p-4 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Format Lengkap
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">Wadah Upload Semua Bentuk Soal (Gabungan)</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Untuk mengunggah file Excel yang berisi berbagai jenis soal sekaligus dalam 1 file.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      handleDownloadTemplateGabungan();
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Template Excel Gabungan"
                  >
                    <Download className="w-3.5 h-3.5" /> Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Excel Gabungan
                  </button>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setIsUploadModalOpen(false);
                    const mockEvent = {
                      target: { files: e.dataTransfer.files, value: '' },
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleFileUpload(mockEvent);
                  }
                }}
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setTimeout(() => fileInputRef.current?.click(), 50);
                }}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 p-5 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Atau tarik & lepas (Drag & Drop) file Excel ke sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung format file <code className="font-bold text-blue-700">.xlsx</code> dan <code className="font-bold text-blue-700">.xls</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setIsExcelGuideModalOpen(true);
                }}
                className="text-amber-700 hover:text-amber-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" /> Buka Panduan & FAQ Detail
              </button>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PANDUAN PETUNJUK IMPOR SOAL EXCEL */}
      <ExcelGuideModal
        isOpen={isExcelGuideModalOpen}
        onClose={() => setIsExcelGuideModalOpen(false)}
        onDownloadTemplate={(type) => {
          if (type === 'pg') handleDownloadTemplatePG();
          else if (type === 'mcma') handleDownloadTemplateMCMA();
          else if (type === 'kategori') handleDownloadTemplateKategori();
          else handleDownloadTemplateGabungan();
        }}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      {/* MODAL: CETAK KARTU UJIAN & AKSES USERS (PDF / PRINT) */}
      <ExamCardPrintModal
        isOpen={isExamCardPrintModalOpen}
        onClose={() => setIsExamCardPrintModalOpen(false)}
        students={displayStudentsList}
        teachers={teachersList}
        kopSekolah={config.kopSekolah}
        currentExamToken={activeTeacherObj?.examToken || config.examToken || 'CBT2026'}
      />

      {/* MODAL: MONITORING REAL-TIME PROGRES UJIAN SISWA PER KELAS */}
      <RealTimeProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        realTimeStats={realTimeStats}
        availableKelasList={availableKelasList}
        progressSearch={progressSearch}
        setProgressSearch={setProgressSearch}
        progressClassFilter={progressClassFilter}
        setProgressClassFilter={setProgressClassFilter}
        progressStatusFilter={progressStatusFilter}
        setProgressStatusFilter={setProgressStatusFilter}
      />

      {/* MODAL: SINKRONISASI GOOGLE SHEETS & APPS SCRIPT (CODE.GS) */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        questions={filteredQuestions}
        currentMapel={mapelInput}
        currentKodeGuru={loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'))}
        savedWebhookUrl={config.googleSheetsWebhookUrl || ''}
        onSaveWebhookUrl={(url) => {
          onSaveConfig({
            ...config,
            googleSheetsWebhookUrl: url,
          });
        }}
        students={displayStudentsList}
        teachers={teachersList}
        admins={adminsList}
        onSyncStudents={(newStudents) => {
          onSaveConfig({
            ...config,
            students: newStudents,
          });
        }}
        onSyncTeachers={(newTeachers) => {
          onSaveConfig({
            ...config,
            teachers: newTeachers,
          });
        }}
        onSyncAdmins={(newAdmins) => {
          onSaveConfig({
            ...config,
            admins: newAdmins,
          });
        }}
        onSyncQuestions={(importedQuestions, mode) => {
          const currentQuestions = config.questions || [];
          let updatedList: Question[] = [];
          if (mode === 'overwrite') {
            const mapelToReplace = importedQuestions[0]?.mapel || mapelInput;
            const remaining = currentQuestions.filter(
              (q) => (q.mapel || config.mapel || 'Sosiologi') !== mapelToReplace
            );
            const maxExistingId = remaining.reduce((max, q) => Math.max(max, q.id), 0);
            const reindexedImported = importedQuestions.map((q, idx) => ({
              ...q,
              id: maxExistingId + idx + 1,
            }));
            updatedList = [...remaining, ...reindexedImported];
          } else {
            const maxExistingId = currentQuestions.reduce((max, q) => Math.max(max, q.id), 0);
            const reindexedImported = importedQuestions.map((q, idx) => ({
              ...q,
              id: maxExistingId + idx + 1,
            }));
            updatedList = [...currentQuestions, ...reindexedImported];
          }
          onSaveConfig({
            ...config,
            questions: updatedList,
          });
        }}
        showAlert={showAlert}
      />

      {/* MODAL: DOWNLOAD & IMPORT BANK SOAL FORMAT JSON (+ GAMBAR) */}
      <JsonQuestionsModal
        isOpen={isJsonQuestionsModalOpen}
        onClose={() => setIsJsonQuestionsModalOpen(false)}
        allQuestions={config.questions}
        filteredQuestions={filteredQuestions}
        currentMapel={mapelInput}
        currentKodeGuru={loggedInTeacher?.kodeGuru || (selectedGuruFilter !== 'ALL' ? selectedGuruFilter : (config.kodeGuru || 'GURU01'))}
        activeTeacherName={activeTeacherObj?.nama}
        onImportQuestions={handleImportQuestionsFromJson}
        showAlert={showAlert}
        showConfirm={showConfirm}
      />

      
        </div>
      </div>
    </div>
  );
};
