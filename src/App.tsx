import React, { useState, useEffect, useRef } from 'react';
import { Student, SubjectId, AcademicYear, GradeScale } from './types';
import { INITIAL_STUDENTS } from './data/initialData';
import {
  exportToCSV,
  exportToJSON,
  loadSavedGradeScales,
  saveGradeScales,
  setActiveGradeScalesInMemory,
} from './utils/headcountUtils';
import {
  syncDataToGoogleSheets,
  fetchBackupFromGoogleSheets,
  getSavedWebhookUrl,
  SyncPayload,
} from './utils/googleSheetsSync';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { SubjectComparisonBarChart } from './components/SubjectComparisonBarChart';
import { HeadcountTable } from './components/HeadcountTable';
import { MultiYearMatrix } from './components/MultiYearMatrix';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { StudentDetailModal } from './components/StudentDetailModal';
import { InterventionPlanner } from './components/InterventionPlanner';
import { ExportPrintModal } from './components/ExportPrintModal';
import { AddStudentModal } from './components/AddStudentModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ManageYearsModal } from './components/ManageYearsModal';
import { GradeSettingsModal } from './components/GradeSettingsModal';
import { ImportDataModal } from './components/ImportDataModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_YEARS_KEY = 'headcount_academic_years_v1';
const LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY = 'headcount_students_by_year_v1';
const LOCAL_STORAGE_ACTIVE_YEAR_KEY = 'headcount_active_year_id_v1';
const LEGACY_LOCAL_STORAGE_KEY = 'headcount_tahun4_2026_v3';

// Helper to sanitize classGroup from 4 BESTARI to 4 DINAMIK
const sanitizeClassGroup = (cg?: string): string => {
  if (!cg) return '4 DINAMIK';
  return cg.replace(/4\s*BESTARI/gi, '4 DINAMIK').replace(/5\s*BESTARI/gi, '5 DINAMIK');
};

// Default initial academic years (2026 as primary 4 DINAMIK, 2027 as next cohort 5 DINAMIK)
const DEFAULT_YEARS: AcademicYear[] = [
  {
    id: '2026',
    year: 2026,
    label: 'Sesi Akademik 2026 (Tahun 4)',
    classGroup: '4 DINAMIK',
    description: 'Kohort Asas 2026',
  },
  {
    id: '2027',
    year: 2027,
    label: 'Sesi Akademik 2027 (Tahun 5)',
    classGroup: '5 DINAMIK',
    description: 'Kohort Kenaikan Kelas 2027',
  },
];

// Helper to generate next year cohort (TOV Year N+1 = Actual Year N, ETR elevated)
const generateCarriedForwardCohort = (sourceStudents: Student[], newClassGroup: string): Student[] => {
  return sourceStudents.map((s) => {
    const newMarks: Record<SubjectId, any> = {} as any;
    (['BM', 'BI', 'MAT', 'SN'] as SubjectId[]).forEach((subj) => {
      const oldMark = s.marks[subj];
      const tov = oldMark.actual !== null ? oldMark.actual : oldMark.etr;
      const etr = Math.min(100, tov + 6);
      newMarks[subj] = {
        tov,
        etr,
        ar1: Math.min(100, Math.round(tov + (etr - tov) * 0.35)),
        ar2: Math.min(100, Math.round(tov + (etr - tov) * 0.7)),
        actual: Math.min(100, Math.round(tov + (etr - tov) * 0.9)),
        notes: '',
      };
    });

    return {
      ...s,
      classGroup: sanitizeClassGroup(newClassGroup),
      marks: newMarks,
    };
  });
};

export default function App() {
  // 1. Academic Years State
  const [years, setYears] = useState<AcademicYear[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_YEARS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((y: AcademicYear) => ({
            ...y,
            classGroup: sanitizeClassGroup(y.classGroup),
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load years from localStorage:', e);
    }
    return DEFAULT_YEARS;
  });

  // 2. Active Year ID
  const [activeYearId, setActiveYearId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_YEAR_KEY);
      if (saved) return saved;
    } catch (e) {
      console.error('Failed to load active year id:', e);
    }
    return '2026';
  });

  // 3. Students by Year mapping State
  const [studentsByYear, setStudentsByYear] = useState<Record<string, Student[]>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const sanitized: Record<string, Student[]> = {};
          Object.entries(parsed).forEach(([yr, list]) => {
            if (Array.isArray(list)) {
              sanitized[yr] = list.map((s) => ({
                ...s,
                classGroup: sanitizeClassGroup(s.classGroup),
              }));
            }
          });
          return sanitized;
        }
      }

      // Check legacy 2026 storage
      const legacy2026 = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
      let initial2026Students = INITIAL_STUDENTS;
      if (legacy2026) {
        const parsedLegacy = JSON.parse(legacy2026);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          initial2026Students = parsedLegacy.map((s: Student) => ({
            ...s,
            classGroup: sanitizeClassGroup(s.classGroup),
          }));
        }
      }

      // Pre-populate 2026 and 2027 cohort
      return {
        '2026': initial2026Students,
        '2027': generateCarriedForwardCohort(initial2026Students, '5 DINAMIK'),
      };
    } catch (e) {
      console.error('Failed to load students by year data:', e);
    }

    return {
      '2026': INITIAL_STUDENTS,
      '2027': generateCarriedForwardCohort(INITIAL_STUDENTS, '5 DINAMIK'),
    };
  });

  // Navigation & View States
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'table' | 'matrix' | 'analytics' | 'intervention' | 'print'>('table');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Year management modal states
  const [isManageYearsModalOpen, setIsManageYearsModalOpen] = useState(false);
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);

  // Safety Delete Confirmation States ("memastikan delete")
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteStudentModalOpen, setIsDeleteStudentModalOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);
  const [isDeleteYearModalOpen, setIsDeleteYearModalOpen] = useState(false);

  // Grade Scales State (MPT4 / KPM)
  const [gradeScales, setGradeScales] = useState<GradeScale[]>(() => {
    return loadSavedGradeScales();
  });
  const [isGradeSettingsModalOpen, setIsGradeSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Cloud Google Apps Script Sync States
  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>(() => {
    return localStorage.getItem('hc_last_sync_time') || '';
  });

  const handleSaveGradeScales = (newScales: GradeScale[]) => {
    setGradeScales(newScales);
    saveGradeScales(newScales);
    setActiveGradeScalesInMemory(newScales);
    showToast('Skala Gred MPT4 berjaya dikemaskini.');
  };

  // Feedback Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Active year object & current students
  const currentYear = years.find((y) => y.id === activeYearId) || years[0] || DEFAULT_YEARS[0];
  const currentStudents = studentsByYear[activeYearId] || [];

  // User interaction tracker: ensures background auto-fetch doesn't overwrite active user edits
  const hasUserInteractedRef = useRef(false);

  // Auto-fetch latest data from Google Sheets on initial load
  // Ensures any browser or device ("apabila dilayari pelayar tempat lain") automatically displays saved data
  useEffect(() => {
    let isCancelled = false;

    const autoFetchInitialData = async () => {
      setIsRefreshingCloud(true);
      try {
        const result = await fetchBackupFromGoogleSheets();
        if (isCancelled) return;

        // If user already started typing before response returned, skip to avoid overwriting
        if (hasUserInteractedRef.current) return;

        if (result.success && result.data) {
          const cloudStudentsByYear = result.data.studentsByYear;
          const cloudYears = result.data.years;
          const cloudScales = result.data.gradeScales;
          const cloudActiveYearId = result.data.activeYearId;

          let hasUpdated = false;

          if (cloudStudentsByYear && Object.keys(cloudStudentsByYear).length > 0) {
            const sanitized: Record<string, Student[]> = {};
            Object.entries(cloudStudentsByYear).forEach(([yr, list]) => {
              if (Array.isArray(list)) {
                sanitized[yr] = list.map((s) => ({
                  ...s,
                  classGroup: sanitizeClassGroup(s.classGroup),
                }));
              }
            });
            setStudentsByYear(sanitized);
            try {
              localStorage.setItem(LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY, JSON.stringify(sanitized));
            } catch (e) {}
            hasUpdated = true;
          }

          if (cloudYears && Array.isArray(cloudYears) && cloudYears.length > 0) {
            const sanitizedYears = cloudYears.map((y) => ({
              ...y,
              classGroup: sanitizeClassGroup(y.classGroup),
            }));
            setYears(sanitizedYears);
            try {
              localStorage.setItem(LOCAL_STORAGE_YEARS_KEY, JSON.stringify(sanitizedYears));
            } catch (e) {}
            hasUpdated = true;
          }

          if (cloudScales && Array.isArray(cloudScales) && cloudScales.length > 0) {
            setGradeScales(cloudScales);
            saveGradeScales(cloudScales);
            setActiveGradeScalesInMemory(cloudScales);
            hasUpdated = true;
          }

          if (cloudActiveYearId) {
            setActiveYearId(cloudActiveYearId);
            try {
              localStorage.setItem(LOCAL_STORAGE_ACTIVE_YEAR_KEY, cloudActiveYearId);
            } catch (e) {}
          }

          const syncTimestamp = new Date().toLocaleTimeString('ms-MY', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastCloudSyncTime(syncTimestamp);
          try {
            localStorage.setItem('hc_last_sync_time', syncTimestamp);
          } catch (e) {}

          if (hasUpdated) {
            showToast('Data headcount terkini dimuatkan dari Google Sheet (Cloud).');
          }
        }
      } catch (e) {
        console.warn('Gagal menyegerak automatik dari Google Sheets:', e);
      } finally {
        if (!isCancelled) {
          setIsRefreshingCloud(false);
        }
      }
    };

    autoFetchInitialData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Cloud Action: Manual Refresh Data from Google Sheets Web App
  const handleRefreshFromCloud = async () => {
    setIsRefreshingCloud(true);
    try {
      const result = await fetchBackupFromGoogleSheets();
      if (result.success && result.data) {
        if (result.data.studentsByYear && Object.keys(result.data.studentsByYear).length > 0) {
          const sanitized: Record<string, Student[]> = {};
          Object.entries(result.data.studentsByYear).forEach(([yr, list]) => {
            if (Array.isArray(list)) {
              sanitized[yr] = list.map((s) => ({
                ...s,
                classGroup: sanitizeClassGroup(s.classGroup),
              }));
            }
          });
          setStudentsByYear(sanitized);
          try {
            localStorage.setItem(LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY, JSON.stringify(sanitized));
          } catch (e) {}
        }
        if (result.data.years && Array.isArray(result.data.years) && result.data.years.length > 0) {
          const sanitizedYears = result.data.years.map((y) => ({
            ...y,
            classGroup: sanitizeClassGroup(y.classGroup),
          }));
          setYears(sanitizedYears);
          try {
            localStorage.setItem(LOCAL_STORAGE_YEARS_KEY, JSON.stringify(sanitizedYears));
          } catch (e) {}
        }
        if (result.data.gradeScales && Array.isArray(result.data.gradeScales)) {
          setGradeScales(result.data.gradeScales);
          saveGradeScales(result.data.gradeScales);
          setActiveGradeScalesInMemory(result.data.gradeScales);
        }
        const syncTimestamp = new Date().toLocaleTimeString('ms-MY', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastCloudSyncTime(syncTimestamp);
        try {
          localStorage.setItem('hc_last_sync_time', syncTimestamp);
        } catch (e) {}
        showToast('Data headcount berjaya disegar semula dari Google Sheet!');
      } else {
        showToast(result.message || 'Tiada rekod baharu dikesan di Google Sheet.');
      }
    } catch (e) {
      showToast('Gagal berhubung dengan Google Sheet. Sila semak sambungan internet.');
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  // Cloud Action: Trigger Save Current State to Google Sheets
  const handleTriggerCloudSync = async () => {
    setIsSyncingToCloud(true);
    try {
      const payload: SyncPayload = {
        schoolName: 'Sekolah Kebangsaan Laksian Banggi',
        activeYearId,
        activeYearLabel: currentYear.label,
        classGroup: currentYear.classGroup || '4 DINAMIK',
        students: currentStudents,
        studentsByYear,
        years,
        gradeScales,
        generatedAt: new Date().toISOString(),
      };
      const result = await syncDataToGoogleSheets(getSavedWebhookUrl(), payload);
      if (result.success) {
        if (result.timestamp) {
          setLastCloudSyncTime(result.timestamp);
          try {
            localStorage.setItem('hc_last_sync_time', result.timestamp);
          } catch (e) {}
        }
        showToast(`Markah berjaya disimpan kekal ke Google Sheet (${currentStudents.length} orang murid).`);
      } else {
        showToast(result.message);
      }
    } catch (e) {
      showToast('Gagal menyimpan markah ke Google Sheet.');
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  // Import Handlers - Guaranteed permanent sync to Google Sheets
  const handleImportFullBackup = async (data: {
    studentsByYear?: Record<string, Student[]>;
    years?: AcademicYear[];
    gradeScales?: GradeScale[];
  }) => {
    hasUserInteractedRef.current = true;
    let nextStudentsByYear = studentsByYear;
    let nextYears = years;
    let nextGradeScales = gradeScales;

    if (data.studentsByYear) {
      const sanitized: Record<string, Student[]> = {};
      Object.entries(data.studentsByYear).forEach(([yr, list]) => {
        if (Array.isArray(list)) {
          sanitized[yr] = list.map((s) => ({
            ...s,
            classGroup: sanitizeClassGroup(s.classGroup),
          }));
        }
      });
      nextStudentsByYear = sanitized;
      setStudentsByYear(sanitized);
      try {
        localStorage.setItem(LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY, JSON.stringify(sanitized));
      } catch (e) {}
    }

    if (data.years && Array.isArray(data.years) && data.years.length > 0) {
      nextYears = data.years.map((y) => ({
        ...y,
        classGroup: sanitizeClassGroup(y.classGroup),
      }));
      setYears(nextYears);
      try {
        localStorage.setItem(LOCAL_STORAGE_YEARS_KEY, JSON.stringify(nextYears));
      } catch (e) {}
    }

    if (data.gradeScales && Array.isArray(data.gradeScales) && data.gradeScales.length > 0) {
      nextGradeScales = data.gradeScales;
      setGradeScales(nextGradeScales);
      saveGradeScales(nextGradeScales);
      setActiveGradeScalesInMemory(nextGradeScales);
    }

    // Immediately push to Google Sheets so data remains persistent across browsers
    setIsSyncingToCloud(true);
    try {
      const payload: SyncPayload = {
        schoolName: 'Sekolah Kebangsaan Laksian Banggi',
        activeYearId,
        activeYearLabel: currentYear.label,
        classGroup: currentYear.classGroup || '4 DINAMIK',
        students: nextStudentsByYear[activeYearId] || [],
        studentsByYear: nextStudentsByYear,
        years: nextYears,
        gradeScales: nextGradeScales,
        generatedAt: new Date().toISOString(),
      };
      const result = await syncDataToGoogleSheets(getSavedWebhookUrl(), payload);
      if (result.success) {
        if (result.timestamp) {
          setLastCloudSyncTime(result.timestamp);
          try {
            localStorage.setItem('hc_last_sync_time', result.timestamp);
          } catch (e) {}
        }
        showToast('Data fail berjaya diimport & KEKAL disimpan ke Google Sheet (Cloud)!');
      } else {
        showToast('Data diimport ke peranti, tetapi gagal dihantar ke Google Sheet: ' + result.message);
      }
    } catch (err: any) {
      showToast('Data diimport ke peranti, tetapi gagal dihantar ke Google Sheet.');
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  const handleImportStudentList = async (newStudents: Student[]) => {
    hasUserInteractedRef.current = true;
    const updatedList = [...(studentsByYear[activeYearId] || []), ...newStudents];
    const nextStudentsByYear = {
      ...studentsByYear,
      [activeYearId]: updatedList,
    };
    setStudentsByYear(nextStudentsByYear);
    try {
      localStorage.setItem(LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY, JSON.stringify(nextStudentsByYear));
    } catch (e) {}

    // Immediately push to Google Sheets
    setIsSyncingToCloud(true);
    try {
      const payload: SyncPayload = {
        schoolName: 'Sekolah Kebangsaan Laksian Banggi',
        activeYearId,
        activeYearLabel: currentYear.label,
        classGroup: currentYear.classGroup || '4 DINAMIK',
        students: updatedList,
        studentsByYear: nextStudentsByYear,
        years,
        gradeScales,
        generatedAt: new Date().toISOString(),
      };
      const result = await syncDataToGoogleSheets(getSavedWebhookUrl(), payload);
      if (result.success) {
        if (result.timestamp) {
          setLastCloudSyncTime(result.timestamp);
          try {
            localStorage.setItem('hc_last_sync_time', result.timestamp);
          } catch (e) {}
        }
        showToast(`Berjaya menambah ${newStudents.length} murid & disimpan KEKAL ke Google Sheet (Cloud)!`);
      } else {
        showToast('Murid ditambah ke peranti, tetapi gagal disimpan ke Google Sheet.');
      }
    } catch (err) {
      showToast('Murid ditambah ke peranti, tetapi gagal disimpan ke Google Sheet.');
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  // Debounced auto-save to Google Sheets whenever marks are updated so markah tersimpan selamat
  useEffect(() => {
    // Only auto-save if user made edits in this session
    if (!hasUserInteractedRef.current) return;

    const timer = setTimeout(() => {
      const payload: SyncPayload = {
        schoolName: 'Sekolah Kebangsaan Laksian Banggi',
        activeYearId,
        activeYearLabel: currentYear.label,
        classGroup: currentYear.classGroup || '4 DINAMIK',
        students: currentStudents,
        studentsByYear,
        years,
        gradeScales,
        generatedAt: new Date().toISOString(),
      };
      setIsSyncingToCloud(true);
      syncDataToGoogleSheets(getSavedWebhookUrl(), payload)
        .then((res) => {
          if (res.success && res.timestamp) {
            setLastCloudSyncTime(res.timestamp);
            try {
              localStorage.setItem('hc_last_sync_time', res.timestamp);
            } catch (e) {}
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsSyncingToCloud(false);
        });
    }, 2500);

    return () => clearTimeout(timer);
  }, [studentsByYear, years, gradeScales, activeYearId]);

  // Count of students per year
  const studentCounts: Record<string, number> = {};
  years.forEach((y) => {
    studentCounts[y.id] = (studentsByYear[y.id] || []).length;
  });

  // Save to localStorage when years, activeYearId, or studentsByYear change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_YEARS_KEY, JSON.stringify(years));
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_YEAR_KEY, activeYearId);
      localStorage.setItem(LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY, JSON.stringify(studentsByYear));
    } catch (e) {
      console.error('Failed to save multi-year headcount data:', e);
    }
  }, [years, activeYearId, studentsByYear]);

  // Update specific mark for a student in active year with guaranteed immediate persistence
  const handleUpdateMarks = (
    studentId: string,
    subjectId: SubjectId,
    field: 'tov' | 'etr' | 'ar1' | 'ar2' | 'actual',
    value: number | null
  ) => {
    hasUserInteractedRef.current = true;
    const cleanVal =
      value !== null && !isNaN(value) ? Math.min(100, Math.max(0, value)) : null;

    setStudentsByYear((prev) => {
      const yearStudents = prev[activeYearId] || [];
      const updatedList = yearStudents.map((student) => {
        if (student.id !== studentId) return student;

        const updatedMarks = {
          ...student.marks,
          [subjectId]: {
            ...student.marks[subjectId],
            [field]: cleanVal,
          },
        };

        const updatedStudent = { ...student, marks: updatedMarks };

        if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
          setSelectedStudentForModal(updatedStudent);
        }

        return updatedStudent;
      });

      const nextState = {
        ...prev,
        [activeYearId]: updatedList,
      };

      // Synchronous immediate write to localStorage so marks stick 100% reliably
      try {
        localStorage.setItem(LOCAL_STORAGE_STUDENTS_BY_YEAR_KEY, JSON.stringify(nextState));
        if (activeYearId === '2026') {
          localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
        }
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }

      return nextState;
    });
  };

  // Update intervention notes for a student
  const handleUpdateNotes = (studentId: string, subjectId: SubjectId, notes: string) => {
    hasUserInteractedRef.current = true;
    setStudentsByYear((prev) => {
      const yearStudents = prev[activeYearId] || [];
      const updatedList = yearStudents.map((student) => {
        if (student.id !== studentId) return student;

        const updatedMarks = {
          ...student.marks,
          [subjectId]: {
            ...student.marks[subjectId],
            notes,
          },
        };

        const updatedStudent = { ...student, marks: updatedMarks };

        if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
          setSelectedStudentForModal(updatedStudent);
        }

        return updatedStudent;
      });

      return {
        ...prev,
        [activeYearId]: updatedList,
      };
    });
  };

  // Update student's name
  const handleUpdateStudentName = (studentId: string, newName: string) => {
    hasUserInteractedRef.current = true;
    setStudentsByYear((prev) => {
      const yearStudents = prev[activeYearId] || [];
      const updatedList = yearStudents.map((student) => {
        if (student.id !== studentId) return student;

        const updatedStudent = { ...student, name: newName };

        if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
          setSelectedStudentForModal(updatedStudent);
        }

        return updatedStudent;
      });

      return {
        ...prev,
        [activeYearId]: updatedList,
      };
    });
  };

  // Add New Student to active year
  const handleAddStudent = (newStudent: Student) => {
    hasUserInteractedRef.current = true;
    const studentWithClass = {
      ...newStudent,
      classGroup: currentYear.classGroup || newStudent.classGroup,
    };

    setStudentsByYear((prev) => ({
      ...prev,
      [activeYearId]: [...(prev[activeYearId] || []), studentWithClass],
    }));

    showToast(`Murid "${newStudent.name}" berjaya ditambah ke ${currentYear.label}.`);
  };

  // Request Delete Student (Open Confirmation Modal to "memastikan delete")
  const handleRequestDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteStudentModalOpen(true);
  };

  // Confirm Delete Student
  const handleConfirmDeleteStudent = () => {
    if (!studentToDelete) return;

    setStudentsByYear((prev) => ({
      ...prev,
      [activeYearId]: (prev[activeYearId] || []).filter((s) => s.id !== studentToDelete.id),
    }));

    if (selectedStudentForModal && selectedStudentForModal.id === studentToDelete.id) {
      setSelectedStudentForModal(null);
    }

    showToast(`Murid "${studentToDelete.name}" telah berjaya dipadam dari sistem.`);
    setStudentToDelete(null);
  };

  // Add New Academic Year
  const handleAddYear = (
    newYear: AcademicYear,
    importOption: 'carry_forward' | 'duplicate' | 'empty',
    sourceYearId: string
  ) => {
    // Add to years list
    setYears((prev) => {
      const exists = prev.some((y) => y.id === newYear.id);
      if (exists) return prev;
      return [...prev, newYear];
    });

    // Generate students for new year
    const sourceList = studentsByYear[sourceYearId] || [];
    let initialForNewYear: Student[] = [];

    if (importOption === 'carry_forward') {
      initialForNewYear = generateCarriedForwardCohort(sourceList, newYear.classGroup);
    } else if (importOption === 'duplicate') {
      initialForNewYear = sourceList.map((s) => ({
        ...s,
        id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        classGroup: newYear.classGroup,
      }));
    } else {
      initialForNewYear = [];
    }

    setStudentsByYear((prev) => ({
      ...prev,
      [newYear.id]: initialForNewYear,
    }));

    // Switch active year to newly created year
    setActiveYearId(newYear.id);
    showToast(`Tahun "${newYear.label}" berjaya dicipta dan diaktifkan.`);
  };

  // Update existing year details
  const handleUpdateYear = (yearId: string, updated: Partial<AcademicYear>) => {
    setYears((prev) =>
      prev.map((y) => (y.id === yearId ? { ...y, ...updated } : y))
    );

    // If classGroup updated, update student's classGroup in that year
    if (updated.classGroup) {
      setStudentsByYear((prev) => {
        const yearStudents = prev[yearId] || [];
        return {
          ...prev,
          [yearId]: yearStudents.map((s) => ({
            ...s,
            classGroup: updated.classGroup!,
          })),
        };
      });
    }

    showToast(`Maklumat tahun berjaya dikemaskini.`);
  };

  // Request Delete Year
  const handleRequestDeleteYear = (year: AcademicYear) => {
    if (years.length <= 1) {
      alert('Tidak boleh memadam tahun tunggal. Sekurang-kurangnya satu tahun mesti kekal.');
      return;
    }
    setYearToDelete(year);
    setIsDeleteYearModalOpen(true);
  };

  // Confirm Delete Year
  const handleConfirmDeleteYear = () => {
    if (!yearToDelete) return;

    const remainingYears = years.filter((y) => y.id !== yearToDelete.id);
    setYears(remainingYears);

    // Delete data for that year
    setStudentsByYear((prev) => {
      const copy = { ...prev };
      delete copy[yearToDelete.id];
      return copy;
    });

    // If active year was deleted, fallback to first available
    if (activeYearId === yearToDelete.id && remainingYears.length > 0) {
      setActiveYearId(remainingYears[0].id);
    }

    showToast(`Sesi akademik "${yearToDelete.label}" telah dipadam.`);
    setYearToDelete(null);
  };

  // Reset to default initial state
  const handleResetData = () => {
    if (
      window.confirm(
        'Adakah anda pasti untuk set semula data sesi tahun ini ke senarai asal? Semua perubahan markah terkini akan diset semula.'
      )
    ) {
      setStudentsByYear((prev) => ({
        ...prev,
        [activeYearId]: INITIAL_STUDENTS,
      }));
      showToast(`Data bagi ${currentYear.label} telah diset semula.`);
    }
  };

  // Export JSON backup for active year and multi-year data
  const handleExportJSON = () => {
    exportToJSON(
      'Sekolah Kebangsaan Laksian Banggi',
      currentYear,
      years,
      studentsByYear,
      gradeScales
    );
    showToast(`Fail sandaran JSON (${currentYear.classGroup || '4 DINAMIK'}) berjaya dimuat turun.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        selectedSubject={selectedSubject}
        onSelectSubject={setSelectedSubject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExport={handleExportJSON}
        onReset={handleResetData}
        onAddStudent={() => setIsAddStudentModalOpen(true)}
        studentCount={currentStudents.length}
        years={years}
        activeYearId={activeYearId}
        onSelectYear={(yearId) => setActiveYearId(yearId)}
        onOpenManageYears={() => setIsManageYearsModalOpen(true)}
        onOpenAddYear={() => {
          setIsManageYearsModalOpen(true);
        }}
        onOpenGradeSettings={() => setIsGradeSettingsModalOpen(true)}
        onRefreshCloud={handleRefreshFromCloud}
        isRefreshingCloud={isRefreshingCloud}
        onOpenImport={() => setIsImportModalOpen(true)}
        onTriggerCloudSync={handleTriggerCloudSync}
        isSyncingToCloud={isSyncingToCloud}
        lastCloudSyncTime={lastCloudSyncTime}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Print / Report View */}
        {activeTab === 'print' && (
          <ExportPrintModal
            students={currentStudents}
            years={years}
            studentsByYear={studentsByYear}
            activeYearId={activeYearId}
            gradeScales={gradeScales}
            onOpenGradeSettings={() => setIsGradeSettingsModalOpen(true)}
            onBack={() => setActiveTab('table')}
            onExportCSV={() => exportToCSV(currentStudents, selectedSubject)}
          />
        )}

        {/* View: Multi-Year Matrix Tab (2026 hingga Seterusnya) */}
        {activeTab === 'matrix' && (
          <MultiYearMatrix
            years={years}
            studentsByYear={studentsByYear}
            activeYearId={activeYearId}
            onSelectYear={(yearId) => {
              setActiveYearId(yearId);
              setActiveTab('table');
            }}
            onOpenAddYearModal={() => setIsManageYearsModalOpen(true)}
            onOpenManageYearsModal={() => setIsManageYearsModalOpen(true)}
            onOpenStudentModal={(student) => setSelectedStudentForModal(student)}
          />
        )}

        {/* Normal Interactive Views for Active Year */}
        {activeTab !== 'print' && activeTab !== 'matrix' && (
          <>
            {/* KPI Summary Overview Cards */}
            <StatsOverview students={currentStudents} selectedSubject={selectedSubject} />

            {/* View 1: Main Headcount Table with Multi-Subject Bar Chart */}
            {activeTab === 'table' && (
              <>
                {/* Visual Comparative Bar Chart for 4 Subjects (BM, BI, MAT, SN) */}
                <SubjectComparisonBarChart
                  students={currentStudents}
                  gradeScales={gradeScales}
                />

                <HeadcountTable
                  students={currentStudents}
                  selectedSubject={selectedSubject}
                  activeYearLabel={currentYear.label}
                  gradeScales={gradeScales}
                  onUpdateMarks={handleUpdateMarks}
                  onUpdateNotes={handleUpdateNotes}
                  onUpdateStudentName={handleUpdateStudentName}
                  onDeleteStudentRequest={handleRequestDeleteStudent}
                  onOpenStudentModal={(student) => setSelectedStudentForModal(student)}
                />
              </>
            )}

            {/* View 2: Analytics & Progression Charts */}
            {activeTab === 'analytics' && <AnalyticsCharts students={currentStudents} />}

            {/* View 3: Intervention Planner */}
            {activeTab === 'intervention' && (
              <InterventionPlanner
                students={currentStudents}
                onUpdateNotes={handleUpdateNotes}
                onOpenStudentModal={(student) => setSelectedStudentForModal(student)}
              />
            )}
          </>
        )}
      </main>

      {/* MODAL 1: Student Detail & Intervention Modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        onUpdateMarks={handleUpdateMarks}
        onUpdateNotes={handleUpdateNotes}
        onUpdateStudentName={handleUpdateStudentName}
        onDeleteStudentRequest={handleRequestDeleteStudent}
      />

      {/* MODAL 2: Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleAddStudent}
      />

      {/* MODAL 3: Manage & Edit Years Modal */}
      <ManageYearsModal
        isOpen={isManageYearsModalOpen}
        onClose={() => setIsManageYearsModalOpen(false)}
        years={years}
        activeYearId={activeYearId}
        onSelectYear={(yearId) => {
          setActiveYearId(yearId);
          setIsManageYearsModalOpen(false);
        }}
        onAddYear={handleAddYear}
        onUpdateYear={handleUpdateYear}
        onDeleteYearRequest={handleRequestDeleteYear}
        studentCounts={studentCounts}
      />

      {/* MODAL 4: Safety Delete Student Confirmation Modal ("memastikan delete") */}
      <ConfirmDeleteModal
        isOpen={isDeleteStudentModalOpen}
        onClose={() => {
          setIsDeleteStudentModalOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleConfirmDeleteStudent}
        title="Pengesahan Padam Murid"
        itemName={studentToDelete?.name || ''}
        itemType="student"
        customWarning={`Semua rekod markah headcount (TOV, ETR, Ujian 1, Ujian 2, Sebenar) bagi murid ini dalam ${currentYear?.label} akan dipadam secara kekal.`}
      />

      {/* MODAL 5: Safety Delete Year Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteYearModalOpen}
        onClose={() => {
          setIsDeleteYearModalOpen(false);
          setYearToDelete(null);
        }}
        onConfirm={handleConfirmDeleteYear}
        title="Pengesahan Padam Tahun Akademik"
        itemName={yearToDelete?.label || ''}
        itemType="year"
        customWarning={`Semua rekod ${
          (yearToDelete && studentCounts[yearToDelete.id]) || 0
        } orang murid dalam sesi tahun ini akan dipadam secara kekal.`}
      />

      {/* MODAL 6: MPT4 Grade Scales Settings Modal */}
      <GradeSettingsModal
        isOpen={isGradeSettingsModalOpen}
        onClose={() => setIsGradeSettingsModalOpen(false)}
        currentScales={gradeScales}
        onSaveScales={handleSaveGradeScales}
      />

      {/* MODAL 7: Import Data & Full Backup Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeYearId={activeYearId}
        activeYearLabel={currentYear.label}
        classGroup={currentYear.classGroup || '4 DINAMIK'}
        onImportFullBackup={handleImportFullBackup}
        onImportStudentList={handleImportStudentList}
        onShowToast={showToast}
      />

    </div>
  );
}
