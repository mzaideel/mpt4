import React, { useState, useRef } from 'react';
import { Student, AcademicYear, GradeScale, SubjectId, SubjectMarks } from '../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Download,
  Info,
  Check,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { calculateAverage, calculateGPK } from '../utils/headcountUtils';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeYearId: string;
  activeYearLabel: string;
  classGroup: string;
  onImportFullBackup: (data: {
    studentsByYear?: Record<string, Student[]>;
    years?: AcademicYear[];
    gradeScales?: GradeScale[];
  }) => Promise<void> | void;
  onImportStudentList: (newStudents: Student[]) => Promise<void> | void;
  onShowToast: (msg: string) => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  activeYearId,
  activeYearLabel,
  classGroup,
  onImportFullBackup,
  onImportStudentList,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{
    type: 'json_backup' | 'student_list';
    studentCount: number;
    yearsCount?: number;
    sampleNames: string[];
    rawData: any;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Check if full backup format
        if (parsed.studentsByYear || (parsed.years && Array.isArray(parsed.years))) {
          const totalStudents = Object.values(parsed.studentsByYear || {}).reduce(
            (acc: number, list: any) => acc + (Array.isArray(list) ? list.length : 0),
            0
          );
          const firstYearList = Object.values(parsed.studentsByYear || {})[0] as Student[];
          const sampleNames = (firstYearList || []).slice(0, 3).map((s) => s.name);

          setParsedPreview({
            type: 'json_backup',
            studentCount: totalStudents,
            yearsCount: parsed.years?.length || Object.keys(parsed.studentsByYear || {}).length,
            sampleNames,
            rawData: parsed,
          });
        } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
          // Array of students
          setParsedPreview({
            type: 'student_list',
            studentCount: parsed.length,
            sampleNames: parsed.slice(0, 3).map((s: any) => s.name),
            rawData: parsed,
          });
        } else {
          setErrorMsg('Format fail JSON tidak sah atau tidak dikenali.');
        }
      } catch (err: any) {
        setErrorMsg('Gagal membaca fail JSON: ' + (err.message || 'Sintaks tidak sah'));
      }
    };
    reader.readAsText(file);
  };

  const handleParseText = () => {
    if (!pasteContent.trim()) {
      setErrorMsg('Sila tampal teks senarai nama murid terlebih dahulu.');
      return;
    }
    setErrorMsg(null);

    const lines = pasteContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const generatedStudents: Student[] = lines.map((line, idx) => {
      // Check if line has tab or comma separator (e.g. "Ahmad bin Ali, L")
      const parts = line.split(/[,\t]+/).map((p) => p.trim());
      const name = (parts[0] || '').toUpperCase();
      let gender: 'L' | 'P' = 'L';
      if (parts[1]) {
        const g = parts[1].toUpperCase();
        if (g === 'P' || g === 'PEREMPUAN' || g === 'F') gender = 'P';
      }

      const defaultMarks: Record<SubjectId, SubjectMarks> = {
        BM: { tov: 60, etr: 75, ar1: 65, ar2: 70, actual: null, notes: '' },
        BI: { tov: 55, etr: 70, ar1: 60, ar2: 65, actual: null, notes: '' },
        MAT: { tov: 65, etr: 80, ar1: 70, ar2: 75, actual: null, notes: '' },
        SN: { tov: 60, etr: 75, ar1: 65, ar2: 70, actual: null, notes: '' },
      };

      return {
        id: `s_imp_${Date.now()}_${idx}`,
        noId: '',
        name,
        gender,
        classGroup: classGroup || '4 DINAMIK',
        marks: defaultMarks,
      };
    });

    if (generatedStudents.length === 0) {
      setErrorMsg('Tiada rekod murid yang dapat diekstrak daripada teks.');
      return;
    }

    setParsedPreview({
      type: 'student_list',
      studentCount: generatedStudents.length,
      sampleNames: generatedStudents.slice(0, 3).map((s) => s.name),
      rawData: generatedStudents,
    });
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleApplyImport = async () => {
    if (!parsedPreview) return;
    setIsImporting(true);
    setErrorMsg(null);

    try {
      if (parsedPreview.type === 'json_backup') {
        await onImportFullBackup(parsedPreview.rawData);
        onShowToast(`Sandaran berjaya dipulihkan & disimpan kekal ke Google Sheet!`);
      } else {
        await onImportStudentList(parsedPreview.rawData);
        onShowToast(`Berjaya menambah ${parsedPreview.studentCount} orang murid & disimpan kekal ke Google Sheet!`);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg('Ralat semasa menyimpan ke Google Sheet: ' + (err.message || 'Sila cuba lagi.'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Import Data Murid & Sandaran</h3>
              <p className="text-xs text-blue-200">
                Pilih fail JSON sandaran atau tampal senarai nama murid bagi {classGroup}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('file');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Fail Sandaran (.JSON)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('text');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'text'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tampal Senarai Murid</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Klik untuk pilih fail sandaran JSON
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fail sandaran yang dieksport dari sistem Headcount MPT4
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tampal Senarai Nama Murid (Satu murid satu baris):
                </label>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={`MOHAMMAD KHAIRIL IKHWAN, L\nNUR ALYA BATRISYIA, P\nAHMAD ZIKRI, L`}
                  rows={6}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: Nama Murid, Jantina (L/P). Markah asas akan dijana secara automatik.
                </p>
              </div>

              <button
                type="button"
                onClick={handleParseText}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Semak & Pratonton Rekod Murid</span>
              </button>
            </div>
          )}

          {/* Parsed Preview Card */}
          {parsedPreview && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {parsedPreview.type === 'json_backup'
                    ? `Fail Sandaran Sah: ${parsedPreview.studentCount} Rekod Murid (${parsedPreview.yearsCount} Tahun)`
                    : `${parsedPreview.studentCount} Orang Murid Sedia Diimport ke ${classGroup}`}
                </span>
              </div>
              <div className="text-xs text-emerald-700 space-y-1 pl-7">
                <p className="font-semibold">Contoh murid dikesan:</p>
                <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
                  {parsedPreview.sampleNames.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                  {parsedPreview.studentCount > 3 && (
                    <li className="italic text-emerald-600">
                      ... dan {parsedPreview.studentCount - 3} lagi murid
                    </li>
                  )}
                </ul>
              </div>

              {/* Cloud Persistence Guarantee Note */}
              <div className="mt-3 pt-2 border-t border-emerald-200/80 flex items-center gap-2 text-[11px] font-medium text-emerald-800">
                <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Penyimpanan Kekal:</strong> Selepas disahkan, data akan disimpan secara automatik ke Google Sheet SK Laksian Banggi supaya data tidak hilang atau berubah apabila dilayari dari pelayar lain.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isImporting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!parsedPreview || isImporting}
            onClick={handleApplyImport}
            className="px-5 py-2 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Google Sheet...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Sahkan & Simpan ke Google Sheet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
