import React, { useState } from 'react';
import { Student, GradeScale } from '../types';
import { SUBJECTS, calculateAverage, getActiveGradeScales } from '../utils/headcountUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { BarChart3, TrendingUp, Award, AlertCircle, CheckCircle2, Target } from 'lucide-react';

interface SubjectComparisonBarChartProps {
  students: Student[];
  gradeScales?: GradeScale[];
  title?: string;
  subtitle?: string;
}

export const SubjectComparisonBarChart: React.FC<SubjectComparisonBarChartProps> = ({
  students,
  gradeScales,
  title = 'Perbandingan Peratus Pencapaian Markah Antara Subjek (BM, BI, MAT, SN)',
  subtitle = 'Graf perbandingan pencapaian bagi memudahkan analisis guru kelas dan guru mata pelajaran',
}) => {
  const [metricMode, setMetricMode] = useState<'comparison' | 'pass_rate' | 'etr_achievement'>(
    'comparison'
  );

  const activeScales = gradeScales && gradeScales.length > 0 ? gradeScales : getActiveGradeScales();

  // Compute metrics for all 4 subjects
  const subjectMetrics = SUBJECTS.map((subj) => {
    const tovMarks = students.map((s) => s.marks[subj.id].tov);
    const etrMarks = students.map((s) => s.marks[subj.id].etr);
    const actualMarks = students
      .map((s) => s.marks[subj.id].actual)
      .filter((v): v is number => v !== null && !isNaN(v));

    const avgTov = calculateAverage(tovMarks);
    const avgEtr = calculateAverage(etrMarks);
    const avgActual = calculateAverage(actualMarks);

    // Pass rate (Actual >= 40%)
    const passCount = actualMarks.filter((m) => m >= 40).length;
    const passRate = students.length > 0 ? Math.round((passCount / students.length) * 100) : 0;

    // ETR achieved count (Actual >= ETR)
    let etrAchievedCount = 0;
    students.forEach((s) => {
      const m = s.marks[subj.id];
      if (m.actual !== null && m.actual >= m.etr) {
        etrAchievedCount++;
      }
    });
    const etrAchieveRate =
      students.length > 0 ? Math.round((etrAchievedCount / students.length) * 100) : 0;

    // Grade A count
    const gradeACount = actualMarks.filter((m) => m >= 80).length;

    return {
      id: subj.id,
      code: subj.code,
      name: subj.name,
      avgTov,
      avgEtr,
      avgActual,
      passRate,
      passCount,
      etrAchieveRate,
      etrAchievedCount,
      gradeACount,
      diffVsEtr: parseFloat((avgActual - avgEtr).toFixed(1)),
    };
  });

  // Prepare data for recharts depending on metricMode
  const chartData = subjectMetrics.map((sm) => {
    if (metricMode === 'pass_rate') {
      return {
        subject: sm.name,
        code: sm.code,
        'Peratus Lulus (≥40%)': sm.passRate,
        'Belum Menguasai': 100 - sm.passRate,
      };
    } else if (metricMode === 'etr_achievement') {
      return {
        subject: sm.name,
        code: sm.code,
        'Capai Sasaran ETR': sm.etrAchieveRate,
        'Belum Capai Sasaran': 100 - sm.etrAchieveRate,
      };
    } else {
      // Comparison: TOV vs ETR vs Sebenar
      return {
        subject: sm.name,
        code: sm.code,
        'TOV (Awal)': sm.avgTov,
        'Sasaran (ETR)': sm.avgEtr,
        'Ujian Sebenar': sm.avgActual,
      };
    }
  });

  // Find best and lowest performing subject
  const sortedByActual = [...subjectMetrics].sort((a, b) => b.avgActual - a.avgActual);
  const bestSubj = sortedByActual[0];
  const lowestSubj = sortedByActual[sortedByActual.length - 1];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl gap-1 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setMetricMode('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'comparison'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>TOV vs ETR vs Sebenar (%)</span>
          </button>
          <button
            onClick={() => setMetricMode('pass_rate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'pass_rate'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Peratus Lulus (%)</span>
          </button>
          <button
            onClick={() => setMetricMode('etr_achievement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'etr_achievement'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Capai Sasaran ETR (%)</span>
          </button>
        </div>
      </div>

      {/* Main Chart Graphic Area */}
      <div className="p-4 sm:p-6">
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="code"
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(code) => {
                  const s = SUBJECTS.find((sub) => sub.code === code);
                  return s ? `${s.name} (${s.code})` : code;
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                }}
                formatter={(val: any) => [`${val}%`, '']}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
              />

              {metricMode === 'comparison' && (
                <>
                  <Bar
                    dataKey="TOV (Awal)"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  >
                    <LabelList dataKey="TOV (Awal)" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '11px', fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                  <Bar
                    dataKey="Sasaran (ETR)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  >
                    <LabelList dataKey="Sasaran (ETR)" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '11px', fontWeight: 700, fill: '#1d4ed8' }} />
                  </Bar>
                  <Bar
                    dataKey="Ujian Sebenar"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  >
                    <LabelList dataKey="Ujian Sebenar" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '11px', fontWeight: 800, fill: '#047857' }} />
                  </Bar>
                </>
              )}

              {metricMode === 'pass_rate' && (
                <>
                  <Bar
                    dataKey="Peratus Lulus (≥40%)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={55}
                  >
                    <LabelList dataKey="Peratus Lulus (≥40%)" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '11px', fontWeight: 800, fill: '#047857' }} />
                  </Bar>
                  <Bar
                    dataKey="Belum Menguasai"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={55}
                  >
                    <LabelList dataKey="Belum Menguasai" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '11px', fontWeight: 700, fill: '#be123c' }} />
                  </Bar>
                </>
              )}

              {metricMode === 'etr_achievement' && (
                <>
                  <Bar
                    dataKey="Capai Sasaran ETR"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={55}
                  >
                    <LabelList dataKey="Capai Sasaran ETR" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '11px', fontWeight: 800, fill: '#6d28d9' }} />
                  </Bar>
                  <Bar
                    dataKey="Belum Capai Sasaran"
                    fill="#fbbf24"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={55}
                  >
                    <LabelList dataKey="Belum Capai Sasaran" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '11px', fontWeight: 700, fill: '#b45309' }} />
                  </Bar>
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4 Subjects Direct Metric Cards for Teachers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          {subjectMetrics.map((sm) => {
            const isBest = sm.id === bestSubj?.id;
            const isLowest = sm.id === lowestSubj?.id && bestSubj?.id !== lowestSubj?.id;

            return (
              <div
                key={sm.id}
                className={`p-3 rounded-xl border transition ${
                  isBest
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : isLowest
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                    {sm.name} ({sm.code})
                  </span>
                  {isBest && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                      <Award className="w-3 h-3" />
                      Tertinggi
                    </span>
                  )}
                  {isLowest && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                      <AlertCircle className="w-3 h-3" />
                      Fokus
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Purata Sebenar:</span>
                    <strong className="text-slate-900 font-extrabold text-sm">{sm.avgActual}%</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Sasaran ETR:</span>
                    <span className="font-semibold text-blue-700">{sm.avgEtr}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Peratus Lulus:</span>
                    <span className={`font-bold ${sm.passRate >= 80 ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {sm.passRate}% ({sm.passCount}/{students.length})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Capai ETR:</span>
                    <span className={`font-bold ${sm.etrAchieveRate >= 50 ? 'text-purple-700' : 'text-amber-700'}`}>
                      {sm.etrAchieveRate}% ({sm.etrAchievedCount} murid)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
