import React, { useState } from 'react';
import { Student, SubjectId, GradeLetter, SubjectMarks, GradeScale } from '../types';
import { getGradeInfo, getAchievementBadge, calculateAverage, calculateGPK, SUBJECTS, getActiveGradeScales } from '../utils/headcountUtils';
import { Search, Edit3, Eye, FileSpreadsheet, ArrowUpDown, ChevronRight, Save, UserCheck, AlertCircle, Trash2 } from 'lucide-react';

interface HeadcountTableProps {
  students: Student[];
  selectedSubject: SubjectId | 'ALL';
  activeYearLabel?: string;
  gradeScales?: GradeScale[];
  onUpdateMarks: (studentId: string, subjectId: SubjectId, field: 'tov' | 'etr' | 'ar1' | 'ar2' | 'actual', value: number | null) => void;
  onUpdateNotes: (studentId: string, subjectId: SubjectId, notes: string) => void;
  onUpdateStudentName?: (studentId: string, newName: string) => void;
  onDeleteStudentRequest?: (student: Student) => void;
  onOpenStudentModal: (student: Student) => void;
}

export const HeadcountTable: React.FC<HeadcountTableProps> = ({
  students,
  selectedSubject,
  activeYearLabel,
  gradeScales,
  onUpdateMarks,
  onUpdateNotes,
  onUpdateStudentName,
  onDeleteStudentRequest,
  onOpenStudentModal,
}) => {
  const activeScales = gradeScales && gradeScales.length > 0 ? gradeScales : getActiveGradeScales();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'achieved' | 'pending' | 'at_risk'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'actual' | 'etr' | 'tov'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;

    if (selectedSubject === 'ALL') {
      const allMarks = Object.values(student.marks) as SubjectMarks[];
      const avgActual = calculateAverage(allMarks.map((m) => m.actual));
      const avgEtr = calculateAverage(allMarks.map((m) => m.etr));
      if (statusFilter === 'achieved') return avgActual >= avgEtr;
      if (statusFilter === 'pending') return avgActual < avgEtr;
      if (statusFilter === 'at_risk') return avgActual < 40;
    } else {
      const m = student.marks[selectedSubject];
      const diff = (m.actual ?? 0) - m.etr;
      if (statusFilter === 'achieved') return diff >= 0;
      if (statusFilter === 'pending') return diff < 0;
      if (statusFilter === 'at_risk') return m.actual !== null && m.actual < 40;
    }

    return true;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let valA: any = a.name;
    let valB: any = b.name;

    if (sortBy === 'actual') {
      if (selectedSubject === 'ALL') {
        valA = calculateAverage((Object.values(a.marks) as SubjectMarks[]).map((m) => m.actual));
        valB = calculateAverage((Object.values(b.marks) as SubjectMarks[]).map((m) => m.actual));
      } else {
        valA = a.marks[selectedSubject].actual ?? 0;
        valB = b.marks[selectedSubject].actual ?? 0;
      }
    } else if (sortBy === 'etr') {
      if (selectedSubject === 'ALL') {
        valA = calculateAverage((Object.values(a.marks) as SubjectMarks[]).map((m) => m.etr));
        valB = calculateAverage((Object.values(b.marks) as SubjectMarks[]).map((m) => m.etr));
      } else {
        valA = a.marks[selectedSubject].etr;
        valB = b.marks[selectedSubject].etr;
      }
    } else if (sortBy === 'tov') {
      if (selectedSubject === 'ALL') {
        valA = calculateAverage((Object.values(a.marks) as SubjectMarks[]).map((m) => m.tov));
        valB = calculateAverage((Object.values(b.marks) as SubjectMarks[]).map((m) => m.tov));
      } else {
        valA = a.marks[selectedSubject].tov;
        valB = b.marks[selectedSubject].tov;
      }
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const toggleSort = (field: 'name' | 'actual' | 'etr' | 'tov') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleNotesSave = (studentId: string) => {
    if (selectedSubject !== 'ALL') {
      onUpdateNotes(studentId, selectedSubject, tempNotes);
    }
    setEditingNotesId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* Table Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative min-w-[240px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama murid..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('achieved')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'achieved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              Mencapai ETR
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              Belum Mencapai ETR
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'at_risk'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              Perlu Bimbingan (E/F)
            </button>
          </div>
        </div>

        {/* Legend / Info */}
        <div className="flex items-center text-xs text-slate-500 gap-3">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Markah Boleh Disunting Terus Dalam Jadual</span>
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-3 text-center w-12">No.</th>
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>Nama Murid</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              
              {/* Score Columns */}
              <th
                onClick={() => toggleSort('tov')}
                className="py-3 px-2 text-center cursor-pointer hover:bg-slate-200/60 transition w-20"
              >
                <span className="text-slate-800">TOV</span>
                <div className="text-[9px] font-normal text-slate-500 normal-case">Markah Awal</div>
              </th>

              <th
                onClick={() => toggleSort('etr')}
                className="py-3 px-2 text-center cursor-pointer hover:bg-slate-200/60 transition w-20 bg-blue-50/50 text-blue-900 border-x border-blue-100"
              >
                <span className="text-blue-900 font-extrabold">ETR</span>
                <div className="text-[9px] font-normal text-blue-600 normal-case">Sasaran</div>
              </th>

              <th className="py-3 px-2 text-center w-20">
                <span>UJIAN 1</span>
                <div className="text-[9px] font-normal text-slate-500 normal-case">Pentaksiran 1</div>
              </th>

              <th className="py-3 px-2 text-center w-20">
                <span>UJIAN 2</span>
                <div className="text-[9px] font-normal text-slate-500 normal-case">Pentaksiran 2</div>
              </th>

              <th
                onClick={() => toggleSort('actual')}
                className="py-3 px-2 text-center cursor-pointer hover:bg-slate-200/60 transition w-24 bg-emerald-50/70 text-emerald-900 border-x border-emerald-100"
              >
                <span className="text-emerald-950 font-black">UJIAN SEBENAR</span>
                <div className="text-[9px] font-normal text-emerald-700 normal-case">Markah 2026</div>
              </th>

              <th className="py-3 px-2 text-center w-16">
                <span>Gred</span>
              </th>

              <th className="py-3 px-3 text-center w-24">
                <span>Beza</span>
                <div className="text-[9px] font-normal text-slate-500 normal-case">Actual - ETR</div>
              </th>

              <th className="py-3 px-3 text-center min-w-[140px]">
                <span>Status Headcount</span>
              </th>

              {selectedSubject !== 'ALL' && (
                <th className="py-3 px-3 text-left min-w-[180px]">
                  <span>Catatan Intervensi</span>
                </th>
              )}

              <th className="py-3 px-3 text-center w-16">
                <span>Profil</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {sortedStudents.map((student, index) => {
              // Calculate values based on selected subject or ALL
              let tov = 0;
              let etr = 0;
              let ar1: number | null = null;
              let ar2: number | null = null;
              let actual: number | null = null;
              let notes = '';

              if (selectedSubject === 'ALL') {
                const markList = Object.values(student.marks) as SubjectMarks[];
                const allTov = markList.map((m) => m.tov);
                const allEtr = markList.map((m) => m.etr);
                const allAr1 = markList.map((m) => m.ar1);
                const allAr2 = markList.map((m) => m.ar2);
                const allActual = markList.map((m) => m.actual);

                tov = calculateAverage(allTov);
                etr = calculateAverage(allEtr);
                ar1 = calculateAverage(allAr1);
                ar2 = calculateAverage(allAr2);
                actual = calculateAverage(allActual);
              } else {
                const m = student.marks[selectedSubject];
                tov = m.tov;
                etr = m.etr;
                ar1 = m.ar1;
                ar2 = m.ar2;
                actual = m.actual;
                notes = m.notes || '';
              }

              const gradeInfo = getGradeInfo(actual, activeScales);
              const diff = actual !== null ? parseFloat((actual - etr).toFixed(1)) : 0;
              const badge = getAchievementBadge(actual, etr);

              return (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* No. */}
                  <td className="py-3 px-3 text-center font-medium text-slate-400 text-xs">
                    {index + 1}
                  </td>

                  {/* Student Name */}
                  <td className="py-3 px-4">
                    {editingNameId === student.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (tempName.trim() && onUpdateStudentName) {
                                onUpdateStudentName(student.id, tempName.trim().toUpperCase());
                              }
                              setEditingNameId(null);
                            } else if (e.key === 'Escape') {
                              setEditingNameId(null);
                            }
                          }}
                          className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (tempName.trim() && onUpdateStudentName) {
                              onUpdateStudentName(student.id, tempName.trim().toUpperCase());
                            }
                            setEditingNameId(null);
                          }}
                          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"
                          title="Simpan Nama"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group/name gap-2">
                        <button
                          onClick={() => onOpenStudentModal(student)}
                          className="font-semibold text-slate-800 hover:text-blue-600 text-left transition flex flex-col"
                        >
                          <span className="font-bold">{student.name}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-normal">
                              {student.gender === 'L' ? 'Lelaki' : 'Perempuan'} • {student.classGroup}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] inline-flex items-center gap-1">
                              <span className={`px-1.5 py-0.2 rounded font-black text-[10px] border ${gradeInfo.color}`}>
                                {gradeInfo.grade}
                              </span>
                              <span className="text-slate-500 font-medium">({gradeInfo.status})</span>
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNameId(student.id);
                            setTempName(student.name);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover/name:opacity-100 transition shrink-0"
                          title="Sunting Nama Murid"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* TOV */}
                  <td className="py-2 px-1 text-center font-medium text-slate-700">
                    {selectedSubject === 'ALL' ? (
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
                        {tov}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={tov}
                        onChange={(e) =>
                          onUpdateMarks(
                            student.id,
                            selectedSubject,
                            'tov',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-14 text-center py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    )}
                  </td>

                  {/* ETR */}
                  <td className="py-2 px-1 text-center font-bold text-blue-900 bg-blue-50/30 border-x border-blue-100/60">
                    {selectedSubject === 'ALL' ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                        {etr}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={etr}
                        onChange={(e) =>
                          onUpdateMarks(
                            student.id,
                            selectedSubject,
                            'etr',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-14 text-center py-1 bg-blue-50/80 border border-blue-200 rounded font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    )}
                  </td>

                  {/* AR 1 */}
                  <td className="py-2 px-1 text-center text-slate-600">
                    {selectedSubject === 'ALL' ? (
                      <span>{ar1 !== null ? ar1 : '-'}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ar1 ?? ''}
                        placeholder="-"
                        onChange={(e) =>
                          onUpdateMarks(
                            student.id,
                            selectedSubject,
                            'ar1',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-14 text-center py-1 bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    )}
                  </td>

                  {/* AR 2 */}
                  <td className="py-2 px-1 text-center text-slate-600">
                    {selectedSubject === 'ALL' ? (
                      <span>{ar2 !== null ? ar2 : '-'}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ar2 ?? ''}
                        placeholder="-"
                        onChange={(e) =>
                          onUpdateMarks(
                            student.id,
                            selectedSubject,
                            'ar2',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-14 text-center py-1 bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    )}
                  </td>

                  {/* Actual Score 2026 */}
                  <td className="py-2 px-1 text-center font-extrabold text-emerald-950 bg-emerald-50/40 border-x border-emerald-100/80">
                    {selectedSubject === 'ALL' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded font-black text-xs">
                        {actual ?? '-'}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={actual ?? ''}
                        placeholder="-"
                        onChange={(e) =>
                          onUpdateMarks(
                            student.id,
                            selectedSubject,
                            'actual',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-16 text-center py-1 bg-emerald-100/70 border border-emerald-300 rounded font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm shadow-sm"
                      />
                    )}
                  </td>

                  {/* Grade Badge */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-extrabold text-xs border ${gradeInfo.color}`}
                    >
                      {gradeInfo.grade}
                    </span>
                  </td>

                  {/* Beza vs ETR */}
                  <td className="py-3 px-3 text-center font-semibold text-xs">
                    <span
                      className={
                        diff >= 0
                          ? 'text-emerald-600 font-bold'
                          : 'text-rose-600 font-bold'
                      }
                    >
                      {diff >= 0 ? `+${diff}` : diff}
                    </span>
                  </td>

                  {/* Achievement Badge */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </td>

                  {/* Notes / Intervention */}
                  {selectedSubject !== 'ALL' && (
                    <td className="py-2 px-3 text-left">
                      {editingNotesId === student.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white border border-blue-400 rounded focus:outline-none"
                            placeholder="Catatan..."
                          />
                          <button
                            onClick={() => handleNotesSave(student.id)}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNotesId(student.id);
                            setTempNotes(notes);
                          }}
                          className="cursor-pointer group/notes flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1 rounded transition min-h-[28px]"
                        >
                          <span className="truncate max-w-[160px]" title={notes || 'Klik untuk tambah catatan...'}>
                            {notes || <em className="text-slate-400">Tambah catatan...</em>}
                          </span>
                          <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover/notes:opacity-100 transition" />
                        </div>
                      )}
                    </td>
                  )}

                  {/* Profile & Delete Action */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenStudentModal(student)}
                        title="Lihat Profil & Pelaporan HC3"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition inline-flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onDeleteStudentRequest && (
                        <button
                          onClick={() => onDeleteStudentRequest(student)}
                          title={`Padam rekod ${student.name}`}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {sortedStudents.length === 0 && (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-sm">Tiada murid dijumpai padan dengan carian / penapis.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>
          Menunjukkan <strong>{sortedStudents.length}</strong> daripada <strong>{students.length}</strong> orang murid {activeYearLabel ? `(${activeYearLabel})` : ''} • Sekolah Kebangsaan Laksian Banggi
        </div>
        <div className="text-slate-400 text-[11px] font-medium">
          Sistem Pemantauan Markah MPT4
        </div>
      </div>
    </div>
  );
};
