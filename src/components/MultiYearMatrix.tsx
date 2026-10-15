import React, { useState } from 'react';
import { AcademicYear, Student, SubjectId, SubjectMarks } from '../types';
import { SUBJECTS, calculateAverage, calculateGPK, getGradeInfo, getAchievementBadge } from '../utils/headcountUtils';
import {
  TrendingUp,
  Calendar,
  Plus,
  Users,
  Award,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Search,
  ChevronRight,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface MultiYearMatrixProps {
  years: AcademicYear[];
  studentsByYear: Record<string, Student[]>;
  activeYearId: string;
  onSelectYear: (yearId: string) => void;
  onOpenAddYearModal: () => void;
  onOpenManageYearsModal: () => void;
  onOpenStudentModal: (student: Student) => void;
}

export const MultiYearMatrix: React.FC<MultiYearMatrixProps> = ({
  years,
  studentsByYear,
  activeYearId,
  onSelectYear,
  onOpenAddYearModal,
  onOpenManageYearsModal,
  onOpenStudentModal,
}) => {
  const [selectedSubj, setSelectedSubj] = useState<SubjectId | 'ALL'>('ALL');
  const [searchStudentTerm, setSearchStudentTerm] = useState('');

  // Sort years chronologically
  const sortedYears = [...years].sort((a, b) => a.year - b.year);

  // Compute metrics for a specific year and subject
  const getYearSummary = (yearId: string) => {
    const students = studentsByYear[yearId] || [];
    if (students.length === 0) {
      return {
        total: 0,
        avgTov: 0,
        avgEtr: 0,
        avgAr1: 0,
        avgAr2: 0,
        avgActual: 0,
        gpkTov: 0,
        gpkActual: 0,
        passPct: 0,
      };
    }

    const getMarks = (type: 'tov' | 'etr' | 'ar1' | 'ar2' | 'actual') => {
      if (selectedSubj === 'ALL') {
        return students.map((s) => calculateAverage(Object.values(s.marks).map((m) => m[type])));
      } else {
        return students.map((s) => s.marks[selectedSubj][type]);
      }
    };

    const tovList = getMarks('tov');
    const etrList = getMarks('etr');
    const ar1List = getMarks('ar1');
    const ar2List = getMarks('ar2');
    const actualList = getMarks('actual');

    const avgTov = calculateAverage(tovList);
    const avgEtr = calculateAverage(etrList);
    const avgAr1 = calculateAverage(ar1List);
    const avgAr2 = calculateAverage(ar2List);
    const avgActual = calculateAverage(actualList);

    const gpkTov = calculateGPK(tovList);
    const gpkActual = calculateGPK(actualList);

    const validActual = actualList.filter((m): m is number => m !== null);
    const passCount = validActual.filter((m) => m >= 40).length;
    const passPct = validActual.length > 0 ? Math.round((passCount / validActual.length) * 100) : 0;

    return {
      total: students.length,
      avgTov,
      avgEtr,
      avgAr1,
      avgAr2,
      avgActual,
      gpkTov,
      gpkActual,
      passPct,
    };
  };

  // Prepare chart data for multi-year trends
  const trendChartData = sortedYears.map((y) => {
    const summary = getYearSummary(y.id);
    return {
      tahun: `${y.year}`,
      label: y.label,
      'Purata TOV': summary.avgTov,
      'Purata Sasaran (ETR)': summary.avgEtr,
      'Purata Sebenar': summary.avgActual,
      'GPK Sebenar': summary.gpkActual,
      'Kadar Lulus (%)': summary.passPct,
    };
  });

  // Unique list of all student names across all years for cohort matrix
  const allStudentNames = Array.from(
    new Set(
      (Object.values(studentsByYear) as Student[][]).flatMap((stList) => stList.map((s) => s.name))
    )
  ).sort();

  const filteredNames = allStudentNames.filter((name) =>
    name.toLowerCase().includes(searchStudentTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>MATRIKS RENTAS TAHUN</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {years.length} Kohort Tersedia
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Matriks Headcount Mengikut Tahun ({sortedYears[0]?.year} - {sortedYears[sortedYears.length - 1]?.year})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penjejakan perkembangan akademik kohort berturut-turut, perbandingan TOV, ETR, dan GPK sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddYearModal}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tahun Baharu</span>
          </button>

          <button
            onClick={onOpenManageYearsModal}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Urus & Edit Tahun</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">
            Subjek Matriks:
          </span>
          <button
            onClick={() => setSelectedSubj('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedSubj === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Keseluruhan (Purata Matriks)
          </button>
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubj(sub.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedSubj === sub.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub.name} ({sub.code})
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Tahun Aktif Semasa: <strong>{years.find((y) => y.id === activeYearId)?.label}</strong></span>
        </div>
      </div>

      {/* SECTION 1: Matriks Ringkasan Tahunan (Yearly Matrix Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Jadual Matriks Headcount Mengikut Tahun
              </h3>
              <p className="text-xs text-slate-400">
                Data kumulatif TOV, ETR, Ujian 1, Ujian 2, Markah Sebenar & GPK dari tahun ke tahun
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Tahun / Sesi</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3 text-center">Bil. Murid</th>
                <th className="py-3 px-3 text-center bg-blue-50/50">Purata TOV</th>
                <th className="py-3 px-3 text-center bg-indigo-50/50">Purata ETR</th>
                <th className="py-3 px-3 text-center">Ujian 1</th>
                <th className="py-3 px-3 text-center">Ujian 2</th>
                <th className="py-3 px-3 text-center bg-emerald-50/60 text-emerald-950">Purata Sebenar</th>
                <th className="py-3 px-3 text-center">Beza (Sebenar - TOV)</th>
                <th className="py-3 px-3 text-center">GPK Sebenar</th>
                <th className="py-3 px-3 text-center">% Lulus</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {sortedYears.map((y, idx) => {
                const summary = getYearSummary(y.id);
                const isActive = y.id === activeYearId;
                const tovGrade = getGradeInfo(summary.avgTov);
                const etrGrade = getGradeInfo(summary.avgEtr);
                const actualGrade = getGradeInfo(summary.avgActual);
                const diffTov = summary.avgActual - summary.avgTov;

                return (
                  <tr
                    key={y.id}
                    className={`hover:bg-slate-50 transition ${
                      isActive ? 'bg-blue-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {y.year}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{y.label}</span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-600 text-white">
                                AKTIF
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">Kohort ID: {y.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                        {y.classGroup}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold">
                      {summary.total}
                    </td>

                    {/* TOV */}
                    <td className="py-3.5 px-3 text-center bg-blue-50/30">
                      <span className="font-bold text-slate-900">{summary.avgTov}</span>
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${tovGrade.color}`}>
                        {tovGrade.grade}
                      </span>
                    </td>

                    {/* ETR */}
                    <td className="py-3.5 px-3 text-center bg-indigo-50/30">
                      <span className="font-bold text-indigo-900">{summary.avgEtr}</span>
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${etrGrade.color}`}>
                        {etrGrade.grade}
                      </span>
                    </td>

                    {/* AR1 */}
                    <td className="py-3.5 px-3 text-center text-slate-600">
                      {summary.avgAr1 || '-'}
                    </td>

                    {/* AR2 */}
                    <td className="py-3.5 px-3 text-center text-slate-600">
                      {summary.avgAr2 || '-'}
                    </td>

                    {/* Actual */}
                    <td className="py-3.5 px-3 text-center bg-emerald-50/50">
                      <span className="font-extrabold text-emerald-950 text-sm">{summary.avgActual}</span>
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${actualGrade.color}`}>
                        {actualGrade.grade}
                      </span>
                    </td>

                    {/* Diff */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          diffTov >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {diffTov >= 0 ? `+${diffTov}` : diffTov}
                      </span>
                    </td>

                    {/* GPK */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                      {summary.gpkActual.toFixed(2)}
                    </td>

                    {/* % Pass */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          summary.passPct >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : summary.passPct >= 50
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {summary.passPct}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      {isActive ? (
                        <span className="text-[11px] font-bold text-blue-600 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Dibuka</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onSelectYear(y.id)}
                          className="px-3 py-1 bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          Buka Tahun Ini
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Visual Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Average Progression Across Years */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Perbandingan Purata Markah Rentas Tahun</span>
              </h4>
              <p className="text-xs text-slate-400">TOV vs ETR vs Ujian Sebenar mengikut tahun</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tahun" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Purata TOV" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Purata Sasaran (ETR)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Purata Sebenar" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: GPK (Gred Purata Kelas) Trend Across Years */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Trend Gred Purata Sekolah (GPK) & % Lulus</span>
              </h4>
              <p className="text-xs text-slate-400">Nilai GPK lebih rendah menunjukkan prestasi lebih cemerlang</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tahun" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[1, 6]} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="GPK Sebenar"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Kadar Lulus (%)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* SECTION 3: Longitudinal Cohort Matrix Table (Perkembangan Murid Mengikut Tahun) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Matriks Penjejakan Murid Rentas Tahun (Kohort)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pantau perkembangan markah setiap murid dari tahun {sortedYears[0]?.year} hingga {sortedYears[sortedYears.length - 1]?.year}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama murid..."
              value={searchStudentTerm}
              onChange={(e) => setSearchStudentTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4">Nama Murid</th>
                {sortedYears.map((y) => (
                  <th key={y.id} className="py-3 px-3 text-center border-l border-slate-200 bg-slate-50">
                    <span className="text-slate-900 font-extrabold">{y.year}</span>
                    <span className="block text-[9px] text-slate-500 font-normal">
                      TOV → Sebenar
                    </span>
                  </th>
                ))}
                <th className="py-3 px-4 text-center border-l border-slate-200">
                  Trend Keseluruhan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredNames.map((name, index) => {
                // Find student record in each year
                const recordsByYear = sortedYears.map((y) => {
                  const student = (studentsByYear[y.id] || []).find((s) => s.name === name);
                  if (!student) return null;

                  let tov = 0;
                  let etr = 0;
                  let actual = 0;

                  if (selectedSubj === 'ALL') {
                    const allMarks = Object.values(student.marks) as SubjectMarks[];
                    tov = calculateAverage(allMarks.map((m) => m.tov));
                    etr = calculateAverage(allMarks.map((m) => m.etr));
                    actual = calculateAverage(allMarks.map((m) => m.actual));
                  } else {
                    const m = student.marks[selectedSubj];
                    tov = m.tov;
                    etr = m.etr;
                    actual = m.actual ?? 0;
                  }

                  return {
                    yearId: y.id,
                    student,
                    tov,
                    etr,
                    actual,
                  };
                });

                // Compute overall progression from first recorded year to last recorded year
                const validRecords = recordsByYear.filter((r): r is NonNullable<typeof r> => r !== null);
                let overallTrend = 0;
                if (validRecords.length >= 2) {
                  overallTrend = validRecords[validRecords.length - 1].actual - validRecords[0].tov;
                } else if (validRecords.length === 1) {
                  overallTrend = validRecords[0].actual - validRecords[0].tov;
                }

                // Sample student object for modal
                const sampleStudent = validRecords[validRecords.length - 1]?.student;

                return (
                  <tr key={name} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">
                      {index + 1}
                    </td>

                    <td className="py-3 px-4">
                      {sampleStudent ? (
                        <button
                          onClick={() => onOpenStudentModal(sampleStudent)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left transition"
                        >
                          {name}
                        </button>
                      ) : (
                        <span className="font-bold text-slate-900">{name}</span>
                      )}
                    </td>

                    {/* Year Columns */}
                    {recordsByYear.map((rec, yIdx) => {
                      if (!rec) {
                        return (
                          <td key={yIdx} className="py-3 px-3 text-center border-l border-slate-100 text-slate-300">
                            -
                          </td>
                        );
                      }

                      const grade = getGradeInfo(rec.actual);
                      const diff = rec.actual - rec.tov;

                      return (
                        <td key={yIdx} className="py-3 px-3 text-center border-l border-slate-100">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-slate-500">{rec.tov}</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="font-extrabold text-slate-900">{rec.actual}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${grade.color}`}>
                              {grade.grade}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold mt-0.5 block ${
                              diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {diff >= 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                      );
                    })}

                    {/* Overall Trend */}
                    <td className="py-3 px-4 text-center border-l border-slate-100">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          overallTrend >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <TrendingUp className={`w-3.5 h-3.5 ${overallTrend >= 0 ? '' : 'rotate-180'}`} />
                        <span>{overallTrend >= 0 ? `+${overallTrend}` : overallTrend} markah</span>
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredNames.length === 0 && (
                <tr>
                  <td colSpan={sortedYears.length + 3} className="py-8 text-center text-slate-400">
                    Tiada murid dijumpai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
