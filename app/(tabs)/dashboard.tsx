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

export default function Dashboard() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();

  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [totalCart, setTotalCart] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupTranslateY = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      setMenuList(getMenuList());
      setTotalCart(getTotalQty());
    }, []),
  );

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
    const newTotal = getTotalQty();
    setTotalCart(newTotal);
    triggerPopup();
  };

  const filteredMenu =
    activeTab === "Semua"
      ? menuList
      : menuList.filter((m) => m.kategori === activeTab);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();

  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const renderMenu = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuImageBox}>
        <Text style={styles.menuEmoji}>
          {item.kategori === "Makanan" ? "🍜" : "🥤"}
        </Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.namaMenu}</Text>
        <Text style={styles.menuKal}>Menu Tersedia</Text>
        <Text style={styles.menuHarga}>
          Rp {parseInt(item.harga).toLocaleString("id-ID")}
        </Text>
      </View>
      <Pressable
        style={styles.menuAddBtn}
        onPress={() => handleAddToCart(item)}
      >
        <Text style={styles.menuAddText}>+</Text>
      </Pressable>
    </View>
  );

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
  menuEmoji: {
    fontSize: 36,
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
});
