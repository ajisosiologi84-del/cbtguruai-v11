import React, { useState, useRef } from 'react';
import { Question } from '../types';
import {
  X,
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Database,
  Eye,
  FileText
} from 'lucide-react';

interface JsonQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allQuestions: Question[];
  filteredQuestions: Question[];
  currentMapel: string;
  currentKodeGuru: string;
  activeTeacherName?: string;
  onImportQuestions: (importedQuestions: Question[], mode: 'merge' | 'replace') => void;
  showAlert: (msg: string) => void;
  showConfirm: (title: string, msg: string, onConfirm: () => void, isDanger?: boolean) => void;
}

export const JsonQuestionsModal: React.FC<JsonQuestionsModalProps> = ({
  isOpen,
  onClose,
  allQuestions,
  filteredQuestions,
  currentMapel,
  currentKodeGuru,
  activeTeacherName,
  onImportQuestions,
  showAlert,
  showConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [includeImages, setIncludeImages] = useState(true);
  const [previewJson, setPreviewJson] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedImport, setParsedImport] = useState<{
    questions: Question[];
    metadata?: any;
    filename?: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  if (!isOpen) return null;

  const targetQuestionsToExport = exportScope === 'filtered' ? filteredQuestions : allQuestions;
  const questionsWithImagesCount = targetQuestionsToExport.filter((q) => !!q.image).length;

  const handleGenerateAndDownloadJson = () => {
    try {
      const cleanQuestions = targetQuestionsToExport.map((q, idx) => ({
        id: q.id || idx + 1,
        kodeGuru: q.kodeGuru || currentKodeGuru,
        mapel: q.mapel || currentMapel,
        kompetensi: q.kompetensi || q.subTopik || '',
        subTopik: q.subTopik || '',
        bentukSoal: q.bentukSoal || 'Pilihan Ganda',
        poin: q.poin || 10,
        question: q.question,
        image: includeImages ? (q.image || null) : null,
        options: q.options || [],
        explanation: q.explanation || '',
        categoryOptions: q.categoryOptions || undefined,
        categoryStatements: q.categoryStatements || undefined,
        isActive: q.isActive !== false,
      }));

      const payload = {
        format: 'CBT_GURU_BANK_SOAL_JSON_FULL',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        author: activeTeacherName || currentKodeGuru,
        kodeGuru: currentKodeGuru,
        mapel: currentMapel,
        totalQuestions: cleanQuestions.length,
        hasImages: includeImages && questionsWithImagesCount > 0,
        questions: cleanQuestions,
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
      const mapelClean = currentMapel.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `BANK_SOAL_${currentKodeGuru}_${mapelClean}_${dateStr}_${timeStr}.json`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert(`Sukses mengunduh ${cleanQuestions.length} butir Bank Soal versi JSON Lengkap (+ Gambar)!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal mengunduh file JSON: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        let extracted: any[] = [];
        if (Array.isArray(parsed)) {
          extracted = parsed;
        } else if (parsed && Array.isArray(parsed.questions)) {
          extracted = parsed.questions;
        } else {
          showAlert('Format JSON tidak valid! File harus memuat array butir soal.');
          return;
        }

        if (extracted.length === 0) {
          showAlert('File JSON tidak berisi butir soal.');
          return;
        }

        // Validate basic fields
        const validQuestions: Question[] = extracted.map((q: any, idx: number) => ({
          id: typeof q.id === 'number' ? q.id : idx + 1,
          question: String(q.question || q.pertanyaan || 'Pertanyaan Kosong'),
          options: Array.isArray(q.options)
            ? q.options.map((opt: any, oIdx: number) => ({
                id: opt.id || String.fromCharCode(65 + oIdx),
                text: String(opt.text || opt.teks || '-'),
                isCorrect: Boolean(opt.isCorrect || opt.benar),
              }))
            : [
                { id: 'A', text: String(q.opsiA || '-'), isCorrect: q.kunci === 'A' },
                { id: 'B', text: String(q.opsiB || '-'), isCorrect: q.kunci === 'B' },
                { id: 'C', text: String(q.opsiC || '-'), isCorrect: q.kunci === 'C' },
                { id: 'D', text: String(q.opsiD || '-'), isCorrect: q.kunci === 'D' },
                { id: 'E', text: String(q.opsiE || '-'), isCorrect: q.kunci === 'E' },
              ],
          explanation: String(q.explanation || q.pembahasan || ''),
          image: q.image || q.gambar || undefined,
          mapel: q.mapel || currentMapel,
          kompetensi: q.kompetensi || q.subTopik || undefined,
          subTopik: q.subTopik || undefined,
          bentukSoal: q.bentukSoal || 'Pilihan Ganda',
          poin: typeof q.poin === 'number' ? q.poin : 10,
          kodeGuru: q.kodeGuru || currentKodeGuru,
          isActive: q.isActive !== false,
          categoryOptions: q.categoryOptions,
          categoryStatements: q.categoryStatements,
        }));

        setParsedImport({
          questions: validQuestions,
          metadata: parsed.metadata || { author: parsed.author, exportedAt: parsed.exportedAt },
          filename: file.name,
        });

        showAlert(`Berhasil membaca file JSON "${file.name}" dengan ${validQuestions.length} butir soal!`);
      } catch (err: any) {
        console.error(err);
        showAlert('Gagal memproses file JSON. Pastikan file tidak korup: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!parsedImport || parsedImport.questions.length === 0) return;

    showConfirm(
      importMode === 'replace' ? 'Timpa Seluruh Bank Soal?' : 'Gabungkan Soal ke Bank Soal?',
      importMode === 'replace'
        ? `Apakah Anda yakin ingin mengganti bank soal yang ada dengan ${parsedImport.questions.length} butir soal dari file ini?`
        : `Sistem akan menambahkan ${parsedImport.questions.length} butir soal baru ke Bank Soal. Lanjutkan?`,
      () => {
        onImportQuestions(parsedImport.questions, importMode);
        onClose();
      },
      importMode === 'replace'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <FileJson className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                Bank Soal Format JSON (+ Gambar)
                <span className="bg-blue-500/30 text-blue-100 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-blue-400/40">
                  Full Asset
                </span>
              </h3>
              <p className="text-xs text-blue-100/90 font-medium">
                Download & Impor bank soal terstruktur lengkap dengan gambar base64/URL dan metadata
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

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 pt-3 border-b border-slate-200 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-blue-800 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            Download JSON Lengkap
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-blue-800 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            Impor File JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-950 space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" /> Informasi Data yang Akan Dieksport:
                </h4>
                <p className="text-xs text-blue-900">
                  Mata Pelajaran: <b>{currentMapel}</b> | Akun Guru: <b>{activeTeacherName || currentKodeGuru}</b> ({currentKodeGuru})
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Pilih Cakupan Soal:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setExportScope('filtered')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      exportScope === 'filtered'
                        ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs">Soal Terfilter / Akun Aktif</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      {filteredQuestions.length} Soal
                    </span>
                  </div>

                  <div
                    onClick={() => setExportScope('all')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      exportScope === 'all'
                        ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs">Semua Soal di Bank Soal</span>
                    <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                      {allQuestions.length} Soal
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Sertakan Gambar & Grafik Soal</span>
                    <span className="text-[11px] text-slate-500">
                      Menyimpan gambar format Base64 / URL langsung di dalam file JSON.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="w-4.5 h-4.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-900 text-slate-300 p-3.5 rounded-2xl text-[11px] space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>File Output:</span>
                  <span className="text-blue-300 font-bold">.json (Clean Readable Indented)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Jumlah Soal Bergambar:</span>
                  <span className="text-emerald-400 font-bold">{questionsWithImagesCount} Soal</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-blue-100 rounded-full text-blue-700">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-bold text-xs text-blue-900">
                  Klik untuk Memilih File Bank Soal (.json)
                </span>
                <span className="text-[11px] text-slate-500">
                  Mendukung file JSON hasil download dari sistem CBT ini
                </span>
              </div>

              {parsedImport && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>File Terbaca: <b>{parsedImport.filename}</b></span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Ditemukan <b>{parsedImport.questions.length} butir soal</b> siap untuk diimpor.
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-emerald-200">
                    <label className="block text-xs font-bold text-slate-800">Metode Impor:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                          importMode === 'merge'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Gabungkan (Merge)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                          importMode === 'replace'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Timpa Seluruhnya (Replace)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Batal
          </button>
          {activeTab === 'export' ? (
            <button
              type="button"
              onClick={handleGenerateAndDownloadJson}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" /> Download File JSON Sekarang
            </button>
          ) : (
            <button
              type="button"
              disabled={!parsedImport}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Terapkan & Impor ke Bank Soal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
