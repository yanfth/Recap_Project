import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStock } from "../hooks/useStock";

export default function AddMenu() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();
  const { tambahProduk } = useStock();

  const [namaMenu, setNamaMenu] = useState("");
  const [harga, setHarga] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Makanan");
  const [loading, setLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const kategoriOptions = [
    {
      id: "Makanan",
      label: "Food",
      image: require("../../assets/images/Food.png"),
    },
    {
      id: "Minuman",
      label: "Drink",
      image: require("../../assets/images/Drink.png"),
    },
  ];

  const isFormValid = namaMenu.trim() !== "" && harga.trim() !== "";

  const handleSimpan = async () => {
    if (!isFormValid) return;

    const hargaNum = parseInt(harga);
    if (isNaN(hargaNum) || hargaNum <= 0) {
      Alert.alert("Harga Tidak Valid", "Masukkan harga yang benar.");
      return;
    }

    setLoading(true);
    await tambahProduk({
      nama: namaMenu.trim(),
      harga: hargaNum,
      modal: 0,
      stok: 0,
      kategori: selectedKategori,
    });
    setLoading(false);

    // Kembali ke halaman sebelumnya dulu
    router.back();

    // Tampilkan notifikasi setelah kembali
    setTimeout(() => {
      Alert.alert(
        "Menu Ditambahkan ✅",
        `"${namaMenu.trim()}" berhasil disimpan.\nCek dan tambahkan stok di menu "Tambah Stok".`
      );
    }, 300);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topArea}>
          <Text style={styles.title}>Tambah Menu</Text>
          <Text style={styles.subtitle}>Ayo masukkan Menu Tokomu !</Text>

          <Text style={styles.label}>Nama Menu</Text>
          <TextInput
            style={styles.input}
            placeholder="Ayam Goreng"
            placeholderTextColor="#aaa"
            value={namaMenu}
            onChangeText={setNamaMenu}
            underlineColorAndroid="transparent"
          />

          <Text style={styles.label}>Harga</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh: 15000"
            placeholderTextColor="#aaa"
            value={harga}
            onChangeText={setHarga}
            keyboardType="numeric"
            underlineColorAndroid="transparent"
          />

          <Text style={styles.label}>Kategori</Text>
          <View style={styles.fotoContainer}>
            {kategoriOptions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.fotoCard,
                  selectedKategori === item.id && styles.fotoCardSelected,
                ]}
                onPress={() => setSelectedKategori(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.fotoIconBox}>
                  <Image
                    source={item.image}
                    style={styles.fotoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.fotoLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSimpan}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={!isFormValid || loading}
              activeOpacity={1}
            >
              <Text style={styles.buttonText}>
                {loading ? "Menyimpan..." : "Simpan Menu"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.bottomSheet} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4B2E2B" },
  scroll: { flexGrow: 1 },
  topArea: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 28,
    gap: 12,
    justifyContent: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#4B2E2B",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#444", marginBottom: 8 },
  label: { fontSize: 14, color: "#333", fontWeight: "500" },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 14,
    color: "#4B2E2B",
  },
  fotoContainer: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 16,
    padding: 16,
  },
  fotoCard: { alignItems: "center", gap: 8, opacity: 0.4 },
  fotoCardSelected: { opacity: 1 },
  fotoIconBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#4B2E2B",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoImage: { width: 48, height: 48 },
  fotoLabel: { fontSize: 12, color: "#444" },
  button: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: "#aaa" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  bottomSheet: { height: 80, backgroundColor: "#4B2E2B" },
});