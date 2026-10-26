// src/app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../../context/ThemeContext";

export default function TabLayout() {
  const { warna, temaAktif } = useTema();
  const insets = useSafeAreaInsets();
  const isGelap = temaAktif === "gelap";

  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;
  const tinggiTabBar = 62 + bottomInset;

  return (
    <>
      {/* Mengatur warna ikon status bar (jam, baterai, sinyal) */}
      <StatusBar style={isGelap ? "light" : "dark"} />

      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarAllowFontScaling: false,
          tabBarHideOnKeyboard: true,

          // 1. Tampilan Header Atas yang Rapi & Bersih
          headerStyle: {
            backgroundColor: warna.latar,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: warna.teks,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "700",
            color: warna.teks,
          },
          headerShadowVisible: false,

          // 2. Tampilan Bottom Tab Bar Bersih, Proporsional & Tidak Terpotong
          tabBarStyle: {
            backgroundColor: warna.latar,
            borderTopColor: warna.garis,
            borderTopWidth: 1,
            height: tinggiTabBar,
            paddingBottom: bottomInset,
            elevation: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isGelap ? 0.25 : 0.05,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
          tabBarActiveTintColor: warna.primer,
          tabBarInactiveTintColor: warna.teksSekunder,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Beranda",
            tabBarLabel: "Beranda",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={23}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="riwayat"
          options={{
            title: "Riwayat",
            tabBarLabel: "Riwayat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={23}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="pengaturan"
          options={{
            title: "Pengaturan",
            tabBarLabel: "Pengaturan",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={23}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="tentang"
          options={{
            title: "Tentang",
            tabBarLabel: "Tentang",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={
                  focused ? "information-circle" : "information-circle-outline"
                }
                size={23}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
