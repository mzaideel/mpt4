import React, { useState } from 'react';
import { Student, SubjectId, GradeLetter, SubjectMarks } from '../types';
import { calculateAverage, calculateGPK, getGradeInfo, SUBJECTS } from '../utils/headcountUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Award } from 'lucide-react';
import { SubjectComparisonBarChart } from './SubjectComparisonBarChart';

interface AnalyticsChartsProps {
  students: Student[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ students }) => {
  const [selectedSubj, setSelectedSubj] = useState<SubjectId | 'ALL'>('ALL');

  // 1. Calculate class progression (TOV -> AR1 -> AR2 -> Actual vs ETR)
  const getAverageForType = (type: 'tov' | 'etr' | 'ar1' | 'ar2' | 'actual', subj: SubjectId | 'ALL') => {
    if (subj === 'ALL') {
      const allVals: number[] = [];
      students.forEach((s) => {
        Object.values(s.marks).forEach((m) => {
          if (m[type] !== null) allVals.push(m[type]!);
        });
      });
      return calculateAverage(allVals);
    } else {
      const vals = students.map((s) => s.marks[subj][type]).filter((v): v is number => v !== null);
      return calculateAverage(vals);
    }
  };

  const progressionData = [
    { stage: 'TOV (Markah Awal)', Markah: getAverageForType('tov', selectedSubj), Sasaran: getAverageForType('etr', selectedSubj) },
    { stage: 'Ujian 1', Markah: getAverageForType('ar1', selectedSubj), Sasaran: getAverageForType('etr', selectedSubj) },
    { stage: 'Ujian 2', Markah: getAverageForType('ar2', selectedSubj), Sasaran: getAverageForType('etr', selectedSubj) },
    { stage: 'Ujian Sebenar 2026', Markah: getAverageForType('actual', selectedSubj), Sasaran: getAverageForType('etr', selectedSubj) },
  ];

  // 2. Grade Distribution (TOV vs Actual 2026)
  const gradesList: GradeLetter[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  const gradeDistributionData = gradesList.map((g) => {
    let tovCount = 0;
    let actualCount = 0;

    students.forEach((s) => {
      if (selectedSubj === 'ALL') {
        (Object.values(s.marks) as SubjectMarks[]).forEach((m) => {
          if (getGradeInfo(m.tov).grade === g) tovCount++;
          if (getGradeInfo(m.actual).grade === g) actualCount++;
        });
      } else {
        const m = s.marks[selectedSubj];
        if (getGradeInfo(m.tov).grade === g) tovCount++;
        if (getGradeInfo(m.actual).grade === g) actualCount++;
      }
    });

    return {
      grade: `Gred ${g}`,
      TOV: tovCount,
      'Ujian Sebenar 2026': actualCount,
    };
  });

  // 3. Subject GPK Comparison
  const subjectGpkData = SUBJECTS.map((subj) => {
    const tovMarks = students.map((s) => s.marks[subj.id].tov);
    const actualMarks = students.map((s) => s.marks[subj.id].actual);
    const gpkTov = calculateGPK(tovMarks);
    const gpkActual = calculateGPK(actualMarks);

    return {
      subCode: subj.code,
      subName: subj.name,
      'GPK TOV': gpkTov,
      'GPK Sebenar': gpkActual,
    };
  });

  // 4. Achievement Status Pie Chart
  let melepasiEtr = 0;
  let mencapaiEtr = 0;
  let belumEtr = 0;

  students.forEach((s) => {
    if (selectedSubj === 'ALL') {
      const marksArr = Object.values(s.marks) as SubjectMarks[];
      const avgAct = calculateAverage(marksArr.map((m) => m.actual));
      const avgEtr = calculateAverage(marksArr.map((m) => m.etr));
      const diff = avgAct - avgEtr;
      if (diff >= 5) melepasiEtr++;
      else if (diff >= 0) mencapaiEtr++;
      else belumEtr++;
    } else {
      const m = s.marks[selectedSubj];
      if (m.actual !== null) {
        const diff = m.actual - m.etr;
        if (diff >= 5) melepasiEtr++;
        else if (diff >= 0) mencapaiEtr++;
        else belumEtr++;
      }
    }
  });

  const pieData = [
    { name: 'Melepasi ETR (+5 markah)', value: melepasiEtr, color: '#10b981' },
    { name: 'Mencapai ETR (0-4 markah)', value: mencapaiEtr, color: '#3b82f6' },
    { name: 'Belum Mencapai ETR', value: belumEtr, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Subj Filter Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Analisis & Graf Matriks Headcount Pembelajaran</span>
          </h2>
          <p className="text-xs text-slate-500">
            Paparan visual perkembangan kelas Tahun 4 (2026) merentasi penilaian
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSubj('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedSubj === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Keseluruhan Subjek
          </button>
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubj(sub.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedSubj === sub.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub.code}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Multi-Subject Comparison Component (BM, BI, MAT, SN) */}
      <SubjectComparisonBarChart students={students} />

      {/* Grid 1: Line Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progression Line Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Trend Perkembangan Markah Purata Kelas</span>
              </h3>
              <p className="text-xs text-slate-500">
                Laluan TOV → Ujian 1 → Ujian 2 → Ujian Sebenar berbanding ETR
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Markah"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="Sasaran"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ETR Status Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <span>Pencapaian Sasaran ETR</span>
            </h3>
            <p className="text-xs text-slate-500">Peratusan murid mencapai ETR</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-2">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </span>
                <strong className="text-slate-800">{item.value} murid</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid 2: Grade Distribution Bar Chart & GPK by Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Taburan Gred Murid (TOV vs Ujian Sebenar 2026)</span>
            </h3>
            <p className="text-xs text-slate-500">Bilangan murid mengikut Gred A, B, C, D, E, F</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistributionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="TOV" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Ujian Sebenar 2026" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject GPK Comparison Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Perbandingan GPK Mengikut Subjek (Gred Purata)</span>
            </h3>
            <p className="text-xs text-slate-500">Nilai GPK lebih rendah menunjukkan prestasi lebih cemerlang</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectGpkData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="subCode" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[1, 6]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="GPK TOV" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="GPK Sebenar" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
