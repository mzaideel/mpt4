# PANDUAN PEMASANGAN GOOGLE APPS SCRIPT (GAS)
## Sistem Headcount & Matriks Pembelajaran Tahun 4 (2026)
Khusus untuk akaun Google Workspace for Education (DELIMa KPM: `@moe-dl.edu.my`)

---

### Langkah 1: Buka Google Sheets Baharu
1. Log masuk ke akaun Google Workspace / DELIMa anda.
2. Pergi ke Google Drive atau terus ke [sheets.new](https://sheets.new) untuk cipta Google Sheet kosong.
3. Namakan Google Sheet tersebut, contohnya: **"Headcount Tahun 4 2026 - 4 Bestari"**.

---

### Langkah 2: Buka Editor Apps Script
1. Di bar menu atas Google Sheet, klik:
   **Extensions** (Sambungan) > **Apps Script**.
2. Editor kod Apps Script akan dibuka dalam tab baharu.

---

### Langkah 3: Masukkan Kod `Code.gs`
1. Di panel fail sebelah kiri, klik pada fail sedia ada bernama **`Code.gs`**.
2. Padam semua kod contoh di dalamnya.
3. Salin keseluruhan kandungan fail **`Code.gs`** dari projek ini dan tampal (Paste) ke dalamnya.
4. Tekan **Ctrl + S** (atau ikon cakera liut) untuk menyimpan.

---

### Langkah 4: Tambah Fail `index.html`
1. Di panel fail sebelah kiri Apps Script, klik butang **+** (Add a file).
2. Pilih **HTML**.
3. Namakan fail tersebut tepat sebagai: **`index`** (Apps Script akan automatik menjadikannya `index.html`).
4. Padam kod asal, kemudian salin dan tampal keseluruhan kandungan fail **`index.html`** dari projek ini.
5. Tekan **Ctrl + S** untuk menyimpan.

---

### Langkah 5: Laksana Web App (Deploy)
1. Di penjuru kanan atas skrin Apps Script, klik butang biru **Deploy** (Laksana) > pilih **New deployment** (Pelaksanaan baharu).
2. Klik ikon gear di sebelah kiri jenis pilihan (Select type) > pilih **Web app**.
3. Isikan tetapan berikut:
   - **Description**: `Sistem Headcount Tahun 4 v1`
   - **Execute as**: `Me (emel anda@moe-dl.edu.my)`
   - **Who has access**: `Anyone with Google account` (atau `Anyone within Kementerian Pendidikan Malaysia` jika mahu hanya guru KPM).
4. Klik butang **Deploy**.
5. Klik **Authorize access** (Beri kebenaran) jika diminta oleh Google:
   - Pilih akaun Google anda.
   - Jika keluar amaran "Google hasn't verified this app", klik **Advanced** > klik **Go to ... (unsafe)** > klik **Allow**.
6. Salin **Web app URL** yang diberikan!

---

### Kelebihan Integrasi Google Apps Script Ini:
1. **Penyelarasan Automatik 2 Hala**: Setiap kali guru memasukkan atau menukar markah (TOV, ETR, AR1, AR2, Ujian Sebenar) atau catatan intervensi di Web App, ia akan dikemaskini terus ke Google Sheet dalam tab `DATA_MURID`.
2. **Kekal Selamat di Google Drive KPM**: Semua data murid dan markah kekal di dalam simpanan Google Drive rasmi guru/sekolah tanpa pelayan pihak ketiga.
3. **Boleh Dicetak / Dikongsi**: Boleh dibuka di telefon pintar, tablet, atau komputer riba bila-bila masa.
