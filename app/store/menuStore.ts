type MenuItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
};

// Variabel global, tidak reset selama app berjalan
let menuList: MenuItem[] = [];

export const getMenuList = () => menuList;

export const addMenuItem = (item: Omit<MenuItem, "id">) => {
  const newItem: MenuItem = {
    id: Date.now().toString(),
    ...item,
  };
  menuList = [...menuList, newItem];
  return newItem;
};
