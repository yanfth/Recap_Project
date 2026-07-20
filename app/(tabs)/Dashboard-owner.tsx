import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";
import { clearHistory, getHistory, HistoryOrder } from "../store/historyStore";
import {

  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Produk, useStock } from "../hooks/useStock";

export default function DashboardOwnerScreen() {
  const router = useRouter();
  const { namaToko } = useLocalSearchParams();
  const auth = useAuth();
  const { produkList, loading, editProduk, hapusProduk } = useStock();
  const [historyList, setHistoryList] = useState<HistoryOrder[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      getHistory().then((data) => setHistoryList(data));
    }, [])
  );

  // ── State untuk popup titik tiga (pilihan Edit/Hapus) ──
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // ── State untuk modal Edit ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editHarga, setEditHarga] = useState("");
  const [editStok, setEditStok] = useState("");

  // ── State untuk modal Konfirmasi Hapus ──
  const [produkToDelete, setProdukToDelete] = useState<Produk | null>(null);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    auth?.logout();
    router.replace("/login");
  };

  const openActionSheet = (produk: Produk) => {
    setSelectedProduk(produk);
    setShowActionSheet(true);
  };

  const closeActionSheet = () => {
    setShowActionSheet(false);
    setSelectedProduk(null);
  };

  const handlePilihEdit = () => {
    if (!selectedProduk) return;
    setEditNama(selectedProduk.nama);
    setEditHarga(String(selectedProduk.harga));
    setEditStok(String(selectedProduk.stok));
    setShowActionSheet(false);
    setShowEditModal(true);
  };

  const handlePilihHapus = () => {
    if (!selectedProduk) return;
    setProdukToDelete(selectedProduk);
    setShowActionSheet(false);
    setSelectedProduk(null);
  };

  const confirmHapus = async () => {
    if (!produkToDelete) return;
    await hapusProduk(produkToDelete.id);
    setProdukToDelete(null);
  };

  const handleSimpanEdit = async () => {
    if (!selectedProduk) return;
    const hargaNum = Number(editHarga);
    const stokNum = Number(editStok);

    if (!editNama.trim()) {
      Alert.alert("Nama Kosong", "Nama produk tidak boleh kosong.");
      return;
    }
    if (isNaN(hargaNum) || hargaNum < 0) {
      Alert.alert("Harga Tidak Valid", "Masukkan harga yang benar.");
      return;
    }
    if (isNaN(stokNum) || stokNum < 0) {
      Alert.alert("Stok Tidak Valid", "Masukkan stok yang benar.");
      return;
    }

    await editProduk(selectedProduk.id, {
      nama: editNama.trim(),
      harga: hargaNum,
      stok: stokNum,
    });

    setShowEditModal(false);
    setSelectedProduk(null);
  };

  // ─── Export & Clear ─────────────────────────────────────────────────────────
  const buildTableData = () => {
    const tableData: Record<string, string | number>[] = [];
    historyList.forEach((order) => {
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
      order.items.forEach((item) => {
        const hargaNum =
          typeof item.harga === "number"
            ? item.harga
            : parseInt(String(item.harga), 10) || 0;
        tableData.push({
          "Nomor Struk": order.nomorStruk,
          Tanggal: tglStr,
          Jam: jamStr,
          "Metode Bayar": order.metodeBayar,
          "Nama Menu": item.namaMenu,
          Kategori: item.kategori ?? "-",
          "Harga Satuan": hargaNum,
          Qty: item.qty,
          Subtotal: hargaNum * item.qty,
          "Total Transaksi": order.totalHarga,
        });
      });
    });
    return tableData;
  };

  const buildWorkbook = () => {
    const ws = XLSX.utils.json_to_sheet(buildTableData());
    ws["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 8 },
      { wch: 14 },
      { wch: 22 },
      { wch: 12 },
      { wch: 14 },
      { wch: 6 },
      { wch: 14 },
      { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Pesanan");
    return wb;
  };

  const handleExportWeb = () => {
    try {
      const tokoStr = typeof namaToko === "string" ? namaToko : "Toko";
      XLSX.writeFile(
        buildWorkbook(),
        `Riwayat_${tokoStr}_${Date.now()}.xlsx`,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportNative = async () => {
    try {
      const tokoStr = typeof namaToko === "string" ? namaToko : "Toko";
      const base64 = XLSX.write(buildWorkbook(), {
        type: "base64",
        bookType: "xlsx",
      });
      const cacheDir = FileSystem.cacheDirectory ?? "";
      const filePath = `${cacheDir}Riwayat_${tokoStr}_${Date.now()}.xlsx`;
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(filePath, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: `Ekspor Riwayat - ${tokoStr}`,
        UTI: "com.microsoft.excel.xlsx",
      });
    } catch (e: any) {
      setInfoMessage(e?.message ?? "Terjadi kesalahan saat export.");
      setShowInfoModal(true);
    }
  };

  const handleExport = () => {
    if (historyList.length === 0) {
      setInfoMessage("Tidak ada data riwayat transaksi untuk di-export.");
      setShowInfoModal(true);
      return;
    }
    Platform.OS === "web" ? handleExportWeb() : handleExportNative();
  };

  const handleClearData = () => {
    setShowClearModal(true);
  };

  const confirmClearData = async () => {
    await clearHistory();
    setHistoryList([]);
    setShowClearModal(false);
    Alert.alert("Sukses", "Data transaksi hari ini berhasil direset.");
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Image source={require("../../assets/images/Crown.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={styles.greeting}>Dashboard Owner</Text>
          </View>
          <Text style={styles.subGreeting}>Kelola produk, stok, dan modal</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Image source={require("../../assets/images/Logout.png")} style={styles.logoutIcon} resizeMode="contain" />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.menuRow}>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push("/home")}>
            <Image source={require("../../assets/images/Store.png")} style={styles.menuIconImg} resizeMode="contain" />
            <Text style={styles.menuLabel}>Nama Toko</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push("/addmenu" as any)}>
            <Image source={require("../../assets/images/Add.png")} style={styles.menuIconImg} resizeMode="contain" />
            <Text style={styles.menuLabel}>Tambah Produk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuRow}>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push("/add-stock" as any)}>
            <Image source={require("../../assets/images/AddStock.png")} style={styles.menuIconImg} resizeMode="contain" />
            <Text style={styles.menuLabel}>Tambah Stok</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push("/pengaturan-pin" as any)}>
            <Image source={require("../../assets/images/Key.png")} style={styles.menuIconImg} resizeMode="contain" />
            <Text style={styles.menuLabel}>Atur PIN</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerExportWrapper} pointerEvents="box-none">
          <TouchableOpacity style={styles.centerExportBtn} onPress={handleExport} activeOpacity={0.9}>
            <Image source={require("../../assets/images/Export.png")} style={{ width: 28, height: 28, tintColor: "#fff" }} resizeMode="contain" />
            <Text style={styles.centerExportText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearData} activeOpacity={0.8}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image source={require("../../assets/images/Trash.png")} style={{ width: 20, height: 20, tintColor: "#e53e3e" }} resizeMode="contain" />
            <Text style={styles.clearBtnText}>Clear Data Transaksi</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Daftar Produk</Text>

      {loading ? (
        <Text style={styles.emptyText}>Memuat produk...</Text>
      ) : produkList.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada produk. Tap "Tambah Produk" untuk mulai.</Text>
      ) : (
        <FlatList
          data={produkList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.produkList}
          renderItem={({ item }) => (
            <View style={styles.produkRow}>
              <View style={styles.produkInfo}>
                <Text style={styles.produkNama}>{item.nama}</Text>
                <Text style={styles.produkHarga}>Rp {item.harga.toLocaleString("id-ID")}</Text>
                <Text style={styles.produkModal}>Modal: Rp {item.modal.toLocaleString("id-ID")}</Text>
              </View>
              <View style={[styles.stokBadge, item.stok === 0 && styles.stokBadgeHabis]}>
                <Text style={styles.stokText}>{item.stok === 0 ? "Habis" : `${item.stok} pcs`}</Text>
              </View>
              <TouchableOpacity style={styles.menuTitikTiga} onPress={() => openActionSheet(item)}>
                <Text style={styles.titikTigaText}>⋮</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showActionSheet} transparent animationType="fade" onRequestClose={closeActionSheet}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeActionSheet}>
          <View style={styles.actionSheet}>
            {selectedProduk && <Text style={styles.actionSheetTitle}>{selectedProduk.nama}</Text>}
            <TouchableOpacity style={styles.actionBtn} onPress={handlePilihEdit}>
              <Text style={styles.actionBtnText}>✏️ Edit Produk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnHapus]} onPress={handlePilihHapus}>
              <Text style={[styles.actionBtnText, styles.actionBtnTextHapus]}>🗑️ Hapus Produk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnBatal} onPress={closeActionSheet}>
              <Text style={styles.actionBtnBatalText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Edit Produk</Text>
            <Text style={styles.editLabel}>Nama Produk</Text>
            <TextInput style={styles.editInput} value={editNama} onChangeText={setEditNama} placeholder="Nama produk" />
            <Text style={styles.editLabel}>Harga</Text>
            <TextInput style={styles.editInput} value={editHarga} onChangeText={setEditHarga} keyboardType="numeric" placeholder="Harga" />
            <Text style={styles.editLabel}>Stok</Text>
            <TextInput style={styles.editInput} value={editStok} onChangeText={setEditStok} keyboardType="numeric" placeholder="Stok" />
            <View style={styles.editButtonRow}>
              <TouchableOpacity style={[styles.editButton, styles.editButtonBatal]} onPress={() => setShowEditModal(false)}>
                <Text style={styles.editButtonBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.editButtonSimpan]} onPress={handleSimpanEdit}>
                <Text style={styles.editButtonSimpanText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!produkToDelete} transparent animationType="fade" onRequestClose={() => setProdukToDelete(null)}>
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Hapus Produk</Text>
            <Text style={styles.confirmDeleteText}>Yakin ingin menghapus <Text style={{ fontWeight: "700" }}>{produkToDelete?.nama}</Text>?</Text>
            <View style={styles.editButtonRow}>
              <TouchableOpacity style={[styles.editButton, styles.editButtonBatal]} onPress={() => setProdukToDelete(null)}>
                <Text style={styles.editButtonBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.editButtonHapusConfirm]} onPress={confirmHapus}>
                <Text style={styles.editButtonSimpanText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal Konfirmasi Clear Data ─────────────────────────────────────────────── */}
      <Modal
        visible={showClearModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowClearModal(false)}
      >
        <Pressable
          style={styles.modalOverlayCentered}
          onPress={() => setShowClearModal(false)}
        >
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmIcon}>⚠️</Text>
            <Text style={styles.confirmTitle}>Clear Data Transaksi?</Text>
            <Text style={styles.confirmDesc}>
              Seluruh data transaksi hari ini akan direset.{"\n"}
              <Text style={{ fontWeight: "700", color: "#4B2E2B" }}>
                Data tidak dapat dikembalikan!
              </Text>
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmResetBtn}
                onPress={confirmClearData}
              >
                <Text style={styles.confirmResetText}>Clear Data</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Modal Konfirmasi Logout ─────────────────────────────────────────────── */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalOverlayCentered}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Image 
              source={require("../../assets/images/Logout.png")} 
              style={{ width: 40, height: 40, marginBottom: 12 }} 
              resizeMode="contain" 
            />
            <Text style={styles.confirmTitle}>Keluar</Text>
            <Text style={styles.confirmDesc}>Yakin ingin keluar dari akun ini?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmResetBtn}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmResetText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Modal Info (Export Kosong / Error) ─────────────────────────────────────────────── */}
      <Modal
        visible={showInfoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowInfoModal(false)}
      >
        <Pressable
          style={styles.modalOverlayCentered}
          onPress={() => setShowInfoModal(false)}
        >
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmIcon}>ℹ️</Text>
            <Text style={styles.confirmTitle}>Info</Text>
            <Text style={styles.confirmDesc}>{infoMessage}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmResetBtn, { backgroundColor: "#4B2E2B" }]}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.confirmResetText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#4B2E2B", padding: 24, paddingTop: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { fontSize: 18, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#d4b8b5", marginTop: 4 },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", flexDirection: "row", alignItems: "center" },
  logoutIcon: { width: 14, height: 14, marginRight: 6 },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  menuContainer: { padding: 20, gap: 24, position: "relative" },
  menuRow: { flexDirection: "row", justifyContent: "space-between" },
  menuCard: { width: "47%", backgroundColor: "#f5f0ee", borderRadius: 16, padding: 24, alignItems: "center", gap: 8 },
  menuIcon: { fontSize: 28 },
  menuIconImg: { width: 32, height: 32 },
  menuLabel: { fontSize: 13, fontWeight: "600", color: "#4B2E2B", textAlign: "center" },
  centerExportWrapper: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", zIndex: 10, elevation: 6 },
  centerExportBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#4B2E2B", borderWidth: 4, borderColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 5 },
  centerExportText: { color: "#fff", fontSize: 10, fontWeight: "700", marginTop: 2 },
  actionButtons: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  clearBtn: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e53e3e",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  clearBtnText: {
    color: "#e53e3e",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B2E2B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  produkList: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 14,
    marginTop: 24,
    paddingHorizontal: 32,
  },
  produkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f0ee",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  produkInfo: { flex: 1 },
  produkNama: { fontSize: 15, fontWeight: "600", color: "#333" },
  produkHarga: {
    fontSize: 13,
    color: "#4B2E2B",
    fontWeight: "500",
    marginTop: 2,
  },
  produkModal: { fontSize: 11, color: "#999", marginTop: 2 },
  stokBadge: {
    backgroundColor: "#4B2E2B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stokBadgeHabis: { backgroundColor: "#e53e3e" },
  stokText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ── Titik tiga ──
  menuTitikTiga: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  titikTigaText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4B2E2B",
  },

  // ── Action Sheet (popup Edit/Hapus) ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  actionSheetTitle: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 6,
  },
  actionBtn: {
    backgroundColor: "#f5f0ee",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnHapus: { backgroundColor: "#fdeaea" },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: "#4B2E2B" },
  actionBtnTextHapus: { color: "#e53e3e" },
  actionBtnBatal: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  actionBtnBatalText: { fontSize: 15, fontWeight: "600", color: "#999" },

  // ── Modal Edit ──
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  editBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  editTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4B2E2B",
    marginBottom: 16,
    textAlign: "center",
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B2E2B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#e0d8d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  editButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: "center",
  },
  editButtonBatal: { backgroundColor: "#f5f0ee" },
  editButtonBatalText: { fontSize: 14, fontWeight: "600", color: "#777" },
  editButtonSimpan: { backgroundColor: "#4B2E2B" },
  editButtonSimpanText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  editButtonHapusConfirm: { backgroundColor: "#e53e3e" },

  // ── Konfirmasi Hapus ──
  confirmDeleteText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },

  // ─── Confirm Reset Modal ──────────────────────────────────────────────────────
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "80%",
    maxWidth: 340,
    alignItems: "center",
  },
  confirmIcon: { fontSize: 40, marginBottom: 12 },
  confirmTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4B2E2B",
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#888" },
  confirmResetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e74c3c",
    alignItems: "center",
  },
  confirmResetText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
