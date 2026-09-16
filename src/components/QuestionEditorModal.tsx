import React, { useState, useEffect } from 'react';
import { Question, Option } from '../types';
import { formatQuestionText } from '../utils/questionFormatter';
import { Edit3, PlusCircle, CheckCircle2, Save, X, Image as ImageIcon, Upload, Trash2, Table, Link as LinkIcon, FileImage, Eye, Sparkles, Tag } from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  editingQuestion: Question | null;
  mapelList?: string[];
  defaultMapel?: string;
  defaultKodeGuru?: string;
  onSave: (questionData: {
    question: string;
    options: Option[];
    explanation: string;
    image?: string;
    mapel?: string;
    kompetensi?: string;
    subTopik?: string;
    bentukSoal?: string;
    kodeGuru?: string;
    poin?: number;
    id?: number;
    categoryOptions?: string[];
    categoryStatements?: { id: string; statement: string; correctCategory: string }[];
  }) => void;
  onClose: () => void;
  showAlert: (msg: string) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  editingQuestion,
  mapelList = ['Sosiologi', 'Geografi', 'Ekonomi', 'Sejarah', 'Bahasa Indonesia', 'Bahasa Inggris', 'Matematika'],
  defaultMapel = 'Sosiologi',
  defaultKodeGuru = 'GURU01',
  onSave,
  onClose,
  showAlert,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [selectedMapel, setSelectedMapel] = useState<string>(defaultMapel);
  const [kompetensiText, setKompetensiText] = useState<string>('');
  const [subTopikText, setSubTopikText] = useState<string>('');
  const [bentukSoalText, setBentukSoalText] = useState<string>('Pilihan Ganda');
  const [kodeGuruText, setKodeGuruText] = useState<string>(defaultKodeGuru);
  const [poinVal, setPoinVal] = useState<number>(10);
  const [imageString, setImageString] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [optionsText, setOptionsText] = useState<string[]>(['', '', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [mcmaCorrectIndices, setMcmaCorrectIndices] = useState<number[]>([0]);
  const [categoryOptionsList, setCategoryOptionsList] = useState<string[]>(['Benar', 'Salah']);
  const [categoryStatementsList, setCategoryStatementsList] = useState<{ id: string; statement: string; correctCategory: string }[]>([
    { id: '1', statement: '', correctCategory: 'Benar' },
    { id: '2', statement: '', correctCategory: 'Salah' },
  ]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const labels = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    setActiveTab('editor');
    if (editingQuestion) {
      setQuestionText(editingQuestion.question);
      setExplanationText(editingQuestion.explanation || '');
      setSelectedMapel(editingQuestion.mapel || defaultMapel);
      const komp = editingQuestion.kompetensi || editingQuestion.subTopik || '';
      setKompetensiText(komp);
      setSubTopikText(komp);
      
      const bentuk = editingQuestion.bentukSoal || 'Pilihan Ganda';
      setBentukSoalText(bentuk);
      setKodeGuruText(editingQuestion.kodeGuru || defaultKodeGuru || 'GURU01');
      setPoinVal(typeof editingQuestion.poin === 'number' && editingQuestion.poin > 0 ? editingQuestion.poin : 10);
      setImageString(editingQuestion.image || '');
      setImageUrlInput(editingQuestion.image && !editingQuestion.image.startsWith('data:') ? editingQuestion.image : '');

      const optTexts = labels.map((label, idx) => {
        const found = editingQuestion.options?.find(o => o.id === label) || editingQuestion.options?.[idx];
        return found ? found.text : '';
      });
      setOptionsText(optTexts);

      const correctIndices = (editingQuestion.options || [])
        .map((o, idx) => (o.isCorrect ? idx : -1))
        .filter((idx) => idx >= 0);
      
      setCorrectIndex(correctIndices.length > 0 ? correctIndices[0] : 0);
      setMcmaCorrectIndices(correctIndices.length > 0 ? correctIndices : [0]);

      if (editingQuestion.categoryOptions && editingQuestion.categoryOptions.length > 0) {
        setCategoryOptionsList(editingQuestion.categoryOptions);
      } else {
        setCategoryOptionsList(['Benar', 'Salah']);
      }

      if (editingQuestion.categoryStatements && editingQuestion.categoryStatements.length > 0) {
        setCategoryStatementsList(editingQuestion.categoryStatements);
      } else {
        setCategoryStatementsList([
          { id: '1', statement: '', correctCategory: 'Benar' },
          { id: '2', statement: '', correctCategory: 'Salah' },
        ]);
      }
    } else {
      setQuestionText('');
      setExplanationText('');
      setSelectedMapel(defaultMapel);
      setKompetensiText('');
      setSubTopikText('');
      setBentukSoalText('Pilihan Ganda');
      setKodeGuruText(defaultKodeGuru || 'GURU01');
      setPoinVal(10);
      setImageString('');
      setImageUrlInput('');
      setOptionsText(['', '', '', '', '']);
      setCorrectIndex(0);
      setMcmaCorrectIndices([0]);
      setCategoryOptionsList(['Benar', 'Salah']);
      setCategoryStatementsList([
        { id: '1', statement: '', correctCategory: 'Benar' },
        { id: '2', statement: '', correctCategory: 'Salah' },
      ]);
    }
  }, [editingQuestion, isOpen, defaultMapel, defaultKodeGuru]);

  if (!isOpen) return null;

  const handleToggleMcmaIndex = (idx: number) => {
    setMcmaCorrectIndices((prev) => {
      if (prev.includes(idx)) {
        if (prev.length <= 1) return prev; // At least 1 must be correct
        return prev.filter((i) => i !== idx);
      } else {
        return [...prev, idx].sort((a, b) => a - b);
      }
    });
  };

  const handleAddCategoryStatement = () => {
    setCategoryStatementsList((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        statement: '',
        correctCategory: categoryOptionsList[0] || 'Benar',
      },
    ]);
  };

  const handleRemoveCategoryStatement = (index: number) => {
    if (categoryStatementsList.length <= 1) {
      showAlert('Minimal harus ada 1 pernyataan!');
      return;
    }
    setCategoryStatementsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Format file harus berupa gambar (JPG, PNG, GIF, WEBP)!');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showAlert('Ukuran file gambar terlalu besar (Maksimal 8 MB)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (rawResult) {
        // Compress and resize image using HTML5 canvas
        const img = new Image();
        img.onload = () => {
          const maxDim = 900;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setImageString(compressed);
          } else {
            setImageString(rawResult);
          }
          showAlert('Gambar/tabel berhasil diunggah!');
        };
        img.onerror = () => {
          setImageString(rawResult);
          showAlert('Gambar/tabel berhasil diunggah!');
        };
        img.src = rawResult;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertTableTemplate = () => {
    const tableHtml = `
<table class="w-full border-collapse border border-slate-300 my-3 text-xs sm:text-sm">
  <thead>
    <tr class="bg-slate-100 font-bold text-slate-800">
      <th class="border border-slate-300 p-2 text-center">No</th>
      <th class="border border-slate-300 p-2 text-left">Faktor / Kategori</th>
      <th class="border border-slate-300 p-2 text-left">Keterangan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 p-2 text-center">1</td>
      <td class="border border-slate-300 p-2">Faktor Internal</td>
      <td class="border border-slate-300 p-2">Penemuan baru, konflik sosial</td>
    </tr>
    <tr>
      <td class="border border-slate-300 p-2 text-center">2</td>
      <td class="border border-slate-300 p-2">Faktor Eksternal</td>
      <td class="border border-slate-300 p-2">Pengaruh budaya asing, bencana alam</td>
    </tr>
  </tbody>
</table>
`.trim();

    setQuestionText((prev) => prev ? `${prev}\n\n${tableHtml}` : tableHtml);
    showAlert('Format Tabel HTML berhasil disisipkan ke dalam teks pertanyaan!');
  };

  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) {
      showAlert('Masukkan URL gambar yang valid!');
      return;
    }
    setImageString(imageUrlInput.trim());
    setShowUrlInput(false);
    showAlert('URL gambar diterapkan!');
  };

  const handleSave = () => {
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion) {
      showAlert('Teks pertanyaan tidak boleh kosong!');
      return;
    }

    const bentukLower = bentukSoalText.toLowerCase();

    // 1. Handling Pilihan Ganda Kompleks Kategori
    if (bentukLower.includes('kategori')) {
      if (categoryStatementsList.length === 0) {
        showAlert('Tambahkan minimal 1 pernyataan untuk soal Kategori!');
        return;
      }
      for (let i = 0; i < categoryStatementsList.length; i++) {
        if (!categoryStatementsList[i].statement.trim()) {
          showAlert(`Pernyataan #${i + 1} tidak boleh kosong!`);
          return;
        }
      }

      onSave({
        id: editingQuestion?.id,
        question: formatQuestionText(trimmedQuestion),
        options: [],
        explanation: explanationText.trim() || 'Tidak ada pembahasan.',
        image: imageString.trim() || undefined,
        mapel: selectedMapel,
        kompetensi: kompetensiText.trim() || subTopikText.trim() || undefined,
        subTopik: subTopikText.trim() || kompetensiText.trim() || undefined,
        bentukSoal: 'Pilihan Ganda Kompleks Kategori',
        kodeGuru: kodeGuruText.trim().toUpperCase() || defaultKodeGuru || 'GURU01',
        poin: poinVal,
        categoryOptions: categoryOptionsList,
        categoryStatements: categoryStatementsList.map((st, idx) => ({
          id: String(idx + 1),
          statement: st.statement.trim(),
          correctCategory: st.correctCategory,
        })),
      });
      return;
    }

    // 2. Handling PG Sederhana and MCMA
    for (let i = 0; i < 5; i++) {
      if (!optionsText[i].trim()) {
        showAlert(`Pilihan ${labels[i]} tidak boleh kosong!`);
        return;
      }
    }

    let isMcma = bentukLower.includes('mcma') || (bentukLower.includes('kompleks') && !bentukLower.includes('kategori'));
    
    if (isMcma && mcmaCorrectIndices.length === 0) {
      showAlert('Pilih minimal 1 kunci jawaban benar untuk soal MCMA!');
      return;
    }

    const options: Option[] = labels.map((label, i) => ({
      id: label,
      text: optionsText[i].trim(),
      isCorrect: isMcma ? mcmaCorrectIndices.includes(i) : i === correctIndex,
    }));

    onSave({
      id: editingQuestion?.id,
      question: formatQuestionText(trimmedQuestion),
      options,
      explanation: explanationText.trim() || 'Tidak ada pembahasan.',
      image: imageString.trim() || undefined,
      mapel: selectedMapel,
      kompetensi: kompetensiText.trim() || subTopikText.trim() || undefined,
      subTopik: subTopikText.trim() || kompetensiText.trim() || undefined,
      bentukSoal: isMcma ? 'Pilihan Ganda Kompleks MCMA' : 'Pilihan Ganda',
      kodeGuru: kodeGuruText.trim().toUpperCase() || defaultKodeGuru || 'GURU01',
      poin: poinVal,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 text-white p-4 sm:p-5 font-bold text-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <span className="flex items-center gap-2">
            {editingQuestion ? <Edit3 className="w-5 h-5 text-sky-400" /> : <PlusCircle className="w-5 h-5 text-sky-400" />}
            {editingQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}
          </span>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Form Input
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview Live
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {activeTab === 'editor' ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* 1. Mata Pelajaran */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-sky-500 focus:outline-none text-xs font-bold bg-white cursor-pointer"
                >
                  {mapelList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Kompetensi / Sub Topik */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Kompetensi / KD</span>
                </label>
                <input
                  type="text"
                  value={kompetensiText}
                  onChange={(e) => {
                    setKompetensiText(e.target.value);
                    setSubTopikText(e.target.value);
                  }}
                  placeholder="e.g. 3.1 Perubahan Sosial"
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-sky-500 focus:outline-none text-xs font-semibold bg-white"
                />
              </div>

              {/* 3. Bentuk Soal */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Bentuk Soal <span className="text-red-500">*</span>
                </label>
                <select
                  value={bentukSoalText}
                  onChange={(e) => setBentukSoalText(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-purple-500 focus:outline-none text-xs font-bold bg-white cursor-pointer"
                >
                  <option value="Pilihan Ganda">Pilihan Ganda (PG Sederhana)</option>
                  <option value="Pilihan Ganda Kompleks MCMA">Pilihan Ganda Kompleks MCMA (Ganda / Pilih Banyak)</option>
                  <option value="Pilihan Ganda Kompleks Kategori">Pilihan Ganda Kompleks Kategori (Benar/Salah / Ya/Tidak)</option>
                  <option value="Menjodohkan">Menjodohkan</option>
                  <option value="Isian Singkat">Isian Singkat</option>
                  <option value="Uraian">Uraian / Essay</option>
                </select>
              </div>

              {/* 4. Kode Guru */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Kode Guru</span>
                </label>
                <input
                  type="text"
                  value={kodeGuruText}
                  onChange={(e) => setKodeGuruText(e.target.value.toUpperCase())}
                  placeholder="Contoh: GURU01"
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-xs font-bold bg-white uppercase tracking-wider"
                />
              </div>

              {/* 5. Bobot Poin Soal */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Bobot Poin</span>
                  <span className="text-emerald-600 font-extrabold text-[11px]">(Maks Skor 100)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={poinVal}
                  onChange={(e) => setPoinVal(Math.max(1, Number(e.target.value) || 1))}
                  placeholder="10"
                  className="w-full border-2 border-emerald-300 focus:border-emerald-500 rounded-xl p-2.5 font-bold text-xs bg-emerald-50/30 text-emerald-950 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-bold text-gray-800 text-sm">
                  Teks Pertanyaan <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleInsertTableTemplate}
                  className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Sisipkan struktur tabel HTML ke teks pertanyaan"
                >
                  <Table className="w-3.5 h-3.5 text-sky-600" /> Sisipkan Tabel HTML
                </button>
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 h-28 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
                placeholder="Masukkan teks pertanyaan lengkap..."
              />
            </div>

            {/* MENU TAMBAH GAMBAR / TABEL (JPG/PNG) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-600" /> Lampiran Gambar / Tabel / Diagram Soal (JPG / PNG)
                </label>
                {imageString && (
                  <button
                    type="button"
                    onClick={() => setImageString('')}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-red-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Gambar
                  </button>
                )}
              </div>

              {imageString ? (
                <div className="relative group bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center">
                  <img
                    src={imageString}
                    alt="Lampiran Soal"
                    className="max-h-56 w-auto object-contain rounded-lg border border-slate-100 shadow-xs mb-2"
                  />
                  <span className="text-[11px] text-slate-500 font-semibold">
                    ✓ Gambar terlampir dan akan ditampilkan pada soal
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 transition-all rounded-xl p-4 text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600">
                      <div className="p-2.5 bg-sky-100 text-sky-600 rounded-full">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-xs text-slate-800">
                        Klik atau Drag & Drop Gambar / Tabel di sini
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Mendukung format <b>JPG, PNG, WEBP, GIF</b> (Maksimal 8 MB)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> {showUrlInput ? 'Sembunyikan Input URL' : 'Atau gunakan URL Link Gambar'}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="flex gap-2 pt-1 animate-fade-in">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/gambar-soal.png"
                        className="flex-1 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* EDITOR JAWABAN SESUAI BENTUK SOAL */}
            {bentukSoalText.toLowerCase().includes('kategori') ? (
              /* EDITOR SOAL KATEGORI (BENAR / SALAH) */
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <label className="block font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" /> Pengaturan Kategori & Pernyataan
                    </label>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">
                      Siswa akan memilih satu opsi kategori untuk setiap pernyataan di bawah ini.
                    </p>
                  </div>

                  {/* Preset Kategori */}
                  <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setCategoryOptionsList(['Benar', 'Salah'])}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        categoryOptionsList.join(',') === 'Benar,Salah'
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      Benar / Salah
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryOptionsList(['Ya', 'Tidak'])}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        categoryOptionsList.join(',') === 'Ya,Tidak'
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      Ya / Tidak
                    </button>
                  </div>
                </div>

                {/* List Pernyataan & Kunci Jawaban */}
                <div className="space-y-3">
                  {categoryStatementsList.map((st, idx) => (
                    <div key={st.id || idx} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <span className="font-extrabold text-xs text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={st.statement}
                        onChange={(e) => {
                          const updated = [...categoryStatementsList];
                          updated[idx].statement = e.target.value;
                          setCategoryStatementsList(updated);
                        }}
                        placeholder={`Tuliskan teks pernyataan #${idx + 1}...`}
                        className="flex-1 border-2 border-slate-200 rounded-xl p-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none bg-white w-full"
                      />
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span className="text-[11px] font-bold text-slate-500">Kunci:</span>
                        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          {categoryOptionsList.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const updated = [...categoryStatementsList];
                                updated[idx].correctCategory = opt;
                                setCategoryStatementsList(updated);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                st.correctCategory === opt
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryStatement(idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Pernyataan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddCategoryStatement}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" /> Tambah Pernyataan Baru
                </button>
              </div>
            ) : bentukSoalText.toLowerCase().includes('mcma') || bentukSoalText.toLowerCase().includes('kompleks') ? (
              /* EDITOR MCMA (MULTIPLE CHOICE MULTIPLE ANSWER) */
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block font-extrabold text-purple-950 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" /> Pilihan Jawaban MCMA (Pilihan Ganda Kompleks)
                  </label>
                  <span className="bg-purple-200 text-purple-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                    Centang Semua Jawaban Benar
                  </span>
                </div>
                <p className="text-xs text-purple-700 font-medium">
                  Siswa dapat memilih lebih dari satu jawaban benar. Tandai <b className="text-purple-900">☑️ Checkbox</b> pada setiap opsi yang bernilai benar.
                </p>

                <div className="space-y-3">
                  {labels.map((label, idx) => {
                    const isChecked = mcmaCorrectIndices.includes(idx);
                    return (
                      <div key={label} className="flex items-start gap-3">
                        <div className="mt-2.5 flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMcmaIndex(idx)}
                            className="w-5 h-5 cursor-pointer text-purple-600 rounded-md focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex-1 relative">
                          <div className="absolute left-3 top-2.5 font-bold text-gray-400 text-sm">
                            {label}.
                          </div>
                          <input
                            type="text"
                            value={optionsText[idx]}
                            onChange={(e) => {
                              const newOpts = [...optionsText];
                              newOpts[idx] = e.target.value;
                              setOptionsText(newOpts);
                            }}
                            className={`w-full border-2 rounded-xl py-2 pl-9 pr-3 focus:outline-none text-sm bg-white ${
                              isChecked ? 'border-purple-400 font-bold bg-purple-50/30' : 'border-gray-200'
                            }`}
                            placeholder={`Masukkan pilihan ${label}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* EDITOR PG SEDERHANA */
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-gray-800 text-sm flex items-center gap-2">
                  Pilihan Jawaban (Tandai <CheckCircle2 className="w-4 h-4 text-emerald-500" /> pada jawaban yang benar)
                </label>

                <div className="space-y-3">
                  {labels.map((label, idx) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-2.5 flex items-center">
                        <input
                          type="radio"
                          name="q-edit-correct"
                          checked={correctIndex === idx}
                          onChange={() => setCorrectIndex(idx)}
                          className="w-5 h-5 cursor-pointer text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <div className="absolute left-3 top-2.5 font-bold text-gray-400 text-sm">
                          {label}.
                        </div>
                        <input
                          type="text"
                          value={optionsText[idx]}
                          onChange={(e) => {
                            const newOpts = [...optionsText];
                            newOpts[idx] = e.target.value;
                            setOptionsText(newOpts);
                          }}
                          className="w-full border-2 border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:border-blue-500 focus:outline-none text-sm bg-white"
                          placeholder={`Masukkan pilihan ${label}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-800 mb-2 text-sm">
                Pembahasan Ilmiah (Analisis HOTS)
              </label>
              <textarea
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 h-24 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
                placeholder="Masukkan penjelasan mengapa jawaban tersebut benar..."
              />
            </div>
          </div>
        ) : (
          /* TAB PREVIEW LIVE */
          <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar bg-slate-100/60">
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-xs text-sky-900 font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Berikut adalah simulasi tampilan soal yang akan dilihat siswa saat ujian:</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-sky-100 text-sky-800 text-xs font-extrabold px-3 py-1 rounded-lg border border-sky-200">
                Mata Pelajaran: {selectedMapel}
              </span>
              <span className="bg-purple-100 text-purple-900 text-xs font-extrabold px-3 py-1 rounded-lg border border-purple-200">
                Bentuk Soal: {bentukSoalText}
              </span>
              {(kompetensiText.trim() || subTopikText.trim()) && (
                <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-600" /> Kompetensi: {kompetensiText.trim() || subTopikText.trim()}
                </span>
              )}
              {kodeGuruText.trim() && (
                <span className="bg-slate-100 text-slate-800 font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg border border-slate-300">
                  Guru: {kodeGuruText.trim()}
                </span>
              )}
            </div>

            {/* Lampiran Gambar jika ada */}
            {imageString && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-center shadow-xs">
                <img
                  src={imageString}
                  alt="Lampiran Soal"
                  className="max-h-72 w-auto object-contain rounded-xl border border-slate-200"
                />
              </div>
            )}

            {/* Teks Pertanyaan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Pertanyaan
              </p>
              <div
                className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: formatQuestionText(questionText) || '<i class="text-slate-400">(Teks pertanyaan belum diisi)</i>' }}
              />
            </div>

            {/* Pilihan Jawaban Preview */}
            <div className="space-y-2.5">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Simulasi Jawaban Siswa
              </p>

              {bentukSoalText.toLowerCase().includes('kategori') ? (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-indigo-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="p-3 border-b border-indigo-800 w-12 text-center">No</th>
                        <th className="p-3 border-b border-indigo-800">Pernyataan</th>
                        <th className="p-3 border-b border-indigo-800 text-center">Kunci Jawaban Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {categoryStatementsList.map((st, idx) => (
                        <tr key={st.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 text-slate-900">{st.statement || '(Pernyataan belum diisi)'}</td>
                          <td className="p-3 text-center">
                            <span className="inline-block bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-lg border border-emerald-300">
                              ✓ {st.correctCategory}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                labels.map((label, idx) => {
                  const isMcma = bentukSoalText.toLowerCase().includes('mcma') || (bentukSoalText.toLowerCase().includes('kompleks') && !bentukSoalText.toLowerCase().includes('kategori'));
                  const isCorrect = isMcma ? mcmaCorrectIndices.includes(idx) : idx === correctIndex;
                  const text = optionsText[idx] || `(Pilihan ${label} belum diisi)`;
                  return (
                    <div
                      key={label}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {label}
                      </span>
                      <div className="flex-1 pt-1 text-sm">{text}</div>
                      {isCorrect && (
                        <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> KUNCI JAWABAN
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pembahasan */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
              <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Pembahasan Soal
              </p>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {explanationText || 'Tidak ada pembahasan.'}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Simpan Soal
          </button>
        </div>
      </div>
    </div>
  );
};

