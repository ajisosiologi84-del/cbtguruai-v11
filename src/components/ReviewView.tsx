import React from 'react';
import { Question } from '../types';
import { formatQuestionText, isQuestionAnswerCorrect, getStudentAnswerDisplay, getCorrectAnswerDisplay } from '../utils/questionFormatter';
import { CheckCircle2, XCircle, Microscope, LogOut, BookOpen, Layers } from 'lucide-react';

interface ReviewViewProps {
  questions: Question[];
  answers: (string | null)[];
  onExit: () => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ questions, answers, onExit }) => {
  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-100 fixed inset-0 z-50 overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0 shadow-md gap-2">
        <div className="min-w-0">
          <h1 className="font-bold text-base sm:text-xl flex items-center gap-2 truncate">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0" /> Pembahasan Ilmiah Sosiologi
          </h1>
          <p className="text-slate-300 text-[10px] sm:text-xs mt-0.5 truncate hidden sm:block">Analisis HOTS - Perubahan Sosial & Globalisasi</p>
        </div>
        <button
          onClick={onExit}
          className="min-h-[44px] bg-slate-800 hover:bg-slate-700 active:bg-slate-950 px-3.5 py-2 rounded-xl font-extrabold transition-all text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 active:scale-95 shrink-0 cursor-pointer shadow-xs"
          title="Kembali ke Halaman Utama / Portal"
        >
          <LogOut className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Kembali ke </span>Utama
        </button>
      </header>

      {/* Review List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {questions.map((q, index) => {
            const userAnsId = answers[index];
            const isUserCorrect = isQuestionAnswerCorrect(q, userAnsId);
            const userDisplay = getStudentAnswerDisplay(q, userAnsId);
            const correctDisplay = getCorrectAnswerDisplay(q);
            const bentukText = q.bentukSoal || 'Pilihan Ganda';

            return (
              <div
                key={q.id || index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8"
              >
                <div className="flex justify-between items-start mb-4 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                      Soal No. {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {bentukText}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      isUserCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {isUserCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Benar
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" /> Salah
                      </>
                    )}
                  </span>
                </div>

                {q.image && (
                  <div className="mb-5 flex justify-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <img
                      src={q.image}
                      alt="Lampiran Soal"
                      className="max-h-72 w-auto object-contain rounded-xl border border-slate-100"
                    />
                  </div>
                )}

                <div
                  className="text-gray-800 mb-6 font-medium text-base sm:text-lg leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: formatQuestionText(q.question) }}
                />

                <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200 space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Jawaban Anda:</p>
                    <p
                      className={`font-bold text-sm ${
                        isUserCorrect ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {userAnsId ? userDisplay : <i className="font-normal text-gray-400">Kosong (Tidak Dijawab)</i>}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Kunci Jawaban Benar:</p>
                    <p className="font-bold text-sm text-blue-700">
                      {correctDisplay}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                  <p className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                    <Microscope className="w-4 h-4 text-amber-600" /> Pembahasan Analisis HOTS
                  </p>
                  <p className="text-sm text-amber-950 leading-relaxed">
                    {q.explanation || 'Belum ada pembahasan.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
