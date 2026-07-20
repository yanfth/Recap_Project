import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { clearCart, getCart, getTotalHarga } from "../store/cartStore";
import { addToHistory } from "../store/historyStore";
import { editMenuItem, getMenuList } from "../store/menuStore";
import { useAuth } from "../context/AuthContext";

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
  const auth = useAuth();

  const cartList: CartItem[] = getCart();
  const totalHarga: number = getTotalHarga();

  const [metodeBayar, setMetodeBayar] = useState<MetodeBayar>(null);
  const [showStruk, setShowStruk] = useState(false);
  const [uangDiterima, setUangDiterima] = useState("");
  const [printLoading, setPrintLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

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

  // Hitung kembalian
  const uangInt = parseInt(uangDiterima.replace(/\D/g, ""), 10) || 0;
  const kembalian = uangInt - totalHarga;
  const uangKurang = kembalian < 0;
  const cashValid = metodeBayar === "Cash" ? uangInt >= totalHarga : true;

  const handleUangChange = (val: string) => {
    // Format ribuan otomatis
    const angka = val.replace(/\D/g, "");
    if (!angka) {
      setUangDiterima("");
      return;
    }
    const formatted = parseInt(angka, 10).toLocaleString("id-ID");
    setUangDiterima(formatted);
  };

  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleBayar = () => {
    if (!metodeBayar) return;
    if (metodeBayar === "Cash" && !cashValid) return;
    setShowStruk(true);
  };

  const handleCetak = async () => {
    setPrintLoading(true);
    try {
      // Coba import expo-print secara dinamis
      // Kalau tidak ada, fallback ke alert
      const expoPrint = await import("expo-print").catch(() => null);

      if (expoPrint) {
        const htmlStruk = `
          <html>
          <head>
            <style>
              body { font-family: monospace; width: 300px; margin: 0 auto; font-size: 12px; }
              h2 { text-align: center; font-size: 16px; margin: 8px 0; }
              .center { text-align: center; }
              .row { display: flex; justify-content: space-between; margin: 3px 0; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              .total { font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>
            <h2>${namaToko}</h2>
            <p class="center">${waktuBayar}</p>
            <p class="center">No: ${nomorStruk}</p>
            <div class="divider"></div>
            ${cartList
              .map(
                (item) => `
              <div class="row">
                <span>${item.namaMenu} x${item.qty}</span>
                <span>Rp ${(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}</span>
              </div>`,
              )
              .join("")}
            <div class="divider"></div>
            <div class="row total">
              <span>TOTAL</span>
              <span>Rp ${totalHarga.toLocaleString("id-ID")}</span>
            </div>
            ${
              metodeBayar === "Cash"
                ? `
            <div class="row"><span>Bayar</span><span>Rp ${uangDiterima}</span></div>
            <div class="row"><span>Kembalian</span><span>Rp ${kembalian.toLocaleString("id-ID")}</span></div>`
                : ""
            }
            <div class="divider"></div>
            <p class="center">Metode: ${metodeBayar}</p>
            <p class="center">Terima kasih! 🙏</p>
          </body>
          </html>
        `;
        await expoPrint.printAsync({ html: htmlStruk });
        showToastMsg("Struk berhasil dikirim ke printer");
      } else {
        // Fallback: tampilkan alert jika expo-print belum diinstall
        Alert.alert(
          "Info",
          "Untuk mencetak struk, install expo-print:\nnpx expo install expo-print\n\nAtau hubungkan printer Bluetooth.",
          [{ text: "OK" }],
        );
      }
    } catch (err) {
      showToastMsg("Gagal mencetak struk");
    } finally {
      setPrintLoading(false);
    }
  };

  const handleSelesai = async () => {
    const menuList = await getMenuList();

    for (const cartItem of cartList) {
      const produk = menuList.find((m) => m.namaMenu === cartItem.namaMenu);
      if (produk) {
        const stokBaru = Math.max(0, (produk.stok ?? 0) - cartItem.qty);
        await editMenuItem(produk.id, { stok: stokBaru });
      }
    }

    await addToHistory({
      nomorStruk,
      namaToko: namaToko as string,
      items: cartList,
      totalHarga,
      metodeBayar: metodeBayar!,
      waktu: new Date().toISOString(),
    });
    clearCart();
    setShowStruk(false);
    if (auth?.role === "owner") {
      router.push(`/Dashboard-owner?namaToko=${namaToko}` as any);
    } else {
      router.push(`/Dashboard-kasir?namaToko=${namaToko}` as any);
    }
  };

  // Tombol bayar aktif?
  const bayarAktif = !!metodeBayar && cashValid;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Toast */}
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

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

            {/* Input uang pelanggan — muncul saat pilih Cash */}
            {metodeBayar === "Cash" && (
              <View style={styles.cashInputBox}>
                <Text style={styles.cashInputLabel}>
                  Uang Diterima dari Pelanggan
                </Text>
                <View style={styles.cashInputRow}>
                  <Text style={styles.cashPrefix}>Rp</Text>
                  <TextInput
                    style={styles.cashInput}
                    placeholder="0"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    value={uangDiterima}
                    onChangeText={handleUangChange}
                  />
                </View>

                {/* Tombol nominal cepat */}
                <View style={styles.nominalRow}>
                  {[5000, 10000, 20000, 50000, 100000].map((nom) => (
                    <TouchableOpacity
                      key={nom}
                      style={styles.nominalBtn}
                      onPress={() =>
                        setUangDiterima(nom.toLocaleString("id-ID"))
                      }
                    >
                      <Text style={styles.nominalText}>
                        {nom >= 1000 ? `${nom / 1000}rb` : nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Kembalian */}
                {uangDiterima !== "" && (
                  <View
                    style={[
                      styles.kembalianBox,
                      uangKurang
                        ? styles.kembalianKurang
                        : styles.kembalianCukup,
                    ]}
                  >
                    {uangKurang ? (
                      <Text style={styles.kembalianKurangText}>
                        ⚠ Uang kurang Rp{" "}
                        {Math.abs(kembalian).toLocaleString("id-ID")}
                      </Text>
                    ) : (
                      <View style={styles.kembalianRow}>
                        <Text style={styles.kembalianLabel}>Kembalian</Text>
                        <Text style={styles.kembalianValue}>
                          Rp {kembalian.toLocaleString("id-ID")}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

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
          style={[styles.bayarBtn, !bayarAktif && styles.bayarBtnDisabled]}
          onPress={handleBayar}
          disabled={!bayarAktif}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.bayarText, !bayarAktif && styles.bayarTextDisabled]}
          >
            {!metodeBayar
              ? "Pilih Metode Dulu"
              : metodeBayar === "Cash" && !cashValid
                ? "Uang Kurang"
                : `Bayar dengan ${metodeBayar}`}
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

            <View style={styles.dashedLine} />

            {/* Total + Kembalian (jika Cash) */}
            <View style={styles.strukTotalRow}>
              <Text style={styles.strukTotalLabel}>TOTAL</Text>
              <Text style={styles.strukTotalValue}>
                Rp {totalHarga.toLocaleString("id-ID")}
              </Text>
            </View>

            {metodeBayar === "Cash" && uangDiterima !== "" && (
              <>
                <View style={[styles.infoRow, { marginTop: 4 }]}>
                  <Text style={styles.infoKey}>Bayar</Text>
                  <Text style={styles.infoVal}>Rp {uangDiterima}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoKey, { color: "#4B2E2B" }]}>
                    Kembalian
                  </Text>
                  <Text
                    style={[
                      styles.infoVal,
                      { color: "#4B2E2B", fontWeight: "700" },
                    ]}
                  >
                    Rp {kembalian.toLocaleString("id-ID")}
                  </Text>
                </View>
              </>
            )}

            <Text style={styles.strukFooter}>
              Selamat menikmati pesanan Anda 🙏
            </Text>

            {/* Tombol Cetak + Selesai */}
            <View style={styles.btnRow}>
              {/* Tombol Cetak Struk */}
              <TouchableOpacity
                style={styles.cetakBtn}
                onPress={handleCetak}
                activeOpacity={0.75}
                disabled={printLoading}
              >
                <Image source={require("../../assets/images/Print.png")} style={{ width: 18, height: 18, tintColor: "#4B2E2B", marginRight: 4 }} resizeMode="contain" />
                <Text style={styles.cetakText}>
                  {printLoading ? "Mencetak..." : "Cetak Struk"}
                </Text>
              </TouchableOpacity>

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
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4B2E2B" },

  // Toast
  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 999,
  },
  toastText: { color: "#fff", fontSize: 13 },

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
  backIcon: { width: 24, height: 24 },
  title: { fontSize: 18, fontWeight: "bold", color: "#4B2E2B" },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
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
  metodeCardActive: { borderColor: "#4B2E2B", backgroundColor: "#eef0f5" },
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
  metodeName: { fontSize: 15, fontWeight: "600", color: "#555" },
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

  // ===== CASH INPUT =====
  cashInputBox: {
    backgroundColor: "#fdf8f6",
    borderRadius: 14,
    padding: 14,
    marginTop: -4,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#e8d8d4",
  },
  cashInputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B2E2B",
    marginBottom: 8,
  },
  cashInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#d4b8b0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  cashPrefix: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4B2E2B",
    marginRight: 6,
  },
  cashInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#4B2E2B",
    padding: 0,
  },
  nominalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  nominalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d4b8b0",
  },
  nominalText: { fontSize: 12, color: "#4B2E2B", fontWeight: "600" },
  kembalianBox: {
    borderRadius: 10,
    padding: 10,
  },
  kembalianCukup: { backgroundColor: "#e8f5e9" },
  kembalianKurang: { backgroundColor: "#fff3e0" },
  kembalianRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kembalianLabel: { fontSize: 13, color: "#2e7d32", fontWeight: "600" },
  kembalianValue: { fontSize: 16, color: "#2e7d32", fontWeight: "800" },
  kembalianKurangText: { fontSize: 13, color: "#e65100", fontWeight: "600" },

  // QRIS
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

  // Bottom
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
  bottomLabel: { fontSize: 15, color: "#fff", fontWeight: "500" },
  bottomHarga: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  bayarBtn: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  bayarBtnDisabled: { backgroundColor: "#2a2323ff" },
  bayarText: { color: "#4B2E2B", fontSize: 16, fontWeight: "600" },
  bayarTextDisabled: { color: "#fff" },

  // Modal
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
  strukHeader: { alignItems: "center", marginBottom: 16 },
  checkmarkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e8ecf4",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkIcon: { width: 48, height: 48 },
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
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoKey: { fontSize: 13, color: "#aaa" },
  infoVal: { fontSize: 13, fontWeight: "600", color: "#4B2E2B" },
  strukItems: { gap: 8 },
  strukItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strukItemName: { fontSize: 13, color: "#333", flex: 1, marginRight: 8 },
  strukItemQty: { color: "#aaa" },
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
  strukTotalValue: { fontSize: 18, fontWeight: "bold", color: "#4B2E2B" },
  strukFooter: {
    textAlign: "center",
    fontSize: 13,
    color: "#dbdbdb",
    marginTop: 16,
    marginBottom: 20,
  },

  // Tombol row bawah struk
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  cetakBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#4B2E2B",
    backgroundColor: "#fff",
  },
  cetakIcon: { fontSize: 16 },
  cetakText: { color: "#4B2E2B", fontSize: 14, fontWeight: "600" },
  selesaiBtn: {
    flex: 2,
    backgroundColor: "#4B2E2B",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  selesaiText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
