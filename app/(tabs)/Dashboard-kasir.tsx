import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  Platform,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useStock, Produk } from "../hooks/useStock";
import { getHistory, HistoryOrder } from "../store/historyStore";
import { addToCart, getTotalQty } from "../store/cartStore";

export default function DashboardKasirScreen() {
  const router = useRouter();
  const { namaToko } = useLocalSearchParams();
  const auth = useAuth();
  const { produkList, loading } = useStock();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [totalCart, setTotalCart] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    auth?.logout();
    router.replace("/login");
  };

  useFocusEffect(
    useCallback(() => {
      setTotalCart(getTotalQty());
    }, [])
  );

  // Extract unique categories from produkList
  const categories = useMemo(() => {
    const cats = new Set<string>();
    produkList.forEach(p => cats.add(p.kategori || "Uncategorized"));
    return ["All Items", ...Array.from(cats)];
  }, [produkList]);

  // Filter products based on search and active category
  const filteredProducts = useMemo(() => {
    return produkList.filter(p => {
      const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All Items" || p.kategori === activeCategory || (!p.kategori && activeCategory === "Uncategorized");
      return matchesSearch && matchesCategory;
    });
  }, [produkList, searchQuery, activeCategory]);

  const handleAddToCart = (item: Produk) => {
    const result = addToCart({
      id: item.id,
      namaMenu: item.nama,
      harga: String(item.harga),
      kategori: item.kategori,
      stok: item.stok
    });

    if (result === "ok") {
      setTotalCart(getTotalQty());
      setToastMessage(`Berhasil menambahkan ${item.nama}`);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 1500);
    } else if (result === "stok_habis") {
      setInfoMessage(`Stok ${item.nama} sudah habis!`);
      setShowInfoModal(true);
    } else if (result === "stok_tidak_cukup") {
      setInfoMessage(`Stok ${item.nama} tidak cukup!`);
      setShowInfoModal(true);
    }
  };

  const renderProduct = ({ item }: { item: Produk }) => {
    // Determine image based on category (Food/Drink as fallback logic)
    const categoryLower = (item.kategori || "").toLowerCase();
    const isDrink = categoryLower === "minuman" || categoryLower.includes("drink") || categoryLower.includes("tea") || categoryLower.includes("coffee");
    const imageSource = isDrink 
      ? require("../../assets/images/Drink.png")
      : require("../../assets/images/Food.png");

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.productImage} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={1}>{item.nama}</Text>
          <Text style={{ fontSize: 11, color: '#99A8A4', marginBottom: 6 }}>Stok: {item.stok}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>Rp {item.harga.toLocaleString("id-ID")}</Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => handleAddToCart(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)} 
          style={styles.toastContainer}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn}>
           <Text style={{ fontSize: 24, color: '#333' }}>≡</Text>
        </TouchableOpacity>
        
        <Text style={styles.logoText}>recap</Text>

        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowLogoutModal(true)}>
          <Image 
            source={require("../../assets/images/Logout.png")} 
            style={{ width: 22, height: 22, tintColor: '#337066' }} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search menu..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <View style={styles.gridContainer}>
        {loading ? (
          <Text style={styles.emptyText}>Memuat menu...</Text>
        ) : filteredProducts.length === 0 ? (
          <Text style={styles.emptyText}>Menu tidak ditemukan.</Text>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            columnWrapperStyle={styles.rowWrapper}
            renderItem={renderProduct}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => {}}>
          <Image
            source={require("../../assets/images/home.png")}
            style={[styles.navIcon, { tintColor: "#3B82F6" }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push(`/cart?namaToko=${namaToko}` as any)}
        >
          <View style={styles.cartIconWrapper}>
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
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push(`/history?namaToko=${namaToko}` as any)}
        >
          <Image
            source={require("../../assets/images/History.png")}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} animationType="fade" transparent onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalOverlayCentered} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Image source={require("../../assets/images/Logout.png")} style={{ width: 40, height: 40, marginBottom: 12, tintColor: '#1A2E35' }} resizeMode="contain" />
            <Text style={styles.confirmTitle}>Keluar</Text>
            <Text style={styles.confirmDesc}>Yakin ingin keluar?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogoutModal(false)}><Text style={styles.cancelText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmResetBtn, { backgroundColor: "#4A6B5C" }]} onPress={confirmLogout}><Text style={styles.confirmResetText}>Keluar</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Info Modal */}
      <Modal visible={showInfoModal} animationType="fade" transparent onRequestClose={() => setShowInfoModal(false)}>
        <Pressable style={styles.modalOverlayCentered} onPress={() => setShowInfoModal(false)}>
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmIcon}>ℹ️</Text>
            <Text style={styles.confirmTitle}>Info</Text>
            <Text style={styles.confirmDesc}>{infoMessage}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmResetBtn, { backgroundColor: "#6C9484" }]} onPress={() => setShowInfoModal(false)}>
                <Text style={styles.confirmResetText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBFA" },
  
  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 15,
    backgroundColor: '#F8FBFA'
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#337066',
  },

  /* Search Bar */
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1A2E35',
  },

  /* Categories */
  categoryContainer: {
    marginBottom: 20,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: '#6C9484',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667A80',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },

  /* Product Grid */
  gridContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flatListContent: {
    paddingBottom: 100, // Make room for bottom nav
  },
  rowWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    paddingHorizontal: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E35',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 14,
    color: '#6C9484',
    fontWeight: '700',
  },
  addButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 18,
    lineHeight: 20,
    color: '#667A80',
    fontWeight: '400',
  },
  emptyText: {
    textAlign: 'center',
    color: '#99A8A4',
    fontSize: 15,
    marginTop: 40,
  },

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
    backgroundColor: "#E6F0FF", // light blue background
  },
  navIcon: { width: 22, height: 22, tintColor: "#99A8A4", marginBottom: 6 },
  navLabel: { fontSize: 11, fontWeight: "600", color: "#99A8A4" },
  navLabelActive: { color: "#3B82F6" }, // Match icon color
  cartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#E53E3E",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  /* Modal */
  modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  confirmBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '80%', maxWidth: 340, alignItems: 'center' },
  confirmIcon: { fontSize: 40, marginBottom: 12 },
  confirmTitle: { fontSize: 18, fontWeight: "700", color: "#1A2E35", marginBottom: 8 },
  confirmDesc: { fontSize: 14, color: "#667A80", textAlign: "center", marginBottom: 20 },
  confirmActions: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#f2f2f2", alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#888" },
  confirmResetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#e74c3c", alignItems: "center" },
  confirmResetText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  /* Toast Notification */
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#4A6D5E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
