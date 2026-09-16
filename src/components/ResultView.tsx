import React, { useState } from 'react';
import { Download, ShieldCheck, CheckCircle2, LogOut, UploadCloud, ExternalLink, Sparkles } from 'lucide-react';
import { DownloadAnimationModal } from './DownloadAnimationModal';

interface ResultViewProps {
  score: number;
  correctCount: number;
  incorrectCount: number;
  kkm: number;
  studentName: string;
  noPeserta: string;
  driveUploadUrl?: string;
  onDownloadEncryptedResult: () => void;
  onViewDiscussion?: () => void;
  onRestart: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  studentName,
  noPeserta,
  driveUploadUrl,
  onDownloadEncryptedResult,
  onRestart,
}) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  const resultFileName = `HASIL_CBT_${noPeserta}_${cleanName}.cbt`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 fixed inset-0 z-40 overflow-y-auto p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in p-6 sm:p-10 text-center relative border border-gray-100 my-auto space-y-6">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-emerald-50 rounded-br-full -z-10 opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-sky-50 rounded-tl-full -z-10 opacity-70"></div>

        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-bold mb-3 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Mode Offline &amp; Jawaban Terenkripsi Aman
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Ujian Telah Selesai!</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Terima kasih <span className="font-bold text-slate-800">{studentName}</span> ({noPeserta})
          </p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            Status Pengiriman Jawaban
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Jawaban Anda telah tersimpan secara otomatis dan terenkripsi. Silakan unduh file <b>.cbt</b> di bawah ini dan serahkan kepada Guru atau Pengawas Ujian Anda untuk direkap.
          </p>
        </div>

        {/* Encrypted Download Banner */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md text-left space-y-3 relative overflow-hidden border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> File Hasil Ujian Terenkripsi (.cbt)
            </p>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
              VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            File ini berisi rekaman jawaban Anda yang telah diamankan secara digital agar tidak dapat diubah oleh pihak mana pun.
          </p>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 px-5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-xs active:scale-95 cursor-pointer group"
          >
            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            <span>Unduh File Jawaban (.cbt)</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>

        {/* Upload Hasil Jawaban Google Drive Banner */}
        {driveUploadUrl ? (
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md text-left space-y-3 border border-indigo-700/60">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-400" /> Upload Hasil Jawaban (Google Drive)
              </p>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Setelah mengunduh file <b>.cbt</b> di atas, klik tombol di bawah ini untuk mengunggah file jawaban Anda ke folder Google Drive yang telah disediakan Guru.
            </p>
            <a
              href={driveUploadUrl.startsWith('http') ? driveUploadUrl : `https://${driveUploadUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs active:scale-95 cursor-pointer block text-center"
            >
              <UploadCloud className="w-4 h-4" /> Buka Google Drive &amp; Upload File Jawaban (.cbt)
            </a>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-1.5">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-slate-500" /> Upload Link Google Drive
            </p>
            <p className="text-[11px] text-slate-500">
              Link upload Google Drive belum dikonfigurasi oleh Admin. Serahkan file <b>.cbt</b> yang diunduh langsung kepada Guru/Pengawas.
            </p>
          </div>
        )}

        {/* Exit Action */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onRestart}
            className="w-full min-h-[48px] bg-slate-900 hover:bg-slate-950 active:bg-black text-white font-extrabold py-3.5 px-5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Keluar dari Aplikasi (Kembali ke Halaman Utama)</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 pt-2">
          <span>create: </span>
          <a href="https://lynk.id/ajisosiologi" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-blue-600">
            @ajisosiologi
          </a>{' '}
          - Offline Secure Assessment System
        </p>
      </div>

      {/* Download Animation Modal */}
      <DownloadAnimationModal
        isOpen={isDownloadModalOpen}
        title="Mengunduh Hasil Jawaban (.cbt)"
        subtitle="Memproses stempel digital & enkripsi hasil ujian..."
        fileName={resultFileName}
        fileType="cbt"
        onComplete={onDownloadEncryptedResult}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};

