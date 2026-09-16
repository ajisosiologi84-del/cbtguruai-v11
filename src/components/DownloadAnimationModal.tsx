import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, CheckCircle2, ShieldCheck, FileJson, FileCheck, Sparkles, Lock, Zap } from 'lucide-react';

interface DownloadAnimationModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  fileName: string;
  fileType?: 'json' | 'cbt' | 'pdf' | 'xlsx';
  onComplete: () => void;
  onClose: () => void;
}

export const DownloadAnimationModal: React.FC<DownloadAnimationModalProps> = ({
  isOpen,
  title,
  subtitle = 'Memproses enkripsi & pengemasan berkas...',
  fileName,
  fileType = 'cbt',
  onComplete,
  onClose,
}) => {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Menginisialisasi...');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsFinished(false);
      setStageText('Menginisialisasi...');
      return;
    }

    let interval: NodeJS.Timeout;
    let currentProgress = 0;

    interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 5;

      if (currentProgress < 30) {
        setStageText('Mengamankan identitas & kunci enkripsi...');
      } else if (currentProgress < 70) {
        setStageText('Mengompresi data & stempel digital...');
      } else if (currentProgress < 95) {
        setStageText('Menyiapkan berkas file untuk diunduh...');
      } else {
        currentProgress = 100;
        setStageText('Berhasil Diunduh! ✨');
        setIsFinished(true);
        clearInterval(interval);

        // Execute actual download trigger
        onComplete();

        // Auto close after showing success animation
        setTimeout(() => {
          onClose();
        }, 1800);
      }

      setProgress(Math.min(currentProgress, 100));
    }, 80);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 sm:p-8 text-center relative overflow-hidden space-y-6"
        >
          {/* Glowing Background Radial Ambient */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-sky-400/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Icon Stage Animation */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            {/* Pulsing Rings */}
            <motion.div
              animate={isFinished ? { scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] } : { rotate: 360 }}
              transition={isFinished ? { duration: 1.2, repeat: Infinity } : { duration: 3, repeat: Infinity, ease: 'linear' }}
              className={`absolute inset-0 rounded-full border-2 border-dashed ${
                isFinished ? 'border-emerald-500 bg-emerald-50' : 'border-sky-500/50 bg-sky-50/50'
              }`}
            />

            <AnimatePresence mode="wait">
              {!isFinished ? (
                <motion.div
                  key="loading-icon"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="relative z-10 w-16 h-16 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30"
                >
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {fileType === 'json' ? (
                      <FileJson className="w-8 h-8" />
                    ) : (
                      <Lock className="w-8 h-8 text-sky-200" />
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="success-icon"
                  initial={{ scale: 0.2, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  className="relative z-10 w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/40"
                >
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sparkle Badges */}
            {isFinished && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md"
              >
                <Sparkles className="w-4 h-4 fill-amber-400" />
              </motion.div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
            <div className="inline-block mt-1 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono font-bold text-slate-700 max-w-full truncate">
              📄 {fileName}
            </div>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                {!isFinished ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block text-sky-600"
                    >
                      ⚡
                    </motion.span>
                    {stageText}
                  </>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Enkripsi &amp; Pengunduhan Selesai
                  </span>
                )}
              </span>
              <span className={`font-mono font-black ${isFinished ? 'text-emerald-600' : 'text-sky-600'}`}>
                {progress}%
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
                className={`h-full rounded-full transition-all ${
                  isFinished
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500'
                }`}
              />
            </div>
          </div>

          {/* Animated Security Pill Footer */}
          <div className="pt-1">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Proteksi Berkas Terenkripsi CBT GURUAI v2.0</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
