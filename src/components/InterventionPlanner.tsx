import React, { useState } from 'react';
import { Student, SubjectId } from '../types';
import { SUBJECTS, getGradeInfo } from '../utils/headcountUtils';
import { BookOpen, AlertTriangle, CheckCircle, Lightbulb, Save, UserCheck } from 'lucide-react';

interface InterventionPlannerProps {
  students: Student[];
  onUpdateNotes: (studentId: string, subjectId: SubjectId, notes: string) => void;
  onOpenStudentModal: (student: Student) => void;
}

export const InterventionPlanner: React.FC<InterventionPlannerProps> = ({
  students,
  onUpdateNotes,
  onOpenStudentModal,
}) => {
  const [selectedSubj, setSelectedSubj] = useState<SubjectId>('MAT');

  const currentSubjObj = SUBJECTS.find((s) => s.id === selectedSubj) || SUBJECTS[0];

  // Filter students who are below ETR or in grades E/F for this subject
  const targetStudents = students.filter((s) => {
    const m = s.marks[selectedSubj];
    const mark = m.actual ?? m.tov;
    return mark < m.etr || mark < 50;
  });

  return (
    <div className="space-y-6 mb-8">
      {/* View Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Pelan Tindakan Intervensi Murid SASARAN (Perlu Bimbingan)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Senarai murid yang belum mencapai ETR atau mendapat Gred D/E/F untuk bimbingan berfokus
          </p>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubj(sub.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedSubj === sub.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub.code}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Strategy Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 rounded-xl border border-amber-200 flex items-start gap-3 text-amber-900">
        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="font-bold text-slate-900">
            Cadangan Program Intervensi Bagi Subjek {currentSubjObj.name}:
          </strong>
          <p className="text-slate-700">
            {selectedSubj === 'MAT' && 'Program "Klinik Sifir 2-9", Modul Latih Tubi Langkah Jalan Kerja, & Sesi Mentor-Mentee Rakan Sebaya.'}
            {selectedSubj === 'BM' && 'Program "Bimbingan Tatabahasa & Penulisan Karangan Berpandu", Modul Kosa Kata Harian.'}
            {selectedSubj === 'BI' && 'Program "Reading Buddy", Phonics & Basic Vocabulary Drill, & Storytelling session.'}
            {selectedSubj === 'SN' && 'Aktiviti Pencerapan Amali Radas, Bimbingan Nota Grafik Visual, & Latihan Istilah Sains.'}
          </p>
        </div>
      </div>

      {/* Target Students List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Senarai {targetStudents.length} Orang Murid Perlu Intervensi ({currentSubjObj.name})
          </h3>
          <span className="text-xs text-slate-500">
            Tahun 4 Sesi 2026
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {targetStudents.map((student, idx) => {
            const m = student.marks[selectedSubj];
            const actual = m.actual ?? m.tov;
            const diff = actual - m.etr;
            const gradeInfo = getGradeInfo(actual);

            return (
              <div key={student.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <button
                      onClick={() => onOpenStudentModal(student)}
                      className="font-bold text-sm text-slate-900 hover:text-blue-600 transition text-left"
                    >
                      {student.name}
                    </button>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Jantina: {student.gender === 'L' ? 'Lelaki' : 'Perempuan'}</span>
                      <span>•</span>
                      <span>Kelas: {student.classGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Score Comparison */}
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="text-center px-3 py-1 bg-slate-100 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">TOV</span>
                    <strong className="text-slate-800">{m.tov}</strong>
                  </div>

                  <div className="text-center px-3 py-1 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                    <span className="text-[10px] text-blue-600 block">ETR</span>
                    <strong className="text-blue-900">{m.etr}</strong>
                  </div>

                  <div className="text-center px-3 py-1 bg-emerald-50 text-emerald-950 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block">Sebenar</span>
                    <strong className="text-emerald-950">{m.actual ?? '-'}</strong>
                  </div>

                  <div className="text-center">
                    <span className={`px-2 py-1 rounded font-bold border ${gradeInfo.color}`}>
                      Gred {gradeInfo.grade}
                    </span>
                  </div>

                  <div className="text-center min-w-[70px]">
                    <span className="text-rose-600 font-bold">
                      {diff} markah
                    </span>
                  </div>
                </div>

                {/* Editable Note Input */}
                <div className="w-full md:w-80">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Program / Catatan Intervensi</label>
                  <input
                    type="text"
                    value={m.notes || ''}
                    placeholder="Contoh: Modul Klinik Sifir..."
                    onChange={(e) => onUpdateNotes(student.id, selectedSubj, e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            );
          })}

          {targetStudents.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Tahniah! Semua murid mencapai sasaran ETR bagi subjek ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
