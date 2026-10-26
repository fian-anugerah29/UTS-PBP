// src/app/_layout.tsx

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTema } from "../context/ThemeContext";

function RootLayoutNav() {
  const { warna, temaAktif } = useTema();
  const isGelap = temaAktif === "gelap";

  return (
    <>
      <StatusBar style={isGelap ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: warna.latar,
          },
          headerTintColor: warna.teks,
          contentStyle: {
            backgroundColor: warna.latar,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
