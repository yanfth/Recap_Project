// store/kasStore.ts
// Persists cashbox (modal awal) to AsyncStorage.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KAS_KEY = "kasir_modal_awal";
const KAS_SAVED_KEY = "kasir_modal_disimpan";

// Batas wajar untuk modal awal (10 miliar)
const MAX_MODAL = 10_000_000_000;

export const loadKas = async (): Promise<{
  modalAwal: number;
  kasDisimpan: boolean;
}> => {
  try {
    const [modalStr, savedStr] = await Promise.all([
      AsyncStorage.getItem(KAS_KEY),
      AsyncStorage.getItem(KAS_SAVED_KEY),
    ]);

    // Hanya return nilai valid jika savedStr === "true"
    if (savedStr !== "true") {
      return { modalAwal: 0, kasDisimpan: false };
    }

    const parsed = modalStr ? Number(modalStr) : 0;

    // Validasi: harus angka valid, tidak negatif, dan dalam batas wajar
    if (isNaN(parsed) || parsed < 0 || parsed > MAX_MODAL) {
      // Data corrupt — reset otomatis
      await resetKas();
      return { modalAwal: 0, kasDisimpan: false };
    }

    return { modalAwal: parsed, kasDisimpan: true };
  } catch {
    return { modalAwal: 0, kasDisimpan: false };
  }
};

export const saveKas = async (modalAwal: number): Promise<void> => {
  await AsyncStorage.setItem(KAS_KEY, String(Math.floor(modalAwal)));
  await AsyncStorage.setItem(KAS_SAVED_KEY, "true");
};

export const resetKas = async (): Promise<void> => {
  // Set ke nilai kosong eksplisit (lebih reliable daripada removeItem di web)
  await AsyncStorage.setItem(KAS_KEY, "0");
  await AsyncStorage.setItem(KAS_SAVED_KEY, "false");
};
