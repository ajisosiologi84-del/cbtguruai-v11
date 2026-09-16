import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Users,
  GraduationCap,
  Building2,
  Search,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { StudentUser, TeacherUser, KopSekolahConfig } from '../types';

export interface ExamCardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentUser[];
  teachers: TeacherUser[];
  kopSekolah?: KopSekolahConfig;
  currentExamToken?: string;
}

export const ExamCardPrintModal: React.FC<ExamCardPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  kopSekolah,
  currentExamToken = 'CBT2026'
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedKodeGuru, setSelectedKodeGuru] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Custom Card Header & Exam Title
  const [examTitle, setExamTitle] = useState<string>('KARTU PESERTA UJIAN BERBASIS KOMPUTER (CBT)');
  const [tahunPelajaran, setTahunPelajaran] = useState<string>('2025/2026');

  // Selected Item IDs for Cards
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // Extract unique classes & kodeGurus
  const uniqueClasses = Array.from(new Set(students.map((s) => s.kelas || 'X').filter(Boolean))).sort();
  const availableKodeGurus = Array.from(
    new Set([
      ...students.map((s) => s.kodeGuru).filter(Boolean),
      ...teachers.map((t) => t.kodeGuru).filter(Boolean)
    ])
  ).sort();

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    if (selectedClass !== 'ALL' && s.kelas !== selectedClass) return false;
    if (selectedKodeGuru !== 'ALL' && (s.kodeGuru || 'GURU01') !== selectedKodeGuru) return false;
    if (statusFilter === 'ACTIVE' && s.isActive === false) return false;
    if (statusFilter === 'INACTIVE' && s.isActive !== false) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNis = s.nis?.toLowerCase().includes(q);
      const matchName = s.nama?.toLowerCase().includes(q);
      const matchKelas = s.kelas?.toLowerCase().includes(q);
      if (!matchNis && !matchName && !matchKelas) return false;
    }
    return true;
  });

  // Filtered Teachers
  const filteredTeachers = teachers.filter((t) => {
    if (selectedKodeGuru !== 'ALL' && (t.kodeGuru || 'GURU01') !== selectedKodeGuru) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNip = t.nip?.toLowerCase().includes(q);
      const matchName = t.nama?.toLowerCase().includes(q);
      const matchMapel = t.mapel?.toLowerCase().includes(q);
      if (!matchNip && !matchName && !matchMapel) return false;
    }
    return true;
  });

  // Toggle selection helpers
  const toggleSelectAllStudents = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));
    if (isAllSelected) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...filteredIds])));
    }
  };

  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const toggleSelectAllTeachers = () => {
    const filteredIds = filteredTeachers.map((t) => t.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedTeacherIds.includes(id));
    if (isAllSelected) {
      setSelectedTeacherIds(selectedTeacherIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedTeacherIds(Array.from(new Set([...selectedTeacherIds, ...filteredIds])));
    }
  };

  const toggleSelectTeacher = (id: string) => {
    if (selectedTeacherIds.includes(id)) {
      setSelectedTeacherIds(selectedTeacherIds.filter((item) => item !== id));
    } else {
      setSelectedTeacherIds([...selectedTeacherIds, id]);
    }
  };

  // Generate Print View Window
  const handlePrintExamCards = () => {
    const isStudent = activeTab === 'student';
    const itemsToPrint = isStudent
      ? (selectedStudentIds.length > 0 ? students.filter((s) => selectedStudentIds.includes(s.id)) : filteredStudents)
      : (selectedTeacherIds.length > 0 ? teachers.filter((t) => selectedTeacherIds.includes(t.id)) : filteredTeachers);

    if (itemsToPrint.length === 0) {
      alert('Tidak ada data yang dipilih untuk dicetak!');
      return;
    }

    const schoolName = kopSekolah?.namaSekolah || 'SMA NEGERI 1 INDONESIA';
    const dinas = kopSekolah?.dinas || 'DINAS PENDIDIKAN PROVINSI';
    const alamat = kopSekolah?.alamat || 'Jl. Pendidikan No. 1, Kota Edukasi';
    const teleponWeb = kopSekolah?.teleponWeb || 'Telp: (021) 555-0199 | Website: www.sekolah.sch.id';
    const headmasterName = kopSekolah?.namaKepalaSekolah || 'Dr. H. Kepala Sekolah, M.Si';
    const headmasterNip = kopSekolah?.nipKepalaSekolah || '197203101998021001';
    const kotaTanggal = kopSekolah?.kotaTanggal || 'Jakarta, 10 Agustus 2026';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak! Pastikan popup dibolehkan di browser Anda.');
      return;
    }

    const cardsHtml = itemsToPrint.map((item) => {
      if (isStudent) {
        const student = item as StudentUser;
        return `
          <div class="exam-card">
            <div class="card-header">
              <div class="dinas">${dinas.toUpperCase()}</div>
              <div class="school-name">${schoolName.toUpperCase()}</div>
              <div class="address">${alamat} - ${teleponWeb}</div>
              <div class="card-title-badge">${examTitle} - TP ${tahunPelajaran}</div>
            </div>
            <div class="card-body">
              <table class="card-table">
                <tr>
                  <td class="label">NIS / No. Peserta</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold">${student.nis}</td>
                </tr>
                <tr>
                  <td class="label">Nama Lengkap</td>
                  <td class="colon">:</td>
                  <td class="value font-bold">${student.nama.toUpperCase()}</td>
                </tr>
                <tr>
                  <td class="label">Kelas / Rombel</td>
                  <td class="colon">:</td>
                  <td class="value">${student.kelas}</td>
                </tr>
                <tr>
                  <td class="label">Kode Guru / Sesi</td>
                  <td class="colon">:</td>
                  <td class="value font-mono">${student.kodeGuru || 'GURU01'}</td>
                </tr>
                <tr>
                  <td class="label">Default Token</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold text-indigo">${currentExamToken}</td>
                </tr>
              </table>
            </div>
            <div class="card-footer">
              <div class="photo-box">Pas Foto<br/>2 x 3</div>
              <div class="signature-box">
                <div>${kotaTanggal}</div>
                <div>Kepala Sekolah,</div>
                <div class="signature-space"></div>
                <div class="sign-name">${headmasterName}</div>
                <div class="sign-nip">NIP. ${headmasterNip}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        const teacher = item as TeacherUser;
        return `
          <div class="exam-card teacher-card">
            <div class="card-header">
              <div class="dinas">${dinas.toUpperCase()}</div>
              <div class="school-name">${schoolName.toUpperCase()}</div>
              <div class="address">${alamat} - ${teleponWeb}</div>
              <div class="card-title-badge bg-amber">KARTU AKSES GURU PENGAMPU / PROKTOR</div>
            </div>
            <div class="card-body">
              <table class="card-table">
                <tr>
                  <td class="label">Username Akses</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold">${teacher.nip}</td>
                </tr>
                <tr>
                  <td class="label">Nama Guru</td>
                  <td class="colon">:</td>
                  <td class="value font-bold">${teacher.nama.toUpperCase()}</td>
                </tr>
                <tr>
                  <td class="label">Mata Pelajaran</td>
                  <td class="colon">:</td>
                  <td class="value">${teacher.mapel}</td>
                </tr>
                <tr>
                  <td class="label">Kode Guru Unik</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold text-amber">${teacher.kodeGuru || 'GURU01'}</td>
                </tr>
                <tr>
                  <td class="label">Batas Hak Akses</td>
                  <td class="colon">:</td>
                  <td class="value">Manajemen Soal & Token Mandiri</td>
                </tr>
              </table>
            </div>
            <div class="card-footer">
              <div class="photo-box">Pas Foto<br/>2 x 3</div>
              <div class="signature-box">
                <div>${kotaTanggal}</div>
                <div>Kepala Sekolah,</div>
                <div class="signature-space"></div>
                <div class="sign-name">${headmasterName}</div>
                <div class="sign-nip">NIP. ${headmasterNip}</div>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Kartu Ujian CBT - ${isStudent ? 'Siswa' : 'Guru'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            background: #fff;
            color: #1e293b;
            padding: 5mm;
          }
          .no-print-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #0f172a;
            color: #fff;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .no-print-bar h3 {
            font-size: 15px;
            font-weight: bold;
          }
          .no-print-bar button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .no-print-bar button:hover {
            background: #1d4ed8;
          }
          .card-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 50px;
          }
          @media print {
            .no-print-bar {
              display: none !important;
            }
            .card-grid {
              margin-top: 0;
            }
            .exam-card {
              page-break-inside: avoid;
            }
          }
          .exam-card {
            border: 2px solid #334155;
            border-radius: 8px;
            padding: 10px;
            background: #ffffff;
            font-size: 11px;
            position: relative;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 250px;
          }
          .teacher-card {
            border-color: #d97706;
          }
          .card-header {
            text-align: center;
            border-bottom: 2px double #334155;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .dinas {
            font-size: 8px;
            font-weight: bold;
            color: #475569;
            letter-spacing: 0.5px;
          }
          .school-name {
            font-size: 12px;
            font-weight: 900;
            color: #0f172a;
            margin: 1px 0;
          }
          .address {
            font-size: 7.5px;
            color: #64748b;
          }
          .card-title-badge {
            background: #1e293b;
            color: #fff;
            font-size: 8px;
            font-weight: bold;
            padding: 3px 6px;
            border-radius: 4px;
            margin-top: 4px;
            display: inline-block;
            letter-spacing: 0.3px;
          }
          .bg-amber {
            background: #b45309 !important;
          }
          .card-body {
            flex-grow: 1;
            margin-bottom: 6px;
          }
          .card-table {
            width: 100%;
            border-collapse: collapse;
          }
          .card-table td {
            padding: 2.5px 0;
            vertical-align: top;
          }
          .card-table .label {
            width: 32%;
            color: #475569;
            font-weight: 600;
          }
          .card-table .colon {
            width: 4%;
            text-align: center;
            color: #475569;
          }
          .card-table .value {
            width: 64%;
            color: #0f172a;
          }
          .font-mono {
            font-family: 'Courier New', Courier, monospace;
          }
          .font-bold {
            font-weight: bold;
          }
          .text-indigo {
            color: #4338ca;
          }
          .text-amber {
            color: #b45309;
          }
          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6px;
          }
          .photo-box {
            width: 55px;
            height: 70px;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            background: #f8fafc;
          }
          .signature-box {
            text-align: center;
            font-size: 8.5px;
            color: #334155;
            width: 140px;
          }
          .signature-space {
            height: 30px;
          }
          .sign-name {
            font-weight: bold;
            text-decoration: underline;
          }
          .sign-nip {
            font-size: 7.5px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <h3>🖨️ Pratinjau Cetak Kartu Ujian CBT (${itemsToPrint.length} Kartu)</h3>
          <div>
            <button onclick="window.print()">Simpan PDF / Cetak Kartu</button>
          </div>
        </div>
        <div class="card-grid">
          ${cardsHtml}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <Printer className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-white flex items-center gap-2">
                Cetak Kartu Ujian & Akses Users
              </h2>
              <p className="text-xs text-indigo-200">
                Filter, centang, dan cetak kartu ujian untuk Siswa atau Guru dalam format standar PDF A4.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Main User Type Switcher Tabs */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 flex-wrap gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" /> Kartu Ujian Siswa ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('teacher')}
                className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'teacher'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" /> Kartu Akses Guru ({teachers.length})
              </button>
            </div>

            {/* Print Trigger Button */}
            <button
              type="button"
              onClick={handlePrintExamCards}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer text-xs"
            >
              <Printer className="w-4 h-4" /> Cetak / Download PDF (
              {activeTab === 'student'
                ? selectedStudentIds.length > 0
                  ? `${selectedStudentIds.length} Terpilih`
                  : `${filteredStudents.length} Siswa`
                : selectedTeacherIds.length > 0
                ? `${selectedTeacherIds.length} Terpilih`
                : `${filteredTeachers.length} Guru`}
              )
            </button>
          </div>

          {/* Card Label Customizer Settings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Judul Kartu Ujian:</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="Judul Ujian..."
                className="w-full bg-white px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Tahun Pelajaran (TP):</label>
              <input
                type="text"
                value={tahunPelajaran}
                onChange={(e) => setTahunPelajaran(e.target.value)}
                placeholder="2025/2026..."
                className="w-full bg-white px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-gray-700">Filter Data:</span>

              {activeTab === 'student' && (
                <>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-slate-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kelas ({uniqueClasses.length})</option>
                    {uniqueClasses.map((k) => (
                      <option key={k} value={k}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Status Ujian</option>
                    <option value="ACTIVE">🟢 Aktif Ujian</option>
                    <option value="INACTIVE">🔴 Nonaktif Ujian</option>
                  </select>
                </>
              )}

              <select
                value={selectedKodeGuru}
                onChange={(e) => setSelectedKodeGuru(e.target.value)}
                className="bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-amber-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kode Guru</option>
                {availableKodeGurus.map((kg) => (
                  <option key={kg} value={kg}>
                    {kg}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'student' ? 'Cari NIS / Nama / Kelas...' : 'Cari Username / Nama / Mapel...'}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Table list with checkboxes */}
          {activeTab === 'student' ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3 border-b border-gray-200 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllStudents}
                    className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-gray-300"
                  >
                    {filteredStudents.length > 0 &&
                    filteredStudents.every((s) => selectedStudentIds.includes(s.id)) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />)}
                    <span>Centang Semua Terfilter</span>
                  </button>
                  <span className="text-gray-500 font-medium">
                    Menampilkan <b>{filteredStudents.length}</b> siswa
                  </span>
                </div>

                {selectedStudentIds.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full text-[11px] border border-indigo-200">
                    {selectedStudentIds.length} Siswa Dicentang
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Pilih</th>
                      <th className="p-2.5 w-10">No</th>
                      <th className="p-2.5">NIS / No. Peserta</th>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5 text-center">Kode Guru</th>
                      <th className="p-2.5 text-center">Status Ujian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-400">
                          Tidak ada siswa ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, idx) => {
                        const isChecked = selectedStudentIds.includes(s.id);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => toggleSelectStudent(s.id)}
                            className={`hover:bg-slate-50 cursor-pointer transition ${
                              isChecked ? 'bg-indigo-50/50' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectStudent(s.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                              />
                            </td>
                            <td className="p-2.5 text-gray-400 font-medium">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-800">{s.nis}</td>
                            <td className="p-2.5 font-bold text-gray-900">{s.nama}</td>
                            <td className="p-2.5">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100">
                                {s.kelas}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-amber-800">
                              {s.kodeGuru || 'GURU01'}
                            </td>
                            <td className="p-2.5 text-center font-bold">
                              {s.isActive !== false ? (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  🟢 Aktif
                                </span>
                              ) : (
                                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  🔴 Nonaktif
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3 border-b border-gray-200 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllTeachers}
                    className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-gray-300"
                  >
                    {filteredTeachers.length > 0 &&
                    filteredTeachers.every((t) => selectedTeacherIds.includes(t.id)) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />)}
                    <span>Centang Semua Terfilter</span>
                  </button>
                  <span className="text-gray-500 font-medium">
                    Menampilkan <b>{filteredTeachers.length}</b> guru
                  </span>
                </div>

                {selectedTeacherIds.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full text-[11px] border border-indigo-200">
                    {selectedTeacherIds.length} Guru Dicentang
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Pilih</th>
                      <th className="p-2.5 w-10">No</th>
                      <th className="p-2.5">Username</th>
                      <th className="p-2.5">Nama Guru</th>
                      <th className="p-2.5">Mata Pelajaran</th>
                      <th className="p-2.5 text-center">Kode Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-400">
                          Tidak ada guru ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((t, idx) => {
                        const isChecked = selectedTeacherIds.includes(t.id);
                        return (
                          <tr
                            key={t.id}
                            onClick={() => toggleSelectTeacher(t.id)}
                            className={`hover:bg-slate-50 cursor-pointer transition ${
                              isChecked ? 'bg-indigo-50/50' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectTeacher(t.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                              />
                            </td>
                            <td className="p-2.5 text-gray-400 font-medium">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-800">{t.nip}</td>
                            <td className="p-2.5 font-bold text-gray-900">{t.nama}</td>
                            <td className="p-2.5 font-semibold text-indigo-700">{t.mapel}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-amber-800">
                              {t.kodeGuru || 'GURU01'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500">
            💡 <i>Catatan: Hasil cetakan otomatis disesuaikan 2 kolom per halaman A4.</i>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrintExamCards}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Kartu Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
