import React from 'react';
import { Activity, X, BarChart3, Users, Search, CheckCircle2, Clock } from 'lucide-react';
import { StudentInfo, StudentResult } from '../types';

export interface ClassBreakdownItem {
  kelas: string;
  total: number;
  completed: number;
  remaining: number;
  percent: number;
  avgScore: string | number;
}

export interface StudentProgressItem {
  student: StudentInfo;
  hasTakenExam: boolean;
  result?: StudentResult;
}

export interface RealTimeProgressStats {
  totalStudents: number;
  completedCount: number;
  pendingCount: number;
  percentage: number;
  averageScore: string | number;
  classBreakdown: ClassBreakdownItem[];
  studentProgressList: StudentProgressItem[];
}

interface RealTimeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  realTimeStats: RealTimeProgressStats;
  availableKelasList: string[];
  progressSearch: string;
  setProgressSearch: (val: string) => void;
  progressClassFilter: string;
  setProgressClassFilter: (val: string) => void;
  progressStatusFilter: 'ALL' | 'COMPLETED' | 'PENDING';
  setProgressStatusFilter: (val: 'ALL' | 'COMPLETED' | 'PENDING') => void;
}

export const RealTimeProgressModal: React.FC<RealTimeProgressModalProps> = ({
  isOpen,
  onClose,
  realTimeStats,
  availableKelasList,
  progressSearch,
  setProgressSearch,
  progressClassFilter,
  setProgressClassFilter,
  progressStatusFilter,
  setProgressStatusFilter,
}) => {
  if (!isOpen) return null;

  const filteredProgressList不易 = realTimeStats.studentProgressList.filter((sp) => {
    const matchSearch =
      !progressSearch ||
      sp.student.nama.toLowerCase().includes(progressSearch.toLowerCase()) ||
      sp.student.nis.toLowerCase().includes(progressSearch.toLowerCase());

    const matchClass四周 =
      progressClassFilter === 'ALL' ||
      (sp.student.kelas && sp.student.kelas.toLowerCase() === progressClassFilter.toLowerCase());

    const matchStatus =
      progressStatusFilter === 'ALL' ||
      (progressStatusFilter === 'COMPLETED' && sp.hasTakenExam) ||
      (progressStatusFilter === 'PENDING' && !sp.hasTakenExam);

    return matchSearch && matchClass四周 && matchStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span>Monitoring Statistics & Real-Time Progress Ujian</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau jumlah siswa yang sudah vs belum ujian per kelas secara langsung (Real-Time)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* TOP STATS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 block tracking-wider">Sudah Ujian</span>
              <div className="text-2xl font-black text-emerald-900 mt-0.5 font-mono">
                {realTimeStats.completedCount} <span className="text-xs text-emerald-700 font-normal">Siswa</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                {realTimeStats.percentage}% dari Total {realTimeStats.totalStudents}
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-amber-700 block tracking-wider">Belum Ujian</span>
              <div className="text-2xl font-black text-amber-900 mt-0.5 font-mono">
                {realTimeStats.pendingCount} <span className="text-xs text-amber-700 font-normal">Siswa</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 mt-1 block">
                {100 - realTimeStats.percentage}% tersisa
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-blue-700 block tracking-wider">Total Peserta</span>
              <div className="text-2xl font-black text-blue-900 mt-0.5 font-mono">
                {realTimeStats.totalStudents} <span className="text-xs text-blue-700 font-normal">Siswa</span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 mt-1 block">
                {availableKelasList.length} Rombel / Kelas
              </span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-indigo-700 block tracking-wider">Rata-rata Nilai</span>
              <div className="text-2xl font-black text-indigo-900 mt-0.5 font-mono">
                {realTimeStats.averageScore}
              </div>
              <span className="text-[11px] font-bold text-indigo-700 mt-1 block">
                Dari {realTimeStats.completedCount} Peserta Selesai
              </span>
            </div>
          </div>

          {/* SECTION: TABEL PROGRES PER KELAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                Rekapitulasi Partisipasi Per Kelas
              </h4>
            </div>

            {realTimeStats.classBreakdown.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Belum ada data rombel kelas atau siswa yang terdaftar.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black">
                    <tr>
                      <th className="p-2.5">Kelas / Rombel</th>
                      <th className="p-2.5 text-center">Total Siswa</th>
                      <th className="p-2.5 text-center text-emerald-700">Sudah Ujian</th>
                      <th className="p-2.5 text-center text-amber-700">Belum Ujian</th>
                      <th className="p-2.5 text-center">Progres (%)</th>
                      <th className="p-2.5 text-center">Rata-rata</th>
                      <th className="p-2.5 text-center">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {realTimeStats.classBreakdown.map((cb) => (
                      <tr key={cb.kelas} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span>{cb.kelas}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold">{cb.total}</td>
                        <td className="p-2.5 text-center text-emerald-700 font-mono font-bold">
                          {cb.completed}
                        </td>
                        <td className="p-2.5 text-center text-amber-700 font-mono font-bold">
                          {cb.remaining}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${cb.percent}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px]">{cb.percent}%</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-sky-800">
                          {cb.avgScore}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setProgressClassFilter(cb.kelas);
                              setProgressStatusFilter('PENDING');
                            }}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Filter Belum Ujian
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION: DAFTAR STATUS SISWA INDIVIDUAL REAL-TIME */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-indigo-600" />
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Status Presensi & Jawaban Siswa Real-Time
                </h4>
              </div>

              {/* Controls / Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari NIS / Nama Siswa..."
                    value={progressSearch}
                    onChange={(e) => setProgressSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none w-44 sm:w-52"
                  />
                </div>

                {/* Filter Kelas */}
                <select
                  value={progressClassFilter}
                  onChange={(e) => setProgressClassFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kelas ({availableKelasList.length})</option>
                  {availableKelasList.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={progressStatusFilter}
                  onChange={(e) => setProgressStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="COMPLETED">Sudah Ujian ({realTimeStats.completedCount})</option>
                  <option value="PENDING">Belum Ujian ({realTimeStats.pendingCount})</option>
                </select>
              </div>
            </div>

            {/* Table / Grid list of students */}
            {filteredProgressList不易.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Tidak ada data siswa yang cocok dengan filter pencarian saat ini.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black z-10">
                      <tr>
                        <th className="p-3">No</th>
                        <th className="p-3">NIS / No. Peserta</th>
                        <th className="p-3">Nama Siswa</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3 text-center">Status Ujian</th>
                        <th className="p-3 text-center">Nilai Ujian</th>
                        <th className="p-3 text-center">Waktu Pengumpulan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredProgressList不易.map((sp, idx) => (
                        <tr
                          key={sp.student.id}
                          className={sp.hasTakenExam ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'}
                        >
                          <td className="p-3 font-mono text-slate-400 font-bold text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{sp.student.nis}</td>
                          <td className="p-3 font-bold text-slate-900">{sp.student.nama}</td>
                          <td className="p-3 font-semibold text-slate-600">{sp.student.kelas || 'Tanpa Kelas'}</td>
                          <td className="p-3 text-center">
                            {sp.hasTakenExam ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sudah Ujian
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" /> Belum Ujian
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {sp.hasTakenExam && sp.result ? (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-md ${
                                  sp.result.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {sp.result.score} ({sp.result.isPassed ? 'LULUS' : 'REMIDI'})
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-normal">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                            {sp.hasTakenExam && sp.result?.submittedAt ? sp.result.submittedAt : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
          >
            Tutup Monitoring
          </button>
        </div>
      </div>
    </div>
  );
};
