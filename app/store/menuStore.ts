// menuStore.ts — sudah digantikan oleh useStock (hooks/useStock.ts)
// Dipertahankan agar tidak ada error missing default export

type MenuItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
};

let menuList: MenuItem[] = [];

export const getMenuList = () => [...menuList];

export const addMenuItem = (item: Omit<MenuItem, "id">) => {
  const newItem: MenuItem = {
    id: Date.now().toString(),
    ...item,
  };
  menuList = [...menuList, newItem];
  return newItem;
};

export const editMenuItem = (
  id: string,
  updates: Partial<Omit<MenuItem, "id">>,
) => {
  menuList = menuList.map((item) =>
    item.id === id ? { ...item, ...updates } : item,
  );
};

export const deleteMenuItem = (id: string) => {
  menuList = menuList.filter((item) => item.id !== id);
};

export default {};
