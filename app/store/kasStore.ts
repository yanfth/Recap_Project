// store/kasStore.ts
// Persists cashbox (modal awal) to AsyncStorage so data survives app restarts.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KAS_KEY = "kasir_modal_awal";
const KAS_SAVED_KEY = "kasir_modal_disimpan";

export const loadKas = async (): Promise<{
  modalAwal: number;
  kasDisimpan: boolean;
}> => {
  try {
    const [modalStr, savedStr] = await Promise.all([
      AsyncStorage.getItem(KAS_KEY),
      AsyncStorage.getItem(KAS_SAVED_KEY),
    ]);
    return {
      modalAwal: modalStr ? parseInt(modalStr, 10) : 0,
      kasDisimpan: savedStr === "true",
    };
  } catch {
    return { modalAwal: 0, kasDisimpan: false };
  }
};

export const saveKas = async (modalAwal: number): Promise<void> => {
  await Promise.all([
    AsyncStorage.setItem(KAS_KEY, String(modalAwal)),
    AsyncStorage.setItem(KAS_SAVED_KEY, "true"),
  ]);
};

export const resetKas = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(KAS_KEY),
    AsyncStorage.removeItem(KAS_SAVED_KEY),
  ]);
};
