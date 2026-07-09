import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "./context/AuthContext";

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinLoginScreen() {
  const router = useRouter();
  const { login, isSetupDone } = useAuth();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = (val: string) => {
    if (loading) return;
    if (val === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (val === "" || pin.length >= 4) return;
    const newPin = pin + val;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => handleLogin(newPin), 150);
    }
  };

  const handleLogin = async (finalPin: string) => {
    setLoading(true);
    const result = await login(finalPin);

    if (result === "owner") {
      const savedNamaToko = await AsyncStorage.getItem("nama_toko");
      if (savedNamaToko) {
        router.replace(`/dashboard?namaToko=${savedNamaToko}`);
      } else {
        router.replace("/home");
      }
    } else if (result === "kasir") {
      router.replace("/kasir-transaksi");
    } else {
      shake();
      setPin("");
      Alert.alert(
        "PIN Salah",
        "PIN yang kamu masukkan tidak valid.\nCoba lagi.",
        [{ text: "OK" }],
      );
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Popup untuk user baru — arahkan langsung buat PIN sendiri */}
      <Modal visible={!isSetupDone} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalEmoji}>🔐</Text>
            <Text style={styles.modalTitle}>Selamat Datang di Recap!</Text>
            <Text style={styles.modalDesc}>
              Sepertinya ini pertama kali kamu membuka aplikasi. Yuk buat PIN
              sendiri untuk Owner dan Kasir — bebas, terserah kamu.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => router.replace("/pengaturan-pin?mode=setup-owner")}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Buat PIN Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.topArea}>
        <Text style={styles.appTitle}>Kasir 2.0</Text>
        <Text style={styles.subtitle}>Masukkan PIN untuk masuk</Text>

        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, pin.length > i && styles.dotFilled]}
            />
          ))}
        </Animated.View>

        <View style={styles.numpad}>
          {BUTTONS.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.numBtn, btn === "" && styles.numBtnHidden]}
              onPress={() => handlePress(btn)}
              disabled={btn === "" || loading || !isSetupDone}
              activeOpacity={0.6}
            >
              <Text style={styles.numText}>{btn}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.hintRow}>
          <View style={[styles.hintBadge, styles.badgeOwner]}>
            <Text style={styles.hintText}>👑 Owner</Text>
          </View>
          <View style={[styles.hintBadge, styles.badgeKasir]}>
            <Text style={styles.hintText}>🧾 Kasir</Text>
          </View>
        </View>
        <Text style={styles.hintCaption}>PIN berbeda untuk setiap role</Text>
      </View>

      {!isSetupDone && (
        <View style={styles.bottomSheet}>
          <Text style={styles.recapTitle}>Recap</Text>
          <Text style={styles.recapSubtitle}>
            Lebih Mudah Berjualan Dengan <Text style={styles.bold}>Recap</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topArea: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4B2E2B",
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 13, color: "#999", marginTop: -8 },
  dotsRow: { flexDirection: "row", gap: 18, marginVertical: 4 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#4B2E2B",
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#4B2E2B" },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 252,
    gap: 12,
    justifyContent: "center",
  },
  numBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#f5f0ee",
    alignItems: "center",
    justifyContent: "center",
  },
  numBtnHidden: { backgroundColor: "transparent" },
  numText: { fontSize: 22, fontWeight: "600", color: "#4B2E2B" },
  hintRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  hintBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  badgeOwner: { backgroundColor: "#4B2E2B" },
  badgeKasir: { backgroundColor: "#4B2E2B" },
  hintText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  hintCaption: { fontSize: 11, color: "#bbb", marginTop: -8 },
  bottomSheet: {
    backgroundColor: "#4B2E2B",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
    paddingBottom: 48,
    alignItems: "center",
  },
  recapTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  recapSubtitle: { fontSize: 13, color: "#fff", textAlign: "center" },
  bold: { fontWeight: "bold", color: "#fff" },

  // ── Modal / Popup ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalEmoji: { fontSize: 40, marginBottom: 8 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B2E2B",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
