import { GradeLetter, GradeScale, SubjectMarks, Student, SubjectId } from '../types';

export const LOCAL_STORAGE_GRADE_SCALES_KEY = 'headcount_grade_scales_mpt4_v1';

export const SUBJECTS: { id: SubjectId; name: string; code: string; color: string }[] = [
  { id: 'BM', name: 'Bahasa Melayu', code: 'BM', color: '#2563eb' },
  { id: 'BI', name: 'Bahasa Inggeris', code: 'BI', color: '#0284c7' },
  { id: 'MAT', name: 'Matematik', code: 'MT', color: '#7c3aed' },
  { id: 'SN', name: 'Sains', code: 'SN', color: '#059669' },
];

// Skala Gred Asas bagi Matriks Pembelajaran Tahun 4 (MPT4) mengikut peratusan markah
export const DEFAULT_MPT4_GRADE_SCALES: GradeScale[] = [
  {
    grade: 'A',
    minMark: 82,
    maxMark: 100,
    gp: 1,
    status: 'Penguasaan cemerlang',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    grade: 'B',
    minMark: 66,
    maxMark: 81,
    gp: 2,
    status: 'Penguasaan kepujian',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    grade: 'C',
    minMark: 50,
    maxMark: 65,
    gp: 3,
    status: 'Penguasaan baik',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  {
    grade: 'D',
    minMark: 35,
    maxMark: 49,
    gp: 4,
    status: 'Penguasaan memuaskan',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    grade: 'E',
    minMark: 20,
    maxMark: 34,
    gp: 5,
    status: 'Penguasaan minimum',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    grade: 'F',
    minMark: 0,
    maxMark: 19,
    gp: 6,
    status: 'Belum mencapai penguasaan minimum',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
  },
];

// Skala Standard KPM Konvensional (untuk rujukan / pilihan pertukaran)
export const STANDARD_KPM_GRADE_SCALES: GradeScale[] = [
  {
    grade: 'A',
    minMark: 80,
    maxMark: 100,
    gp: 1,
    status: 'Cemerlang',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    grade: 'B',
    minMark: 65,
    maxMark: 79,
    gp: 2,
    status: 'Kepujian',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    grade: 'C',
    minMark: 50,
    maxMark: 64,
    gp: 3,
    status: 'Baik',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  {
    grade: 'D',
    minMark: 40,
    maxMark: 49,
    gp: 4,
    status: 'Memuaskan',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    grade: 'E',
    minMark: 30,
    maxMark: 39,
    gp: 5,
    status: 'Belum Menguasai',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    grade: 'F',
    minMark: 0,
    maxMark: 29,
    gp: 6,
    status: 'Sangat Terhad',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
  },
];

// Global runtime active cache
let currentActiveGradeScales: GradeScale[] = DEFAULT_MPT4_GRADE_SCALES;

export function loadSavedGradeScales(): GradeScale[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_GRADE_SCALES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 6) {
        currentActiveGradeScales = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load grade scales from localStorage:', e);
  }
  currentActiveGradeScales = DEFAULT_MPT4_GRADE_SCALES;
  return DEFAULT_MPT4_GRADE_SCALES;
}

export function saveGradeScales(scales: GradeScale[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_GRADE_SCALES_KEY, JSON.stringify(scales));
    currentActiveGradeScales = scales;
  } catch (e) {
    console.error('Failed to save grade scales to localStorage:', e);
  }
}

export function getActiveGradeScales(): GradeScale[] {
  return currentActiveGradeScales;
}

export function setActiveGradeScalesInMemory(scales: GradeScale[]): void {
  currentActiveGradeScales = scales;
}

// Initialise memory cache from localStorage if available
if (typeof window !== 'undefined') {
  loadSavedGradeScales();
}

export const GRADE_SCALES: GradeScale[] = DEFAULT_MPT4_GRADE_SCALES;

export function getGradeInfo(mark: number | null, scales: GradeScale[] = currentActiveGradeScales): GradeScale {
  if (mark === null || isNaN(mark)) {
    const fScale = scales.find((s) => s.grade === 'F') || scales[scales.length - 1];
    return {
      ...fScale,
      color: 'bg-slate-100 text-slate-500 border-slate-200',
    };
  }
  const val = Math.max(0, Math.min(100, Math.round(mark)));
  for (const scale of scales) {
    if (val >= scale.minMark && val <= scale.maxMark) {
      return scale;
    }
  }
  return scales[scales.length - 1];
}

export function isPass(mark: number | null, scales: GradeScale[] = currentActiveGradeScales): boolean {
  if (mark === null) return false;
  // In MPT4, Grade E (minMark >= 20) is Penguasaan minimum. Grade F (<20) is Belum mencapai penguasaan minimum.
  const eScale = scales.find((s) => s.grade === 'E');
  const passingThreshold = eScale ? eScale.minMark : 20;
  return mark >= passingThreshold;
}

export function calculateGPK(marksList: (number | null)[], scales: GradeScale[] = currentActiveGradeScales): number {
  const validMarks = marksList.filter((m): m is number => m !== null && !isNaN(m));
  if (validMarks.length === 0) return 0;

  const totalPoints = validMarks.reduce((acc, mark) => {
    return acc + getGradeInfo(mark, scales).gp;
  }, 0);

  return parseFloat((totalPoints / validMarks.length).toFixed(2));
}

export function calculateAverage(marksList: (number | null)[]): number {
  const validMarks = marksList.filter((m): m is number => m !== null && !isNaN(m));
  if (validMarks.length === 0) return 0;
  const sum = validMarks.reduce((a, b) => a + b, 0);
  return parseFloat((sum / validMarks.length).toFixed(1));
}

export function getAchievementBadge(actual: number | null, etr: number) {
  if (actual === null) return { label: 'Belum Ada Markah', color: 'bg-slate-100 text-slate-600 border-slate-200' };

  const diff = actual - etr;
  if (diff >= 5) {
    return { label: `Melepasi ETR (+${diff})`, color: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
  } else if (diff >= 0) {
    return { label: `Mencapai ETR (${diff >= 0 ? '+' : ''}${diff})`, color: 'bg-blue-50 text-blue-700 border-blue-300' };
  } else if (diff >= -5) {
    return { label: `Hampir ETR (${diff})`, color: 'bg-amber-50 text-amber-700 border-amber-300' };
  } else {
    return { label: `Belum Mencapai ETR (${diff})`, color: 'bg-rose-50 text-rose-700 border-rose-300' };
  }
}

export function exportToCSV(
  students: Student[],
  selectedSubject: SubjectId | 'ALL',
  scales: GradeScale[] = currentActiveGradeScales
) {
  let csvContent = 'data:text/csv;charset=utf-8,';

  if (selectedSubject === 'ALL') {
    csvContent += 'No,Nama Murid,Kelas,Purata TOV,Purata ETR,Purata Ujian 1,Purata Ujian 2,Purata Ujian Sebenar,GPK Sebenar,Gred MPT4,Status Penguasaan\n';
    students.forEach((s, idx) => {
      const allTov = Object.values(s.marks).map((m) => m.tov);
      const allEtr = Object.values(s.marks).map((m) => m.etr);
      const allAr1 = Object.values(s.marks).map((m) => m.ar1);
      const allAr2 = Object.values(s.marks).map((m) => m.ar2);
      const allActual = Object.values(s.marks).map((m) => m.actual);

      const avgTov = calculateAverage(allTov);
      const avgEtr = calculateAverage(allEtr);
      const avgAr1 = calculateAverage(allAr1);
      const avgAr2 = calculateAverage(allAr2);
      const avgActual = calculateAverage(allActual);
      const gpk = calculateGPK(allActual, scales);
      const gradeInfo = getGradeInfo(avgActual, scales);
      const pass = isPass(avgActual, scales) ? 'MENGUASAI' : 'BELUM MENGUASAI';

      csvContent += `${idx + 1},"${s.name}",${s.classGroup},${avgTov},${avgEtr},${avgAr1},${avgAr2},${avgActual},${gpk},${gradeInfo.grade},"${gradeInfo.status} (${pass})"\n`;
    });
  } else {
    const subjObj = SUBJECTS.find((s) => s.id === selectedSubject);
    csvContent += `MATRIKS HEADCOUNT MPT4 - MATA PELAJARAN: ${subjObj?.name.toUpperCase()}\n`;
    csvContent += 'No,Nama Murid,TOV,Gred TOV,ETR,Gred ETR,Ujian 1,Ujian 2,Ujian Sebenar,Gred Sebenar,Beza (Actual-ETR),Status ETR,Tahap Penguasaan MPT4,Catatan Intervensi\n';

    students.forEach((s, idx) => {
      const m = s.marks[selectedSubject];
      const gTov = getGradeInfo(m.tov, scales);
      const gEtr = getGradeInfo(m.etr, scales);
      const gActual = getGradeInfo(m.actual, scales);
      const diff = m.actual !== null ? m.actual - m.etr : 0;
      const statusEtr = getAchievementBadge(m.actual, m.etr).label;

      csvContent += `${idx + 1},"${s.name}",${m.tov},${gTov.grade},${m.etr},${gEtr.grade},${m.ar1 ?? '-'},${m.ar2 ?? '-'},${m.actual ?? '-'},${gActual.grade},${diff},"${statusEtr}","${gActual.status}","${m.notes || ''}"\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Headcount_Matriks_MPT4_${selectedSubject}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(
  schoolName: string,
  activeYear: { id: string; label: string; classGroup?: string },
  years: any[],
  studentsByYear: Record<string, Student[]>,
  gradeScales: GradeScale[]
) {
  const currentStudents = studentsByYear[activeYear.id] || [];
  const exportPayload = {
    app: 'Headcount MPT4 - SK Laksian Banggi',
    version: '2.0',
    schoolName: schoolName || 'Sekolah Kebangsaan Laksian Banggi',
    exportedAt: new Date().toISOString(),
    activeYearId: activeYear.id,
    activeYearLabel: activeYear.label,
    classGroup: activeYear.classGroup || '4 DINAMIK',
    totalStudentsActiveYear: currentStudents.length,
    students: currentStudents,
    studentsByYear,
    years,
    gradeScales,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanClass = (activeYear.classGroup || '4_DINAMIK').replace(/\s+/g, '_');
  const cleanYear = (activeYear.label || activeYear.id).replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `Headcount_${cleanClass}_${cleanYear}_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

