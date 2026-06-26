import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../hooks/useStock";

export default function DashboardScreen() {
  const router = useRouter();
  const { namaToko } = useLocalSearchParams();
  const auth = useAuth();
  const { produkList, loading } = useStock();

  const role = auth?.role;
  const isOwner = role === "owner";

  // ✅ FIX: Arahkan keluar ke /login
  const handleLogout = () => {
    Alert.alert("Keluar", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: () => {
          auth?.logout();
          router.dismissAll();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {isOwner ? "👑 Dashboard Owner" : "🧾 Dashboard Kasir"}
          </Text>
          <Text style={styles.subGreeting}>
            {isOwner
              ? "Kelola produk, stok, dan modal"
              : "Siap melayani transaksi"}
          </Text>
        </View>

        {/* ✅ Tombol Keluar → /login */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.logoutText}>🚪 Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Owner */}
      {isOwner && (
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/home")}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>🏪</Text>
            <Text style={styles.menuLabel}>Nama Toko</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/addmenu" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>➕</Text>
            <Text style={styles.menuLabel}>Tambah Produk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/add-stock" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuLabel}>Tambah Stok</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/pengaturan-pin" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>🔐</Text>
            <Text style={styles.menuLabel}>Atur PIN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tombol transaksi - Kasir only */}
      {!isOwner && (
        <TouchableOpacity
          style={styles.transaksiBtn}
          onPress={() => router.push(`/kasir-transaksi?namaToko=${namaToko}` as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.transaksiBtnText}>🧾 Mulai Transaksi</Text>
        </TouchableOpacity>
      )}

      {/* Daftar produk */}
      <Text style={styles.sectionLabel}>Daftar Produk</Text>

      {loading ? (
        <Text style={styles.emptyText}>Memuat produk...</Text>
      ) : produkList.length === 0 ? (
        <Text style={styles.emptyText}>
          {isOwner
            ? 'Belum ada produk. Tap "Tambah Produk" untuk mulai.'
            : "Belum ada produk. Hubungi owner."}
        </Text>
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
                {isOwner && (
                  <Text style={styles.produkModal}>
                    Modal: Rp {item.modal.toLocaleString("id-ID")}
                  </Text>
                )}
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
    </View>
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
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  menuCard: {
    width: "47%",
    backgroundColor: "#f5f0ee",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  menuIcon: { fontSize: 28 },
  menuLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B2E2B",
    textAlign: "center",
  },
  transaksiBtn: {
    margin: 20,
    backgroundColor: "#4B2E2B",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  transaksiBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
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
});