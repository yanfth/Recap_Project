import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function PengaturanPinScreen() {
  const router = useRouter();
  const { setPins, ownerPin, kasirPin } = useAuth();
  const params = useLocalSearchParams<{ mode?: string; ownerPin?: string }>();

  const mode = params.mode ?? "ganti"; // "setup-owner" | "setup-kasir" | "ganti"
  const isSetupOwner = mode === "setup-owner";
  const isSetupKasir = mode === "setup-kasir";
  const isSetupFlow = isSetupOwner || isSetupKasir;

  // ── Mode "ganti" (perilaku lama, tidak berubah) ──
  const [newOwnerPin, setNewOwnerPin] = useState("");
  const [newKasirPin, setNewKasirPin] = useState("");

  // ── Mode setup (satu input per step) ──
  const [setupPin, setSetupPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSimpanGanti = async () => {
    if (newOwnerPin.length !== 4 || newKasirPin.length !== 4) {
      Alert.alert("PIN Tidak Valid", "Kedua PIN harus terdiri dari 4 angka.");
      return;
    }
    if (newOwnerPin === newKasirPin) {
      Alert.alert("PIN Sama", "PIN Owner dan PIN Kasir tidak boleh sama.");
      return;
    }
    setLoading(true);
    try {
      await setPins(newOwnerPin, newKasirPin);
      Alert.alert("PIN Berhasil Diubah ✅", "PIN baru sudah aktif.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Gagal", e.message ?? "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  const handleLanjutOwner = () => {
    if (setupPin.length !== 4) {
      Alert.alert("PIN Tidak Valid", "PIN harus terdiri dari 4 angka.");
      return;
    }
    // bawa PIN owner ke step kasir lewat query param
    router.push(`/pengaturan-pin?mode=setup-kasir&ownerPin=${setupPin}`);
  };

  const handleSelesaiKasir = async () => {
    const ownerPinFromParam = params.ownerPin ?? "";
    if (setupPin.length !== 4) {
      Alert.alert("PIN Tidak Valid", "PIN harus terdiri dari 4 angka.");
      return;
    }
    if (setupPin === ownerPinFromParam) {
      Alert.alert("PIN Sama", "PIN Kasir tidak boleh sama dengan PIN Owner.");
      return;
    }
    setLoading(true);
    try {
      await setPins(ownerPinFromParam, setupPin);
      router.replace("/home"); // ⬅️ sesuaikan tujuan akhir setup (dashboard/home)
    } catch (e: any) {
      Alert.alert("Gagal", e.message ?? "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  // ── Render: mode setup ──
  if (isSetupFlow) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: isSetupOwner ? "Setup PIN Owner" : "Setup PIN Kasir",
            headerBackVisible: false, // gak boleh skip alur setup
          }}
        />
        <View style={styles.content}>
          <Text style={styles.sectionLabel}>
            {isSetupOwner ? "Buat PIN Owner (👑)" : "Buat PIN Kasir (🧾)"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="4 digit angka"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            value={setupPin}
            onChangeText={setSetupPin}
            underlineColorAndroid="transparent"
          />
          <Text style={styles.hint}>
            {isSetupOwner
              ? "⚠️ PIN ini akan dipakai untuk masuk sebagai Owner."
              : "⚠️ PIN Kasir tidak boleh sama dengan PIN Owner."}
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              (setupPin.length < 4 || loading) && styles.buttonDisabled,
            ]}
            onPress={isSetupOwner ? handleLanjutOwner : handleSelesaiKasir}
            disabled={setupPin.length < 4 || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? "Menyimpan..." : isSetupOwner ? "Lanjut" : "Selesai"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render: mode "ganti" (perilaku lama) ──
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Pengaturan PIN",
          headerBackTitle: "Kembali",
        }}
      />
      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>PIN Aktif Sekarang</Text>
          <Text style={styles.infoRow}>
            👑 Owner:{" "}
            <Text style={styles.infoPin}>{"•".repeat(ownerPin.length)}</Text>
          </Text>
          <Text style={styles.infoRow}>
            🧾 Kasir:{" "}
            <Text style={styles.infoPin}>{"•".repeat(kasirPin.length)}</Text>
          </Text>
        </View>

        <Text style={styles.sectionLabel}>PIN Owner Baru</Text>
        <TextInput
          style={styles.input}
          placeholder="4 digit angka"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={newOwnerPin}
          onChangeText={setNewOwnerPin}
          underlineColorAndroid="transparent"
        />

        <Text style={styles.sectionLabel}>PIN Kasir Baru</Text>
        <TextInput
          style={styles.input}
          placeholder="4 digit angka"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={newKasirPin}
          onChangeText={setNewKasirPin}
          underlineColorAndroid="transparent"
        />

        <Text style={styles.hint}>
          ⚠️ PIN Owner dan Kasir tidak boleh sama. Simpan PIN di tempat yang
          aman.
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            (newOwnerPin.length < 4 || newKasirPin.length < 4 || loading) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSimpanGanti}
          disabled={newOwnerPin.length < 4 || newKasirPin.length < 4 || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Menyimpan..." : "Simpan PIN Baru"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// styles: sama persis seperti sebelumnya, tidak berubah

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, gap: 12 },
  infoBox: {
    backgroundColor: "#f5f0ee",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B2E2B",
    marginBottom: 4,
  },
  infoRow: { fontSize: 14, color: "#555" },
  infoPin: { fontWeight: "700", color: "#4B2E2B", letterSpacing: 4 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B2E2B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#4B2E2B",
    paddingVertical: 10,
    fontSize: 22,
    fontWeight: "700",
    color: "#4B2E2B",
    letterSpacing: 12,
  },
  hint: { fontSize: 12, color: "#999", lineHeight: 18, marginTop: 4 },
  button: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
