import React, { useState, useEffect } from 'react';
import { GradeScale, GradeLetter } from '../types';
import { DEFAULT_MPT4_GRADE_SCALES, STANDARD_KPM_GRADE_SCALES, getGradeInfo, isPass } from '../utils/headcountUtils';
import { Sliders, CheckCircle2, RotateCcw, AlertTriangle, BookOpen, X, Sparkles, HelpCircle } from 'lucide-react';

interface GradeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScales: GradeScale[];
  onSaveScales: (scales: GradeScale[]) => void;
}

export const GradeSettingsModal: React.FC<GradeSettingsModalProps> = ({
  isOpen,
  onClose,
  currentScales,
  onSaveScales,
}) => {
  const [editingScales, setEditingScales] = useState<GradeScale[]>([]);
  const [testMark, setTestMark] = useState<number | string>(82);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEditingScales(JSON.parse(JSON.stringify(currentScales)));
      setValidationError(null);
    }
  }, [isOpen, currentScales]);

  if (!isOpen) return null;

  const handleFieldChange = (
    index: number,
    field: keyof GradeScale,
    val: string | number
  ) => {
    setEditingScales((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === 'minMark' || field === 'maxMark' || field === 'gp' ? Number(val) : val,
      };
      return next;
    });
  };

  const handleApplyPreset = (preset: GradeScale[]) => {
    setEditingScales(JSON.parse(JSON.stringify(preset)));
    setValidationError(null);
  };

  const validateScales = (scales: GradeScale[]): string | null => {
    for (let i = 0; i < scales.length; i++) {
      const s = scales[i];
      if (s.minMark > s.maxMark) {
        return `Gred ${s.grade}: Markah minimum (${s.minMark}%) tidak boleh lebih tinggi daripada markah maksimum (${s.maxMark}%).`;
      }
      if (s.minMark < 0 || s.maxMark > 100) {
        return `Gred ${s.grade}: Julat markah mestilah di antara 0% hingga 100%.`;
      }
    }
    return null;
  };

  const handleSave = () => {
    const error = validateScales(editingScales);
    if (error) {
      setValidationError(error);
      return;
    }
    onSaveScales(editingScales);
    onClose();
  };

  // Preview test mark result
  const numericTest = typeof testMark === 'number' ? testMark : parseFloat(testMark);
  const testGrade = !isNaN(numericTest) ? getGradeInfo(numericTest, editingScales) : null;
  const testPass = !isNaN(numericTest) ? isPass(numericTest, editingScales) : false;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>Tetapan Skala Gred Matriks Pembelajaran (MPT4)</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30 font-semibold">
                  Tahun 4
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Ubah julat peratus markah dan deskripsi tahap penguasaan bagi setiap gred A - F
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Preset Buttons */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilihan Skala Pantas (Preset)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih format skala rasmi MPT4 atau kembalikan kepada skala asal
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(DEFAULT_MPT4_GRADE_SCALES)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <span>Skala MPT4 (82%–100% A)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(STANDARD_KPM_GRADE_SCALES)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                <span>Skala Standard KPM (80%–100%)</span>
              </button>
            </div>
          </div>

          {/* Validation Warning */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Table of Grades */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Jadual Penggredan Matriks Pembelajaran Tahun 4
              </span>
              <span className="text-[11px] text-slate-500">
                Nilai markah 0% hingga 100%
              </span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="p-2.5 text-center w-14">GRED</th>
                  <th className="p-2.5 text-center w-24">MIN (%)</th>
                  <th className="p-2.5 text-center w-24">MAKS (%)</th>
                  <th className="p-2.5 text-left">DESKRIPSI TAHAP PENGUASAAN</th>
                  <th className="p-2.5 text-center w-20">GP (MATA)</th>
                  <th className="p-2.5 text-center w-28">CONTOH LENCANA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {editingScales.map((scale, idx) => (
                  <tr key={scale.grade} className="hover:bg-slate-50/80 transition">
                    {/* Grade Letter */}
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm bg-slate-900 text-white shadow-sm">
                        {scale.grade}
                      </span>
                    </td>

                    {/* Min Mark Input */}
                    <td className="p-2.5 text-center">
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scale.minMark}
                          onChange={(e) => handleFieldChange(idx, 'minMark', e.target.value)}
                          className="w-16 text-center font-bold px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        <span className="ml-1 text-slate-500 text-[10px]">%</span>
                      </div>
                    </td>

                    {/* Max Mark Input */}
                    <td className="p-2.5 text-center">
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scale.maxMark}
                          onChange={(e) => handleFieldChange(idx, 'maxMark', e.target.value)}
                          className="w-16 text-center font-bold px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        <span className="ml-1 text-slate-500 text-[10px]">%</span>
                      </div>
                    </td>

                    {/* Status Label Input */}
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={scale.status}
                        onChange={(e) => handleFieldChange(idx, 'status', e.target.value)}
                        placeholder="Contoh: Penguasaan cemerlang"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </td>

                    {/* GP Point Input */}
                    <td className="p-2.5 text-center">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={scale.gp}
                        onChange={(e) => handleFieldChange(idx, 'gp', e.target.value)}
                        className="w-12 text-center font-bold px-1.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </td>

                    {/* Badge Preview */}
                    <td className="p-2.5 text-center">
                      <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold border ${scale.color}`}>
                        {scale.grade} • {scale.minMark}–{scale.maxMark}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Tester Sandbox */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Uji Penentuan Gred Secara Langsung:</span>
              </span>
              <p className="text-[11px] text-indigo-800">
                Masukkan sebarang peratus markah untuk mengesahkan gred MPT4 yang dijana
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-300 shadow-sm">
                <span className="text-xs font-bold text-slate-600">Markah:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={testMark}
                  onChange={(e) => setTestMark(e.target.value)}
                  className="w-14 text-center font-black text-indigo-900 border-none focus:outline-none text-sm"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>

              {testGrade && (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black border shadow-xs ${testGrade.color}`}>
                    Gred {testGrade.grade} ({testGrade.gp} GP)
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${testPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {testPass ? 'Menguasai' : 'Belum Menguasai'}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleApplyPreset(DEFAULT_MPT4_GRADE_SCALES)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:bg-slate-200 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Pulihkan Asal MPT4</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Kemaskini Gred</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
