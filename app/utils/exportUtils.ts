import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { HistoryOrder } from "../store/historyStore";
import { loadKas } from "../store/kasStore";

export const handleExportExcel = async (
  historyList: HistoryOrder[],
  namaToko: string | string[] | undefined,
  fallbackTokoName: string = "Toko"
) => {
  if (historyList.length === 0) {
    if (Platform.OS !== "web") {
      Alert.alert("Info", "Tidak ada data riwayat transaksi untuk di-export.");
    }
    return;
  }

  try {
    const tokoStr = typeof namaToko === "string" ? namaToko : fallbackTokoName;
    const { modalAwal } = await loadKas();

    // 1. Prepare aoa data (Array of Arrays)
    const aoa: any[][] = [];

    // --- Header ---
    aoa.push(["Riwayat Pesanan - " + tokoStr]);
    aoa.push([]); // Empty row
    aoa.push(["Cashbox Awal", modalAwal]);
    aoa.push([]); // Empty row

    // --- Table Headers ---
    const headers = [
      "Nomor Struk",
      "Tanggal",
      "Jam",
      "Metode Bayar",
      "Uang Diterima",
      "Kembalian",
      "Nama Menu",
      "Kategori",
      "Harga Satuan",
      "Qty",
      "Subtotal"
    ];
    aoa.push(headers);

    let grandTotalBersih = 0;
    let totalUangMasuk = 0;
    let totalKembalian = 0;

    // --- Table Data ---
    historyList.forEach((order) => {
      grandTotalBersih += order.totalHarga;
      
      if (order.metodeBayar === "Cash" && order.uangDiterima !== undefined) {
        totalUangMasuk += order.uangDiterima;
      } else {
        totalUangMasuk += order.totalHarga;
      }

      if (order.metodeBayar === "Cash" && order.kembalian !== undefined) {
        totalKembalian += order.kembalian;
      }
      
      const tanggal = new Date(order.waktu);
      const tglStr = tanggal.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const jamStr = tanggal.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      order.items.forEach((item, index) => {
        const hargaNum =
          typeof item.harga === "number"
            ? item.harga
            : parseInt(String(item.harga), 10) || 0;
        
        // Show order-level details only on the first item of the order
        const isFirst = index === 0;

        aoa.push([
          order.nomorStruk,
          tglStr,
          jamStr,
          order.metodeBayar,
          isFirst && order.uangDiterima !== undefined ? order.uangDiterima : (isFirst ? 0 : ""),
          isFirst && order.kembalian !== undefined ? order.kembalian : (isFirst ? 0 : ""),
          item.namaMenu,
          item.kategori ?? "-",
          hargaNum,
          item.qty,
          hargaNum * item.qty
        ]);
      });
    });

    const saldoKasAkhir = modalAwal + totalUangMasuk - totalKembalian;

    // --- Total Row ---
    aoa.push(["", "", "", "", "", "", "", "", "", "Total Kotor", totalUangMasuk]);
    aoa.push(["", "", "", "", "", "", "", "", "", "Total Kembalian", totalKembalian]);
    aoa.push(["", "", "", "", "", "", "", "", "", "Total Bersih", grandTotalBersih]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Currency Formatting mapping
    // We want to format 'Cashbox Awal' value, and all monetary columns in the table.
    // 'Cashbox Awal' is at cell B3 (row 2, col 1 in 0-indexed aoa)
    // Table starts at row 5 (0-indexed 4).
    // Columns:
    // 4: Uang Diterima
    // 5: Kembalian
    // 8: Harga Satuan
    // 10: Subtotal

    const currencyFormat = '"Rp"#,##0';
    
    // Format B3
    const cellB3 = ws[XLSX.utils.encode_cell({ r: 2, c: 1 })];
    if (cellB3) cellB3.z = currencyFormat;

    // Format table columns
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:K1");
    for (let R = 5; R <= range.e.r; ++R) {
      const colsToFormat = [4, 5, 8, 10];
      for (const C of colsToFormat) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && typeof cell.v === 'number') {
          cell.z = currencyFormat;
        }
      }
    }

    ws["!cols"] = [
      { wch: 18 }, // Nomor Struk
      { wch: 20 }, // Tanggal
      { wch: 8 },  // Jam
      { wch: 14 }, // Metode Bayar
      { wch: 16 }, // Uang Diterima
      { wch: 14 }, // Kembalian
      { wch: 22 }, // Nama Menu
      { wch: 12 }, // Kategori
      { wch: 16 }, // Harga Satuan
      { wch: 6 },  // Qty
      { wch: 16 }, // Subtotal
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Pesanan");

    const fileName = `Riwayat_${tokoStr}_${Date.now()}.xlsx`;

    if (Platform.OS === "web") {
      XLSX.writeFile(wb, fileName);
    } else {
      if (!FileSystem) {
        Alert.alert("Error", "Modul FileSystem tidak tersedia di platform ini.");
        return;
      }
      const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const cacheDir = FileSystem.cacheDirectory ?? "";
      if (!cacheDir) {
        Alert.alert("Error", "cacheDirectory tidak tersedia.");
        return;
      }
      const filePath = `${cacheDir}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Tidak Tersedia", "Fitur share tidak tersedia di perangkat ini.");
        return;
      }
      await Sharing.shareAsync(filePath, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: `Ekspor Riwayat - ${tokoStr}`,
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (e: any) {
    console.error(e);
    if (Platform.OS !== "web") {
      Alert.alert("Export Gagal", e?.message ?? "Terjadi kesalahan saat export.");
    } else {
      alert("Export Gagal: " + (e?.message ?? "Terjadi kesalahan saat export."));
    }
  }
};
