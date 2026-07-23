import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  Platform,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../hooks/useStock";
import { clearHistory, getHistory, HistoryOrder } from "../store/historyStore";
import { getTotalQty } from "../store/cartStore";
import { handleExportExcel } from "../utils/exportUtils";

export default function DashboardKasirScreen() {
  const router = useRouter();
  const { namaToko } = useLocalSearchParams();
  const auth = useAuth();
  const { produkList, loading } = useStock();
  const [historyList, setHistoryList] = useState<HistoryOrder[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [totalCart, setTotalCart] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const data = await getHistory();
        setHistoryList(data);
        setTotalCart(getTotalQty());
      };
      loadData();
    }, [])
  );

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    auth?.logout();
    router.replace("/login");
  };

  const handleClearData = () => {
    setShowClearModal(true);
  };

  const confirmClearData = async () => {
    await clearHistory();
    setHistoryList([]);
    setShowClearModal(false);
    setInfoMessage("Data transaksi hari ini berhasil direset.");
    setShowInfoModal(true);
  };

  const handleExport = async () => {
    if (historyList.length === 0) {
      setInfoMessage("Tidak ada data riwayat transaksi untuk di-export.");
      setShowInfoModal(true);
      return;
    }
    await handleExportExcel(historyList, namaToko, "Toko");
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Image source={require("../../assets/images/Cashire.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={styles.greeting}>Dashboard Kasir</Text>
          </View>
          <Text style={styles.subGreeting}>Siap melayani transaksi</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={require("../../assets/images/Logout.png")}
            style={styles.logoutIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Tombol transaksi - Kasir only */}
      <View style={styles.actionButtons}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={[styles.transaksiBtn, { flex: 1 }]}
            onPress={() =>
              router.push(`/kasir-transaksi?namaToko=${namaToko}` as any)
            }
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Image source={require("../../assets/images/Cash.png")} style={{ width: 18, height: 18, tintColor: "#fff" }} resizeMode="contain" />
              <Text style={styles.transaksiBtnText}>Mulai Transaksi</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.transaksiBtn, { flex: 1, backgroundColor: "#27ae60" }]}
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Image source={require("../../assets/images/Export.png")} style={{ width: 18, height: 18, tintColor: "#fff" }} resizeMode="contain" />
              <Text style={styles.transaksiBtnText}>Export Data</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.transaksiBtn, styles.clearBtn, { marginTop: -4 }]}
          onPress={handleClearData}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <Image source={require("../../assets/images/Trash.png")} style={{ width: 18, height: 18, tintColor: "#e53e3e" }} resizeMode="contain" />
            <Text style={[styles.transaksiBtnText, styles.clearBtnText]}>
              Clear Data Transaksi
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Daftar produk */}
      <Text style={styles.sectionLabel}>Daftar Produk</Text>

      {loading ? (
        <Text style={styles.emptyText}>Memuat produk...</Text>
      ) : produkList.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada produk. Hubungi owner.</Text>
      ) : (
        <FlatList
          data={produkList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.produkList}
          renderItem={({ item }) => (
            <View style={styles.produkRow}>
              <View style={styles.produkInfo}>
                <Text style={styles.produkNama}>{item.nama}</Text>
                <Text style={styles.produkHarga}>
                  Rp {item.harga.toLocaleString("id-ID")}
                </Text>
              </View>
              <View
                style={[
                  styles.stokBadge,
                  item.stok === 0 && styles.stokBadgeHabis,
                ]}
              >
                <Text style={styles.stokText}>
                  {item.stok === 0 ? "Habis" : `${item.stok} pcs`}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Image
            source={require("../../assets/images/home.png")}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push(`/cart?namaToko=${namaToko}`)}
        >
          <View>
            <Image
              source={require("../../assets/images/cart.png")}
              style={styles.navIcon}
              resizeMode="contain"
            />
            {totalCart > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCart}</Text>
              </View>
            )}
          </View>
          <Text style={styles.navLabel}>Keranjang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push(`/history?namaToko=${namaToko}`)}
        >
          <Image
            source={require("../../assets/images/History.png")}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Riwayat</Text>
        </TouchableOpacity>
      </View>

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

      {/* ─── Modal Info (Export Kosong / Error / Success) ─────────────────────────────────────────────── */}
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
  header: {
    backgroundColor: "#4B2E2B",
    padding: 24,
    paddingTop: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { fontSize: 18, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#d4b8b5", marginTop: 4 },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    flexDirection: "row",
    alignItems: "center",
  },
  logoutIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  actionButtons: {
    margin: 20,
    gap: 12,
  },
  transaksiBtn: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  transaksiBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  clearBtn: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e53e3e",
    paddingVertical: 16,
  },
  clearBtnText: { color: "#e53e3e" },
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
  stokBadge: {
    backgroundColor: "#4B2E2B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stokBadgeHabis: { backgroundColor: "#e53e3e" },
  stokText: { color: "#fff", fontSize: 12, fontWeight: "600" },

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
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: "#4B2E2B",
  },
  navItem: { alignItems: "center", gap: 4 },
  navIcon: { width: 26, height: 26 },
  navLabel: { fontSize: 10, color: "#d4b8b5", fontWeight: "500" },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e74c3c",
    borderRadius: 999,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
});
