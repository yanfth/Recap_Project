import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addToCart, getTotalQty } from "../store/cartStore";
import { getMenuList } from "../store/menuStore";

type MenuItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
};

export default function KasirTransaksi() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();

  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [totalCart, setTotalCart] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupTranslateY = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      setMenuList(getMenuList());
      setTotalCart(getTotalQty());
    }, []),
  );

  // ─── Popup animasi ────────────────────────────────────────────────────────────
  const triggerPopup = () => {
    popupOpacity.setValue(0);
    popupTranslateY.setValue(20);
    setShowPopup(true);

    Animated.parallel([
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(popupTranslateY, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(popupOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(popupTranslateY, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setShowPopup(false));
      }, 2000);
    });
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    setTotalCart(getTotalQty());
    triggerPopup();
  };

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filteredMenu = menuList
    .filter((m) => activeTab === "Semua" || m.kategori === activeTab)
    .filter((m) =>
      m.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  // ─── Render Card ──────────────────────────────────────────────────────────────
  const renderMenu = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuImageBox}>
        <Image
          source={
            item.kategori === "Makanan"
              ? require("../../assets/images/Food.png")
              : require("../../assets/images/Drink.png")
          }
          style={styles.menuCategoryIcon}
        />
      </View>

      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.namaMenu}</Text>
        <Text style={styles.menuSub}>
          {item.kategori === "Makanan" ? "🍜 Makanan" : "🥤 Minuman"}
        </Text>
        <Text style={styles.menuHarga}>
          Rp {parseInt(item.harga).toLocaleString("id-ID")}
        </Text>
      </View>

      {/* ✅ Kasir: hanya tombol tambah, tanpa edit/hapus */}
      <Pressable
        style={styles.menuAddBtn}
        onPress={() => handleAddToCart(item)}
      >
        <Text style={styles.menuAddText}>+</Text>
      </Pressable>
    </View>
  );

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topArea}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.tokoName}>{namaToko}</Text>
            <View style={styles.kasirBadge}>
              <Text style={styles.kasirBadgeText}>🧾 Mode Kasir</Text>
            </View>
          </View>
          <View style={{ width: 70 }} />
        </View>

        {/* Tab filter kategori */}
        <View style={styles.tabRow}>
          {["Semua", "Makanan", "Minuman"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari menu..."
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Daftar menu */}
        {filteredMenu.length === 0 ? (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0
                ? `Tidak ada menu "${searchQuery}"`
                : "Belum ada menu tersedia\nHubungi owner untuk menambahkan menu"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMenu}
            keyExtractor={(item) => item.id}
            renderItem={renderMenu}
            contentContainerStyle={{
              gap: 12,
              paddingTop: 16,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Popup notifikasi */}
      {showPopup && (
        <Animated.View
          style={[
            styles.popup,
            {
              opacity: popupOpacity,
              transform: [{ translateY: popupTranslateY }],
            },
          ]}
        >
          <Text style={styles.popupText}>🛒 {totalCart} item di keranjang</Text>
        </Animated.View>
      )}

      {/* Bottom Navigation — kasir: Home, Keranjang, Riwayat */}
      <View style={styles.bottomNav}>
        {/* Home → kembali ke dashboard utama */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.back()}
        >
          <Image
            source={require("../../assets/images/home.png")}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        {/* Keranjang */}
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

        {/* Riwayat */}
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

      {/* Tombol bayar floating (muncul kalau keranjang tidak kosong) */}
      {totalCart > 0 && (
        <Animated.View
          style={[styles.fabWrap, { transform: [{ scale: scaleAnim }] }]}
        >
          <Pressable
            style={styles.fab}
            onPress={() => router.push(`/cart?namaToko=${namaToko}`)}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <Text style={styles.fabText}>🛒</Text>
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{totalCart}</Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
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

  // Header
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: { width: 70 },
  backText: { fontSize: 13, color: "#4B2E2B", fontWeight: "500" },
  headerCenter: { alignItems: "center", gap: 4 },
  tokoName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B2E2B",
  },
  kasirBadge: {
    backgroundColor: "#fdf6f0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#e8d5cc",
  },
  kasirBadgeText: { fontSize: 11, color: "#4B2E2B", fontWeight: "600" },

  // Tab
  tabRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#f2f2f2",
  },
  tabActive: { backgroundColor: "#4B2E2B" },
  tabText: { fontSize: 13, color: "#888" },
  tabTextActive: { color: "#fff", fontWeight: "500" },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#ebebeb",
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: "#4B2E2B", paddingVertical: 0 },
  searchClear: { fontSize: 14, color: "#bbb", fontWeight: "600", paddingLeft: 4 },

  // Empty
  emptyArea: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: "#bbb", textAlign: "center", lineHeight: 24 },

  // Menu Card
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuImageBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
  },
  menuCategoryIcon: { width: 44, height: 44, resizeMode: "contain" },
  menuInfo: { flex: 1, gap: 2 },
  menuName: { fontSize: 15, fontWeight: "600", color: "#4B2E2B" },
  menuSub: { fontSize: 12, color: "#aaa" },
  menuHarga: { fontSize: 14, fontWeight: "600", color: "#4B2E2B", marginTop: 4 },
  menuAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#4B2E2B",
    alignItems: "center",
    justifyContent: "center",
  },
  menuAddText: { color: "#fff", fontSize: 22, lineHeight: 24 },

  // Popup
  popup: {
    position: "absolute",
    bottom: 90,
    left: 24,
    zIndex: 999,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#4B2E2B",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  popupText: { color: "#4B2E2B", fontSize: 14, fontWeight: "500" },

  // FAB keranjang
  fabWrap: {
    position: "absolute",
    bottom: 90,
    right: 24,
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#4B2E2B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 22 },
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#e74c3c",
    borderRadius: 999,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  // Bottom Nav
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