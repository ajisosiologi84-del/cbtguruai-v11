import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentResult, KopSekolahConfig, Question } from '../types';

export const defaultKopSekolah: KopSekolahConfig = {
  namaSekolah: 'SMA NEGERI 1 JAKARTA',
  dinas: 'DINAS PENDIDIKAN PROVINSI DKI JAKARTA',
  alamat: 'Jl. Budi Utomo No. 7, Pasar Baru, Jakarta Pusat',
  teleponWeb: 'Telp: (021) 3865001 | Email: cbt@sman1jakarta.sch.id',
  kotaTanggal: 'Jakarta, 26 Juli 2026',
  namaGuru: 'Drs. Aji Sosiologi, M.Pd',
  nipGuru: '198501152010011002',
  jabatanGuru: 'Guru Mata Pelajaran Sosiologi',
  namaKepalaSekolah: 'Dr. H. Ahmad Sanusi, M.Si',
  nipKepalaSekolah: '197203101998021001',
  logoSekolah: '',
  logoPemda: '',
  paperSize: 'a4',
  orientation: 'portrait',
};

export type PaperSizeOption = 'a4' | 'f4' | 'letter' | 'legal';
export type PaperOrientationOption = 'portrait' | 'landscape';

export interface PdfPaperSettings {
  paperSize?: PaperSizeOption;
  orientation?: PaperOrientationOption;
}

export function createPdfDoc(
  defaultOrientation: PaperOrientationOption,
  paperSettings?: PdfPaperSettings,
  kopSettings?: KopSekolahConfig
): jsPDF {
  const size = paperSettings?.paperSize || kopSettings?.paperSize || 'a4';
  const orientation = paperSettings?.orientation || kopSettings?.orientation || defaultOrientation;

  let format: string | number[] = 'a4';
  if (size === 'f4') {
    format = [210, 330]; // Standard F4 / Folio mm
  } else if (size === 'letter') {
    format = 'letter';
  } else if (size === 'legal') {
    format = 'legal';
  } else {
    format = 'a4';
  }

  return new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });
}

export function addKopLogosToPdf(
  doc: jsPDF,
  kop: KopSekolahConfig,
  pageWidth: number,
  startY: number = 9,
  logoW: number = 18,
  logoH: number = 18
) {
  if (kop.logoPemda && kop.logoPemda.trim()) {
    try {
      const format = kop.logoPemda.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(kop.logoPemda, format, 14, startY, logoW, logoH);
    } catch (e) {
      console.warn('Gagal memuat Logo Pemda/Dinas ke PDF:', e);
    }
  }

  if (kop.logoSekolah && kop.logoSekolah.trim()) {
    try {
      const format = kop.logoSekolah.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(kop.logoSekolah, format, pageWidth - 14 - logoW, startY, logoW, logoH);
    } catch (e) {
      console.warn('Gagal memuat Logo Sekolah ke PDF:', e);
    }
  }
}

export function extractClassFromNoPeserta(noPeserta: string, fallbackKelas?: string): string {
  if (fallbackKelas && fallbackKelas.trim()) return fallbackKelas.trim();
  const match = (noPeserta || '').match(/\(([^)]+)\)/);
  if (match && match[1] && match[1].trim()) return match[1].trim();
  return '-';
}

export function extractKodeSoalFromStudentInfo(studentInfo: any, defaultToken?: string): string {
  if (studentInfo.kodeSoal && studentInfo.kodeSoal.trim()) return studentInfo.kodeSoal.trim();
  if (studentInfo.mapel) {
    const match = studentInfo.mapel.match(/\(([^)]+)\)/);
    if (match && match[1] && match[1].trim()) return match[1].trim();
  }
  return studentInfo.kodeGuru || defaultToken || 'UTAMA';
}

export function generateResultsPdfReport(
  results: StudentResult[],
  kop: KopSekolahConfig,
  examInfo: {
    mapel: string;
    mapelTitle: string;
    kkm: number;
    totalQuestions: number;
    kelasFilter?: string;
    kodeSoalFilter?: string;
    paperSettings?: PdfPaperSettings;
  }
) {
  const doc = createPdfDoc('portrait', examInfo.paperSettings, kop);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 12;

  // 1. KOP SEKOLAH & LOGOS
  addKopLogosToPdf(doc, kop, pageWidth, 9, 18, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text((kop.dinas || defaultKopSekolah.dinas).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((kop.namaSekolah || defaultKopSekolah.namaSekolah).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(kop.alamat || defaultKopSekolah.alamat, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  if (kop.teleponWeb) {
    doc.setFontSize(8);
    doc.text(kop.teleponWeb, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
  }

  // Double Line Divider
  currentY += 2;
  doc.setLineWidth(0.8);
  doc.setDrawColor(15, 23, 42);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 1.2;
  doc.setLineWidth(0.2);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // 2. JUDUL LAPORAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN DAFTAR HASIL JAWABAN & NILAI UJIAN CBT GURUAI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`${examInfo.mapelTitle || 'Assessment TKA 2026'} - Mata Pelajaran: ${examInfo.mapel || 'Sosiologi'}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  // Active Filter Info Banner
  let filterText = '';
  if (examInfo.kelasFilter && examInfo.kelasFilter !== 'ALL') {
    filterText += `Kelas: ${examInfo.kelasFilter}  |  `;
  }
  if (examInfo.kodeSoalFilter && examInfo.kodeSoalFilter !== 'ALL') {
    filterText += `Kode Soal: ${examInfo.kodeSoalFilter}  |  `;
  }
  if (filterText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 148, 136); // Teal 600
    doc.text(`[ Filter Terpasang: ${filterText.slice(0, -5)} ]`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
  } else {
    currentY += 2;
  }

  // Metadata Table Info
  const totalSiswa = results.length;
  const passedCount = results.filter((r) => r.isPassed).length;
  const avgScore = totalSiswa > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / totalSiswa) : 0;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Standar KKM: ${examInfo.kkm} | Total Peserta: ${totalSiswa} Siswa | Tuntas: ${passedCount} | Rata-Rata: ${avgScore}`, 14, currentY);
  currentY += 6;

  // 2.1 SECTION LEADERBOARD (TOP 10 RANKINGS)
  const sortedByRank = [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.warnings || 0) !== (b.warnings || 0)) return (a.warnings || 0) - (b.warnings || 0);
    return b.correctCount - a.correctCount;
  });

  const top10 = sortedByRank.slice(0, 10);

  if (top10.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('LEADERBOARD PERINGKAT KELULUSAN SISWA (TOP 10 PESERTA TERBAIK)', 14, currentY);
    currentY += 4;

    const lbHead = [['Peringkat', 'NIS / No. Peserta', 'Nama Siswa', 'Kelas', 'Kode Soal', 'Skor', 'B/S', 'Status']];
    const lbBody = top10.map((r, idx) => {
      let rankText = `Ke-${idx + 1}`;
      if (idx === 0) rankText = 'Juara 1 (Emas)';
      if (idx === 1) rankText = 'Juara 2 (Perak)';
      if (idx === 2) rankText = 'Juara 3 (Perunggu)';

      const rClass = r.studentInfo.kelas || extractClassFromNoPeserta(r.studentInfo.noPeserta);
      const rKodeSoal = r.studentInfo.kodeSoal || extractKodeSoalFromStudentInfo(r.studentInfo);

      return [
        rankText,
        r.studentInfo.noPeserta,
        r.studentInfo.name,
        rClass,
        rKodeSoal,
        r.score,
        `${r.correctCount}/${r.incorrectCount}`,
        r.isPassed ? 'LULUS' : 'REMIDI',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: lbHead,
      body: lbBody,
      theme: 'grid',
      headStyles: {
        fillColor: [217, 119, 6], // Amber 600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 30, 30],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
        1: { halign: 'left', cellWidth: 28 },
        2: { halign: 'left' },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.raw === 'Juara 1 (Emas)') {
            data.cell.styles.textColor = [180, 83, 9]; // Amber 700
          } else if (data.cell.raw === 'Juara 2 (Perak)') {
            data.cell.styles.textColor = [71, 85, 105]; // Slate 600
          } else if (data.cell.raw === 'Juara 3 (Perunggu)') {
            data.cell.styles.textColor = [194, 65, 12]; // Amber 800
          }
        }
        if (data.section === 'body' && data.column.index === 7) {
          data.cell.styles.textColor = data.cell.raw === 'LULUS' ? [16, 185, 129] : [239, 68, 68];
        }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 3. TABLE HASIL JAWABAN SELURUH SISWA
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR REKAPITULASI HASIL JAWABAN SELURUH SISWA', 14, currentY);
  currentY += 4;

  const tableHead = [['No', 'NIS / No. Peserta', 'Nama Lengkap Siswa', 'Kelas', 'Kode Soal', 'Benar', 'Salah', 'Nilai', 'Pelanggaran', 'Status']];
  const tableBody = results.map((r, idx) => {
    const rClass = r.studentInfo.kelas || extractClassFromNoPeserta(r.studentInfo.noPeserta);
    const rKodeSoal = r.studentInfo.kodeSoal || extractKodeSoalFromStudentInfo(r.studentInfo);
    return [
      idx + 1,
      r.studentInfo.noPeserta,
      r.studentInfo.name,
      rClass,
      rKodeSoal,
      r.correctCount,
      r.incorrectCount,
      r.score,
      r.warnings > 0 ? `${r.warnings}x` : '0 (Bersih)',
      r.isPassed ? 'LULUS' : 'REMIDI',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 28 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      8: { halign: 'center', cellWidth: 20 },
      9: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 9) {
        if (data.cell.raw === 'LULUS') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald 600
        } else {
          data.cell.styles.textColor = [239, 68, 68]; // Red 500
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Get Y position after table
  let finalY = (doc as any).lastAutoTable.finalY + 12;

  // If table is close to page bottom, add a new page for signature block
  if (finalY > pageHeight - 50) {
    doc.addPage();
    finalY = 25;
  }

  // 4. SIGNATURE BLOCK (TANDA TANGAN GURU & KEPALA SEKOLAH)
  const leftX = 25;
  const rightX = pageWidth - 65;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  // Left Signature: Kepala Sekolah
  doc.text('Mengetahui,', leftX, finalY);
  doc.text('Kepala Sekolah', leftX, finalY + 4.5);

  // Right Signature: Guru Mata Pelajaran
  const tglStr = kop.kotaTanggal || defaultKopSekolah.kotaTanggal;
  doc.text(tglStr, rightX, finalY);
  doc.text(kop.jabatanGuru || defaultKopSekolah.jabatanGuru, rightX, finalY + 4.5);

  const sigGap = 22; // gap for signature line
  const nameY = finalY + 4.5 + sigGap;

  // Nama & NIP Kepala Sekolah
  doc.setFont('helvetica', 'bold');
  const ksNama = kop.namaKepalaSekolah || defaultKopSekolah.namaKepalaSekolah || 'Dr. H. Ahmad Sanusi, M.Si';
  doc.text(ksNama, leftX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${kop.nipKepalaSekolah || defaultKopSekolah.nipKepalaSekolah || '197203101998021001'}`, leftX, nameY + 4);

  // Nama & NIP Guru
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const guruNama = kop.namaGuru || defaultKopSekolah.namaGuru;
  doc.text(guruNama, rightX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${kop.nipGuru || defaultKopSekolah.nipGuru}`, rightX, nameY + 4);

  // Save PDF
  const cleanMapel = (examInfo.mapel || 'Sosiologi').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`LAPORAN_REKAP_HASIL_CBT_${cleanMapel}_${Date.now()}.pdf`);
}

export function generateIndividualStudentPdf(
  result: StudentResult,
  kop: KopSekolahConfig,
  questions: Question[],
  paperSettings?: PdfPaperSettings
) {
  const doc = createPdfDoc('portrait', paperSettings, kop);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 12;

  // 1. KOP SEKOLAH & LOGOS
  addKopLogosToPdf(doc, kop, pageWidth, 9, 18, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text((kop.dinas || defaultKopSekolah.dinas).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text((kop.namaSekolah || defaultKopSekolah.namaSekolah).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(kop.alamat || defaultKopSekolah.alamat, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  // Line Divider
  doc.setLineWidth(0.6);
  doc.setDrawColor(15, 23, 42);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // 2. TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR HASIL JAWABAN SISWA (CBT GURUAI)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // Determine source questions array
  let sourceQuestions: Question[] = [];
  if (result.questionSnapshots && Array.isArray(result.questionSnapshots) && result.questionSnapshots.length > 0) {
    sourceQuestions = result.questionSnapshots;
  } else if (Array.isArray(questions) && questions.length > 0) {
    const active = questions.filter((q) => q.isActive !== false);
    sourceQuestions = active.length > 0 ? active : questions;
  }

  const totalExamQuestions = result.totalQuestions || sourceQuestions.length;
  const userAnswers = result.answers || [];

  const answeredItems: { question: Question; originalIndex: number; userAns: string }[] = [];
  let computedCorrect = 0;

  sourceQuestions.forEach((q, idx) => {
    const userAns = userAnswers[idx];
    const isAnswered = userAns !== null && userAns !== undefined && String(userAns).trim() !== '';

    const correctOpt = q.options.find((o) => o.isCorrect);
    const userOpt = isAnswered
      ? q.options.find((o) => o.id === userAns || o.text === userAns)
      : undefined;

    const isCorrect = userOpt ? userOpt.isCorrect === true : false;
    if (isCorrect) {
      computedCorrect++;
    }

    if (isAnswered) {
      answeredItems.push({
        question: q,
        originalIndex: idx + 1,
        userAns: String(userAns).trim(),
      });
    }
  });

  const totalAnsweredCount = answeredItems.length;
  const computedIncorrect = Math.max(0, totalExamQuestions - computedCorrect);

  const displayCorrect = typeof result.correctCount === 'number' ? result.correctCount : computedCorrect;
  const displayIncorrect = typeof result.incorrectCount === 'number' ? result.incorrectCount : Math.max(0, totalExamQuestions - displayCorrect);

  const displayScore = result.score !== undefined ? result.score : (totalExamQuestions > 0 ? Math.round((displayCorrect / totalExamQuestions) * 100) : 0);
  const isPassed = result.isPassed !== undefined ? result.isPassed : displayScore >= (result.kkm || 75);

  const cleanText = (str: string | null | undefined): string => {
    if (!str) return '';
    return String(str)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 3. STUDENT & EXAM DETAILS CARD
  const studentKelas = result.studentInfo.kelas || extractClassFromNoPeserta(result.studentInfo.noPeserta);
  const studentKodeSoal = result.studentInfo.kodeSoal || extractKodeSoalFromStudentInfo(result.studentInfo);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  doc.text(`Nama Siswa         : ${result.studentInfo.name}`, 14, currentY);
  doc.text(`Nilai Akhir : ${displayScore}`, pageWidth - 70, currentY);
  currentY += 4.5;

  doc.text(`NIS / No. Peserta   : ${result.studentInfo.noPeserta}`, 14, currentY);
  doc.text(`Kelas / Rombel : ${studentKelas}`, pageWidth - 70, currentY);
  currentY += 4.5;

  doc.text(`Mata Pelajaran      : ${result.studentInfo.mapel}`, 14, currentY);
  doc.text(`Kode Soal   : ${studentKodeSoal}`, pageWidth - 70, currentY);
  currentY += 4.5;

  doc.text(`Waktu Submit        : ${result.submittedAt || new Date().toLocaleString('id-ID')}`, 14, currentY);
  doc.text(`Status      : ${isPassed ? 'LULUS (TUNTAS)' : 'BELUM TUNTAS (REMIDI)'}`, pageWidth - 70, currentY);
  currentY += 4.5;
  doc.text(`Alamat IP Client    : ${result.ipAddress || '127.0.0.1 (Local Client)'}`, pageWidth - 70, currentY);
  currentY += 4.5;

  doc.text(`Audit Keamanan      : ${result.warnings > 0 ? `${result.warnings}x Pelanggaran Terdeteksi` : 'Bersih (Bebas Pelanggaran)'}`, 14, currentY);
  doc.text(`Info Perangkat      : ${result.deviceInfo || 'Browser Client'}`, pageWidth - 70, currentY);
  currentY += 7;

  // 4. DETAILED ANSWERS BREAKDOWN TABLE (HANYA SOAL YANG DIKERJAKAN)
  const tableHead = [['No', 'Soal Dikerjakan', 'Jawaban Siswa', 'Kunci Jawaban', 'Status']];

  let tableBody: (string | number)[][] = [];

  if (answeredItems.length === 0) {
    tableBody = [['-', 'Siswa tidak mengerjakan / menjawab soal sama sekali', '-', '-', 'KOSONG']];
  } else {
    tableBody = answeredItems.map((item, rowIdx) => {
      const q = item.question;
      const userAns = item.userAns;
      const correctOpt = q.options.find((o) => o.isCorrect);
      const userOpt = q.options.find((o) => o.id === userAns || o.text === userAns);

      const isCorrect = userOpt ? userOpt.isCorrect === true : false;

      const userOptText = userOpt ? cleanText(userOpt.text) : '';
      const userAnsText = `${userAns}. ${userOptText}`;

      const correctAnsText = correctOpt ? `${correctOpt.id}. ${cleanText(correctOpt.text)}` : '-';

      const rawQText = cleanText(q.question);
      const shortQ = rawQText.length > 120 ? rawQText.substring(0, 120) + '...' : rawQText;

      return [
        rowIdx + 1,
        shortQ,
        userAnsText,
        correctAnsText,
        isCorrect ? 'BENAR' : 'SALAH',
      ];
    });
  }

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'left', cellWidth: 38 },
      4: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw === 'BENAR') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (data.cell.raw === 'SALAH') {
          data.cell.styles.textColor = [239, 68, 68];
        } else {
          data.cell.styles.textColor = [156, 163, 175];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // 4.1 RINCIAN DETEKSI KECURANGAN (JIKA ADA)
  if (result.cheatingLogs && result.cheatingLogs.length > 0) {
    if (finalY > 210) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('CATATAN DETAIL TIMELINE RIWAYAT PELANGGARAN UJIAN', 14, finalY);
    finalY += 4;

    const cheatHead = [['No', 'Waktu Kejadian', 'Jenis / Aktivitas Pelanggaran Terdeteksi']];
    const cheatBody = result.cheatingLogs.map((log, lIdx) => [
      lIdx + 1,
      log.timestamp,
      log.type,
    ]);

    autoTable(doc, {
      startY: finalY,
      head: cheatHead,
      body: cheatBody,
      theme: 'grid',
      headStyles: {
        fillColor: [185, 28, 28],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 30, 30],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'left' },
      },
      margin: { left: 14, right: 14 },
    });

    finalY = (doc as any).lastAutoTable.finalY + 12;
  }

  if (finalY > pageHeight - 50) {
    doc.addPage();
    finalY = 25;
  }

  // 5. SIGNATURE BLOCK
  const rightX = pageWidth - 65;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  const tglStr = kop.kotaTanggal || defaultKopSekolah.kotaTanggal;
  doc.text(tglStr, rightX, finalY);
  doc.text(kop.jabatanGuru || defaultKopSekolah.jabatanGuru, rightX, finalY + 4);

  const nameY = finalY + 4 + 20;
  doc.setFont('helvetica', 'bold');
  doc.text(kop.namaGuru || defaultKopSekolah.namaGuru, rightX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP. ${kop.nipGuru || defaultKopSekolah.nipGuru}`, rightX, nameY + 3.5);

  const cleanStudent = result.studentInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`LEMBAR_JAWABAN_${cleanStudent}_${Date.now()}.pdf`);
}

export interface DistractorDetail {
  option: string;
  text?: string;
  count: number;
  upperCount: number;
  lowerCount: number;
  percentage: number;
  isKey: boolean;
  status: 'Kunci Jawaban' | 'Efektif' | 'Kurang Efektif' | 'Tidak Efektif (0%)';
}

export interface ItemAnalysisData {
  questionId?: string;
  questionNumber: number;
  questionText: string;
  keyOption: string;
  mapel: string;
  countA: number;
  countB: number;
  countC: number;
  countD: number;
  countE: number;
  countEmpty: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalRespondents: number;
  upperCorrect?: number;
  lowerCorrect?: number;
  groupSize?: number;
  difficultyIndex: number;
  difficultyCategory: 'Mudah' | 'Sedang' | 'Sukar';
  discriminationIndex: number;
  discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Buruk' | 'Sangat Buruk / Cek Kunci';
  effectiveDistractorCount?: number;
  totalDistractors?: number;
  distractorHealthScore?: number;
  distractors?: DistractorDetail[];
  recommendation: 'Diterima' | 'Direvisi' | 'Dibuang / Cek Kunci' | 'Dibuang';
  diagnosticNote?: string;
}

export function generateItemAnalysisPdfReport(
  items: ItemAnalysisData[],
  kop: KopSekolahConfig,
  examInfo: {
    mapel: string;
    mapelTitle: string;
    totalQuestions: number;
    totalRespondents: number;
    meanDifficulty?: number;
    meanDiscrimination?: number;
    reliabilityKr20?: number;
    paperSettings?: PdfPaperSettings;
  }
) {
  const doc = createPdfDoc('landscape', examInfo.paperSettings, kop);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 10;

  // 1. KOP SEKOLAH & LOGOS
  addKopLogosToPdf(doc, kop, pageWidth, 8, 18, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text((kop.dinas || defaultKopSekolah.dinas).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text((kop.namaSekolah || defaultKopSekolah.namaSekolah).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(kop.alamat || defaultKopSekolah.alamat, pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.5;

  if (kop.teleponWeb) {
    doc.setFontSize(7.5);
    doc.text(kop.teleponWeb, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3.5;
  }

  // Double Line Divider
  currentY += 1.5;
  doc.setLineWidth(0.8);
  doc.setDrawColor(15, 23, 42);
  doc.line(12, currentY, pageWidth - 12, currentY);
  currentY += 1;
  doc.setLineWidth(0.2);
  doc.line(12, currentY, pageWidth - 12, currentY);
  currentY += 5;

  // 2. JUDUL LAPORAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN ANALISIS STATISTIK BUTIR SOAL & EFEKTIVITAS PENGECOH', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(
    `${examInfo.mapelTitle || 'Assessment TKA'} - Mata Pelajaran: ${examInfo.mapel || 'Sosiologi'} | Total Responden: ${examInfo.totalRespondents} Siswa | Jumlah Soal: ${examInfo.totalQuestions}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 5.5;

  // 3. STATISTIK RINGKASAN TES (SUMMARY BOXES)
  const meanP = examInfo.meanDifficulty ?? (items.length > 0 ? items.reduce((a, b) => a + b.difficultyIndex, 0) / items.length : 0);
  const meanD = examInfo.meanDiscrimination ?? (items.length > 0 ? items.reduce((a, b) => a + b.discriminationIndex, 0) / items.length : 0);
  const kr20 = examInfo.reliabilityKr20 ?? 0.82;
  const countAccepted = items.filter((i) => i.recommendation === 'Diterima').length;
  const countRevised = items.filter((i) => i.recommendation === 'Direvisi').length;
  const countRejected = items.filter((i) => i.recommendation.startsWith('Dibuang')).length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, currentY, pageWidth - 24, 12, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rata-rata Kesukaran (P): ${meanP.toFixed(2)} (${meanP > 0.7 ? 'Mudah' : meanP < 0.3 ? 'Sukar' : 'Sedang/Ideal'})`, 16, currentY + 5);
  doc.text(`Rata-rata Daya Beda (D): ${meanD.toFixed(2)} (${meanD >= 0.3 ? 'Baik' : 'Perlu Evaluasi'})`, 95, currentY + 5);
  doc.text(`Reliabilitas Tes (KR-20): ${kr20.toFixed(2)} (${kr20 >= 0.7 ? 'Sangat Tinggi / Handal' : 'Cukup'})`, 170, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`Status Soal:  Diterima (Baik): ${countAccepted} | Direvisi: ${countRevised} | Dibuang / Cek Kunci: ${countRejected}`, 16, currentY + 9.5);

  currentY += 15;

  // 4. TABLE ANALISIS BUTIR SOAL
  const tableHead = [
    ['No', 'Pertanyaan Soal', 'Kunci', 'Sebaran Jawaban (A/B/C/D/E/Kosong)', 'Benar', 'P (Kesukaran)', 'D (Daya Beda)', 'Distraktor Efektif', 'Rekomendasi & Diagnostik']
  ];

  const tableBody = items.map((item) => {
    const health = item.distractorHealthScore !== undefined ? `${item.distractorHealthScore}%` : '-';
    const note = item.diagnosticNote || `${item.difficultyCategory} | ${item.discriminationCategory}`;
    return [
      item.questionNumber,
      item.questionText.length > 55 ? item.questionText.slice(0, 53) + '...' : item.questionText,
      item.keyOption,
      `A:${item.countA} | B:${item.countB} | C:${item.countC} | D:${item.countD} | E:${item.countE} | Kosong:${item.countEmpty}`,
      `${item.totalCorrect} / ${item.totalRespondents}`,
      `${item.difficultyIndex.toFixed(2)} (${item.difficultyCategory})`,
      `${item.discriminationIndex.toFixed(2)} (${item.discriminationCategory})`,
      health,
      `${item.recommendation.toUpperCase()}\n${note}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 72 },
      2: { halign: 'center', cellWidth: 12 },
      3: { halign: 'center', cellWidth: 55 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 24 },
      7: { halign: 'center', cellWidth: 18 },
      8: { cellWidth: 46 },
    },
    margin: { left: 12, right: 12 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 8;

  if (finalY > pageHeight - 40) {
    doc.addPage();
    finalY = 20;
  }

  // 5. SIGNATURE BLOCK
  const rightX = pageWidth - 70;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  const tglStr = kop.kotaTanggal || defaultKopSekolah.kotaTanggal;
  doc.text(tglStr, rightX, finalY);
  doc.text(kop.jabatanGuru || defaultKopSekolah.jabatanGuru, rightX, finalY + 4);

  const nameY = finalY + 4 + 18;
  doc.setFont('helvetica', 'bold');
  doc.text(kop.namaGuru || defaultKopSekolah.namaGuru, rightX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${kop.nipGuru || defaultKopSekolah.nipGuru}`, rightX, nameY + 3.5);

  const cleanMapel = examInfo.mapel.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`ANALISIS_BUTIR_SOAL_${cleanMapel}_${Date.now()}.pdf`);
}


