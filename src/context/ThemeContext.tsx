import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

export type PilihanTema = "terang" | "gelap" | "sistem";

const KUNCI_TEMA = "@jelajah_aman:tema";

type ThemeContextType = {
  pilihanTema: PilihanTema;
  temaAktif: "terang" | "gelap";
  ubahTema: (tema: PilihanTema) => Promise<void>;
  warna: {
    latar: string;
    kartu: string;
    teks: string;
    teksSekunder: string;
    garis: string;
    primer: string;
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const skemaPerangkat = useColorScheme();
  const [pilihanTema, setPilihanTema] = useState<PilihanTema>("sistem");

  useEffect(() => {
    let masihAktif = true;

    async function muatTema() {
      try {
        const tersimpan = await AsyncStorage.getItem(KUNCI_TEMA);

        if (
          masihAktif &&
          (tersimpan === "terang" ||
            tersimpan === "gelap" ||
            tersimpan === "sistem")
        ) {
          setPilihanTema(tersimpan);
        }
      } catch (error) {
        console.error("Gagal memuat pilihan tema:", error);
      }
    }

    void muatTema();

    return () => {
      masihAktif = false;
    };
  }, []);

  const ubahTema = useCallback(async (tema: PilihanTema) => {
    setPilihanTema(tema);

    try {
      await AsyncStorage.setItem(KUNCI_TEMA, tema);
    } catch (error) {
      console.error("Gagal menyimpan pilihan tema:", error);
    }
  }, []);

  const temaAktif: "terang" | "gelap" =
    pilihanTema === "sistem"
      ? skemaPerangkat === "dark"
        ? "gelap"
        : "terang"
      : pilihanTema;

  const warna = useMemo(
    () =>
      temaAktif === "gelap"
        ? {
            latar: "#121212",
            kartu: "#1E1E1E",
            teks: "#FFFFFF",
            teksSekunder: "#BDBDBD",
            garis: "#444444",
            primer: "#90CAF9",
          }
        : {
            latar: "#FFFFFF",
            kartu: "#F4F7FA",
            teks: "#202124",
            teksSekunder: "#666666",
            garis: "#DDDDDD",
            primer: "#1976D2",
          },
    [temaAktif],
  );

  const nilai = useMemo(
    () => ({ pilihanTema, temaAktif, ubahTema, warna }),
    [pilihanTema, temaAktif, ubahTema, warna],
  );

  return (
    <ThemeContext.Provider value={nilai}>{children}</ThemeContext.Provider>
  );
}

export function useTema() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTema harus digunakan di dalam ThemeProvider");
  }

  return context;
}
