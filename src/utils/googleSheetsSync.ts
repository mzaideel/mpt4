import { Student, AcademicYear, GradeScale } from '../types';

export const OFFICIAL_GOOGLE_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyn_0_rXLExy7qhTUP_kxHRXOzi8mtnwu-M1L-JAMo7m6MytKaxvZBddBm2NZLVLizi4w/exec';

export const STORAGE_KEY_WEBHOOK_URL = 'hc_google_sheets_webhook_url';
export const STORAGE_KEY_AUTO_SYNC = 'hc_google_sheets_auto_sync';
export const STORAGE_KEY_LAST_SYNC_TIME = 'hc_last_sync_time';

/**
 * Mendapatkan URL Web App Google Apps Script.
 * Mengutamakan URL rasmi SK Laksian Banggi terkini.
 */
export function getSavedWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK_URL);
    if (saved && saved.trim().startsWith('http') && !saved.includes('AKfycbxu')) {
      return saved.trim();
    }
  } catch (e) {
    console.warn('Gagal membaca URL webhook dari localStorage:', e);
  }
  try {
    localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, OFFICIAL_GOOGLE_SHEETS_WEBHOOK_URL);
  } catch {}
  return OFFICIAL_GOOGLE_SHEETS_WEBHOOK_URL;
}

/**
 * Menyimpan URL Webhook Google Sheets ke localStorage.
 */
export function saveWebhookUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, url.trim());
  } catch (e) {
    console.error('Gagal menyimpan URL webhook:', e);
  }
}

/**
 * Menyemak sama ada tetapan auto-segerak diaktifkan (default: true).
 */
export function isAutoSyncEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO_SYNC);
    if (saved === null) return true; // Default aktif
    return saved === 'true';
  } catch {
    return true;
  }
}

/**
 * Menetapkan mod auto-segerak ke Google Sheets.
 */
export function setAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_SYNC, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Gagal menyimpan tetapan auto-sync:', e);
  }
}

export interface SyncPayload {
  schoolName: string;
  activeYearId: string;
  activeYearLabel: string;
  classGroup: string;
  students: Student[];
  studentsByYear: Record<string, Student[]>;
  years: AcademicYear[];
  gradeScales: GradeScale[];
  generatedAt: string;
}

/**
 * Menghantar dan menyimpan data penuh ke Google Sheets melalui POST request.
 */
export async function syncDataToGoogleSheets(
  url: string,
  payload: SyncPayload
): Promise<{ success: boolean; message: string; timestamp?: string }> {
  const targetUrl = (url || getSavedWebhookUrl()).trim();
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App tidak sah.',
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(text);
    } catch {
      // Browser fallback (silent success in simple CORS mode)
    }

    const timestamp = new Date().toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      localStorage.setItem(STORAGE_KEY_LAST_SYNC_TIME, timestamp);
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      message:
        resJson?.message ||
        `Data berjaya disimpan ke Google Sheet (${payload.students.length} orang murid).`,
      timestamp,
    };
  } catch (err: any) {
    console.error('Ralat simpan ke Google Sheets:', err);
    return {
      success: false,
      message:
        'Gagal menyambung ke Google Sheets. Sila pastikan sambungan internet aktif dan skrip Google Apps Script diberikan akses "Anyone".',
    };
  }
}

/**
 * Mengambil data sandaran headcount terkini dari Google Sheets melalui GET request.
 */
export async function fetchBackupFromGoogleSheets(url?: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    schoolName?: string;
    activeYearId?: string;
    studentsByYear?: Record<string, Student[]>;
    years?: AcademicYear[];
    gradeScales?: GradeScale[];
    generatedAt?: string;
  };
}> {
  const targetUrl = (url || getSavedWebhookUrl()).trim();
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App tidak sah.',
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }

    const json = await response.json();
    if (json.status === 'success' && json.data) {
      return {
        success: true,
        message: 'Data headcount berjaya dimuatkan dari Google Sheet.',
        data: json.data,
      };
    } else if (json.status === 'empty') {
      return {
        success: false,
        message: 'Google Sheet belum mempunyai data sandaran tersimpan.',
      };
    } else {
      return {
        success: false,
        message: json.message || 'Format data Google Sheet tidak sah.',
      };
    }
  } catch (err: any) {
    console.warn('Gagal memuat data dari Google Sheets:', err);
    return {
      success: false,
      message: 'Gagal mengambil data dari Google Sheet (Mungkin sekatan rangkaian atau skrip belum bersedia).',
    };
  }
}
