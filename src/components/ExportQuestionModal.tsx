import React, { useState } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  X,
  Settings,
  BookOpen,
  Calendar,
  Clock,
  UserCheck,
  Building,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { Question, KopSekolahConfig } from '../types';
import {
  QuestionExportOptions,
  defaultExportOptions,
  openQuestionPrintWindow,
  exportQuestionsToWord,
} from '../utils/questionExport';

interface ExportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  allQuestions: Question[];
  selectedQuestionIds: number[];
  currentMapel?: string;
  kopSekolah?: KopSekolahConfig;
}

export const ExportQuestionModal: React.FC<ExportQuestionModalProps> = ({
  isOpen,
  onClose,
  allQuestions,
  selectedQuestionIds,
  currentMapel = 'Sosiologi',
  kopSekolah,
}) => {
  const [sourceType, setSourceType] = useState<'selected' | 'all'>(
    selectedQuestionIds.length > 0 ? 'selected' : 'all'
  );

  const selectedQuestions = allQuestions.filter((q) =>
    selectedQuestionIds.includes(q.id)
  );

  const questionsToExport =
    sourceType === 'selected' && selectedQuestions.length > 0
      ? selectedQuestions
      : allQuestions;

  const [options, setOptions] = useState<QuestionExportOptions>({
    ...defaultExportOptions,
    mapel: currentMapel || defaultExportOptions.mapel,
    kopSekolah: kopSekolah || defaultExportOptions.kopSekolah,
  });

  if (!isOpen) return null;

  const handlePrintPdf = () => {
    if (questionsToExport.length === 0) {
      alert('Tidak ada soal yang dipilih atau tersedia untuk diekspor!');
      return;
    }
    openQuestionPrintWindow(questionsToExport, options);
  };

  const handleExportWord = () => {
    if (questionsToExport.length === 0) {
      alert('Tidak ada soal yang dipilih atau tersedia untuk diekspor!');
      return;
    }
    exportQuestionsToWord(questionsToExport, options);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                Export Soal Standar Ujian Nasional
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 uppercase tracking-wider">
                  PDF & Word
                </span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Cetak ke PDF atau download berkas MS Word (.docx) terstruktur rapi dengan Kop & Format Standar Nasional.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* 1. Sumber Soal Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" /> Sumber Soal Yang Diekspor:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                onClick={() => setSourceType('selected')}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                  sourceType === 'selected'
                    ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                } ${selectedQuestionIds.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === 'selected'}
                  onChange={() => setSourceType('selected')}
                  disabled={selectedQuestionIds.length === 0}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="block font-bold">Soal Dicentang / Terpilih</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedQuestionIds.length} soal dicentang di Bank Soal
                  </span>
                </div>
              </label>

              <label
                onClick={() => setSourceType('all')}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                  sourceType === 'all'
                    ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === 'all'}
                  onChange={() => setSourceType('all')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="block font-bold">Seluruh Soal Bank / Filtered</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total {allQuestions.length} soal di daftar aktif
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Jenis Dokumen */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" /> Tipe Dokumen Output:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setOptions({ ...options, docType: 'SOAL_ONLY' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  options.docType === 'SOAL_ONLY'
                    ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>📄 Naskah Soal Saja</span>
                  {options.docType === 'SOAL_ONLY' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <p className="text-[10px] opacity-80 mt-1">Untuk dicetak dan dibagikan ke siswa saat ujian.</p>
              </button>

              <button
                type="button"
                onClick={() => setOptions({ ...options, docType: 'SOAL_WITH_KEY' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  options.docType === 'SOAL_WITH_KEY'
                    ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>📝 Soal + Kunci Jawaban</span>
                  {options.docType === 'SOAL_WITH_KEY' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <p className="text-[10px] opacity-80 mt-1">Lengkap dengan Kunci Jawaban & Pembahasan.</p>
              </button>

              <button
                type="button"
                onClick={() => setOptions({ ...options, docType: 'KEY_ONLY' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  options.docType === 'KEY_ONLY'
                    ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>🗝️ Kunci & Rubrik Saja</span>
                  {options.docType === 'KEY_ONLY' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <p className="text-[10px] opacity-80 mt-1">Tabel matriks Kunci Jawaban & Pembahasan.</p>
              </button>
            </div>
          </div>

          {/* 3. Parameter Kop & Header Ujian */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-amber-600" /> Header & Parameter Naskah Ujian:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Judul Naskah Ujian:
                </label>
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => setOptions({ ...options, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. PENILAIAN AKHIR SEMESTER (PAS)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Tahun Pelajaran:
                </label>
                <input
                  type="text"
                  value={options.tahunPelajaran}
                  onChange={(e) => setOptions({ ...options, tahunPelajaran: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 2025/2026"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Mata Pelajaran:
                </label>
                <input
                  type="text"
                  value={options.mapel}
                  onChange={(e) => setOptions({ ...options, mapel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Sosiologi"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Kelas / Semester:
                </label>
                <input
                  type="text"
                  value={options.kelas}
                  onChange={(e) => setOptions({ ...options, kelas: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. X / Ganjil"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Hari / Tanggal Ujian:
                </label>
                <input
                  type="text"
                  value={options.hariTanggal}
                  onChange={(e) => setOptions({ ...options, hariTanggal: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Senin, 10 Agustus 2026"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Alokasi Waktu:
                </label>
                <input
                  type="text"
                  value={options.alokasiWaktu}
                  onChange={(e) => setOptions({ ...options, alokasiWaktu: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 90 Menit"
                />
              </div>
            </div>
          </div>

          {/* 4. Lay-out & Structural Elements Checkboxes */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Settings className="w-4 h-4 text-emerald-600" /> Elemen Tata Letak Dokumen:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showKop}
                  onChange={(e) => setOptions({ ...options, showKop: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Kop Sekolah Resmi (Dinas & Double Line)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showIdentitasSiswa}
                  onChange={(e) => setOptions({ ...options, showIdentitasSiswa: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Tabel Identitas Siswa (Nama, NIS, Ttd)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showPetunjukUmum}
                  onChange={(e) => setOptions({ ...options, showPetunjukUmum: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Petunjuk Umum Ujian Nasional</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showSignature}
                  onChange={(e) => setOptions({ ...options, showSignature: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Lembar Tanda Tangan Guru & Kepsek</span>
              </label>
            </div>

            {/* Typography & Page Formatting */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Ukuran Kertas:
                </label>
                <select
                  value={options.pageSize}
                  onChange={(e) =>
                    setOptions({ ...options, pageSize: e.target.value as 'A4' | 'F4' })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-slate-800"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="F4">F4 / Folio (215 x 330 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Jenis Font:
                </label>
                <select
                  value={options.fontFamily}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      fontFamily: e.target.value as 'Times New Roman' | 'Calibri' | 'Arial',
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-slate-800"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Ukuran Font:
                </label>
                <select
                  value={options.fontSize}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      fontSize: e.target.value as '10pt' | '11pt' | '12pt',
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-slate-800"
                >
                  <option value="10pt">10 pt (Sedang)</option>
                  <option value="11pt">11 pt (Standar)</option>
                  <option value="12pt">12 pt (Besar)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Siap mengekspor <b className="text-blue-700 font-black">{questionsToExport.length} Soal</b>.
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Word (.doc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
