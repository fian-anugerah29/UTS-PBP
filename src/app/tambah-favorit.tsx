import { View, Text, Button } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { tambahFavorit } from "../services/favoritStorages";
import { useTema } from "../context/ThemeContext";

export default function ModalTambahFavorit() {
  const { warna } = useTema();
  const { id, nama, lat, lon } = useLocalSearchParams<{
    id: string;
    nama: string;
    lat: string;
    lon: string;
  }>();

  async function simpan() {
    await tambahFavorit({
      id: Number(id),
      nama,
      latitude: Number(lat),
      longitude: Number(lon),
    });
    router.back();
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: warna.latar,
        padding: 24,
        gap: 20,
      }}
    >
      <Text style={{ color: warna.teks, fontSize: 18, fontWeight: "600" }}>
        Tambahkan {nama} ke daftar favorit?
      </Text>
      <Button title="Simpan ke Favorit" onPress={simpan} />
    </View>
  );
}
