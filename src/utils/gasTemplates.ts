import { Student } from '../types';

export function getCodeGsContent(studentsData?: Student[]): string {
  const studentsJson = JSON.stringify(studentsData || [], null, 2);

  return `/**
 * ============================================================================
 * SISTEM HEADCOUNT & MATRIKS PEMBELAJARAN TAHUN 4 (SESI AKADEMIK 2026)
 * Modul Google Apps Script (GAS) untuk Google Sheets & Web App
 * Disediakan khusus untuk Guru Sekolah Rendah (KPM / DELIMa MOE)
 * ============================================================================
 */

var SHEET_NAME = 'DATA_MURID';

// Data lalai (19 Murid Tahun 4) sekiranya Google Sheet belum mempunyai data
var DEFAULT_STUDENTS = ${studentsJson.length > 0 ? studentsJson : '[]'};

/**
 * Titik masuk utama Web App (doGet)
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Headcount Matriks Pembelajaran Tahun 4 (2026)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Menyertakan fail HTML lain jika diperlukan
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Mendapatkan lembaran kerja (Spreadsheet) aktif atau mencipta sheet baharu
 */
function getOrCreateSheet() {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    ss = null;
  }
  
  if (!ss) {
    // Jika script berjalan secara standalone, cuba gunakan spreadsheet yang disimpan di UserProperties
    var props = PropertiesService.getUserProperties();
    var sheetId = props.getProperty('HEADCOUNT_SHEET_ID');
    if (sheetId) {
      ss = SpreadsheetApp.openById(sheetId);
    } else {
      ss = SpreadsheetApp.create('Headcount & Matriks Pembelajaran Tahun 4 2026');
      props.setProperty('HEADCOUNT_SHEET_ID', ss.getId());
    }
  }

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initSheetHeaders(sheet);
    seedDefaultStudents(sheet);
  }
  return sheet;
}

/**
 * Menyediakan lajur tajuk untuk Google Sheet
 */
function initSheetHeaders(sheet) {
  var headers = [
    'ID', 'NAMA MURID', 'JANTINA', 'KELAS',
    // Bahasa Melayu
    'BM_TOV', 'BM_ETR', 'BM_AR1', 'BM_AR2', 'BM_SEBENAR', 'BM_CATATAN',
    // Bahasa Inggeris
    'BI_TOV', 'BI_ETR', 'BI_AR1', 'BI_AR2', 'BI_SEBENAR', 'BI_CATATAN',
    // Matematik
    'MAT_TOV', 'MAT_ETR', 'MAT_AR1', 'MAT_AR2', 'MAT_SEBENAR', 'MAT_CATATAN',
    // Sains
    'SN_TOV', 'SN_ETR', 'SN_AR1', 'SN_AR2', 'SN_SEBENAR', 'SN_CATATAN'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1e293b')
             .setFontColor('#ffffff')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * Memasukkan 19 murid asas ke dalam Google Sheet
 */
function seedDefaultStudents(sheet) {
  if (!DEFAULT_STUDENTS || DEFAULT_STUDENTS.length === 0) return;

  var rows = [];
  for (var i = 0; i < DEFAULT_STUDENTS.length; i++) {
    var s = DEFAULT_STUDENTS[i];
    var bm = (s.marks && s.marks.BM) || {};
    var bi = (s.marks && s.marks.BI) || {};
    var mat = (s.marks && s.marks.MAT) || {};
    var sn = (s.marks && s.marks.SN) || {};

    rows.push([
      s.id, s.name, s.gender, s.classGroup,
      bm.tov != null ? bm.tov : '', bm.etr != null ? bm.etr : '', bm.ar1 != null ? bm.ar1 : '', bm.ar2 != null ? bm.ar2 : '', bm.actual != null ? bm.actual : '', bm.notes || '',
      bi.tov != null ? bi.tov : '', bi.etr != null ? bi.etr : '', bi.ar1 != null ? bi.ar1 : '', bi.ar2 != null ? bi.ar2 : '', bi.actual != null ? bi.actual : '', bi.notes || '',
      mat.tov != null ? mat.tov : '', mat.etr != null ? mat.etr : '', mat.ar1 != null ? mat.ar1 : '', mat.ar2 != null ? mat.ar2 : '', mat.actual != null ? mat.actual : '', mat.notes || '',
      sn.tov != null ? sn.tov : '', sn.etr != null ? sn.etr : '', sn.ar1 != null ? sn.ar1 : '', sn.ar2 != null ? sn.ar2 : '', sn.actual != null ? sn.actual : '', sn.notes || ''
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    sheet.autoResizeColumns(1, rows[0].length);
  }
}

/**
 * Mendapatkan senarai penuh murid dari Google Sheet
 */
function getStudentsData() {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      seedDefaultStudents(sheet);
      lastRow = sheet.getLastRow();
    }

    if (lastRow <= 1) {
      return JSON.stringify(DEFAULT_STUDENTS);
    }

    var values = sheet.getRange(2, 1, lastRow - 1, 28).getValues();
    var students = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (!row[0] && !row[1]) continue;

      var parseVal = function(val) {
        if (val === '' || val === null || isNaN(val)) return null;
        return Number(val);
      };

      var student = {
        id: String(row[0] || ('s_' + (i + 1))),
        noId: '',
        name: String(row[1] || ''),
        gender: String(row[2] || 'L'),
        classGroup: String(row[3] || '4 DINAMIK'),
        marks: {
          BM: {
            tov: parseVal(row[4]) || 0,
            etr: parseVal(row[5]) || 0,
            ar1: parseVal(row[6]),
            ar2: parseVal(row[7]),
            actual: parseVal(row[8]),
            notes: String(row[9] || '')
          },
          BI: {
            tov: parseVal(row[10]) || 0,
            etr: parseVal(row[11]) || 0,
            ar1: parseVal(row[12]),
            ar2: parseVal(row[13]),
            actual: parseVal(row[14]),
            notes: String(row[15] || '')
          },
          MAT: {
            tov: parseVal(row[16]) || 0,
            etr: parseVal(row[17]) || 0,
            ar1: parseVal(row[18]),
            ar2: parseVal(row[19]),
            actual: parseVal(row[20]),
            notes: String(row[21] || '')
          },
          SN: {
            tov: parseVal(row[22]) || 0,
            etr: parseVal(row[23]) || 0,
            ar1: parseVal(row[24]),
            ar2: parseVal(row[25]),
            actual: parseVal(row[26]),
            notes: String(row[27] || '')
          }
        }
      };
      students.push(student);
    }

    return JSON.stringify(students);
  } catch (err) {
    Logger.log('Ralat getStudentsData: ' + err);
    return JSON.stringify(DEFAULT_STUDENTS);
  }
}

/**
 * Kemaskini markah murid bagi subjek dan medan tertentu
 */
function updateStudentMark(studentId, subjectId, field, value) {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, error: 'Tiada data' };

    var idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var rowIndex = -1;
    for (var i = 0; i < idColValues.length; i++) {
      if (String(idColValues[i][0]) === String(studentId)) {
        rowIndex = i + 2;
        break;
      }
    }

    if (rowIndex === -1) return { success: false, error: 'Murid tidak ditemui' };

    // Tentukan offset lajur berdasarkan subjek
    var subjBase = 5; // BM mula lajur ke-5 (E)
    if (subjectId === 'BI') subjBase = 11;
    if (subjectId === 'MAT') subjBase = 17;
    if (subjectId === 'SN') subjBase = 23;

    var fieldOffset = 0;
    if (field === 'tov') fieldOffset = 0;
    else if (field === 'etr') fieldOffset = 1;
    else if (field === 'ar1') fieldOffset = 2;
    else if (field === 'ar2') fieldOffset = 3;
    else if (field === 'actual') fieldOffset = 4;

    var col = subjBase + fieldOffset;
    sheet.getRange(rowIndex, col).setValue(value === null ? '' : value);

    return { success: true, updatedValue: value };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Kemaskini catatan intervensi murid
 */
function updateStudentNote(studentId, subjectId, notes) {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    var idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var rowIndex = -1;
    for (var i = 0; i < idColValues.length; i++) {
      if (String(idColValues[i][0]) === String(studentId)) {
        rowIndex = i + 2;
        break;
      }
    }
    if (rowIndex === -1) return { success: false, error: 'Murid tidak ditemui' };

    var noteCol = 10;
    if (subjectId === 'BI') noteCol = 16;
    if (subjectId === 'MAT') noteCol = 22;
    if (subjectId === 'SN') noteCol = 28;

    sheet.getRange(rowIndex, noteCol).setValue(notes || '');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Kemaskini nama murid
 */
function updateStudentName(studentId, newName) {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    var idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var rowIndex = -1;
    for (var i = 0; i < idColValues.length; i++) {
      if (String(idColValues[i][0]) === String(studentId)) {
        rowIndex = i + 2;
        break;
      }
    }
    if (rowIndex === -1) return { success: false, error: 'Murid tidak ditemui' };

    sheet.getRange(rowIndex, 2).setValue(String(newName).toUpperCase().trim());
    return { success: true, name: newName };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Tambah murid baharu ke Google Sheet
 */
function addNewStudent(studentData) {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    var newId = studentData.id || ('s_' + new Date().getTime());
    var newRow = [
      newId,
      (studentData.name || '').toUpperCase().trim(),
      studentData.gender || 'L',
      studentData.classGroup || '4 DINAMIK',
      // BM
      0, 0, '', '', '', '',
      // BI
      0, 0, '', '', '', '',
      // MAT
      0, 0, '', '', '', '',
      // SN
      0, 0, '', '', '', ''
    ];

    sheet.appendRow(newRow);
    return { success: true, id: newId };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Set semula data kepada senarai murid asal
 */
function resetSheetToDefault() {
  try {
    var sheet = getOrCreateSheet();
    sheet.clear();
    initSheetHeaders(sheet);
    seedDefaultStudents(sheet);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
`;
}

export function getIndexHtmlContent(studentsData?: Student[]): string {
  const initialDataJson = JSON.stringify(studentsData || [], null, 2);

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Headcount & Matriks Pembelajaran Tahun 4 (2026)</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background: white !important; color: black !important; }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-900 font-sans min-h-screen">

  <!-- Header Banner -->
  <header class="bg-slate-900 text-white shadow-xl border-b border-slate-800 no-print">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <div class="flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg text-white">
            <i data-lucide="graduation-cap" class="w-7 h-7"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                SESI AKADEMIK 2026
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                TAHUN 4
              </span>
              <span id="gasStatusBadge" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Menyambung ke Google Sheet...
              </span>
            </div>
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-50 mt-1">
              Aplikasi Headcount & Matriks Pembelajaran
            </h1>
            <p class="text-xs sm:text-sm text-slate-400">
              Sistem Pemantauan Markah Murid (TOV, Ujian 1, Ujian 2, & Ujian Sebenar) • <span id="studentCountLabel">19</span> Murid
            </p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="openAddModal()" class="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Tambah Murid</span>
          </button>
          <button onclick="window.print()" class="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition flex items-center gap-1.5">
            <i data-lucide="printer" class="w-4 h-4 text-emerald-400"></i>
            <span>Cetak / Cetak PDF</span>
          </button>
          <button onclick="refreshDataFromSheet()" title="Segar semula dari Google Sheet" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs & Subject Filter -->
      <div class="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800 pt-4">
        <div class="flex items-center space-x-1 overflow-x-auto pb-1">
          <button onclick="switchTab('table')" id="tab-btn-table" class="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 bg-blue-600 text-white shadow-md">
            <i data-lucide="users" class="w-4 h-4"></i>
            <span>Borang Matriks Headcount</span>
          </button>
          <button onclick="switchTab('intervention')" id="tab-btn-intervention" class="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 text-slate-400 hover:text-slate-200">
            <i data-lucide="book-open" class="w-4 h-4"></i>
            <span>Pelan Intervensi</span>
          </button>
        </div>

        <!-- Subject selector -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1" id="subjectFilterContainer">
          <button onclick="selectSubject('ALL')" class="sub-btn px-3 py-1 rounded-md text-xs font-medium transition" data-subj="ALL">Keseluruhan</button>
          <button onclick="selectSubject('BM')" class="sub-btn px-2.5 py-1 rounded-md text-xs font-medium transition" data-subj="BM">BM</button>
          <button onclick="selectSubject('BI')" class="sub-btn px-2.5 py-1 rounded-md text-xs font-medium transition" data-subj="BI">BI</button>
          <button onclick="selectSubject('MAT')" class="sub-btn px-2.5 py-1 rounded-md text-xs font-medium transition" data-subj="MAT">MAT</button>
          <button onclick="selectSubject('SN')" class="sub-btn px-2.5 py-1 rounded-md text-xs font-medium transition" data-subj="SN">SN</button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

    <!-- KPI Statistics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="statsContainer">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-xs font-medium text-slate-500">Jumlah Murid</div>
        <div class="text-2xl font-bold text-slate-800 mt-1" id="statTotalStudents">19</div>
        <div class="text-xs text-blue-600 mt-0.5">Semua didaftarkan</div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-xs font-medium text-slate-500">Capai ETR (%)</div>
        <div class="text-2xl font-bold text-emerald-600 mt-1" id="statAchieveEtr">0%</div>
        <div class="text-xs text-slate-400 mt-0.5">Ujian Sebenar vs ETR</div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-xs font-medium text-slate-500">Kadar Lulus (%)</div>
        <div class="text-2xl font-bold text-indigo-600 mt-1" id="statPassRate">0%</div>
        <div class="text-xs text-slate-400 mt-0.5">Markah >= 40 (Gred A-D)</div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-xs font-medium text-slate-500">Gred Purata (GPK)</div>
        <div class="text-2xl font-bold text-slate-800 mt-1" id="statGPK">0.00</div>
        <div class="text-xs text-slate-400 mt-0.5">Skala KPM (1.00 - 5.00)</div>
      </div>
    </div>

    <!-- View: Table -->
    <section id="tableView" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Search & toolbar -->
      <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
        <div class="relative w-full sm:w-80">
          <input type="text" id="searchInput" oninput="renderTable()" placeholder="Cari nama murid..." class="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
        </div>
        <div class="text-xs text-slate-500 font-medium">
          💡 Petua: Klik markah atau nama murid untuk sunting terus. Tersimpan ke Google Sheet secara automatik!
        </div>
      </div>

      <!-- Table element -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-3 px-3 text-center w-12">No.</th>
              <th class="py-3 px-4 min-w-[220px]">Nama Murid</th>
              <th class="py-3 px-3 text-center min-w-[70px]">TOV</th>
              <th class="py-3 px-3 text-center min-w-[70px]">ETR</th>
              <th class="py-3 px-3 text-center min-w-[70px]">Ujian 1</th>
              <th class="py-3 px-3 text-center min-w-[70px]">Ujian 2</th>
              <th class="py-3 px-3 text-center min-w-[90px] bg-blue-50 text-blue-900 border-x border-blue-200">Ujian Sebenar 2026</th>
              <th class="py-3 px-3 text-center min-w-[100px]">Status ETR</th>
              <th class="py-3 px-4 min-w-[180px]">Catatan / Intervensi</th>
            </tr>
          </thead>
          <tbody id="studentTableBody" class="divide-y divide-slate-200 text-slate-800">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- View: Intervention Planner -->
    <section id="interventionView" class="hidden space-y-4">
      <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-xs sm:text-sm flex items-center gap-3">
        <i data-lucide="alert-circle" class="w-5 h-5 text-amber-600 shrink-0"></i>
        <span>Senarai murid yang memerlukan intervensi berfokus (Ujian Sebenar di bawah sasaran ETR atau markah Gred E). Catatan akan terus diselaraskan dengan Google Sheet.</span>
      </div>
      <div id="interventionCards" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Rendered by JS -->
      </div>
    </section>
  </main>

  <!-- Add Student Modal -->
  <div id="addStudentModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <i data-lucide="user-plus" class="w-5 h-5 text-blue-600"></i>
        <span>Tambah Murid Baharu</span>
      </h3>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Penuh Murid</label>
          <input type="text" id="newStudentName" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none uppercase" placeholder="Contoh: MUHAMMAD ALI BIN ABU">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Jantina</label>
            <select id="newStudentGender" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
              <option value="L">Lelaki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
            <input type="text" id="newStudentClass" value="4 DINAMIK" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button onclick="closeAddModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
        <button onclick="submitNewStudent()" class="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl">Simpan Murid</button>
      </div>
    </div>
  </div>

  <!-- Client Script for GAS integration -->
  <script>
    // State
    var students = ${initialDataJson};
    var currentSubject = 'BM';
    var activeTab = 'table';

    // Check if running inside Google Apps Script iframe
    var isGas = typeof google !== 'undefined' && google.script && google.script.run;

    window.onload = function() {
      lucide.createIcons();
      updateSubjectButtons();

      if (isGas) {
        document.getElementById('gasStatusBadge').innerText = 'Menyambung Google Sheet...';
        google.script.run
          .withSuccessHandler(function(dataJson) {
            try {
              var parsed = JSON.parse(dataJson);
              if (parsed && parsed.length > 0) {
                students = parsed;
              }
              document.getElementById('gasStatusBadge').innerText = 'Tersambung Google Sheet';
              document.getElementById('gasStatusBadge').className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
            } catch(e) {}
            refreshUI();
          })
          .withFailureHandler(function(err) {
            document.getElementById('gasStatusBadge').innerText = 'Mod Luar Talian / Data Asas';
            refreshUI();
          })
          .getStudentsData();
      } else {
        document.getElementById('gasStatusBadge').innerText = 'Mod Pratonton Tempatan';
        refreshUI();
      }
    };

    function refreshUI() {
      document.getElementById('studentCountLabel').innerText = students.length;
      document.getElementById('statTotalStudents').innerText = students.length;
      updateStats();
      renderTable();
      renderInterventions();
      lucide.createIcons();
    }

    function selectSubject(subj) {
      currentSubject = subj;
      updateSubjectButtons();
      renderTable();
      updateStats();
    }

    function updateSubjectButtons() {
      var btns = document.querySelectorAll('.sub-btn');
      btns.forEach(function(b) {
        var s = b.getAttribute('data-subj');
        if (s === currentSubject) {
          b.className = 'sub-btn px-3 py-1 rounded-md text-xs font-bold bg-blue-600 text-white shadow-sm';
        } else {
          b.className = 'sub-btn px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700';
        }
      });
    }

    function switchTab(tab) {
      activeTab = tab;
      if (tab === 'table') {
        document.getElementById('tableView').classList.remove('hidden');
        document.getElementById('interventionView').classList.add('hidden');
        document.getElementById('tab-btn-table').className = 'px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 bg-blue-600 text-white shadow-md';
        document.getElementById('tab-btn-intervention').className = 'px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 text-slate-400 hover:text-slate-200';
      } else {
        document.getElementById('tableView').classList.add('hidden');
        document.getElementById('interventionView').classList.remove('hidden');
        document.getElementById('tab-btn-intervention').className = 'px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 bg-blue-600 text-white shadow-md';
        document.getElementById('tab-btn-table').className = 'px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 text-slate-400 hover:text-slate-200';
      }
      lucide.createIcons();
    }

    function getGrade(score) {
      if (score === null || score === undefined || isNaN(score)) return '-';
      if (score >= 80) return 'A';
      if (score >= 65) return 'B';
      if (score >= 50) return 'C';
      if (score >= 40) return 'D';
      return 'E';
    }

    function getGradeGPK(score) {
      if (score === null || isNaN(score)) return 5;
      if (score >= 80) return 1;
      if (score >= 65) return 2;
      if (score >= 50) return 3;
      if (score >= 40) return 4;
      return 5;
    }

    function updateStats() {
      var passCount = 0;
      var achieveCount = 0;
      var totalGPK = 0;
      var totalEvaluated = 0;

      students.forEach(function(s) {
        var actualVal = 0;
        var etrVal = 0;
        if (currentSubject === 'ALL') {
          var sumActual = 0;
          var sumEtr = 0;
          var count = 0;
          ['BM', 'BI', 'MAT', 'SN'].forEach(function(sub) {
            if (s.marks && s.marks[sub]) {
              sumActual += (s.marks[sub].actual || 0);
              sumEtr += (s.marks[sub].etr || 0);
              count++;
            }
          });
          actualVal = count > 0 ? Math.round(sumActual / count) : 0;
          etrVal = count > 0 ? Math.round(sumEtr / count) : 0;
        } else {
          var m = (s.marks && s.marks[currentSubject]) || {};
          actualVal = m.actual || 0;
          etrVal = m.etr || 0;
        }

        if (actualVal >= 40) passCount++;
        if (actualVal >= etrVal && etrVal > 0) achieveCount++;
        totalGPK += getGradeGPK(actualVal);
        totalEvaluated++;
      });

      var passRate = totalEvaluated > 0 ? Math.round((passCount / totalEvaluated) * 100) : 0;
      var achieveRate = totalEvaluated > 0 ? Math.round((achieveCount / totalEvaluated) * 100) : 0;
      var gpkAvg = totalEvaluated > 0 ? (totalGPK / totalEvaluated).toFixed(2) : '0.00';

      document.getElementById('statPassRate').innerText = passRate + '%';
      document.getElementById('statAchieveEtr').innerText = achieveRate + '%';
      document.getElementById('statGPK').innerText = gpkAvg;
    }

    function renderTable() {
      var query = (document.getElementById('searchInput').value || '').toLowerCase().trim();
      var tbody = document.getElementById('studentTableBody');
      tbody.innerHTML = '';

      var filtered = students.filter(function(s) {
        return s.name.toLowerCase().includes(query);
      });

      filtered.forEach(function(student, idx) {
        var tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';

        var subj = currentSubject === 'ALL' ? 'BM' : currentSubject;
        var m = (student.marks && student.marks[subj]) || { tov: 0, etr: 0, ar1: null, ar2: null, actual: null, notes: '' };

        var actual = m.actual != null ? m.actual : '-';
        var gActual = m.actual != null ? getGrade(m.actual) : '-';
        var isAchieve = m.actual != null && m.etr != null && m.actual >= m.etr;

        var statusBadge = '';
        if (m.actual == null) {
          statusBadge = '<span class="text-slate-400 font-medium text-[11px]">-</span>';
        } else if (isAchieve) {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Capai ETR</span>';
        } else {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Belum Capai</span>';
        }

        tr.innerHTML = \`
          <td class="py-3 px-3 text-center text-slate-400 font-mono">\${idx + 1}</td>
          <td class="py-3 px-4">
            <div class="font-bold text-slate-800 hover:text-blue-600 cursor-pointer" onclick="editName('\${student.id}', '\${student.name}')">\${student.name}</div>
            <div class="text-[10px] text-slate-400">\${student.gender === 'L' ? 'Lelaki' : 'Perempuan'} • \${student.classGroup}</div>
          </td>
          <td class="py-2 px-2 text-center">
            <input type="number" min="0" max="100" value="\${m.tov != null ? m.tov : ''}" onchange="saveMark('\${student.id}', '\${subj}', 'tov', this.value)" class="w-14 text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded font-semibold text-slate-700">
          </td>
          <td class="py-2 px-2 text-center">
            <input type="number" min="0" max="100" value="\${m.etr != null ? m.etr : ''}" onchange="saveMark('\${student.id}', '\${subj}', 'etr', this.value)" class="w-14 text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded font-semibold text-slate-700">
          </td>
          <td class="py-2 px-2 text-center">
            <input type="number" min="0" max="100" value="\${m.ar1 != null ? m.ar1 : ''}" onchange="saveMark('\${student.id}', '\${subj}', 'ar1', this.value)" class="w-14 text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded text-slate-600">
          </td>
          <td class="py-2 px-2 text-center">
            <input type="number" min="0" max="100" value="\${m.ar2 != null ? m.ar2 : ''}" onchange="saveMark('\${student.id}', '\${subj}', 'ar2', this.value)" class="w-14 text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded text-slate-600">
          </td>
          <td class="py-2 px-2 text-center bg-blue-50/50 border-x border-blue-100">
            <div class="flex items-center justify-center gap-1">
              <input type="number" min="0" max="100" value="\${m.actual != null ? m.actual : ''}" onchange="saveMark('\${student.id}', '\${subj}', 'actual', this.value)" class="w-14 text-center py-1 bg-white border border-blue-300 focus:border-blue-600 rounded font-bold text-blue-900 shadow-sm">
              <span class="text-xs font-bold text-blue-700">(\${gActual})</span>
            </div>
          </td>
          <td class="py-3 px-3 text-center">\${statusBadge}</td>
          <td class="py-2 px-3">
            <input type="text" value="\${m.notes || ''}" onchange="saveNote('\${student.id}', '\${subj}', this.value)" placeholder="Tambah intervensi..." class="w-full text-xs py-1 px-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-lg">
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function renderInterventions() {
      var container = document.getElementById('interventionCards');
      container.innerHTML = '';

      var subj = currentSubject === 'ALL' ? 'BM' : currentSubject;
      var atRisk = students.filter(function(s) {
        var m = (s.marks && s.marks[subj]) || {};
        return (m.actual !== null && m.actual < 50) || (m.actual !== null && m.etr !== null && m.actual < m.etr);
      });

      if (atRisk.length === 0) {
        container.innerHTML = '<div class="col-span-2 text-center py-8 text-slate-400 text-xs">Semua murid telah mencapai tahap penguasaan sasaran.</div>';
        return;
      }

      atRisk.forEach(function(s) {
        var m = s.marks[subj];
        var card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2';
        card.innerHTML = \`
          <div class="flex justify-between items-start">
            <div>
              <div class="font-bold text-slate-900 text-sm">\${s.name}</div>
              <div class="text-[11px] text-slate-500">\${s.classGroup} • Subjek: \${subj}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
              Sebenar: \${m.actual} (ETR: \${m.etr})
            </span>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Tindakan / Pelan Bimbingan:</label>
            <input type="text" value="\${m.notes || ''}" onchange="saveNote('\${s.id}', '\${subj}', this.value)" placeholder="Contoh: Sesi membaca intensif / klinik sifir asas..." class="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg">
          </div>
        \`;
        container.appendChild(card);
      });
    }

    function saveMark(studentId, subjectId, field, value) {
      var numVal = value === '' ? null : Number(value);
      var s = students.find(function(item) { return item.id === studentId; });
      if (s && s.marks && s.marks[subjectId]) {
        s.marks[subjectId][field] = numVal;
      }

      updateStats();
      if (isGas) {
        google.script.run
          .withSuccessHandler(function() {})
          .updateStudentMark(studentId, subjectId, field, numVal);
      }
    }

    function saveNote(studentId, subjectId, notes) {
      var s = students.find(function(item) { return item.id === studentId; });
      if (s && s.marks && s.marks[subjectId]) {
        s.marks[subjectId].notes = notes;
      }

      if (isGas) {
        google.script.run
          .withSuccessHandler(function() {})
          .updateStudentNote(studentId, subjectId, notes);
      }
    }

    function editName(studentId, currentName) {
      var newName = prompt('Sunting nama murid:', currentName);
      if (newName && newName.trim()) {
        newName = newName.trim().toUpperCase();
        var s = students.find(function(item) { return item.id === studentId; });
        if (s) s.name = newName;
        renderTable();

        if (isGas) {
          google.script.run
            .withSuccessHandler(function() {})
            .updateStudentName(studentId, newName);
        }
      }
    }

    function openAddModal() {
      document.getElementById('addStudentModal').classList.remove('hidden');
    }
    function closeAddModal() {
      document.getElementById('addStudentModal').classList.add('hidden');
    }

    function submitNewStudent() {
      var name = document.getElementById('newStudentName').value;
      if (!name.trim()) return alert('Sila masukkan nama murid');

      var gender = document.getElementById('newStudentGender').value;
      var classGroup = document.getElementById('newStudentClass').value;
      var newStudent = {
        id: 's_' + new Date().getTime(),
        name: name.toUpperCase().trim(),
        gender: gender,
        classGroup: classGroup,
        marks: {
          BM: { tov: 0, etr: 0, ar1: null, ar2: null, actual: null, notes: '' },
          BI: { tov: 0, etr: 0, ar1: null, ar2: null, actual: null, notes: '' },
          MAT: { tov: 0, etr: 0, ar1: null, ar2: null, actual: null, notes: '' },
          SN: { tov: 0, etr: 0, ar1: null, ar2: null, actual: null, notes: '' }
        }
      };

      students.push(newStudent);
      closeAddModal();
      document.getElementById('newStudentName').value = '';
      refreshUI();

      if (isGas) {
        google.script.run
          .withSuccessHandler(function() {})
          .addNewStudent(newStudent);
      }
    }

    function refreshDataFromSheet() {
      if (isGas) {
        document.getElementById('gasStatusBadge').innerText = 'Menyegerak...';
        google.script.run
          .withSuccessHandler(function(dataJson) {
            try {
              students = JSON.parse(dataJson);
              document.getElementById('gasStatusBadge').innerText = 'Tersambung Google Sheet';
            } catch(e) {}
            refreshUI();
          })
          .getStudentsData();
      } else {
        alert('Data diselaraskan secara tempatan');
      }
    }
  </script>
</body>
</html>
`;
}
