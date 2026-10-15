export type SubjectId = 'BM' | 'BI' | 'MAT' | 'SN';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  code: string;
  color: string;
}

export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface GradeScale {
  grade: GradeLetter;
  minMark: number;
  maxMark: number;
  gp: number; // Gred Purata point (1 for A, 2 for B, ... 6 for F)
  status: string; // e.g. 'Penguasaan cemerlang', 'Penguasaan kepujian', etc.
  color: string;
}

export interface SubjectMarks {
  tov: number;          // Take Off Value (Markah Awal)
  etr: number;          // Estimated Target Result (Sasaran)
  ar1: number | null;   // Academic Result 1 (Ujian 1)
  ar2: number | null;   // Academic Result 2 (Ujian Pertengahan)
  actual: number | null;// Markah Ujian Sebenar 2026 (UASA / Akhir Tahun)
  notes?: string;       // Catatan / Program Intervensi
}

export interface Student {
  id: string;
  noId: string; // e.g. MYKID / No. Sijil Lahir
  name: string;
  gender: 'L' | 'P';
  classGroup: string; // e.g. "4 Cemerlang"
  marks: Record<SubjectId, SubjectMarks>;
}

export interface ClassHeadcountSummary {
  totalStudents: number;
  avgTov: number;
  avgEtr: number;
  avgAr1: number;
  avgAr2: number;
  avgActual: number;
  gpkTov: number;
  gpkEtr: number;
  gpkActual: number;
  passCountActual: number;
  passPercentageActual: number;
  gradeDistActual: Record<GradeLetter, number>;
}

export interface AcademicYear {
  id: string; // e.g. '2026'
  year: number; // e.g. 2026
  label: string; // e.g. 'Sesi Akademik 2026 (Tahun 4)'
  classGroup: string; // e.g. '4 DINAMIK'
  description?: string;
}
