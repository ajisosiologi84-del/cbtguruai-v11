import React, { useState, useEffect } from 'react';
import { AppConfig, StudentInfo } from '../types';
import { BookOpen, Clock, ShieldAlert, PlayCircle, CheckCircle2, Award, WifiOff, Wifi, AlertTriangle, RefreshCw, ArrowRight, X, ArrowLeft, Maximize2, Split, Smartphone, Share2, PlusSquare } from 'lucide-react';
import { requestAppFullscreen, isIOSDevice, isIOSStandalone } from '../utils/antiCheating';

interface PreTestViewProps {
  config: AppConfig;
  studentInfo: StudentInfo;
  studentAttemptsCount?: number;
  maxAttempts?: number;
  hasSavedSession?: boolean;
  onStartTest: () => void;
  onBackToPortal: () => void;
}

export const PreTestView: React.FC<PreTestViewProps> = ({
  config,
  studentInfo,
  studentAttemptsCount = 0,
  maxAttempts = 1,
  hasSavedSession = false,
  onStartTest,
  onBackToPortal,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOnlineModal, setShowOnlineModal] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const executeStartExam = async () => {
    // Directly request fullscreen on user click
    await requestAppFullscreen();
    onStartTest();
  };

  const handleStartButtonClick = () => {
    if (isLimitReached || isSessionClosed || isSessionDraft) return;

    if (navigator.onLine) {
      setIsOnline(true);
      setShowOnlineModal(true);
    } else {
      setIsOnline(false);
      executeStartExam();
    }
  };

  const teacherConfig = studentInfo.kodeGuru ? config.teacherConfigs?.[studentInfo.kodeGuru] : undefined;
  const effectiveSchedule = teacherConfig?.examSchedule || config.examSchedule;
  const sessionStatus = effectiveSchedule?.sessionStatus || 'ACTIVE';
  const effectiveDuration = teacherConfig?.duration ?? config.duration;
  const effectiveKkm = teacherConfig?.kkm ?? config.kkm;

  const isLimitReached = studentAttemptsCount >= maxAttempts;
  const isSessionClosed = sessionStatus === 'CLOSED';
  const isSessionDraft = sessionStatus === 'DRAFT';
  const isStartDisabled = isLimitReached || isSessionClosed || isSessionDraft;

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-100 fixed inset-0 z-40 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl my-auto overflow-hidden border border-gray-100 animate-fade-in flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="border-b border-gray-100 p-4 sm:p-6 bg-slate-50 flex justify-between items-center shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">Konfirmasi Data Peserta</h2>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">Sistem CBT Assessment TKA SMA 2026</p>
            </div>
          </div>
          <button
            onClick={onBackToPortal}
            className="min-h-[44px] px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-extrabold border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 shadow-2xs"
            title="Kembali ke Halaman Utama / Portal"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 shrink-0" />
            <span className="hidden sm:inline">Kembali ke </span>Utama
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          {hasSavedSession && !isSessionClosed && !isSessionDraft && !isLimitReached && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 sm:p-5 mb-6 text-emerald-950 animate-pulse shadow-sm">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-1 text-emerald-900">
                <RefreshCw className="w-5 h-5 text-emerald-600 shrink-0" /> Sesi Ujian Terpisah / Terputus Ditemukan (Autosave System)
              </div>
              <p className="text-xs sm:text-sm leading-relaxed font-semibold text-emerald-800">
                Jawaban dan sisa waktu Anda dari pengerjaan sebelumnya telah tersimpan otomatis di perangkat ini. Klik tombol di bawah untuk melanjutkan ujian tanpa mengulang dari awal!
              </p>
            </div>
          )}

          {isSessionDraft && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 mb-6 text-amber-900">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-1">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" /> Sesi Ujian Belum Dibuka (Status DRAFT)
              </div>
              <p className="text-xs sm:text-sm leading-relaxed font-semibold">
                Sesi ujian ini sedang dalam persiapan oleh Guru Pengawas. Tombol pengerjaan belum dapat diakses sampai status ujian diubah menjadi ACTIVE.
              </p>
            </div>
          )}

          {isSessionClosed && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 mb-6 text-red-900">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-1">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" /> Sesi Ujian Telah Ditutup (CLOSED)
              </div>
              <p className="text-xs sm:text-sm leading-relaxed font-semibold">
                Waktu pelaksanaan ujian ini telah berakhir dan ditutup secara resmi oleh Guru Pengawas.
              </p>
            </div>
          )}

          {isLimitReached && !isSessionClosed && !isSessionDraft && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 mb-6 text-red-900 animate-pulse">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-1">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" /> Batas Maksimal Ujian Tercapai
              </div>
              <p className="text-xs sm:text-sm leading-relaxed font-semibold">
                Anda sudah mengerjakan ujian ini sebanyak <b>{studentAttemptsCount} kali</b> dari batas maksimal <b>{maxAttempts}x</b> yang ditentukan. Anda tidak dapat mengerjakan ulang ujian ini. Silakan kembali ke menu portal.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Nama Siswa</p>
                <p className="font-bold text-base sm:text-lg text-gray-800 mt-0.5">{studentInfo.name}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Nomor Peserta</p>
                <p className="font-mono font-bold text-slate-700 text-sm sm:text-base mt-0.5">{studentInfo.noPeserta}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Mata Pelajaran</p>
                <p className="font-bold text-blue-600 text-sm sm:text-base mt-0.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 shrink-0" /> {studentInfo.mapel}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Status Percobaan</p>
                <p className={`font-bold text-xs sm:text-sm mt-0.5 flex items-center gap-1.5 ${isLimitReached ? 'text-red-600' : 'text-emerald-600'}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Sudah dikerjakan: {studentAttemptsCount} / {maxAttempts}x
                </p>
              </div>
            </div>
          </div>

          {/* Security & Rules Banner */}
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 text-amber-950 shadow-xs">
            <h3 className="font-extrabold text-amber-900 mb-3 flex items-center gap-2 text-xs sm:text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" /> Fitur Keamanan Ketat & Tata Tertib Ujian CBT
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 text-xs font-semibold">
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 flex items-center gap-2">
                <span className="text-base">🖥️</span>
                <div>
                  <span className="font-bold text-amber-950 block">Layar Penuh Otomatis (Fullscreen)</span>
                  <span className="text-[11px] text-amber-800 font-normal">Wajib fullscreen; keluar layar dianggap pelanggaran</span>
                </div>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 flex items-center gap-2">
                <span className="text-base">🚫</span>
                <div>
                  <span className="font-bold text-amber-950 block">Anti-Split Screen & Minimize</span>
                  <span className="text-[11px] text-amber-800 font-normal">Membagi layar / minimize otomatis terdeteksi & dicatat</span>
                </div>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 flex items-center gap-2">
                <span className="text-base">🔒</span>
                <div>
                  <span className="font-bold text-amber-950 block">Anti-Screenshot & Copy-Paste</span>
                  <span className="text-[11px] text-amber-800 font-normal">PrintScreen & shortcut pencarian jawaban diblokir</span>
                </div>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 flex items-center gap-2">
                <span className="text-base">⚡</span>
                <div>
                  <span className="font-bold text-amber-950 block">Audit Log Terenkripsi (.cbt)</span>
                  <span className="text-[11px] text-amber-800 font-normal">Pelanggaran &gt; {maxAttempts >= 1 ? '3x' : '3x'} memicu penghentian otomatis</span>
                </div>
              </div>
            </div>

            <ul className="text-xs text-amber-900 space-y-1.5 list-disc pl-4 sm:pl-5 leading-relaxed font-medium">
              <li>Saat menekan <b>Mulai Mengerjakan Ujian</b>, sistem otomatis beralih ke <b>Layar Penuh (Fullscreen)</b>.</li>
              <li>Dilarang menekan tombol Home, keluar aplikasi, membuka tab baru, atau membagi layar (Split-Screen).</li>
              <li>Seluruh aktivitas pelanggaran akan otomatis dilaporkan ke <b>Panel Audit Proktor/Guru</b>.</li>
            </ul>
          </div>

          {/* Special Guidance Card for iPhone / iOS Users */}
          {isIOSDevice() && (
            <div className="bg-sky-50 border-2 border-sky-300 rounded-2xl p-4 mb-6 sm:mb-8 text-sky-950 shadow-xs">
              <div className="flex items-center gap-2 font-extrabold text-sky-900 text-xs sm:text-sm mb-2">
                <Smartphone className="w-5 h-5 text-sky-600 shrink-0" />
                <span>Petunjuk Layar Penuh (Fullscreen) Khusus Pengguna iPhone / iPad</span>
              </div>
              <p className="text-xs text-sky-900 leading-relaxed font-medium mb-3">
                Apple Safari pada iPhone memblokir mode Fullscreen standar untuk halaman web. Agar dapat mengerjakan dalam mode <b>Full Screen tanpa bar Safari</b>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
                <div className="bg-white p-2.5 rounded-xl border border-sky-200 flex items-start gap-2">
                  <span className="font-bold text-sky-700 shrink-0">1.</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Tombol Bagikan</span>
                    <span className="text-[11px] text-slate-600 font-normal">Tekan ikon <Share2 className="w-3 h-3 inline text-sky-600" /> (Share) di Safari</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-sky-200 flex items-start gap-2">
                  <span className="font-bold text-sky-700 shrink-0">2.</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Layar Utama</span>
                    <span className="text-[11px] text-slate-600 font-normal">Pilih <PlusSquare className="w-3 h-3 inline text-sky-600" /> "Tambahkan ke Layar Utama"</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-sky-200 flex items-start gap-2">
                  <span className="font-bold text-sky-700 shrink-0">3.</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Buka CBT</span>
                    <span className="text-[11px] text-slate-600 font-normal">Buka dari ikon Layar Utama iPhone untuk Fullscreen murni</span>
                  </div>
                </div>
              </div>
              {isIOSStandalone() && (
                <div className="mt-3 p-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>iPhone Anda saat ini sudah berjalan dalam mode Fullscreen Standalone!</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBackToPortal}
              className="w-full sm:w-1/3 min-h-[48px] bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-extrabold py-3 px-4 rounded-2xl transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 shadow-2xs border border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Kembali ke Utama</span>
            </button>
            <button
              onClick={handleStartButtonClick}
              disabled={isStartDisabled}
              className={`w-full sm:w-2/3 ${
                isStartDisabled 
                  ? 'bg-slate-400 cursor-not-allowed opacity-75' 
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              } text-white font-bold py-3.5 sm:py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg active:scale-[0.98] cursor-pointer`}
            >
              <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              {isSessionDraft
                ? 'Sesi Ujian DRAFT (Belum Dibuka)'
                : isSessionClosed
                ? 'Sesi Ujian CLOSED (Ditutup)'
                : isLimitReached
                ? 'Batas Ujian Tercapai'
                : hasSavedSession
                ? '⚡ Lanjutkan Ujian (Pulihkan Jawaban)'
                : 'Mulai Mengerjakan Ujian'}
            </button>
          </div>
        </div>
      </div>

      {/* ONLINE MODE WARNING & OFFLINE INSTRUCTION MODAL */}
      {showOnlineModal && (
        <div className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-amber-200 text-slate-800 relative overflow-hidden animate-scale-up">
            <button 
              onClick={() => setShowOnlineModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 border border-amber-300 shadow-inner">
              <WifiOff className="w-8 h-8 animate-pulse" />
            </div>

            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Peringatan Keamanan CBT
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                Terdeteksi Koneksi Online (Internet Aktif)
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-amber-950 text-xs sm:text-sm font-semibold leading-relaxed">
                <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  ⚠️ Pindahkan Mode Offline agar bisa mengerjakan CBT!
                </p>
                Sistem mendeteksi perangkat Anda terhubung ke internet. Untuk mencegah kecurangan, browsing jawaban, dan pengalihan fokus saat ujian, Anda sangat disarankan untuk mematikan koneksi internet.
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-800">Petunjuk Beralih ke Mode Offline:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                  <li>Matikan <b>Wi-Fi</b> atau <b>Data Seluler</b> di HP / Laptop Anda.</li>
                  <li>Atau aktifkan <b>Mode Pesawat (Airplane Mode)</b>.</li>
                  <li>Aplikasi CBT akan otomatis mendeteksi status Offline Anda.</li>
                </ol>
              </div>

              {/* Realtime Status Badge */}
              <div className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-between ${
                isOnline 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className="flex items-center gap-2">
                  {isOnline ? <Wifi className="w-4 h-4 text-red-500" /> : <WifiOff className="w-4 h-4 text-emerald-600" />}
                  Status Jaringan Saat Ini:
                </span>
                <span className="font-black uppercase tracking-wider">
                  {isOnline ? '🔴 ONLINE' : '🟢 OFFLINE (Aman)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {!isOnline ? (
                <button
                  onClick={() => {
                    setShowOnlineModal(false);
                    executeStartExam();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-5 rounded-2xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5" /> Mode Offline Aktif - Mulai Ujian Now
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsOnline(navigator.onLine)}
                    className="w-full sm:w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Cek Koneksi Lagi
                  </button>
                  <button
                    onClick={() => {
                      setShowOnlineModal(false);
                      executeStartExam();
                    }}
                    className="w-full sm:w-1/2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Lanjutkan Ujian</span> <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
