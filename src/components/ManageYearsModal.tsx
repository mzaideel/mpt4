import React, { useState } from 'react';
import { AcademicYear } from '../types';
import { Calendar, Plus, Edit2, Trash2, Check, X, ArrowRight, Sparkles, Users, AlertCircle } from 'lucide-react';

interface ManageYearsModalProps {
  isOpen: boolean;
  onClose: () => void;
  years: AcademicYear[];
  activeYearId: string;
  onSelectYear: (yearId: string) => void;
  onAddYear: (
    newYear: AcademicYear,
    importOption: 'carry_forward' | 'duplicate' | 'empty',
    sourceYearId: string
  ) => void;
  onUpdateYear: (yearId: string, updated: Partial<AcademicYear>) => void;
  onDeleteYearRequest: (year: AcademicYear) => void;
  studentCounts: Record<string, number>;
}

export const ManageYearsModal: React.FC<ManageYearsModalProps> = ({
  isOpen,
  onClose,
  years,
  activeYearId,
  onSelectYear,
  onAddYear,
  onUpdateYear,
  onDeleteYearRequest,
  studentCounts,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // Edit inline state
  const [editingYearId, setEditingYearId] = useState<string | null>(null);
  const [editYearNum, setEditYearNum] = useState<number>(2026);
  const [editLabel, setEditLabel] = useState<string>('');
  const [editClassGroup, setEditClassGroup] = useState<string>('');

  // Add new year state
  const maxYear = years.reduce((max, y) => Math.max(max, y.year), 2026);
  const [newYearNum, setNewYearNum] = useState<number>(maxYear + 1);
  const [newLabel, setNewLabel] = useState<string>(`Sesi Akademik ${maxYear + 1} (Tahun 5)`);
  const [newClassGroup, setNewClassGroup] = useState<string>('5 DINAMIK');
  const [importOption, setImportOption] = useState<'carry_forward' | 'duplicate' | 'empty'>('carry_forward');
  const [sourceYearId, setSourceYearId] = useState<string>(activeYearId);

  const startEditing = (y: AcademicYear) => {
    setEditingYearId(y.id);
    setEditYearNum(y.year);
    setEditLabel(y.label);
    setEditClassGroup(y.classGroup);
  };

  const handleSaveEdit = (yearId: string) => {
    if (!editLabel.trim()) return;
    onUpdateYear(yearId, {
      year: editYearNum,
      label: editLabel.trim(),
      classGroup: editClassGroup.trim() || '4 DINAMIK',
    });
    setEditingYearId(null);
  };

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const id = `${newYearNum}_${Date.now()}`;
    const newYear: AcademicYear = {
      id,
      year: newYearNum,
      label: newLabel.trim(),
      classGroup: newClassGroup.trim() || `Tahun ${newYearNum}`,
      description: `Kohort ${newYearNum}`,
    };

    onAddYear(newYear, importOption, sourceYearId);
    setActiveTab('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pengurusan Tahun Headcount</h2>
              <p className="text-xs text-slate-400">
                Urus, tambah dan sunting matriks headcount mengikut tahun (2026 & seterusnya)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-2 px-5">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Senarai & Edit Tahun ({years.length})</span>
          </button>

          <button
            onClick={() => {
              setNewYearNum(maxYear + 1);
              setNewLabel(`Sesi Akademik ${maxYear + 1} (Tahun 5)`);
              setNewClassGroup('5 DINAMIK');
              setActiveTab('add');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'add'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Tahun Baharu</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: LIST & EDIT */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>Pilih tahun untuk aktifkan atau tekan ikon pensel untuk mengedit nama tahun:</span>
              </div>

              {years.map((y) => {
                const isActive = y.id === activeYearId;
                const isEditing = editingYearId === y.id;
                const count = studentCounts[y.id] ?? 0;

                if (isEditing) {
                  return (
                    <div
                      key={y.id}
                      className="p-4 bg-blue-50/70 border-2 border-blue-400 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900">Sunting Maklumat Tahun:</span>
                        <button
                          onClick={() => setEditingYearId(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                        >
                          Batal
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Tahun (Angka)
                          </label>
                          <input
                            type="number"
                            value={editYearNum}
                            onChange={(e) => setEditYearNum(Number(e.target.value))}
                            className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Label / Nama Sesi
                          </label>
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="cth: Sesi Akademik 2026 (Tahun 4)"
                            className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nama Kelas / Kohort
                          </label>
                          <input
                            type="text"
                            value={editClassGroup}
                            onChange={(e) => setEditClassGroup(e.target.value)}
                            placeholder="cth: 4 DINAMIK"
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 uppercase"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingYearId(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(y.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Perubahan</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={y.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-blue-50/50 border-blue-400 shadow-sm ring-1 ring-blue-400/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-sm leading-tight">{y.year}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                          Tahun
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{y.label}</h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                              AKTIF SEKARANG
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Kelas: <strong>{y.classGroup}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{count}</strong> orang murid
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isActive ? (
                        <button
                          onClick={() => onSelectYear(y.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-300 transition"
                        >
                          Pilih Tahun Ini
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-blue-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sedang Dibuka</span>
                        </span>
                      )}

                      <button
                        onClick={() => startEditing(y)}
                        title="Sunting Tahun"
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteYearRequest(y)}
                        disabled={years.length <= 1}
                        title={years.length <= 1 ? 'Tidak boleh memadam tahun tunggal' : 'Padam Tahun'}
                        className={`p-2 rounded-lg border transition ${
                          years.length <= 1
                            ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ADD NEW YEAR */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateYear} className="space-y-4">
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <strong>Tambah Sesi Tahun Baharu (2026, 2027, 2028...):</strong> Anda boleh membawa naik kohort murid dari tahun sebelumnya secara automatik (markah Sebenar tahun lepas dijadikan TOV tahun baharu).
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Akademik *
                  </label>
                  <input
                    type="number"
                    required
                    value={newYearNum}
                    onChange={(e) => {
                      const yr = Number(e.target.value);
                      setNewYearNum(yr);
                      setNewLabel(`Sesi Akademik ${yr} (Tahun ${yr - 2022})`);
                    }}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label / Nama Sesi *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="cth: Sesi Akademik 2027 (Tahun 5)"
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kelas / Kohort
                  </label>
                  <input
                    type="text"
                    value={newClassGroup}
                    onChange={(e) => setNewClassGroup(e.target.value)}
                    placeholder="cth: 5 DINAMIK"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>
              </div>

              {/* Data Import / Cohort Option */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Kaedah Pengisian Murid Bagi Tahun Baharu Ini:
                </label>

                <div className="space-y-2">
                  {/* Option 1: Carry Forward Cohort */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      importOption === 'carry_forward'
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importOption"
                      checked={importOption === 'carry_forward'}
                      onChange={() => setImportOption('carry_forward')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Bawa Naik Kohort Murid (Disyorkan untuk Kenaikan Kelas)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Automatik
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Salin senarai nama murid daripada sesi sedia ada, dan tetapkan <strong>TOV tahun baharu = Markah Sebenar tahun sebelumnya</strong>, dengan sasaran ETR dipertingkatkan secara automatik.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Duplicate All Marks Exactly */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      importOption === 'duplicate'
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importOption"
                      checked={importOption === 'duplicate'}
                      onChange={() => setImportOption('duplicate')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Salin Tepat Semua Data & Markah
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Klon semua murid berserta nilai TOV, ETR, Ujian 1, Ujian 2, dan Sebenar sama seperti tahun sebelumnya.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Empty List */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      importOption === 'empty'
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importOption"
                      checked={importOption === 'empty'}
                      onChange={() => setImportOption('empty')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Senarai Kosong (Daftar Murid Baharu)
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Mulakan tahun ini dengan senarai kosong. Anda boleh menambah murid baharu satu persatu.
                      </p>
                    </div>
                  </label>
                </div>

                {importOption !== 'empty' && years.length > 1 && (
                  <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
                    <span>Sumber salinan data:</span>
                    <select
                      value={sourceYearId}
                      onChange={(e) => setSourceYearId(e.target.value)}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.label} ({studentCounts[y.id] ?? 0} murid)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cipta & Aktifkan Tahun {newYearNum}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Jumlah sesi akademik tersimpan: <strong>{years.length} tahun</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
