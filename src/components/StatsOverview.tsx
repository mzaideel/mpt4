import React from 'react';
import { Student, SubjectId, SubjectMarks } from '../types';
import { calculateAverage, calculateGPK, getGradeInfo, SUBJECTS } from '../utils/headcountUtils';
import { TrendingUp, Award, AlertTriangle, Target, CheckCircle2 } from 'lucide-react';

interface StatsOverviewProps {
  students: Student[];
  selectedSubject: SubjectId | 'ALL';
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ students, selectedSubject }) => {
  const getMarksList = (type: 'tov' | 'etr' | 'ar1' | 'ar2' | 'actual') => {
    if (selectedSubject === 'ALL') {
      return students.map((s) => {
        const vals = Object.values(s.marks).map((m) => m[type]);
        return calculateAverage(vals);
      });
    } else {
      return students.map((s) => s.marks[selectedSubject][type]);
    }
  };

  const tovList = getMarksList('tov');
  const etrList = getMarksList('etr');
  const actualList = getMarksList('actual');

  const gpkTov = calculateGPK(tovList);
  const gpkEtr = calculateGPK(etrList);
  const gpkActual = calculateGPK(actualList);

  const avgTov = calculateAverage(tovList);
  const avgEtr = calculateAverage(etrList);
  const avgActual = calculateAverage(actualList);

  const passCountTov = tovList.filter((m) => m !== null && m >= 40).length;
  const passCountActual = actualList.filter((m) => m !== null && m >= 40).length;

  const passPctTov = Math.round((passCountTov / students.length) * 100);
  const passPctActual = Math.round((passCountActual / students.length) * 100);

  // Grade A counts
  const gradeACount = actualList.filter((m) => getGradeInfo(m).grade === 'A').length;

  // Below ETR count
  let belowEtrCount = 0;
  students.forEach((s) => {
    if (selectedSubject === 'ALL') {
      const markList = Object.values(s.marks) as SubjectMarks[];
      const actualAvg = calculateAverage(markList.map((m) => m.actual));
      const etrAvg = calculateAverage(markList.map((m) => m.etr));
      if (actualAvg < etrAvg) belowEtrCount++;
    } else {
      const m = s.marks[selectedSubject];
      if (m.actual !== null && m.actual < m.etr) belowEtrCount++;
    }
  });

  const subjectName =
    selectedSubject === 'ALL'
      ? 'Keseluruhan Mata Pelajaran'
      : SUBJECTS.find((s) => s.id === selectedSubject)?.name || selectedSubject;

  const gpkDiff = (gpkTov - gpkActual).toFixed(2); // In GPK lower is better, so if GPK decreased it's an improvement!

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Ringkasan Pencapaian Matriks Headcount</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {subjectName}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Perbandingan Markah TOV, Sasaran (ETR) dan Markah Ujian Sebenar 2026
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* GPK Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-100/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold mb-1">
            <span>GPK (Gred Purata)</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{gpkActual}</span>
            <span className="text-xs text-slate-500 font-medium">/ 6.00</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
            <span>TOV: <strong className="font-semibold text-slate-700">{gpkTov}</strong></span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              Beza: {gpkDiff}
            </span>
          </div>
        </div>

        {/* Peratus Lulus Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/80">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
            <span>% Lulus (Menguasai)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{passPctActual}%</span>
            <span className="text-xs text-slate-500">({passCountActual}/{students.length} murid)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            TOV: <strong className="font-semibold">{passPctTov}%</strong> ({passCountTov} murid)
          </div>
        </div>

        {/* Purata Markah Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/80">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
            <span>Purata Markah Akhir</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{avgActual}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between">
            <span>TOV: <strong>{avgTov}</strong></span>
            <span>ETR: <strong className="text-amber-700">{avgEtr}</strong></span>
          </div>
        </div>

        {/* Gred A Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-100/80">
          <div className="flex items-center justify-between text-blue-800 text-xs font-semibold mb-1">
            <span>Murid Cemerlang (A)</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">{gradeACount}</span>
            <span className="text-xs text-slate-500">
              ({Math.round((gradeACount / students.length) * 100)}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            Sasaran TP6 / Gred A UASA 2026
          </div>
        </div>

        {/* Murid Intervensi Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50/50 border border-rose-100/80 col-span-2 md:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold mb-1">
            <span>Belum Mencapai ETR</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700">{belowEtrCount}</span>
            <span className="text-xs text-slate-500">orang murid</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-600 font-medium">
            Perlu Tindakan Intervensi
          </div>
        </div>
      </div>
    </div>
  );
};
