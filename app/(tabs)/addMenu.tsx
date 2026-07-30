import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  Platform,
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
  const [stokAwal, setStokAwal] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Food");
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTitle, setInfoTitle] = useState("");
  const [infoDesc, setInfoDesc] = useState("");
  const [infoIcon, setInfoIcon] = useState("ℹ️");

  const showModal = (title: string, desc: string, icon: string) => {
    setInfoTitle(title);
    setInfoDesc(desc);
    setInfoIcon(icon);
    setShowInfoModal(true);
  };

  const handleSimpanBaru = async () => {
    if (!namaMenu.trim()) {
      showModal("Nama Kosong", "Nama produk tidak boleh kosong.", "⚠️");
      return;
    }

    const hargaNum = parseInt(harga.replace(/\D/g, ""));
    if (isNaN(hargaNum) || hargaNum <= 0) {
      showModal("Harga Tidak Valid", "Masukkan harga yang benar.", "⚠️");
      return;
    }

    setLoading(true);
    await addMenuItem({
      namaMenu: namaMenu.trim(),
      harga: String(hargaNum),
      kategori: selectedKategori === "Food" ? "Makanan" : "Minuman",
      stok: parseInt(stokAwal.replace(/\D/g, "")) || 0,
    });
    setLoading(false);

    showModal(
      "Menu Ditambahkan",
      `"${namaMenu.trim()}" berhasil disimpan dengan stok awal ${parseInt(stokAwal) || 0}.`,
      "✅"
    );
  };

  const closeAndGoBack = () => {
    setShowInfoModal(false);
    if (infoIcon === "✅") {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Image source={require("../../assets/images/arrow-back.png")} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Inventaris</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Tambah Barang & Stok</Text>
          <Text style={styles.subtitle}>Masukkan detail produk baru dan jumlah stok awalnya ke dalam sistem.</Text>

          <Text style={styles.label}>Nama Menu</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Kopi Susu Aren"
            placeholderTextColor="#99A8A4"
            value={namaMenu}
            onChangeText={setNamaMenu}
          />

          <Text style={styles.label}>Harga</Text>
          <TextInput
            style={styles.input}
            placeholder="Rp  15.000"
            placeholderTextColor="#99A8A4"
            value={harga}
            onChangeText={setHarga}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Stok Awal</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 10 (boleh dikosongi)"
            placeholderTextColor="#99A8A4"
            value={stokAwal}
            onChangeText={setStokAwal}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Kategori</Text>
          <View style={styles.kategoriRow}>
            <TouchableOpacity 
              style={[styles.kategoriCard, selectedKategori === "Food" && styles.kategoriCardActive]}
              onPress={() => setSelectedKategori("Food")}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Image source={require("../../assets/images/Food.png")} style={styles.kategoriIcon} resizeMode="contain" />
              </View>
              <Text style={styles.kategoriText}>Food</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.kategoriCard, selectedKategori === "Drink" && styles.kategoriCardActive]}
              onPress={() => setSelectedKategori("Drink")}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Image source={require("../../assets/images/Drink.png")} style={styles.kategoriIcon} resizeMode="contain" />
              </View>
              <Text style={styles.kategoriText}>Drink</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSimpanBaru}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? "Menyimpan..." : "Simpan Barang & Stok"}</Text>
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <Modal visible={showInfoModal} animationType="fade" transparent>
        <View style={styles.modalOverlayCentered}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmIcon}>{infoIcon}</Text>
            <Text style={styles.confirmTitle}>{infoTitle}</Text>
            <Text style={styles.confirmDesc}>{infoDesc}</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={closeAndGoBack}>
              <Text style={styles.confirmBtnText}>OK</Text>
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
    backgroundColor: "#F4F7F8", // Match the light background in the image
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#1A2E35",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E35",
  },
  scroll: {
    paddingBottom: 120,
  },
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F2840", // Dark blue from the image
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "#667A80",
    marginBottom: 28,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A2E35",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#EDF1F1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 13,
    color: "#1A2E35",
  },
  kategoriRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  kategoriCard: {
    flex: 1,
    backgroundColor: "#EDF1F1",
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  kategoriCardActive: {
    borderColor: "#7FA88B",
    backgroundColor: "#E9EFEA",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kategoriIcon: {
    width: 20,
    height: 20,
  },
  kategoriText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A2E35",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },
  submitBtn: {
    backgroundColor: "#7FA88B", // Green color from the image
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2E35",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmDesc: {
    fontSize: 14,
    color: "#667A80",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#7FA88B",
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
