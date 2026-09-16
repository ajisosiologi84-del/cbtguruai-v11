import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X, Maximize2, ShieldAlert, Lock } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  warningCount: number;
  maxWarnings: number;
  customMsg?: string | null;
  onUnderstand: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  warningCount,
  maxWarnings,
  customMsg,
  onUnderstand,
}) => {
  if (!isOpen) return null;

  const getWarningBadgeColor = (count: number) => {
    if (count === 1) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (count === 2) return 'bg-orange-100 text-orange-950 border-orange-300';
    return 'bg-red-100 text-red-950 border-red-300 animate-pulse';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 text-center shadow-2xl transform scale-100 transition-transform border-4 border-red-500 animate-bounce-subtle space-y-4">
        <div className="w-18 h-18 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mx-auto shadow-inner border border-red-300 animate-pulse">
          <AlertTriangle className="w-10 h-10 text-red-600 animate-spin-slow" />
        </div>
        
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2 bg-red-600 text-white shadow-sm">
            <Lock className="w-3.5 h-3.5" /> Deteksi Pelanggaran Keamanan CBT
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Peringatan Keamanan #{warningCount}</h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs sm:text-sm text-red-950 text-left font-medium leading-relaxed">
          {customMsg || "Sistem mendeteksi Anda meninggalkan layar ujian, mengecilkan jendela (minimize), membuka tab lain, atau membagi layar (split screen)."}
        </div>

        <div className={`p-3 rounded-2xl font-bold border-2 flex items-center justify-center gap-2 text-xs sm:text-sm ${getWarningBadgeColor(warningCount)}`}>
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Status Pelanggaran: <strong className="text-base sm:text-lg font-black">{warningCount}</strong> dari {maxWarnings} kali batas</span>
        </div>

        <p className="text-xs text-slate-500 font-semibold italic">
          {warningCount >= maxWarnings - 1 
            ? '⚠️ PERINGATAN KERAS! 1x pelanggaran lagi akan otomatis menghentikan ujian & mengirim nilai apa adanya.'
            : `Ujian CBT mewajibkan 1 layar penuh. Dilarang membuka aplikasi lain atau membagi layar.`}
        </p>

        <button
          onClick={onUnderstand}
          className="w-full bg-slate-900 hover:bg-slate-950 active:bg-black text-white font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <Maximize2 className="w-4 h-4 text-emerald-400" />
          <span>Kunci Layar Penuh & Lanjutkan Ujian ({Math.max(0, maxWarnings - warningCount)} kesempatan tersisa)</span>
        </button>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Ya, Selesai",
  cancelText = "Batal",
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } font-bold rounded-xl transition-all shadow-md text-sm active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center border border-gray-100">
        <div className="text-amber-500 mb-3 flex justify-center">
          <Info className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Informasi</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};
