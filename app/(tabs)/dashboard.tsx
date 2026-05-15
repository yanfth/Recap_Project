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
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

  useFocusEffect(
    useCallback(() => {
      setMenuList(getMenuList());
    }, []),
  );

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
      <TouchableOpacity style={styles.menuAddBtn}>
        <Text style={styles.menuAddText}>+</Text>
      </TouchableOpacity>
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
              paddingBottom: 80,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}

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
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🛒</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🕐</Text>
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
  },
  menuAddText: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 22,
  },
  fabWrap: {
    position: "absolute",
    bottom: 24,
    right: 24,
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
});
