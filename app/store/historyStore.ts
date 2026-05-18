// store/historyStore.ts

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

// In-memory store (persists during app session)
let historyList: HistoryOrder[] = [];

export const addToHistory = (order: HistoryOrder): void => {
  // Newest first
  historyList = [order, ...historyList];
};

export const getHistory = (): HistoryOrder[] => {
  return historyList;
};

export const clearHistory = (): void => {
  historyList = [];
};
