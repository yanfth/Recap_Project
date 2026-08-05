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
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCart, getTotalHarga, removeFromCart, addToCart, decreaseCartQty } from "../store/cartStore";

type CartItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
  qty: number;
  stok: number;
};

export default function Cart() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();
  const [cartList, setCartList] = useState<CartItem[]>([]);
  const [totalHarga, setTotalHarga] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setCartList(getCart());
      setTotalHarga(getTotalHarga());
    }, []),
  );

  const handleHapus = (id: string) => {
    removeFromCart(id);
    setCartList(getCart());
    setTotalHarga(getTotalHarga());
  };

  const handleIncrease = (item: CartItem) => {
    addToCart(item as any);
    setCartList(getCart());
    setTotalHarga(getTotalHarga());
  };

  const handleDecrease = (id: string) => {
    decreaseCartQty(id);
    setCartList(getCart());
    setTotalHarga(getTotalHarga());
  };

  const handleBayar = () => {
    router.push(`/payment?namaToko=${namaToko}`);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const isFood = item.kategori === "Makanan";
    const imageSource = isFood
      ? require("../../assets/images/Food.png")
      : require("../../assets/images/Drink.png");

    return (
      <View style={styles.card}>
        <View style={styles.cardImageContainer}>
          <Image source={imageSource} style={styles.cardImage} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.namaMenu}</Text>
          <Text style={styles.cardHarga}>
            Rp {parseInt(item.harga).toLocaleString("id-ID")}
          </Text>
          
          <View style={styles.actionRow}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => handleDecrease(item.id)}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.qty}</Text>
              <TouchableOpacity style={styles.qtyBtnGreen} onPress={() => handleIncrease(item)}>
                <Text style={styles.qtyBtnTextGreen}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardTotal}>
              Rp {(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.hapusBtn} onPress={() => handleHapus(item.id)}>
          <Text style={styles.hapusText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image
              source={require("../../assets/images/arrow-back.png")}
              style={styles.backBtn}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Keranjang</Text>
          <View style={{ width: 24 }} />
        </View>

        {cartList.length === 0 ? (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyText}>
              Keranjang masih kosong{"\n"}Tambahkan menu terlebih dahulu
            </Text>
          </View>
        ) : (
          <FlatList
            data={cartList}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              gap: 12,
              paddingTop: 16,
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Pesanan</Text>
          <Text style={styles.totalHarga}>
            Rp {totalHarga.toLocaleString("id-ID")}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bayarBtn,
            cartList.length === 0 && styles.bayarBtnDisabled,
          ]}
          onPress={handleBayar}
          disabled={cartList.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.bayarText}>Lanjut ke Pembayaran</Text>
        </TouchableOpacity>
        
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/Dashboard-kasir" as any)}>
            <Image source={require("../../assets/images/home.png")} style={styles.navIcon} resizeMode="contain" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
            <View style={styles.cartIconWrapper}>
              <Image source={require("../../assets/images/cart.png")} style={[styles.navIcon, { tintColor: "#3B82F6" }]} resizeMode="contain" />
              {cartList.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartList.reduce((acc, curr) => acc + curr.qty, 0)}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, styles.navLabelActive]}>Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.replace(`/history?namaToko=${namaToko}` as any)}>
            <Image source={require("../../assets/images/History.png")} style={styles.navIcon} resizeMode="contain" />
            <Text style={styles.navLabel}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#202528",
  },
  topArea: {
    flex: 1,
    backgroundColor: "#F9FAF9",
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    width: 24,
    height: 24,
    tintColor: "#444",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    marginRight: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  cardHarga: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "500",
  },
  qtyBtnGreen: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DDF3EB",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnTextGreen: {
    color: "#337066",
    fontSize: 16,
    fontWeight: "500",
  },
  qtyText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  cardTotal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
  },
  hapusBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  hapusText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 15,
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 110, // Leave room for bottom nav
    paddingHorizontal: 24,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  totalHarga: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  bayarBtn: {
    backgroundColor: "#6C9484",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  bayarBtnDisabled: {
    backgroundColor: "#ccc",
  },
  bayarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: "#E6F0FF",
  },
  navIcon: { width: 22, height: 22, tintColor: "#99A8A4", marginBottom: 6 },
  navLabel: { fontSize: 11, fontWeight: "600", color: "#99A8A4" },
  navLabelActive: { color: "#3B82F6" },
  cartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
