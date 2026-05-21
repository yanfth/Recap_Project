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
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addToCart, getTotalQty } from "../store/cartStore";
import { deleteMenuItem, editMenuItem, getMenuList } from "../store/menuStore";

type MenuItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
};

export default function Dashboard() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();

  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [totalCart, setTotalCart] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // State untuk edit menu
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editHarga, setEditHarga] = useState("");
  const [editKategori, setEditKategori] = useState<"Makanan" | "Minuman">(
    "Makanan",
  );

  // State untuk konfirmasi hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupTranslateY = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      setMenuList(getMenuList());
      setTotalCart(getTotalQty());
    }, []),
  );

  // ─── Popup animasi "item di keranjang" ───────────────────────────────────────
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

  // ─── Handler ─────────────────────────────────────────────────────────────────
  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    setTotalCart(getTotalQty());
    triggerPopup();
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditNama(item.namaMenu);
    setEditHarga(item.harga);
    setEditKategori(item.kategori as "Makanan" | "Minuman");
    setShowEditModal(true);
  };

  const handleDelete = (item: MenuItem) => {
    setActiveMenuId(null);
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    deleteMenuItem(deletingItem.id);
    setMenuList(getMenuList());
    setShowDeleteModal(false);
    setDeletingItem(null);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!editNama.trim() || !editHarga.trim()) return;
    editMenuItem(editingItem.id, {
      namaMenu: editNama.trim(),
      harga: editHarga.trim(),
      kategori: editKategori,
    });
    setMenuList(getMenuList());
    setShowEditModal(false);
    setEditingItem(null);
  };

  // ─── Filter & misc ────────────────────────────────────────────────────────────
  const filteredMenu = menuList
    .filter((m) => activeTab === "Semua" || m.kategori === activeTab)
    .filter((m) =>
      m.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  // ─── Render card menu ─────────────────────────────────────────────────────────
  const renderMenu = ({ item }: { item: MenuItem }) => {
    const isOpen = activeMenuId === item.id;

    return (
      <View style={styles.menuCard}>
        {/* Gambar kategori */}
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

        {/* Info menu */}
        <View style={styles.menuInfo}>
          <Text style={styles.menuName}>{item.namaMenu}</Text>
          <Text style={styles.menuKal}>Menu Tersedia</Text>
          <Text style={styles.menuHarga}>
            Rp {parseInt(item.harga).toLocaleString("id-ID")}
          </Text>
        </View>

        {/* Kolom kanan: titik tiga + tombol tambah */}
        <View style={styles.cardRight}>
          <View>
            <TouchableOpacity
              style={styles.dotsBtn}
              onPress={() => setActiveMenuId(isOpen ? null : item.id)}
            >
              <Text style={styles.dotsText}>⋮</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setActiveMenuId(null);
                    handleEdit(item);
                  }}
                >
                  <Text style={styles.dropdownEdit}>✏️ Edit</Text>
                </TouchableOpacity>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.dropdownDelete}>🗑️ Hapus</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Pressable
            style={styles.menuAddBtn}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.menuAddText}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topArea}>
        <Text style={styles.tokoName}>{namaToko}</Text>

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

        {/* Daftar menu atau placeholder kosong */}
        {filteredMenu.length === 0 ? (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyText}>
              Toko mu Masih Kosong{"\n"}Ayo tambahkan menu{"\n"}untuk tokomu
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
            style={{ overflow: "visible" }}
          />
        )}
      </View>

      {/* Popup notifikasi item ditambahkan */}
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
          <Text style={styles.popupText}>{totalCart} item di keranjang</Text>
        </Animated.View>
      )}

      {/* FAB tambah menu */}
      <Animated.View
        style={[styles.fabWrap, { transform: [{ scale: scaleAnim }] }]}
      >
        <Pressable
          style={styles.fab}
          onPress={() => router.push(`/addmenu?namaToko=${namaToko}`)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Animated.View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../../assets/images/home.png")}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push(`/cart?namaToko=${namaToko}`)}
        >
          <View>
            <Image
              source={require("../../assets/images/cart.png")}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            {totalCart > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCart}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push(`/history?namaToko=${namaToko}`)}
        >
          <Image
            source={require("../../assets/images/History.png")}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable style={styles.deleteBox} onPress={() => {}}>
            <Text style={styles.deleteIcon}>🗑️</Text>
            <Text style={styles.deleteTitle}>Hapus Menu</Text>
            <Text style={styles.deleteDesc}>
              Yakin ingin menghapus{"\n"}
              <Text style={styles.deleteItemName}>
                "{deletingItem?.namaMenu}"
              </Text>
              ?
            </Text>
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Edit Menu */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable style={styles.editBox} onPress={() => {}}>
            <Text style={styles.editTitle}>Edit Menu</Text>

            <Text style={styles.label}>Nama Menu</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama menu"
              value={editNama}
              onChangeText={setEditNama}
            />

            <Text style={styles.label}>Harga</Text>
            <TextInput
              style={styles.input}
              placeholder="Harga"
              keyboardType="numeric"
              value={editHarga}
              onChangeText={setEditHarga}
            />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.kategoriRow}>
              {(["Makanan", "Minuman"] as const).map((kat) => (
                <TouchableOpacity
                  key={kat}
                  style={[
                    styles.kategoriBtn,
                    editKategori === kat && styles.kategoriBtnActive,
                  ]}
                  onPress={() => setEditKategori(kat)}
                >
                  <Text
                    style={[
                      styles.kategoriText,
                      editKategori === kat && styles.kategoriTextActive,
                    ]}
                  >
                    {kat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4B2E2B",
  },
  topArea: {
    flex: 1,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 28,
    paddingTop: 48,
  },
  tokoName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4B2E2B",
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#f2f2f2",
  },
  tabActive: {
    backgroundColor: "#4B2E2B",
  },
  tabText: {
    fontSize: 13,
    color: "#888",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  emptyArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 26,
  },

  // ─── Search Bar ──────────────────────────────────────────────────────────────
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
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#4B2E2B",
    paddingVertical: 0,
  },
  searchClear: {
    fontSize: 14,
    color: "#bbb",
    fontWeight: "600",
    paddingLeft: 4,
  },

  // ─── Menu Card ───────────────────────────────────────────────────────────────
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
    overflow: "visible",
  },
  menuImageBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
  },
  menuCategoryIcon: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },
  menuInfo: {
    flex: 1,
    gap: 2,
  },
  menuName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B2E2B",
  },
  menuKal: {
    fontSize: 12,
    color: "#aaa",
  },
  menuHarga: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B2E2B",
    marginTop: 4,
  },

  // ─── Kolom kanan card ────────────────────────────────────────────────────────
  cardRight: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    overflow: "visible",
    zIndex: 10,
  },
  dotsBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  dotsText: {
    fontSize: 18,
    color: "#4B2E2B",
    lineHeight: 20,
  },
  dropdown: {
    position: "absolute",
    top: 0,
    right: 36,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 120,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownEdit: {
    fontSize: 13,
    color: "#E65100",
    fontWeight: "600",
  },
  dropdownDelete: {
    fontSize: 13,
    color: "#C62828",
    fontWeight: "600",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 8,
  },
  menuAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#4B2E2B",
    alignItems: "center",
    justifyContent: "center",
  },
  menuAddText: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 22,
  },

  // ─── FAB ─────────────────────────────────────────────────────────────────────
  fabWrap: {
    position: "absolute",
    bottom: 90,
    right: 28,
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
  fabText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 32,
  },

  // ─── Popup ───────────────────────────────────────────────────────────────────
  popup: {
    position: "absolute",
    bottom: 90,
    left: 28,
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
  popupText: {
    color: "#4B2E2B",
    fontSize: 14,
    fontWeight: "500",
  },

  // ─── Bottom Nav ──────────────────────────────────────────────────────────────
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#4B2E2B",
  },
  navItem: {
    alignItems: "center",
  },
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
  cartBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  // ─── Modal Overlay (shared) ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Modal Hapus ─────────────────────────────────────────────────────────────
  deleteBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "80%",
    maxWidth: 360,
    alignItems: "center",
  },
  deleteIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B2E2B",
    marginBottom: 8,
  },
  deleteDesc: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },
  deleteItemName: {
    fontWeight: "700",
    color: "#4B2E2B",
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#C62828",
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // ─── Modal Edit ──────────────────────────────────────────────────────────────
  editBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4B2E2B",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B2E2B",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#4B2E2B",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  kategoriRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  kategoriBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  kategoriBtnActive: {
    backgroundColor: "#4B2E2B",
  },
  kategoriText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  kategoriTextActive: {
    color: "#fff",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#4B2E2B",
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
