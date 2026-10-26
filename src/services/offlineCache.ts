import AsyncStorage from "@react-native-async-storage/async-storage";

import { HasilGeocoding } from "../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";

const KUNCI_CACHE_CUACA = "@jelajah_aman:cache_cuaca";
const KUNCI_CACHE_KOTA = "@jelajah_aman:cache_kota";

export type CacheCuaca = {
  kota: HasilGeocoding;
  cuaca: DataCuacaLengkap;
  kualitasUdara: DataKualitasUdara;
  waktuSimpan: string;
};

// Membuat kunci unik berdasarkan koordinat kota.
function buatKunciCuaca(kota: HasilGeocoding): string {
  return `${KUNCI_CACHE_CUACA}:${kota.latitude}_${kota.longitude}`;
}

// Menyimpan cache cuaca sebuah kota.
export async function simpanCacheCuaca(
  kota: HasilGeocoding,
  cuaca: DataCuacaLengkap,
  kualitasUdara: DataKualitasUdara,
): Promise<void> {
  const cache: CacheCuaca = {
    kota,
    cuaca,
    kualitasUdara,
    waktuSimpan: new Date().toISOString(),
  };

  const json = JSON.stringify(cache);

  await AsyncStorage.setItem(buatKunciCuaca(kota), json);
  await AsyncStorage.setItem(KUNCI_CACHE_CUACA, json);
}

// Membaca cache kota tertentu atau cache terakhir.
export async function ambilCacheCuaca(
  kota?: HasilGeocoding,
): Promise<CacheCuaca | null> {
  let json: string | null = null;

  if (kota) {
    json = await AsyncStorage.getItem(buatKunciCuaca(kota));

    if (!json) {
      const cacheTerakhir = await AsyncStorage.getItem(KUNCI_CACHE_CUACA);

      if (cacheTerakhir) {
        try {
          const data = JSON.parse(cacheTerakhir) as CacheCuaca;

          if (
            data.kota?.latitude === kota.latitude &&
            data.kota?.longitude === kota.longitude
          ) {
            json = cacheTerakhir;
          }
        } catch {
          // Abaikan cache terakhir yang rusak.
        }
      }
    }
  } else {
    json = await AsyncStorage.getItem(KUNCI_CACHE_CUACA);
  }

  if (!json) {
    return null;
  }

  try {
    const cache = JSON.parse(json) as CacheCuaca;

    if (!cache.kota || !cache.cuaca || !cache.kualitasUdara) {
      return null;
    }

    if (
      kota &&
      (cache.kota.latitude !== kota.latitude ||
        cache.kota.longitude !== kota.longitude)
    ) {
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

// Menyimpan hasil pencarian agar dapat digunakan saat offline.
export async function simpanCacheKota(
  kotaBaru: HasilGeocoding[],
): Promise<void> {
  const kotaLama = await ambilSemuaCacheKota();
  const gabungan = [...kotaLama];

  for (const kota of kotaBaru) {
    const sudahAda = gabungan.some(
      (item) =>
        item.latitude === kota.latitude && item.longitude === kota.longitude,
    );

    if (!sudahAda) {
      gabungan.push(kota);
    }
  }

  await AsyncStorage.setItem(KUNCI_CACHE_KOTA, JSON.stringify(gabungan));
}

// Membaca semua kota hasil pencarian yang tersimpan.
export async function ambilSemuaCacheKota(): Promise<HasilGeocoding[]> {
  const json = await AsyncStorage.getItem(KUNCI_CACHE_KOTA);

  if (!json) {
    return [];
  }

  try {
    const data: unknown = JSON.parse(json);
    return Array.isArray(data) ? (data as HasilGeocoding[]) : [];
  } catch {
    return [];
  }
}

// Mencari kota yang tersimpan di perangkat.
export async function cariCacheKota(
  kataKunci: string,
): Promise<HasilGeocoding[]> {
  const kota = await ambilSemuaCacheKota();
  const kata = kataKunci.trim().toLowerCase();

  if (!kata) {
    return [];
  }

  return kota.filter((item) => {
    const nama = item.name?.toLowerCase() ?? "";
    const negara = item.country?.toLowerCase() ?? "";
    const wilayah = item.admin1?.toLowerCase() ?? "";

    return (
      nama.includes(kata) || negara.includes(kata) || wilayah.includes(kata)
    );
  });
}

// MENGHAPUS CACHE CUACA DAN CACHE PENCARIAN KOTA.
export async function hapusCacheKota(
  latitude: number,
  longitude: number,
): Promise<void> {
  const kunciCuacaKota = `${KUNCI_CACHE_CUACA}:${latitude}_${longitude}`;

  // Hapus cache cuaca khusus kota.
  await AsyncStorage.removeItem(kunciCuacaKota);

  // Hapus kota dari daftar cache hasil pencarian.
  const semuaKota = await ambilSemuaCacheKota();

  const kotaTersisa = semuaKota.filter(
    (kota) => kota.latitude !== latitude || kota.longitude !== longitude,
  );

  await AsyncStorage.setItem(KUNCI_CACHE_KOTA, JSON.stringify(kotaTersisa));

  // Periksa apakah kota yang dihapus adalah cache terakhir.
  const jsonTerakhir = await AsyncStorage.getItem(KUNCI_CACHE_CUACA);

  let cacheTerakhir: CacheCuaca | null = null;

  if (jsonTerakhir) {
    try {
      cacheTerakhir = JSON.parse(jsonTerakhir) as CacheCuaca;
    } catch {
      cacheTerakhir = null;
    }
  }

  const cacheTerakhirAdalahKotaIni =
    cacheTerakhir?.kota?.latitude === latitude &&
    cacheTerakhir?.kota?.longitude === longitude;

  if (cacheTerakhirAdalahKotaIni || !cacheTerakhir) {
    // Cari cache cuaca kota lain yang masih tersedia.
    const semuaKunci = await AsyncStorage.getAllKeys();

    const kunciCacheLain = semuaKunci.filter(
      (key) =>
        key.startsWith(`${KUNCI_CACHE_CUACA}:`) && key !== kunciCuacaKota,
    );

    const nilaiCache = await AsyncStorage.multiGet(kunciCacheLain);

    let cachePengganti: CacheCuaca | null = null;

    for (const [, nilai] of nilaiCache) {
      if (!nilai) continue;

      try {
        const data = JSON.parse(nilai) as CacheCuaca;

        if (data.kota && data.cuaca && data.kualitasUdara) {
          cachePengganti = data;
          break;
        }
      } catch {
        // Lewati cache yang tidak valid.
      }
    }

    if (cachePengganti) {
      await AsyncStorage.setItem(
        KUNCI_CACHE_CUACA,
        JSON.stringify(cachePengganti),
      );
    } else {
      await AsyncStorage.removeItem(KUNCI_CACHE_CUACA);
    }
  }
}

const KUNCI_RIWAYAT_PENCARIAN = "@jelajah_aman:riwayat_pencarian";

// Menyimpan kota yang dipilih dari hasil pencarian.
// Maksimal 10 kota, tanpa duplikasi koordinat.
export async function simpanRiwayatPencarian(
  kota: HasilGeocoding,
): Promise<void> {
  const riwayat = await ambilRiwayatPencarian();

  const tanpaDuplikat = riwayat.filter(
    (item) =>
      item.latitude !== kota.latitude || item.longitude !== kota.longitude,
  );

  const riwayatBaru = [kota, ...tanpaDuplikat].slice(0, 10);

  await AsyncStorage.setItem(
    KUNCI_RIWAYAT_PENCARIAN,
    JSON.stringify(riwayatBaru),
  );
}

// Mengambil riwayat pencarian dari perangkat.
export async function ambilRiwayatPencarian(): Promise<HasilGeocoding[]> {
  const json = await AsyncStorage.getItem(KUNCI_RIWAYAT_PENCARIAN);

  if (!json) return [];

  try {
    const data: unknown = JSON.parse(json);
    return Array.isArray(data) ? (data as HasilGeocoding[]) : [];
  } catch {
    return [];
  }
}

// Menghapus satu kota dari riwayat pencarian.
export async function hapusRiwayatPencarian(
  latitude: number,
  longitude: number,
): Promise<void> {
  const riwayat = await ambilRiwayatPencarian();

  const riwayatBaru = riwayat.filter(
    (item) => item.latitude !== latitude || item.longitude !== longitude,
  );

  await AsyncStorage.setItem(
    KUNCI_RIWAYAT_PENCARIAN,
    JSON.stringify(riwayatBaru),
  );
}
