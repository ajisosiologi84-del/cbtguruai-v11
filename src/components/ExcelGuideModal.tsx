import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileText,
  Layers,
  Sparkles,
  Info,
  Check,
  Copy,
  Lightbulb,
} from 'lucide-react';

interface ExcelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: (type: 'pg' | 'mcma' | 'kategori' | 'gabungan') => void;
  onUploadClick: () => void;
}

export const ExcelGuideModal: React.FC<ExcelGuideModalProps> = ({
  isOpen,
  onClose,
  onDownloadTemplate,
  onUploadClick,
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'pg' | 'mcma' | 'kategori' | 'faq'>('flow');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySample = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(label);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[750px] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 flex justify-between items-center shrink-0 border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-widest">
                  Panduan Guru
                </span>
                <span className="text-emerald-300 text-xs font-semibold">• CBT Guru AI</span>
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-white mt-0.5">
                Panduan Lengkap Import Soal Excel
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-3 flex gap-1 sm:gap-2 overflow-x-auto shrink-0 custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('flow')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'flow'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" /> 1. Alur Impor Soal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pg')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'pg'
                ? 'bg-white text-blue-800 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-blue-600" /> PG Sederhana
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mcma')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'mcma'
                ? 'bg-white text-purple-800 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> PG Kompleks MCMA
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kategori')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'kategori'
                ? 'bg-white text-teal-800 border-teal-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" /> PG Kompleks Kategori
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-white text-amber-800 border-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-600" /> Tanya Jawab & Tips
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar bg-slate-50/50 space-y-6">
          {/* TAB 1: ALUR KERJA UMUM */}
          {activeTab === 'flow' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                  <b>Import Excel Soal CBT</b> memungkinkan Anda memasukkan puluhan hingga ratusan soal hanya dalam hitungan detik. Ikuti 3 langkah praktis di bawah ini untuk memulai!
                </div>
              </div>

              {/* Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all">
                  <div className="space-y-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                      1
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-600" /> Unduh Template
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pilih & unduh file format Excel (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold">.xlsx</code>) yang telah disediakan sesuai jenis soal (PG, MCMA, atau Kategori).
                    </p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onDownloadTemplate('gabungan')}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh Template Full
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-blue-300 transition-all">
                  <div className="space-y-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                      2
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" /> Isi Soal di Excel
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Buka file di Microsoft Excel / Google Sheets. Masukkan teks soal, opsi jawaban (A-E), kunci jawaban, dan pembahasan sesuai panduan kolom.
                    </p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-100 text-center text-[11px] font-bold text-blue-600">
                    Sesuai Format Kolom Standar
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition-all">
                  <div className="space-y-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                      3
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-purple-600" /> Upload File Excel
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Klik tombol <b>Upload Excel Soal</b>, pilih file Excel yang telah diisi, lalu klik Simpan untuk memasukkan seluruh soal ke Bank Soal CBT.
                    </p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onUploadClick();
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Excel Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* Template Quick Selection Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Pilih & Unduh Template Langsung:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => onDownloadTemplate('pg')}
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                        Single Choice
                      </span>
                      <p className="font-bold text-xs mt-1">PG Sederhana (A-E)</p>
                    </div>
                    <Download className="w-4 h-4 text-blue-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDownloadTemplate('mcma')}
                    className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-900 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
                        Multi Choice
                      </span>
                      <p className="font-bold text-xs mt-1">PG Kompleks MCMA</p>
                    </div>
                    <Download className="w-4 h-4 text-purple-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDownloadTemplate('kategori')}
                    className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 text-teal-900 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase bg-teal-200 text-teal-800 px-2 py-0.5 rounded">
                        Benar/Salah
                      </span>
                      <p className="font-bold text-xs mt-1">PG Kompleks Kategori</p>
                    </div>
                    <Download className="w-4 h-4 text-teal-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PILIHAN GANDA SEDERHANA */}
          {activeTab === 'pg' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 font-medium leading-relaxed">
                  <b>Pilihan Ganda Sederhana (PG)</b> adalah bentuk soal paling umum di mana siswa memilih <b>1 opsi jawaban bernilai benar</b> dari 5 pilihan yang tersedia (A, B, C, D, E).
                </div>
              </div>

              {/* Column Structure Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white px-4 py-3 font-extrabold text-xs flex justify-between items-center">
                  <span>STRUKTUR KOLOM EXCEL - PILIHAN GANDA SEDERHANA</span>
                  <span className="text-blue-300 font-normal text-[11px]">Bentuk_Soal: Pilihan Ganda</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-slate-700">
                        <th className="p-3">Nama Kolom Header</th>
                        <th className="p-3">Wajib?</th>
                        <th className="p-3">Contoh Isian Data</th>
                        <th className="p-3">Keterangan / Aturan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-700">Pertanyaan</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib</span></td>
                        <td className="p-3">Perubahan sosial terjadi karena...</td>
                        <td className="p-3 text-slate-600">Teks kalimat pertanyaan soal.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-700">Opsi_A - Opsi_E</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib (Min A-C)</span></td>
                        <td className="p-3">Globalisasi, Tradisi, Isolasi...</td>
                        <td className="p-3 text-slate-600">Pilihan jawaban dari A sampai E.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-700">Kunci_Jawaban</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib</span></td>
                        <td className="p-3 font-bold text-emerald-700">A</td>
                        <td className="p-3 text-slate-600">Tulis <b>1 huruf besar</b> saja: <code className="bg-emerald-100 text-emerald-900 px-1 font-bold">A</code>, <code className="bg-emerald-100 text-emerald-900 px-1 font-bold">B</code>, <code className="bg-emerald-100 text-emerald-900 px-1 font-bold">C</code>, <code className="bg-emerald-100 text-emerald-900 px-1 font-bold">D</code>, atau <code className="bg-emerald-100 text-emerald-900 px-1 font-bold">E</code>.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-700">Pembahasan</td>
                        <td className="p-3"><span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">Opsional</span></td>
                        <td className="p-3">Globalisasi memicu...</td>
                        <td className="p-3 text-slate-600">Penjelasan yang muncul saat evaluasi ujian.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-700">Mapel & Kompetensi</td>
                        <td className="p-3"><span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">Opsional</span></td>
                        <td className="p-3">Sosiologi | 3.1 Perubahan Sosial</td>
                        <td className="p-3 text-slate-600">Identitas mata pelajaran & KD.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Sample Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-extrabold text-xs text-slate-900">Contoh Baris Excel PG Sederhana:</h5>
                  <button
                    type="button"
                    onClick={() => handleCopySample('Perubahan sosial terjadi karena...\tGlobalisasi\tTradisi\tIsolasi\tStagnasi\tRegresi\tA\tGlobalisasi memicu perubahan\tSosiologi\t3.1\tPilihan Ganda', 'pg')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFormat === 'pg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedFormat === 'pg' ? 'Tersalin!' : 'Salin Contoh'}
                  </button>
                </div>
                <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre">
                  Pertanyaan | Opsi_A | Opsi_B | Opsi_C | Opsi_D | Opsi_E | Kunci_Jawaban | Bentuk_Soal{'\n'}
                  Perubahan sosial... | Globalisasi | Tradisi | Isolasi | Stagnasi | Regresi | A | Pilihan Ganda
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onDownloadTemplate('pg')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Template PG Sederhana (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PG KOMPLEKS MCMA */}
          {activeTab === 'mcma' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950 font-medium leading-relaxed">
                  <b>Pilihan Ganda Kompleks MCMA</b> *(Multiple Choice Multiple Answer)* memungkinkan pertanyaan memiliki <b>lebih dari 1 kunci jawaban benar</b> (misal 2 atau 3 kunci benar dari 5 opsi). Siswa harus mencentang semua jawaban benar untuk mendapatkan nilai penuh.
                </div>
              </div>

              {/* Rules Highlight */}
              <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-purple-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600" /> ATURAN KUNCI JAWABAN MCMA PADA EXCEL:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 space-y-1">
                    <p className="font-bold text-purple-950">1. Dipisahkan Tanda Koma (,)</p>
                    <p className="text-purple-800 text-[11px]">
                      Tuliskan semua huruf kunci benar yang dipisahkan koma tanpa spasi berlebih. Contoh: <code className="bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">A,C,E</code> atau <code className="bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">B,D</code>.
                    </p>
                  </div>
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 space-y-1">
                    <p className="font-bold text-purple-950">2. Bentuk Soal di Excel</p>
                    <p className="text-purple-800 text-[11px]">
                      Kolom <code className="bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">Bentuk_Soal</code> diisi dengan: <code className="bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">Pilihan Ganda Kompleks MCMA</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Column Structure Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-purple-950 text-white px-4 py-3 font-extrabold text-xs flex justify-between items-center">
                  <span>STRUKTUR KOLOM EXCEL - PG KOMPLEKS MCMA</span>
                  <span className="text-purple-300 font-normal text-[11px]">Bentuk_Soal: Pilihan Ganda Kompleks MCMA</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-slate-700">
                        <th className="p-3">Nama Kolom Header</th>
                        <th className="p-3">Wajib?</th>
                        <th className="p-3">Contoh Isian Data</th>
                        <th className="p-3">Keterangan / Aturan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr>
                        <td className="p-3 font-mono font-bold text-purple-700">Pertanyaan</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib</span></td>
                        <td className="p-3">Faktor internal perubahan sosial (Pilih &gt;1)...</td>
                        <td className="p-3 text-slate-600">Disarankan memberi petunjuk "(Pilih lebih dari satu)".</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-purple-700">Opsi_A - Opsi_E</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib (A-E)</span></td>
                        <td className="p-3">Inovasi, Bencana alam, Konflik, Perang...</td>
                        <td className="p-3 text-slate-600">Isi pilihan A sampai E seperti PG biasa.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-purple-700">Kunci_Jawaban</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib</span></td>
                        <td className="p-3 font-bold text-purple-700">A,C,E</td>
                        <td className="p-3 text-slate-600">Daftar semua opsi benar yang dipisah koma (misal: <code className="bg-purple-100 text-purple-900 font-bold px-1">A,C,E</code>).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onDownloadTemplate('mcma')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Template PG Kompleks MCMA (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PG KOMPLEKS KATEGORI */}
          {activeTab === 'kategori' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-950 font-medium leading-relaxed">
                  <b>Pilihan Ganda Kompleks Kategori</b> disajikan dengan stimulus soal, <b>4 s/d 5 butir pernyataan</b> di kolom <code className="bg-teal-100 font-bold px-1 font-mono text-teal-900">Opsi_A / Pernyataan_1</code> sampai <code className="bg-teal-100 font-bold px-1 font-mono text-teal-900">Opsi_D / Pernyataan_4</code>, dan kunci jawaban kategori di kolom <code className="bg-teal-100 font-bold px-1 font-mono text-teal-900">Kunci Jawaban</code> (contoh: <b>Sesuai / Tidak Sesuai</b>, <b>Tepat / Tidak Tepat</b>, <b>Benar / Salah</b>, atau <b>Fakta / Miskonsepsi</b>).
                </div>
              </div>

              {/* Detailed Column Format */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-teal-950 text-white px-4 py-3 font-extrabold text-xs flex justify-between items-center">
                  <span>STRUKTUR KOLOM EXCEL - PG KOMPLEKS KATEGORI</span>
                  <span className="text-teal-300 font-normal text-[11px]">Bentuk Soal: Pilihan Ganda Kompleks Kategori</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-slate-700">
                        <th className="p-3">Nama Kolom Header Excel</th>
                        <th className="p-3">Wajib?</th>
                        <th className="p-3">Contoh Isian Data Excel</th>
                        <th className="p-3">Penjelasan & Format</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr>
                        <td className="p-3 font-mono font-bold text-teal-700">No Soal & Kompetensi</td>
                        <td className="p-3"><span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">Opsional</span></td>
                        <td className="p-3">1 | Menganalisis fenomena sosial...</td>
                        <td className="p-3 text-slate-600">Nomor urut & deskripsi KD/Topik.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-teal-700">Bentuk Soal</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib</span></td>
                        <td className="p-3 font-bold text-teal-900">Pilihan Ganda Kompleks Kategori</td>
                        <td className="p-3 text-slate-600">Nama tipe soal untuk deteksi otomatis parser.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-teal-700">Soal (Stimulus + Pertanyaan)</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib</span></td>
                        <td className="p-3">Sebuah desa yang dikenal dengan kerajinan kain tenun... Berikan respon/pilihan Anda pada masing-masing pernyataan...</td>
                        <td className="p-3 text-slate-600">Stimulus berupa narasi/kasus dan instruksi utama soal.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-teal-700">Opsi_A / Pernyataan_1 s/d Pernyataan_4</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib (Min 2)</span></td>
                        <td className="p-3 font-mono text-[11px] text-teal-900">
                          A. Gerakan pemuda merupakan wujud sikap kritis...<br/>
                          B. Memasarkan kain tenun melalui media sosial...
                        </td>
                        <td className="p-3 text-slate-600">
                          Tuliskan butir pernyataan 1, 2, 3, 4 pada kolom masing-masing (<code className="bg-teal-100 font-bold px-1 text-teal-900">Opsi_A / Pernyataan_1</code>, dst).
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-teal-700">Kunci Jawaban</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Wajib</span></td>
                        <td className="p-3 font-mono font-bold text-emerald-700 whitespace-pre-line">
                          Pernyataan 1: Sesuai{'\n'}Pernyataan 2: Tidak Sesuai{'\n'}Pernyataan 3: Sesuai{'\n'}Pernyataan 4: Tidak Sesuai
                        </td>
                        <td className="p-3 text-slate-600">
                          Tulis status kategori tiap pernyataan per baris. Kategori otomatis dibaca oleh sistem (misal: Sesuai/Tidak Sesuai, Tepat/Tidak Tepat, Benar/Salah, Fakta/Miskonsepsi).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Format Copy Sample */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-extrabold text-xs text-slate-900">Contoh Format Kunci Jawaban per Baris pada Excel:</h5>
                  <button
                    type="button"
                    onClick={() => handleCopySample("Pernyataan 1: Sesuai\nPernyataan 2: Tidak Sesuai\nPernyataan 3: Sesuai\nPernyataan 4: Tidak Sesuai", 'kat')}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFormat === 'kat' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedFormat === 'kat' ? 'Tersalin!' : 'Salin Contoh'}
                  </button>
                </div>
                <div className="bg-slate-900 text-teal-300 p-3 rounded-xl text-[11px] font-mono whitespace-pre-line">
                  Pernyataan 1: Sesuai{'\n'}Pernyataan 2: Tidak Sesuai{'\n'}Pernyataan 3: Sesuai{'\n'}Pernyataan 4: Tidak Sesuai
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onDownloadTemplate('kategori')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Template Kategori Sesuai Excel (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: FAQ & TIPS IMPOR */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 font-medium leading-relaxed">
                  <b>Tanya Jawab & Troubleshooting Import Excel:</b> Jawaban untuk pertanyaan umum seputar penulisan dan kendala impor file Excel ke dalam sistem CBT.
                </div>
              </div>

              <div className="space-y-3">
                {/* FAQ 1 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">Q</span>
                    Bagaimana jika soal mengandung gambar atau grafik?
                  </h5>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    Anda dapat memasukkan URL gambar yang valid pada kolom <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">Gambar</code> di file Excel (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">https://.../gambar.png</code>), atau menambahkan gambar secara langsung melalui tombol <b>Edit Soal</b> di aplikasi setelah proses impor selesai.
                  </p>
                </div>

                {/* FAQ 2 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">Q</span>
                    Apakah pilihan jawaban harus selalu 5 (A sampai E)?
                  </h5>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    Minimal diisi 3 opsi (Opsi A, B, C). Jika Anda mengosongkan Opsi D & E pada Excel, sistem akan otomatis menyesuaikannya menjadi 3 atau 4 pilihan jawaban untuk soal tersebut.
                  </p>
                </div>

                {/* FAQ 3 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">Q</span>
                    Mengapa pesan error "Kunci jawaban tidak valid" muncul saat import?
                  </h5>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    Pastikan huruf kunci pada Excel sesuai dengan opsi yang tersedia (misal huruf kapital A, B, C, D, E). Untuk MCMA gunakan koma (misal: <code className="bg-slate-100 font-bold px-1">A,C</code>) dan tidak menggunakan simbol lain.
                  </p>
                </div>

                {/* FAQ 4 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">Q</span>
                    Apakah saya bisa menggabungkan PG, MCMA, dan Kategori dalam 1 file Excel?
                  </h5>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    <b>Ya, Sangat Bisa!</b> Anda dapat mengunduh <b>Template All (Gabungan)</b>. Sistem parser CBT kami akan mendeteksi tipe soal masing-masing secara otomatis berdasarkan nilai kolom <code className="bg-slate-100 font-bold px-1">Bentuk_Soal</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            Butuh bantuan lain? Unduh template resmi untuk melihat contoh nyata.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer w-full sm:w-auto text-center"
            >
              Tutup Panduan
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onUploadClick();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto active:scale-95"
            >
              <Upload className="w-4 h-4" /> Upload Excel Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
