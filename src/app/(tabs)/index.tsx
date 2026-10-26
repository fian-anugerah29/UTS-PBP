// src/app/(tabs)/index.tsx
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AtribusiCuaca from "../../components/AtribusiCuaca";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";

import { useDebounce } from "../../hooks/use-debounce";

import {
  ambilCacheCuaca,
  cariCacheKota,
  simpanCacheCuaca,
  simpanCacheKota,
} from "../../services/offlineCache";

import {
  ambilKoordinatSaatIni,
  mintaIzinLokasi,
} from "../../services/locationService";

import { ambilKualitasUdara } from "../../services/airQualityService";
import { ambilSemuaFavorit } from "../../services/favoritStorages";
import { cariKota } from "../../services/geocodingServices";
import { ambilCuaca } from "../../services/weatherServices";

import { labelKodeCuaca } from "../../constants/weatherCodes";
import { konversiTingkatAQI } from "../../services/weatherAdapter";

import { KotaFavorit } from "../../../types/favorit";
import { HasilGeocoding } from "../../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../../types/weather";

import { useTema } from "../../context/ThemeContext";

import { simpanRiwayatPencarian } from "../../services/offlineCache";

export default function HalamanUtama() {
  const { warna } = useTema();

  // =====================================================
  // STATE
  // =====================================================

  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);

  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);

  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);

  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(
    null,
  );

  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);

  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);

  const [menggunakanCache, setMenggunakanCache] = useState(false);

  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);

  // Parameter dari navigasi (misal: saat memilih kota dari tab Riwayat / Favorit)
  const params = useLocalSearchParams<{
    kotaId?: string;
    namaKota?: string;
    latitude?: string;
    longitude?: string;
    negara?: string;
    wilayah?: string;
  }>();

  // Saat salah satu riwayat / favorit diklik, otomatis tampilkan cuaca kota tersebut
  useEffect(() => {
    if (params.namaKota && params.latitude && params.longitude) {
      const kotaDariNavigasi: HasilGeocoding = {
        id: params.kotaId ? Number(params.kotaId) : -1,
        name: params.namaKota,
        latitude: Number(params.latitude),
        longitude: Number(params.longitude),
        country: params.negara || "",
        admin1: params.wilayah || "",
      };

      setTeksCari("");
      setHasilPencarian([]);
      void pilihKota(kotaDariNavigasi);
    }
  }, [params.namaKota, params.latitude, params.longitude]);

  // =====================================================
  // MEMULIHKAN CACHE CUACA SAAT BERANDA DIBUKA
  // =====================================================

  useEffect(() => {
    let masihAktif = true;

    async function pulihkanDataOffline() {
      try {
        const cache = await ambilCacheCuaca();

        if (!masihAktif || !cache) {
          return;
        }

        setKotaTerpilih(cache.kota);
        setCuaca(cache.cuaca);
        setKualitasUdara(cache.kualitasUdara);
        setMenggunakanCache(true);
        setPesanError(null);
      } catch (error) {
        console.error("Gagal memulihkan cache cuaca:", error);
      }
    }

    void pulihkanDataOffline();

    return () => {
      masihAktif = false;
    };
  }, []);

  // =====================================================
  // MEMUAT DAFTAR FAVORIT
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      let masihAktif = true;

      ambilSemuaFavorit()
        .then((favorit) => {
          if (masihAktif) {
            setDaftarFavorit(favorit);
          }
        })
        .catch((error) => {
          console.error("Gagal mengambil data favorit:", error);
        });

      return () => {
        masihAktif = false;
      };
    }, []),
  );

  const sudahFavorit =
    kotaTerpilih !== null &&
    daftarFavorit.some((favorit) => favorit.id === kotaTerpilih.id);

  // =====================================================
  // PENCARIAN KOTA ONLINE DAN OFFLINE
  // =====================================================

  useEffect(() => {
    const kataKunci = teksTertunda.trim();

    if (kataKunci.length === 0) {
      setHasilPencarian([]);
      return;
    }

    let masihAktif = true;

    async function cariKotaOnlineDanOffline() {
      try {
        // Cari kota melalui internet terlebih dahulu.
        const hasilOnline = await cariKota(kataKunci);

        if (!masihAktif) {
          return;
        }

        setHasilPencarian(hasilOnline);

        // Simpan hasil pencarian untuk penggunaan offline.
        try {
          await simpanCacheKota(hasilOnline);
        } catch (error) {
          console.error("Gagal menyimpan cache kota:", error);
        }
      } catch (error) {
        console.log("Pencarian online gagal, mencoba cache kota.");

        // Jika internet gagal, cari kota dari cache lokal.
        try {
          const hasilOffline = await cariCacheKota(kataKunci);

          if (!masihAktif) {
            return;
          }

          setHasilPencarian(hasilOffline);

          if (hasilOffline.length === 0) {
            console.log("Kota belum tersedia dalam cache offline.");
          }
        } catch (cacheError) {
          console.error("Gagal mencari kota offline:", cacheError);

          if (masihAktif) {
            setHasilPencarian([]);
          }
        }
      }
    }

    void cariKotaOnlineDanOffline();

    return () => {
      masihAktif = false;
    };
  }, [teksTertunda]);

  // =====================================================
  // MEMILIH KOTA DAN MEMUAT CUACA
  // =====================================================

  async function pilihKota(kota: HasilGeocoding) {
    const idSaatIni = ++requestIdRef.current;

    setKotaTerpilih(kota);
    setSedangMemuat(true);
    setPesanError(null);
    setMenggunakanCache(false);

    try {
      // Ambil data cuaca dan kualitas udara dari API.
      await simpanRiwayatPencarian(kota);
      const [dataCuaca, dataAQI] = await Promise.all([
        ambilCuaca(kota.latitude, kota.longitude),
        ambilKualitasUdara(kota.latitude, kota.longitude),
      ]);

      // Abaikan hasil permintaan lama jika kota sudah berubah.
      if (idSaatIni !== requestIdRef.current) {
        return;
      }

      setKotaTerpilih(kota);
      setCuaca(dataCuaca);
      setKualitasUdara(dataAQI);
      setMenggunakanCache(false);
      setPesanError(null);

      // Simpan data cuaca agar dapat digunakan saat offline.
      try {
        await simpanCacheCuaca(kota, dataCuaca, dataAQI);
      } catch (error) {
        console.error("Gagal menyimpan cache cuaca:", error);
      }
    } catch (error) {
      if (idSaatIni !== requestIdRef.current) {
        return;
      }

      console.error("Gagal mengambil data cuaca:", error);

      // Jika API gagal, coba ambil cache untuk kota yang sama.
      try {
        const cache = await ambilCacheCuaca(kota);

        if (idSaatIni !== requestIdRef.current) {
          return;
        }

        if (cache) {
          setKotaTerpilih(cache.kota);
          setCuaca(cache.cuaca);
          setKualitasUdara(cache.kualitasUdara);
          setMenggunakanCache(true);

          setPesanError(
            "Offline: menampilkan data cuaca terakhir yang tersimpan untuk kota ini.",
          );
        } else {
          setMenggunakanCache(false);

          setPesanError(
            `Data cuaca untuk ${kota.name} belum tersimpan. ` +
              "Pilih kota ini saat online dan tunggu sampai cuacanya muncul.",
          );
        }
      } catch (cacheError) {
        console.error("Gagal memuat cache cuaca:", cacheError);

        setMenggunakanCache(false);
        setPesanError("Data offline gagal dibaca.");
      }
    } finally {
      if (idSaatIni === requestIdRef.current) {
        setSedangMemuat(false);
      }
    }
  }

  // =====================================================
  // MENGGUNAKAN LOKASI PERANGKAT
  // =====================================================

  async function gunakanLokasiSaatIni() {
    try {
      setPesanLokasi(null);

      const status = await mintaIzinLokasi();

      if (status === "denied") {
        setPesanLokasi(
          "Izin lokasi ditolak. Silakan izinkan akses lokasi perangkat.",
        );
        return;
      }

      if (status === "unavailable") {
        setPesanLokasi(
          "Layanan lokasi tidak aktif. Aktifkan GPS atau layanan lokasi.",
        );
        return;
      }

      const koordinat = await ambilKoordinatSaatIni();

      // Mencari nama kota berdasarkan koordinat membutuhkan internet.
      const url =
        "https://api.bigdatacloud.net/data/reverse-geocode-client" +
        `?latitude=${koordinat.latitude}` +
        `&longitude=${koordinat.longitude}` +
        "&localityLanguage=id";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Gagal mencari nama lokasi.");
      }

      const data = await response.json();

      const namaKota =
        data.city ||
        data.locality ||
        data.localityInfo?.administrative
          ?.slice()
          .reverse()
          .find((wilayah: { name?: string }) => wilayah.name)?.name;

      if (!namaKota) {
        setPesanLokasi(
          "Nama kota tidak ditemukan. Silakan cari kota secara manual.",
        );
        return;
      }

      await pilihKota({
        id: -1,
        name: namaKota,
        latitude: koordinat.latitude,
        longitude: koordinat.longitude,
        country: data.countryName || "",
        admin1: data.principalSubdivision || "",
      });
    } catch (error) {
      console.error("Gagal mendapatkan lokasi:", error);

      setPesanLokasi(
        "Gagal mendapatkan nama lokasi. Periksa koneksi internet dan izin lokasi.",
      );
    }
  }

  // =====================================================
  // TAMPILAN BERANDA
  // =====================================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
        backgroundColor: warna.latar,
      }}
    >
      <SearchBox onCari={setTeksCari} />

      <Button title="Gunakan Lokasi Saat Ini" onPress={gunakanLokasiSaatIni} />

      {pesanLokasi && (
        <Text style={{ color: warna.teksSekunder, fontSize: 13 }}>
          {pesanLokasi}
        </Text>
      )}

      {/* Hasil pencarian kota */}
      {hasilPencarian.map((kota, index) => (
        <TouchableOpacity
          key={`${kota.latitude}_${kota.longitude}_${index}`}
          onPress={() => {
            setTeksCari("");
            setHasilPencarian([]);
            void pilihKota(kota);
          }}
          style={{
            padding: 12,
            backgroundColor: warna.kartu,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: warna.garis,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Pilih kota ${kota.name}`}
        >
          <Text style={{ color: warna.teks, fontSize: 15, fontWeight: "500" }}>
            {kota.name}
            {kota.admin1 ? `, ${kota.admin1}` : ""}
            {kota.country ? `, ${kota.country}` : ""}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Indikator pemuatan */}
      {sedangMemuat && <ActivityIndicator color={warna.primer} />}

      {/* Pemberitahuan bahwa data berasal dari cache */}
      {menggunakanCache && (
        <Text style={{ color: "#B45309" }}>
          Mode offline: menampilkan data cuaca terakhir yang tersimpan. Data ini
          mungkin bukan kondisi cuaca terkini.
        </Text>
      )}

      {/* Pesan kesalahan dan tombol coba lagi */}
      {pesanError && (
        <View style={{ gap: 8 }}>
          <Text style={{ color: "#EF4444" }}>{pesanError}</Text>

          <Button
            title="Coba Lagi"
            onPress={() => {
              if (kotaTerpilih) {
                void pilihKota(kotaTerpilih);
              }
            }}
          />
        </View>
      )}

      {/* Kartu cuaca dan tombol favorit */}
      {cuaca && kualitasUdara && kotaTerpilih && !sedangMemuat && (
        <>
          <WeatherCard
            kota={kotaTerpilih.name}
            suhu={cuaca.saatIni.suhu}
            tingkatAQI={konversiTingkatAQI(kualitasUdara.indeksAQI)}
            indeksAQI={kualitasUdara.indeksAQI}
            suhuMaksimal={cuaca.harian.suhuMaksimal[0]}
            suhuMinimal={cuaca.harian.suhuMinimal[0]}
            pm25={kualitasUdara.pm25}
            pm10={kualitasUdara.pm10}
          />

          {sudahFavorit ? (
            <Text style={{ color: "green" }}>
              Kota ini sudah tersimpan di favorit.
            </Text>
          ) : (
            <Button
              title="Tambahkan ke Favorit"
              onPress={() => {
                router.push({
                  pathname: "/tambah-favorit" as const,
                  params: {
                    id: String(kotaTerpilih.id),
                    nama: kotaTerpilih.name,
                    lat: String(kotaTerpilih.latitude),
                    lon: String(kotaTerpilih.longitude),
                  },
                });
              }}
            />
          )}
        </>
      )}

      {/* Kondisi cuaca dan kecepatan angin */}
      {cuaca && (
        <Text style={{ fontSize: 12, color: warna.teksSekunder }}>
          Kondisi: {labelKodeCuaca(cuaca.saatIni.kodeCuaca)}
          {" • "}Angin {cuaca.saatIni.kecepatanAngin} km/j
        </Text>
      )}

      <AtribusiCuaca />
    </SafeAreaView>
  );
}
