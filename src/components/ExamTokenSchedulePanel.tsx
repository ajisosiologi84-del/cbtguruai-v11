import React, { useState } from 'react';
import {
  Key,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  Copy,
  Check,
  RefreshCw,
  Download,
  Printer,
  FileText,
  FileCode,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  Search,
  Filter,
  Users,
  BookOpen,
  ArrowRight,
  Radio,
  ExternalLink,
  GraduationCap,
  Award,
  Sliders,
  Eye,
  X,
} from 'lucide-react';
import { AppConfig, ExamScheduleToken, Question } from '../types';
import { exportOfflineAppHtml } from '../utils/offlineExport';
import { openQuestionPrintWindow, exportQuestionsToWord } from '../utils/questionExport';

interface ExamTokenSchedulePanelProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  showAlert?: (msg: string) => void;
}

export const ExamTokenSchedulePanel: React.FC<ExamTokenSchedulePanelProps> = ({
  config,
  onSaveConfig,
  showAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'STANDBY' | 'CLOSED'>('ALL');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<ExamScheduleToken | null>(null);

  // Form State
  const [formNamaSesi, setFormNamaSesi] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJamMulai, setFormJamMulai] = useState('08:00');
  const [formJamSelesai, setFormJamSelesai] = useState('09:30');
  const [formDurasi, setFormDurasi] = useState<number>(60);
  const [formKkm, setFormKkm] = useState<number>(75);
  const [formMapel, setFormMapel] = useState('Sosiologi');
  const [formKodeGuru, setFormKodeGuru] = useState('GURU01');
  const [formTargetKelas, setFormTargetKelas] = useState('');
  const [formPaketSoal, setFormPaketSoal] = useState('Paket A (Utama)');
  const [formKodePaket, setFormKodePaket] = useState('PKT-SOS-A');
  const [formToken, setFormToken] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'STANDBY' | 'CLOSED'>('ACTIVE');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Print Slip Modal
  const [printTokenModalData, setPrintTokenModalData] = useState<ExamScheduleToken | null>(null);

  const scheduleList: ExamScheduleToken[] = config.scheduleTokens || [];

  // Helper: Generate Random 6-char Alphanumeric Token
  const generateRandomTokenStr = (prefix = ''): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    const length = prefix ? 6 - prefix.length : 6;
    for (let i = 0; i < Math.max(3, length); i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return (prefix + res).toUpperCase();
  };

  // Helper: Copy Token to Clipboard
  const handleCopy = (tokenId: string, tokenStr: string) => {
    navigator.clipboard.writeText(tokenStr);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  // Helper: Filter Questions for a specific package
  const getQuestionsForPackage = (item: ExamScheduleToken): Question[] => {
    const allQuestions = config.questions || [];
    const activeQuestions = allQuestions.filter((q) => q.isActive !== false);

    if (item.soalIds && item.soalIds.length > 0) {
      return activeQuestions.filter((q) => item.soalIds?.includes(q.id));
    }

    if (item.kodePaket.includes('-B') || item.paketSoal.toLowerCase().includes('paket b')) {
      // Paket B: Soal Index Ganjil
      const ganjil = activeQuestions.filter((_, idx) => idx % 2 === 1);
      return ganjil.length > 0 ? ganjil : activeQuestions;
    }

    if (item.kodePaket.includes('-C') || item.paketSoal.toLowerCase().includes('paket c')) {
      // Paket C: Soal Index Genap
      const genap = activeQuestions.filter((_, idx) => idx % 2 === 0);
      return genap.length > 0 ? genap : activeQuestions;
    }

    return activeQuestions;
  };

  // 1. Download Standalone HTML CBT Offline for specific package & token
  const handleDownloadOfflineCbt = (item: ExamScheduleToken) => {
    const packageQuestions = getQuestionsForPackage(item);
    if (packageQuestions.length === 0) {
      alert('Paket ini belum memiliki butir soal yang aktif!');
      return;
    }

    const packageConfig: AppConfig = {
      ...config,
      mapel: item.mapel || config.mapel || 'Sosiologi',
      mapelTitle: `${item.mapel || 'Sosiologi'} - ${item.paketSoal} (${item.namaSesi})`,
      examToken: item.token,
      duration: item.durasiMenit || config.duration || 60,
      kkm: item.kkm || config.kkm || 75,
      questions: packageQuestions,
    };

    exportOfflineAppHtml(packageConfig);
    if (showAlert) {
      showAlert(`Aplikasi CBT Offline untuk ${item.paketSoal} (Token: ${item.token}) Berhasil Didownload!`);
    }
  };

  // 2. Download / Print PDF Naskah Soal for specific package
  const handleDownloadPdf = (item: ExamScheduleToken) => {
    const packageQuestions = getQuestionsForPackage(item);
    if (packageQuestions.length === 0) {
      alert('Paket ini belum memiliki butir soal!');
      return;
    }

    openQuestionPrintWindow(packageQuestions, {
      docType: 'SOAL_ONLY',
      title: `ASESMEN CBT - ${item.paketSoal.toUpperCase()}`,
      tahunPelajaran: '2025/2026',
      mapel: `${item.mapel || config.mapel || 'Sosiologi'} [${item.kodePaket}]`,
      kelas: item.targetKelas || 'Semua Kelas',
      alokasiWaktu: `${item.durasiMenit} Menit`,
      hariTanggal: item.tanggalUjian || new Date().toLocaleDateString('id-ID'),
      pageSize: 'A4',
      fontFamily: 'Times New Roman',
      fontSize: '11pt',
      showKop: true,
      showPetunjukUmum: true,
      showIdentitasSiswa: true,
      showSignature: true,
      showPembahasan: false,
      kopSekolah: config.kopSekolah,
    });
  };

  // 3. Download DOCX Word Naskah Soal for specific package
  const handleDownloadWord = (item: ExamScheduleToken) => {
    const packageQuestions = getQuestionsForPackage(item);
    if (packageQuestions.length === 0) {
      alert('Paket ini belum memiliki butir soal!');
      return;
    }

    exportQuestionsToWord(packageQuestions, {
      docType: 'SOAL_ONLY',
      title: `ASESMEN CBT - ${item.paketSoal.toUpperCase()}`,
      tahunPelajaran: '2025/2026',
      mapel: `${item.mapel || config.mapel || 'Sosiologi'} [${item.kodePaket}]`,
      kelas: item.targetKelas || 'Semua Kelas',
      alokasiWaktu: `${item.durasiMenit} Menit`,
      hariTanggal: item.tanggalUjian || new Date().toLocaleDateString('id-ID'),
      pageSize: 'A4',
      fontFamily: 'Times New Roman',
      fontSize: '11pt',
      showKop: true,
      showPetunjukUmum: true,
      showIdentitasSiswa: true,
      showSignature: true,
      showPembahasan: false,
      kopSekolah: config.kopSekolah,
    });
  };

  // 4. Download JSON Backup of Specific Package
  const handleDownloadJsonPackage = (item: ExamScheduleToken) => {
    const packageQuestions = getQuestionsForPackage(item);
    const exportData = {
      paketInfo: item,
      questions: packageQuestions,
      exportedAt: new Date().toISOString(),
      generator: 'CBT GURUAI 2026 - National Exam Standard',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paket_Soal_${item.kodePaket}_${item.token}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 5. Set As Primary Login Token
  const handleSetPrimaryToken = (item: ExamScheduleToken) => {
    const updatedList = scheduleList.map((s) => ({
      ...s,
      isPrimaryActive: s.id === item.id,
      status: s.id === item.id ? ('ACTIVE' as const) : s.status,
    }));

    const newConfig: AppConfig = {
      ...config,
      examToken: item.token,
      duration: item.durasiMenit || config.duration,
      kkm: item.kkm || config.kkm,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);
    if (showAlert) {
      showAlert(`Token "${item.token}" (${item.namaSesi}) Telah Diaktifkan Sebagai Token Utama Login Siswa!`);
    }
  };

  // 6. Regenerate Single Token
  const handleRegenerateSingleToken = (item: ExamScheduleToken) => {
    const newToken = generateRandomTokenStr();
    const updatedList = scheduleList.map((s) =>
      s.id === item.id
        ? {
            ...s,
            token: newToken,
            tokenCreatedAt: new Date().toISOString(),
          }
        : s
    );

    const isCurrentPrimary = item.isPrimaryActive || config.examToken === item.token;
    const newConfig: AppConfig = {
      ...config,
      examToken: isCurrentPrimary ? newToken : config.examToken,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);
    if (showAlert) {
      showAlert(`Token untuk ${item.namaSesi} berhasil diperbarui menjadi: ${newToken}`);
    }
  };

  // 7. Regenerate All Tokens
  const handleRegenerateAllTokens = () => {
    if (!window.confirm('Yakin ingin men-generate ulang Token acak baru untuk SEMUA jadwal sesi ujian?')) {
      return;
    }

    let firstActiveToken = config.examToken;
    const updatedList = scheduleList.map((s, idx) => {
      const newToken = generateRandomTokenStr();
      if (s.isPrimaryActive || idx === 0) {
        firstActiveToken = newToken;
      }
      return {
        ...s,
        token: newToken,
        tokenCreatedAt: new Date().toISOString(),
      };
    });

    const newConfig: AppConfig = {
      ...config,
      examToken: firstActiveToken,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);
    if (showAlert) {
      showAlert('Seluruh Token Sesi Ujian Berhasil Di-generate Ulang Secara Acak!');
    }
  };

  // 8. Delete Schedule
  const handleDeleteSchedule = (id: string) => {
    if (!window.confirm('Hapus jadwal & pengaturan token sesi ini?')) return;

    const updatedList = scheduleList.filter((s) => s.id !== id);
    const newConfig: AppConfig = {
      ...config,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);
  };

  // 9. Open Modal For Add New
  const handleOpenAddModal = () => {
    setEditingToken(null);
    const nextIndex = scheduleList.length + 1;
    const today = new Date().toISOString().split('T')[0];

    setFormNamaSesi(`Sesi ${nextIndex} - Paket ${String.fromCharCode(64 + nextIndex)}`);
    setFormTanggal(today);
    setFormJamMulai('08:00');
    setFormJamSelesai('09:30');
    setFormDurasi(config.duration || 60);
    setFormKkm(config.kkm || 75);
    setFormMapel(config.mapel || 'Sosiologi');
    setFormKodeGuru(config.kodeGuru || 'GURU01');
    setFormTargetKelas(nextIndex === 1 ? 'XII IPS 1, XII IPS 2' : nextIndex === 2 ? 'XII IPS 3, XII IPS 4' : 'Semua Kelas');
    setFormPaketSoal(`Paket ${String.fromCharCode(64 + nextIndex)} (${nextIndex === 1 ? 'Utama' : nextIndex === 2 ? 'Acak Variasi' : 'Susulan'})`);
    setFormKodePaket(`PKT-SOS-${String.fromCharCode(64 + nextIndex)}`);
    setFormToken(generateRandomTokenStr());
    setFormStatus('ACTIVE');
    setFormKeterangan(`Jadwal Pelaksanaan Ujian Sesi ${nextIndex}`);

    setIsModalOpen(true);
  };

  // 10. Open Modal For Edit
  const handleOpenEditModal = (item: ExamScheduleToken) => {
    setEditingToken(item);
    setFormNamaSesi(item.namaSesi);
    setFormTanggal(item.tanggalUjian || new Date().toISOString().split('T')[0]);
    setFormJamMulai(item.jamMulai || '08:00');
    setFormJamSelesai(item.jamSelesai || '09:30');
    setFormDurasi(item.durasiMenit || 60);
    setFormKkm(item.kkm || 75);
    setFormMapel(item.mapel || config.mapel || 'Sosiologi');
    setFormKodeGuru(item.kodeGuru || config.kodeGuru || 'GURU01');
    setFormTargetKelas(item.targetKelas || '');
    setFormPaketSoal(item.paketSoal || 'Paket A (Utama)');
    setFormKodePaket(item.kodePaket || 'PKT-SOS-A');
    setFormToken(item.token || generateRandomTokenStr());
    setFormStatus(item.status === 'EXPIRED' ? 'CLOSED' : item.status);
    setFormKeterangan(item.keterangan || '');

    setIsModalOpen(true);
  };

  // 11. Save Modal Form
  const handleSaveModalForm = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanToken = formToken.trim().toUpperCase() || generateRandomTokenStr();

    if (editingToken) {
      // Update
      const updatedList = scheduleList.map((s) =>
        s.id === editingToken.id
          ? {
              ...s,
              namaSesi: formNamaSesi.trim(),
              tanggalUjian: formTanggal,
              jamMulai: formJamMulai,
              jamSelesai: formJamSelesai,
              durasiMenit: Number(formDurasi) || 60,
              kkm: Number(formKkm) || 75,
              mapel: formMapel.trim(),
              kodeGuru: formKodeGuru.trim(),
              targetKelas: formTargetKelas.trim(),
              paketSoal: formPaketSoal.trim(),
              kodePaket: formKodePaket.trim(),
              token: cleanToken,
              status: formStatus,
              keterangan: formKeterangan.trim(),
            }
          : s
      );

      const isPrimary = editingToken.isPrimaryActive;
      const newConfig: AppConfig = {
        ...config,
        examToken: isPrimary ? cleanToken : config.examToken,
        scheduleTokens: updatedList,
      };

      onSaveConfig(newConfig);
      if (showAlert) showAlert(`Jadwal & Token ${formNamaSesi} Berhasil Disimpan!`);
    } else {
      // Add New
      const newId = `SCHED-${Date.now().toString().slice(-4)}`;
      const isFirst = scheduleList.length === 0;

      const newItem: ExamScheduleToken = {
        id: newId,
        namaSesi: formNamaSesi.trim(),
        tanggalUjian: formTanggal,
        jamMulai: formJamMulai,
        jamSelesai: formJamSelesai,
        durasiMenit: Number(formDurasi) || 60,
        kkm: Number(formKkm) || 75,
        mapel: formMapel.trim(),
        kodeGuru: formKodeGuru.trim(),
        targetKelas: formTargetKelas.trim(),
        paketSoal: formPaketSoal.trim(),
        kodePaket: formKodePaket.trim(),
        token: cleanToken,
        status: formStatus,
        isPrimaryActive: isFirst,
        tokenCreatedAt: new Date().toISOString(),
        keterangan: formKeterangan.trim(),
      };

      const updatedList = [...scheduleList, newItem];
      const newConfig: AppConfig = {
        ...config,
        examToken: isFirst ? cleanToken : config.examToken,
        scheduleTokens: updatedList,
      };

      onSaveConfig(newConfig);
      if (showAlert) showAlert(`Sesi Baru "${formNamaSesi}" dengan Token "${cleanToken}" Berhasil Ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  // Filtered List
  const filteredList = scheduleList.filter((item) => {
    const matchesSearch =
      item.namaSesi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetKelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.paketSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodePaket.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      item.status === statusFilter ||
      (statusFilter === 'CLOSED' && item.status === 'EXPIRED');

    return matchesSearch && matchesStatus;
  });

  // Active Primary Token
  const activePrimarySchedule =
    scheduleList.find((s) => s.isPrimaryActive) ||
    scheduleList.find((s) => s.token === config.examToken) ||
    scheduleList[0];

  const currentActiveToken = activePrimarySchedule ? activePrimarySchedule.token : config.examToken || 'SOS2026';

  // Print Full Berita Acara & Token Distribution
  const handlePrintFullBeritaAcara = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const kop = config.kopSekolah || {
      namaSekolah: 'SMA NEGERI CONTOH JAKARTA',
      dinas: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      alamat: 'Jl. Pendidikan Raya No. 45, Jakarta Pusat',
      teleponWeb: 'Telp: (021) 7890123 | Website: www.smancontoh.sch.id',
      kotaTanggal: `Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      namaGuru: config.teachers?.[0]?.nama || 'Guru Mata Pelajaran',
      nipGuru: config.teachers?.[0]?.nip || '-',
      jabatanGuru: 'Guru Pengampu / Proktor CBT',
    };

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Berita Acara & Distribusi Token CBT</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 20px 30px; font-size: 13px; line-height: 1.4; }
    .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px; }
    .kop h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .kop h1 { margin: 2px 0; font-size: 18px; font-weight: bold; }
    .kop p { margin: 2px 0; font-size: 11px; }
    .title { text-align: center; font-weight: bold; font-size: 15px; margin: 15px 0 10px 0; text-decoration: underline; text-transform: uppercase; }
    .sub-title { text-align: center; font-size: 12px; margin-top: -8px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; }
    th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
    .token-badge { font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-align: center; background: #fafafa; }
    .text-center { text-align: center; }
    .ttd-container { width: 100%; margin-top: 30px; display: table; }
    .ttd-box { display: table-cell; width: 50%; text-align: center; }
    .card-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; page-break-before: always; }
    .token-card { width: 47%; border: 1px dashed #333; padding: 12px; box-sizing: border-box; border-radius: 6px; }
    .token-card-header { font-weight: bold; font-size: 13px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px; }
    .token-card-code { font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 3px; text-align: center; margin: 8px 0; border: 1px solid #000; padding: 6px; background: #fdfdfd; }
    @media print {
      body { margin: 10mm 15mm; }
    }
  </style>
</head>
<body>
  <div class="kop">
    <h2>${kop.dinas}</h2>
    <h1>${kop.namaSekolah}</h1>
    <p>${kop.alamat} - ${kop.teleponWeb}</p>
  </div>

  <div class="title">BERITA ACARA & DAFTAR DISTRIBUSI TOKEN UJIAN CBT</div>
  <div class="sub-title">Mata Pelajaran: <b>${config.mapel || 'Sosiologi'}</b> | Tahun Ajaran 2025/2026</div>

  <p>Pada hari ini, tanggal <b>${kop.kotaTanggal}</b>, telah disiapkan dan disinkronkan jadwal pelaksanaan Ujian Berbasis Komputer (CBT) dengan rincian paket soal dan token sebagai berikut:</p>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 25%;">Nama Sesi & Target Kelas</th>
        <th style="width: 20%;">Paket Soal & Kode</th>
        <th style="width: 20%;">Waktu & Durasi</th>
        <th style="width: 15%;">TOKEN UJIAN</th>
        <th style="width: 15%;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${scheduleList
        .map(
          (s, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${s.namaSesi}</b><br><small>Kelas: ${s.targetKelas || '-'}</small></td>
          <td>${s.paketSoal}<br><small>(${s.kodePaket})</small></td>
          <td class="text-center">${s.jamMulai} - ${s.jamSelesai}<br><small>(${s.durasiMenit} Menit | KKM: ${s.kkm})</small></td>
          <td class="token-badge">${s.token}</td>
          <td class="text-center">${s.status === 'ACTIVE' ? '🟢 AKTIF' : s.status === 'STANDBY' ? '🟡 STANDBY' : '🔴 CLOSED'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <p>Demikian Berita Acara Distribusi Token ini dibuat dengan sebenarnya untuk dipergunakan dalam pengawasan dan kelancaran pelaksanaan ujian.</p>

  <div class="ttd-container">
    <div class="ttd-box">
      Mengetahui,<br>
      Kepala Sekolah<br><br><br><br>
      <b><u>${kop.namaKepalaSekolah || 'Dr. H. Ahmad Sanusi, M.Si'}</u></b><br>
      NIP. ${kop.nipKepalaSekolah || '197203101998021001'}
    </div>
    <div class="ttd-box">
      ${kop.kotaTanggal}<br>
      Proktor / Guru Pengampu<br><br><br><br>
      <b><u>${kop.namaGuru}</u></b><br>
      NIP. ${kop.nipGuru}
    </div>
  </div>

  <!-- HALAMAN KARTU SLIP TOKEN -->
  <div class="card-grid">
    ${scheduleList
      .map(
        (s) => `
      <div class="token-card">
        <div class="token-card-header">${kop.namaSekolah} — SLIP TOKEN CBT</div>
        <div style="font-size: 11px;">
          <div><b>Sesi:</b> ${s.namaSesi}</div>
          <div><b>Mapel:</b> ${s.mapel} (${s.paketSoal})</div>
          <div><b>Kelas:</b> ${s.targetKelas}</div>
          <div><b>Waktu:</b> ${s.jamMulai} - ${s.jamSelesai} (${s.durasiMenit} Menit)</div>
        </div>
        <div class="token-card-code">${s.token}</div>
        <div style="font-size: 9px; text-align: center; color: #555;">
          *Masukkan token saat login CBT. Rahasiakan token dari peserta sesi lain.
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold border border-white/20 text-amber-100 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5" /> Sistem Manajemen Token & Jadwal Ujian
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pengaturan Token & Paket Soal CBT
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Token di-generate otomatis berdasarkan jadwal ujian & paket soal. Setiap paket soal dapat di-download dalam bentuk aplikasi CBT offline mandiri, berkas PDF, maupun DOCX secara terstruktur.
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-300">{scheduleList.length}</div>
              <div className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">Sesi Jadwal</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl font-black text-emerald-300">
                {scheduleList.filter((s) => s.status === 'ACTIVE').length}
              </div>
              <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Token Aktif</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center col-span-2 sm:col-span-1">
              <div className="text-2xl font-black text-sky-300">
                {config.questions?.filter((q) => q.isActive !== false).length || 0}
              </div>
              <div className="text-[10px] font-bold text-sky-100 uppercase tracking-wider">Soal Siap</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Step-by-Step Exam Preparation Guide (Langkah-Langkah Persiapan Ujian) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                Langkah-Langkah Persiapan Pelaksanaan Ujian CBT
              </h3>
              <p className="text-[11px] text-slate-500">
                Ikuti 4 alur sistematis berikut agar pembagian paket dan token ujian tertata rapi.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wider hidden sm:inline-block">
            SOP Standar Nasional
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Step 1 */}
          <div className="bg-slate-50 hover:bg-blue-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Setting Jadwal & Sesi</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Tentukan tanggal, jam mulai & selesai, durasi, KKM, serta target kelas peserta.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-blue-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pengaturan Waktu Akurat
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Pemisahan Paket Soal</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Bagi soal ke Paket A (Utama), Paket B (Variasi), atau Paket C (Susulan).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-indigo-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Anti-Kecurangan Antar-Sesi
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 hover:bg-amber-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <Key className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Generate Token Otomatis</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Sistem mengunci setiap jadwal dengan kode Token unik 6-karakter acak.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-amber-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Autentikasi Sesi Ujian
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 hover:bg-emerald-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  4
                </span>
                <Download className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Download & Distribusi</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Download CBT Offline (.html), cetak naskah PDF/Word, dan bagikan slip token ke siswa.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Siap Ujian Online / Offline
            </div>
          </div>
        </div>
      </div>

      {/* 3. Display Big Hero Primary Token Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
              TOKEN LOGIN SISWA SAAT INI (AKTIF UTAMA)
            </span>
          </div>
          <div className="text-4xl sm:text-6xl font-black font-mono tracking-widest text-amber-400 select-all py-1">
            {currentActiveToken}
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Siswa yang login dengan token ini akan mengerjakan <b>{activePrimarySchedule?.namaSesi || 'Sesi Utama'}</b> ({activePrimarySchedule?.paketSoal || 'Paket A'}).
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={() => handleCopy('primary', currentActiveToken)}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer shadow-md"
          >
            {copiedTokenId === 'primary' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Token Berhasil Disalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Salin Token
              </>
            )}
          </button>

          {activePrimarySchedule && (
            <button
              onClick={() => handleRegenerateSingleToken(activePrimarySchedule)}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Acak Token Baru
            </button>
          )}

          {activePrimarySchedule && (
            <button
              onClick={() => handleDownloadOfflineCbt(activePrimarySchedule)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              title="Download Aplikasi CBT Offline Mandiri (.html) dengan Token & Paket ini"
            >
              <Download className="w-4 h-4" /> Download CBT Offline (.html)
            </button>
          )}
        </div>
      </div>

      {/* 4. Action Toolbar & Filter Controls */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Sesi, Kelas, Paket Soal, atau Token..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'ACTIVE', 'STANDBY', 'CLOSED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'ALL'
                  ? 'Semua'
                  : st === 'ACTIVE'
                  ? '🟢 Aktif'
                  : st === 'STANDBY'
                  ? '🟡 Standby'
                  : '🔴 Closed'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Jadwal & Token Baru
          </button>

          <button
            onClick={handleRegenerateAllTokens}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
            title="Acak semua token untuk seluruh jadwal"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Acak Semua Token
          </button>

          <button
            onClick={handlePrintFullBeritaAcara}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-3 py-2 rounded-xl text-xs transition border border-blue-200 cursor-pointer"
            title="Cetak Berita Acara & Slip Distribusi Token Seluruh Sesi"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" /> Cetak Berita Acara (A4)
          </button>
        </div>
      </div>

      {/* 5. Systematic Table of Token & Schedule Settings */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" /> Tabel Sistem Token & Paket Soal Ujian CBT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap baris jadwal memiliki Token unik dan tautan langsung untuk mengunduh paket soal mandiri.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Menampilkan {filteredList.length} dari {scheduleList.length} Sesi
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
              <Key className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Belum Ada Data Jadwal & Token Ujian</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Klik tombol "Tambah Jadwal & Token Baru" di atas untuk membuat sesi jadwal dan meng-generate token ujian pertama Anda.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Jadwal & Token Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3.5 px-4">No / ID Sesi</th>
                  <th className="py-3.5 px-4">Nama Sesi & Target Kelas</th>
                  <th className="py-3.5 px-4">Paket Soal & Kode</th>
                  <th className="py-3.5 px-4">Waktu & Durasi</th>
                  <th className="py-3.5 px-4 text-center">Token Ujian (Auto)</th>
                  <th className="py-3.5 px-4 text-center">Status Sesi</th>
                  <th className="py-3.5 px-4 text-right">Download & Aksi Paket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredList.map((item, idx) => {
                  const isPrimary = item.isPrimaryActive || item.token === config.examToken;
                  const packageQuestions = getQuestionsForPackage(item);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        isPrimary ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* 1. No / ID Sesi */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-[11px] text-slate-500 block">
                              {item.id}
                            </span>
                            {isPrimary && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-300 uppercase tracking-tighter">
                                ★ Login Utama
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Nama Sesi & Target Kelas */}
                      <td className="py-4 px-4 align-middle">
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {item.namaSesi}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="font-medium">Kelas: <b>{item.targetKelas || 'Semua Kelas'}</b></span>
                          </div>
                          {item.keterangan && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                              {item.keterangan}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Paket Soal & Kode */}
                      <td className="py-4 px-4 align-middle">
                        <div>
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-200">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" /> {item.paketSoal}
                          </span>
                          <div className="font-mono text-[10px] text-slate-500 font-bold mt-1">
                            Kode: {item.kodePaket}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            ✓ {packageQuestions.length} Butir Soal Terkoneksi
                          </div>
                        </div>
                      </td>

                      {/* 4. Waktu & Durasi */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {item.tanggalUjian || 'Setiap Hari'}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                            {item.jamMulai} - {item.jamSelesai} ({item.durasiMenit} Menit)
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            KKM: <b className="text-slate-800">{item.kkm}</b>
                          </div>
                        </div>
                      </td>

                      {/* 5. Token Ujian (Auto-Generated) */}
                      <td className="py-4 px-4 align-middle text-center">
                        <div className="inline-flex flex-col items-center gap-1.5 bg-slate-900 text-white p-2.5 rounded-2xl shadow-sm border border-slate-800 min-w-[130px]">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            TOKEN SESI
                          </span>
                          <span className="font-mono font-black text-base text-amber-400 tracking-widest select-all">
                            {item.token}
                          </span>
                          <div className="flex items-center gap-1 pt-1 border-t border-slate-800 w-full justify-center">
                            <button
                              onClick={() => handleCopy(item.id, item.token)}
                              className="p-1 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Salin Token"
                            >
                              {copiedTokenId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRegenerateSingleToken(item)}
                              className="p-1 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Acak / Generate Ulang Token Ini"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 6. Status Sesi */}
                      <td className="py-4 px-4 align-middle text-center">
                        <div className="space-y-1.5 inline-block text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : item.status === 'STANDBY'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : item.status === 'STANDBY'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            ></span>
                            {item.status}
                          </span>

                          {!isPrimary && item.status !== 'CLOSED' && (
                            <div>
                              <button
                                onClick={() => handleSetPrimaryToken(item)}
                                className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-200 px-2 py-0.5 rounded transition cursor-pointer block w-full"
                                title="Jadikan sesi ini sebagai token aktif di halaman login peserta"
                              >
                                Set ke Login
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. Download & Aksi Paket */}
                      <td className="py-4 px-4 align-middle text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Main Download Button */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownloadOfflineCbt(item)}
                              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                              title="Download Aplikasi CBT Offline Standalone HTML untuk Paket & Token ini"
                            >
                              <Download className="w-3.5 h-3.5" /> Download CBT (.html)
                            </button>

                            <button
                              onClick={() => handleDownloadPdf(item)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold p-1.5 rounded-xl text-xs transition border border-blue-200 cursor-pointer"
                              title="Cetak Naskah Soal Standar Ujian PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadWord(item)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold p-1.5 rounded-xl text-xs transition border border-indigo-200 cursor-pointer"
                              title="Download Naskah Soal MS Word (.docx)"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadJsonPackage(item)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-xl text-xs transition cursor-pointer"
                              title="Download File JSON Paket Soal"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Action Row */}
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              onClick={() => handleDeleteSchedule(item.id)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Info & Best Practice Guide Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
          <Info className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          Petunjuk Distribusi & Keamanan Token Ujian:
        </div>
        <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px] leading-relaxed pl-1">
          <li>
            <b>Distribusi Tepat Waktu:</b> Bagikan Token kepada siswa sesaat sebelum jam ujian dimulai (atau tayangkan di proyektor kelas) agar siswa tidak dapat membuka soal sebelum waktunya.
          </li>
          <li>
            <b>Paket Berbeda Antar Sesi:</b> Gunakan Paket A untuk Sesi 1 dan Paket B untuk Sesi 2 agar peserta sesi siang tidak mendapatkan bocoran soal dari peserta sesi pagi.
          </li>
          <li>
            <b>Download CBT Offline Mandiri:</b> Tombol <code>Download CBT (.html)</code> menghasilkan file web aplikasi mandiri tanpa internet yang sudah memuat paket soal & token khusus tersebut. File ini dapat langsung dicopy ke flashdisk / komputer lab.
          </li>
        </ul>
      </div>

      {/* 7. Modal Add / Edit Schedule & Token */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {editingToken ? 'Edit Jadwal & Token Ujian' : 'Tambah Jadwal & Generate Token Baru'}
                  </h3>
                  <p className="text-xs text-amber-100">
                    Atur parameter waktu, paket soal, dan kode token unik untuk sesi ini.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-amber-100 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveModalForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Sesi */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Nama Sesi Ujian *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNamaSesi}
                    onChange={(e) => setFormNamaSesi(e.target.value)}
                    placeholder="Misal: Sesi 1 - Utama (Kelas XII IPS 1 & 2)"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Target Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Target Kelas Peserta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTargetKelas}
                    onChange={(e) => setFormTargetKelas(e.target.value)}
                    placeholder="Misal: XII IPS 1, XII IPS 2"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    placeholder="Sosiologi"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Paket Soal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Pilihan Paket Soal *
                  </label>
                  <select
                    value={formPaketSoal}
                    onChange={(e) => {
                      setFormPaketSoal(e.target.value);
                      if (e.target.value.includes('Paket A')) setFormKodePaket('PKT-SOS-A');
                      else if (e.target.value.includes('Paket B')) setFormKodePaket('PKT-SOS-B');
                      else if (e.target.value.includes('Paket C')) setFormKodePaket('PKT-SOS-C');
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Paket A (Utama)">Paket A (Utama - Semua Soal)</option>
                    <option value="Paket B (Acak Variasi)">Paket B (Acak Variasi / Ganjil)</option>
                    <option value="Paket C (Susulan)">Paket C (Susulan / Genap)</option>
                  </select>
                </div>

                {/* Kode Paket */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Kode Paket Soal
                  </label>
                  <input
                    type="text"
                    value={formKodePaket}
                    onChange={(e) => setFormKodePaket(e.target.value.toUpperCase())}
                    placeholder="PKT-SOS-A"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>

                {/* Tanggal Ujian */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Durasi & KKM */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Durasi (Mnt)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={formDurasi}
                      onChange={(e) => setFormDurasi(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      KKM Nilai
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formKkm}
                      onChange={(e) => setFormKkm(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Jam Mulai & Jam Selesai */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      value={formJamMulai}
                      onChange={(e) => setFormJamMulai(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      value={formJamSelesai}
                      onChange={(e) => setFormJamSelesai(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status Sesi */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Status Sesi Ujian
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none bg-white"
                  >
                    <option value="ACTIVE">🟢 ACTIVE (Buka Ujian)</option>
                    <option value="STANDBY">🟡 STANDBY (Persiapan / Kunci)</option>
                    <option value="CLOSED">🔴 CLOSED (Tutup / Selesai)</option>
                  </select>
                </div>

                {/* Token Ujian Generate Box */}
                <div className="sm:col-span-2 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                    KODE TOKEN UJIAN (6 KARAKTER UNIK)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={formToken}
                      onChange={(e) => setFormToken(e.target.value.toUpperCase())}
                      placeholder="SOS2026"
                      className="flex-1 border-2 border-amber-500/50 bg-slate-800 text-amber-300 rounded-xl p-3 text-lg font-mono font-black uppercase tracking-widest focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormToken(generateRandomTokenStr())}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Acak Token
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Token ini akan diinput siswa di portal login untuk membuka paket soal sesi ini.
                  </p>
                </div>

                {/* Keterangan */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Catatan / Keterangan Sesi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Misal: Ujian Utama Lab Komputer 1 & 2"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 rounded-xl font-black transition shadow-md cursor-pointer"
                >
                  {editingToken ? 'Simpan Perubahan Jadwal' : 'Simpan & Generate Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
