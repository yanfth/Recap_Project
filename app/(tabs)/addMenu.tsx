import { Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addMenuItem } from "../store/menuStore";

export default function AddMenu() {
  const router = useRouter();

  const [namaMenu, setNamaMenu] = useState("");
  const [harga, setHarga] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Makanan");
  const [loading, setLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTitle, setInfoTitle] = useState("");
  const [infoDesc, setInfoDesc] = useState("");
  const [infoIcon, setInfoIcon] = useState("ℹ️");
  const [onInfoOk, setOnInfoOk] = useState<(() => void) | null>(null);

  const showModal = (title: string, desc: string, icon: string, onOk?: () => void) => {
    setInfoTitle(title);
    setInfoDesc(desc);
    setInfoIcon(icon);
    setOnInfoOk(() => onOk || null);
    setShowInfoModal(true);
  };

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
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
    if (!namaMenu.trim()) {
      showModal("Nama Kosong", "Nama produk tidak boleh kosong.", "⚠️");
      return;
    }

    const hargaNum = parseInt(harga);
    if (isNaN(hargaNum) || hargaNum <= 0) {
      showModal("Harga Tidak Valid", "Masukkan harga yang benar.", "⚠️");
      return;
    }

    setLoading(true);
    await addMenuItem({
      namaMenu: namaMenu.trim(),
      harga: String(hargaNum),
      kategori: selectedKategori,
      stok: 0,
    });
    setLoading(false);

    showModal(
      "Menu Ditambahkan",
      `"${namaMenu.trim()}" berhasil disimpan.\nTambahkan stok di menu "Tambah Stok".`,
      "✅",
      () => {
        router.back();
      }
    );
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

      <Modal
        visible={showInfoModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowInfoModal(false);
          if (onInfoOk) onInfoOk();
        }}
      >
        <Pressable
          style={styles.modalOverlayCentered}
          onPress={() => {
            setShowInfoModal(false);
            if (onInfoOk) onInfoOk();
          }}
        >
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmIcon}>{infoIcon}</Text>
            <Text style={styles.confirmTitle}>{infoTitle}</Text>
            <Text style={styles.confirmDesc}>{infoDesc}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmResetBtn, { backgroundColor: "#4B2E2B" }]}
                onPress={() => {
                  setShowInfoModal(false);
                  if (onInfoOk) onInfoOk();
                }}
              >
                <Text style={styles.confirmResetText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  buttonText: { color: "#ffffffff", fontSize: 16, fontWeight: "500" },
  bottomSheet: { height: 80, backgroundColor: "#4B2E2B" },

  // ─── Modal ──────────────────────────────────────────────────────
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "80%",
    maxWidth: 340,
    alignItems: "center",
  },
  confirmIcon: { fontSize: 40, marginBottom: 12 },
  confirmTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4B2E2B",
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  confirmResetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e74c3c",
    alignItems: "center",
  },
  confirmResetText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
