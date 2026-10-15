import React, { useState } from 'react';
import { Student, SubjectId, SubjectMarks, AcademicYear, GradeScale } from '../types';
import {
  SUBJECTS,
  calculateAverage,
  calculateGPK,
  getGradeInfo,
  getAchievementBadge,
  isPass,
} from '../utils/headcountUtils';
import {
  Printer,
  Download,
  ArrowLeft,
  FileText,
  Sliders,
  Calendar,
  Layers,
  BarChart3,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  School,
  UserCheck,
  Building2,
} from 'lucide-react';

export type PrintReportType = 'hc3_hc4' | 'matrix' | 'analytics' | 'intervention' | 'all';

interface ExportPrintModalProps {
  students: Student[];
  years: AcademicYear[];
  studentsByYear: Record<string, Student[]>;
  activeYearId: string;
  gradeScales: GradeScale[];
  onOpenGradeSettings?: () => void;
  onBack: () => void;
  onExportCSV: () => void;
}

export const ExportPrintModal: React.FC<ExportPrintModalProps> = ({
  students,
  years,
  studentsByYear,
  activeYearId,
  gradeScales,
  onOpenGradeSettings,
  onBack,
  onExportCSV,
}) => {
  const [selectedReport, setSelectedReport] = useState<PrintReportType>('hc3_hc4');
  const [selectedSubj, setSelectedSubj] = useState<SubjectId | 'ALL'>('ALL');
  const [reportYearId, setReportYearId] = useState<string>(activeYearId);
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [noBackgroundPrint, setNoBackgroundPrint] = useState<boolean>(true);

  const handleSelectReport = (rep: PrintReportType) => {
    setSelectedReport(rep);
    if (rep === 'hc3_hc4' || rep === 'matrix') {
      setPageOrientation('landscape');
    } else if (rep === 'all' || rep === 'intervention') {
      setPageOrientation('portrait');
    }
  };

  // Editable headers for official documents
  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem('hc_school_name') || 'SEKOLAH KEBANGSAAN LAKSIAN BANGGI';
  });
  const [teacherName, setTeacherName] = useState<string>(() => {
    return localStorage.getItem('hc_teacher_name') || 'GURU MATA PELAJARAN / KELAS';
  });
  const [headmasterName, setHeadmasterName] = useState<string>(() => {
    return localStorage.getItem('hc_headmaster_name') || 'GURU BESAR / PK PENTADBIRAN';
  });

  const handleUpdateSchoolInfo = (key: string, val: string, setter: (s: string) => void) => {
    setter(val);
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      // ignore
    }
  };

  const currentYearObj = years.find((y) => y.id === reportYearId) || years[0];
  const activeStudents = studentsByYear[reportYearId] || students;
  const currentSubjObj = SUBJECTS.find((s) => s.id === selectedSubj);

  const handlePrint = () => {
    window.print();
  };

  // Helper stats for current subject
  const getSubjectMarksList = (stList: Student[], subj: SubjectId | 'ALL', type: 'tov' | 'etr' | 'ar1' | 'ar2' | 'actual') => {
    if (subj === 'ALL') {
      return stList.map((s) => calculateAverage(Object.values(s.marks).map((m) => m[type])));
    }
    return stList.map((s) => s.marks[subj][type]);
  };

  const tovList = getSubjectMarksList(activeStudents, selectedSubj, 'tov');
  const etrList = getSubjectMarksList(activeStudents, selectedSubj, 'etr');
  const actualList = getSubjectMarksList(activeStudents, selectedSubj, 'actual');

  const avgTov = calculateAverage(tovList);
  const avgEtr = calculateAverage(etrList);
  const avgActual = calculateAverage(actualList);

  const gpkTov = calculateGPK(tovList, gradeScales);
  const gpkEtr = calculateGPK(etrList, gradeScales);
  const gpkActual = calculateGPK(actualList, gradeScales);

  const passCount = actualList.filter((m) => isPass(m, gradeScales)).length;
  const passPct = activeStudents.length > 0 ? Math.round((passCount / activeStudents.length) * 100) : 0;

  // Grade distributions (A to F)
  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  actualList.forEach((m) => {
    const g = getGradeInfo(m, gradeScales).grade;
    gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
  });

  return (
    <div className="space-y-6 mb-12">
      {/* ========================================================
          1. TOP ACTION & NAVIGATION BAR (Hidden during printing)
         ======================================================== */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-5 print:hidden">
        
        {/* Top Title & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              title="Kembali ke Jadual"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span>Pusat Cetakan & Pelaporan Rasmi</span>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Format KPM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih format laporan cetakan, sesuaikan parameter dokumen dan cetak terus atau simpan ke PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenGradeSettings && (
              <button
                type="button"
                onClick={onOpenGradeSettings}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Ubah Gred MPT4</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Eksport CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan (Print / PDF)</span>
            </button>
          </div>
        </div>

        {/* 2. MENU PILIHAN CETAKAN (5 Cards) */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Pilih Jenis Laporan Cetakan:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Option 1: HC3 / HC4 */}
            <button
              type="button"
              onClick={() => handleSelectReport('hc3_hc4')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedReport === 'hc3_hc4'
                  ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/30'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FileText className={`w-5 h-5 ${selectedReport === 'hc3_hc4' ? 'text-blue-400' : 'text-slate-400'}`} />
                {selectedReport === 'hc3_hc4' && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">Laporan HC3 / HC4</strong>
                <span className="text-[10px] text-slate-400">Borang Headcount & Rumusan Panitia</span>
              </div>
            </button>

            {/* Option 2: Matriks Rentas Tahun */}
            <button
              type="button"
              onClick={() => handleSelectReport('matrix')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedReport === 'matrix'
                  ? 'bg-emerald-600/20 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className={`w-5 h-5 ${selectedReport === 'matrix' ? 'text-emerald-400' : 'text-slate-400'}`} />
                {selectedReport === 'matrix' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">Matriks Rentas Tahun</strong>
                <span className="text-[10px] text-slate-400">Longitudinal Kohort 2026+</span>
              </div>
            </button>

            {/* Option 3: Analisis & Graf Matriks */}
            <button
              type="button"
              onClick={() => handleSelectReport('analytics')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedReport === 'analytics'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/30'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className={`w-5 h-5 ${selectedReport === 'analytics' ? 'text-indigo-400' : 'text-slate-400'}`} />
                {selectedReport === 'analytics' && <span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">Analisis & Graf Matriks</strong>
                <span className="text-[10px] text-slate-400">Carta Taburan Gred & KPI</span>
              </div>
            </button>

            {/* Option 4: Pelan Intervensi Murid */}
            <button
              type="button"
              onClick={() => handleSelectReport('intervention')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedReport === 'intervention'
                  ? 'bg-amber-600/20 border-amber-500 text-white ring-2 ring-amber-500/30'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <BookOpen className={`w-5 h-5 ${selectedReport === 'intervention' ? 'text-amber-400' : 'text-slate-400'}`} />
                {selectedReport === 'intervention' && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">Pelan Intervensi Murid</strong>
                <span className="text-[10px] text-slate-400">Sasaran, Isu & Bimbingan Berfokus</span>
              </div>
            </button>

            {/* Option 5: Cetakan Keseluruhan (All in 1 Dossier) */}
            <button
              type="button"
              onClick={() => handleSelectReport('all')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedReport === 'all'
                  ? 'bg-purple-600/25 border-purple-400 text-white ring-2 ring-purple-500/40'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Layers className={`w-5 h-5 ${selectedReport === 'all' ? 'text-purple-300' : 'text-slate-400'}`} />
                {selectedReport === 'all' && <span className="w-2 h-2 rounded-full bg-purple-300"></span>}
              </div>
              <div>
                <strong className="text-xs font-bold block text-white">Cetakan Keseluruhan</strong>
                <span className="text-[10px] text-slate-400">Dossier Lengkap Semua Laporan</span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. TETAPAN SAIZ A4 & MOD CETAKAN TANPA BACKGROUND (INK-SAVER) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          {/* Pilihan Orientasi A4 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Orientasi Kertas A4:
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Piawai Rasmi A4 (210 × 297 mm)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPageOrientation('portrait')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  pageOrientation === 'portrait'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span>A4 Potret (Tegak)</span>
                {pageOrientation === 'portrait' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
              </button>
              <button
                type="button"
                onClick={() => setPageOrientation('landscape')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  pageOrientation === 'landscape'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span>A4 Landskap (Lebar)</span>
                {pageOrientation === 'landscape' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {pageOrientation === 'landscape'
                ? '✓ Mod Landskap aktif: Sangat disyorkan untuk jadual lebar HC3/HC4 & Matriks rentas tahun supaya tiada lajur terpotong.'
                : '✓ Mod Potret aktif: Sesuai untuk cetakan dokumen ringkas, muka hadapan (cover), dan laporan intervensi.'}
            </p>
          </div>

          {/* Pilihan Mod Cetakan Tanpa Background */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Mod Cetakan (Latar Belakang):
              </span>
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                Piawai Pejabat & Sekolah
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNoBackgroundPrint(true)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  noBackgroundPrint
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span>Tanpa Background (Jimat Dakwat)</span>
                {noBackgroundPrint && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
              </button>
              <button
                type="button"
                onClick={() => setNoBackgroundPrint(false)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  !noBackgroundPrint
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-500/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span>Warna Penuh</span>
                {!noBackgroundPrint && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {noBackgroundPrint
                ? '✓ Mesra Pencetak: Warna latar dibuang secara automatik. Anda boleh cetak terus tanpa perlu menanda kotak "Background graphics".'
                : 'Mencetak bersama warna latar penuh (perlu menanda "Background graphics" dalam dialog cetak browser).'}
            </p>
          </div>
        </div>

        {/* 4. Penapis Dokumen & Maklumat Pengesahan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 text-xs">
          {/* Sesi Akademik */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Sesi Akademik:
            </label>
            <select
              value={reportYearId}
              onChange={(e) => setReportYearId(e.target.value)}
              className="w-full bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mata Pelajaran (kecuali Matriks & Intervensi all) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Mata Pelajaran:
            </label>
            <select
              value={selectedSubj}
              onChange={(e) => setSelectedSubj(e.target.value as SubjectId | 'ALL')}
              className="w-full bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              <option value="ALL">Keseluruhan (Purata Matriks)</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Nama Sekolah (Boleh Sunting) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Nama Sekolah (Untuk Muka Surat):
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => handleUpdateSchoolInfo('hc_school_name', e.target.value, setSchoolName)}
              placeholder="Contoh: SK LAKSIAN BANGGI"
              className="w-full bg-slate-900 text-white font-medium px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Dynamic @page CSS rule for selected A4 orientation */}
      <style>{`
        @media print {
          @page {
            size: A4 ${pageOrientation} !important;
            margin: ${pageOrientation === 'landscape' ? '8mm 8mm 8mm 8mm' : '8mm 8mm 10mm 8mm'} !important;
          }
        }
      `}</style>

      {/* ========================================================
          DOCUMENT CANVAS / PAPARAN DOKUMEN CETAK RASMI
         ======================================================== */}
      <div className={`bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-300 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-900 ${noBackgroundPrint ? 'print-no-bg' : ''} ${pageOrientation === 'landscape' ? 'print-landscape' : ''}`}>
        
        {/* ========================================================
            CASE A: CETAKAN KESELURUHAN (Full Dossier Cover + Sections)
           ======================================================== */}
        {selectedReport === 'all' && (
          <div className="space-y-12 print:space-y-0">
            {/* Official Cover Page (Guaranteed 1 A4 Page) */}
            <div className="cover-page-a4 flex flex-col justify-between border-4 border-double border-slate-900 print:border-black p-6 sm:p-8 print:p-4 text-center break-after-page print:break-after-page print:bg-white box-border print:overflow-hidden min-h-[720px] print:min-h-0 print:h-[268mm] print:max-h-[268mm]">
              <div>
                <div className="flex items-center justify-center mb-2 print:mb-1">
                  <img
                    src="https://i.postimg.cc/KjqVvWNN/LOGO-SEK-2026-W.png"
                    alt="Logo Sekolah Kebangsaan Laksian Banggi"
                    className="w-14 h-14 sm:w-16 sm:h-16 print:w-12 print:h-12 object-contain mx-auto"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700 print:text-black">
                  KEMENTERIAN PENDIDIKAN MALAYSIA
                </p>
                <p className="text-xs sm:text-sm print:text-xs font-extrabold uppercase tracking-wider text-slate-900 print:text-black mt-0.5">
                  JABATAN PENDIDIKAN NEGERI • PEJABAT PENDIDIKAN DAERAH
                </p>
                <div className="w-20 h-0.5 bg-slate-900 print:bg-black mx-auto my-2.5 print:my-1.5"></div>
                <h1 className="text-lg sm:text-2xl print:text-lg font-black uppercase tracking-tight text-slate-900 print:text-black max-w-xl mx-auto leading-tight">
                  DOSSIER LENGKAP PENGURUSAN HEADCOUNT & MATRIKS PEMBELAJARAN
                </h1>
                <h2 className="text-xs sm:text-sm print:text-xs font-bold text-slate-800 print:text-black mt-1 uppercase">
                  TAHUN 4 (MPT4) • {currentYearObj.label.toUpperCase()}
                </h2>
              </div>

              {/* Center Crest / Box */}
              <div className="my-2.5 sm:my-3.5 print:my-1.5 bg-slate-50 print:bg-white border-2 border-slate-800 print:border-black p-3 sm:p-4 print:p-2.5 rounded-xl max-w-md mx-auto text-left space-y-1.5 print:space-y-1">
                <div className="flex items-center gap-2 border-b border-slate-300 print:border-black pb-1.5 print:pb-1">
                  <School className="w-4 h-4 text-slate-800 print:text-black" />
                  <span className="font-black text-xs sm:text-sm print:text-xs uppercase text-slate-900 print:text-black">{schoolName}</span>
                </div>
                <div className="text-xs print:text-[8pt] space-y-1 print:space-y-0.5 text-slate-800 print:text-black">
                  <p><span className="text-slate-500 print:text-black font-semibold">KELAS / TINGKATAN:</span> <strong className="font-bold">{currentYearObj.classGroup}</strong></p>
                  <p><span className="text-slate-500 print:text-black font-semibold">JUMLAH MURID:</span> <strong className="font-bold">{activeStudents.length} Orang</strong></p>
                  <p><span className="text-slate-500 print:text-black font-semibold">MATA PELAJARAN:</span> <strong className="font-bold">BAHASA MELAYU, BAHASA INGGERIS, MATEMATIK, SAINS</strong></p>
                  <p><span className="text-slate-500 print:text-black font-semibold">SKALA PENGGREDAN:</span> <strong className="font-bold">MATRIKS PEMBELAJARAN TAHUN 4 (MPT4)</strong></p>
                  <p><span className="text-slate-500 print:text-black font-semibold">TARIKH JANAAN:</span> <strong className="font-bold">{new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                </div>
              </div>

              {/* Table of contents inside dossier */}
              <div className="max-w-md mx-auto text-left border border-slate-400 print:border-black p-2.5 sm:p-3 print:p-2 rounded-lg bg-slate-100 print:bg-white text-xs print:text-[7.5pt] my-2 print:my-1">
                <p className="font-bold uppercase tracking-wider text-slate-900 print:text-black mb-1.5 border-b border-slate-300 print:border-black pb-1">
                  Kandungan Dokumen:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-700 print:text-black font-medium text-[11px] print:text-[7.5pt]">
                  <li>Bahagian I: Skala Gred Matriks Pembelajaran Tahun 4 (MPT4)</li>
                  <li>Bahagian II: Borang Headcount HC3 & Rumusan Panitia HC4</li>
                  <li>Bahagian III: Matriks Headcount Rentas Tahun (Longitudinal 2026+)</li>
                  <li>Bahagian IV: Analisis Prestasi & Visualisasi Grafik Matriks</li>
                  <li>Bahagian V: Pelan Intervensi Murid Mengikut Kelompok Bimbingan</li>
                  <li>Bahagian VI: Perakuan & Pengesahan Dokumen</li>
                </ol>
              </div>

              {/* Signatures on cover */}
              <div className="grid grid-cols-2 gap-6 text-xs print:text-[8pt] pt-3 sm:pt-4 print:pt-1.5 border-t-2 border-slate-900 print:border-black print:text-black">
                <div className="text-left">
                  <p className="text-slate-500 print:text-black font-medium">Disediakan Oleh:</p>
                  <div className="h-7 sm:h-8 print:h-5"></div>
                  <div className="border-b border-slate-900 print:border-black w-36 sm:w-44 print:w-36 mb-1"></div>
                  <p className="font-bold uppercase text-slate-900 print:text-black">{teacherName}</p>
                  <p className="text-slate-600 print:text-black">Penyelaras Headcount / Guru Kelas</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 print:text-black font-medium">Disahkan Oleh:</p>
                  <div className="h-7 sm:h-8 print:h-5"></div>
                  <div className="border-b border-slate-900 print:border-black w-36 sm:w-44 print:w-36 ml-auto mb-1"></div>
                  <p className="font-bold uppercase text-slate-900 print:text-black">{headmasterName}</p>
                  <p className="text-slate-600 print:text-black">Guru Besar / PK Pentadbiran</p>
                </div>
              </div>
            </div>

            {/* Section 1: Skala Gred MPT4 */}
            <div className="pt-6 break-after-page">
              <SectionHeader
                sectionNo="BAHAGIAN I"
                title="PENETAPAN SKALA GRED MATRIKS PEMBELAJARAN TAHUN 4 (MPT4)"
                schoolName={schoolName}
                yearLabel={currentYearObj.label}
              />
              <GradeScaleTable gradeScales={gradeScales} />
            </div>

            {/* Section 2: HC3 / HC4 */}
            <div className="pt-6 break-after-page">
              <SectionHeader
                sectionNo="BAHAGIAN II"
                title={`BORANG HEADCOUNT HC3 & RUMUSAN HC4 (${selectedSubj === 'ALL' ? 'KESELURUHAN' : currentSubjObj?.name.toUpperCase()})`}
                schoolName={schoolName}
                yearLabel={currentYearObj.label}
              />
              <HC4SummaryTable
                students={activeStudents}
                gradeScales={gradeScales}
                selectedSubj={selectedSubj}
              />
              <div className="mt-6">
                <h4 className="text-xs font-black uppercase text-slate-900 mb-2">
                  Borang Headcount Terperinci Setiap Murid (HC3):
                </h4>
                <HC3DetailTable
                  students={activeStudents}
                  selectedSubj={selectedSubj}
                  gradeScales={gradeScales}
                />
              </div>
            </div>

            {/* Section 3: Matriks Rentas Tahun */}
            <div className="pt-6 break-after-page">
              <SectionHeader
                sectionNo="BAHAGIAN III"
                title="MATRIKS HEADCOUNT RENTAS TAHUN (LONGITUDINAL KOHORT 2026+)"
                schoolName={schoolName}
                yearLabel={currentYearObj.label}
              />
              <MultiYearMatrixPrintSection
                years={years}
                studentsByYear={studentsByYear}
                gradeScales={gradeScales}
              />
            </div>

            {/* Section 4: Analisis & Graf Matriks */}
            <div className="pt-6 break-after-page">
              <SectionHeader
                sectionNo="BAHAGIAN IV"
                title="ANALISIS PRESTASI & GRAFIK MATRIKS PEMBELAJARAN"
                schoolName={schoolName}
                yearLabel={currentYearObj.label}
              />
              <AnalyticsPrintSection
                students={activeStudents}
                selectedSubj={selectedSubj}
                gradeScales={gradeScales}
              />
            </div>

            {/* Section 5: Pelan Intervensi Murid */}
            <div className="pt-6">
              <SectionHeader
                sectionNo="BAHAGIAN V"
                title="PELAN INTERVENSI MURID MENGIKUT KELOMPOK BIMBINGAN"
                schoolName={schoolName}
                yearLabel={currentYearObj.label}
              />
              <InterventionPrintSection
                students={activeStudents}
                gradeScales={gradeScales}
              />
              <SignaturesFooter
                teacherName={teacherName}
                headmasterName={headmasterName}
                yearLabel={currentYearObj.label}
                classGroup={currentYearObj.classGroup}
              />
            </div>
          </div>
        )}

        {/* ========================================================
            CASE B: LAPORAN HC3 / HC4
           ======================================================== */}
        {selectedReport === 'hc3_hc4' && (
          <div>
            <DocumentHeader
              title={`BORANG HEADCOUNT & ANALISIS GRED (HC3 / HC4)`}
              subtitle={`MATA PELAJARAN: ${selectedSubj === 'ALL' ? 'KESELURUHAN (PURATA)' : currentSubjObj?.name.toUpperCase()} • KELAS: ${currentYearObj.classGroup}`}
              schoolName={schoolName}
              yearLabel={currentYearObj.label}
            />

            {/* Summary KPI Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Jumlah Murid:</span>
                <strong className="text-slate-900 font-black text-sm">{activeStudents.length} Orang</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">GPK Sebenar:</span>
                <strong className="text-blue-900 font-black text-sm">{gpkActual} (TOV: {gpkTov})</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">% Menguasai (A–E):</span>
                <strong className="text-emerald-900 font-black text-sm">{passPct}% ({passCount}/{activeStudents.length})</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Purata Markah:</span>
                <strong className="text-slate-900 font-black text-sm">{avgActual}% (ETR: {avgEtr}%)</strong>
              </div>
            </div>

            {/* HC4 Rumusan Panitia Table */}
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase text-slate-900 mb-2 border-b border-slate-900 pb-1 flex items-center justify-between">
                <span>RUMUSAN HEADCOUNT KELAS & PANITIA (HC4):</span>
                <span className="text-[10px] text-slate-600 font-semibold">Skala MPT4: A (82-100%), B (66-81%), C (50-65%), D (35-49%), E (20-34%), F (0-19%)</span>
              </h3>
              <HC4SummaryTable
                students={activeStudents}
                gradeScales={gradeScales}
                selectedSubj={selectedSubj}
              />
            </div>

            {/* HC3 Borang Headcount Individu */}
            <div className="mb-8">
              <h3 className="text-xs font-black uppercase text-slate-900 mb-2 border-b border-slate-900 pb-1">
                SENARAI HEADCOUNT & SASARAN MURID (HC3):
              </h3>
              <HC3DetailTable
                students={activeStudents}
                selectedSubj={selectedSubj}
                gradeScales={gradeScales}
              />
            </div>

            <SignaturesFooter
              teacherName={teacherName}
              headmasterName={headmasterName}
              yearLabel={currentYearObj.label}
              classGroup={currentYearObj.classGroup}
            />
          </div>
        )}

        {/* ========================================================
            CASE C: MATRIKS RENTAS TAHUN
           ======================================================== */}
        {selectedReport === 'matrix' && (
          <div>
            <DocumentHeader
              title="MATRIKS HEADCOUNT RENTAS TAHUN (2026 HINGGA SETERUSNYA)"
              subtitle={`ANALISIS LONGITUDINAL KOHORT MURID • SEKOLAH: ${schoolName}`}
              schoolName={schoolName}
              yearLabel="SESI 2026 – SETERUSNYA"
            />

            <MultiYearMatrixPrintSection
              years={years}
              studentsByYear={studentsByYear}
              gradeScales={gradeScales}
            />

            <div className="mt-8">
              <SignaturesFooter
                teacherName={teacherName}
                headmasterName={headmasterName}
                yearLabel="Analisis Kohort Rentas Tahun"
                classGroup="Semua Kohort"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            CASE D: ANALISIS & GRAF MATRIKS
           ======================================================== */}
        {selectedReport === 'analytics' && (
          <div>
            <DocumentHeader
              title="LAPORAN ANALISIS PRESTASI & GRAFIK MATRIKS PEMBELAJARAN"
              subtitle={`MATA PELAJARAN: ${selectedSubj === 'ALL' ? 'KESELURUHAN (PURATA)' : currentSubjObj?.name.toUpperCase()} • KELAS: ${currentYearObj.classGroup}`}
              schoolName={schoolName}
              yearLabel={currentYearObj.label}
            />

            <AnalyticsPrintSection
              students={activeStudents}
              selectedSubj={selectedSubj}
              gradeScales={gradeScales}
            />

            <div className="mt-8">
              <SignaturesFooter
                teacherName={teacherName}
                headmasterName={headmasterName}
                yearLabel={currentYearObj.label}
                classGroup={currentYearObj.classGroup}
              />
            </div>
          </div>
        )}

        {/* ========================================================
            CASE E: PELAN INTERVENSI MURID
           ======================================================== */}
        {selectedReport === 'intervention' && (
          <div>
            <DocumentHeader
              title="LAPORAN PELAN TINDAKAN INTERVENSI MURID (MPT4)"
              subtitle={`PROGRAM BIMBINGAN KHAS MENGIKUT KELOMPOK PRESTASI • KELAS: ${currentYearObj.classGroup}`}
              schoolName={schoolName}
              yearLabel={currentYearObj.label}
            />

            <InterventionPrintSection
              students={activeStudents}
              gradeScales={gradeScales}
            />

            <div className="mt-8">
              <SignaturesFooter
                teacherName={teacherName}
                headmasterName={headmasterName}
                yearLabel={currentYearObj.label}
                classGroup={currentYearObj.classGroup}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENTS FOR CLEAN MODULAR PRINT LAYOUT
   ========================================================================= */

// Official Document Top Header
const DocumentHeader: React.FC<{
  title: string;
  subtitle: string;
  schoolName: string;
  yearLabel: string;
}> = ({ title, subtitle, schoolName, yearLabel }) => (
  <div className="text-center border-b-2 border-slate-900 print:border-black pb-4 mb-6">
    <div className="flex items-center justify-center gap-3 mb-2">
      <img
        src="https://i.postimg.cc/KjqVvWNN/LOGO-SEK-2026-W.png"
        alt="Logo SK Laksian Banggi"
        className="w-14 h-14 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    </div>
    <h1 className="text-xs font-black uppercase tracking-widest text-slate-800 print:text-black">
      KEMENTERIAN PENDIDIKAN MALAYSIA
    </h1>
    <h2 className="text-sm font-bold uppercase text-slate-700 print:text-black mt-0.5">
      {schoolName}
    </h2>
    <h3 className="text-base sm:text-lg font-black text-slate-900 print:text-black uppercase mt-1">
      {title}
    </h3>
    <p className="text-xs font-bold text-slate-700 print:text-black mt-1 uppercase">
      {subtitle} • {yearLabel}
    </p>
  </div>
);

// Section Header for Full Dossier
const SectionHeader: React.FC<{
  sectionNo: string;
  title: string;
  schoolName: string;
  yearLabel: string;
}> = ({ sectionNo, title, schoolName, yearLabel }) => (
  <div className="border-b-2 border-slate-900 print:border-black pb-3 mb-5">
    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 print:text-black uppercase">
      <span>{schoolName}</span>
      <span>{yearLabel}</span>
    </div>
    <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white print:bg-white print:text-black print:border print:border-black text-[10px] font-black uppercase rounded mt-1">
      {sectionNo}
    </span>
    <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 print:text-black mt-1">
      {title}
    </h3>
  </div>
);

// Grade Scale Definition Table
const GradeScaleTable: React.FC<{ gradeScales: GradeScale[] }> = ({ gradeScales }) => (
  <div className="space-y-4">
    <p className="text-xs text-slate-700 print:text-black font-medium">
      Gred Matriks Pembelajaran Tahun 4 (MPT4) diguna pakai untuk mengukur penguasaan murid berdasarkan peratusan markah pentaksiran:
    </p>
    <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
      <thead>
        <tr className="bg-slate-100 print:bg-white font-bold border-b-2 border-slate-900 print:border-black text-center print:text-black">
          <th className="border border-slate-900 print:border-black p-2 print:p-1 w-14">GRED</th>
          <th className="border border-slate-900 print:border-black p-2 print:p-1 w-28">PERATUS MARKAH</th>
          <th className="border border-slate-900 print:border-black p-2 print:p-1 text-left">TAHAP PENGUASAAN</th>
          <th className="border border-slate-900 print:border-black p-2 print:p-1 w-20">GP (MATA)</th>
          <th className="border border-slate-900 print:border-black p-2 print:p-1 w-28">STATUS</th>
        </tr>
      </thead>
      <tbody>
        {gradeScales.map((s) => (
          <tr key={s.grade} className="border-b border-slate-900 print:border-black print:text-black">
            <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-black">{s.grade}</td>
            <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-bold">{s.minMark}% – {s.maxMark}%</td>
            <td className="border border-slate-900 print:border-black p-2 print:p-1 font-medium">{s.status}</td>
            <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-bold">{s.gp}</td>
            <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-bold">
              {s.grade === 'F' ? (
                <span className="text-rose-700 print:text-black font-bold">Belum Menguasai</span>
              ) : (
                <span className="text-emerald-700 print:text-black font-bold">Menguasai</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// HC4 Panitia & Class Summary Table
const HC4SummaryTable: React.FC<{
  students: Student[];
  gradeScales: GradeScale[];
  selectedSubj: SubjectId | 'ALL';
}> = ({ students, gradeScales, selectedSubj }) => {
  const subjectsToAnalyze = selectedSubj === 'ALL' ? SUBJECTS : SUBJECTS.filter((s) => s.id === selectedSubj);

  return (
    <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
      <thead>
        <tr className="bg-slate-100 print:bg-white font-bold border-b-2 border-slate-900 print:border-black text-center text-[10px] print:text-[7.5pt] print:text-black">
          <th rowSpan={2} className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-7">NO</th>
          <th rowSpan={2} className="border border-slate-900 print:border-black p-1.5 print:p-0.5 text-left">MATA PELAJARAN</th>
          <th rowSpan={2} className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-10">CALON</th>
          <th colSpan={6} className="border border-slate-900 print:border-black p-1.5 print:p-0.5 bg-slate-200/80 print:bg-white">TABURAN GRED MPT4 (BILANGAN & %)</th>
          <th colSpan={2} className="border border-slate-900 print:border-black p-1.5 print:p-0.5 bg-emerald-100/70 print:bg-white">MENGUASAI (A–E)</th>
          <th colSpan={2} className="border border-slate-900 print:border-black p-1.5 print:p-0.5 bg-rose-100/70 print:bg-white">BELUM MENGUASAI (F)</th>
          <th rowSpan={2} className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-12">GPMP</th>
        </tr>
        <tr className="bg-slate-50 print:bg-white font-bold border-b border-slate-900 print:border-black text-center text-[9px] print:text-[7pt] print:text-black">
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-8">A</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-8">B</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-8">C</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-8">D</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-8">E</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-8">F</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-9">BIL</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-9">%</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-9">BIL</th>
          <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-9">%</th>
        </tr>
      </thead>
      <tbody>
        {subjectsToAnalyze.map((subj, idx) => {
          const marksList = students.map((s) => s.marks[subj.id].actual);
          const validMarks = marksList.filter((m): m is number => m !== null);
          const totalCalon = validMarks.length;

          const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
          validMarks.forEach((m) => {
            const g = getGradeInfo(m, gradeScales).grade;
            counts[g] = (counts[g] || 0) + 1;
          });

          const passCount = validMarks.filter((m) => isPass(m, gradeScales)).length;
          const passPct = totalCalon > 0 ? ((passCount / totalCalon) * 100).toFixed(1) : '0';
          const failCount = counts.F || 0;
          const failPct = totalCalon > 0 ? ((failCount / totalCalon) * 100).toFixed(1) : '0';
          const gpmp = calculateGPK(validMarks, gradeScales);

          return (
            <tr key={subj.id} className="border-b border-slate-900 print:border-black text-center text-[11px] print:text-[8pt] print:text-black">
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold">{idx + 1}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-left">{subj.name} ({subj.code})</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-semibold">{totalCalon}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-emerald-800 print:text-black">{counts.A}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-blue-800 print:text-black">{counts.B}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-semibold text-cyan-800 print:text-black">{counts.C}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-semibold text-amber-800 print:text-black">{counts.D}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-semibold text-orange-800 print:text-black">{counts.E}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-rose-800 print:text-black">{counts.F}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-emerald-900 print:text-black bg-emerald-50/50 print:bg-white">{passCount}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-black text-emerald-900 print:text-black bg-emerald-50/50 print:bg-white">{passPct}%</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-rose-900 print:text-black bg-rose-50/50 print:bg-white">{failCount}</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-rose-900 print:text-black bg-rose-50/50 print:bg-white">{failPct}%</td>
              <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-black text-slate-900 print:text-black bg-slate-100 print:bg-white">{gpmp}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// HC3 Detail Table
const HC3DetailTable: React.FC<{
  students: Student[];
  selectedSubj: SubjectId | 'ALL';
  gradeScales: GradeScale[];
}> = ({ students, selectedSubj, gradeScales }) => (
  <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
    <thead>
      <tr className="bg-slate-100 print:bg-white border-b-2 border-slate-900 print:border-black font-bold text-[10px] print:text-[7.5pt] text-center print:text-black">
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-7">NO</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 text-left">NAMA MURID</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-10">TOV</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-10 bg-slate-200/60 print:bg-white">ETR</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-10">UJIAN 1</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-10">UJIAN 2</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-12 bg-slate-200 print:bg-white font-black">SEBENAR</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-10 font-black">GRED</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-10 font-bold">BEZA</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-20">STATUS ETR</th>
        <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 text-left">CATATAN / INTERVENSI</th>
      </tr>
    </thead>
    <tbody>
      {students.map((student, idx) => {
        let tov = 0;
        let etr = 0;
        let ar1: number | null = null;
        let ar2: number | null = null;
        let actual: number | null = null;
        let notes = '';

        if (selectedSubj === 'ALL') {
          const markList = Object.values(student.marks) as SubjectMarks[];
          tov = calculateAverage(markList.map((m) => m.tov));
          etr = calculateAverage(markList.map((m) => m.etr));
          ar1 = calculateAverage(markList.map((m) => m.ar1));
          ar2 = calculateAverage(markList.map((m) => m.ar2));
          actual = calculateAverage(markList.map((m) => m.actual));
          notes = markList.map((m) => m.notes).filter(Boolean).join('; ');
        } else {
          const m = student.marks[selectedSubj];
          tov = m.tov;
          etr = m.etr;
          ar1 = m.ar1;
          ar2 = m.ar2;
          actual = m.actual;
          notes = m.notes || '';
        }

        const gradeInfo = getGradeInfo(actual, gradeScales);
        const diff = actual !== null ? parseFloat((actual - etr).toFixed(1)) : 0;
        const badge = getAchievementBadge(actual, etr);

        return (
          <tr key={student.id} className="border-b border-slate-900 print:border-black print:text-black">
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center font-medium">{idx + 1}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 font-bold print:text-[8pt]">{student.name}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center font-semibold">{tov}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center font-bold bg-slate-50 print:bg-white">{etr}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center">{ar1 ?? '-'}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center">{ar2 ?? '-'}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center font-black bg-slate-100 print:bg-white">{actual ?? '-'}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center font-black">{gradeInfo.grade}</td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center font-bold">
              {diff >= 0 ? `+${diff}` : diff}
            </td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-center text-[9px] print:text-[7pt] font-semibold">
              {badge.label}
            </td>
            <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-[9px] print:text-[7pt] text-slate-700 print:text-black italic">
              {notes || '-'}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

// Multi-Year Matrix Print Section
const MultiYearMatrixPrintSection: React.FC<{
  years: AcademicYear[];
  studentsByYear: Record<string, Student[]>;
  gradeScales: GradeScale[];
}> = ({ years, studentsByYear, gradeScales }) => {
  const sortedYears = [...years].sort((a, b) => a.year - b.year);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-black uppercase text-slate-900 print:text-black mb-2">
          1. Rumusan Eksekutif Kohort Mengikut Tahun Akademik:
        </h4>
        <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
          <thead>
            <tr className="bg-slate-100 print:bg-white border-b-2 border-slate-900 print:border-black font-bold text-center text-[11px] print:text-[8pt] print:text-black">
              <th className="border border-slate-900 print:border-black p-2 print:p-1 text-left">SESI AKADEMIK</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-24">KELAS</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-16">BIL MURID</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-16">PURATA TOV</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-16 bg-slate-200/60 print:bg-white">PURATA ETR</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-20 bg-slate-200 print:bg-white">PURATA SEBENAR</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-16">GPK</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-20">% MENGUASAI</th>
            </tr>
          </thead>
          <tbody>
            {sortedYears.map((y) => {
              const stList = studentsByYear[y.id] || [];
              const allActual = stList.map((s) =>
                calculateAverage((Object.values(s.marks) as SubjectMarks[]).map((m) => m.actual))
              );
              const allTov = stList.map((s) =>
                calculateAverage((Object.values(s.marks) as SubjectMarks[]).map((m) => m.tov))
              );
              const allEtr = stList.map((s) =>
                calculateAverage((Object.values(s.marks) as SubjectMarks[]).map((m) => m.etr))
              );

              const avgActual = calculateAverage(allActual);
              const avgTov = calculateAverage(allTov);
              const avgEtr = calculateAverage(allEtr);
              const gpk = calculateGPK(allActual, gradeScales);
              const pass = stList.length > 0 ? Math.round((allActual.filter((m) => isPass(m, gradeScales)).length / stList.length) * 100) : 0;

              return (
                <tr key={y.id} className="border-b border-slate-900 print:border-black text-center print:text-black">
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-bold text-left">{y.label}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-semibold">{y.classGroup}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-semibold">{stList.length} Orang</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-semibold">{avgTov}%</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-bold bg-slate-50 print:bg-white">{avgEtr}%</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-black bg-slate-100 print:bg-white">{avgActual}%</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-black">{gpk}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-bold text-emerald-800 print:text-black">{pass}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="text-xs font-black uppercase text-slate-900 print:text-black mb-2">
          2. Rekod Kemajuan Murid Merentas Tahun (Kohort 2026+):
        </h4>
        <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
          <thead>
            <tr className="bg-slate-100 print:bg-white border-b-2 border-slate-900 print:border-black font-bold text-center text-[10px] print:text-[7.5pt] print:text-black">
              <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 w-7">NO</th>
              <th className="border border-slate-900 print:border-black p-1.5 print:p-0.5 text-left">NAMA MURID</th>
              {sortedYears.map((y) => (
                <th key={y.id} colSpan={3} className="border border-slate-900 print:border-black p-1.5 print:p-0.5">
                  {y.year} ({y.classGroup})
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50 print:bg-white border-b border-slate-900 print:border-black font-bold text-center text-[9px] print:text-[7pt] print:text-black">
              <th className="border border-slate-900 print:border-black p-1 print:p-0.5"></th>
              <th className="border border-slate-900 print:border-black p-1 print:p-0.5"></th>
              {sortedYears.map((y) => (
                <React.Fragment key={y.id}>
                  <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-10">TOV</th>
                  <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-10">SEBENAR</th>
                  <th className="border border-slate-900 print:border-black p-1 print:p-0.5 w-8">GRED</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {(studentsByYear[sortedYears[0]?.id] || []).map((s0, idx) => (
              <tr key={s0.id} className="border-b border-slate-900 print:border-black text-center text-[11px] print:text-[8pt] print:text-black">
                <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-medium">{idx + 1}</td>
                <td className="border border-slate-900 print:border-black p-1.5 print:p-0.5 font-bold text-left print:text-[8pt]">{s0.name}</td>
                {sortedYears.map((y) => {
                  const yearStudents = studentsByYear[y.id] || [];
                  const st = yearStudents.find((s) => s.name === s0.name) || yearStudents[idx];
                  if (!st) {
                    return (
                      <React.Fragment key={y.id}>
                        <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-slate-400 print:text-black">-</td>
                        <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-slate-400 print:text-black">-</td>
                        <td className="border border-slate-900 print:border-black p-1 print:p-0.5 text-slate-400 print:text-black">-</td>
                      </React.Fragment>
                    );
                  }
                  const avgTov = calculateAverage(
                    (Object.values(st.marks) as SubjectMarks[]).map((m) => m.tov)
                  );
                  const avgActual = calculateAverage(
                    (Object.values(st.marks) as SubjectMarks[]).map((m) => m.actual)
                  );
                  const gred = getGradeInfo(avgActual, gradeScales).grade;

                  return (
                    <React.Fragment key={y.id}>
                      <td className="border border-slate-900 print:border-black p-1 print:p-0.5 font-semibold">{avgTov}</td>
                      <td className="border border-slate-900 print:border-black p-1 print:p-0.5 font-black bg-slate-50 print:bg-white">{avgActual}</td>
                      <td className="border border-slate-900 print:border-black p-1 print:p-0.5 font-black">{gred}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Analytics Print Section
const AnalyticsPrintSection: React.FC<{
  students: Student[];
  selectedSubj: SubjectId | 'ALL';
  gradeScales: GradeScale[];
}> = ({ students, selectedSubj, gradeScales }) => {
  const getSubjectMarks = (type: 'tov' | 'etr' | 'actual') => {
    if (selectedSubj === 'ALL') {
      return students.map((s) => calculateAverage(Object.values(s.marks).map((m) => m[type])));
    }
    return students.map((s) => s.marks[selectedSubj][type]);
  };

  const tovMarks = getSubjectMarks('tov');
  const etrMarks = getSubjectMarks('etr');
  const actualMarks = getSubjectMarks('actual');

  const avgTov = calculateAverage(tovMarks);
  const avgEtr = calculateAverage(etrMarks);
  const avgActual = calculateAverage(actualMarks);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 text-center text-xs">
        <div className="border-2 border-slate-900 print:border-black p-3 rounded-lg bg-slate-50 print:bg-white">
          <span className="text-[10px] text-slate-600 print:text-black uppercase font-bold block">PURATA TOV</span>
          <strong className="text-base font-black text-slate-800 print:text-black">{avgTov}%</strong>
        </div>
        <div className="border-2 border-slate-900 print:border-black p-3 rounded-lg bg-slate-50 print:bg-white">
          <span className="text-[10px] text-slate-600 print:text-black uppercase font-bold block">PURATA ETR</span>
          <strong className="text-base font-black text-blue-900 print:text-black">{avgEtr}%</strong>
        </div>
        <div className="border-2 border-slate-900 print:border-black p-3 rounded-lg bg-slate-50 print:bg-white">
          <span className="text-[10px] text-slate-600 print:text-black uppercase font-bold block">PURATA SEBENAR</span>
          <strong className="text-base font-black text-emerald-950 print:text-black">{avgActual}%</strong>
        </div>
        <div className="border-2 border-slate-900 print:border-black p-3 rounded-lg bg-slate-50 print:bg-white">
          <span className="text-[10px] text-slate-600 print:text-black uppercase font-bold block">GPK SEBENAR</span>
          <strong className="text-base font-black text-purple-950 print:text-black">{calculateGPK(actualMarks, gradeScales)}</strong>
        </div>
      </div>

      {/* Visual Multi-Subject Comparison (BM, BI, MAT, SN) */}
      <div className="border-2 border-slate-900 print:border-black rounded-lg p-3 bg-white">
        <h4 className="text-xs font-black uppercase text-slate-900 print:text-black mb-1 flex items-center justify-between">
          <span>PERBANDINGAN VISUAL PENCAPAIAN 4 MATA PELAJARAN (BM, BI, MAT, SN)</span>
          <span className="text-[10px] bg-slate-100 print:bg-white border border-slate-300 print:border-black px-2 py-0.5 rounded font-bold print:text-black">
            Graf Bar Peratusan Markah
          </span>
        </h4>
        <p className="text-[10px] text-slate-600 print:text-black mb-3">
          Perbandingan purata markah murid mengikut mata pelajaran (TOV vs Sasaran ETR vs Ujian Sebenar) beserta peratusan murid lulus (≥40%).
        </p>

        {/* 4 Subjects Comparison Graphic Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-1">
          {SUBJECTS.map((sub) => {
            const tovList = students.map((s) => s.marks[sub.id].tov);
            const etrList = students.map((s) => s.marks[sub.id].etr);
            const actList = students
              .map((s) => s.marks[sub.id].actual)
              .filter((v): v is number => v !== null && !isNaN(v));
            const subAvgTov = calculateAverage(tovList);
            const subAvgEtr = calculateAverage(etrList);
            const subAvgAct = calculateAverage(actList);
            const subPassPct =
              students.length > 0
                ? Math.round(
                    (actList.filter((m) => m >= 40).length / students.length) * 100
                  )
                : 0;
            const subEtrAchieved = students.filter(
              (s) => (s.marks[sub.id].actual ?? 0) >= s.marks[sub.id].etr
            ).length;
            const subEtrPct =
              students.length > 0
                ? Math.round((subEtrAchieved / students.length) * 100)
                : 0;

            return (
              <div
                key={sub.id}
                className="border border-slate-900 print:border-black p-2 rounded bg-slate-50 print:bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-300 print:border-black">
                    <strong className="text-xs font-black text-slate-900 print:text-black">
                      {sub.name} ({sub.code})
                    </strong>
                    <span className="text-xs font-black text-emerald-900 print:text-black">
                      {subAvgAct}%
                    </span>
                  </div>

                  {/* Visual Bar Comparison: TOV vs ETR vs Sebenar */}
                  <div className="space-y-1.5 my-2">
                    <div>
                      <div className="text-[9px] text-slate-600 print:text-black flex justify-between">
                        <span>TOV:</span>
                        <span className="font-bold">{subAvgTov}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 print:bg-white border border-slate-600 print:border-black rounded-sm overflow-hidden">
                        <svg className="w-full h-full block" preserveAspectRatio="none">
                          <rect
                            x="0"
                            y="0"
                            width={`${subAvgTov}%`}
                            height="100%"
                            fill="#94a3b8"
                            className="print:fill-slate-400"
                          />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-blue-800 print:text-black flex justify-between">
                        <span>Sasaran ETR:</span>
                        <span className="font-bold">{subAvgEtr}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 print:bg-white border border-slate-600 print:border-black rounded-sm overflow-hidden">
                        <svg className="w-full h-full block" preserveAspectRatio="none">
                          <rect
                            x="0"
                            y="0"
                            width={`${subAvgEtr}%`}
                            height="100%"
                            fill="#2563eb"
                            className="print:fill-slate-600"
                          />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-emerald-900 print:text-black flex justify-between font-bold">
                        <span>Sebenar:</span>
                        <span>{subAvgAct}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-200 print:bg-white border-2 border-slate-900 print:border-black rounded-sm overflow-hidden">
                        <svg className="w-full h-full block" preserveAspectRatio="none">
                          <rect
                            x="0"
                            y="0"
                            width={`${subAvgAct}%`}
                            height="100%"
                            fill="#059669"
                            className="print:fill-black"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-300 print:border-black pt-1.5 space-y-0.5 text-[9px]">
                  <div className="text-slate-700 print:text-black flex justify-between">
                    <span>% Lulus (≥40):</span>
                    <strong className="text-slate-900 print:text-black font-extrabold">{subPassPct}%</strong>
                  </div>
                  <div className="text-slate-700 print:text-black flex justify-between">
                    <span>% Capai ETR:</span>
                    <strong className="text-slate-900 print:text-black font-extrabold">{subEtrPct}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade Comparison Table with Visual Percent Bars */}
      <div>
        <h4 className="text-xs font-black uppercase text-slate-900 print:text-black mb-2">
          Taburan Pencapaian Gred MPT4 (TOV vs ETR vs Sebenar):
        </h4>
        <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
          <thead>
            <tr className="bg-slate-100 print:bg-white font-bold border-b-2 border-slate-900 print:border-black text-center text-[11px] print:text-[8pt] print:text-black">
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-12">GRED</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-24">JULAT MARKAH</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 text-left">TAHAP PENGUASAAN</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-14">TOV</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-14">ETR</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 w-16 bg-slate-200 print:bg-white font-black">SEBENAR</th>
              <th className="border border-slate-900 print:border-black p-2 print:p-1 text-left min-w-[200px]">GRAFIK PERATUSAN SEBENAR (%)</th>
            </tr>
          </thead>
          <tbody>
            {gradeScales.map((scale) => {
              const tovCount = tovMarks.filter((m) => getGradeInfo(m, gradeScales).grade === scale.grade).length;
              const etrCount = etrMarks.filter((m) => getGradeInfo(m, gradeScales).grade === scale.grade).length;
              const actCount = actualMarks.filter((m) => getGradeInfo(m, gradeScales).grade === scale.grade).length;
              const actPct = students.length > 0 ? Math.round((actCount / students.length) * 100) : 0;

              return (
                <tr key={scale.grade} className="border-b border-slate-900 print:border-black print:text-black">
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-black">{scale.grade}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-semibold">{scale.minMark}% – {scale.maxMark}%</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 font-medium">{scale.status}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-bold">{tovCount}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-bold">{etrCount}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1 text-center font-black bg-slate-100 print:bg-white">{actCount}</td>
                  <td className="border border-slate-900 print:border-black p-2 print:p-1">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 min-w-[120px]">
                        {/* High-visibility Vector SVG Bar with Ruler Scale */}
                        <div className="relative h-5 print:h-4 w-full bg-slate-100 print:bg-white border-2 border-slate-900 print:border-black rounded overflow-hidden">
                          {/* Scale Guide Ticks 25%, 50%, 75% */}
                          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-30 z-10">
                            <span className="border-r border-slate-500 print:border-black h-full w-1/4"></span>
                            <span className="border-r border-slate-500 print:border-black h-full w-1/4"></span>
                            <span className="border-r border-slate-500 print:border-black h-full w-1/4"></span>
                            <span className="w-1/4"></span>
                          </div>

                          {/* Solid Vector SVG Fill - Never stripped by browser print engines */}
                          <svg className="w-full h-full block" preserveAspectRatio="none">
                            <rect
                              x="0"
                              y="0"
                              width={`${actPct}%`}
                              height="100%"
                              fill="#0f172a"
                              className="print:fill-black"
                            />
                          </svg>

                          {actPct >= 22 && (
                            <span className="absolute inset-y-0 left-2 flex items-center text-[10px] print:text-[7pt] font-black text-white pointer-events-none z-20">
                              {actPct}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Explicit Text Label */}
                      <span className="font-black text-xs print:text-[8pt] min-w-[70px] text-right text-slate-900 print:text-black shrink-0">
                        {actPct}% <span className="font-semibold text-[10px] print:text-[7pt] text-slate-600 print:text-black">({actCount} m)</span>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Intervention Print Section
const InterventionPrintSection: React.FC<{
  students: Student[];
  gradeScales: GradeScale[];
}> = ({ students, gradeScales }) => {
  // Group students by performance tiers based on average actual score
  const getAvg = (s: Student) =>
    calculateAverage((Object.values(s.marks) as SubjectMarks[]).map((m) => m.actual));

  const cemerlang = students.filter((s) => getAvg(s) >= (gradeScales.find((g) => g.grade === 'B')?.minMark ?? 66));
  const sederhana = students.filter((s) => {
    const avg = getAvg(s);
    const bMin = gradeScales.find((g) => g.grade === 'B')?.minMark ?? 66;
    const dMin = gradeScales.find((g) => g.grade === 'D')?.minMark ?? 35;
    return avg < bMin && avg >= dMin;
  });
  const galus = students.filter((s) => {
    const avg = getAvg(s);
    const dMin = gradeScales.find((g) => g.grade === 'D')?.minMark ?? 35;
    return avg < dMin;
  });

  return (
    <div className="space-y-6">
      {/* Group 1: Kumpulan Galus & Pemulihan (Kritikal) */}
      <div className="border-2 border-slate-900 print:border-black rounded-lg p-3 print:bg-white">
        <h4 className="text-xs font-black uppercase text-rose-900 print:text-black mb-1 flex items-center justify-between">
          <span>KUMPULAN 1: BIMBINGAN ASAS & GALUS (GRED E / F &lt; 35%)</span>
          <span className="text-[10px] bg-rose-100 print:bg-white border border-rose-300 print:border-black px-2 py-0.5 rounded font-bold print:text-black">
            {galus.length} Orang Murid
          </span>
        </h4>
        <p className="text-[10px] text-slate-600 print:text-black mb-2">
          <strong>Strategi:</strong> Modul Asas Menguasai 4M, Latih tubi berfokus asas, bimbingan rakan sebaya, bimbingan satu-ke-satu.
        </p>
        <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
          <thead>
            <tr className="bg-slate-100 print:bg-white border-b-2 border-slate-900 print:border-black text-center text-[10px] print:text-[7.5pt] font-bold print:text-black">
              <th className="border border-slate-900 print:border-black p-1 w-7">NO</th>
              <th className="border border-slate-900 print:border-black p-1 text-left">NAMA MURID</th>
              <th className="border border-slate-900 print:border-black p-1 w-12">PURATA</th>
              <th className="border border-slate-900 print:border-black p-1 w-12">GRED</th>
              <th className="border border-slate-900 print:border-black p-1 text-left">ISU & KELEMAHAN</th>
              <th className="border border-slate-900 print:border-black p-1 text-left">PELAN INTERVENSI</th>
            </tr>
          </thead>
          <tbody>
            {galus.map((s, idx) => {
              const avg = getAvg(s);
              const g = getGradeInfo(avg, gradeScales).grade;
              const notes =
                (Object.values(s.marks) as SubjectMarks[])
                  .map((m) => m.notes)
                  .filter(Boolean)
                  .join('; ') || 'Perlu bimbingan asas soalan mudah';
              return (
                <tr key={s.id} className="border-b border-slate-900 print:border-black print:text-black">
                  <td className="border border-slate-900 print:border-black p-1 text-center font-medium">{idx + 1}</td>
                  <td className="border border-slate-900 print:border-black p-1 font-bold print:text-[8pt]">{s.name}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-center font-black">{avg}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-center font-black">{g}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-[9.5px] print:text-[7.5pt]">{notes}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-[9.5px] print:text-[7.5pt] font-semibold">Bimbingan Pemulihan Berfokus</td>
                </tr>
              );
            })}
            {galus.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-xs text-slate-500 print:text-black italic">
                  Tiada murid di bawah tahap kritikal. Semua murid mencapai penguasaan minimum.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Group 2: Kumpulan Sederhana & Pengukuhan */}
      <div className="border-2 border-slate-900 print:border-black rounded-lg p-3 print:bg-white">
        <h4 className="text-xs font-black uppercase text-amber-900 print:text-black mb-1 flex items-center justify-between">
          <span>KUMPULAN 2: PENGUKUHAN & PENINGKATAN PRESTASI (GRED C / D)</span>
          <span className="text-[10px] bg-amber-100 print:bg-white border border-amber-300 print:border-black px-2 py-0.5 rounded font-bold print:text-black">
            {sederhana.length} Orang Murid
          </span>
        </h4>
        <p className="text-[10px] text-slate-600 print:text-black mb-2">
          <strong>Strategi:</strong> Modul Berformat UASA, teknik menjawab kata kunci, pengukuhan konsep & hafalan formula.
        </p>
        <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
          <thead>
            <tr className="bg-slate-100 print:bg-white border-b-2 border-slate-900 print:border-black text-center text-[10px] print:text-[7.5pt] font-bold print:text-black">
              <th className="border border-slate-900 print:border-black p-1 w-7">NO</th>
              <th className="border border-slate-900 print:border-black p-1 text-left">NAMA MURID</th>
              <th className="border border-slate-900 print:border-black p-1 w-12">PURATA</th>
              <th className="border border-slate-900 print:border-black p-1 w-12">GRED</th>
              <th className="border border-slate-900 print:border-black p-1 text-left">PELAN TINDAKAN</th>
            </tr>
          </thead>
          <tbody>
            {sederhana.map((s, idx) => {
              const avg = getAvg(s);
              const g = getGradeInfo(avg, gradeScales).grade;
              return (
                <tr key={s.id} className="border-b border-slate-900 print:border-black print:text-black">
                  <td className="border border-slate-900 print:border-black p-1 text-center font-medium">{idx + 1}</td>
                  <td className="border border-slate-900 print:border-black p-1 font-bold print:text-[8pt]">{s.name}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-center font-black">{avg}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-center font-black">{g}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-[9.5px] print:text-[7.5pt]">Latih tubi berformat & bengkel teknik menjawab</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Group 3: Kumpulan Cemerlang & Pengayaan */}
      <div className="border-2 border-slate-900 print:border-black rounded-lg p-3 print:bg-white">
        <h4 className="text-xs font-black uppercase text-emerald-900 print:text-black mb-1 flex items-center justify-between">
          <span>KUMPULAN 3: PENGAYAAN & KECEMERLANGAN (GRED A / B)</span>
          <span className="text-[10px] bg-emerald-100 print:bg-white border border-emerald-300 print:border-black px-2 py-0.5 rounded font-bold print:text-black">
            {cemerlang.length} Orang Murid
          </span>
        </h4>
        <p className="text-[10px] text-slate-600 print:text-black mb-2">
          <strong>Strategi:</strong> Modul KBAT Aras Tinggi, pembimbing rakan sebaya (mentor), pembentangan kendiri.
        </p>
        <table className="w-full text-left border-collapse border border-slate-900 print:border-black text-xs print:text-[8pt]">
          <thead>
            <tr className="bg-slate-100 print:bg-white border-b-2 border-slate-900 print:border-black text-center text-[10px] print:text-[7.5pt] font-bold print:text-black">
              <th className="border border-slate-900 print:border-black p-1 w-7">NO</th>
              <th className="border border-slate-900 print:border-black p-1 text-left">NAMA MURID</th>
              <th className="border border-slate-900 print:border-black p-1 w-12">PURATA</th>
              <th className="border border-slate-900 print:border-black p-1 w-12">GRED</th>
              <th className="border border-slate-900 print:border-black p-1 text-left">PELAN PENGAYAAN</th>
            </tr>
          </thead>
          <tbody>
            {cemerlang.map((s, idx) => {
              const avg = getAvg(s);
              const g = getGradeInfo(avg, gradeScales).grade;
              return (
                <tr key={s.id} className="border-b border-slate-900 print:border-black print:text-black">
                  <td className="border border-slate-900 print:border-black p-1 text-center font-medium">{idx + 1}</td>
                  <td className="border border-slate-900 print:border-black p-1 font-bold print:text-[8pt]">{s.name}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-center font-black">{avg}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-center font-black">{g}</td>
                  <td className="border border-slate-900 print:border-black p-1 text-[9.5px] print:text-[7.5pt]">Latihan KBAT intensif & kekalkan kecemerlangan A</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Official Signatures Footer
const SignaturesFooter: React.FC<{
  teacherName: string;
  headmasterName: string;
  yearLabel: string;
  classGroup: string;
}> = ({ teacherName, headmasterName, yearLabel, classGroup }) => (
  <div className="grid grid-cols-2 gap-8 pt-8 text-xs border-t-2 border-slate-900 print:border-black print:pt-8 print:text-black">
    <div>
      <p className="text-slate-500 print:text-black mb-10">Disediakan Oleh:</p>
      <div className="border-b border-slate-900 print:border-black w-48 mb-1"></div>
      <p className="font-bold uppercase text-slate-900 print:text-black">{teacherName}</p>
      <p className="text-slate-600 print:text-black">Guru Mata Pelajaran / Guru Kelas {classGroup}</p>
      <p className="text-[10px] text-slate-500 print:text-black">{yearLabel}</p>
    </div>

    <div className="text-right">
      <p className="text-slate-500 print:text-black mb-10">Disahkan Oleh:</p>
      <div className="border-b border-slate-900 print:border-black w-48 ml-auto mb-1"></div>
      <p className="font-bold uppercase text-slate-900 print:text-black">{headmasterName}</p>
      <p className="text-slate-600 print:text-black">Guru Besar / PK Pentadbiran</p>
      <p className="text-[10px] text-slate-500 print:text-black">Tarikh: ____________________</p>
    </div>
  </div>
);
