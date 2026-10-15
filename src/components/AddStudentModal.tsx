import React, { useState } from 'react';
import { Student, SubjectId, SubjectMarks } from '../types';
import { SUBJECTS } from '../utils/headcountUtils';
import { X, UserPlus, Check } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [classGroup, setClassGroup] = useState('4 DINAMIK');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const defaultMarks: Record<SubjectId, SubjectMarks> = {
      BM: { tov: 60, etr: 75, ar1: 65, ar2: 70, actual: 72, notes: '' },
      BI: { tov: 58, etr: 72, ar1: 62, ar2: 68, actual: 70, notes: '' },
      MAT: { tov: 65, etr: 80, ar1: 70, ar2: 75, actual: 78, notes: '' },
      SN: { tov: 62, etr: 76, ar1: 66, ar2: 72, actual: 74, notes: '' },
    };

    const newStudent: Student = {
      id: `s_${Date.now()}`,
      noId: '',
      name: name.trim().toUpperCase(),
      gender,
      classGroup,
      marks: defaultMarks,
    };

    onAddStudent(newStudent);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Tambah Murid Baru</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Penuh Murid
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: MUHAMMAD AIMAN BIN ZULKIFLI"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jantina
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="L">Lelaki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Kelas
            </label>
            <input
              type="text"
              value={classGroup}
              onChange={(e) => setClassGroup(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Daftar Murid</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
