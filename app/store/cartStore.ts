import AsyncStorage from "@react-native-async-storage/async-storage";

const MENU_KEY = "menu_list";

export type CartItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
  qty: number;
  stok: number; // 🌟 Tambahkan properti stok
};

let cartList: CartItem[] = [];

export const getCart = () => cartList;

export const addToCart = (item: Omit<CartItem, "qty">): "ok" | "stok_habis" | "stok_tidak_cukup" => {
  const existing = cartList.find((c) => c.id === item.id);

  if (existing) {
    // Cek apakah qty di cart sudah melebihi stok
    if (existing.qty >= item.stok) {
      return "stok_tidak_cukup";
    }
    cartList = cartList.map((c) =>
      c.id === item.id ? { ...c, qty: c.qty + 1 } : c
    );
  } else {
    if (item.stok <= 0) {
      return "stok_habis";
    }
    cartList = [...cartList, { ...item, qty: 1 }];
  }

  return "ok";
};

export const removeFromCart = (id: string) => {
  cartList = cartList.filter((c) => c.id !== id);
};

export const decreaseCartQty = (id: string) => {
  const existing = cartList.find((c) => c.id === id);
  if (existing) {
    if (existing.qty > 1) {
      cartList = cartList.map((c) =>
        c.id === id ? { ...c, qty: c.qty - 1 } : c
      );
    } else {
      removeFromCart(id);
    }
  }
};

export const clearCart = () => {
  cartList = [];
};

export const getTotalQty = () => cartList.reduce((sum, c) => sum + c.qty, 0);

export const getTotalHarga = () =>
  cartList.reduce((sum, c) => sum + parseInt(c.harga) * c.qty, 0);

// 🌟 FUNGSI BARU: Dipanggil saat Checkout / Bayar Berhasil di halaman Cart
export const checkoutCart = async (): Promise<boolean> => {
  try {
    // 1. Ambil data menu saat ini dari AsyncStorage
    const data = await AsyncStorage.getItem(MENU_KEY);
    const currentMenu = data ? JSON.parse(data) : [];

    // 2. Kurangi stok menu berdasarkan item yang dibeli di keranjang
    const updatedMenu = currentMenu.map((menuItem: any) => {
      const cartItem = cartList.find((c) => c.id === menuItem.id);
      if (cartItem) {
        // Kurangi stok asli dengan qty belanjaan kasir (pastikan tidak minus)
        const sisaStok = Math.max(0, (menuItem.stok ?? 0) - cartItem.qty);
        return { ...menuItem, stok: sisaStok };
      }
      return menuItem;
    });

    // 3. Simpan kembali data menu terupdate ke AsyncStorage
    await AsyncStorage.setItem(MENU_KEY, JSON.stringify(updatedMenu));

    // 4. Kosongkan keranjang belanja kasir karena transaksi sukses
    clearCart();
    return true;
  } catch (error) {
    console.error("Gagal melakukan checkout:", error);
    return false;
  }
};