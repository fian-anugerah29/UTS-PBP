// src/app/detail/[kota].tsx
import { View, Button } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import WeatherCard from "../../components/WeatherCard";
import { useTema } from "../../context/ThemeContext";

export default function HalamanDetail() {
  const { warna } = useTema();
  const { kota } = useLocalSearchParams<{ kota: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: warna.latar, padding: 16, gap: 16 }}>
      <WeatherCard kota={kota} suhu={29} tingkatAQI="BAIK" />
      <Button
        title="Tambahkan ke Favorit"
        onPress={() => router.push("../tambah-favorit")}
      />
    </View>
  );
}
