import React, { useState } from 'react';
import { Student, AcademicYear, GradeScale } from '../types';
import {
  Cloud,
  FileSpreadsheet,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Github,
  BookOpen,
  Code2,
  Terminal,
  Layers,
  ChevronRight,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import {
  OFFICIAL_GOOGLE_SHEETS_WEBHOOK_URL,
  getSavedWebhookUrl,
  saveWebhookUrl,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  syncDataToGoogleSheets,
  fetchBackupFromGoogleSheets,
} from '../utils/googleSheetsSync';

interface GoogleStorageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  studentsByYear: Record<string, Student[]>;
  years: AcademicYear[];
  activeYearId: string;
  gradeScales: GradeScale[];
  onRestoreData?: (restoredData: {
    studentsByYear: Record<string, Student[]>;
    years: AcademicYear[];
  }) => void;
  onShowToast: (msg: string) => void;
}

const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * SISTEM PEMANTAUAN MARKAH MPT4 - SEKOLAH KEBANGSAAN LAKSIAN BANGGI
 * GOOGLE APPS SCRIPT WEBHOOK API (PENYIMPANAN GOOGLE SHEETS & GOOGLE DRIVE)
 * ============================================================================
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
    sheetData.clear();

    var headers = [
      'No', 'Sesi Akademik', 'Kelas', 'Nama Murid', 'No. MyKid / IC',
      'Subjek', 'TOV', 'ETR', 'Ujian 1', 'Ujian 2', 'Markah Sebenar',
      'Gred MPT4', 'Tahap Penguasaan', 'Perbezaan (Sebenar - ETR)',
      'Status ETR', 'Catatan Guru / Intervensi'
    ];

    sheetData.appendRow(headers);
    formatHeaderRow(sheetData, headers.length);

    var rows = [];
    var rowNo = 1;
    var students = payload.students || [];
    var activeYearLabel = payload.activeYearLabel || 'Sesi 2026';
    var classGroup = payload.classGroup || '4 DINAMIK';

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
          rowNo++, activeYearLabel, student.classGroup || classGroup,
          student.name, student.myKid || '-',
          subjectNames[subjCode] + ' (' + subjCode + ')',
          sm.tov, sm.etr, sm.ar1, sm.ar2, actualVal,
          gradeInfo.grade, gradeInfo.status, diff, etrStatus,
          sm.notes || '-'
        ]);
      });
    });

    if (rows.length > 0) {
      sheetData.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }

    for (var col = 1; col <= headers.length; col++) {
      sheetData.autoResizeColumn(col);
    }

    // 2. Simpan Salinan Penuh ke Tab 'Sandaran_JSON'
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

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  return sheet;
}

function formatHeaderRow(sheet, numCols) {
  var range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground('#1e293b');
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
}

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
}`;

export const GoogleStorageGuideModal: React.FC<GoogleStorageGuideModalProps> = ({
  isOpen,
  onClose,
  students,
  studentsByYear,
  years,
  activeYearId,
  gradeScales,
  onRestoreData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'steps_sheets' | 'steps_github'>('sync');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  // Webhook URL State - Menggunakan URL Rasmi Tersimpan SK Laksian Banggi
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return getSavedWebhookUrl();
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [autoSync, setAutoSync] = useState(() => isAutoSyncEnabled());
  const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncFeedback, setSyncFeedback] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('hc_last_sync_time') || '';
  });

  if (!isOpen) return null;

  const currentYear = years.find((y) => y.id === activeYearId) || years[0];

  const handleSaveWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    saveWebhookUrl(url);
  };

  const handleResetToOfficialUrl = () => {
    handleSaveWebhookUrl(OFFICIAL_GOOGLE_SHEETS_WEBHOOK_URL);
    onShowToast('URL disetkan semula kepada URL Rasmi SK Laksian Banggi.');
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoSyncEnabled(enabled);
    onShowToast(enabled ? 'Auto-Simpan ke Google Sheets diaktifkan.' : 'Auto-Simpan dimatikan.');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    onShowToast('Kod Google Apps Script berjaya disalin!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyGitCommands = () => {
    const gitCommands = `# 1. Inisialisasi Git
git init
git add .
git commit -m "Sistem Pemantauan Markah MPT4 SK Laksian Banggi"

# 2. Tetapkan branch utama
git branch -M main

# 3. Hubungkan ke repositori GitHub anda (gantikan NAMA_PENGGUNA):
# git remote add origin https://github.com/NAMA_PENGGUNA/hcmpt4-sklb.git
# git push -u origin main`;
    navigator.clipboard.writeText(gitCommands);
    setCopiedGit(true);
    onShowToast('Perintah Git berjaya disalin!');
    setTimeout(() => setCopiedGit(false), 3000);
  };

  // Sync / Send Data to Google Sheets (Kunci & Hantar Markah)
  const handleSyncToGoogleSheets = async () => {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      alert('Sila masukkan URL Google Apps Script Web App yang sah terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('Sedang menghantar dan mengunci markah murid ke Google Sheet...');

    try {
      const payload = {
        schoolName: 'SEKOLAH KEBANGSAAN LAKSIAN BANGGI',
        activeYearId,
        activeYearLabel: currentYear.label,
        classGroup: currentYear.classGroup,
        students,
        studentsByYear,
        years,
        gradeScales,
        generatedAt: new Date().toISOString(),
      };

      const res = await syncDataToGoogleSheets(webhookUrl, payload);
      if (res.success) {
        setLastSyncStatus('success');
        if (res.timestamp) setLastSyncTime(res.timestamp);
        setSyncFeedback(res.message);
        onShowToast('Markah murid berjaya dikunci & disimpan ke Google Sheet!');
      } else {
        setLastSyncStatus('error');
        setSyncFeedback(res.message);
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      setLastSyncStatus('error');
      setSyncFeedback(
        'Ralat sambungan ke Google Sheets. Sila pastikan URL Web App mempunyai akses "Anyone" dan cubalah lagi.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull / Fetch Latest Data from Google Sheets (Tarik Semula Markah Tersimpan)
  const handlePullFromGoogleSheets = async () => {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      alert('Sila masukkan URL Google Apps Script Web App yang sah.');
      return;
    }

    setIsPulling(true);
    setSyncFeedback('Sedang memuat turun data headcount tersimpan dari Google Sheet SK Laksian Banggi...');

    try {
      const res = await fetchBackupFromGoogleSheets(webhookUrl);
      if (res.success && res.data) {
        if (onRestoreData && res.data.studentsByYear && res.data.years) {
          onRestoreData({
            studentsByYear: res.data.studentsByYear,
            years: res.data.years,
          });
        }
        setLastSyncStatus('success');
        const nowTime = new Date().toLocaleTimeString('ms-MY', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSyncTime(nowTime);
        localStorage.setItem('hc_last_sync_time', nowTime);
        setSyncFeedback('Data headcount berjaya dimuatkan & disegerakkan daripada Google Sheet.');
        onShowToast('Data murid dari Google Sheet berjaya dimuatkan!');
      } else {
        setLastSyncStatus('error');
        setSyncFeedback(res.message || 'Tiada data sandaran dijumpai dalam Google Sheet.');
      }
    } catch (err: any) {
      console.error('Pull failed:', err);
      setLastSyncStatus('error');
      setSyncFeedback('Ralat memuat turun data dari Google Sheets.');
    } finally {
      setIsPulling(false);
    }
  };

  // Download Full JSON Backup for Google Drive
  const handleDownloadDriveBackup = () => {
    const fullBackup = {
      system: 'Sistem Pemantauan Markah MPT4',
      school: 'SEKOLAH KEBANGSAAN LAKSIAN BANGGI',
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      activeYearId,
      years,
      studentsByYear,
      gradeScales,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Headcount_MPT4_SK_Laksian_Banggi_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Fail sandaran Google Drive (.json) berjaya dimuat turun!');
  };

  // Download Google Sheets Formatted CSV
  const handleDownloadGoogleSheetsCSV = () => {
    const subjects = ['BM', 'BI', 'MAT', 'SN'];
    const headers = [
      'No',
      'Tahun Sesi',
      'Kelas',
      'Nama Murid',
      'No MyKid',
      'Subjek',
      'TOV',
      'ETR',
      'Ujian 1',
      'Ujian 2',
      'Markah Sebenar',
      'Gred MPT4',
      'Status ETR',
      'Catatan',
    ];

    const rows: string[][] = [];
    let count = 1;

    students.forEach((s) => {
      subjects.forEach((subj) => {
        const sm = s.marks[subj as any] || { tov: 0, etr: 0, ar1: 0, ar2: 0, actual: null, notes: '' };
        const actualStr = sm.actual !== null ? sm.actual.toString() : '';
        const etrStatus = sm.actual !== null ? (sm.actual >= sm.etr ? 'Mencapai' : 'Belum Mencapai') : '';
        rows.push([
          String(count++),
          currentYear.label,
          s.classGroup,
          `"${s.name.replace(/"/g, '""')}"`,
          s.myKid || '-',
          subj,
          String(sm.tov),
          String(sm.etr),
          String(sm.ar1),
          String(sm.ar2),
          actualStr,
          sm.actual !== null ? (sm.actual >= 82 ? 'A' : sm.actual >= 66 ? 'B' : sm.actual >= 50 ? 'C' : sm.actual >= 35 ? 'D' : sm.actual >= 20 ? 'E' : 'F') : '-',
          etrStatus,
          `"${(sm.notes || '').replace(/"/g, '""')}"`,
        ]);
      });
    });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Headcount_MPT4_GoogleSheets_${currentYear.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Fail CSV Google Sheets berjaya dimuat turun!');
  };

  // Restore JSON from Google Drive file
  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.studentsByYear && parsed.years && onRestoreData) {
          onRestoreData({
            studentsByYear: parsed.studentsByYear,
            years: parsed.years,
          });
          onShowToast('Data sandaran Google Drive berjaya dipulihkan!');
        } else {
          alert('Format fail sandaran tidak sah. Sila pilih fail .json yang betul.');
        }
      } catch (err) {
        alert('Gagal membaca fail sandaran. Format JSON rosak.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Penyimpanan Google Sheets & Panduan GitHub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Cloud Storage
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Sekolah Kebangsaan Laksian Banggi • Panduan Lengkap Integrasi & Deployment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Integrasi Google Sheets & Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('steps_sheets')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'steps_sheets'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Langkah Masuk Data Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('steps_github')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'steps_github'
                ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Github className="w-4 h-4 text-purple-600" />
            <span>Langkah Deploy Apps di GitHub</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          {/* TAB 1: INTEGRASI GOOGLE SHEETS & DRIVE */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Box 1: Sambungan Langsung Google Sheets Web App (Tersimpan Kekal) */}
              <div className="bg-gradient-to-br from-emerald-50 to-slate-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <span>Penyimpanan Google Sheets Webhook (Cloud SK Laksian Banggi)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                          Aktif & Kekal
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        URL sambungan rasmi telah disimpan terus ke dalam sistem supaya markah tidak hilang atau berubah-ubah.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Disambungkan ke Cloud</span>
                  </span>
                </div>

                {/* URL Input & Quick Controls */}
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span>URL Google Apps Script Web App (Tersimpan):</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleResetToOfficialUrl}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline transition"
                    >
                      Set Semula URL Rasmi
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => handleSaveWebhookUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        onShowToast('URL Webhook berjaya disalin!');
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition border border-slate-300 shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin URL</span>
                    </button>
                  </div>

                  {/* Dual Action Push / Pull Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSyncToGoogleSheets}
                      disabled={isSyncing || isPulling || !webhookUrl}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyimpan ke Cloud...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          <span>Kunci & Simpan ke Google Sheet</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handlePullFromGoogleSheets}
                      disabled={isSyncing || isPulling || !webhookUrl}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
                    >
                      {isPulling ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memuat turun dari Google Sheet...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Muat Semula dari Google Sheet</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Auto-Sync Toggle */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => handleToggleAutoSync(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span className="font-semibold text-slate-800">
                        Segerak Automatik: Simpan ke Google Sheets secara automatik setiap kali markah diubah
                      </span>
                    </label>
                    {lastSyncTime && (
                      <span className="text-[11px] text-slate-500 shrink-0">
                        Terakhir: <strong>{lastSyncTime}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {syncFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      lastSyncStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-medium'
                        : lastSyncStatus === 'error'
                        ? 'bg-rose-50 text-rose-900 border-rose-300 font-medium'
                        : 'bg-blue-50 text-blue-900 border-blue-300'
                    }`}
                  >
                    {lastSyncStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : lastSyncStatus === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    )}
                    <span>{syncFeedback}</span>
                  </div>
                )}
              </div>

              {/* Box 2: Sandaran Google Drive & Eksport Fail */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      Penyimpanan & Sandaran Google Drive
                    </h4>
                    <p className="text-xs text-slate-500">
                      Muat turun fail sandaran untuk disimpan di Google Drive sekolah atau pulihkan data bila-bila masa.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    onClick={handleDownloadDriveBackup}
                    className="p-3.5 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition shadow-sm group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                        <Download className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        Lengkap .JSON
                      </span>
                    </div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 block">
                      Sandaran Penuh Google Drive
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Semua murid rentas tahun ({years.length} sesi)
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadGoogleSheetsCSV}
                    className="p-3.5 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition shadow-sm group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Format .CSV
                      </span>
                    </div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 block">
                      Fail Jadual Google Sheets
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Sesuai dibuka terus dalam Google Sheets
                    </span>
                  </button>

                  <label className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition shadow-sm group cursor-pointer flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Pulihkan
                      </span>
                    </div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 block">
                      Pulihkan dari Google Drive
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Pilih fail sandaran .json untuk restore
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFromFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct External Links to Google */}
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
                  >
                    <span>Buka Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://sheets.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold transition"
                  >
                    <span>Buka Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANGKAH-LANGKAH SETTING MASUK DATA DALAM GOOGLE SHEET */}
          {activeTab === 'steps_sheets' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-1">
                    Panduan Rasmi Penyimpanan Google Sheet (SK Laksian Banggi)
                  </strong>
                  Ikuti 6 langkah mudah di bawah untuk menghubungkan Google Sheets anda supaya markah murid tersimpan secara selamat di akaun Google Drive sekolah anda secara percuma dan automatik.
                </div>
              </div>

              {/* 6 Langkah Bergambar */}
              <div className="space-y-4">
                {/* Langkah 1 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Buka Google Sheets Baharu di Google Drive
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-9">
                    Pergi ke{' '}
                    <a
                      href="https://sheets.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold underline inline-flex items-center gap-1"
                    >
                      sheets.google.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    menggunakan akaun MOE / Google anda. Cipta hamparan kosong baharu dan namakannya:
                    <code className="ml-1.5 px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold font-mono">
                      Headcount MPT4 SK Laksian Banggi
                    </code>.
                  </p>
                </div>

                {/* Langkah 2 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Buka Menu Pelanjutan (Extensions) &rarr; Apps Script
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-9">
                    Pada menu atas Google Sheet, klik <strong>Extensions</strong> (Pelanjutan) &rarr; pilih <strong>Apps Script</strong>. Editor kod Google Apps Script akan terbuka dalam tab baharu.
                  </p>
                </div>

                {/* Langkah 3 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                        3
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm">
                        Salin & Tampal Kod Google Apps Script
                      </h5>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Berjaya Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kod Skrip</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 pl-9 mb-3">
                    Padamkan semua kandungan sedia ada di dalam fail <code>Code.gs</code>, kemudian tampal kod skrip di bawah dan klik ikon <strong>Save (Disket)</strong> atau tekan <code>Ctrl + S</code>.
                  </p>
                  <div className="pl-9">
                    <div className="bg-slate-900 text-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[11px] border border-slate-800">
                      <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
                    </div>
                  </div>
                </div>

                {/* Langkah 4 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      4
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Deploy sebagai 'Web App' (Gunakan)
                    </h5>
                  </div>
                  <div className="text-xs text-slate-600 pl-9 space-y-1.5">
                    <p>
                      Di sudut atas kanan Apps Script, klik butang biru <strong>Deploy</strong> &rarr; pilih <strong>New deployment</strong>.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 font-medium text-slate-700">
                      <li>Klik ikon gear (Select type) &rarr; pilih <strong>Web app</strong>.</li>
                      <li>Description: <code className="bg-slate-200 px-1 rounded">Headcount API</code></li>
                      <li>Execute as: <strong>Me (emel anda)</strong></li>
                      <li>
                        Who has access: <strong className="text-rose-600 font-bold">Anyone</strong> (Wajib pilih <em>Anyone</em> supaya sistem dapat menyimpan data markah).
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Langkah 5 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      5
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Luluskan Akses (Authorize Access) & Salin Web App URL
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-9">
                    Klik butang <strong>Deploy</strong>. Jika skrin kebenaran muncul: Klik <em>Authorize access</em> &rarr; Pilih akaun Google anda &rarr; Klik <em>Advanced</em> &rarr; Klik <em>Go to Headcount API (unsafe)</em> &rarr; Klik <em>Allow</em>. Kemudian salin <strong>Web app URL</strong> yang terhasil (contoh: <code>https://script.google.com/macros/s/.../exec</code>).
                  </p>
                </div>

                {/* Langkah 6 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                      6
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm text-emerald-800">
                      Tampal URL & Mula Simpan Data Secara Langsung!
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-9">
                    Kembali ke aplikasi ini pada tab <strong>Integrasi Google Sheets & Drive</strong>, masukkan URL tadi ke ruangan Webhook, dan klik <strong>Simpan ke Google Sheet</strong>. Buka Google Sheet anda, anda akan melihat tab <code>Headcount_MPT4</code> dan <code>Sandaran_JSON</code> dijana secara automatik dengan senarai markah murid!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LANGKAH-LANGKAH APPS DI GITHUB & GITHUB PAGES */}
          {activeTab === 'steps_github' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 flex items-start gap-3">
                <Github className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-1">
                    Panduan Hosting & Muat Naik Apps di GitHub & GitHub Pages
                  </strong>
                  Dengan meletakkan aplikasi ini di GitHub, aplikasi sistem pemantauan markah MPT4 SK Laksian Banggi boleh diakses secara dalam talian 24/7 oleh semua guru melalui komputer atau telefon pintar secara percuma tanpa kos hosting.
                </div>
              </div>

              <div className="space-y-4">
                {/* Langkah 1 GitHub */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Cipta Repositori Baharu di GitHub.com
                    </h5>
                  </div>
                  <div className="text-xs text-slate-600 pl-9 space-y-1">
                    <p>
                      Buka laman web{' '}
                      <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 font-bold underline inline-flex items-center gap-1"
                      >
                        GitHub.com <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      dan log masuk.
                    </p>
                    <p>
                      Klik butang hijau <strong>New</strong> (Create repository).
                    </p>
                    <p>
                      Masukkan nama: <code className="bg-slate-200 px-1 rounded font-bold">hcmpt4-sklb</code>, pilih <strong>Public</strong>, dan jangan tandakan "Add a README file". Klik <strong>Create repository</strong>.
                    </p>
                  </div>
                </div>

                {/* Langkah 2 GitHub */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm">
                        Muat Naik Kod ke Repositori GitHub
                      </h5>
                    </div>
                    <button
                      onClick={handleCopyGitCommands}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                    >
                      {copiedGit ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Perintah Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Perintah Git</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 pl-9 space-y-2">
                    <p>
                      <strong>Kaedah A (Terminal / Git Bash - Disyorkan):</strong>
                    </p>
                    <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[11px] border border-slate-800 space-y-1">
                      <p className="text-slate-400"># Masukkan perintah ini dalam terminal projek:</p>
                      <p className="text-emerald-400">git init</p>
                      <p className="text-emerald-400">git add .</p>
                      <p className="text-emerald-400">git commit -m "Sistem Pemantauan Markah MPT4 SK Laksian Banggi"</p>
                      <p className="text-emerald-400">git branch -M main</p>
                      <p className="text-indigo-300">git remote add origin https://github.com/USERNAME/hcmpt4-sklb.git</p>
                      <p className="text-emerald-400">git push -u origin main</p>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      <strong>Kaedah B (Muat Naik Terus):</strong> Di halaman utama repositori GitHub anda, klik pautan <em>"uploading an existing file"</em>, pilih semua fail kod projek, dan klik <em>Commit changes</em>.
                    </p>
                  </div>
                </div>

                {/* Langkah 3 GitHub Actions */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                      3
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">
                      Aktifkan GitHub Pages (Auto-Deploy melalui GitHub Actions)
                    </h5>
                  </div>
                  <div className="text-xs text-slate-600 pl-9 space-y-2">
                    <p>
                      Fail alur kerja automatik <code>.github/workflows/deploy.yml</code> telah sedia dimasukkan di dalam projek ini dengan konfigurasi khas!
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 font-medium text-slate-700">
                      <li>Di repositori GitHub anda, klik tab <strong>Settings</strong> di bahagian atas.</li>
                      <li>Di menu tepi kiri, klik <strong>Pages</strong>.</li>
                      <li>Di bawah bahagian <em>Build and deployment</em> &rarr; <em>Source</em>: Tukar daripada "Deploy from a branch" kepada <strong>GitHub Actions</strong>.</li>
                      <li>
                        Selesai! GitHub Actions akan secara automatik membina dan menerbitkan aplikasi ke laman web:
                        <code className="block mt-1 bg-purple-100 text-purple-900 px-2 py-1 rounded font-bold font-mono">
                          https://[USERNAME].github.io/hcmpt4-sklb/
                        </code>
                      </li>
                    </ol>

                    {/* Nota Pembetulan Paparan Kosong (Blank Screen Solved) */}
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-[11px] space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Penyelesaian Masalah Paparan Kosong (Blank Screen) Telah Dibaiki:</span>
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                        <li><strong>Base Path Relatif (<code>base: './'</code>):</strong> Konfigurasi Vite telah ditetapkan ke laluan relatif supaya skrip JS dan CSS dimuatkan terus dari subfolder repositori GitHub tanpa ralat 404.</li>
                        <li><strong>Fail <code>.nojekyll</code>:</strong> Dicipta secara automatik semasa deploy supaya enjin GitHub Pages tidak menyekat fail aset Vite.</li>
                        <li><strong>Salinan <code>404.html</code>:</strong> Memastikan aplikasi tidak menjadi putih sekiranya halaman disegarkan semula (refresh).</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Langkah 4 Vercel */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                      4
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm text-emerald-800">
                      Alternatif Terpantas: Sambungkan GitHub ke Vercel (1 Minit Sahaja)
                    </h5>
                  </div>
                  <div className="text-xs text-slate-600 pl-9 space-y-1.5">
                    <p>
                      Jika anda mahukan URL pantas dan moden tanpa sebarang tetapan tambahan:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 font-medium text-slate-700">
                      <li>
                        Buka{' '}
                        <a
                          href="https://vercel.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 font-bold underline"
                        >
                          Vercel.com
                        </a>{' '}
                        dan log masuk dengan akaun GitHub anda.
                      </li>
                      <li>Klik butang <strong>Add New...</strong> &rarr; <strong>Project</strong>.</li>
                      <li>Pilih repositori <code>hcmpt4-sklb</code> tadi dan klik <strong>Import</strong>.</li>
                      <li>Klik <strong>Deploy</strong> tanpa mengubah sebarang tetapan.</li>
                      <li>
                        Aplikasi anda kini aktif secara langsung di domain percuma seperti{' '}
                        <code className="bg-emerald-100 text-emerald-900 px-1 rounded font-bold">
                          sklaksian-headcount.vercel.app
                        </code>{' '}
                        dengan sijil keselamatan SSL automatik!
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Penyimpanan selamat: Google Sheets, Google Drive, & GitHub SK Laksian Banggi.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
