import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
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
import { getHistory, HistoryOrder } from "../store/historyStore";
import { loadKas, resetKas, saveKas } from "../store/kasStore";
import { handleExportExcel } from "../utils/exportUtils";

export default function History() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();

  const [historyList, setHistoryList] = useState<HistoryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);
  const [activeFilter, setActiveFilter] = useState("All Transactions");

  const [modalAwal, setModalAwal] = useState<number | null>(null);
  const [showKasModal, setShowKasModal] = useState(false);
  const [inputModal, setInputModal] = useState("");
  const [kasDisimpan, setKasDisimpan] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getHistory().then((data) => setHistoryList(data));

      loadKas().then(({ modalAwal: saved, kasDisimpan: isSaved }) => {
        if (isSaved && saved > 0) {
          setModalAwal(saved);
          setKasDisimpan(true);
        } else {
          setModalAwal(null);
          setKasDisimpan(false);
        }
      });
    }, []),
  );

  const totalPemasukan = historyList.reduce((acc, o) => acc + o.totalHarga, 0);
  const totalUangMasuk = historyList.reduce((acc, o) => {
    if (o.metodeBayar === "Cash" && o.uangDiterima) {
      return acc + o.uangDiterima;
    }
    return acc + o.totalHarga;
  }, 0);

  const totalKembalian = historyList.reduce((acc, o) => {
    if (o.metodeBayar === "Cash" && o.kembalian) {
      return acc + o.kembalian;
    }
    return acc;
  }, 0);

  const modalAwalDisplay = modalAwal ?? 0;
  const saldoKas = modalAwalDisplay + totalUangMasuk - totalKembalian;

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

  const handleExport = async () => {
    try {
      await handleExportExcel(historyList, namaToko, "Toko Kasir");
    } catch (error) {
      console.error(error);
    }
  };

  const formatWaktuPill = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and Sort History
  const filteredHistory = historyList
    .filter((order) => {
      if (activeFilter === "Cash") return order.metodeBayar === "Cash";
      if (activeFilter === "QRIS") return order.metodeBayar === "QRIS";
      return true;
    })
    .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

  // Group by date
  const groupedHistory = filteredHistory.reduce((groups, order) => {
    const orderDate = new Date(order.waktu);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key = "";
    if (orderDate.toDateString() === today.toDateString()) {
      key = `Today, ${orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else if (orderDate.toDateString() === yesterday.toDateString()) {
      key = `Yesterday, ${orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else {
      key = orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(order);
    return groups;
  }, {} as Record<string, HistoryOrder[]>);

  const renderFilter = (label: string) => (
    <TouchableOpacity
      style={[styles.filterPill, activeFilter === label && styles.filterPillActive]}
      onPress={() => setActiveFilter(label)}
    >
      <Text style={[styles.filterText, activeFilter === label && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.recapHeader}>recap</Text>

        <View style={styles.titleSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Transaction History</Text>
            <Text style={styles.pageSubtitle}>Review your recent sales and refunds.</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Text style={styles.exportBtnText}>📄 Export SPS</Text>
          </TouchableOpacity>
        </View>

        {/* Cashbox Summary */}
        <View style={styles.cashboxCard}>
          <View style={styles.cashboxHeaderRow}>
            <View style={styles.cashboxTitleWrap}>
              <Image source={require("../../assets/images/Cash.png")} style={{ width: 18, height: 18, tintColor: '#4A6D5E' }} resizeMode="contain" />
              <Text style={styles.cashboxTitle}>Cashbox Summary</Text>
            </View>
            <TouchableOpacity onPress={() => setShowResetModal(true)}>
              <Image source={require("../../assets/images/Trash.png")} style={{ width: 18, height: 18, tintColor: '#99A8A4' }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cashboxDataRow}>
            <View style={styles.cashboxDataItem}>
              <Text style={styles.cashboxDataLabel}>Total Income</Text>
              <Text style={styles.cashboxDataValue}>Rp {(totalPemasukan).toLocaleString("id-ID")}</Text>
            </View>
            <View style={styles.cashboxDataItem}>
              <Text style={styles.cashboxDataLabel}>Change Given</Text>
              <Text style={styles.cashboxDataValue}>Rp {(totalKembalian).toLocaleString("id-ID")}</Text>
            </View>
            <View style={[styles.cashboxDataItem, { alignItems: 'flex-end' }]}>
              <Text style={styles.cashboxDataLabel}>Net Cash</Text>
              <Text style={[styles.cashboxDataValue, { color: '#1A2E35' }]}>Rp {(saldoKas).toLocaleString("id-ID")}</Text>
            </View>
          </View>
          
          <View style={styles.cashboxActionRow}>
            <TouchableOpacity style={styles.fillCashboxBtn} onPress={() => setShowKasModal(true)}>
              <Text style={styles.fillCashboxText}>⊕ Fill Cashbox</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {renderFilter("All Transactions")}
          {renderFilter("Cash")}
          {renderFilter("QRIS")}
        </View>

        {/* History List Grouped */}
        {Object.keys(groupedHistory).map(dateKey => (
          <View key={dateKey} style={styles.dateGroup}>
            <Text style={styles.dateLabel}>{dateKey}</Text>
            {groupedHistory[dateKey].map((order, idx) => {
              const qtyCount = order.items.reduce((sum, i) => sum + i.qty, 0);
              const isRefunded = order.metodeBayar === 'Refund'; // Just a visual mock if it existed

              return (
                <View key={order.nomorStruk} style={styles.orderCard}>
                  <View style={[styles.orderIconBox, isRefunded && styles.orderIconBoxRed]}>
                    <Image 
                      source={require("../../assets/images/Cash.png")} 
                      style={[styles.orderIcon, isRefunded && styles.orderIconRed]} 
                      resizeMode="contain" 
                    />
                  </View>
                  <View style={styles.orderInfo}>
                    <View style={styles.orderHeaderRow}>
                      <Text style={styles.orderNumber}>Order #{order.nomorStruk.slice(-4)}</Text>
                      <View style={styles.timePill}>
                        <Text style={styles.timePillText}>{formatWaktuPill(order.waktu)}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderDetails}>
                      {qtyCount} {qtyCount > 1 ? 'items' : 'item'} • {order.metodeBayar}
                    </Text>
                  </View>
                  <View style={styles.orderPriceSec}>
                    <Text style={styles.orderPrice}>
                      Rp {order.totalHarga.toLocaleString("id-ID")}
                    </Text>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusIcon}>{isRefunded ? '⊗' : '⊙'}</Text>
                      <Text style={[styles.statusText, isRefunded && styles.statusTextRed]}>
                        {isRefunded ? 'Refunded' : 'Completed'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <TouchableOpacity style={styles.loadMoreBtn}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal Edit Modal Awal */}
      <Modal visible={showKasModal} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlayCentered}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Ubah Modal Kas</Text>
            <Text style={styles.confirmDesc}>Masukkan jumlah uang tunai saat buka toko.</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Contoh: 100000"
              value={inputModal}
              onChangeText={setInputModal}
            />
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmBatalBtn} onPress={() => setShowKasModal(false)}>
                <Text style={styles.confirmBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmResetBtn} onPress={handleSimpanModal}>
                <Text style={styles.confirmResetText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Reset Kas */}
      <Modal visible={showResetModal} animationType="fade" transparent>
        <View style={styles.modalOverlayCentered}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Reset Cashbox</Text>
            <Text style={styles.confirmDesc}>Anda yakin ingin mengatur ulang cashbox menjadi Rp 0?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmBatalBtn} onPress={() => setShowResetModal(false)}>
                <Text style={styles.confirmBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmResetBtn, { backgroundColor: '#E74C3C' }]} onPress={confirmReset}>
                <Text style={styles.confirmResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/Dashboard-kasir" as any)}>
          <Image source={require("../../assets/images/home.png")} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/cart" as any)}>
          <Image source={require("../../assets/images/cart.png")} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image source={require("../../assets/images/History.png")} style={[styles.navIcon, { tintColor: "#3B82F6" }]} resizeMode="contain" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#202528",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 110, // for bottom nav
    backgroundColor: "#F9FAF9",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: '100%',
  },
  recapHeader: {
    textAlign: "center",
    color: "#6C9484",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 24,
    textTransform: "lowercase",
  },
  titleSection: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exportBtn: {
    backgroundColor: "#1A2E35",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exportBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A2E35",
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#667A80",
  },
  
  /* Cashbox Summary */
  cashboxCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 24,
  },
  cashboxHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cashboxTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  cashboxTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2E35",
  },
  cashboxDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cashboxDataItem: {
    flex: 1,
  },
  cashboxDataLabel: {
    fontSize: 12,
    color: "#99A8A4",
    marginBottom: 4,
    fontWeight: "500",
  },
  cashboxDataValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A6D5E", // default green for money
  },
  cashboxActionRow: {
    alignItems: "flex-end",
  },
  fillCashboxBtn: {
    backgroundColor: "#E2ECE8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  fillCashboxText: {
    color: "#4A6D5E",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Filters */
  filterRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: "#4A6D5E",
  },
  filterText: {
    fontSize: 13,
    color: "#99A8A4",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  /* List */
  dateGroup: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 13,
    color: "#667A80",
    fontWeight: "500",
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  orderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E2ECE8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  orderIconBoxRed: {
    backgroundColor: "#FCE7E7",
  },
  orderIcon: {
    width: 20,
    height: 20,
    tintColor: "#4A6D5E",
  },
  orderIconRed: {
    tintColor: "#E74C3C",
  },
  orderInfo: {
    flex: 1,
  },
  orderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E35",
    marginRight: 8,
  },
  timePill: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timePillText: {
    fontSize: 10,
    color: "#99A8A4",
    fontWeight: "600",
  },
  orderDetails: {
    fontSize: 13,
    color: "#99A8A4",
  },
  orderPriceSec: {
    alignItems: "flex-end",
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E35",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 10,
    color: "#4A6D5E",
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: "#4A6D5E",
    fontWeight: "500",
  },
  statusTextRed: {
    color: "#E74C3C",
  },

  loadMoreBtn: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  loadMoreText: {
    color: "#1A2E35",
    fontWeight: "600",
    fontSize: 14,
  },

  /* Modals */
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
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A2E35",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmDesc: {
    fontSize: 14,
    color: "#667A80",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: "#1A2E35",
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmBatalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#E2E8E6",
    alignItems: "center",
  },
  confirmBatalText: { fontSize: 15, fontWeight: "600", color: "#667A80" },
  confirmResetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#6C9484",
    alignItems: "center",
  },
  confirmResetText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  /* Bottom Navigation */
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 999,
  },
  navItemActive: {
    backgroundColor: "#E6F0FF",
  },
  navIcon: { width: 22, height: 22, tintColor: "#99A8A4", marginBottom: 6 },
  navLabel: { fontSize: 11, fontWeight: "600", color: "#99A8A4" },
  navLabelActive: { color: "#3B82F6" },
});
