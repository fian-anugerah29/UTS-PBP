import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTema, type PilihanTema } from "../../context/ThemeContext";

const PILIHAN: { label: string; nilai: PilihanTema }[] = [
  { label: "Terang", nilai: "terang" },
  { label: "Gelap", nilai: "gelap" },
  { label: "Ikuti Sistem", nilai: "sistem" },
];

export default function HalamanPengaturan() {
  const { pilihanTema, temaAktif, ubahTema, warna } = useTema();
  const [menyimpan, setMenyimpan] = useState(false);

  async function pilihTema(tema: PilihanTema) {
    setMenyimpan(true);

    try {
      await ubahTema(tema);
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: warna.latar }}>
      <View style={{ padding: 20, gap: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: warna.teks,
          }}
        >
          Pengaturan
        </Text>

        <Text style={{ color: warna.teks }}>Pilih Tema Aplikasi</Text>

        {PILIHAN.map((item) => {
          const terpilih = pilihanTema === item.nilai;

          return (
            <TouchableOpacity
              key={item.nilai}
              accessibilityRole="radio"
              accessibilityState={{ checked: terpilih }}
              onPress={() => void pilihTema(item.nilai)}
              disabled={menyimpan}
              style={{
                padding: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: terpilih ? warna.primer : warna.garis,
                backgroundColor: warna.kartu,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: warna.teks,
                  fontSize: 16,
                }}
              >
                {item.label}
              </Text>

              <Text
                style={{
                  color: warna.primer,
                  fontWeight: "bold",
                }}
              >
                {terpilih ? "✓ Dipilih" : ""}
              </Text>
            </TouchableOpacity>
          );
        })}

        {menyimpan && <ActivityIndicator color={warna.primer} />}

        <Text style={{ color: warna.teksSekunder }}>
          Tema aktif: {temaAktif === "gelap" ? "Gelap" : "Terang"}
        </Text>
      </View>
    </SafeAreaView>
  );
}
