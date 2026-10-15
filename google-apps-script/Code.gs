/**
 * ============================================================================
 * SISTEM PEMANTAUAN MARKAH MPT4 - SEKOLAH KEBANGSAAN LAKSIAN BANGGI
 * GOOGLE APPS SCRIPT WEBHOOK API (PENYIMPANAN GOOGLE SHEETS & GOOGLE DRIVE)
 * ============================================================================
 * 
 * Panduan Penggunaan:
 * 1. Buka Google Sheets baharu di Google Drive anda.
 * 2. Pergi ke menu Extensions -> Apps Script.
 * 3. Padam semua kod asal dan tampal keseluruhan kod ini ke dalam Code.gs.
 * 4. Klik ikon Save (Disket).
 * 5. Klik Deploy -> New deployment -> Pilih jenis 'Web app'.
 *    - Description: Sistem Headcount MPT4 SK Laksian Banggi
 *    - Execute as: Me (emel anda)
 *    - Who has access: Anyone (PENTING)
 * 6. Klik Deploy, luluskan akses (Authorize), dan salin Web App URL.
 * 7. Masukkan URL tersebut ke dalam aplikasi Headcount MPT4.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Tiada data diterima dalam permintaan POST.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Simpan Data Murid & Markah ke Tab 'Headcount_MPT4'
    var sheetData = getOrCreateSheet(ss, 'Headcount_MPT4');
    sheetData.clear(); // Bersihkan rekod lama untuk elak pertindihan

    // Header Rasmi
    var headers = [
      'No',
      'Sesi Akademik',
      'Kelas',
      'Nama Murid',
      'No. MyKid / IC',
      'Subjek',
      'TOV',
      'ETR',
      'Ujian 1',
      'Ujian 2',
      'Markah Sebenar',
      'Gred MPT4',
      'Tahap Penguasaan',
      'Perbezaan (Sebenar - ETR)',
      'Status ETR',
      'Catatan Guru / Intervensi'
    ];

    sheetData.appendRow(headers);
    formatHeaderRow(sheetData, headers.length);

    var rows = [];
    var rowNo = 1;

    // Pastikan payload mempunyai senarai murid
    var students = payload.students || [];
    var activeYearLabel = payload.activeYearLabel || 'Sesi 2026';
    var classGroup = payload.classGroup || '4 BESTARI';

    students.forEach(function(student) {
      var marks = student.marks || {};
      var subjects = ['BM', 'BI', 'MAT', 'SN'];
      var subjectNames = {
        'BM': 'Bahasa Melayu',
        'BI': 'Bahasa Inggeris',
        'MAT': 'Matematik',
        'SN': 'Sains'
      };

      subjects.forEach(function(subjCode) {
        var sm = marks[subjCode] || { tov: 0, etr: 0, ar1: 0, ar2: 0, actual: null, notes: '' };
        var actualVal = sm.actual !== null ? sm.actual : '';
        var diff = sm.actual !== null ? (sm.actual - sm.etr).toFixed(1) : '';
        
        var gradeInfo = calculateGradeMPT4(sm.actual);
        var etrStatus = '';
        if (sm.actual !== null) {
          etrStatus = sm.actual >= sm.etr ? 'Mencapai ETR' : 'Belum Mencapai ETR';
        }

        rows.push([
          rowNo++,
          activeYearLabel,
          student.classGroup || classGroup,
          student.name,
          student.myKid || '-',
          subjectNames[subjCode] + ' (' + subjCode + ')',
          sm.tov,
          sm.etr,
          sm.ar1,
          sm.ar2,
          actualVal,
          gradeInfo.grade,
          gradeInfo.status,
          diff,
          etrStatus,
          sm.notes || '-'
        ]);
      });
    });

    if (rows.length > 0) {
      sheetData.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }

    // Auto-fit lajur
    for (var col = 1; col <= headers.length; col++) {
      sheetData.autoResizeColumn(col);
    }

    // 2. Simpan Raw Data ke Tab 'Sandaran_JSON' untuk restore pantas
    var sheetBackup = getOrCreateSheet(ss, 'Sandaran_JSON');
    sheetBackup.clear();
    sheetBackup.appendRow(['Tarikh Sandaran', 'Data Penuh JSON']);
    formatHeaderRow(sheetBackup, 2);
    sheetBackup.appendRow([new Date().toLocaleString('ms-MY'), JSON.stringify(payload)]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data berjaya disimpan ke Google Sheet SK Laksian Banggi.',
      timestamp: new Date().toISOString(),
      studentCount: students.length,
      rowCount: rows.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetBackup = ss.getSheetByName('Sandaran_JSON');
    
    if (!sheetBackup || sheetBackup.getLastRow() < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'empty',
        message: 'Tiada data sandaran dijumpai dalam Google Sheet ini.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var jsonString = sheetBackup.getRange(2, 2).getValue();
    var payload = JSON.parse(jsonString);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: payload
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper: Cipta sheet jika tiada
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// Helper: Format gaya kepala lajur (Header styling)
function formatHeaderRow(sheet, numCols) {
  var range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground('#1e293b'); // Dark Slate
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setFontFamily('Arial');
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
}

// Helper: Skala Gred MPT4 Piawai
function calculateGradeMPT4(mark) {
  if (mark === null || mark === undefined || mark === '') {
    return { grade: '-', status: 'Belum Dinilai' };
  }
  var m = Number(mark);
  if (m >= 82) return { grade: 'A', status: 'Penguasaan cemerlang' };
  if (m >= 66) return { grade: 'B', status: 'Penguasaan kepujian' };
  if (m >= 50) return { grade: 'C', status: 'Penguasaan baik' };
  if (m >= 35) return { grade: 'D', status: 'Penguasaan memuaskan' };
  if (m >= 20) return { grade: 'E', status: 'Penguasaan minimum' };
  return { grade: 'F', status: 'Belum mencapai penguasaan minimum' };
}
