import React, { useState } from 'react';
import { Student } from '../types';
import { getCodeGsContent, getIndexHtmlContent } from '../utils/gasTemplates';
import {
  Code,
  FileCode,
  Copy,
  Check,
  Download,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  Table
} from 'lucide-react';

interface GasGeneratorModalProps {
  students: Student[];
  onBack: () => void;
}

export const GasGeneratorModal: React.FC<GasGeneratorModalProps> = ({
  students,
  onBack,
}) => {
  const [activeFileTab, setActiveFileTab] = useState<'code_gs' | 'index_html' | 'guide'>('code_gs');
  const [useCurrentMarks, setUseCurrentMarks] = useState(true);
  const [copiedFile, setCopiedFile] = useState<'code_gs' | 'index_html' | null>(null);

  // Generate code based on toggle
  const studentsToExport = useCurrentMarks ? students : undefined;
  const codeGsString = getCodeGsContent(studentsToExport);
  const indexHtmlString = getIndexHtmlContent(studentsToExport);

  // Copy to clipboard
  const handleCopy = (type: 'code_gs' | 'index_html') => {
    const textToCopy = type === 'code_gs' ? codeGsString : indexHtmlString;
    navigator.clipboard.writeText(textToCopy);
    setCopiedFile(type);
    setTimeout(() => {
      setCopiedFile(null);
    }, 2500);
  };

  // Download single file
  const handleDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download both files
  const handleDownloadAll = () => {
    handleDownload('Code.gs', codeGsString, 'text/javascript;charset=utf-8');
    setTimeout(() => {
      handleDownload('index.html', indexHtmlString, 'text/html;charset=utf-8');
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Penjana Google Apps Script (GAS)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                KPM / DELIMa Ready
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Penjanaan Fail <code className="text-amber-400 font-mono text-xl sm:text-2xl">Code.gs</code> &amp; <code className="text-cyan-400 font-mono text-xl sm:text-2xl">index.html</code>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Jana skrip lengkap untuk menjalankan aplikasi Headcount Tahun 4 ini sebagai Web App di Google Sheets atau Google Drive menggunakan akaun DELIMa KPM rasmi anda. Semua data murid dan markah tersimpan selamat di Google Sheet anda.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun Kedua-dua Fail</span>
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
            >
              Kembali ke Jadual
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <Table className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Autosync Google Sheet</span>
              Penukaran markah atau catatan murid terus disimpan ke tab <span className="text-emerald-300 font-mono">DATA_MURID</span>.
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">19 Murid Terkandung</span>
              Data 19 orang murid Tahun 4 dibina siap sedia dalam kod lalai bagi permulaan segera.
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Responsif & Bebas Iklan</span>
              Boleh dibuka oleh guru melalui telefon pintar, tablet, atau komputer bila-bila masa.
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveFileTab('code_gs')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeFileTab === 'code_gs'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Code.gs</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">Backend GAS</span>
            </button>

            <button
              onClick={() => setActiveFileTab('index_html')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeFileTab === 'index_html'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>index.html</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">Frontend UI</span>
            </button>

            <button
              onClick={() => setActiveFileTab('guide')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeFileTab === 'guide'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Panduan Pemasangan</span>
            </button>
          </div>

          {/* Settings & Copy controls */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 select-none">
              <input
                type="checkbox"
                checked={useCurrentMarks}
                onChange={(e) => setUseCurrentMarks(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Sertakan Markah Terkini ({students.length} Murid)</span>
            </label>

            {activeFileTab === 'code_gs' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('code_gs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    copiedFile === 'code_gs'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {copiedFile === 'code_gs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile === 'code_gs' ? 'Tersalin!' : 'Salin Code.gs'}</span>
                </button>

                <button
                  onClick={() => handleDownload('Code.gs', codeGsString, 'text/javascript;charset=utf-8')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition"
                  title="Muat Turun Fail Code.gs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Muat Turun .gs</span>
                </button>
              </div>
            )}

            {activeFileTab === 'index_html' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('index_html')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    copiedFile === 'index_html'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {copiedFile === 'index_html' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile === 'index_html' ? 'Tersalin!' : 'Salin index.html'}</span>
                </button>

                <button
                  onClick={() => handleDownload('index.html', indexHtmlString, 'text/html;charset=utf-8')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition"
                  title="Muat Turun Fail index.html"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Muat Turun .html</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area 1: Code.gs Viewer */}
        {activeFileTab === 'code_gs' && (
          <div>
            <div className="p-3 bg-slate-900 text-slate-400 text-xs flex justify-between items-center border-b border-slate-800">
              <span className="font-mono text-amber-400">google-apps-script/Code.gs</span>
              <span>Bahasa: JavaScript (Google Apps Script Engine)</span>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed selection:bg-amber-500/30">
              <code>{codeGsString}</code>
            </pre>
          </div>
        )}

        {/* Content Area 2: index.html Viewer */}
        {activeFileTab === 'index_html' && (
          <div>
            <div className="p-3 bg-slate-900 text-slate-400 text-xs flex justify-between items-center border-b border-slate-800">
              <span className="font-mono text-cyan-400">google-apps-script/index.html</span>
              <span>Bahasa: HTML5 + Tailwind CSS + Lucide Icons + Google Script Run Client</span>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed selection:bg-cyan-500/30">
              <code>{indexHtmlString}</code>
            </pre>
          </div>
        )}

        {/* Content Area 3: Malay Step-by-Step Setup Guide */}
        {activeFileTab === 'guide' && (
          <div className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Panduan Pemasangan Google Apps Script (DELIMa KPM / Google Workspace)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Ikuti 5 langkah mudah ini untuk melancarkan Web App Headcount anda sendiri yang bersambung dengan Google Sheet.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Step 1 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Buka Google Sheet Baharu di Akaun DELIMa KPM
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Log masuk ke akaun MOE-DL (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">@moe-dl.edu.my</code>) anda. Cipta fail Google Sheets baharu di Google Drive dan namakannya, contohnya: <span className="font-semibold text-slate-800">"Headcount Tahun 4 2026 - 4 Dinamik"</span>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Buka Editor Apps Script
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Di bar menu atas Google Sheet tersebut, klik menu <span className="font-semibold text-blue-600">Extensions (Sambungan)</span> &gt; <span className="font-semibold text-blue-600">Apps Script</span>. Tab baharu penyunting kod akan dibuka.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between">
                    <span>Tampal Kod ke dalam Fail <code className="text-amber-700 font-mono">Code.gs</code></span>
                    <button
                      onClick={() => handleCopy('code_gs')}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"
                    >
                      {copiedFile === 'code_gs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Kod</span>
                    </button>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Klik pada fail sedia ada bernama <strong>Code.gs</strong> di panel kiri. Padam kod di dalamnya, kemudian tampal kod <strong>Code.gs</strong> yang telah disalin. Tekan ikon <strong>Simpan (Save / Ctrl+S)</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-cyan-50/60 border border-cyan-200">
                <div className="w-9 h-9 rounded-full bg-cyan-600 text-white font-extrabold flex items-center justify-center shrink-0">
                  4
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between">
                    <span>Cipta Fail <code className="text-cyan-700 font-mono">index.html</code></span>
                    <button
                      onClick={() => handleCopy('index_html')}
                      className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"
                    >
                      {copiedFile === 'index_html' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Kod</span>
                    </button>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Di panel kiri Apps Script, klik butang <strong>+ (Tambah Fail)</strong> &gt; pilih <strong>HTML</strong> &gt; namakan fail sebagai <strong>index</strong>. Tampal semua kod <strong>index.html</strong> ke dalamnya dan simpan.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0">
                  5
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Laksanakan Web App (Deploy as Web App)
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Di penjuru kanan atas Apps Script, klik butang biru <strong>Deploy (Laksana)</strong> &gt; <strong>New deployment (Pelaksanaan baharu)</strong>.
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-700 space-y-1 list-disc list-inside bg-white p-3 rounded-xl border border-emerald-200 font-medium">
                    <li>Pilih jenis (Select type): <strong>Web app</strong></li>
                    <li>Execute as: <strong>Me (emel akaun KPM anda)</strong></li>
                    <li>Who has access: <strong>Anyone with Google account</strong> atau <strong>Anyone within MOE</strong></li>
                  </ul>
                  <p className="text-xs text-slate-500">
                    Klik <strong>Deploy</strong>, benarkan kebenaran Google Drive/Sheet jika diminta, dan salin URL Web App untuk mula digunakan!
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-950">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Status Pangkalan Data Automatik:</span>
                Sebaik sahaja Web App dibuka kali pertama, Google Apps Script akan secara automatik membina helaian bernama <strong>DATA_MURID</strong> dalam Google Sheet tersebut, lengkap dengan lajur format, 19 murid asal dan semua markah TOV, ETR, Ujian 1, Ujian 2 serta Ujian Sebenar.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
