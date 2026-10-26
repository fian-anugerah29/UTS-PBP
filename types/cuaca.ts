
export interface DataCuaca {
  kota: string;
  suhu: number;
  kelembapan: number;
  catatan?: string;
}

export type TingkatAQI =
  | "BAIK"
  | "SEDANG"
  | "TIDAK_SEHAT"
  | "BERBAHAYA";

export interface WeatherCardProps {
    kota: string;
    suhu: number;
    tingkatAQI: TingkatAQI;
    indeksAQI?: number; // baru: angka asli dari API, opsional
    suhuMaksimal?: number;
    suhuMinimal?: number;
    pm25?: number;
    pm10?: number;
}

// Interface untuk tugas mandiri
export interface LaporanUdara {
  kota: string;
  indeksAQI: number;
  tingkat: TingkatAQI;
  diperbaruiPada?: string;
}
