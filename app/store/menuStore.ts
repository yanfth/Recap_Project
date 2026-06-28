import AsyncStorage from "@react-native-async-storage/async-storage";

const MENU_KEY = "menu_list";

export type MenuItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
  stok: number; // 🌟 Tambahkan properti stok agar di-manage oleh Owner
};

// Ambil menu dari AsyncStorage
export const getMenuList = async (): Promise<MenuItem[]> => {
  try {
    const data = await AsyncStorage.getItem(MENU_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Tambah menu baru
export const addMenuItem = async (
  item: Omit<MenuItem, "id">
): Promise<MenuItem> => {
  const list = await getMenuList();
  const newItem: MenuItem = { id: Date.now().toString(), ...item };
  await AsyncStorage.setItem(MENU_KEY, JSON.stringify([...list, newItem]));
  return newItem;
};

// Edit menu
export const editMenuItem = async (
  id: string,
  updates: Partial<Omit<MenuItem, "id">>
): Promise<void> => {
  const list = await getMenuList();
  const updated = list.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  await AsyncStorage.setItem(MENU_KEY, JSON.stringify(updated));
};

// Hapus menu
export const deleteMenuItem = async (id: string): Promise<void> => {
  const list = await getMenuList();
  const filtered = list.filter((item) => item.id !== id);
  await AsyncStorage.setItem(MENU_KEY, JSON.stringify(filtered));
};

export default {};