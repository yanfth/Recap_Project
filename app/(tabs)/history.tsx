import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getHistory, HistoryOrder } from "../store/historyStore";

export default function History() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();

  const [historyList, setHistoryList] = useState<HistoryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);

  // Reload every time screen is focused
  useFocusEffect(
    useCallback(() => {
      setHistoryList(getHistory());
    }, []),
  );

  const formatWaktu = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const metodeIcon = (metode: string) => {
    if (metode === "QRIS") return "📱";
    if (metode === "Cash") return "💵";
    return "💳";
  };

  const renderCard = ({
    item,
    index,
  }: {
    item: HistoryOrder;
    index: number;
  }) => (
    <Pressable
      style={styles.card}
      onPress={() => setSelectedOrder(item)}
      android_ripple={{ color: "#e8ecf4" }}
    >
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.cardContent}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.badgeRow}>
            <View style={styles.metodeBadge}>
              <Text style={styles.metodeBadgeText}>
                {metodeIcon(item.metodeBayar)} {item.metodeBayar}
              </Text>
            </View>
            <Text style={styles.nomorStruk}>{item.nomorStruk}</Text>
          </View>
          <Text style={styles.cardTotal}>
            Rp {item.totalHarga.toLocaleString("id-ID")}
          </Text>
        </View>

        {/* Items preview */}
        <Text style={styles.itemsPreview} numberOfLines={1}>
          {item.items.map((i) => `${i.namaMenu} x${i.qty}`).join("  ·  ")}
        </Text>

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <Text style={styles.waktuText}>🕐 {formatWaktu(item.waktu)}</Text>
          <Text style={styles.detailHint}>Lihat detail →</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* White top area */}
      <View style={styles.topArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Riwayat Pesanan</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Summary pill */}
        {historyList.length > 0 && (
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {historyList.length} pesanan selesai
            </Text>
            <Text style={styles.summaryTotal}>
              Total: Rp{" "}
              {historyList
                .reduce((acc, o) => acc + o.totalHarga, 0)
                .toLocaleString("id-ID")}
            </Text>
          </View>
        )}

        {/* List */}
        {historyList.length === 0 ? (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>
              Belum ada riwayat pesanan{"\n"}Selesaikan transaksi pertamamu!
            </Text>
          </View>
        ) : (
          <FlatList
            data={historyList}
            keyExtractor={(item) => item.nomorStruk}
            renderItem={renderCard}
            contentContainerStyle={{
              gap: 12,
              paddingTop: 16,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Dark bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>
          {historyList.length > 0
            ? `${historyList.length} transaksi tercatat`
            : "Riwayat transaksi kamu"}
        </Text>
      </View>

      {/* ===== DETAIL MODAL ===== */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedOrder(null)}
        >
          <Pressable style={styles.detailBox} onPress={() => {}}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header detail */}
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailNomor}>
                  {selectedOrder?.nomorStruk}
                </Text>
                <Text style={styles.detailWaktu}>
                  {selectedOrder ? formatWaktu(selectedOrder.waktu) : ""}
                </Text>
              </View>
              <View style={styles.detailMetodeBadge}>
                <Text style={styles.detailMetodeText}>
                  {selectedOrder ? metodeIcon(selectedOrder.metodeBayar) : ""}{" "}
                  {selectedOrder?.metodeBayar}
                </Text>
              </View>
            </View>

            <View style={styles.dashedLine} />

            {/* Items */}
            <ScrollView
              style={{ maxHeight: 220 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedOrder?.items.map((item) => (
                <View key={item.id} style={styles.detailItemRow}>
                  <Text style={styles.detailItemEmoji}>
                    {item.kategori === "Makanan" ? "🍜" : "🥤"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailItemName}>{item.namaMenu}</Text>
                    <Text style={styles.detailItemQty}>
                      Rp {parseInt(item.harga).toLocaleString("id-ID")} ×{" "}
                      {item.qty}
                    </Text>
                  </View>
                  <Text style={styles.detailItemTotal}>
                    Rp{" "}
                    {(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dashedLine} />

            {/* Total */}
            <View style={styles.detailTotalRow}>
              <Text style={styles.detailTotalLabel}>TOTAL BAYAR</Text>
              <Text style={styles.detailTotalValue}>
                Rp {selectedOrder?.totalHarga.toLocaleString("id-ID")}
              </Text>
            </View>

            {/* Tutup */}
            <TouchableOpacity
              style={styles.tutupBtn}
              onPress={() => setSelectedOrder(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.tutupText}>Tutup</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    padding: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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

  // Summary pill
  summaryPill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1B2A4A",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: "#aab8d4",
    fontWeight: "500",
  },
  summaryTotal: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },

  // Empty state
  emptyArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyText: {
    fontSize: 15,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 24,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1B2A4A",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  accentBar: {
    width: 5,
    backgroundColor: "#1B2A4A",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metodeBadge: {
    backgroundColor: "#eef0f5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  metodeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1B2A4A",
  },
  nomorStruk: {
    fontSize: 11,
    color: "#bbb",
  },
  cardTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B2A4A",
  },
  itemsPreview: {
    fontSize: 12,
    color: "#888",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  waktuText: {
    fontSize: 11,
    color: "#aaa",
  },
  detailHint: {
    fontSize: 11,
    color: "#1B2A4A",
    fontWeight: "600",
  },

  // Bottom bar
  bottomBar: {
    paddingVertical: 18,
    alignItems: "center",
  },
  bottomBarText: {
    fontSize: 13,
    color: "#4a6080",
    fontWeight: "500",
  },

  // ===== DETAIL MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  detailBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  detailNomor: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2A4A",
  },
  detailWaktu: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 3,
  },
  detailMetodeBadge: {
    backgroundColor: "#1B2A4A",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  detailMetodeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  dashedLine: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginVertical: 14,
  },
  detailItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  detailItemEmoji: { fontSize: 22 },
  detailItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B2A4A",
  },
  detailItemQty: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 1,
  },
  detailItemTotal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B2A4A",
  },
  detailTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1B2A4A",
    letterSpacing: 0.8,
  },
  detailTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B2A4A",
  },
  tutupBtn: {
    backgroundColor: "#1B2A4A",
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },
  tutupText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
