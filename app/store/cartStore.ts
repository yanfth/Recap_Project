type CartItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
  qty: number;
};

let cartList: CartItem[] = [];

export const getCart = () => cartList;

export const addToCart = (item: Omit<CartItem, "qty">) => {
  const existing = cartList.find((c) => c.id === item.id);
  if (existing) {
    cartList = cartList.map((c) =>
      c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
    );
  } else {
    cartList = [...cartList, { ...item, qty: 1 }];
  }
};

export const removeFromCart = (id: string) => {
  cartList = cartList.filter((c) => c.id !== id);
};

export const clearCart = () => {
  cartList = [];
};

export const getTotalQty = () => cartList.reduce((sum, c) => sum + c.qty, 0);

export const getTotalHarga = () =>
  cartList.reduce((sum, c) => sum + parseInt(c.harga) * c.qty, 0);
