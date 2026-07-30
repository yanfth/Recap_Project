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

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];

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
    if (val === "✓") {
      if (pin.length === 4) {
        handleLogin(pin);
      }
      return;
    }
    if (pin.length >= 4) return;
    const newPin = pin + val;
    setPin(newPin);
  };

  const handleLogin = async (finalPin: string) => {
    setLoading(true);
    const result = await login(finalPin);

    if (result === "owner") {
      const savedNamaToko = await AsyncStorage.getItem("nama_toko");
      if (savedNamaToko) {
        router.replace(`/Dashboard-owner?namaToko=${savedNamaToko}` as any);
      } else {
        router.replace("/home");
      }
    } else if (result === "kasir") {
      const savedNamaToko = await AsyncStorage.getItem("nama_toko");
      if (savedNamaToko) {
        router.replace(`/Dashboard-kasir?namaToko=${savedNamaToko}` as any);
      } else {
        router.replace("/kasir-transaksi");
      }
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
        <View style={styles.headerBox}>
          <Text style={styles.appTitle}>RECAP</Text>
        </View>
        <Text style={styles.titleText}>Masukkan PIN Keamanan</Text>
        <Text style={styles.subtitle}>Silakan masukkan PIN 4-digit Anda</Text>

        <View style={styles.bottomSection}>
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
                style={[
                  styles.numBtn,
                  btn === "⌫" && styles.numBtnBackspace,
                  btn === "✓" && styles.numBtnSubmit,
                ]}
                onPress={() => handlePress(btn)}
                disabled={loading || !isSetupDone}
                activeOpacity={0.7}
              >
                {btn === "⌫" ? (
                  <Text style={styles.backspaceIcon}>⌫</Text>
                ) : btn === "✓" ? (
                  <Text style={styles.submitIcon}>✓</Text>
                ) : (
                  <Text style={styles.numText}>{btn}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBFA" },
  topArea: {
    flex: 1,
    alignItems: "center",
  },
  headerBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#337066",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E35",
    marginBottom: 8,
  },
  subtitle: { fontSize: 13, color: "#667A80", marginBottom: 24 },
  bottomSection: {
    marginTop: "auto",
    marginBottom: 110,
    alignItems: "center",
  },
  dotsRow: { flexDirection: "row", gap: 16, marginBottom: 32 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#C5CECD",
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#337066", borderColor: "#337066" },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 320,
    gap: 16,
    justifyContent: "center",
  },
  numBtn: {
    width: 90,
    height: 85,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  numBtnBackspace: {
    backgroundColor: "#EEF2F2",
    shadowOpacity: 0,
    elevation: 0,
  },
  numBtnSubmit: {
    backgroundColor: "#4A6B5C",
  },
  numText: { fontSize: 26, fontWeight: "500", color: "#1A2E35" },
  backspaceIcon: { fontSize: 26, color: "#555" },
  submitIcon: { fontSize: 28, color: "#FFFFFF", fontWeight: "600" },

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
    color: "#337066",
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
    backgroundColor: "#337066",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
