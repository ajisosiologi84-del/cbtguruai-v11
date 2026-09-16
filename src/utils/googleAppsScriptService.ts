/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT SERVICE & PAYLOAD DEFINITIONS
 * Author: @ajisosiologi (https://lynk.id/ajisosiologi)
 * Fitur: Full CRUD (Create, Read, Update/Upload, Delete) untuk Siswa, Guru,
 *        Admin, Bank Soal (+ Gambar Drive), dan Rekap Nilai Ujian.
 * ==============================================================================
 */

import { StudentUser, TeacherUser, AdminUser, Question } from '../types';

// ==============================================================================
// 1. TYPE DEFINITIONS & JSON PAYLOAD SCHEMAS
// ==============================================================================

export type AppsScriptAction = 'create' | 'read' | 'update' | 'delete' | 'batch_upload' | 'upload' | 'sync_questions' | 'sync_results';
export type AppsScriptTarget = 'siswa' | 'guru' | 'admin' | 'questions' | 'results';

export interface BaseAppsScriptResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  action?: string;
  target?: string;
  result?: T;
  data?: T;
  count?: number;
  timestamp?: string;
}

export interface StudentPayloadData {
  nis: string;
  nama: string;
  kelas: string;
  password?: string;
  sesi?: string;
  ruang?: string;
  kodeGuru?: string;
  isActive?: boolean;
}

export interface TeacherPayloadData {
  kodeGuru: string;
  nama: string;
  mapel: string;
  nip?: string;
  password?: string;
  examToken?: string;
  status?: string;
}

export interface AdminPayloadData {
  username: string;
  nama: string;
  password?: string;
  role?: string;
}

export interface QuestionPayloadData {
  id: number;
  kodeGuru: string;
  mapel: string;
  kompetensi?: string;
  bentukSoal?: string;
  poin?: number;
  question: string;
  image?: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation?: string;
}

export interface AppsScriptGenericPayload {
  action: AppsScriptAction;
  target?: AppsScriptTarget;
  mode?: 'append' | 'overwrite';
  overwrite?: boolean;
  mapel?: string;
  kodeGuru?: string;
  sheetName?: string;
  data?: any;
  questions?: QuestionPayloadData[];
  timestamp?: string;
}

// ==============================================================================
// 2. MASTER GOOGLE APPS SCRIPT CODE (Code.gs)
// ==============================================================================

export const MASTER_APPS_SCRIPT_CODE_GS = `/**
 * ==============================================================================
 * PORTAL CBT GURUAI - MASTER GOOGLE APPS SCRIPT (FULL CRUD & SYNC)
 * Creator: @ajisosiologi (https://lynk.id/ajisosiologi)
 * Versi: 2.7 (High Resilience, Flexible Header Matching & Two-Way Sync)
 * ==============================================================================
 * Fitur:
 * 1. CRUD Otomatis: Data Siswa (DATA_SISWA), Guru (DATA_GURU), Admin (DATA_ADMIN).
 * 2. Sinkronisasi Bank Soal Dua Arah (Kirim ke Sheets & Tarik ke CBT).
 * 3. Auto Pencarian Tab Sheet & Dynamic Header Column Mapping.
 * 4. Ekspor Rekap Nilai Ujian Siswa (REKAP_NILAI).
 * 5. Format Header Elegan & Auto Upload Gambar Base64 ke Google Drive.
 */

// Konstanta Nama Sheet
var SHEET_SISWA = "DATA_SISWA";
var SHEET_GURU = "DATA_GURU";
var SHEET_ADMIN = "DATA_ADMIN";
var SHEET_REKAP = "REKAP_NILAI";

/**
 * Endpoint GET: Membaca Data (READ)
 */
function doGet(e) {
  try {
    ensureDatabaseSetup();

    var action = e && e.parameter && e.parameter.action ? e.parameter.action : "readAll";
    var type = e && e.parameter && e.parameter.type ? e.parameter.type : "all";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var allSheets = ss.getSheets().map(function(s) { return s.getName(); });

    // 1. Cek Daftar Tab Sheet
    if (action === "listSheets" || action === "getSheets" || type === "sheets") {
      return createJsonResponse({
        status: "success",
        message: "Daftar sheet berhasil diambil.",
        sheets: allSheets,
        timestamp: new Date().toISOString()
      });
    }

    var result = {};

    // 2. Pembacaan Bank Soal dari Tab Sheet
    if (action === "readQuestions" || type === "questions" || type === "soal") {
      var mapelParam = e && e.parameter && e.parameter.mapel ? e.parameter.mapel : "";
      var sheetNameParam = e && e.parameter && e.parameter.sheetName ? e.parameter.sheetName : "";
      
      var readResult = handleReadQuestionsFromSheet(sheetNameParam, mapelParam);
      return createJsonResponse({
        status: "success",
        message: readResult.questions.length > 0
          ? "Berhasil membaca " + readResult.questions.length + " soal dari sheet '" + readResult.sheetName + "'."
          : "Sheet '" + readResult.sheetName + "' ditemukan tetapi belum memiliki baris data soal.",
        data: { questions: readResult.questions },
        questions: readResult.questions,
        sheetName: readResult.sheetName,
        availableSheets: allSheets,
        count: readResult.questions.length,
        timestamp: new Date().toISOString()
      });
    }

    if (type === "siswa" || type === "student" || type === "all") {
      result.students = getSheetRecords(SHEET_SISWA);
    }
    if (type === "guru" || type === "teacher" || type === "all") {
      result.teachers = getSheetRecords(SHEET_GURU);
    }
    if (type === "admin" || type === "all") {
      result.admins = getSheetRecords(SHEET_ADMIN);
    }
    if (type === "rekap" || type === "all") {
      result.results = getSheetRecords(SHEET_REKAP);
    }

    return createJsonResponse({
      status: "success",
      message: "Data berhasil dimuat dari Spreadsheet.",
      data: result,
      availableSheets: allSheets,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Endpoint POST: Menangani Create, Update, Delete, Batch Upload, dan Soal Sync
 */
function doPost(e) {
  try {
    ensureDatabaseSetup();

    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "Payload HTTP POST kosong."
      });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = (payload.action || "").toLowerCase();
    var target = (payload.target || "").toLowerCase();
    var data = payload.data;

    // 0. Cek Tab Sheets via POST
    if (action === "listsheets" || action === "getsheets") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return createJsonResponse({
        status: "success",
        sheets: ss.getSheets().map(function(s) { return s.getName(); })
      });
    }

    // 1. Tarik Soal via POST
    if (action === "read_questions" || action === "readquestions" || (target === "questions" && action === "read")) {
      var mapelParam = payload.mapel || "";
      var sheetNameParam = payload.sheetName || "";
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var allSheets = ss.getSheets().map(function(s) { return s.getName(); });
      var readResult = handleReadQuestionsFromSheet(sheetNameParam, mapelParam);

      return createJsonResponse({
        status: "success",
        message: readResult.questions.length > 0
          ? "Berhasil membaca " + readResult.questions.length + " soal dari sheet '" + readResult.sheetName + "'."
          : "Sheet '" + readResult.sheetName + "' ditemukan tetapi belum ada baris soal.",
        data: { questions: readResult.questions },
        questions: readResult.questions,
        sheetName: readResult.sheetName,
        availableSheets: allSheets,
        count: readResult.questions.length,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Khusus Sinkronisasi Bank Soal (Kirim ke Sheets)
    if (action === "sync_questions" || target === "questions") {
      return handleSyncQuestions(payload);
    }

    // 3. Khusus Sinkronisasi Rekap Nilai
    if (action === "sync_results" || target === "results") {
      return handleSyncResults(payload);
    }

    // 4. Validasi Target CRUD User
    var sheetName = getSheetNameByTarget(target);
    if (!sheetName) {
      return createJsonResponse({
        status: "error",
        message: "Target '" + target + "' tidak valid. Gunakan 'siswa', 'guru', 'admin', atau 'questions'."
      });
    }

    var resultData = null;

    switch (action) {
      case "create":
        resultData = handleCreate(sheetName, target, data);
        break;

      case "update":
        resultData = handleUpdate(sheetName, target, data);
        break;

      case "delete":
        resultData = handleDelete(sheetName, target, data);
        break;

      case "batch_upload":
      case "upload":
        resultData = handleBatchUpload(sheetName, target, data, payload.overwrite || payload.mode === "overwrite");
        break;

      default:
        return createJsonResponse({
          status: "error",
          message: "Action '" + action + "' tidak dikenali."
        });
    }

    return createJsonResponse({
      status: "success",
      action: action,
      target: target,
      message: "Operasi " + action + " pada " + target + " berhasil diselesaikan!",
      result: resultData,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

// ==============================================================================
// CRUD HANDLERS UNTUK USER (SISWA, GURU, ADMIN)
// ==============================================================================

function handleCreate(sheetName, target, item) {
  if (!item || typeof item !== "object") {
    throw new Error("Data item tidak valid untuk operasi Create.");
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var idKey = getIdKeyByTarget(target);
  var idVal = String(item[idKey] || "").trim();

  if (!idVal) {
    throw new Error("Primary Key '" + idKey + "' wajib diisi.");
  }

  var existingRow = findRowIndexById(sheet, idVal);
  if (existingRow > 0) {
    throw new Error(target.toUpperCase() + " dengan " + idKey + " '" + idVal + "' sudah terdaftar.");
  }

  var row = mapItemToRow(target, item);
  sheet.appendRow(row);
  return { id: idVal, created: true };
}

function handleUpdate(sheetName, target, item) {
  if (!item || typeof item !== "object") {
    throw new Error("Data item tidak valid untuk operasi Update.");
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var idKey = getIdKeyByTarget(target);
  var idVal = String(item[idKey] || "").trim();

  if (!idVal) {
    throw new Error("Primary Key '" + idKey + "' wajib diisi.");
  }

  var rowIndex = findRowIndexById(sheet, idVal);
  if (rowIndex <= 0) {
    throw new Error(target.toUpperCase() + " dengan " + idKey + " '" + idVal + "' tidak ditemukan.");
  }

  var row = mapItemToRow(target, item);
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  return { id: idVal, updated: true };
}

function handleDelete(sheetName, target, data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var idKey = getIdKeyByTarget(target);

  var idsToDelete = [];
  if (Array.isArray(data)) {
    idsToDelete = data.map(function(d) {
      return typeof d === "object" ? String(d[idKey] || "").trim() : String(d).trim();
    }).filter(Boolean);
  } else if (typeof data === "object") {
    idsToDelete = [String(data[idKey] || "").trim()].filter(Boolean);
  } else {
    idsToDelete = [String(data).trim()].filter(Boolean);
  }

  if (idsToDelete.length === 0) {
    throw new Error("Tidak ada ID yang valid untuk dihapus.");
  }

  var allRows = sheet.getDataRange().getValues();
  var deletedCount = 0;

  for (var r = allRows.length - 1; r >= 1; r--) {
    var curId = String(allRows[r][0]).trim();
    if (idsToDelete.indexOf(curId) !== -1) {
      sheet.deleteRow(r + 1);
      deletedCount++;
    }
  }

  return { deletedCount: deletedCount, ids: idsToDelete };
}

function handleBatchUpload(sheetName, target, itemsList, overwrite) {
  if (!Array.isArray(itemsList)) {
    throw new Error("Data upload harus berupa Array list.");
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var idKey = getIdKeyByTarget(target);

  if (overwrite) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    var rows = itemsList.map(function(item) {
      return mapItemToRow(target, item);
    });
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
    return { total: itemsList.length, inserted: rows.length, updated: 0, mode: "overwrite" };
  }

  var inserted = 0;
  var updated = 0;

  itemsList.forEach(function(item) {
    var idVal = String(item[idKey] || "").trim();
    if (!idVal) return;

    var rowIndex = findRowIndexById(sheet, idVal);
    var row = mapItemToRow(target, item);

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
      updated++;
    } else {
      sheet.appendRow(row);
      inserted++;
    }
  });

  return { total: itemsList.length, inserted: inserted, updated: updated, mode: "merge" };
}

// ==============================================================================
// SINKRONISASI BANK SOAL (+ GOOGLE DRIVE IMAGES)
// ==============================================================================

function handleSyncQuestions(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = payload.sheetName || ("Bank_" + (payload.mapel || payload.kodeGuru || "Soal"));
  sheetName = sheetName.replace(/[:\\\\/?*\\[\\]]/g, "_").substring(0, 50);

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    setupQuestionSheetHeader(sheet);
  }

  var questions = payload.questions || payload.data || [];
  if (questions.length === 0) {
    return createJsonResponse({ status: "success", message: "Tidak ada butir soal dalam payload.", count: 0 });
  }

  if (payload.mode === "overwrite" || payload.overwrite) {
    sheet.clearContents();
    setupQuestionSheetHeader(sheet);
  }

  var startRow = sheet.getLastRow() + 1;
  var rowsData = [];

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var optA = "", optB = "", optC = "", optD = "", optE = "";
    var correctKey = "";

    if (q.options && q.options.length) {
      for (var j = 0; j < q.options.length; j++) {
        var opt = q.options[j];
        var optText = opt.text || "";
        var optId = (opt.id || String.fromCharCode(65 + j)).toUpperCase();
        if (optId === "A") optA = optText;
        else if (optId === "B") optB = optText;
        else if (optId === "C") optC = optText;
        else if (optId === "D") optD = optText;
        else if (optId === "E") optE = optText;

        if (opt.isCorrect) {
          correctKey += (correctKey ? "," : "") + optId;
        }
      }
    }

    var imageCell = "";
    if (q.image) {
      var imgStr = String(q.image).trim();
      if (imgStr.indexOf("http") === 0) {
        imageCell = '=IMAGE("' + imgStr + '")';
      } else if (imgStr.indexOf("data:image") === 0) {
        var driveImgUrl = saveBase64ImageToDrive(imgStr, "Soal_" + (q.id || (i + 1)) + "_" + (q.kodeGuru || "GURU"));
        imageCell = driveImgUrl ? '=IMAGE("' + driveImgUrl + '")' : "[Gambar Terlampir]";
      } else {
        imageCell = imgStr;
      }
    }

    rowsData.push([
      i + 1,
      q.id || (i + 1),
      q.kodeGuru || payload.kodeGuru || "GURU01",
      q.mapel || payload.mapel || "Sosiologi",
      q.kompetensi || q.subTopik || "-",
      q.bentukSoal || "Pilihan Ganda",
      q.poin || 10,
      q.question || "",
      imageCell,
      optA,
      optB,
      optC,
      optD,
      optE,
      correctKey,
      q.explanation || "",
      new Date().toLocaleString("id-ID")
    ]);
  }

  if (rowsData.length > 0) {
    sheet.getRange(startRow, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
    sheet.setRowHeights(startRow, rowsData.length, 55);
  }

  return createJsonResponse({
    status: "success",
    message: "Berhasil menyinkronkan " + rowsData.length + " soal ke Tab '" + sheetName + "'!",
    count: rowsData.length,
    sheetName: sheetName
  });
}

function handleSyncResults(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_REKAP);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_REKAP);
    setupRekapSheetHeader(sheet);
  }

  var results = payload.results || payload.data || [];
  if (results.length === 0) {
    return createJsonResponse({ status: "success", message: "Data rekap kosong." });
  }

  var rows = results.map(function(r, idx) {
    return [
      idx + 1,
      r.nis || "",
      r.nama || "",
      r.kelas || "",
      r.mapel || "",
      r.kodeGuru || "",
      r.score || 0,
      r.correctAnswers || 0,
      r.wrongAnswers || 0,
      r.cheatingAttempts || 0,
      r.submittedAt || new Date().toLocaleString("id-ID"),
      r.isDisqualified ? "DISKUALIFIKASI" : "SELESAI"
    ];
  });

  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

  return createJsonResponse({
    status: "success",
    message: "Berhasil menambahkan " + rows.length + " rekap nilai!",
    count: rows.length
  });
}

// ==============================================================================
// HELPER & SETUP DATABASE SPREADSHEET
// ==============================================================================

function getSheetNameByTarget(target) {
  if (target === "siswa" || target === "student") return SHEET_SISWA;
  if (target === "guru" || target === "teacher") return SHEET_GURU;
  if (target === "admin") return SHEET_ADMIN;
  if (target === "rekap" || target === "results") return SHEET_REKAP;
  return null;
}

function getIdKeyByTarget(target) {
  if (target === "siswa" || target === "student") return "nis";
  if (target === "guru" || target === "teacher") return "kodeGuru";
  if (target === "admin") return "username";
  return "id";
}

function mapItemToRow(target, item) {
  var now = new Date().toLocaleString("id-ID");
  if (target === "siswa" || target === "student") {
    return [
      String(item.nis || "").trim(),
      String(item.nama || "").trim(),
      String(item.kelas || "").trim(),
      String(item.password || "123456").trim(),
      String(item.sesi || "1").trim(),
      String(item.ruang || "R-01").trim(),
      String(item.kodeGuru || "ALL").trim(),
      item.isActive !== false ? "AKTIF" : "NONAKTIF",
      item.updatedAt || now
    ];
  } else if (target === "guru" || target === "teacher") {
    return [
      String(item.kodeGuru || "").trim(),
      String(item.nama || "").trim(),
      String(item.mapel || "").trim(),
      String(item.nip || "-").trim(),
      String(item.password || "guru123").trim(),
      String(item.examToken || "CBT2026").trim(),
      String(item.status || "Aktif").trim(),
      item.updatedAt || now
    ];
  } else if (target === "admin") {
    return [
      String(item.username || "").trim(),
      String(item.nama || "").trim(),
      String(item.password || "admin123").trim(),
      String(item.role || "Super Admin").trim(),
      item.updatedAt || now
    ];
  }
  return [];
}

function findRowIndexById(sheet, idValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  var idCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idCol.length; i++) {
    if (String(idCol[i][0]).trim().toLowerCase() === String(idValue).trim().toLowerCase()) {
      return i + 2;
    }
  }
  return -1;
}

function getSheetRecords(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(h, idx) {
      var key = String(h).trim();
      obj[key] = row[idx];
    });
    return obj;
  });
}

function handleReadQuestionsFromSheet(sheetName, mapel) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = null;
  var matchedSheetName = "";

  // 1. Cari berdasarkan sheetName spesifik
  if (sheetName) {
    sheet = ss.getSheetByName(sheetName);
    if (sheet) matchedSheetName = sheetName;
    
    // Case insensitive
    if (!sheet) {
      var all = ss.getSheets();
      for (var i = 0; i < all.length; i++) {
        if (all[i].getName().trim().toLowerCase() === sheetName.trim().toLowerCase()) {
          sheet = all[i];
          matchedSheetName = all[i].getName();
          break;
        }
      }
    }
  }

  // 2. Cari berdasarkan pola Mapel
  if (!sheet && mapel) {
    var variations = [
      "Bank_" + mapel.replace(/[^a-zA-Z0-9]/g, "_"),
      "Bank_" + mapel,
      "Bank " + mapel,
      "Soal_" + mapel,
      "Soal " + mapel,
      mapel
    ];
    for (var v = 0; v < variations.length; v++) {
      sheet = ss.getSheetByName(variations[v]);
      if (sheet) {
        matchedSheetName = variations[v];
        break;
      }
    }

    if (!sheet) {
      var all = ss.getSheets();
      for (var i = 0; i < all.length; i++) {
        var n = all[i].getName().toLowerCase();
        if (n.indexOf(mapel.toLowerCase()) !== -1) {
          sheet = all[i];
          matchedSheetName = all[i].getName();
          break;
        }
      }
    }
  }

  // 3. Cari tab yang mengandung kata "Bank", "Soal", atau "Question"
  if (!sheet) {
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) {
      var n = all[i].getName().toLowerCase();
      if (n.indexOf("bank") !== -1 || n.indexOf("soal") !== -1 || n.indexOf("question") !== -1) {
        sheet = all[i];
        matchedSheetName = all[i].getName();
        break;
      }
    }
  }

  // 4. Fallback ke tab pertama yang bukan sheet sistem
  if (!sheet) {
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) {
      var n = all[i].getName();
      if (n !== SHEET_SISWA && n !== SHEET_GURU && n !== SHEET_ADMIN && n !== SHEET_REKAP) {
        sheet = all[i];
        matchedSheetName = n;
        break;
      }
    }
  }

  // 5. Terakhir fallback ke active sheet
  if (!sheet) {
    sheet = ss.getActiveSheet();
    matchedSheetName = sheet ? sheet.getName() : "Sheet1";
  }

  if (!sheet) return { questions: [], sheetName: "" };

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { questions: [], sheetName: matchedSheetName };

  var maxCols = Math.max(lastCol, 17);
  var headerRow = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();
  var formulas = sheet.getRange(2, 1, lastRow - 1, maxCols).getFormulas();

  // Deteksi kolom secara dinamis berdasarkan nama header baris 1
  var colMap = {
    id: -1,
    kodeGuru: -1,
    mapel: -1,
    kompetensi: -1,
    bentukSoal: -1,
    poin: -1,
    question: -1,
    image: -1,
    optA: -1,
    optB: -1,
    optC: -1,
    optD: -1,
    optE: -1,
    correctKey: -1,
    explanation: -1
  };

  headerRow.forEach(function(h, idx) {
    var str = String(h || "").trim().toLowerCase();
    if (str === "id" || str === "id soal" || str === "id_soal") colMap.id = idx;
    else if (str.indexOf("guru") !== -1 || str === "kode guru") colMap.kodeGuru = idx;
    else if (str.indexOf("mapel") !== -1 || str.indexOf("mata pelajaran") !== -1) colMap.mapel = idx;
    else if (str.indexOf("kompetensi") !== -1 || str.indexOf("kd") !== -1 || str.indexOf("topik") !== -1) colMap.kompetensi = idx;
    else if (str.indexOf("bentuk") !== -1 || str.indexOf("tipe") !== -1) colMap.bentukSoal = idx;
    else if (str.indexOf("poin") !== -1 || str.indexOf("bobot") !== -1 || str.indexOf("skor") !== -1) colMap.poin = idx;
    else if (str.indexOf("tanya") !== -1 || str.indexOf("soal") !== -1 || str.indexOf("question") !== -1 || str.indexOf("teks") !== -1) {
      if (colMap.question === -1) colMap.question = idx;
    }
    else if (str.indexOf("gambar") !== -1 || str.indexOf("image") !== -1 || str.indexOf("foto") !== -1) colMap.image = idx;
    else if (str === "opsi a" || str === "opsia" || str === "a" || str === "pilihan a") colMap.optA = idx;
    else if (str === "opsi b" || str === "opsib" || str === "b" || str === "pilihan b") colMap.optB = idx;
    else if (str === "opsi c" || str === "opsic" || str === "c" || str === "pilihan c") colMap.optC = idx;
    else if (str === "opsi d" || str === "opsid" || str === "d" || str === "pilihan d") colMap.optD = idx;
    else if (str === "opsi e" || str === "opsie" || str === "e" || str === "pilihan e") colMap.optE = idx;
    else if (str.indexOf("kunci") !== -1 || str.indexOf("jawaban") !== -1 || str.indexOf("key") !== -1) colMap.correctKey = idx;
    else if (str.indexOf("bahas") !== -1 || str.indexOf("pembahasan") !== -1 || str.indexOf("penjelasan") !== -1 || str.indexOf("explanation") !== -1) colMap.explanation = idx;
  });

  // Fallback ke urutan default jika tidak terdeteksi via nama kolom
  if (colMap.question === -1) colMap.question = 7;
  if (colMap.id === -1) colMap.id = 1;
  if (colMap.kodeGuru === -1) colMap.kodeGuru = 2;
  if (colMap.mapel === -1) colMap.mapel = 3;
  if (colMap.kompetensi === -1) colMap.kompetensi = 4;
  if (colMap.bentukSoal === -1) colMap.bentukSoal = 5;
  if (colMap.poin === -1) colMap.poin = 6;
  if (colMap.image === -1) colMap.image = 8;
  if (colMap.optA === -1) colMap.optA = 9;
  if (colMap.optB === -1) colMap.optB = 10;
  if (colMap.optC === -1) colMap.optC = 11;
  if (colMap.optD === -1) colMap.optD = 12;
  if (colMap.optE === -1) colMap.optE = 13;
  if (colMap.correctKey === -1) colMap.correctKey = 14;
  if (colMap.explanation === -1) colMap.explanation = 15;

  var parsedQuestions = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var formulaRow = formulas[i];

    var questionText = String(row[colMap.question] || "").trim();
    var idVal = row[colMap.id] || (i + 1);

    // Abaikan baris kosong
    if (!questionText && !row[0] && !row[1]) continue;

    var kodeGuruVal = row[colMap.kodeGuru] || "GURU01";
    var mapelVal = row[colMap.mapel] || mapel || "Sosiologi";
    var kompetensiVal = row[colMap.kompetensi] || "";
    var bentukSoalVal = row[colMap.bentukSoal] || "Pilihan Ganda";
    var poinVal = Number(row[colMap.poin]) || 10;

    var imgVal = "";
    var imgFormula = formulaRow[colMap.image] || "";
    var imgText = String(row[colMap.image] || "").trim();
    if (imgFormula && imgFormula.indexOf('=IMAGE("') !== -1) {
      var match = imgFormula.match(/=IMAGE\("([^"]+)"\)/i);
      if (match && match[1]) imgVal = match[1];
    } else if (imgText && (imgText.indexOf("http") === 0 || imgText.indexOf("data:image") === 0)) {
      imgVal = imgText;
    }

    var optA = String(row[colMap.optA] || "").trim();
    var optB = String(row[colMap.optB] || "").trim();
    var optC = String(row[colMap.optC] || "").trim();
    var optD = String(row[colMap.optD] || "").trim();
    var optE = String(row[colMap.optE] || "").trim();
    var correctKeyStr = String(row[colMap.correctKey] || "A").toUpperCase().trim();
    var explanationText = String(row[colMap.explanation] || "").trim();

    var correctKeys = correctKeyStr.split(",").map(function(k) { return k.trim(); });

    var optionsList = [];
    if (optA) optionsList.push({ id: "A", text: optA, isCorrect: correctKeys.indexOf("A") !== -1 });
    if (optB) optionsList.push({ id: "B", text: optB, isCorrect: correctKeys.indexOf("B") !== -1 });
    if (optC) optionsList.push({ id: "C", text: optC, isCorrect: correctKeys.indexOf("C") !== -1 });
    if (optD) optionsList.push({ id: "D", text: optD, isCorrect: correctKeys.indexOf("D") !== -1 });
    if (optE) optionsList.push({ id: "E", text: optE, isCorrect: correctKeys.indexOf("E") !== -1 });

    if (optionsList.length === 0) {
      optionsList = [
        { id: "A", text: "Opsi A", isCorrect: true },
        { id: "B", text: "Opsi B", isCorrect: false }
      ];
    }

    parsedQuestions.push({
      id: Number(idVal) || (i + 1),
      kodeGuru: kodeGuruVal,
      mapel: mapelVal,
      kompetensi: kompetensiVal,
      bentukSoal: bentukSoalVal,
      poin: poinVal,
      question: questionText || ("Pertanyaan No " + (i + 1)),
      image: imgVal,
      options: optionsList,
      explanation: explanationText
    });
  }

  return {
    questions: parsedQuestions,
    sheetName: matchedSheetName
  };
}

function ensureDatabaseSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup DATA_SISWA
  var sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet(SHEET_SISWA);
    sheetSiswa.appendRow(["nis", "nama", "kelas", "password", "sesi", "ruang", "kodeGuru", "status", "updatedAt"]);
    styleHeader(sheetSiswa, "#1e3a8a");
  }

  // 2. Setup DATA_GURU
  var sheetGuru = ss.getSheetByName(SHEET_GURU);
  if (!sheetGuru) {
    sheetGuru = ss.insertSheet(SHEET_GURU);
    sheetGuru.appendRow(["kodeGuru", "nama", "mapel", "nip", "password", "examToken", "status", "updatedAt"]);
    styleHeader(sheetGuru, "#065f46");
  }

  // 3. Setup DATA_ADMIN
  var sheetAdmin = ss.getSheetByName(SHEET_ADMIN);
  if (!sheetAdmin) {
    sheetAdmin = ss.insertSheet(SHEET_ADMIN);
    sheetAdmin.appendRow(["username", "nama", "password", "role", "updatedAt"]);
    styleHeader(sheetAdmin, "#4c1d95");
  }

  // 4. Setup REKAP_NILAI
  var sheetRekap = ss.getSheetByName(SHEET_REKAP);
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet(SHEET_REKAP);
    setupRekapSheetHeader(sheetRekap);
  }
}

function setupQuestionSheetHeader(sheet) {
  var headers = [
    "No", "ID Soal", "Kode Guru", "Mata Pelajaran", "Kompetensi / KD",
    "Bentuk Soal", "Poin", "Teks Pertanyaan", "Gambar / Grafik",
    "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Opsi E",
    "Kunci Jawaban", "Pembahasan", "Waktu Simpan"
  ];
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  styleHeader(sheet, "#0f172a");

  sheet.setColumnWidth(1, 45);
  sheet.setColumnWidth(2, 60);
  sheet.setColumnWidth(3, 85);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 60);
  sheet.setColumnWidth(8, 320);
  sheet.setColumnWidth(9, 130);
  sheet.setColumnWidth(10, 130);
  sheet.setColumnWidth(11, 130);
  sheet.setColumnWidth(12, 130);
  sheet.setColumnWidth(13, 130);
  sheet.setColumnWidth(14, 130);
  sheet.setColumnWidth(15, 90);
  sheet.setColumnWidth(16, 220);
  sheet.setColumnWidth(17, 130);
}

function setupRekapSheetHeader(sheet) {
  var headers = ["No", "NIS", "Nama Siswa", "Kelas", "Mata Pelajaran", "Kode Guru", "Nilai Akhir", "Benar", "Salah", "Pelanggaran", "Waktu Selesai", "Status"];
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  styleHeader(sheet, "#831843");
}

function styleHeader(sheet, bgColor) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground(bgColor);
  range.setFontColor("#ffffff");
  range.setFontWeight("bold");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function saveBase64ImageToDrive(base64Data, filename) {
  try {
    var parts = base64Data.split(",");
    var contentType = "image/png";
    if (parts[0].indexOf("image/jpeg") !== -1 || parts[0].indexOf("image/jpg") !== -1) {
      contentType = "image/jpeg";
    } else if (parts[0].indexOf("image/webp") !== -1) {
      contentType = "image/webp";
    }

    var decoded = Utilities.base64Decode(parts.length > 1 ? parts[1] : parts[0]);
    var blob = Utilities.newBlob(decoded, contentType, filename + "." + contentType.split("/")[1]);

    var folders = DriveApp.getFoldersByName("CBT_Soal_Images");
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("CBT_Soal_Images");
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (e) {
    return "";
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

// ==============================================================================
// 3. CLIENT-SIDE API DISPATCHERS (CORS SAFE)
// ==============================================================================

/**
 * Mengirim request POST ke Google Apps Script tanpa terhambat CORS
 */
export async function sendAppsScriptRequest<T = any>(
  scriptUrl: string,
  payload: AppsScriptGenericPayload
): Promise<BaseAppsScriptResponse<T>> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) {
    throw new Error('URL Google Apps Script belum diisi.');
  }

  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('Format URL Apps Script tidak valid! Harus berawalan: https://script.google.com/macros/s/...');
  }

  // Gunakan header text/plain untuk bypass browser preflight OPTIONS
  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  const jsonResult = await response.json();
  if (jsonResult.status === 'error') {
    throw new Error(jsonResult.message || 'Terjadi kesalahan pada Google Apps Script.');
  }

  return jsonResult;
}

/**
 * Membaca data dari Google Spreadsheet via GET request
 */
export async function fetchAppsScriptDatabase(
  scriptUrl: string,
  type: 'all' | 'siswa' | 'guru' | 'admin' | 'rekap' = 'all'
): Promise<{
  students?: StudentUser[];
  teachers?: TeacherUser[];
  admins?: AdminUser[];
  results?: any[];
}> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) {
    throw new Error('URL Google Apps Script belum diisi.');
  }

  const response = await fetch(`${cleanUrl}?action=readAll&type=${type}`);
  const json = await response.json();

  if (json.status === 'error') {
    throw new Error(json.message || 'Gagal membaca database Spreadsheet.');
  }

  const data = json.data || {};
  
  // Normalisasi data siswa jika dibaca dari spreadsheet
  const students: StudentUser[] = (data.students || []).map((s: any, idx: number) => ({
    id: s.id || `STUDENT-${s.nis || idx + 1}`,
    nis: String(s.nis || '').trim(),
    nama: String(s.nama || '').trim(),
    kelas: String(s.kelas || '').trim(),
    kodeGuru: s.kodeGuru || 'ALL',
    isActive: String(s.status).toUpperCase() !== 'NONAKTIF',
  }));

  const teachers: TeacherUser[] = (data.teachers || []).map((t: any, idx: number) => ({
    id: t.id || `TEACHER-${t.kodeGuru || idx + 1}`,
    kodeGuru: String(t.kodeGuru || '').trim(),
    nama: String(t.nama || '').trim(),
    mapel: String(t.mapel || '').trim(),
    nip: String(t.nip || '-').trim(),
    password: String(t.password || 'guru123').trim(),
    examToken: String(t.examToken || 'CBT2026').trim(),
  }));

  const admins: AdminUser[] = (data.admins || []).map((a: any, idx: number) => ({
    id: a.id || `ADMIN-${a.username || idx + 1}`,
    username: String(a.username || '').trim(),
    nama: String(a.nama || '').trim(),
    password: String(a.password || 'admin123').trim(),
    role: a.role || 'admin',
    createdAt: a.updatedAt || new Date().toISOString(),
  }));

  return {
    students,
    teachers,
    admins,
    results: data.results || [],
  };
}

export interface FetchQuestionsResult {
  questions: Question[];
  sheetName?: string;
  availableSheets?: string[];
  message?: string;
  source: 'apps_script' | 'google_sheets_gviz';
}

/**
 * Mendapatkan daftar nama tab sheet dari Google Apps Script
 */
export async function fetchSpreadsheetSheetsList(scriptUrl: string): Promise<string[]> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) return [];

  // Jika input adalah link Google Spreadsheet langsung
  if (cleanUrl.includes('docs.google.com/spreadsheets/d/')) {
    return ['Sheet1 (Gunakan link publik Google Sheets)'];
  }

  try {
    // Coba via GET
    const res = await fetch(`${cleanUrl}?action=listSheets`);
    const json = await res.json();
    if (json.sheets && Array.isArray(json.sheets)) {
      return json.sheets;
    }
  } catch (e) {
    // Abaikan dan coba via POST
  }

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'listsheets' }),
    });
    const json = await res.json();
    if (json.sheets && Array.isArray(json.sheets)) {
      return json.sheets;
    }
  } catch (e) {
    // fallback
  }

  return [];
}

/**
 * Membaca / Menarik Bank Soal dari Google Spreadsheet via:
 * 1. Google Sheets GViz Query (jika link docs.google.com/spreadsheets/d/...)
 * 2. Google Apps Script Web App (POST / GET fallback)
 */
export async function fetchAppsScriptQuestions(
  scriptOrSheetUrl: string,
  mapel: string = '',
  sheetName: string = ''
): Promise<FetchQuestionsResult> {
  const cleanUrl = scriptOrSheetUrl.trim();
  if (!cleanUrl) {
    throw new Error('URL Google Apps Script atau URL Google Spreadsheet belum diisi.');
  }

  // =========================================================================
  // METODE 1: LINK GOOGLE SPREADSHEET LANGSUNG (GViz Query API)
  // Tidak memerlukan deploy Apps Script jika Google Sheet berstatus publik ("Siapa saja yang memiliki link dapat melihat")
  // =========================================================================
  const sheetIdMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetIdMatch && sheetIdMatch[1]) {
    const spreadsheetId = sheetIdMatch[1];
    const targetSheet = sheetName.trim() || (mapel ? `Bank_${mapel.replace(/[^a-zA-Z0-9]/g, '_')}` : '');
    
    // Bangun URL GViz
    const gvizUrl = targetSheet
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(targetSheet)}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;

    try {
      const gvizRes = await fetch(gvizUrl);
      const text = await gvizRes.text();
      
      // Response GViz berupa: /*O_o*/ google.visualization.Query.setResponse({...});
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error('Format respon Google Sheets tidak valid. Pastikan Spreadsheet Anda sudah diatur ke "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view).');
      }

      const gvizJson = JSON.parse(jsonMatch[1]);
      if (gvizJson.status === 'error') {
        const errorMsg = gvizJson.errors?.[0]?.detailed_message || gvizJson.errors?.[0]?.message || 'Gagal memuat Google Sheet.';
        throw new Error(`Google Sheets Error: ${errorMsg}`);
      }

      const table = gvizJson.table;
      if (!table || !table.rows || table.rows.length === 0) {
        return {
          questions: [],
          sheetName: targetSheet || 'Default Sheet',
          source: 'google_sheets_gviz',
          message: 'Sheet ditemukan namun belum ada baris data soal.',
        };
      }

      const headers: string[] = (table.cols || []).map((col: any) => String(col?.label || col?.id || '').trim().toLowerCase());
      
      // Deteksi indeks kolom
      const colMap = {
        id: headers.findIndex(h => h === 'id' || h.includes('id soal')),
        kodeGuru: headers.findIndex(h => h.includes('guru')),
        mapel: headers.findIndex(h => h.includes('mapel') || h.includes('mata pelajaran')),
        kompetensi: headers.findIndex(h => h.includes('kompetensi') || h.includes('kd')),
        bentukSoal: headers.findIndex(h => h.includes('bentuk') || h.includes('tipe')),
        poin: headers.findIndex(h => h.includes('poin') || h.includes('bobot') || h.includes('skor')),
        question: headers.findIndex(h => h.includes('tanya') || h.includes('soal') || h.includes('question') || h.includes('teks')),
        image: headers.findIndex(h => h.includes('gambar') || h.includes('image') || h.includes('foto')),
        optA: headers.findIndex(h => h === 'opsi a' || h === 'a' || h.includes('pilihan a')),
        optB: headers.findIndex(h => h === 'opsi b' || h === 'b' || h.includes('pilihan b')),
        optC: headers.findIndex(h => h === 'opsi c' || h === 'c' || h.includes('pilihan c')),
        optD: headers.findIndex(h => h === 'opsi d' || h === 'd' || h.includes('pilihan d')),
        optE: headers.findIndex(h => h === 'opsi e' || h === 'e' || h.includes('pilihan e')),
        correctKey: headers.findIndex(h => h.includes('kunci') || h.includes('jawaban')),
        explanation: headers.findIndex(h => h.includes('bahas') || h.includes('pembahasan') || h.includes('penjelasan')),
      };

      // Fallback index
      if (colMap.question === -1) colMap.question = headers.length > 7 ? 7 : (headers.length > 1 ? 1 : 0);
      if (colMap.id === -1) colMap.id = 1;
      if (colMap.optA === -1 && headers.length > 9) colMap.optA = 9;
      if (colMap.optB === -1 && headers.length > 10) colMap.optB = 10;
      if (colMap.optC === -1 && headers.length > 11) colMap.optC = 11;
      if (colMap.optD === -1 && headers.length > 12) colMap.optD = 12;
      if (colMap.optE === -1 && headers.length > 13) colMap.optE = 13;
      if (colMap.correctKey === -1 && headers.length > 14) colMap.correctKey = 14;
      if (colMap.explanation === -1 && headers.length > 15) colMap.explanation = 15;

      const parsedQuestions: Question[] = [];

      table.rows.forEach((rowObj: any, idx: number) => {
        const cells = (rowObj.c || []).map((c: any) => c?.v != null ? String(c.v) : (c?.f ? String(c.f) : ''));
        const qText = String(cells[colMap.question] || '').trim();
        if (!qText && !cells[0] && !cells[1]) return;

        const optA = String(cells[colMap.optA] || '').trim();
        const optB = String(cells[colMap.optB] || '').trim();
        const optC = String(cells[colMap.optC] || '').trim();
        const optD = String(cells[colMap.optD] || '').trim();
        const optE = String(cells[colMap.optE] || '').trim();

        const correctKeyStr = String(cells[colMap.correctKey] || 'A').toUpperCase().trim();
        const correctKeys = correctKeyStr.split(',').map(s => s.trim());

        const options = [];
        if (optA) options.push({ id: 'A', text: optA, isCorrect: correctKeys.includes('A') });
        if (optB) options.push({ id: 'B', text: optB, isCorrect: correctKeys.includes('B') });
        if (optC) options.push({ id: 'C', text: optC, isCorrect: correctKeys.includes('C') });
        if (optD) options.push({ id: 'D', text: optD, isCorrect: correctKeys.includes('D') });
        if (optE) options.push({ id: 'E', text: optE, isCorrect: correctKeys.includes('E') });

        parsedQuestions.push({
          id: Number(cells[colMap.id]) || (idx + 1),
          kodeGuru: String(cells[colMap.kodeGuru] || 'GURU01').trim(),
          mapel: String(cells[colMap.mapel] || mapel || 'Sosiologi').trim(),
          kompetensi: String(cells[colMap.kompetensi] || '').trim(),
          bentukSoal: String(cells[colMap.bentukSoal] || 'Pilihan Ganda').trim(),
          poin: Number(cells[colMap.poin]) || 10,
          question: qText || `Pertanyaan No ${idx + 1}`,
          image: String(cells[colMap.image] || '').trim(),
          options: options.length > 0 ? options : [
            { id: 'A', text: 'Opsi A', isCorrect: true },
            { id: 'B', text: 'Opsi B', isCorrect: false }
          ],
          explanation: String(cells[colMap.explanation] || '').trim(),
          isActive: true,
        });
      });

      return {
        questions: parsedQuestions,
        sheetName: targetSheet || 'Spreadsheet',
        source: 'google_sheets_gviz',
        message: `Berhasil mengimpor ${parsedQuestions.length} butir soal langsung dari Google Sheets.`,
      };
    } catch (gvizError: any) {
      throw new Error(`Gagal membaca link Google Sheets: ${gvizError.message}`);
    }
  }

  // =========================================================================
  // METODE 2: GOOGLE APPS SCRIPT WEB APP
  // Mencoba POST terlebih dahulu, jika gagal mencoba GET
  // =========================================================================
  let rawResponseJson: any = null;
  let lastError: any = null;

  // Percobaan 1: HTTP POST (Bypass limit panjang URL & paling stabil)
  try {
    const postRes = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'read_questions',
        mapel: mapel.trim(),
        sheetName: sheetName.trim() || (mapel ? `Bank_${mapel.replace(/[^a-zA-Z0-9]/g, '_')}` : ''),
      }),
    });
    rawResponseJson = await postRes.json();
  } catch (e) {
    lastError = e;
  }

  // Percobaan 2: HTTP GET (Jika POST gagal)
  if (!rawResponseJson || rawResponseJson.status === 'error') {
    try {
      const queryParams = new URLSearchParams({
        action: 'readQuestions',
        type: 'questions',
        mapel: mapel.trim(),
        sheetName: sheetName.trim() || (mapel ? `Bank_${mapel.replace(/[^a-zA-Z0-9]/g, '_')}` : ''),
      });

      const getRes = await fetch(`${cleanUrl}?${queryParams.toString()}`);
      rawResponseJson = await getRes.json();
    } catch (e) {
      lastError = e;
    }
  }

  if (!rawResponseJson) {
    throw new Error(
      `Koneksi ke Apps Script gagal. Pastikan URL benar dan izin Web App disetel ke "Anyone" (Siapa saja). Error: ${lastError?.message || 'Network error'}`
    );
  }

  if (rawResponseJson.status === 'error') {
    throw new Error(rawResponseJson.message || 'Gagal membaca bank soal dari Spreadsheet.');
  }

  const rawQuestions = rawResponseJson.data?.questions || rawResponseJson.questions || [];
  const detectedSheet = rawResponseJson.sheetName || sheetName || `Bank_${mapel}`;
  const availableSheets = rawResponseJson.availableSheets || [];

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return {
      questions: [],
      sheetName: detectedSheet,
      availableSheets,
      source: 'apps_script',
      message: rawResponseJson.message || `Tab '${detectedSheet}' ditemukan namun tidak ada data soal di baris 2 ke atas.`,
    };
  }

  const questions: Question[] = rawQuestions.map((q: any, idx: number): Question => {
    let options = q.options;
    if (!Array.isArray(options) || options.length === 0) {
      const keys = String(q.kunciJawaban || q.correctKey || q.kunci || 'A').toUpperCase().split(',').map((s: string) => s.trim());
      options = [
        { id: 'A', text: String(q.optA || q.opsiA || '').trim(), isCorrect: keys.includes('A') },
        { id: 'B', text: String(q.optB || q.opsiB || '').trim(), isCorrect: keys.includes('B') },
        { id: 'C', text: String(q.optC || q.opsiC || '').trim(), isCorrect: keys.includes('C') },
        { id: 'D', text: String(q.optD || q.opsiD || '').trim(), isCorrect: keys.includes('D') },
        { id: 'E', text: String(q.optE || q.opsiE || '').trim(), isCorrect: keys.includes('E') },
      ].filter((o: any) => !!o.text);
    }

    return {
      id: Number(q.id) || (idx + 1),
      question: String(q.question || q.teksPertanyaan || q.pertanyaan || `Pertanyaan Soal No ${idx + 1}`).trim(),
      options: options.length > 0 ? options : [
        { id: 'A', text: 'Opsi A', isCorrect: true },
        { id: 'B', text: 'Opsi B', isCorrect: false }
      ],
      explanation: String(q.explanation || q.pembahasan || '').trim(),
      image: q.image || q.gambar || '',
      isActive: true,
      mapel: q.mapel || mapel || 'Sosiologi',
      kodeGuru: q.kodeGuru || 'GURU01',
      kompetensi: q.kompetensi || q.subTopik || '',
      bentukSoal: q.bentukSoal || 'Pilihan Ganda',
      poin: Number(q.poin) || 10,
    };
  });

  return {
    questions,
    sheetName: detectedSheet,
    availableSheets,
    source: 'apps_script',
    message: rawResponseJson.message || `Berhasil membaca ${questions.length} soal dari sheet '${detectedSheet}'.`,
  };
}

