import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTema } from "../../context/ThemeContext";
import {
  ambilSemuaFavorit,
  hapusFavorit,
} from "../../services/favoritStorages";
import {
  ambilRiwayatPencarian,
  hapusCacheKota,
  hapusRiwayatPencarian,
} from "../../services/offlineCache";

import type { KotaFavorit } from "../../../types/favorit";
import type { HasilGeocoding } from "../../../types/geocoding";

export default function HalamanRiwayat() {
  const { warna } = useTema();

  const [tabAktif, setTabAktif] = useState<"riwayat" | "favorit">("riwayat");
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [daftarRiwayat, setDaftarRiwayat] = useState<HasilGeocoding[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);

  // Muat ulang riwayat pencarian dan favorit saat halaman dibuka.
  useFocusEffect(
    useCallback(() => {
      let masihAktif = true;

      async function muatData() {
        try {
          setSedangMemuat(true);

          const [favorit, riwayat] = await Promise.all([
            ambilSemuaFavorit(),
            ambilRiwayatPencarian(),
          ]);

          if (masihAktif) {
            setDaftarFavorit(favorit);
            setDaftarRiwayat(riwayat);
          }
        } catch (error) {
          console.error("Gagal memuat riwayat:", error);

          if (masihAktif) {
            Alert.alert(
              "Gagal",
              "Riwayat pencarian atau kota favorit tidak dapat dimuat.",
            );
          }
        } finally {
          if (masihAktif) {
            setSedangMemuat(false);
          }
        }
      }

      void muatData();

      return () => {
        masihAktif = false;
      };
    }, []),
  );

  // Hapus cache cuaca untuk koordinat kota.
  function konfirmasiHapusCache(
    latitude: number,
    longitude: number,
    nama: string,
  ) {
    Alert.alert(
      "Hapus Cache Kota",
      `Hapus cache cuaca untuk ${nama} dari perangkat?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Cache",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await hapusCacheKota(latitude, longitude);

                Alert.alert(
                  "Berhasil",
                  `Cache cuaca ${nama} berhasil dihapus.`,
                );
              } catch (error) {
                console.error("Gagal menghapus cache:", error);
                Alert.alert("Gagal", `Cache ${nama} gagal dihapus.`);
              }
            })();
          },
        },
      ],
    );
  }

  // Hapus kota dari riwayat pencarian.
  function konfirmasiHapusRiwayat(kota: HasilGeocoding) {
    Alert.alert("Hapus Riwayat", `Hapus ${kota.name} dari riwayat pencarian?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await hapusRiwayatPencarian(kota.latitude, kota.longitude);

              setDaftarRiwayat((sebelumnya) =>
                sebelumnya.filter(
                  (item) =>
                    item.latitude !== kota.latitude ||
                    item.longitude !== kota.longitude,
                ),
              );
            } catch (error) {
              console.error("Gagal menghapus riwayat:", error);
              Alert.alert("Gagal", "Riwayat tidak berhasil dihapus.");
            }
          })();
        },
      },
    ]);
  }

  // Hapus kota dari daftar favorit saja.
  function konfirmasiHapusFavorit(kota: KotaFavorit) {
    Alert.alert(
      "Hapus Kota Favorit",
      `Hapus ${kota.nama} dari daftar favorit? Cache cuacanya tidak ikut dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Favorit",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await hapusFavorit(kota.id);

                setDaftarFavorit((sebelumnya) =>
                  sebelumnya.filter((item) => item.id !== kota.id),
                );
              } catch (error) {
                console.error("Gagal menghapus favorit:", error);
                Alert.alert("Gagal", "Kota favorit gagal dihapus.");
              }
            })();
          },
        },
      ],
    );
  }

  // Buka Beranda dengan membawa kota yang dipilih.
  function bukaKota(kota: HasilGeocoding) {
    router.navigate({
      pathname: "/",
      params: {
        kotaId: String(kota.id ?? ""),
        namaKota: kota.name,
        latitude: String(kota.latitude),
        longitude: String(kota.longitude),
        negara: kota.country ?? "",
        wilayah: kota.admin1 ?? "",
      },
    });
  }

  // Buka Beranda dari item kota favorit.
  function bukaKotaFavorit(kota: KotaFavorit) {
    bukaKota({
      id: kota.id,
      name: kota.nama,
      latitude: kota.latitude,
      longitude: kota.longitude,
      country: "",
      admin1: "",
    });
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: warna.latar,
        },
      ]}
    >
      {/* 1. SEGMENTED CONTROL / TAB SWITCHER */}
      <View style={styles.topBar}>
        <View
          style={[
            styles.segmentContainer,
            {
              backgroundColor: warna.kartu,
              borderColor: warna.garis,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentButton,
              tabAktif === "riwayat" && {
                backgroundColor: warna.primer,
              },
            ]}
            onPress={() => setTabAktif("riwayat")}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: tabAktif === "riwayat" }}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={tabAktif === "riwayat" ? "#FFFFFF" : warna.teksSekunder}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    tabAktif === "riwayat" ? "#FFFFFF" : warna.teksSekunder,
                  fontWeight: tabAktif === "riwayat" ? "700" : "500",
                },
              ]}
            >
              Riwayat ({daftarRiwayat.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              tabAktif === "favorit" && {
                backgroundColor: warna.primer,
              },
            ]}
            onPress={() => setTabAktif("favorit")}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: tabAktif === "favorit" }}
          >
            <Ionicons
              name="heart-outline"
              size={18}
              color={tabAktif === "favorit" ? "#FFFFFF" : warna.teksSekunder}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    tabAktif === "favorit" ? "#FFFFFF" : warna.teksSekunder,
                  fontWeight: tabAktif === "favorit" ? "700" : "500",
                },
              ]}
            >
              Favorit ({daftarFavorit.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. KONTEN DAFTAR SESUAI TAB AKTIF */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          (sedangMemuat ||
            (tabAktif === "riwayat" && daftarRiwayat.length === 0) ||
            (tabAktif === "favorit" && daftarFavorit.length === 0)) &&
            styles.scrollContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sedangMemuat ? (
          /* INDIKATOR PEMUATAN */
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={warna.primer} />
            <Text style={[styles.statusText, { color: warna.teksSekunder }]}>
              Memuat data...
            </Text>
          </View>
        ) : tabAktif === "riwayat" ? (
          /* TAB RIWAYAT PENCARIAN */
          daftarRiwayat.length === 0 ? (
            <View style={styles.centerContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: warna.kartu, borderColor: warna.garis },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={44}
                  color={warna.teksSekunder}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: warna.teks }]}>
                Belum Ada Riwayat
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: warna.teksSekunder }]}
              >
                Pencarian kota dari halaman Beranda akan tersimpan secara
                otomatis di sini (maksimal 10 kota).
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.headerInfo}>
                <Text style={[styles.headerTitle, { color: warna.teks }]}>
                  Riwayat Pencarian
                </Text>
                <Text
                  style={[styles.headerSubtitle, { color: warna.teksSekunder }]}
                >
                  Maksimal 10 kota terakhir yang pernah Anda cari.
                </Text>
              </View>

              {daftarRiwayat.map((kota) => (
                <View
                  key={`${kota.latitude}_${kota.longitude}`}
                  style={[
                    styles.card,
                    {
                      backgroundColor: warna.kartu,
                      borderColor: warna.garis,
                    },
                  ]}
                >
                  {/* Header Kartu: Ketuk untuk melihat cuaca */}
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => bukaKota(kota)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${warna.primer}1A` },
                      ]}
                    >
                      <Ionicons
                        name="location-sharp"
                        size={20}
                        color={warna.primer}
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text
                        style={[styles.namaKota, { color: warna.teks }]}
                        numberOfLines={1}
                      >
                        {kota.name}
                      </Text>
                      <Text
                        style={[
                          styles.subteksKota,
                          { color: warna.teksSekunder },
                        ]}
                        numberOfLines={1}
                      >
                        {[kota.admin1, kota.country]
                          .filter(Boolean)
                          .join(", ") || "Koordinat tersimpan"}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={warna.teksSekunder}
                    />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.cardDivider,
                      { backgroundColor: warna.garis },
                    ]}
                  />

                  {/* Tombol Aksi Horizontal (Chip Buttons) */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.chipButton,
                        {
                          backgroundColor: `${warna.primer}15`,
                          borderColor: warna.primer,
                        },
                      ]}
                      onPress={() => bukaKota(kota)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="eye-outline"
                        size={14}
                        color={warna.primer}
                      />
                      <Text style={[styles.chipText, { color: warna.primer }]}>
                        Buka
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.chipButton,
                        {
                          backgroundColor: "#D9770615",
                          borderColor: "#D97706",
                        },
                      ]}
                      onPress={() =>
                        konfirmasiHapusCache(
                          kota.latitude,
                          kota.longitude,
                          kota.name,
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={14}
                        color="#D97706"
                      />
                      <Text style={[styles.chipText, { color: "#D97706" }]}>
                        Hapus Cache
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.chipButton,
                        {
                          backgroundColor: "#EF444415",
                          borderColor: "#EF4444",
                        },
                      ]}
                      onPress={() => konfirmasiHapusRiwayat(kota)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color="#EF4444"
                      />
                      <Text style={[styles.chipText, { color: "#EF4444" }]}>
                        Hapus
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )
        ) : /* TAB KOTA FAVORIT */
        daftarFavorit.length === 0 ? (
          <View style={styles.centerContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: warna.kartu, borderColor: warna.garis },
              ]}
            >
              <Ionicons
                name="heart-outline"
                size={44}
                color={warna.teksSekunder}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: warna.teks }]}>
              Belum Ada Favorit
            </Text>
            <Text style={[styles.emptySubtitle, { color: warna.teksSekunder }]}>
              Tandai kota favorit Anda dari halaman Beranda untuk memantau cuaca
              dengan cepat.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: warna.teks }]}>
                Kota Favorit
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: warna.teksSekunder }]}
              >
                Tersimpan {daftarFavorit.length} kota favorit pada perangkat
                ini.
              </Text>
            </View>

            {daftarFavorit.map((kota) => (
              <View
                key={kota.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: warna.kartu,
                    borderColor: warna.garis,
                  },
                ]}
              >
                {/* Header Kartu: Ketuk untuk melihat cuaca */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => bukaKotaFavorit(kota)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.iconBadge, { backgroundColor: "#EF44441A" }]}
                  >
                    <Ionicons name="heart" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text
                      style={[styles.namaKota, { color: warna.teks }]}
                      numberOfLines={1}
                    >
                      {kota.nama}
                    </Text>
                    <Text
                      style={[
                        styles.subteksKota,
                        { color: warna.teksSekunder },
                      ]}
                      numberOfLines={1}
                    >
                      Kota Favorit Tersimpan
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={warna.teksSekunder}
                  />
                </TouchableOpacity>

                <View
                  style={[styles.cardDivider, { backgroundColor: warna.garis }]}
                />

                {/* Tombol Aksi Horizontal (Chip Buttons) */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.chipButton,
                      {
                        backgroundColor: `${warna.primer}15`,
                        borderColor: warna.primer,
                      },
                    ]}
                    onPress={() => bukaKotaFavorit(kota)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={14}
                      color={warna.primer}
                    />
                    <Text style={[styles.chipText, { color: warna.primer }]}>
                      Buka
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.chipButton,
                      {
                        backgroundColor: "#D9770615",
                        borderColor: "#D97706",
                      },
                    ]}
                    onPress={() =>
                      konfirmasiHapusCache(
                        kota.latitude,
                        kota.longitude,
                        kota.nama,
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={14}
                      color="#D97706"
                    />
                    <Text style={[styles.chipText, { color: "#D97706" }]}>
                      Hapus Cache
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.chipButton,
                      {
                        backgroundColor: "#EF444415",
                        borderColor: "#EF4444",
                      },
                    ]}
                    onPress={() => konfirmasiHapusFavorit(kota)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={[styles.chipText, { color: "#EF4444" }]}>
                      Hapus
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  segmentContainer: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentText: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  headerInfo: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  namaKota: {
    fontSize: 16,
    fontWeight: "700",
  },
  subteksKota: {
    fontSize: 13,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  chipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
