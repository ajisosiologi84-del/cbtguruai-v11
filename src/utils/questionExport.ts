import { Question, KopSekolahConfig } from '../types';

export interface QuestionExportOptions {
  docType: 'SOAL_ONLY' | 'SOAL_WITH_KEY' | 'KEY_ONLY';
  title: string; // e.g. "PENILAIAN AKHIR SEMESTER (PAS)"
  tahunPelajaran: string; // e.g. "2025/2026"
  mapel: string; // e.g. "Sosiologi"
  kelas: string; // e.g. "X / Ganjil"
  alokasiWaktu: string; // e.g. "90 Menit"
  hariTanggal: string; // e.g. "Senin, 10 Agustus 2026"
  pageSize: 'A4' | 'F4';
  fontFamily: 'Times New Roman' | 'Calibri' | 'Arial';
  fontSize: '10pt' | '11pt' | '12pt';
  showKop: boolean;
  showPetunjukUmum: boolean;
  showIdentitasSiswa: boolean;
  showSignature: boolean;
  showPembahasan: boolean;
  kopSekolah?: KopSekolahConfig;
}

export const defaultExportOptions: QuestionExportOptions = {
  docType: 'SOAL_ONLY',
  title: 'ASESMEN SUMATIF / PENILAIAN AKHIR SEMESTER',
  tahunPelajaran: '2025/2026',
  mapel: 'Sosiologi',
  kelas: 'X / Ganjil',
  alokasiWaktu: '90 Menit',
  hariTanggal: 'Senin, 10 Agustus 2026',
  pageSize: 'A4',
  fontFamily: 'Times New Roman',
  fontSize: '11pt',
  showKop: true,
  showPetunjukUmum: true,
  showIdentitasSiswa: true,
  showSignature: true,
  showPembahasan: true,
};

/**
 * Clean and normalize HTML or plain text questions for print/export
 */
export function cleanQuestionText(text: string): string {
  if (!text) return '';
  // If text doesn't contain HTML tags, replace newlines with <br/>
  if (!/<[a-z][\s\S]*>/i.test(text)) {
    return text.replace(/\n/g, '<br/>');
  }
  return text;
}

/**
 * Generate official Indonesian National Standard Exam HTML Document
 */
export function generateQuestionDocumentHtml(
  questions: Question[],
  options: QuestionExportOptions
): string {
  const {
    docType,
    title,
    tahunPelajaran,
    mapel,
    kelas,
    alokasiWaktu,
    hariTanggal,
    pageSize,
    fontFamily,
    fontSize,
    showKop,
    showPetunjukUmum,
    showIdentitasSiswa,
    showSignature,
    showPembahasan,
    kopSekolah,
  } = options;

  const schoolName = kopSekolah?.namaSekolah || 'SMA NEGERI 1 INDONESIA';
  const dinas = kopSekolah?.dinas || 'DINAS PENDIDIKAN PROVINSI';
  const alamat = kopSekolah?.alamat || 'Jl. Pendidikan No. 1, Kota Edukasi';
  const teleponWeb = kopSekolah?.teleponWeb || 'Telp: (021) 555-0199 | Website: www.sekolah.sch.id';
  const guruName = kopSekolah?.namaGuru || 'Drs. Guru Pengampu, M.Pd';
  const guruNip = kopSekolah?.nipGuru || '198501152010011002';
  const headmasterName = kopSekolah?.namaKepalaSekolah || 'Dr. H. Kepala Sekolah, M.Si';
  const headmasterNip = kopSekolah?.nipKepalaSekolah || '197203101998021001';
  const kotaTanggal = kopSekolah?.kotaTanggal || 'Jakarta, 10 Agustus 2026';

  // Group questions by Bentuk Soal if mixed
  const pgQuestions = questions.filter((q) => !q.bentukSoal || q.bentukSoal === 'Pilihan Ganda');
  const pgkQuestions = questions.filter((q) => q.bentukSoal === 'Pilihan Ganda Kompleks');
  const menjodohkanQuestions = questions.filter((q) => q.bentukSoal === 'Menjodohkan');
  const isianQuestions = questions.filter((q) => q.bentukSoal === 'Isian Singkat');
  const uraianQuestions = questions.filter((q) => q.bentukSoal === 'Uraian');

  // Page dimensions
  const pageCss = pageSize === 'F4' 
    ? '@page { size: 215mm 330mm; margin: 15mm 20mm; }' 
    : '@page { size: A4; margin: 15mm 20mm; }';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${mapel}</title>
  <style>
    ${pageCss}
    
    * {
      box-sizing: border-box;
    }

    body {
      font-family: '${fontFamily}', serif, sans-serif;
      font-size: ${fontSize};
      line-height: 1.4;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }

    .container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
    }

    /* KOP NASKAH UJIAN */
    .kop-header {
      text-align: center;
      position: relative;
      margin-bottom: 5px;
    }

    .kop-dinas {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .kop-sekolah {
      font-size: 15pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 2px 0;
      letter-spacing: 0.5px;
    }

    .kop-alamat {
      font-size: 9.5pt;
      margin: 0;
      font-style: normal;
    }

    .kop-divider {
      border: 0;
      border-top: 1px solid #000;
      border-bottom: 3px solid #000;
      height: 4px;
      margin: 6px 0 12px 0;
    }

    /* JUDUL UJIAN */
    .exam-title-box {
      text-align: center;
      margin-bottom: 12px;
    }

    .exam-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
      text-decoration: underline;
    }

    .exam-subtitle {
      font-size: 10.5pt;
      font-weight: bold;
      margin-top: 2px;
    }

    /* TABEL IDENTITAS & MATERI */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10pt;
    }

    .meta-table td {
      padding: 3px 6px;
      vertical-align: top;
    }

    .meta-table .border-box {
      border: 1px solid #000;
    }

    /* PETUNJUK UMUM */
    .petunjuk-box {
      border: 1px solid #000;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 9.5pt;
      background-color: #fafafa;
    }

    .petunjuk-title {
      font-weight: bold;
      margin-bottom: 4px;
      text-transform: uppercase;
      font-size: 10pt;
    }

    .petunjuk-list {
      margin: 0;
      padding-left: 18px;
    }

    .petunjuk-list li {
      margin-bottom: 2px;
    }

    /* SEKSI SOAL */
    .section-header {
      font-weight: bold;
      font-size: 11pt;
      margin: 16px 0 8px 0;
      padding-bottom: 2px;
      border-bottom: 1px solid #000;
      text-transform: uppercase;
    }

    .section-instruction {
      font-size: 9.5pt;
      font-style: italic;
      margin-bottom: 12px;
    }

    /* ITEM SOAL */
    .question-item {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .question-table {
      width: 100%;
      border-collapse: collapse;
    }

    .question-num {
      width: 28px;
      vertical-align: top;
      font-weight: bold;
      text-align: right;
      padding-right: 8px;
    }

    .question-body {
      vertical-align: top;
    }

    .question-text {
      margin-bottom: 6px;
      text-align: justify;
    }

    .question-text p {
      margin: 0 0 4px 0;
    }

    .question-image {
      margin: 6px 0;
      text-align: left;
    }

    .question-image img {
      max-width: 320px;
      max-height: 220px;
      border: 1px solid #ccc;
      padding: 2px;
      border-radius: 4px;
    }

    /* OPTIONS */
    .options-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }

    .option-row {
      page-break-inside: avoid;
    }

    .option-letter {
      width: 22px;
      vertical-align: top;
      font-weight: bold;
      padding-right: 4px;
    }

    .option-text {
      vertical-align: top;
      padding-bottom: 4px;
      text-align: justify;
    }

    /* KUNCI JAWABAN & PEMBAHASAN */
    .page-break {
      page-break-before: always;
    }

    .key-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10pt;
    }

    .key-table th, .key-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: left;
    }

    .key-table th {
      background-color: #e5e7eb;
      text-align: center;
      font-weight: bold;
    }

    .key-badge {
      display: inline-block;
      font-weight: bold;
      padding: 2px 6px;
      background: #000;
      color: #fff;
      border-radius: 3px;
    }

    /* TANDA TANGAN */
    .signature-table {
      width: 100%;
      margin-top: 30px;
      page-break-inside: avoid;
      font-size: 10.5pt;
    }

    .signature-table td {
      vertical-align: top;
      text-align: center;
      width: 50%;
    }

    .signature-space {
      height: 60px;
    }

    @media print {
      body {
        background: none;
      }
      .no-print {
        display: none !important;
      }
      .container {
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Print Bar for Preview -->
  <div class="no-print" style="position: fixed; top: 0; left: 0; right: 0; background: #1e293b; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 99999; font-family: sans-serif;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-weight: bold; font-size: 14px;">📄 Pratinjau Dokumen Naskah Soal Standar Nasional</span>
      <span style="background: #334155; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${questions.length} Soal</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer;">
        🖨️ Cetak / Simpan PDF
      </button>
      <button onclick="window.close()" style="background: #475569; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer;">
        ❌ Tutup
      </button>
    </div>
  </div>

  <div class="container" style="margin-top: 50px;">

    ${
      showKop
        ? `
    <!-- KOP SEKOLAH -->
    <div class="kop-header">
      <div class="kop-dinas">${dinas}</div>
      <div class="kop-sekolah">${schoolName}</div>
      <div class="kop-alamat">${alamat}</div>
      <div class="kop-alamat">${teleponWeb}</div>
    </div>
    <div class="kop-divider"></div>
    `
        : ''
    }

    <!-- JUDUL NASKAH UJIAN -->
    <div class="exam-title-box">
      <div class="exam-title">${title}</div>
      <div class="exam-subtitle">TAHUN PELAJARAN ${tahunPelajaran}</div>
    </div>

    <!-- TABEL IDENTITAS & PARAMETER UJIAN -->
    <table class="meta-table">
      <tr>
        <td style="width: 50%; padding-right: 12px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 110px; font-weight: bold;">Mata Pelajaran</td>
              <td style="width: 10px;">:</td>
              <td style="font-weight: bold;">${mapel}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Kelas / Semester</td>
              <td>:</td>
              <td>${kelas}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Hari / Tanggal</td>
              <td>:</td>
              <td>${hariTanggal}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Alokasi Waktu</td>
              <td>:</td>
              <td>${alokasiWaktu}</td>
            </tr>
          </table>
        </td>
        ${
          showIdentitasSiswa
            ? `
        <td style="width: 50%; padding-left: 12px;">
          <table style="width: 100%; border: 1px solid #000; padding: 4px;">
            <tr>
              <td style="width: 100px; font-weight: bold;">Nama Siswa</td>
              <td style="width: 10px;">:</td>
              <td style="border-bottom: 1px dotted #000;">&nbsp;</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">NIS / NISN</td>
              <td>:</td>
              <td style="border-bottom: 1px dotted #000;">&nbsp;</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">No. Peserta</td>
              <td>:</td>
              <td style="border-bottom: 1px dotted #000;">&nbsp;</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Tanda Tangan</td>
              <td>:</td>
              <td style="border-bottom: 1px dotted #000;">..........................</td>
            </tr>
          </table>
        </td>
        `
            : ''
        }
      </tr>
    </table>

    ${
      showPetunjukUmum
        ? `
    <!-- PETUNJUK UMUM -->
    <div class="petunjuk-box">
      <div class="petunjuk-title">PETUNJUK UMUM:</div>
      <ol class="petunjuk-list">
        <li>Isikan identitas Anda ke dalam Lembar Jawaban yang telah disediakan secara teliti dan benar.</li>
        <li>Periksa dan bacalah soal-soal sebelum Anda menjawabnya.</li>
        <li>Laporkan kepada pengawas apabila terdapat lembar soal yang kurang jelas, rusak, atau tidak lengkap.</li>
        <li>Dahulukan menjawab soal-soal yang Anda anggap mudah.</li>
        <li>Periksalah pekerjaan Anda kembali sebelum diserahkan kepada pengawas ujian.</li>
      </ol>
    </div>
    `
        : ''
    }

    ${
      docType !== 'KEY_ONLY'
        ? `
    <!-- NASKAH SOAL -->
    ${
      pgQuestions.length > 0
        ? `
      <div class="section-header">I. SOAL PILIHAN GANDA</div>
      <div class="section-instruction">Petunjuk: Pilihlah salah satu jawaban yang paling tepat dengan memberikan tanda silang (X) atau memilih huruf A, B, C, D, atau E.</div>
      
      ${pgQuestions
        .map((q, index) => renderSingleQuestionHtml(q, index + 1, docType === 'SOAL_WITH_KEY'))
        .join('')}
    `
        : ''
    }

    ${
      pgkQuestions.length > 0
        ? `
      <div class="section-header">II. SOAL PILIHAN GANDA KOMPLEKS</div>
      <div class="section-instruction">Petunjuk: Pilihlah lebih dari satu jawaban yang benar sesuai dengan instruksi soal.</div>
      
      ${pgkQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(q, pgQuestions.length + index + 1, docType === 'SOAL_WITH_KEY')
        )
        .join('')}
    `
        : ''
    }

    ${
      menjodohkanQuestions.length > 0
        ? `
      <div class="section-header">III. SOAL MENJODOHKAN</div>
      <div class="section-instruction">Petunjuk: Jodohkanlah pernyataan di kolom kiri dengan pasangan jawaban yang tepat di kolom kanan.</div>
      
      ${menjodohkanQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(
            q,
            pgQuestions.length + pgkQuestions.length + index + 1,
            docType === 'SOAL_WITH_KEY'
          )
        )
        .join('')}
    `
        : ''
    }

    ${
      isianQuestions.length > 0
        ? `
      <div class="section-header">IV. SOAL ISIAN SINGKAT</div>
      <div class="section-instruction">Petunjuk: Isilah titik-titik di bawah ini dengan jawaban yang singkat dan tepat.</div>
      
      ${isianQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(
            q,
            pgQuestions.length + pgkQuestions.length + menjodohkanQuestions.length + index + 1,
            docType === 'SOAL_WITH_KEY'
          )
        )
        .join('')}
    `
        : ''
    }

    ${
      uraianQuestions.length > 0
        ? `
      <div class="section-header">V. SOAL URAIAN / ESSAY</div>
      <div class="section-instruction">Petunjuk: Jawablah pertanyaan-pertanyaan berikut dengan jelas, lengkap, dan sistematis.</div>
      
      ${uraianQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(
            q,
            pgQuestions.length +
              pgkQuestions.length +
              menjodohkanQuestions.length +
              isianQuestions.length +
              index +
              1,
            docType === 'SOAL_WITH_KEY'
          )
        )
        .join('')}
    `
        : ''
    }
    `
        : ''
    }

    ${
      (docType === 'SOAL_WITH_KEY' || docType === 'KEY_ONLY')
        ? `
    <!-- KUNCI JAWABAN & TABEL MATRIKS -->
    <div class="${docType === 'SOAL_WITH_KEY' ? 'page-break' : ''}">
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="text-transform: uppercase; margin: 0; font-size: 13pt; text-decoration: underline;">
          KUNCI JAWABAN & PEDOMAN PENSKORAN
        </h3>
        <div style="font-size: 10.5pt; font-weight: bold; margin-top: 2px;">
          MATA PELAJARAN: ${mapel} (${tahunPelajaran})
        </div>
      </div>

      <table class="key-table">
        <thead>
          <tr>
            <th style="width: 40px;">No</th>
            <th style="width: 120px;">Bentuk Soal</th>
            <th style="width: 110px;">Kunci Jawaban</th>
            <th>Kompetensi / Sub-materi</th>
          </tr>
        </thead>
        <tbody>
          ${questions
            .map((q, idx) => {
              const correctOpts = (q.options || [])
                .filter((o) => o.isCorrect)
                .map((o) => o.id)
                .join(', ');

              return `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td>${q.bentukSoal || 'Pilihan Ganda'}</td>
                <td style="text-align: center;">
                  <span class="key-badge">${correctOpts || '-'}</span>
                </td>
                <td>${q.kompetensi || q.subTopik || 'Umum'}</td>
              </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      ${
        showPembahasan
          ? `
      <div style="margin-top: 24px;">
        <h4 style="margin-bottom: 8px; text-transform: uppercase; font-size: 11pt; border-bottom: 1px solid #000; padding-bottom: 4px;">
          PEMBAHASAN SOAL & PEDOMAN PENILAIAN
        </h4>
        ${questions
          .map((q, idx) => {
            if (!q.explanation) return '';
            const correctOpts = (q.options || [])
              .filter((o) => o.isCorrect)
              .map((o) => `${o.id}. ${o.text}`)
              .join('; ');

            return `
            <div style="margin-bottom: 12px; font-size: 10pt; page-break-inside: avoid;">
              <div style="font-weight: bold;">Soal #${idx + 1} (${q.bentukSoal || 'Pilihan Ganda'})</div>
              <div style="color: #15803d; font-weight: bold; margin: 2px 0;">Kunci: ${correctOpts}</div>
              <div style="text-align: justify; font-style: italic;"><b>Pembahasan:</b> ${cleanQuestionText(q.explanation)}</div>
            </div>
            `;
          })
          .join('')}
      </div>
      `
          : ''
      }
    </div>
    `
        : ''
    }

    ${
      showSignature
        ? `
    <!-- LEMBAR PENGESAHAN / TANDA TANGAN -->
    <table class="signature-table">
      <tr>
        <td>
          <div>Mengetahui,</div>
          <div style="font-weight: bold;">Kepala ${schoolName}</div>
          <div class="signature-space"></div>
          <div style="font-weight: bold; text-decoration: underline;">${headmasterName}</div>
          <div>NIP. ${headmasterNip}</div>
        </td>
        <td>
          <div>${kotaTanggal}</div>
          <div style="font-weight: bold;">Guru Mata Pelajaran</div>
          <div class="signature-space"></div>
          <div style="font-weight: bold; text-decoration: underline;">${guruName}</div>
          <div>NIP. ${guruNip}</div>
        </td>
      </tr>
    </table>
    `
        : ''
    }

  </div>
</body>
</html>`;
}

/**
 * Helper to render an individual question item in standard national layout
 */
function renderSingleQuestionHtml(q: Question, num: number, showKeyInline: boolean): string {
  const qText = cleanQuestionText(q.question);
  const options = q.options || [];

  return `
  <div class="question-item">
    <table class="question-table">
      <tr>
        <td class="question-num">${num}.</td>
        <td class="question-body">
          <div class="question-text">${qText}</div>

          ${
            q.image
              ? `
          <div class="question-image">
            <img src="${q.image}" alt="Gambar Soal ${num}" />
          </div>
          `
              : ''
          }

          ${
            options.length > 0
              ? `
          <table class="options-table">
            ${options
              .map((opt) => {
                const isKey = showKeyInline && opt.isCorrect;
                return `
              <tr class="option-row">
                <td class="option-letter" style="${isKey ? 'color: #16a34a; font-weight: bold;' : ''}">${opt.id}.</td>
                <td class="option-text" style="${isKey ? 'color: #15803d; font-weight: bold;' : ''}">
                  ${cleanQuestionText(opt.text)} ${isKey ? '✓ (Kunci)' : ''}
                </td>
              </tr>
              `;
              })
              .join('')}
          </table>
          `
              : ''
          }

          ${
            showKeyInline && q.explanation
              ? `
          <div style="margin-top: 6px; padding: 6px 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; font-size: 9.5pt; color: #166534;">
            <b>Pembahasan:</b> ${cleanQuestionText(q.explanation)}
          </div>
          `
              : ''
          }
        </td>
      </tr>
    </table>
  </div>
  `;
}

/**
 * Opens a print window with standard national exam formatting (PDF Save/Print)
 */
export function openQuestionPrintWindow(questions: Question[], options: QuestionExportOptions) {
  const html = generateQuestionDocumentHtml(questions, options);
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } else {
    alert('Pop-up terblokir di browser Anda! Mohon izinkan pop-up untuk mencetak / menyimpan PDF.');
  }
}

/**
 * Export questions directly as Word Document (.doc / .docx compatible file)
 */
export function exportQuestionsToWord(questions: Question[], options: QuestionExportOptions) {
  const htmlContent = generateQuestionDocumentHtml(questions, options);

  // Wrap inside Word MS Office HTML XML schema for perfect Word layout rendering
  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${options.title} - ${options.mapel}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: ${options.pageSize === 'F4' ? '215mm 330mm' : '210mm 297mm'};
            margin: 20mm;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword',
  });

  const cleanMapel = (options.mapel || 'Soal').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanTitle = (options.title || 'Ujian').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Naskah_Soal_${cleanMapel}_${cleanTitle}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
