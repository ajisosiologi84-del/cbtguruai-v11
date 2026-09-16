/**
 * Helper utility to cleanly format question text from uploads/edits.
 * Automatically detects numbered list items like (1), (2), (3), (4), (5), 1), 2)..., 1., 2...
 * and formats them onto clean new lines with bold indigo labels.
 */
export function formatQuestionText(text: string | null | undefined): string {
  if (!text) return '';

  let formatted = String(text).trim();

  // Standardize newlines
  formatted = formatted.replace(/\r\n/g, '\n');

  // If text doesn't contain block HTML elements, convert raw \n to <br/>
  if (!/<(?:p|br|div|li|tr|table)\b[^>]*>/i.test(formatted)) {
    formatted = formatted.replace(/\n/g, '<br/>');
  } else {
    // If it has HTML tags but also raw un-tagged newlines
    formatted = formatted.replace(/([^\n>])\n([^\n<])/g, '$1<br/>$2');
  }

  // Format parenthesized numbered items like (1), (2), (3), (4), (5) or (a), (b) or (i), (ii)
  formatted = formatted.replace(
    (/(?:<br\s*\/?>|\n|^|\s+)(\((?:[1-9]|1[0-9]|20|[a-eA-E]|[ivxIVX]{1,4})\))(?=\s+[^\s])/g),
    (match, p1, offset, string) => {
      const before = string.slice(Math.max(0, offset - 12), offset);
      const isAlreadyOnNewLine = /<br\s*\/?>|\n|^$/i.test(before.trim());
      if (isAlreadyOnNewLine) {
        return `<span class="inline-block font-bold text-indigo-700 font-mono mr-1">${p1}</span>`;
      }
      return `<br/><span class="inline-block font-bold text-indigo-700 font-mono mr-1 mt-1">${p1}</span>`;
    }
  );

  // Format unparenthesized list items like " 1) ", " 2) " or " 1. ", " 2. " when occurring inline
  formatted = formatted.replace(
    (/(?:<br\s*\/?>|\n|\.\s+|\s{2,})([1-9]\)|[1-9]\.)(?=\s+[A-Za-z0-9\("'])/g),
    (match, p1, offset, string) => {
      const before = string.slice(Math.max(0, offset - 12), offset);
      const isAlreadyOnNewLine = /<br\s*\/?>|\n|^$/i.test(before.trim());
      if (isAlreadyOnNewLine) {
        return `<span class="inline-block font-bold text-indigo-700 font-mono mr-1">${p1}</span>`;
      }
      return `<br/><span class="inline-block font-bold text-indigo-700 font-mono mr-1 mt-1">${p1}</span>`;
    }
  );

  // Format closing prompts e.g. "Berdasarkan...", "Pernyataan yang...", "Yang merupakan..."
  const closingPrompts = [
    'Berdasarkan', 'Pernyataan yang', 'Pernyataan di atas', 'Dari pernyataan',
    'Dari data', 'Dari tabel', 'Dari ilustrasi', 'Pasangan yang', 'Yang termasuk',
    'Yang merupakan', 'Manakah dari', 'Berikut ini yang'
  ];

  closingPrompts.forEach((prompt) => {
    const regex = new RegExp(`(?<=\\.|\\!|\\?|>|\\)|[a-zA-Z0-9])\\s+(${prompt}\\b)`, 'g');
    formatted = formatted.replace(regex, '<br/><br/><strong class="text-slate-900">$1</strong>');
  });

  // Limit repetitive <br/> to maximum 2
  formatted = formatted.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br/><br/>');

  return formatted;
}

import { Question } from '../types';

/**
 * Evaluates whether a student's answer is correct for any question type:
 * - Pilihan Ganda (Single Choice)
 * - Pilihan Ganda Kompleks MCMA (Multiple Choice Multiple Answer)
 * - Pilihan Ganda Kompleks Kategori (Benar/Salah or Ya/Tidak)
 */
export function isQuestionAnswerCorrect(q: Question, userAns: string | null): boolean {
  if (!userAns || typeof userAns !== 'string') return false;
  const trimmedAns = userAns.trim();
  if (!trimmedAns) return false;

  const bentuk = (q.bentukSoal || 'Pilihan Ganda').toLowerCase();

  // 1. Pilihan Ganda Kompleks Kategori (Benar/Salah / Ya/Tidak)
  if (bentuk.includes('kategori') || bentuk.includes('benar') || (q.categoryStatements && q.categoryStatements.length > 0)) {
    if (!q.categoryStatements || q.categoryStatements.length === 0) return false;

    let userMap: Record<string, string> = {};
    try {
      userMap = JSON.parse(trimmedAns);
    } catch {
      // Fallback delimited format: "1:Benar|2:Salah"
      trimmedAns.split('|').forEach((part) => {
        const [id, val] = part.split(':');
        if (id && val) userMap[id.trim()] = val.trim();
      });
    }

    return q.categoryStatements.every((st) => {
      const choice = userMap[st.id] || userMap[st.statement];
      return choice && choice.trim().toLowerCase() === st.correctCategory.trim().toLowerCase();
    });
  }

  // 2. Pilihan Ganda Kompleks MCMA (Multiple Choice Multiple Answer)
  if (bentuk.includes('mcma') || (bentuk.includes('kompleks') && !bentuk.includes('kategori'))) {
    const correctOptions = (q.options || [])
      .filter((o) => o.isCorrect)
      .map((o) => o.id.trim().toUpperCase())
      .sort();

    if (correctOptions.length === 0) return false;

    const userSelected = trimmedAns
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .sort();

    if (userSelected.length !== correctOptions.length) return false;

    return userSelected.every((val, idx) => val === correctOptions[idx]);
  }

  // 3. Standard Pilihan Ganda (Single Choice)
  const foundOpt = (q.options || []).find((o) => o.id.trim().toUpperCase() === trimmedAns.toUpperCase());
  return !!(foundOpt && foundOpt.isCorrect);
}

/**
 * Returns a human-readable display of the correct answer(s) for a question.
 */
export function getCorrectAnswerDisplay(q: Question): string {
  const bentuk = (q.bentukSoal || 'Pilihan Ganda').toLowerCase();

  if (bentuk.includes('kategori') || (q.categoryStatements && q.categoryStatements.length > 0)) {
    if (!q.categoryStatements || q.categoryStatements.length === 0) return '-';
    return q.categoryStatements
      .map((st, idx) => `${idx + 1}. ${st.correctCategory}`)
      .join(' | ');
  }

  const correctOpts = (q.options || []).filter((o) => o.isCorrect);
  if (correctOpts.length === 0) return '-';

  if (bentuk.includes('mcma') || correctOpts.length > 1) {
    return correctOpts.map((o) => o.id).join(', ');
  }

  return correctOpts[0].id;
}

/**
 * Returns a human-readable display of a student's answer.
 */
export function getStudentAnswerDisplay(q: Question, userAns: string | null): string {
  if (!userAns) return 'Belum Dijawab';
  const trimmedAns = userAns.trim();
  const bentuk = (q.bentukSoal || 'Pilihan Ganda').toLowerCase();

  if (bentuk.includes('kategori') || (q.categoryStatements && q.categoryStatements.length > 0)) {
    let userMap: Record<string, string> = {};
    try {
      userMap = JSON.parse(trimmedAns);
    } catch {
      trimmedAns.split('|').forEach((part) => {
        const [id, val] = part.split(':');
        if (id && val) userMap[id.trim()] = val.trim();
      });
    }

    if (!q.categoryStatements) return trimmedAns;
    return q.categoryStatements
      .map((st, idx) => {
        const choice = userMap[st.id] || userMap[st.statement] || '-';
        return `${idx + 1}. ${choice}`;
      })
      .join(' | ');
  }

  if (bentuk.includes('mcma')) {
    return trimmedAns
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .join(', ');
  }

  return trimmedAns.toUpperCase();
}
