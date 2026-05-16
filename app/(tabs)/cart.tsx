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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState("Semua");
  const [pesananCount, setPesananCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupTranslateY = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      const list = getMenuList();
      if (list.length > menuList.length && menuList.length !== 0) {
        setPesananCount((prev) => prev + (list.length - menuList.length));
        triggerPopup();
      }
      setMenuList(list);
    }, [menuList.length]),
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
    setPesananCount(getTotalQty());
    triggerPopup();
  };

  const totalCart = getTotalQty();

  const filteredMenu =
    activeTab === "Semua"
      ? menuList
      : menuList.filter((m) => m.kategori === activeTab);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const renderMenu = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuImageBox}>
        <Text style={styles.menuEmoji}>
          {item.kategori === "Makanan" ? "🍜" : "🥤"}
        </Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.namaMenu}</Text>
        <Text style={styles.menuKal}>55 cal</Text>
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
          <Text style={styles.popupText}>
            {pesananCount} pesanan ditambahkan
          </Text>
        </Animated.View>
      )}

      {/* FAB di luar topArea */}
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

      {/* Bottom Nav */}
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
        <TouchableOpacity style={styles.navItem}>
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
    backgroundColor: "#1B2A4A",
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
    color: "#1B2A4A",
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
    backgroundColor: "#1B2A4A",
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
    color: "#1B2A4A",
  },
  menuKal: {
    fontSize: 12,
    color: "#aaa",
  },
  menuHarga: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B2A4A",
    marginTop: 4,
  },
  menuAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#1B2A4A",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
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
    backgroundColor: "#1B2A4A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    cursor: "pointer",
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
    borderColor: "#1B2A4A",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  popupText: {
    color: "#1B2A4A",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#1B2A4A",
  },
  navItem: {
    alignItems: "center",
  },
  navIcon: {
    fontSize: 24,
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
