import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStock } from "../hooks/useStock";

export default function AddStockScreen() {
  const router = useRouter();
  const { produkList, tambahStok, loading } = useStock();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jumlah, setJumlah] = useState("");

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

  const selectedProduk = produkList.find((p) => p.id === selectedId);

  const handleTambah = async () => {
    if (!selectedId) {
      showModal("Pilih Produk", "Pilih produk yang ingin ditambah stoknya.", "⚠️");
      return;
    }
    const qty = parseInt(jumlah);
    if (isNaN(qty) || qty <= 0) {
      showModal("Jumlah Tidak Valid", "Masukkan jumlah stok yang benar.", "⚠️");
      return;
    }

    await tambahStok(selectedId, qty);
    showModal(
      "Stok Ditambahkan",
      `${selectedProduk?.nama} +${qty} stok.\nStok sekarang: ${
        (selectedProduk?.stok ?? 0) + qty
      }`,
      "✅",
      () => {
        router.back();
      }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Tambah Stok",
          headerBackTitle: "Kembali",
          headerTitleStyle: { color: "#ffffffff" },
          headerTintColor: "#ffffffff",
        }}
      />

      <Text style={styles.sectionLabel}>Pilih Produk</Text>

      {loading ? (
        <Text style={styles.emptyText}>Memuat produk...</Text>
      ) : produkList.length === 0 ? (
        <Text style={styles.emptyText}>
          Belum ada produk. Tambah produk dulu.
        </Text>
      ) : (
        <FlatList
          data={produkList}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.produkItem,
                selectedId === item.id && styles.produkItemSelected,
              ]}
              onPress={() => setSelectedId(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.produkInfo}>
                <Text
                  style={[
                    styles.produkNama,
                    selectedId === item.id && styles.produkNamaSelected,
                  ]}
                >
                  {item.nama}
                </Text>
                {item.kategori ? (
                  <Text style={styles.produkKategori}>{item.kategori}</Text>
                ) : null}
              </View>
              <View style={styles.stokBadge}>
                <Text style={styles.stokText}>Stok: {item.stok}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.inputArea}>
        {selectedProduk && (
          <Text style={styles.selectedLabel}>
            Produk dipilih:{" "}
            <Text style={styles.selectedNama}>{selectedProduk.nama}</Text>
            {"  "}(Stok saat ini: {selectedProduk.stok})
          </Text>
        )}

        <Text style={styles.sectionLabel}>Jumlah Stok Ditambahkan</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 10"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={jumlah}
          onChangeText={setJumlah}
          underlineColorAndroid="transparent"
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!selectedId || jumlah === "") && styles.buttonDisabled,
          ]}
          onPress={handleTambah}
          disabled={!selectedId || jumlah === ""}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>+ Tambah Stok</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Modal Info / Success ─────────────────────────────────────────────── */}
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
  container: { flex: 1, backgroundColor: "#fff" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B2E2B",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: { flex: 1, paddingHorizontal: 20 },
  produkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f5f0ee",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  produkItemSelected: { borderColor: "#4B2E2B", backgroundColor: "#f0e8e6" },
  produkInfo: { flex: 1 },
  produkNama: { fontSize: 15, fontWeight: "500", color: "#333" },
  produkNamaSelected: { color: "#4B2E2B", fontWeight: "700" },
  produkKategori: { fontSize: 12, color: "#999", marginTop: 2 },
  stokBadge: {
    backgroundColor: "#4B2E2B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stokText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 40,
    fontSize: 14,
  },
  inputArea: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0ebe9",
    backgroundColor: "#fff",
  },
  selectedLabel: { fontSize: 13, color: "#666", marginBottom: 12 },
  selectedNama: { fontWeight: "700", color: "#4B2E2B" },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#4B2E2B",
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#4B2E2B",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4B2E2B",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

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
