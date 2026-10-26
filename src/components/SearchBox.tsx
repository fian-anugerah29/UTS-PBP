// src/components/SearchBox.tsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTema } from "../context/ThemeContext";

interface SearchBoxProps {
  onCari: (teks: string) => void;
}

export default function SearchBox({ onCari }: SearchBoxProps) {
  const { warna } = useTema();
  const [teks, setTeks] = useState("");

  function handleChange(nilaiBaru: string) {
    setTeks(nilaiBaru);
    onCari(nilaiBaru);
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: warna.kartu,
          borderColor: warna.garis,
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={warna.teksSekunder}
        style={styles.icon}
      />
      <TextInput
        placeholder="Cari nama kota..."
        placeholderTextColor={warna.teksSekunder}
        value={teks}
        onChangeText={handleChange}
        accessibilityLabel="Cari cuaca untuk kota yang dimasukkan"
        style={[
          styles.input,
          {
            color: warna.teks,
          },
        ]}
      />
      {teks.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={warna.teksSekunder}
          onPress={() => handleChange("")}
          style={styles.clearIcon}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
  },
  clearIcon: {
    marginLeft: 6,
  },
});
