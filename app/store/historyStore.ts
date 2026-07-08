import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "history_list";

export type HistoryItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
  qty: number;
};

export type HistoryOrder = {
  nomorStruk: string;
  namaToko: string;
  items: HistoryItem[];
  totalHarga: number;
  metodeBayar: string;
  waktu: string; // ISO string
};

// Ambil semua history dari AsyncStorage
export const getHistory = async (): Promise<HistoryOrder[]> => {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Tambah transaksi baru (newest first)
export const addToHistory = async (order: HistoryOrder): Promise<void> => {
  try {
    const current = await getHistory();
    const updated = [order, ...current];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Gagal menyimpan history:", error);
  }
};

// Hapus semua history
export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Gagal menghapus history:", error);
  }
};
