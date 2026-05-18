import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCart, getTotalHarga, removeFromCart } from "../store/cartStore";

type CartItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
  qty: number;
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

  const handleBayar = () => {
    router.push(`/payment?namaToko=${namaToko}`);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Text style={styles.cardEmoji}>
          {item.kategori === "Makanan" ? "🍜" : "🥤"}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.namaMenu}</Text>
        <Text style={styles.cardHarga}>
          Rp {parseInt(item.harga).toLocaleString("id-ID")} x {item.qty}
        </Text>
        <Text style={styles.cardTotal}>
          Rp {(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}
        </Text>
      </View>
      <Pressable style={styles.hapusBtn} onPress={() => handleHapus(item.id)}>
        <Text style={styles.hapusText}>✕</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Area putih */}
      <View style={styles.topArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            {/* <img
              style={styles.backBtn}
              src="../../assets/images/arrowleft.png"
              alt=""
            /> */}
            <Text style={styles.backBtn}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Keranjang</Text>
          <View style={{ width: 60 }} />
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

      {/* Area biru bawah */}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backBtn: {
    fontSize: 14,
    color: "#1B2A4A",
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B2A4A",
  },
  emptyArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 26,
  },
  card: {
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
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 30,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1B2A4A",
  },
  cardHarga: {
    fontSize: 12,
    color: "#aaa",
  },
  cardTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B2A4A",
    marginTop: 2,
  },
  hapusBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  hapusText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "bold",
  },
  bottomSheet: {
    backgroundColor: "#1B2A4A",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 28,
    paddingBottom: 40,
    gap: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    color: "#aab8d4",
    fontWeight: "500",
  },
  totalHarga: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  bayarBtn: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  bayarBtnDisabled: {
    backgroundColor: "#4a5e7a",
  },
  bayarText: {
    color: "#1B2A4A",
    fontSize: 16,
    fontWeight: "600",
  },
});
