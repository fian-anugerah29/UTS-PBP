import { View, Text } from "react-native";
import {
  WeatherCardProps,
  TingkatAQI,
} from "../../types/cuaca";
import { typeScale, spacing } from "../constants/styles";
import { useTema } from "../context/ThemeContext";

const warnaPerTingkat: Record<TingkatAQI, string> = {
  BAIK: "#22C55E",
  SEDANG: "#EAB308",
  TIDAK_SEHAT: "#F97316",
  BERBAHAYA: "#EF4444",
};

export default function WeatherCard({
  kota,
  suhu,
  tingkatAQI,
  indeksAQI,
  suhuMaksimal,
  suhuMinimal,
  pm25,
  pm10,
}: WeatherCardProps) {
  const { warna } = useTema();

  const teksAQI =
    indeksAQI !== undefined
      ? `AQI: ${indeksAQI} (${tingkatAQI})`
      : `AQI: ${tingkatAQI}`;

  const labelAksesibilitas =
    indeksAQI !== undefined
      ? `Cuaca ${kota}, suhu ${suhu} derajat, indeks kualitas udara ${indeksAQI}, kategori ${tingkatAQI}`
      : `Cuaca ${kota}, suhu ${suhu} derajat, kualitas udara ${tingkatAQI}`;

  return (
    <View
      accessible
      accessibilityLabel={labelAksesibilitas}
      style={{
        padding: spacing.sedang,
        borderRadius: 12,
        backgroundColor: warna.kartu,
        borderWidth: 1,
        borderColor: warna.garis,
        gap: 8,
      }}
    >
      {/* Nama kota dan suhu saat ini */}
      <Text
        style={{
          fontWeight: "bold",
          fontSize: typeScale.judul,
          color: warna.teks,
        }}
      >
        {kota}
      </Text>

      <Text style={{ fontSize: 36, fontWeight: "300", color: warna.teks }}>
        {suhu}°C
      </Text>

      {/* Status kualitas udara */}
      <Text
        style={{
          color: warnaPerTingkat[tingkatAQI],
          fontSize: typeScale.isi,
          fontWeight: "600",
        }}
      >
        {teksAQI}
      </Text>

      {/* Suhu maksimal dan minimal hari ini */}
      {(suhuMaksimal !== undefined || suhuMinimal !== undefined) && (
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={{ fontWeight: "600", color: warna.teks }}>
            Suhu hari ini
          </Text>

          {suhuMaksimal !== undefined && (
            <Text style={{ fontSize: 14, color: warna.teksSekunder }}>
              Maksimal: {suhuMaksimal}°C
            </Text>
          )}

          {suhuMinimal !== undefined && (
            <Text style={{ fontSize: 14, color: warna.teksSekunder }}>
              Minimal: {suhuMinimal}°C
            </Text>
          )}
        </View>
      )}

      {/* Informasi partikel polusi udara */}
      {(pm25 !== undefined || pm10 !== undefined) && (
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={{ fontWeight: "600", color: warna.teks }}>
            Partikel udara
          </Text>

          {pm25 !== undefined && (
            <Text style={{ fontSize: 12, color: warna.teksSekunder }}>
              PM2.5: {pm25} µg/m³
            </Text>
          )}

          {pm10 !== undefined && (
            <Text style={{ fontSize: 12, color: warna.teksSekunder }}>
              PM10: {pm10} µg/m³
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
