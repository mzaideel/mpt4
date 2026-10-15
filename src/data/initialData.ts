import { Student, SubjectMarks, SubjectId } from '../types';

function createMarks(
  bm: [number, number, number, number, number, string?],
  bi: [number, number, number, number, number, string?],
  mat: [number, number, number, number, number, string?],
  sn: [number, number, number, number, number, string?]
): Record<SubjectId, SubjectMarks> {
  const mapMark = (arr: [number, number, number, number, number, string?]): SubjectMarks => ({
    tov: arr[0],
    etr: arr[1],
    ar1: arr[2],
    ar2: arr[3],
    actual: arr[4],
    notes: arr[5] || '',
  });

  return {
    BM: mapMark(bm),
    BI: mapMark(bi),
    MAT: mapMark(mat),
    SN: mapMark(sn),
  };
}

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    noId: '',
    name: 'AFIF AYSAR MOHAMMAD ALZUAYNER',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [78, 88, 80, 84, 86, 'Pembacaan fokus tatabahasa'],
      [72, 82, 75, 78, 81, 'Modul bina ayat'],
      [82, 92, 85, 88, 90, 'Murid potensi Cemerlang Matematik'],
      [80, 88, 82, 85, 87, 'Latihan amali Radas']
    ),
  },
  {
    id: 's2',
    noId: '',
    name: 'ARIANIS AHIDAL',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [82, 92, 85, 88, 90, 'Tingkatkan penulisan karangan'],
      [85, 94, 88, 91, 93, 'Bilingual storytelling'],
      [75, 85, 78, 81, 84, 'Bimbingan soalan KBAT'],
      [84, 90, 86, 88, 89, 'Penulisan nota grafik']
    ),
  },
  {
    id: 's3',
    noId: '',
    name: 'AWANG SAZWAN ABDULLAH',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [65, 75, 68, 72, 74, 'Bimbingan pemahaman'],
      [58, 68, 60, 64, 66, 'Latihan ejaan & vocab'],
      [62, 72, 65, 69, 70, 'Klinik pendarab dan pembahagi'],
      [60, 70, 63, 67, 68, 'Uji kaji sains bergambar']
    ),
  },
  {
    id: 's4',
    noId: '',
    name: 'AZWAR HUSAINI BIN AMIR HAMZAH',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [88, 95, 90, 92, 94, 'Penguasaan Bahasa Melayu amat baik'],
      [90, 98, 92, 95, 96, 'Sangat cemerlang BI'],
      [92, 100, 94, 98, 98, 'Kategori murid teratas Matematik'],
      [86, 94, 89, 91, 93, 'Analisis KBAT sains']
    ),
  },
  {
    id: 's5',
    noId: '',
    name: 'FARAH NUR ZAHIRAH BINTI RADZUAN',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [52, 62, 55, 58, 60, 'Sering tidak menyiapkan kerja rumah'],
      [48, 58, 50, 54, 55, 'Intervensi Asas BI (Reading Buddy)'],
      [50, 60, 52, 56, 58, 'Guna bahan bantu mengajar'],
      [55, 65, 58, 61, 62, 'Bimbingan istilah sains']
    ),
  },
  {
    id: 's6',
    noId: '',
    name: 'FAUZANAH FAUZI',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [70, 80, 72, 76, 78, 'Peningkatan perbendaharaan kata'],
      [78, 86, 80, 83, 85, 'Penguasaan Grammar mantap'],
      [68, 78, 70, 74, 76, 'Kerap cuai dalam sifir'],
      [72, 80, 74, 77, 78, 'Perlu pemantauan buku nota']
    ),
  },
  {
    id: 's7',
    noId: '',
    name: 'JOHAAN SULAIMAN',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [42, 52, 45, 48, 50, 'Perlu intervensi intensif tatabahasa'],
      [38, 50, 40, 44, 46, 'MURID AT-RISK: Kelas tambahan BI'],
      [35, 48, 38, 42, 44, 'MURID PERLU BIMBINGAN sifir asas'],
      [40, 52, 42, 46, 48, 'Sesi mentor-mentee bersama rakan']
    ),
  },
  {
    id: 's8',
    noId: '',
    name: 'MASLIAH ABDULLAH',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [75, 85, 78, 81, 83, 'Penulisan ulasan memuaskan'],
      [70, 80, 73, 76, 78, 'Tingkatkan keyakinan bertutur'],
      [65, 75, 68, 71, 73, 'Latih tubi berfokus tajuk Pecahan'],
      [70, 78, 72, 75, 76, 'Laporan amali lengkap']
    ),
  },
  {
    id: 's9',
    noId: '',
    name: 'MOHAMAD AIMAN FIRDAUS RIDWAN',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [60, 70, 62, 66, 68, 'Modul karangan berpandu'],
      [55, 65, 58, 61, 63, 'Kosa kata harian'],
      [58, 68, 60, 64, 65, 'Bimbingan operasi gabungan'],
      [62, 72, 65, 68, 70, 'Ujian formatif berterusan']
    ),
  },
  {
    id: 's10',
    noId: '',
    name: 'MUHAMMAD ANNAS ASYRAF ABDULLAH',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [85, 92, 87, 89, 91, 'Prestasi cemerlang berterusan'],
      [82, 90, 84, 87, 88, 'Penulisan essay amat baik'],
      [80, 88, 82, 85, 86, 'Menguasai soalan KBAT level 3'],
      [84, 92, 86, 88, 90, 'Minat tinggi dalam pencerapan sains']
    ),
  },
  {
    id: 's11',
    noId: '',
    name: 'MUHAMMAD SYAZWAN ABDULLAH',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [62, 72, 65, 68, 70, 'Tingkatkan kosa kata Bahasa Melayu'],
      [75, 84, 78, 81, 82, 'Pertuturan BI fasih'],
      [70, 80, 73, 76, 78, 'Penyelesaian masalah ayat matematik'],
      [68, 76, 70, 73, 75, 'Latihan carta alir sains']
    ),
  },
  {
    id: 's12',
    noId: '',
    name: 'NUR AIN ATIRAH ABDULLAH',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [72, 82, 75, 78, 80, 'Sikap belajar positif'],
      [68, 78, 70, 74, 75, 'Tingkatkan kemahiran mendengar BI'],
      [64, 74, 67, 70, 72, 'Latih tubi tajuk Masa & Waktu'],
      [70, 78, 72, 75, 76, 'Kerap membuat rujukan']
    ),
  },
  {
    id: 's13',
    noId: '',
    name: 'NURQAIREEN DAMIYAA MOHD DURJAYA',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [58, 68, 60, 64, 66, 'Tingkatkan fokus dalam kelas'],
      [50, 62, 53, 57, 59, 'Bimbingan asas tatabahasa BI'],
      [52, 64, 55, 59, 60, 'Latihan operasi asas harian'],
      [56, 66, 59, 62, 64, 'Buku nota kemas']
    ),
  },
  {
    id: 's14',
    noId: '',
    name: 'NURUL ISNIRAWATI',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [80, 88, 82, 85, 87, 'Penguasaan Bahasa Melayu memuaskan'],
      [88, 95, 90, 93, 94, 'Penulisan BI sangat baik'],
      [86, 94, 88, 91, 93, 'Minat mendalam subjek Matematik'],
      [82, 90, 85, 87, 88, 'Eksperimen sains teliti']
    ),
  },
  {
    id: 's15',
    noId: '',
    name: 'NURUL RANIAH NABILAH ABDULLAH',
    gender: 'P',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [45, 55, 48, 51, 53, 'Di bawah pemerhatian khas guru kelas'],
      [40, 52, 43, 47, 48, 'Sesi pemulihan bacaan BI'],
      [38, 50, 41, 45, 46, 'Intervensi sifir 2 hingga 9'],
      [48, 58, 50, 53, 55, 'Perlu rajin hadir ke sekolah']
    ),
  },
  {
    id: 's16',
    noId: '',
    name: 'RIYAN ABDULLAH',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [76, 84, 78, 81, 82, 'Penulisan ulasan mantap'],
      [74, 82, 76, 79, 80, 'Perbendaharaan kata luas'],
      [70, 80, 73, 76, 78, 'Penyelesaian masalah wang & peratus'],
      [75, 82, 77, 79, 80, 'Minat dalam tajuk Haiwan & Tumbuhan']
    ),
  },
  {
    id: 's17',
    noId: '',
    name: 'ROZAIMIE ROZIMAN',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [64, 74, 66, 70, 71, 'Rajin bertanyakan soalan'],
      [60, 70, 62, 65, 67, 'Latihan struktur ayat pendek'],
      [68, 78, 70, 74, 75, 'Latih tubi tajuk Ruang & Bentuk'],
      [65, 75, 67, 71, 72, 'Pemahaman proses sains']
    ),
  },
  {
    id: 's18',
    noId: '',
    name: 'ALI',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [68, 78, 70, 74, 76, 'Penguasaan bacaan baik'],
      [76, 84, 78, 81, 83, 'Kreatif dalam penulisan BI'],
      [62, 72, 65, 68, 70, 'Bimbingan langkah jalan kerja Matematik'],
      [70, 78, 72, 75, 77, 'Laporan eksperimen teratur']
    ),
  },
  {
    id: 's19',
    noId: '',
    name: 'ABU',
    gender: 'L',
    classGroup: '4 DINAMIK',
    marks: createMarks(
      [36, 48, 39, 42, 44, 'INTERVENSI KRITIKAL: Membaca & Ejaan'],
      [32, 45, 35, 39, 41, 'PEMULIHAN Khas BI (Basic Vocabulary)'],
      [30, 45, 33, 38, 40, 'PEMULIHAN Khas Matematik (Sifir Asas)'],
      [38, 50, 40, 44, 46, 'Bimbingan bersasar Sains']
    ),
  },
];
