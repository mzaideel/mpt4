import React, { useState, useRef, useEffect } from 'react';
import { SubjectId, AcademicYear } from '../types';
import { SUBJECTS } from '../utils/headcountUtils';
import {
  GraduationCap,
  BarChart3,
  Users,
  FileText,
  Download,
  RotateCcw,
  Plus,
  Printer,
  BookOpen,
  Calendar,
  ChevronDown,
  Edit2,
  TrendingUp,
  Sliders,
  Cloud,
  RefreshCw,
  CheckCircle2,
  Upload,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  selectedSubject: SubjectId | 'ALL';
  onSelectSubject: (subj: SubjectId | 'ALL') => void;
  activeTab: 'table' | 'matrix' | 'analytics' | 'intervention' | 'print';
  setActiveTab: (tab: 'table' | 'matrix' | 'analytics' | 'intervention' | 'print') => void;
  onExport: () => void;
  onReset: () => void;
  onAddStudent: () => void;
  studentCount: number;
  years: AcademicYear[];
  activeYearId: string;
  onSelectYear: (yearId: string) => void;
  onOpenManageYears: () => void;
  onOpenAddYear: () => void;
  onOpenGradeSettings?: () => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
  onOpenImport?: () => void;
  isSyncingToCloud?: boolean;
  lastCloudSyncTime?: string;
  onTriggerCloudSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedSubject,
  onSelectSubject,
  activeTab,
  setActiveTab,
  onExport,
  onReset,
  onAddStudent,
  studentCount,
  years,
  activeYearId,
  onSelectYear,
  onOpenManageYears,
  onOpenAddYear,
  onOpenGradeSettings,
  onRefreshCloud,
  isRefreshingCloud = false,
  onOpenImport,
  isSyncingToCloud = false,
  lastCloudSyncTime = '',
  onTriggerCloudSync,
}) => {
  const currentYear = years.find((y) => y.id === activeYearId) || years[0];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 text-white shadow-xl border-b border-slate-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center space-x-3.5">
            <div className="w-13 h-13 rounded-xl bg-slate-800/90 p-1 flex items-center justify-center shadow-lg shadow-blue-500/10 text-white shrink-0 overflow-hidden border border-slate-700/80">
              <img
                src="https://i.postimg.cc/KjqVvWNN/LOGO-SEK-2026-W.png"
                alt="Logo Sekolah Kebangsaan Laksian Banggi"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              {/* Year Switcher Badges & Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative inline-flex items-center">
                  <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-blue-400 pointer-events-none" />
                  <select
                    value={activeYearId}
                    onChange={(e) => onSelectYear(e.target.value)}
                    className="pl-7 pr-7 py-1 rounded-lg text-xs font-bold bg-slate-800 text-blue-300 border border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-slate-700 transition"
                    title="Pilih Sesi Akademik"
                  >
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 text-slate-400 pointer-events-none" />
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {currentYear?.classGroup || '4 DINAMIK'}
                </span>

                <button
                  onClick={onOpenManageYears}
                  title="Urus, Tambah & Edit Tahun"
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3 h-3 text-blue-400" />
                  <span>Urus Tahun</span>
                </button>

                {onOpenGradeSettings && (
                  <button
                    onClick={onOpenGradeSettings}
                    title="Sunting & Ubah Gred Matriks Pembelajaran (MPT4)"
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-indigo-500/40 text-indigo-300 transition flex items-center gap-1.5"
                  >
                    <Sliders className="w-3 h-3 text-indigo-400" />
                    <span>Gred MPT4</span>
                  </button>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-50 mt-1">
                Sistem Pemantauan Markah MPT4
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Sekolah Kebangsaan Laksian Banggi
                </p>
                <span className="text-slate-600 text-xs hidden sm:inline">•</span>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition ${
                    isSyncingToCloud
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 animate-pulse'
                      : isRefreshingCloud
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                      : lastCloudSyncTime
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Status Segerak Google Sheets Cloud"
                >
                  <Cloud
                    className={`w-3.5 h-3.5 ${
                      isSyncingToCloud
                        ? 'animate-pulse text-blue-400'
                        : isRefreshingCloud
                        ? 'animate-spin text-sky-400'
                        : 'text-emerald-400'
                    }`}
                  />
                  <span>
                    {isSyncingToCloud
                      ? 'Menyimpan ke Google Sheet...'
                      : isRefreshingCloud
                      ? 'Menyegerak dari Google Sheet...'
                      : lastCloudSyncTime
                      ? `Google Sheet Tersimpan (${lastCloudSyncTime})`
                      : 'Google Sheet Bersedia'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 1 Button Dropdown Menu: Refresh, Import, Eksport */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Pilihan Tindakan Data: Segar Semula, Import & Eksport"
                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center gap-2 shadow-md hover:border-blue-500/50"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Menu Tindakan</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Pengurusan Data & Laporan
                  </div>

                  {/* 1. REFRESH / SEGAR SEMULA */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onRefreshCloud?.();
                    }}
                    disabled={isRefreshingCloud}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-start gap-3 text-slate-200 hover:text-white group"
                  >
                    <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 group-hover:bg-sky-500/30 transition shrink-0 mt-0.5">
                      <RefreshCw className={`w-4 h-4 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-sky-300">
                        {isRefreshingCloud ? 'Menyegar Semula...' : 'Segar Semula (Refresh)'}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        Muat turun markah terkini daripada Google Sheet
                      </div>
                    </div>
                  </button>

                  {/* 2. IMPORT */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenImport?.();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-start gap-3 text-slate-200 hover:text-white group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition shrink-0 mt-0.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-emerald-300">Import Data Murid</div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        Muat naik fail sandaran JSON atau senarai murid
                      </div>
                    </div>
                  </button>

                  {/* 3. EKSPORT FAIL JSON */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onExport();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-start gap-3 text-slate-200 hover:text-white group"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 transition shrink-0 mt-0.5">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-amber-300">Eksport Fail JSON</div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        Muat turun sandaran penuh format JSON (SK Laksian Banggi)
                      </div>
                    </div>
                  </button>

                  {/* 4. CETAK & LAPORAN RASMI (A4) */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setActiveTab('print');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-start gap-3 text-slate-200 hover:text-white group"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition shrink-0 mt-0.5">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-indigo-300">Cetak & Laporan Dossier (A4)</div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        Buka cetakan dossier rasmi, PDF & analisis matriks
                      </div>
                    </div>
                  </button>

                  {/* 5. CLOUD SAVE OPTION */}
                  {onTriggerCloudSync && (
                    <div className="border-t border-slate-800 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onTriggerCloudSync();
                        }}
                        disabled={isSyncingToCloud}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-start gap-3 text-slate-200 hover:text-white group"
                      >
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition shrink-0 mt-0.5">
                          <Cloud className={`w-4 h-4 ${isSyncingToCloud ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-blue-300">
                            {isSyncingToCloud ? 'Menyimpan ke Cloud...' : 'Simpan ke Google Sheet'}
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight">
                            Kekalkan markah ke Google Sheets secara kekal
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onAddStudent}
              className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Murid</span>
            </button>

            <button
              onClick={onReset}
              title="Set Semula Data Asal"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary View Navigation Tabs */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800 pt-4">
          <div className="flex items-center space-x-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {/* Tab 1 */}
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Borang Headcount ({currentYear?.year})</span>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Matriks Rentas Tahun (2026+)</span>
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analisis & Graf Matriks</span>
            </button>

            {/* Tab 4 */}
            <button
              onClick={() => setActiveTab('intervention')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'intervention'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Pelan Intervensi Murid</span>
            </button>

            {/* Tab 5: Cetakan (All Print Reports in 1 tab) */}
            <button
              onClick={() => setActiveTab('print')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'print'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetakan</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
                Pilihan Penuh
              </span>
            </button>
          </div>

          {/* Subject Filter Pills (only when on table) */}
          {activeTab === 'table' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-medium text-slate-400 mr-1 hidden lg:inline">Subjek:</span>
              <button
                onClick={() => onSelectSubject('ALL')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
                  selectedSubject === 'ALL'
                    ? 'bg-indigo-500 text-white shadow-sm font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Keseluruhan (Purata)
              </button>
              {SUBJECTS.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
                    selectedSubject === sub.id
                      ? 'bg-blue-500 text-white shadow-sm font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {sub.code}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
