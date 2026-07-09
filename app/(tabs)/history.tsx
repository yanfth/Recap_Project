import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as XLSX from "xlsx";
import { getHistory, HistoryOrder } from "../store/historyStore";
import { loadKas, resetKas, saveKas } from "../store/kasStore";

export default function History() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();

  const [historyList, setHistoryList] = useState<HistoryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);

  const [modalAwal, setModalAwal] = useState<number | null>(null);
  const [showKasModal, setShowKasModal] = useState(false);
  const [inputModal, setInputModal] = useState("");
  const [kasDisimpan, setKasDisimpan] = useState(false);

  // Modal konfirmasi reset (ganti Alert agar selalu berfungsi)
  const [showResetModal, setShowResetModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getHistory().then((data) => setHistoryList(data));

      // Load kas — hanya pakai nilainya jika kasDisimpan = true
      loadKas().then(({ modalAwal: saved, kasDisimpan: isSaved }) => {
        if (isSaved && saved > 0) {
          // User memang sudah mengisi modal sebelumnya
          setModalAwal(saved);
          setKasDisimpan(true);
        } else {
          // Belum pernah diisi atau sudah di-reset
          setModalAwal(null);
          setKasDisimpan(false);
        }
      });
    }, []),
  );

  // ─── Kalkulasi ────────────────────────────────────────────────────────────────
  const totalPemasukan = historyList.reduce((acc, o) => acc + o.totalHarga, 0);

  // Jika modal belum diisi, tampilkan 0 sebagai fallback visual
  const modalAwalDisplay = modalAwal ?? 0;
  const saldoKas = modalAwalDisplay + totalPemasukan;

  const formatRp = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  // ─── Handler Kas ──────────────────────────────────────────────────────────────
  const handleSimpanModal = async () => {
    const parsed = parseInt(inputModal.replace(/\D/g, ""), 10);
    if (isNaN(parsed) || parsed < 0) return;

    await saveKas(parsed);
    setModalAwal(parsed);
    setKasDisimpan(true);
    setShowKasModal(false);
    setInputModal("");
  };

  const confirmReset = async () => {
    await resetKas();
    setModalAwal(null);
    setKasDisimpan(false);
    setShowResetModal(false);
  };

  // ─── Util ─────────────────────────────────────────────────────────────────────
  const formatWaktu = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const metodeIcon = (metode: string) => {
    if (metode === "QRIS")
      return (
        <Image
          source={require("../../assets/images/Qr.png")}
          style={{ width: 14, height: 14, marginRight: 4 }}
          resizeMode="contain"
        />
      );
    if (metode === "Cash")
      return (
        <Image
          source={require("../../assets/images/Cash.png")}
          style={{ width: 14, height: 14, marginRight: 4 }}
          resizeMode="contain"
        />
      );
    return <Text style={{ fontSize: 12, marginRight: 4 }}>💳</Text>;
  };

  // ─── Export ───────────────────────────────────────────────────────────────────
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
      const tokoName = typeof namaToko === "string" ? namaToko : "Toko";
      XLSX.writeFile(buildWorkbook(), `Riwayat_${tokoName}_${Date.now()}.xlsx`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportNative = async () => {
    if (!FileSystem) {
      Alert.alert("Error", "Modul FileSystem tidak tersedia di platform ini.");
      return;
    }
    try {
      const tokoName = typeof namaToko === "string" ? namaToko : "Toko";
      const base64 = XLSX.write(buildWorkbook(), {
        type: "base64",
        bookType: "xlsx",
      });
      const cacheDir = FileSystem.cacheDirectory ?? "";
      if (!cacheDir) {
        Alert.alert("Error", "cacheDirectory tidak tersedia.");
        return;
      }
      const filePath = `${cacheDir}Riwayat_${tokoName}_${Date.now()}.xlsx`;
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Tidak Tersedia",
          "Fitur share tidak tersedia di perangkat ini.",
        );
        return;
      }
      await Sharing.shareAsync(filePath, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: `Ekspor Riwayat - ${tokoName}`,
        UTI: "com.microsoft.excel.xlsx",
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Export Gagal",
        e?.message ?? "Terjadi kesalahan saat export.",
      );
    }
  };

  const handleExport = () => {
    if (historyList.length === 0) return;
    Platform.OS === "web" ? handleExportWeb() : handleExportNative();
  };

  // ─── Render Card ──────────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: HistoryOrder }) => (
    <Pressable
      style={styles.card}
      onPress={() => setSelectedOrder(item)}
      android_ripple={{ color: "#e8ecf4" }}
    >
      <View style={styles.accentBar} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.metodeBadge,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              {metodeIcon(item.metodeBayar)}
              <Text style={styles.metodeBadgeText}>{item.metodeBayar}</Text>
            </View>
            <Text style={styles.nomorStruk}>{item.nomorStruk}</Text>
          </View>
          <Text style={styles.cardTotal}>
            Rp {item.totalHarga.toLocaleString("id-ID")}
          </Text>
        </View>
        <Text style={styles.itemsPreview} numberOfLines={1}>
          {item.items.map((i) => `${i.namaMenu} x${i.qty}`).join("  ·  ")}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.waktuText}>🕐 {formatWaktu(item.waktu)}</Text>
          <Text style={styles.detailHint}>Lihat detail →</Text>
        </View>
      </View>
    </Pressable>
  );

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40 }}>
            <Image
              source={require("../../assets/images/arrow-back.png")}
              style={styles.backBtn}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Riwayat Pesanan</Text>
          <TouchableOpacity
            style={[
              styles.exportBtn,
              historyList.length === 0 && styles.exportBtnDisabled,
            ]}
            onPress={handleExport}
            disabled={historyList.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Kartu Kas */}
        <View style={styles.kasCard}>
          <View style={styles.kasHeader}>
            <Text style={styles.kasTitle}>Cashbox</Text>
            <View style={styles.kasHeaderActions}>
              {kasDisimpan && (
                <TouchableOpacity
                  onPress={() => setShowResetModal(true)}
                  style={styles.resetBtn}
                >
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  setInputModal(modalAwal != null ? String(modalAwal) : "");
                  setShowKasModal(true);
                }}
                style={styles.editKasBtn}
              >
                <Text style={styles.editKasText}>
                  {kasDisimpan ? "Ubah" : "+ Isi Modal"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.kasRows}>
            <View style={styles.kasRow}>
              <Text style={styles.kasLabel}>Modal Awal</Text>
              <Text style={styles.kasValue}>
                {kasDisimpan ? formatRp(modalAwalDisplay) : "Belum diisi"}
              </Text>
            </View>
            <View style={styles.kasRow}>
              <Text style={styles.kasLabel}>Total Pemasukan</Text>
              <Text style={[styles.kasValue, { color: "#2e7d32" }]}>
                + {formatRp(totalPemasukan)}
              </Text>
            </View>
            <View style={styles.kasDivider} />
            <View style={styles.kasRow}>
              <Text style={styles.kasSaldoLabel}>Cash Box</Text>
              <Text style={styles.kasSaldoValue}>{formatRp(saldoKas)}</Text>
            </View>
          </View>
        </View>

        {/* Summary pill */}
        {historyList.length > 0 && (
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {historyList.length} pesanan selesai
            </Text>
            <Text style={styles.summaryTotal}>
              Total: {formatRp(totalPemasukan)}
            </Text>
          </View>
        )}

        {/* List */}
        {historyList.length === 0 ? (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>
              Belum ada riwayat pesanan{"\n"}Selesaikan transaksi pertamamu!
            </Text>
          </View>
        ) : (
          <FlatList
            data={historyList}
            keyExtractor={(item) => item.nomorStruk}
            renderItem={renderCard}
            contentContainerStyle={{
              gap: 12,
              paddingTop: 16,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>
          {historyList.length > 0
            ? `${historyList.length} transaksi tercatat`
            : "Riwayat transaksi kamu"}
        </Text>
      </View>

      {/* ─── Modal Konfirmasi Reset ─────────────────────────────────────────────── */}
      <Modal
        visible={showResetModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowResetModal(false)}
      >
        <Pressable
          style={styles.modalOverlayCentered}
          onPress={() => setShowResetModal(false)}
        >
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmIcon}>⚠️</Text>
            <Text style={styles.confirmTitle}>Reset Modal Awal?</Text>
            <Text style={styles.confirmDesc}>
              Modal awal akan direset ke{"\n"}
              <Text style={{ fontWeight: "700", color: "#4B2E2B" }}>
                Rp 0
              </Text>{" "}
              silahkan isi kembali modal awal tokomu!
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmResetBtn}
                onPress={confirmReset}
              >
                <Text style={styles.confirmResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Modal Input Modal Awal ─────────────────────────────────────────────── */}
      <Modal
        visible={showKasModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowKasModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowKasModal(false)}
          />
          <View style={styles.kasInputBox}>
            <View style={styles.handleBar} />
            <Text style={styles.kasInputTitle}>Isi Modal Awal</Text>
            <Text style={styles.kasInputSubtitle}>
              Masukkan jumlah uang yang tersedia di Cashbox sebelum berjualan
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>Rp</Text>
              <TextInput
                style={styles.kasTextInput}
                placeholder="0"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
                value={inputModal}
                onChangeText={(val) => setInputModal(val.replace(/\D/g, ""))}
                autoFocus
              />
            </View>

            {inputModal.length > 0 && (
              <Text style={styles.inputPreview}>
                {formatRp(parseInt(inputModal || "0", 10))}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.simpanBtn,
                inputModal.length === 0 && styles.simpanBtnDisabled,
              ]}
              onPress={handleSimpanModal}
              disabled={inputModal.length === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.simpanText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Modal Detail Transaksi ──────────────────────────────────────────────── */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedOrder(null)}
        >
          <Pressable style={styles.detailBox} onPress={() => {}}>
            <View style={styles.handleBar} />
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailNomor}>
                  {selectedOrder?.nomorStruk}
                </Text>
                <Text style={styles.detailWaktu}>
                  {selectedOrder ? formatWaktu(selectedOrder.waktu) : ""}
                </Text>
              </View>
              <View
                style={[
                  styles.detailMetodeBadge,
                  { flexDirection: "row", alignItems: "center" },
                ]}
              >
                {selectedOrder && metodeIcon(selectedOrder.metodeBayar)}
                <Text style={styles.detailMetodeText}>
                  {selectedOrder?.metodeBayar}
                </Text>
              </View>
            </View>

            <View style={styles.dashedLine} />

            <ScrollView
              style={{ maxHeight: 220 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedOrder?.items.map((item) => {
                const hargaNum =
                  typeof item.harga === "number"
                    ? item.harga
                    : parseInt(String(item.harga), 10) || 0;
                return (
                  <View key={item.id} style={styles.detailItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailItemName}>{item.namaMenu}</Text>
                      <Text style={styles.detailItemQty}>
                        Rp {hargaNum.toLocaleString("id-ID")} × {item.qty}
                      </Text>
                    </View>
                    <Text style={styles.detailItemTotal}>
                      Rp {(hargaNum * item.qty).toLocaleString("id-ID")}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.dashedLine} />

            <View style={styles.detailTotalRow}>
              <Text style={styles.detailTotalLabel}>TOTAL BAYAR</Text>
              <Text style={styles.detailTotalValue}>
                Rp {selectedOrder?.totalHarga.toLocaleString("id-ID")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.tutupBtn}
              onPress={() => setSelectedOrder(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.tutupText}>Tutup</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4B2E2B" },
  topArea: {
    flex: 1,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: { width: 24, height: 24 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B2E2B",
    flex: 1,
    textAlign: "center",
  },
  exportBtn: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  exportBtnDisabled: { backgroundColor: "#ccc" },
  exportText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ─── Kas Card ─────────────────────────────────────────────────────────────────
  kasCard: {
    backgroundColor: "#fdf6f0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#e8d5cc",
  },
  kasHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  kasTitle: { fontSize: 14, fontWeight: "700", color: "#4B2E2B" },
  kasHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  resetText: { fontSize: 11, color: "#e74c3c", fontWeight: "600" },
  editKasBtn: {
    backgroundColor: "#4B2E2B",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  editKasText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  kasRows: { gap: 6 },
  kasRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kasLabel: { fontSize: 13, color: "#888" },
  kasValue: { fontSize: 13, fontWeight: "600", color: "#4B2E2B" },
  kasDivider: { height: 1, backgroundColor: "#e8d5cc", marginVertical: 4 },
  kasSaldoLabel: { fontSize: 14, fontWeight: "700", color: "#4B2E2B" },
  kasSaldoValue: { fontSize: 16, fontWeight: "800", color: "#4B2E2B" },

  // Summary pill
  summaryPill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4B2E2B",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  summaryText: { fontSize: 13, color: "#fff", fontWeight: "500" },
  summaryTotal: { fontSize: 14, color: "#fff", fontWeight: "700" },

  // Empty
  emptyArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 52 },
  emptyText: {
    fontSize: 15,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 24,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4B2E2B",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  accentBar: {
    width: 5,
    backgroundColor: "#4B2E2B",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: { flex: 1, padding: 14, gap: 6 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metodeBadge: {
    backgroundColor: "#f3eeee",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  metodeBadgeText: { fontSize: 11, fontWeight: "600", color: "#4B2E2B" },
  nomorStruk: { fontSize: 11, color: "#bbb" },
  cardTotal: { fontSize: 15, fontWeight: "700", color: "#4B2E2B" },
  itemsPreview: { fontSize: 12, color: "#888" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  waktuText: { fontSize: 11, color: "#aaa" },
  detailHint: { fontSize: 11, color: "#4B2E2B", fontWeight: "600" },

  // Bottom bar
  bottomBar: { paddingVertical: 18, alignItems: "center" },
  bottomBarText: { fontSize: 13, color: "#fff", fontWeight: "500" },

  // ─── Modal overlay (slide up) ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  // ─── Modal overlay (centered — untuk konfirmasi) ──────────────────────────────
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Confirm Reset Modal ──────────────────────────────────────────────────────
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

  // ─── Kas Input Modal ──────────────────────────────────────────────────────────
  kasInputBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  },
  kasInputTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B2E2B",
    marginBottom: 6,
    textAlign: "center",
  },
  kasInputSubtitle: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdf6f0",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e8d5cc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B2E2B",
    marginRight: 8,
  },
  kasTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#4B2E2B",
    padding: 0,
  },
  inputPreview: {
    fontSize: 13,
    color: "#4B2E2B",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  simpanBtn: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 4,
  },
  simpanBtnDisabled: { backgroundColor: "#ccc" },
  simpanText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // Handle bar
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },

  // ─── Detail Modal ─────────────────────────────────────────────────────────────
  detailBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  detailNomor: { fontSize: 16, fontWeight: "700", color: "#4B2E2B" },
  detailWaktu: { fontSize: 12, color: "#aaa", marginTop: 3 },
  detailMetodeBadge: {
    backgroundColor: "#4B2E2B",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  detailMetodeText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  dashedLine: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginVertical: 14,
  },
  detailItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  detailItemName: { fontSize: 14, fontWeight: "600", color: "#4B2E2B" },
  detailItemQty: { fontSize: 12, color: "#aaa", marginTop: 1 },
  detailItemTotal: { fontSize: 13, fontWeight: "600", color: "#4B2E2B" },
  detailTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4B2E2B",
    letterSpacing: 0.8,
  },
  detailTotalValue: { fontSize: 18, fontWeight: "bold", color: "#4B2E2B" },
  tutupBtn: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },
  tutupText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
