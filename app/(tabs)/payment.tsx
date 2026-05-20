import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { clearCart, getCart, getTotalHarga } from "../store/cartStore";
import { addToHistory } from "../store/historyStore";

type CartItem = {
  id: string;
  namaMenu: string;
  harga: string;
  kategori: string;
  qty: number;
};

type MetodeBayar = "Cash" | "QRIS" | null;

export default function Payment() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();

  const cartList: CartItem[] = getCart();
  const totalHarga: number = getTotalHarga();

  const [metodeBayar, setMetodeBayar] = useState<MetodeBayar>(null);
  const [showStruk, setShowStruk] = useState(false);
  const [nomorStruk] = useState(() => "INV-" + Date.now().toString().slice(-8));
  const [waktuBayar] = useState(() => {
    const now = new Date();
    return now.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const handleBayar = () => {
    if (!metodeBayar) return;
    setShowStruk(true);
  };

  // Yang baru
  const handleSelesai = () => {
    addToHistory({
      nomorStruk,
      namaToko: namaToko as string,
      items: cartList,
      totalHarga,
      metodeBayar: metodeBayar!,
      waktu: new Date().toISOString(),
    });
    clearCart();
    setShowStruk(false);
    router.push(`/dashboard?namaToko=${namaToko}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Area Putih */}
      <View style={styles.topArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image
              source={require("../../assets/images/arrow-back.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Pembayaran</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Ringkasan Pesanan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
            {cartList.map((item) => (
              <View key={item.id} style={styles.orderRow}>
                <Image
                  source={
                    item.kategori === "Makanan"
                      ? require("../../assets/images/Food.png")
                      : require("../../assets/images/Drink.png")
                  }
                  style={styles.orderImage}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderName}>{item.namaMenu}</Text>
                  <Text style={styles.orderQty}>x{item.qty}</Text>
                </View>
                <Text style={styles.orderHarga}>
                  Rp {(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                Rp {totalHarga.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>

          {/* Pilih Metode Pembayaran */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metode Pembayaran</Text>

            {/* Cash */}
            <Pressable
              style={[
                styles.metodeCard,
                metodeBayar === "Cash" && styles.metodeCardActive,
              ]}
              onPress={() => setMetodeBayar("Cash")}
            >
              <View style={styles.metodeIcon}>
                <Image
                  source={require("../../assets/images/Cash.png")}
                  style={styles.metodeImage}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.metodeName,
                    metodeBayar === "Cash" && styles.metodeNameActive,
                  ]}
                >
                  Cash
                </Text>
                <Text style={styles.metodeDesc}>Bayar langsung di kasir</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  metodeBayar === "Cash" && styles.radioOuterActive,
                ]}
              >
                {metodeBayar === "Cash" && <View style={styles.radioInner} />}
              </View>
            </Pressable>

            {/* QRIS */}
            <Pressable
              style={[
                styles.metodeCard,
                metodeBayar === "QRIS" && styles.metodeCardActive,
              ]}
              onPress={() => setMetodeBayar("QRIS")}
            >
              <View style={styles.metodeIcon}>
                <Image
                  source={require("../../assets/images/Qr.png")}
                  style={styles.metodeImage}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.metodeName,
                    metodeBayar === "QRIS" && styles.metodeNameActive,
                  ]}
                >
                  QRIS
                </Text>
                <Text style={styles.metodeDesc}>
                  Scan QR — GoPay, OVO, Dana, dll
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  metodeBayar === "QRIS" && styles.radioOuterActive,
                ]}
              >
                {metodeBayar === "QRIS" && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          </View>

          {/* QR Placeholder kalau pilih QRIS */}
          {metodeBayar === "QRIS" && (
            <View style={styles.qrisBox}>
              <Text style={styles.qrisTitle}>Scan QR Berikut</Text>
              {/* QR Placeholder */}
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrText}>▦</Text>
              </View>
              <Text style={styles.qrisHint}>
                Arahkan kamera ke QR code di atas
              </Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* Bottom Area */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomLabel}>Total Pembayaran</Text>
          <Text style={styles.bottomHarga}>
            Rp {totalHarga.toLocaleString("id-ID")}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bayarBtn, !metodeBayar && styles.bayarBtnDisabled]}
          onPress={handleBayar}
          disabled={!metodeBayar}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.bayarText, !metodeBayar && styles.bayarTextDisabled]}
          >
            {metodeBayar ? `Bayar dengan ${metodeBayar}` : "Pilih Metode Dulu"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== MODAL STRUK ===== */}
      <Modal
        visible={showStruk}
        animationType="slide"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.strukBox}>
            {/* Header Struk */}
            <View style={styles.strukHeader}>
              <View style={styles.checkmarkCircle}>
                <Image
                  source={require("../../assets/images/Check.png")}
                  style={styles.checkmarkIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.strukSuccessText}>Pembayaran Berhasil!</Text>
              <Text style={styles.strukSubText}>
                Terima kasih telah memesan
              </Text>
            </View>

            {/* Garis putus-putus */}
            <View style={styles.dashedLine} />

            {/* Info Struk */}
            <View style={styles.strukBody}>
              <Text style={styles.namaTokoStruk}>{namaToko}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>No. Pesanan</Text>
                <Text style={styles.infoVal}>{nomorStruk}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Waktu</Text>
                <Text style={styles.infoVal}>{waktuBayar}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Metode</Text>
                <Text style={styles.infoVal}>{metodeBayar}</Text>
              </View>
            </View>

            {/* Garis putus-putus */}
            <View style={styles.dashedLine} />

            {/* Item List */}
            <View style={styles.strukItems}>
              {cartList.map((item) => (
                <View key={item.id} style={styles.strukItemRow}>
                  <Text style={styles.strukItemName} numberOfLines={1}>
                    {item.namaMenu}{" "}
                    <Text style={styles.strukItemQty}>x{item.qty}</Text>
                  </Text>
                  <Text style={styles.strukItemHarga}>
                    Rp{" "}
                    {(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}
                  </Text>
                </View>
              ))}
            </View>

            {/* Garis putus-putus */}
            <View style={styles.dashedLine} />

            {/* Total */}
            <View style={styles.strukTotalRow}>
              <Text style={styles.strukTotalLabel}>TOTAL</Text>
              <Text style={styles.strukTotalValue}>
                Rp {totalHarga.toLocaleString("id-ID")}
              </Text>
            </View>

            {/* Footer struk */}
            <Text style={styles.strukFooter}>
              Selamat menikmati pesanan Anda 🙏
            </Text>

            {/* Tombol Selesai */}
            <TouchableOpacity
              style={styles.selesaiBtn}
              onPress={handleSelesai}
              activeOpacity={0.85}
            >
              <Text style={styles.selesaiText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B2E2B",
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Order rows
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  orderImage: { width: 30, height: 30 },
  orderName: { fontSize: 14, fontWeight: "600", color: "#4B2E2B" },
  orderQty: { fontSize: 12, color: "#aaa" },
  orderHarga: { fontSize: 14, fontWeight: "600", color: "#4B2E2B" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#4B2E2B" },
  totalValue: { fontSize: 16, fontWeight: "bold", color: "#4B2E2B" },

  // Metode Card
  metodeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 12,
  },
  metodeCardActive: {
    borderColor: "#4B2E2B",
    backgroundColor: "#eef0f5",
  },
  metodeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metodeImage: { width: 32, height: 32 },
  metodeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  metodeNameActive: { color: "#4B2E2B" },
  metodeDesc: { fontSize: 12, color: "#aaa", marginTop: 1 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: "#4B2E2B" },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#4B2E2B",
  },

  // QRIS Box
  qrisBox: {
    backgroundColor: "#f8f9fb",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  qrisTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B2E2B",
    marginBottom: 14,
  },
  qrPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12,
  },
  qrText: { fontSize: 80, color: "#4B2E2B" },
  qrisHint: { fontSize: 12, color: "#aaa" },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: "#4B2E2B",
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  bottomTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomLabel: { fontSize: 15, color: "#ffffffff", fontWeight: "500" },
  bottomHarga: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  bayarBtn: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  bayarBtnDisabled: { backgroundColor: "#2a2323ff" },
  bayarText: { color: "#4B2E2B", fontSize: 16, fontWeight: "600" },
  bayarTextDisabled: { color: "#ffffffff" },

  // ===== STRUK MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  strukBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  },
  strukHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  checkmarkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e8ecf4",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkIcon: {
    width: 48,
    height: 48,
  },
  strukSuccessText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4B2E2B",
    marginBottom: 4,
  },
  strukSubText: { fontSize: 13, color: "#aaa" },

  dashedLine: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 14,
  },

  strukBody: { gap: 8 },
  namaTokoStruk: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B2E2B",
    marginBottom: 4,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoKey: { fontSize: 13, color: "#aaa" },
  infoVal: { fontSize: 13, fontWeight: "600", color: "#4B2E2B" },

  strukItems: { gap: 8 },
  strukItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strukItemName: {
    fontSize: 13,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  strukItemQty: { color: "#fff" },
  strukItemHarga: { fontSize: 13, fontWeight: "600", color: "#4B2E2B" },

  strukTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strukTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4B2E2B",
    letterSpacing: 1,
  },
  strukTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B2E2B",
  },

  strukFooter: {
    textAlign: "center",
    fontSize: 13,
    color: "#dbdbdbff",
    marginTop: 16,
    marginBottom: 20,
  },

  selesaiBtn: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  selesaiText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
