import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typeScale } from "../../constants/styles";
import { useTema } from "../../context/ThemeContext";

export default function TabTentang() {
  const { warna } = useTema();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: warna.latar,
      }}
    >
      <View
        style={{
          flex: 1,
          padding: spacing.sedang,
          backgroundColor: warna.latar,
          gap: spacing.sedang,
        }}
      >
        <Text
          accessible
          accessibilityLabel="Judul halaman Tentang aplikasi Jelajah Aman"
          style={{
            fontSize: typeScale.judul,
            fontWeight: "bold",
            color: warna.teks,
          }}
        >
          Jelajah Aman
        </Text>

        <Text
          style={{
            fontSize: typeScale.isi,
            color: warna.teks,
          }}
        >
          Aplikasi informasi cuaca dan kualitas udara.
        </Text>

        <Text
          style={{
            fontSize: typeScale.isi,
            color: warna.teksSekunder,
          }}
        >
          Versi 1.0.0
        </Text>

        <Text
          style={{
            fontSize: typeScale.isi,
            color: warna.teksSekunder,
          }}
        >
          Dibuat oleh: Naafian Anugerah
        </Text>
      </View>
    </SafeAreaView>
  );
}
