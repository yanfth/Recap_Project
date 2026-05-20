type MenuItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
};

// Variabel global, tidak reset selama app berjalan
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
