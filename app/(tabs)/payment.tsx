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
    return now.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
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
      const expoPrint = await import("expo-print").catch(() => null);

      if (expoPrint) {
        const htmlStruk = `
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                background-color: #f4f7f8; 
                margin: 0; 
                padding: 40px 20px; 
                display: flex; 
                justify-content: center; 
              }
              .receipt {
                background: #fff;
                width: 100%;
                max-width: 380px;
                border-radius: 16px;
                padding: 32px 24px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                color: #333;
              }
              h2 { 
                text-align: center; 
                font-size: 28px; 
                font-weight: 800; 
                margin: 0 0 12px 0; 
                color: #4A6B5C; 
              }
              .subtext { 
                text-align: center; 
                font-size: 13px; 
                color: #555; 
                margin: 2px 0; 
              }
              .row { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin: 12px 0; 
              }
              .divider { 
                border-top: 1px dashed #e0e0e0; 
                margin: 20px 0; 
              }
              .item-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
              .item-sub { font-size: 12px; color: #777; }
              .item-total { font-size: 14px; font-weight: 600; }
              .summary-label { font-size: 14px; color: #555; }
              .summary-val { font-size: 14px; color: #555; }
              .total-label { font-size: 18px; font-weight: 800; color: #222; }
              .total-val { font-size: 20px; font-weight: 800; color: #4A6B5C; }
              .footer-icon { text-align: center; font-size: 20px; color: #4A6B5C; margin-bottom: 8px; }
              .footer-text { text-align: center; font-size: 14px; color: #555; margin: 4px 0; }
              .footer-sub { text-align: center; font-size: 12px; color: #888; margin: 0; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <h2>recap</h2>
              <p class="subtext">Store #402 - ${namaToko}</p>
              <p class="subtext">${waktuBayar}</p>
              <p class="subtext" style="margin-top: 6px;">TXN: ${nomorStruk}</p>
              
              <div class="divider"></div>
              
              ${cartList
                .map(
                  (item) => `
                <div class="row" style="align-items: flex-start;">
                  <div style="flex: 1; padding-right: 12px;">
                    <div class="item-name">${item.namaMenu}</div>
                    <div class="item-sub">${item.qty} x Rp ${parseInt(item.harga).toLocaleString("id-ID")}</div>
                  </div>
                  <div class="item-total">Rp ${(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}</div>
                </div>`,
                )
                .join("")}
                
              <div class="divider"></div>
              
              <div class="row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-val">Rp ${totalHarga.toLocaleString("id-ID")}</span>
              </div>
              <div class="row" style="margin-top: 16px;">
                <span class="total-label">Total</span>
                <span class="total-val">Rp ${totalHarga.toLocaleString("id-ID")}</span>
              </div>
              
              ${
                metodeBayar === "Cash"
                  ? `
              <div class="row" style="margin-top: 16px;">
                <span class="summary-label">Tunai</span>
                <span class="summary-val">Rp ${uangDiterima}</span>
              </div>
              <div class="row" style="margin-top: 6px;">
                <span class="summary-label">Kembali</span>
                <span class="summary-val">Rp ${kembalian.toLocaleString("id-ID")}</span>
              </div>`
                  : ""
              }
              
              <div class="divider"></div>
              
              <div class="footer-icon">♥</div>
              <p class="footer-text">Thank you for your visit!</p>
              <p class="footer-sub">Please come again.</p>
            </div>
          </body>
          </html>
        `;
        await expoPrint.printAsync({ html: htmlStruk });
        showToastMsg("Struk berhasil dikirim ke printer");
      } else {
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
      uangDiterima: metodeBayar === "Cash" ? uangInt : undefined,
      kembalian: metodeBayar === "Cash" ? kembalian : undefined,
    });
    clearCart();
    setShowStruk(false);
    if (auth?.role === "owner") {
      router.push(`/Dashboard-owner?namaToko=${namaToko}` as any);
    } else {
      router.push(`/Dashboard-kasir?namaToko=${namaToko}` as any);
    }
  };

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

      {/* Area Utama */}
      <View style={styles.topArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Image
              source={require("../../assets/images/arrow-back.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Pembayaran</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Ringkasan Pesanan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
            <View style={styles.cardContainer}>
              {cartList.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.orderRow}>
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
                  {index < cartList.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
              <View style={[styles.divider, { borderStyle: "dashed", borderColor: "#ccc" }]} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  Rp {totalHarga.toLocaleString("id-ID")}
                </Text>
              </View>
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
                        {nom >= 1000 ? `${nom / 1000}k` : nom}
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
                <Image source={require("../../assets/images/Qr.png")} style={{ width: 60, height: 60, tintColor: '#4A6B5C', opacity: 0.5 }} resizeMode="contain" />
              </View>
              <Text style={styles.qrisHint}>
                Arahkan kamera ke QR code di atas
              </Text>
            </View>
          )}
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
                : `Bayar Sekarang`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== MODAL STRUK (RECAP RECEIPT DESIGN) ===== */}
      <Modal
        visible={showStruk}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          {/* Struk Card Container */}
          <View style={styles.receiptContainer}>
            
            {/* Receipt Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptLogo}>recap</Text>
              <Text style={styles.receiptSubtext}>Store #402 - {namaToko}</Text>
              <Text style={styles.receiptSubtext}>{waktuBayar}</Text>
              <Text style={[styles.receiptSubtext, { marginTop: 4 }]}>TXN: {nomorStruk}</Text>
            </View>

            <View style={styles.dashedDivider} />

            {/* Receipt Items */}
            <View style={styles.receiptItems}>
              {cartList.map((item) => (
                <View key={item.id} style={styles.receiptItemRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.receiptItemName}>{item.namaMenu}</Text>
                    <Text style={styles.receiptItemSub}>
                      {item.qty} x Rp {parseInt(item.harga).toLocaleString("id-ID")}
                    </Text>
                  </View>
                  <Text style={styles.receiptItemTotal}>
                    Rp {(parseInt(item.harga) * item.qty).toLocaleString("id-ID")}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.dashedDivider} />

            {/* Receipt Subtotal & Total */}
            <View style={styles.receiptSummary}>
              <View style={styles.receiptSummaryRow}>
                <Text style={styles.receiptSummaryLabel}>Subtotal</Text>
                <Text style={styles.receiptSummaryValue}>Rp {totalHarga.toLocaleString("id-ID")}</Text>
              </View>
              {/* Note: Tax is omitted as per kasir app logic */}
              
              <View style={[styles.receiptSummaryRow, { marginTop: 12 }]}>
                <Text style={styles.receiptTotalLabel}>Total</Text>
                <Text style={styles.receiptTotalValue}>Rp {totalHarga.toLocaleString("id-ID")}</Text>
              </View>

              {metodeBayar === "Cash" && (
                <>
                  <View style={[styles.receiptSummaryRow, { marginTop: 12 }]}>
                    <Text style={styles.receiptSummaryLabel}>Tunai</Text>
                    <Text style={styles.receiptSummaryValue}>Rp {uangDiterima}</Text>
                  </View>
                  <View style={[styles.receiptSummaryRow, { marginTop: 4 }]}>
                    <Text style={styles.receiptSummaryLabel}>Kembali</Text>
                    <Text style={styles.receiptSummaryValue}>Rp {kembalian.toLocaleString("id-ID")}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Receipt Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.receiptHeart}>♥</Text>
              <Text style={styles.receiptThanks}>Thank you for your visit!</Text>
              <Text style={styles.receiptThanksSub}>Please come again.</Text>
            </View>

            {/* Action Buttons (Print & Email/Done) */}
            <View style={styles.receiptActionRow}>
              <TouchableOpacity style={styles.printBtn} onPress={handleCetak} disabled={printLoading}>
                <Image source={require("../../assets/images/Print.png")} style={{ width: 20, height: 20, tintColor: "#333", marginRight: 8 }} resizeMode="contain" />
                <Text style={styles.printBtnText}>{printLoading ? "Mencetak..." : "Print"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.emailBtn} onPress={handleSelesai}>
                <Image source={require("../../assets/images/Check.png")} style={{ width: 20, height: 20, tintColor: "#FFF", marginRight: 8 }} resizeMode="contain" />
                <Text style={styles.emailBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7F8" },

  // Toast
  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    zIndex: 999,
  },
  toastText: { color: "#fff", fontSize: 13 },

  topArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#FFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  backIcon: { width: 20, height: 20, tintColor: "#1A2E35" },
  title: { fontSize: 18, fontWeight: "700", color: "#1A2E35" },
  
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667A80",
    marginBottom: 12,
  },
  cardContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  orderImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#F4F7F8" },
  orderName: { fontSize: 15, fontWeight: "600", color: "#1A2E35" },
  orderQty: { fontSize: 13, color: "#99A8A4", marginTop: 2 },
  orderHarga: { fontSize: 15, fontWeight: "700", color: "#1A2E35" },
  divider: { height: 1, backgroundColor: "#EAEAEA", marginVertical: 12 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1A2E35" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#4A6B5C" },
  
  metodeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  metodeCardActive: { borderColor: "#4A6B5C", backgroundColor: "#F0F5F3" },
  metodeIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F4F7F8",
    alignItems: "center",
    justifyContent: "center",
  },
  metodeImage: { width: 26, height: 26, tintColor: '#4A6B5C' },
  metodeName: { fontSize: 16, fontWeight: "700", color: "#1A2E35" },
  metodeNameActive: { color: "#4A6B5C" },
  metodeDesc: { fontSize: 12, color: "#99A8A4", marginTop: 2 },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: "#4A6B5C" },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4A6B5C",
  },

  // ===== CASH INPUT =====
  cashInputBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  cashInputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#667A80",
    marginBottom: 10,
  },
  cashInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7F8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  cashPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E35",
    marginRight: 8,
  },
  cashInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2E35",
    padding: 0,
  },
  nominalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  nominalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  nominalText: { fontSize: 13, color: "#4A6B5C", fontWeight: "600" },
  kembalianBox: {
    borderRadius: 12,
    padding: 14,
  },
  kembalianCukup: { backgroundColor: "#F0F5F3" },
  kembalianKurang: { backgroundColor: "#FFF5F5" },
  kembalianRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kembalianLabel: { fontSize: 14, color: "#4A6B5C", fontWeight: "600" },
  kembalianValue: { fontSize: 18, color: "#4A6B5C", fontWeight: "800" },
  kembalianKurangText: { fontSize: 14, color: "#E74C3C", fontWeight: "600" },

  // QRIS
  qrisBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  qrisTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E35",
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: "#F4F7F8",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  qrisHint: { fontSize: 13, color: "#99A8A4" },

  // Bottom
  bottomSheet: {
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bottomLabel: { fontSize: 15, color: "#667A80", fontWeight: "600" },
  bottomHarga: { fontSize: 22, color: "#1A2E35", fontWeight: "800" },
  bayarBtn: {
    backgroundColor: "#4A6B5C",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  bayarBtnDisabled: { backgroundColor: "#BDC3C7" },
  bayarText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  bayarTextDisabled: { color: "#FFF" },

  // ===== NEW STRUK MODAL (RECEIPT) =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 46, 53, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  receiptContainer: {
    backgroundColor: "#F9FAF9",
    width: '85%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  receiptLogo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4A6B5C",
    marginBottom: 12,
  },
  receiptSubtext: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  dashedDivider: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginVertical: 16,
  },
  receiptItems: {
    gap: 12,
  },
  receiptItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  receiptItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  receiptItemSub: {
    fontSize: 12,
    color: "#777",
  },
  receiptItemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  receiptSummary: {
    
  },
  receiptSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  receiptSummaryLabel: {
    fontSize: 13,
    color: "#555",
  },
  receiptSummaryValue: {
    fontSize: 13,
    color: "#555",
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4A6B5C",
  },
  receiptFooter: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  receiptHeart: {
    fontSize: 16,
    color: "#4A6B5C",
    marginBottom: 8,
  },
  receiptThanks: {
    fontSize: 13,
    color: "#555",
  },
  receiptThanksSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  receiptActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  printBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAEAEA",
    paddingVertical: 14,
    borderRadius: 999,
  },
  printBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  emailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A6B5C",
    paddingVertical: 14,
    borderRadius: 999,
  },
  emailBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
