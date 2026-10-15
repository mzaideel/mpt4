import React, { useState } from 'react';
import { Student, SubjectId, SubjectMarks } from '../types';
import { SUBJECTS, getGradeInfo, getAchievementBadge, calculateAverage, calculateGPK } from '../utils/headcountUtils';
import { X, Save, User, Award, BookOpen, AlertCircle, TrendingUp, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onUpdateMarks: (studentId: string, subjectId: SubjectId, field: 'tov' | 'etr' | 'ar1' | 'ar2' | 'actual', value: number | null) => void;
  onUpdateNotes: (studentId: string, subjectId: SubjectId, notes: string) => void;
  onUpdateStudentName?: (studentId: string, newName: string) => void;
  onDeleteStudentRequest?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onUpdateMarks,
  onUpdateNotes,
  onUpdateStudentName,
  onDeleteStudentRequest,
}) => {
  if (!student) return null;

  const [activeSubjectTab, setActiveSubjectTab] = useState<SubjectId>('BM');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(student.name);

  // Sync state if student prop changes
  React.useEffect(() => {
    setNameInput(student.name);
  }, [student.name]);

  const handleSaveName = () => {
    if (nameInput.trim() && onUpdateStudentName) {
      onUpdateStudentName(student.id, nameInput.trim().toUpperCase());
    }
    setIsEditingName(false);
  };

  // Overall student averages
  const markList = Object.values(student.marks) as SubjectMarks[];
  const allTov = markList.map((m) => m.tov);
  const allEtr = markList.map((m) => m.etr);
  const allAr1 = markList.map((m) => m.ar1);
  const allAr2 = markList.map((m) => m.ar2);
  const allActual = markList.map((m) => m.actual);

  const avgTov = calculateAverage(allTov);
  const avgEtr = calculateAverage(allEtr);
  const avgActual = calculateAverage(allActual);

  const gpkTov = calculateGPK(allTov);
  const gpkActual = calculateGPK(allActual);

  // Radar chart data for student
  const radarData = SUBJECTS.map((subj) => ({
    subject: subj.code,
    TOV: student.marks[subj.id].tov,
    ETR: student.marks[subj.id].etr,
    Sebenar: student.marks[subj.id].actual ?? 0,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {student.name.charAt(0)}
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    className="px-2.5 py-1 text-sm font-bold text-slate-900 bg-white rounded-lg focus:outline-none uppercase w-full"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{student.name}</h2>
                  <button
                    onClick={() => {
                      setIsEditingName(true);
                      setNameInput(student.name);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
                    title="Sunting Nama Murid"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-0.5">
                Kelas: {student.classGroup} • Jantina: {student.gender === 'L' ? 'Lelaki' : 'Perempuan'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] font-medium text-slate-500">Purata TOV</div>
              <div className="text-xl font-bold text-slate-800">{avgTov}</div>
              <div className="text-[10px] text-slate-500">GPK: {gpkTov}</div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-[11px] font-medium text-blue-700">Purata ETR (Sasaran)</div>
              <div className="text-xl font-bold text-blue-900">{avgEtr}</div>
              <div className="text-[10px] text-blue-600">Sasaran Akhir Tahun</div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-[11px] font-medium text-emerald-800">Purata Sebenar 2026</div>
              <div className="text-xl font-black text-emerald-900">{avgActual}</div>
              <div className="text-[10px] text-emerald-700">GPK Sebenar: {gpkActual}</div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-[11px] font-medium text-amber-800">Pencapaian vs ETR</div>
              <div className="text-lg font-extrabold text-amber-900">
                {avgActual - avgEtr >= 0 ? `+${(avgActual - avgEtr).toFixed(1)}` : (avgActual - avgEtr).toFixed(1)}
              </div>
              <div className="text-[10px] text-amber-700">
                {avgActual >= avgEtr ? 'Mencapai Sasaran' : 'Belum Mencapai Sasaran'}
              </div>
            </div>
          </div>

          {/* Radar Chart & Subject Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Radar Chart */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
              <h3 className="text-xs font-bold text-slate-700 mb-2">Profil Kekuatan Subjek</h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar name="TOV" dataKey="TOV" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                    <Radar name="ETR" dataKey="ETR" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                    <Radar name="Sebenar" dataKey="Sebenar" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="md:col-span-2 overflow-x-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Subjek</th>
                    <th className="p-2.5 text-center">TOV</th>
                    <th className="p-2.5 text-center bg-blue-50 text-blue-900">ETR</th>
                    <th className="p-2.5 text-center">Ujian 1</th>
                    <th className="p-2.5 text-center">Ujian 2</th>
                    <th className="p-2.5 text-center bg-emerald-50 text-emerald-900 font-black">Actual</th>
                    <th className="p-2.5 text-center">Gred</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SUBJECTS.map((subj) => {
                    const m = student.marks[subj.id];
                    const gradeInfo = getGradeInfo(m.actual);
                    const badge = getAchievementBadge(m.actual, m.etr);

                    return (
                      <tr key={subj.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-800">{subj.name} ({subj.code})</td>
                        
                        {/* TOV */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={m.tov}
                            onChange={(e) => onUpdateMarks(student.id, subj.id, 'tov', Number(e.target.value))}
                            className="w-12 text-center bg-slate-50 border border-slate-200 rounded py-0.5 text-xs font-semibold"
                          />
                        </td>

                        {/* ETR */}
                        <td className="p-2 text-center bg-blue-50/40">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={m.etr}
                            onChange={(e) => onUpdateMarks(student.id, subj.id, 'etr', Number(e.target.value))}
                            className="w-12 text-center bg-blue-50 border border-blue-200 rounded py-0.5 text-xs font-bold text-blue-900"
                          />
                        </td>

                        {/* AR1 */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={m.ar1 ?? ''}
                            onChange={(e) => onUpdateMarks(student.id, subj.id, 'ar1', e.target.value === '' ? null : Number(e.target.value))}
                            className="w-12 text-center bg-slate-50 border border-slate-200 rounded py-0.5 text-xs"
                          />
                        </td>

                        {/* AR2 */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={m.ar2 ?? ''}
                            onChange={(e) => onUpdateMarks(student.id, subj.id, 'ar2', e.target.value === '' ? null : Number(e.target.value))}
                            className="w-12 text-center bg-slate-50 border border-slate-200 rounded py-0.5 text-xs"
                          />
                        </td>

                        {/* Actual */}
                        <td className="p-2 text-center bg-emerald-50/40">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={m.actual ?? ''}
                            onChange={(e) => onUpdateMarks(student.id, subj.id, 'actual', e.target.value === '' ? null : Number(e.target.value))}
                            className="w-12 text-center bg-emerald-100 border border-emerald-300 rounded py-0.5 text-xs font-extrabold text-emerald-950"
                          />
                        </td>

                        {/* Gred */}
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded font-extrabold border ${gradeInfo.color}`}>
                            {gradeInfo.grade}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Intervention Notes Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Catatan Intervensi Guru Menurut Mata Pelajaran</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUBJECTS.map((subj) => {
                const notes = student.marks[subj.id].notes || '';
                return (
                  <div key={subj.id} className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Catatan {subj.name} ({subj.code})
                    </label>
                    <input
                      type="text"
                      value={notes}
                      placeholder="Masukkan rancangan intervensi..."
                      onChange={(e) => onUpdateNotes(student.id, subj.id, e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            {onDeleteStudentRequest && (
              <button
                type="button"
                onClick={() => onDeleteStudentRequest(student)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold text-xs transition flex items-center gap-1.5"
                title="Padam rekod murid ini dari headcount"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Rekod Murid</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm"
          >
            Selesai & Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
