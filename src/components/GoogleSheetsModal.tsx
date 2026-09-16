import React, { useState, useEffect } from 'react';
import { Question, StudentUser, TeacherUser, AdminUser } from '../types';
import {
  MASTER_APPS_SCRIPT_CODE_GS,
  sendAppsScriptRequest,
  fetchAppsScriptDatabase,
  fetchAppsScriptQuestions,
  fetchSpreadsheetSheetsList,
  AppsScriptAction,
  AppsScriptTarget,
} from '../utils/googleAppsScriptService';
import {
  X,
  Copy,
  Check,
  FileSpreadsheet,
  Send,
  Sparkles,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  RefreshCw,
  Users,
  GraduationCap,
  Shield,
  PlusCircle,
  Edit,
  Trash2,
  UploadCloud,
  DownloadCloud,
  FileJson,
  CheckSquare,
  Square,
  Eye,
  Play,
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Search,
  ListFilter
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  currentMapel: string;
  currentKodeGuru: string;
  savedWebhookUrl?: string;
  onSaveWebhookUrl: (url: string) => void;
  students?: StudentUser[];
  teachers?: TeacherUser[];
  admins?: AdminUser[];
  onSyncStudents?: (students: StudentUser[]) => void;
  onSyncTeachers?: (teachers: TeacherUser[]) => void;
  onSyncAdmins?: (admins: AdminUser[]) => void;
  onSyncQuestions?: (questions: Question[], mode: 'overwrite' | 'append') => void;
  showAlert: (msg: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  questions,
  currentMapel,
  currentKodeGuru,
  savedWebhookUrl = '',
  onSaveWebhookUrl,
  students = [],
  teachers = [],
  admins = [],
  onSyncStudents,
  onSyncTeachers,
  onSyncAdmins,
  onSyncQuestions,
  showAlert,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'crud_users' | 'sync_questions' | 'code' | 'payload_docs'>('crud_users');
  const [webhookUrl, setWebhookUrl] = useState(savedWebhookUrl);
  const [isCopied, setIsCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // CRUD User Sub-States
  const [crudTarget, setCrudTarget] = useState<AppsScriptTarget>('siswa');
  const [crudAction, setCrudAction] = useState<AppsScriptAction>('read');
  const [crudOverwrite, setCrudOverwrite] = useState(false);

  // Question Sync Direction (Export vs Import)
  const [questionSyncDirection, setQuestionSyncDirection] = useState<'export' | 'import'>('import');
  const [importTargetMapel, setImportTargetMapel] = useState(currentMapel || 'Sosiologi');
  const [importTargetSheet, setImportTargetSheet] = useState(`Bank_${(currentMapel || 'Sosiologi').replace(/[^a-zA-Z0-9]/g, '_')}`);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('overwrite');
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [isDetectingSheets, setIsDetectingSheets] = useState(false);

  // Forms for Create / Update
  const [studentForm, setStudentForm] = useState({
    nis: '',
    nama: '',
    kelas: 'XII-MIPA-1',
    password: '123',
    sesi: '1',
    ruang: 'Lab-01',
    kodeGuru: 'ALL',
  });

  const [teacherForm, setTeacherForm] = useState({
    kodeGuru: 'GR-01',
    nama: '',
    mapel: 'Sosiologi',
    nip: '',
    password: 'guru123',
    examToken: 'CBT2026',
  });

  const [adminForm, setAdminForm] = useState({
    username: 'admin2',
    nama: '',
    password: 'admin123',
    role: 'Proktor',
  });

  const [deleteIdInput, setDeleteIdInput] = useState('');

  // Status & Logs
  const [operationLog, setOperationLog] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: any;
    timestamp?: string;
  }>({
    status: 'idle',
    message: 'Siap menjalankan operasi CRUD & Sinkronisasi.',
  });

  // Questions Sync Mode
  const [questionSyncMode, setQuestionSyncMode] = useState<'append' | 'overwrite'>('overwrite');

  useEffect(() => {
    setWebhookUrl(savedWebhookUrl);
  }, [savedWebhookUrl]);

  useEffect(() => {
    if (currentMapel) {
      setImportTargetMapel(currentMapel);
      setImportTargetSheet(`Bank_${currentMapel.replace(/[^a-zA-Z0-9]/g, '_')}`);
    }
  }, [currentMapel]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(MASTER_APPS_SCRIPT_CODE_GS);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    showAlert('Kode Master Apps Script (Code.gs v2.7) berhasil disalin ke clipboard!');
  };

  const handleSaveUrl = () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      showAlert('Masukkan URL Web App Google Apps Script.');
      return;
    }
    onSaveWebhookUrl(cleanUrl);
    showAlert('URL Google Apps Script berhasil disimpan!');
  };

  // Generate Current Live JSON Payload based on UI selection
  const getLiveJsonPayload = () => {
    if (activeMainTab === 'sync_questions') {
      return {
        action: 'sync_questions',
        target: 'questions',
        mode: questionSyncMode,
        mapel: currentMapel,
        kodeGuru: currentKodeGuru,
        sheetName: `Bank_${currentMapel.replace(/[^a-zA-Z0-9]/g, '_')}`,
        timestamp: new Date().toISOString(),
        questions: questions.map((q, idx) => ({
          id: q.id || idx + 1,
          kodeGuru: q.kodeGuru || currentKodeGuru,
          mapel: q.mapel || currentMapel,
          kompetensi: q.kompetensi || q.subTopik || '',
          bentukSoal: q.bentukSoal || 'Pilihan Ganda',
          poin: q.poin || 10,
          question: q.question,
          image: q.image ? (q.image.length > 50 ? `${q.image.substring(0, 40)}... (Base64 Image Data)` : q.image) : '',
          options: q.options || [],
          explanation: q.explanation || '',
        })),
      };
    }

    if (crudAction === 'read') {
      return {
        method: 'GET',
        url_query: `?action=readAll&type=${crudTarget}`,
        description: `Membaca seluruh data sheet ${crudTarget.toUpperCase()} dari Spreadsheet.`,
      };
    }

    if (crudAction === 'batch_upload') {
      let dataList: any[] = [];
      if (crudTarget === 'siswa') dataList = students;
      if (crudTarget === 'guru') dataList = teachers;
      if (crudTarget === 'admin') dataList = admins;

      return {
        action: 'batch_upload',
        target: crudTarget,
        overwrite: crudOverwrite,
        totalItems: dataList.length,
        timestamp: new Date().toISOString(),
        data: dataList,
      };
    }

    if (crudAction === 'create') {
      let itemData: any = {};
      if (crudTarget === 'siswa') itemData = studentForm;
      if (crudTarget === 'guru') itemData = teacherForm;
      if (crudTarget === 'admin') itemData = adminForm;

      return {
        action: 'create',
        target: crudTarget,
        timestamp: new Date().toISOString(),
        data: itemData,
      };
    }

    if (crudAction === 'update') {
      let itemData: any = {};
      if (crudTarget === 'siswa') itemData = studentForm;
      if (crudTarget === 'guru') itemData = teacherForm;
      if (crudTarget === 'admin') itemData = adminForm;

      return {
        action: 'update',
        target: crudTarget,
        timestamp: new Date().toISOString(),
        data: itemData,
      };
    }

    if (crudAction === 'delete') {
      const ids = deleteIdInput.split(',').map((s) => s.trim()).filter(Boolean);
      return {
        action: 'delete',
        target: crudTarget,
        timestamp: new Date().toISOString(),
        data: ids.length > 1 ? ids : ids[0] || '1001',
      };
    }

    return {};
  };

  // Execute CRUD Action
  const handleExecuteCrud = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      showAlert('Harap masukkan dan simpan URL Web App Google Apps Script terlebih dahulu!');
      return;
    }

    setIsExecuting(true);
    setOperationLog({
      status: 'idle',
      message: `Sedang memproses ${crudAction.toUpperCase()} untuk ${crudTarget.toUpperCase()}...`,
    });

    try {
      if (crudAction === 'read') {
        // READ via GET
        const dbData = await fetchAppsScriptDatabase(cleanUrl, crudTarget as any);
        let count = 0;
        if (crudTarget === 'siswa' && dbData.students) {
          count = dbData.students.length;
          if (onSyncStudents && count > 0) {
            onSyncStudents(dbData.students);
          }
        } else if (crudTarget === 'guru' && dbData.teachers) {
          count = dbData.teachers.length;
          if (onSyncTeachers && count > 0) {
            onSyncTeachers(dbData.teachers);
          }
        } else if (crudTarget === 'admin' && dbData.admins) {
          count = dbData.admins.length;
          if (onSyncAdmins && count > 0) {
            onSyncAdmins(dbData.admins);
          }
        }

        setOperationLog({
          status: 'success',
          message: `Sukses membaca ${count} data ${crudTarget.toUpperCase()} dari Spreadsheet dan menyinkronkannya ke sistem!`,
          details: dbData,
          timestamp: new Date().toLocaleTimeString('id-ID'),
        });
        showAlert(`Berhasil membaca ${count} data ${crudTarget.toUpperCase()} dari Spreadsheet!`);
      } else {
        // POST for Create, Update, Delete, Batch Upload
        const payload: any = getLiveJsonPayload();
        const res = await sendAppsScriptRequest(cleanUrl, payload);

        setOperationLog({
          status: 'success',
          message: res.message || `Operasi ${crudAction} pada ${crudTarget} berhasil diselesaikan.`,
          details: res,
          timestamp: new Date().toLocaleTimeString('id-ID'),
        });
        showAlert(`Sukses! ${res.message || 'Operasi berhasil.'}`);
      }
    } catch (err: any) {
      setOperationLog({
        status: 'error',
        message: err.message || 'Terjadi kesalahan saat menghubungkan ke Google Apps Script.',
        details: err,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      showAlert(`Gagal: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Sync Questions: Kirim ke Sheets
  const handleSendQuestionsToSheets = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      showAlert('Harap masukkan URL Web App Google Apps Script!');
      return;
    }

    setIsExecuting(true);
    setOperationLog({
      status: 'idle',
      message: `Sedang mengirim ${questions.length} butir soal ke Google Spreadsheet...`,
    });

    try {
      const payload: any = {
        action: 'sync_questions',
        target: 'questions',
        mode: questionSyncMode,
        mapel: currentMapel,
        kodeGuru: currentKodeGuru,
        sheetName: `Bank_${currentMapel.replace(/[^a-zA-Z0-9]/g, '_')}`,
        timestamp: new Date().toISOString(),
        questions: questions.map((q, idx) => ({
          id: q.id || idx + 1,
          kodeGuru: q.kodeGuru || currentKodeGuru,
          mapel: q.mapel || currentMapel,
          kompetensi: q.kompetensi || q.subTopik || '',
          bentukSoal: q.bentukSoal || 'Pilihan Ganda',
          poin: q.poin || 10,
          question: q.question,
          image: q.image || '',
          options: q.options || [],
          explanation: q.explanation || '',
        })),
      };

      const res = await sendAppsScriptRequest(cleanUrl, payload);
      setOperationLog({
        status: 'success',
        message: res.message || `Berhasil menyinkronkan ${questions.length} butir soal ke tab Bank_${currentMapel}!`,
        details: res,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      showAlert(`Sukses! ${questions.length} butir soal telah disinkronkan ke Spreadsheet.`);
    } catch (err: any) {
      setOperationLog({
        status: 'error',
        message: err.message || 'Gagal mengirim soal ke Google Sheets.',
        details: err,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      showAlert(`Gagal: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Deteksi Tab Sheet dari Spreadsheet
  const handleDetectSheets = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      showAlert('Harap masukkan URL Web App Google Apps Script atau link Spreadsheet terlebih dahulu!');
      return;
    }

    setIsDetectingSheets(true);
    try {
      const sheets = await fetchSpreadsheetSheetsList(cleanUrl);
      if (sheets && sheets.length > 0) {
        setDetectedSheets(sheets);
        showAlert(`Ditemukan ${sheets.length} tab sheet di Google Spreadsheet!`);
      } else {
        showAlert('Tidak dapat menemukan daftar tab. Pastikan Web App Code.gs sudah diperbarui ke versi v2.7.');
      }
    } catch (e: any) {
      showAlert(`Gagal mendeteksi tab: ${e.message}`);
    } finally {
      setIsDetectingSheets(false);
    }
  };

  // Sync Questions: Tarik dari Sheets ke CBT
  const handlePullQuestionsFromSheets = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      showAlert('Harap masukkan URL Web App Google Apps Script atau Link Google Sheets!');
      return;
    }

    setIsExecuting(true);
    setOperationLog({
      status: 'idle',
      message: `Sedang menarik bank soal dari Spreadsheet (${importTargetSheet || `Bank_${importTargetMapel}`})...`,
    });

    try {
      const result = await fetchAppsScriptQuestions(cleanUrl, importTargetMapel, importTargetSheet);
      const imported = result.questions;

      if (result.availableSheets && result.availableSheets.length > 0) {
        setDetectedSheets(result.availableSheets);
      }

      if (imported.length === 0) {
        const availableTabsMsg = result.availableSheets && result.availableSheets.length > 0
          ? `\n\nTab yang terdeteksi di Spreadsheet:\n• ${result.availableSheets.join('\n• ')}`
          : '';

        setOperationLog({
          status: 'error',
          message: `Data tidak ditemukan pada tab '${result.sheetName || importTargetSheet}'.\n\nPenyebab kemungkinan:\n1. Nama tab di Google Sheets berbeda (misal: 'Sheet1' atau 'Sosiologi', bukan '${result.sheetName}').\n2. Baris data soal di sheet tersebut masih kosong (hanya ada judul kolom di baris 1).\n3. Kode Apps Script di Google Spreadsheet belum diupdate ke versi v2.7.${availableTabsMsg}`,
          details: result,
          timestamp: new Date().toLocaleTimeString('id-ID'),
        });
        showAlert(`Data soal tidak ditemukan di sheet '${result.sheetName || importTargetSheet}'. Periksa pesan detail pada log status di bawah.`);
        return;
      }

      if (onSyncQuestions) {
        onSyncQuestions(imported, importMode);
      }

      setOperationLog({
        status: 'success',
        message: `Berhasil menarik ${imported.length} butir soal dari Sheet '${result.sheetName}' ke CBT! Mode: ${importMode === 'overwrite' ? 'Ganti/Timpa Semua Soal' : 'Tambahkan ke Soal Saat Ini'}.`,
        details: result,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      showAlert(`Sukses menarik ${imported.length} butir soal dari Google Sheets!`);
    } catch (err: any) {
      setOperationLog({
        status: 'error',
        message: err.message || 'Gagal menarik bank soal dari Google Spreadsheet.',
        details: err,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      showAlert(`Gagal menarik soal: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Google Apps Script CRUD & Sync Hub</h3>
                <span className="bg-emerald-500/30 text-emerald-100 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-emerald-400/40">
                  Full CRUD v2.5
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                Pusat Integrasi Sinkronisasi & CRUD: Siswa, Guru, Admin, Bank Soal, dan Rekap Nilai ke Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Webhook Configuration Bar */}
        <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>URL Web App Google Apps Script:</span>
          </div>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="flex-1 px-3.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="button"
            onClick={handleSaveUrl}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            Simpan URL
          </button>
        </div>

        {/* Main Tab Navigation */}
        <div className="bg-slate-100 px-6 pt-3 border-b border-slate-200 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
          <button
            onClick={() => setActiveMainTab('crud_users')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeMainTab === 'crud_users'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            CRUD User (Siswa, Guru, Admin)
          </button>
          <button
            onClick={() => setActiveMainTab('sync_questions')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeMainTab === 'sync_questions'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-600" />
            Sinkron Bank Soal (+ Gambar Drive)
          </button>
          <button
            onClick={() => setActiveMainTab('code')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeMainTab === 'code'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-600" />
            Salin Master Code.gs (v2.7)
          </button>
          <button
            onClick={() => setActiveMainTab('payload_docs')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeMainTab === 'payload_docs'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileJson className="w-4 h-4 text-emerald-600" />
            Format Payload JSON & API Docs
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ============================================================================== */}
          {/* TAB 1: CRUD USER MANAGEMENT (SISWA, GURU, ADMIN) */}
          {/* ============================================================================== */}
          {activeMainTab === 'crud_users' && (
            <div className="space-y-6">
              {/* Target & Action Selector Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Target Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                    1. Pilih Target Akun:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCrudTarget('siswa')}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        crudTarget === 'siswa'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Siswa ({students.length})</span>
                      <span className="text-[9px] opacity-80">DATA_SISWA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCrudTarget('guru')}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        crudTarget === 'guru'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Guru ({teachers.length})</span>
                      <span className="text-[9px] opacity-80">DATA_GURU</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCrudTarget('admin')}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        crudTarget === 'admin'
                          ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin ({admins.length})</span>
                      <span className="text-[9px] opacity-80">DATA_ADMIN</span>
                    </button>
                  </div>
                </div>

                {/* 2. Action Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                    2. Pilih Aksi CRUD:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCrudAction('read')}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        crudAction === 'read'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <DownloadCloud className="w-4 h-4 text-emerald-400" />
                      <span>Tarik / Read Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCrudAction('batch_upload')}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        crudAction === 'batch_upload'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 text-sky-400" />
                      <span>Batch Upload (Sync All)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCrudAction('create')}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        crudAction === 'create'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 text-teal-400" />
                      <span>Create / Tambah 1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCrudAction('update')}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        crudAction === 'update'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Edit className="w-4 h-4 text-amber-400" />
                      <span>Update Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCrudAction('delete')}
                      className={`col-span-2 p-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        crudAction === 'delete'
                          ? 'bg-red-600 text-white border-red-700 shadow-sm'
                          : 'bg-white text-red-600 border-slate-200 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete / Hapus Akun</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Parameter Forms Based on Action */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Konfigurasi Aksi: <span className="uppercase text-emerald-700 font-black">{crudAction}</span> pada{' '}
                    <span className="uppercase text-blue-700 font-black">{crudTarget}</span>
                  </h4>
                </div>

                {/* Form READ */}
                {crudAction === 'read' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
                    <p className="font-bold">
                      Akan membaca data tab sheet <code>DATA_{crudTarget.toUpperCase()}</code> dari Spreadsheet.
                    </p>
                    <p className="text-emerald-800">
                      Setelah selesai dibaca, data di CBT akan langsung diperbarui secara instan dengan data terbaru dari Google Sheets.
                    </p>
                  </div>
                )}

                {/* Form BATCH UPLOAD */}
                {crudAction === 'batch_upload' && (
                  <div className="space-y-3">
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950">
                      <p className="font-bold">
                        Mengirim seluruh data {crudTarget.toUpperCase()} dari CBT ke Google Spreadsheet.
                      </p>
                      <p className="text-sky-800 mt-1">
                        Total yang akan dikirim:{' '}
                        <b>
                          {crudTarget === 'siswa' && `${students.length} Siswa`}
                          {crudTarget === 'guru' && `${teachers.length} Guru`}
                          {crudTarget === 'admin' && `${admins.length} Admin`}
                        </b>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={crudOverwrite}
                          onChange={(e) => setCrudOverwrite(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Overwrite (Kosongkan data lama di Sheet & tulis ulang total)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Form CREATE / UPDATE Siswa */}
                {(crudAction === 'create' || crudAction === 'update') && crudTarget === 'siswa' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">NIS (Primary Key):</label>
                      <input
                        type="text"
                        value={studentForm.nis}
                        onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value })}
                        placeholder="Contoh: 1001"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lengkap:</label>
                      <input
                        type="text"
                        value={studentForm.nama}
                        onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                        placeholder="Nama Siswa"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Kelas:</label>
                      <input
                        type="text"
                        value={studentForm.kelas}
                        onChange={(e) => setStudentForm({ ...studentForm, kelas: e.target.value })}
                        placeholder="XII-MIPA-1"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Password:</label>
                      <input
                        type="text"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                        placeholder="123456"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Sesi Ujian:</label>
                      <input
                        type="text"
                        value={studentForm.sesi}
                        onChange={(e) => setStudentForm({ ...studentForm, sesi: e.target.value })}
                        placeholder="1"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Ruang:</label>
                      <input
                        type="text"
                        value={studentForm.ruang}
                        onChange={(e) => setStudentForm({ ...studentForm, ruang: e.target.value })}
                        placeholder="Lab-01"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Form CREATE / UPDATE Guru */}
                {(crudAction === 'create' || crudAction === 'update') && crudTarget === 'guru' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Kode Guru (Primary Key):</label>
                      <input
                        type="text"
                        value={teacherForm.kodeGuru}
                        onChange={(e) => setTeacherForm({ ...teacherForm, kodeGuru: e.target.value })}
                        placeholder="GURU01"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Guru & Gelar:</label>
                      <input
                        type="text"
                        value={teacherForm.nama}
                        onChange={(e) => setTeacherForm({ ...teacherForm, nama: e.target.value })}
                        placeholder="Drs. Aji Sosiologi, M.Pd"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Mata Pelajaran:</label>
                      <input
                        type="text"
                        value={teacherForm.mapel}
                        onChange={(e) => setTeacherForm({ ...teacherForm, mapel: e.target.value })}
                        placeholder="Sosiologi"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">NIP (Opsional):</label>
                      <input
                        type="text"
                        value={teacherForm.nip}
                        onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                        placeholder="1985..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Password Guru:</label>
                      <input
                        type="text"
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        placeholder="guru123"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Token Ujian Guru:</label>
                      <input
                        type="text"
                        value={teacherForm.examToken}
                        onChange={(e) => setTeacherForm({ ...teacherForm, examToken: e.target.value })}
                        placeholder="CBT2026"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Form CREATE / UPDATE Admin */}
                {(crudAction === 'create' || crudAction === 'update') && crudTarget === 'admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Username (Primary Key):</label>
                      <input
                        type="text"
                        value={adminForm.username}
                        onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                        placeholder="admin_proktor"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Admin:</label>
                      <input
                        type="text"
                        value={adminForm.nama}
                        onChange={(e) => setAdminForm({ ...adminForm, nama: e.target.value })}
                        placeholder="Proktor Utama"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Password:</label>
                      <input
                        type="text"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        placeholder="admin123"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Form DELETE */}
                {crudAction === 'delete' && (
                  <div>
                    <label className="block text-[11px] font-bold text-red-700 mb-1">
                      Masukkan ID / NIS / Kode Guru / Username yang akan dihapus (Pisahkan dengan koma jika banyak):
                    </label>
                    <input
                      type="text"
                      value={deleteIdInput}
                      onChange={(e) => setDeleteIdInput(e.target.value)}
                      placeholder="Contoh: 1001, 1002, 1003"
                      className="w-full px-3.5 py-2.5 bg-red-50/50 border border-red-300 rounded-xl text-xs font-mono font-bold text-red-900 focus:bg-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* LIVE JSON PAYLOAD PREVIEW */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-emerald-600" />
                    Live JSON Payload Request:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(getLiveJsonPayload(), null, 2));
                      showAlert('Payload JSON berhasil disalin ke clipboard!');
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin JSON
                  </button>
                </div>
                <pre className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl overflow-x-auto max-h-[160px] custom-scrollbar border border-slate-800">
                  {JSON.stringify(getLiveJsonPayload(), null, 2)}
                </pre>
              </div>

              {/* Status Output Box */}
              {operationLog.status !== 'idle' && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 ${
                    operationLog.status === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-red-50 text-red-900 border-red-300'
                  }`}
                >
                  {operationLog.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{operationLog.message}</p>
                    {operationLog.timestamp && (
                      <span className="text-[10px] text-slate-500 block mt-1">Waktu: {operationLog.timestamp}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 2: SINKRONISASI BANK SOAL (KIRIM KE SHEETS & TARIK KE CBT) */}
          {/* ============================================================================== */}
          {activeMainTab === 'sync_questions' && (
            <div className="space-y-6">
              {/* Direction Selector: Export vs Import */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuestionSyncDirection('import')}
                  className={`p-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    questionSyncDirection === 'import'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-transparent text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Tarik Soal dari Google Sheets (Import ke CBT)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuestionSyncDirection('export')}
                  className={`p-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    questionSyncDirection === 'export'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-transparent text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
                  <span>Kirim Soal ke Google Sheets (Export dari CBT)</span>
                </button>
              </div>

              {/* SECTION 1: IMPORT FROM SHEETS TO CBT */}
              {questionSyncDirection === 'import' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-2xl p-4.5 text-emerald-950 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                        <DownloadCloud className="w-5 h-5 text-emerald-600" />
                        Tarik Bank Soal dari Spreadsheet ke Aplikasi CBT
                      </h4>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 bg-emerald-200/60 text-emerald-800 rounded-full font-bold">
                        Sheets ➔ CBT
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Fitur ini membaca data dari tab sheet (misalnya <code>Bank_Sosiologi</code>) di Google Spreadsheet Anda dan mengimpornya langsung ke Bank Soal CBT lengkap dengan gambar, opsi A-E, kunci jawaban, bobot poin, dan pembahasan.
                    </p>
                  </div>

                  {/* Form Konfigurasi Tarik Soal */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          Mata Pelajaran:
                        </label>
                        <input
                          type="text"
                          value={importTargetMapel}
                          onChange={(e) => {
                            const val = e.target.value;
                            setImportTargetMapel(val);
                            setImportTargetSheet(`Bank_${val.replace(/[^a-zA-Z0-9]/g, '_')}`);
                          }}
                          placeholder="Contoh: Sosiologi"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            Nama Tab Sheet di Spreadsheet:
                          </label>
                          <button
                            type="button"
                            onClick={handleDetectSheets}
                            disabled={isDetectingSheets}
                            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Search className={`w-3 h-3 ${isDetectingSheets ? 'animate-spin' : ''}`} />
                            {isDetectingSheets ? 'Mendeteksi...' : 'Cek Tab Spreadsheet'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={importTargetSheet}
                          onChange={(e) => setImportTargetSheet(e.target.value)}
                          placeholder="Contoh: Bank_Sosiologi atau Sheet1"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Detected Sheets Pills */}
                    {detectedSheets.length > 0 && (
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                        <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                          <ListFilter className="w-3.5 h-3.5 text-emerald-600" />
                          Pilih Tab Sheet yang Ditemukan di Spreadsheet Anda (Klik untuk pilih):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {detectedSheets.map((sh) => (
                            <button
                              key={sh}
                              type="button"
                              onClick={() => {
                                setImportTargetSheet(sh);
                                if (sh.startsWith('Bank_')) {
                                  setImportTargetMapel(sh.replace('Bank_', '').replace(/_/g, ' '));
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                                importTargetSheet === sh
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              {sh}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mode Penggabungan Soal */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                        Pilihan Mode Impor:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setImportMode('overwrite')}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                            importMode === 'overwrite'
                              ? 'border-emerald-600 bg-emerald-50/60'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'overwrite'}
                            onChange={() => setImportMode('overwrite')}
                            className="mt-1 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">Ganti / Timpa Semua Soal Mapel Ini</span>
                            <span className="text-[11px] text-slate-600 leading-relaxed">
                              Menghapus soal mapel <b>{importTargetMapel}</b> di CBT dan menggantikannya secara penuh dengan data dari Spreadsheet.
                            </span>
                          </div>
                        </div>

                        <div
                          onClick={() => setImportMode('append')}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                            importMode === 'append'
                              ? 'border-emerald-600 bg-emerald-50/60'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'append'}
                            onChange={() => setImportMode('append')}
                            className="mt-1 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">Tambahkan ke Soal yang Sudah Ada</span>
                            <span className="text-[11px] text-slate-600 leading-relaxed">
                              Menggabungkan soal dari Spreadsheet ke daftar bank soal CBT tanpa menghapus soal yang sudah tersimpan.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informasi Kolom Mapping */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-600 text-[11px] space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Otomatis Membaca Kolom Standar:
                      </div>
                      <p className="leading-relaxed">
                        No, ID Soal, Kode Guru, Mata Pelajaran, Kompetensi/KD, Bentuk Soal, Poin, Pertanyaan, Gambar (Drive/URL), Opsi A, B, C, D, E, Kunci Jawaban, dan Pembahasan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: EXPORT FROM CBT TO SHEETS */}
              {questionSyncDirection === 'export' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Target Soal yang Akan Dikirim:
                      </h4>
                      <p className="text-xs text-emerald-800 mt-1">
                        Mata Pelajaran: <b>{currentMapel}</b> | Kode Guru: <b>{currentKodeGuru}</b> | Jumlah:{' '}
                        <b>{questions.length} Butir Soal</b>
                      </p>
                    </div>
                    <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-100 rounded-xl border border-emerald-300 self-start sm:self-auto text-emerald-800">
                      {questions.filter((q) => !!q.image).length} Soal Bergambar / Grafik
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div
                      onClick={() => setQuestionSyncMode('overwrite')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        questionSyncMode === 'overwrite'
                          ? 'border-emerald-600 bg-emerald-50/60'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={questionSyncMode === 'overwrite'}
                        onChange={() => setQuestionSyncMode('overwrite')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">Timpa & Perbarui (Recommended)</span>
                        <span className="text-[11px] text-slate-600 leading-relaxed">
                          Menghapus isi tab sheet mapel ini dan menulis ulang {questions.length} soal terbaru dengan format rapi.
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setQuestionSyncMode('append')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        questionSyncMode === 'append'
                          ? 'border-emerald-600 bg-emerald-50/60'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={questionSyncMode === 'append'}
                        onChange={() => setQuestionSyncMode('append')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">Tambahkan di Baris Terbawah</span>
                        <span className="text-[11px] text-slate-600 leading-relaxed">
                          Menyisipkan {questions.length} soal di bawah baris yang sudah ada tanpa menghapus data lama.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-sky-950 flex items-start gap-3">
                    <ImageIcon className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <b>Penyimpanan Gambar Otomatis ke Google Drive:</b> Gambar Base64 pada soal akan disimpan otomatis ke folder Google Drive bernama <code>CBT_Soal_Images</code> dan dihubungkan ke sel spreadsheet menggunakan formula <code>=IMAGE("url")</code>.
                    </div>
                  </div>
                </div>
              )}

              {/* Status Output Box */}
              {operationLog.status !== 'idle' && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 ${
                    operationLog.status === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-red-50 text-red-900 border-red-300'
                  }`}
                >
                  {operationLog.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{operationLog.message}</p>
                    {operationLog.timestamp && (
                      <span className="text-[10px] text-slate-500 block mt-1">Waktu: {operationLog.timestamp}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 3: SALIN MASTER KODE CODE.GS */}
          {/* ============================================================================== */}
          {activeMainTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl">
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" /> Master Script Google Apps Script (Code.gs v2.7)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tempelkan kode ini di menu <b>Ekstensi &gt; Apps Script</b> pada Google Spreadsheet Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-white" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" /> Salin Master Code.gs
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-4.5 rounded-2xl overflow-x-auto max-h-[380px] custom-scrollbar border border-slate-800 leading-relaxed select-all">
                  {MASTER_APPS_SCRIPT_CODE_GS}
                </pre>
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 4: FORMAT PAYLOAD JSON & API DOCUMENTATION */}
          {/* ============================================================================== */}
          {activeMainTab === 'payload_docs' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <FileJson className="w-4.5 h-4.5 text-emerald-600" /> Spesifikasi Standar Request Payload
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Semua request HTTP POST dari frontend ke Apps Script dikirim dengan header <code>Content-Type: text/plain;charset=utf-8</code> untuk menghindari pemblokiran CORS. Isi body dikirim dalam bentuk <code>JSON.stringify(payload)</code>.
                </p>
              </div>

              {/* Payload Templates Accordion / Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Create */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                      POST: action="create"
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">Tambah 1 Baris</span>
                  </div>
                  <pre className="bg-slate-950 text-emerald-300 font-mono text-[10px] p-3 rounded-xl overflow-x-auto">
{`{
  "action": "create",
  "target": "siswa", // atau 'guru', 'admin'
  "data": {
    "nis": "1001",
    "nama": "Ahmad Fauzi",
    "kelas": "XII-MIPA-1",
    "password": "123",
    "sesi": "1",
    "ruang": "Lab-01"
  }
}`}
                  </pre>
                </div>

                {/* 2. Update */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold rounded">
                      POST: action="update"
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">Perbarui Baris</span>
                  </div>
                  <pre className="bg-slate-950 text-amber-300 font-mono text-[10px] p-3 rounded-xl overflow-x-auto">
{`{
  "action": "update",
  "target": "guru",
  "data": {
    "kodeGuru": "GURU01",
    "nama": "Aji Sosiologi, M.Pd",
    "mapel": "Sosiologi",
    "examToken": "SOS2026"
  }
}`}
                  </pre>
                </div>

                {/* 3. Batch Upload */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-mono font-bold rounded">
                      POST: action="batch_upload"
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">Upload Banyak (Sync)</span>
                  </div>
                  <pre className="bg-slate-950 text-sky-300 font-mono text-[10px] p-3 rounded-xl overflow-x-auto">
{`{
  "action": "batch_upload",
  "target": "siswa",
  "overwrite": false, // true = timpa total
  "data": [
    { "nis": "1001", "nama": "Ahmad", "kelas": "XII-1" },
    { "nis": "1002", "nama": "Budi", "kelas": "XII-1" }
  ]
}`}
                  </pre>
                </div>

                {/* 4. Delete */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-mono font-bold rounded">
                      POST: action="delete"
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">Hapus Berdasarkan ID</span>
                  </div>
                  <pre className="bg-slate-950 text-red-300 font-mono text-[10px] p-3 rounded-xl overflow-x-auto">
{`{
  "action": "delete",
  "target": "siswa",
  "data": ["1001", "1002"] // Bisa single string atau Array
}`}
                  </pre>
                </div>
              </div>

              {/* Sample cURL & Fetch Code Snippet */}
              <div className="bg-slate-900 text-white p-4.5 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Contoh Kode JavaScript Fetch Client-Side:</span>
                <pre className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-3.5 rounded-xl overflow-x-auto">
{`await fetch("https://script.google.com/macros/s/AKfycbx.../exec", {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "create",
    target: "siswa",
    data: { nis: "1001", nama: "Ahmad Fauzi", kelas: "XII-MIPA-1" }
  })
});`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            URL Status:{' '}
            {webhookUrl ? (
              <span className="text-emerald-700 font-bold">Tersambung ({webhookUrl.substring(0, 35)}...)</span>
            ) : (
              <span className="text-red-500 font-bold">Belum Diatur</span>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>

            {activeMainTab === 'crud_users' && (
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleExecuteCrud}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menjalankan Operasi...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Jalankan {crudAction.toUpperCase()} ({crudTarget.toUpperCase()})
                  </>
                )}
              </button>
            )}

            {activeMainTab === 'sync_questions' && questionSyncDirection === 'export' && (
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleSendQuestionsToSheets}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyinkronkan ke Sheets...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400" /> Kirim {questions.length} Soal ke Sheets
                  </>
                )}
              </button>
            )}

            {activeMainTab === 'sync_questions' && questionSyncDirection === 'import' && (
              <button
                type="button"
                disabled={isExecuting}
                onClick={handlePullQuestionsFromSheets}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menarik Soal dari Sheets...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" /> Tarik Soal ke CBT ({importMode === 'overwrite' ? 'Ganti Semua' : 'Tambahkan'})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
