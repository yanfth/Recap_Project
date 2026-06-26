import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export interface Product {
  id: string;
  nama: string;
  harga: number;
  modal: number;
  stok: number;
  kategori?: string;
}

export interface RiwayatTransaksi {
  id: string;
  produkId: string;
  namaProduk: string;
  jumlah: number;
  totalHarga: number;
  waktu: string;
}

const KEY_PRODUK = "produk_list";
const KEY_RIWAYAT = "riwayat_transaksi";

export function useStock() {
  const [produkList, setProdukList] = useState<Product[]>([]);
  const [riwayatList, setRiwayatList] = useState<RiwayatTransaksi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [rawProduk, rawRiwayat] = await Promise.all([
      AsyncStorage.getItem(KEY_PRODUK),
      AsyncStorage.getItem(KEY_RIWAYAT),
    ]);
    if (rawProduk) setProdukList(JSON.parse(rawProduk));
    if (rawRiwayat) setRiwayatList(JSON.parse(rawRiwayat));
    setLoading(false);
  };

  const saveProduk = async (list: Product[]) => {
    await AsyncStorage.setItem(KEY_PRODUK, JSON.stringify(list));
    setProdukList(list);
  };

  const saveRiwayat = async (list: RiwayatTransaksi[]) => {
    await AsyncStorage.setItem(KEY_RIWAYAT, JSON.stringify(list));
    setRiwayatList(list);
  };

  const tambahProduk = async (produk: Omit<Product, "id">) => {
    const newProduk: Product = { ...produk, id: Date.now().toString() };
    await saveProduk([...produkList, newProduk]);
  };

  const tambahStok = async (id: string, jumlah: number) => {
    if (jumlah <= 0) throw new Error("Jumlah stok harus lebih dari 0");
    const updated = produkList.map((p) =>
      p.id === id ? { ...p, stok: p.stok + jumlah } : p,
    );
    await saveProduk(updated);
  };

  const editModal = async (id: string, modalBaru: number) => {
    if (modalBaru < 0) throw new Error("Harga modal tidak boleh negatif");
    const updated = produkList.map((p) =>
      p.id === id ? { ...p, modal: modalBaru } : p,
    );
    await saveProduk(updated);
  };

  const editProduk = async (id: string, data: Partial<Omit<Product, "id">>) => {
    const updated = produkList.map((p) =>
      p.id === id ? { ...p, ...data } : p,
    );
    await saveProduk(updated);
  };

  const hapusProduk = async (id: string) => {
    await saveProduk(produkList.filter((p) => p.id !== id));
  };

  const transaksi = async (
    id: string,
    jumlah: number = 1,
  ): Promise<"ok" | "stok_habis" | "tidak_ditemukan"> => {
    const produk = produkList.find((p) => p.id === id);
    if (!produk) return "tidak_ditemukan";
    if (produk.stok < jumlah) return "stok_habis";

    const updatedProduk = produkList.map((p) =>
      p.id === id ? { ...p, stok: p.stok - jumlah } : p,
    );
    await saveProduk(updatedProduk);

    const newRiwayat: RiwayatTransaksi = {
      id: Date.now().toString(),
      produkId: id,
      namaProduk: produk.nama,
      jumlah,
      totalHarga: produk.harga * jumlah,
      waktu: new Date().toISOString(),
    };
    await saveRiwayat([newRiwayat, ...riwayatList]);
    return "ok";
  };

  return {
    produkList,
    riwayatList,
    loading,
    reload: load,
    tambahProduk,
    tambahStok,
    editModal,
    editProduk,
    hapusProduk,
    transaksi,
  };
}
