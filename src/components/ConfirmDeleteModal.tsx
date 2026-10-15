import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemType?: 'student' | 'year';
  customWarning?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Pengesahan Padam',
  itemName,
  itemType = 'student',
  customWarning,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-200">
        
        {/* Header with Danger Warning */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">{title}</h3>
              <p className="text-xs text-rose-700">Tindakan ini tidak boleh diundur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700">
            Adakah anda pasti ingin memadam {itemType === 'student' ? 'murid' : 'sesi tahun'}:
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              {itemType === 'student' ? 'Nama Murid' : 'Tahun / Sesi'}
            </p>
            <p className="text-sm font-extrabold text-slate-900 break-words">
              {itemName}
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Amaran Keselamatan Data:</span>
            </p>
            <p className="text-amber-700 leading-relaxed">
              {customWarning || (itemType === 'student'
                ? 'Semua rekod headcount murid ini (TOV, ETR, Ujian 1, Ujian 2, Ujian Sebenar, dan Catatan Intervensi) bagi sesi tahun ini akan dipadam secara kekal.'
                : 'Semua rekod murid dan data headcount yang berkaitan dengan sesi tahun ini akan dipadam.')}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-2 shadow-md shadow-rose-600/20"
          >
            <Trash2 className="w-4 h-4" />
            <span>Ya, Sahkan Padam</span>
          </button>
        </div>

      </div>
    </div>
  );
};
