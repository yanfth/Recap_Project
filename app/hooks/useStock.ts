import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  addMenuItem,
  deleteMenuItem,
  editMenuItem,
  getMenuList,
  MenuItem,
} from "../store/menuStore";

export type Produk = {
  id: string;
  nama: string;
  harga: number;
  modal: number;
  stok: number;
  kategori: string;
};

const toMenuItem = (p: Produk): Omit<MenuItem, "id"> => ({
  namaMenu: p.nama,
  harga: String(p.harga),
  kategori: p.kategori,
  stok: p.stok,
});

const toProduk = (m: MenuItem): Produk => ({
  id: m.id,
  nama: m.namaMenu,
  harga: Number(m.harga),
  modal: 0,
  stok: m.stok ?? 0,
  kategori: m.kategori ?? "Makanan",
});

export function useStock() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await getMenuList();
    setProdukList(list.map(toProduk));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const tambahProduk = async (data: Omit<Produk, "id">) => {
    await addMenuItem(toMenuItem({ ...data, id: "" }));
    await reload();
  };

  const tambahStok = async (id: string, qty: number) => {
    const produk = produkList.find((p) => p.id === id);
    if (!produk) return;
    await editMenuItem(id, { stok: produk.stok + qty });
    await reload();
  };

  // ⬅️ BARU: edit nama, harga, kategori, atau stok produk
  const editProduk = async (
    id: string,
    data: Partial<Omit<Produk, "id" | "modal">>,
  ) => {
    const payload: Partial<MenuItem> = {};
    if (data.nama !== undefined) payload.namaMenu = data.nama;
    if (data.harga !== undefined) payload.harga = String(data.harga);
    if (data.kategori !== undefined) payload.kategori = data.kategori;
    if (data.stok !== undefined) payload.stok = data.stok;

    await editMenuItem(id, payload);
    await reload();
  };

  const hapusProduk = async (id: string) => {
    await deleteMenuItem(id);
    await reload();
  };

  return {
    produkList,
    loading,
    tambahProduk,
    tambahStok,
    editProduk, // ⬅️ BARU
    hapusProduk,
    reload,
  };
}
