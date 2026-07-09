import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Produk, useStock } from "../hooks/useStock";

export default function DashboardScreen() {
  const router = useRouter();
  const { namaToko } = useLocalSearchParams();
  const auth = useAuth();
  const { produkList, loading, editProduk, hapusProduk } = useStock();

  const role = auth?.role;
  const isOwner = role === "owner";

  // ── State untuk popup titik tiga (pilihan Edit/Hapus) ──
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // ── State untuk modal Edit ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editHarga, setEditHarga] = useState("");
  const [editStok, setEditStok] = useState("");

  // ── State untuk modal Konfirmasi Hapus ──
  const [produkToDelete, setProdukToDelete] = useState<Produk | null>(null);

  const handleLogout = () => {
    Alert.alert("Keluar", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: () => {
          auth?.logout();
          router.dismissAll();
          router.replace("/login");
        },
      },
    ]);
  };

  const openActionSheet = (produk: Produk) => {
    setSelectedProduk(produk);
    setShowActionSheet(true);
  };

  const closeActionSheet = () => {
    setShowActionSheet(false);
    setSelectedProduk(null);
  };

  const handlePilihEdit = () => {
    if (!selectedProduk) return;
    setEditNama(selectedProduk.nama);
    setEditHarga(String(selectedProduk.harga));
    setEditStok(String(selectedProduk.stok));
    setShowActionSheet(false);
    setShowEditModal(true);
  };

  const handlePilihHapus = () => {
    if (!selectedProduk) return;
    setProdukToDelete(selectedProduk);
    setShowActionSheet(false);
    setSelectedProduk(null);
  };

  const confirmHapus = async () => {
    if (!produkToDelete) return;
    await hapusProduk(produkToDelete.id);
    setProdukToDelete(null);
  };

  const handleSimpanEdit = async () => {
    if (!selectedProduk) return;
    const hargaNum = Number(editHarga);
    const stokNum = Number(editStok);

    if (!editNama.trim()) {
      Alert.alert("Nama Kosong", "Nama produk tidak boleh kosong.");
      return;
    }
    if (isNaN(hargaNum) || hargaNum < 0) {
      Alert.alert("Harga Tidak Valid", "Masukkan harga yang benar.");
      return;
    }
    if (isNaN(stokNum) || stokNum < 0) {
      Alert.alert("Stok Tidak Valid", "Masukkan stok yang benar.");
      return;
    }

    await editProduk(selectedProduk.id, {
      nama: editNama.trim(),
      harga: hargaNum,
      stok: stokNum,
    });

    setShowEditModal(false);
    setSelectedProduk(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {isOwner ? "👑 Dashboard Owner" : "🧾 Dashboard Kasir"}
          </Text>
          <Text style={styles.subGreeting}>
            {isOwner
              ? "Kelola produk, stok, dan modal"
              : "Siap melayani transaksi"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.logoutText}>🚪 Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Owner */}
      {isOwner && (
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/home")}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>🏪</Text>
            <Text style={styles.menuLabel}>Nama Toko</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/addmenu" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>➕</Text>
            <Text style={styles.menuLabel}>Tambah Produk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/add-stock" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuLabel}>Tambah Stok</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/pengaturan-pin" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>🔐</Text>
            <Text style={styles.menuLabel}>Atur PIN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tombol transaksi - Kasir only */}
      {!isOwner && (
        <TouchableOpacity
          style={styles.transaksiBtn}
          onPress={() =>
            router.push(`/kasir-transaksi?namaToko=${namaToko}` as any)
          }
          activeOpacity={0.8}
        >
          <Text style={styles.transaksiBtnText}>🧾 Mulai Transaksi</Text>
        </TouchableOpacity>
      )}

      {/* Daftar produk */}
      <Text style={styles.sectionLabel}>Daftar Produk</Text>

      {loading ? (
        <Text style={styles.emptyText}>Memuat produk...</Text>
      ) : produkList.length === 0 ? (
        <Text style={styles.emptyText}>
          {isOwner
            ? 'Belum ada produk. Tap "Tambah Produk" untuk mulai.'
            : "Belum ada produk. Hubungi owner."}
        </Text>
      ) : (
        <FlatList
          data={produkList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.produkList}
          renderItem={({ item }) => (
            <View style={styles.produkRow}>
              <View style={styles.produkInfo}>
                <Text style={styles.produkNama}>{item.nama}</Text>
                <Text style={styles.produkHarga}>
                  Rp {item.harga.toLocaleString("id-ID")}
                </Text>
                {isOwner && (
                  <Text style={styles.produkModal}>
                    Modal: Rp {item.modal.toLocaleString("id-ID")}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.stokBadge,
                  item.stok === 0 && styles.stokBadgeHabis,
                ]}
              >
                <Text style={styles.stokText}>
                  {item.stok === 0 ? "Habis" : `${item.stok} pcs`}
                </Text>
              </View>

              {/* Titik tiga — hanya Owner yang bisa edit/hapus */}
              {isOwner && (
                <TouchableOpacity
                  style={styles.menuTitikTiga}
                  onPress={() => openActionSheet(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.titikTigaText}>⋮</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* ── Popup pilihan Edit / Hapus ── */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={closeActionSheet}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={closeActionSheet}
        >
          <View style={styles.actionSheet}>
            {selectedProduk && (
              <Text style={styles.actionSheetTitle}>{selectedProduk.nama}</Text>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handlePilihEdit}
            >
              <Text style={styles.actionBtnText}>✏️ Edit Produk</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnHapus]}
              onPress={handlePilihHapus}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnTextHapus]}>
                🗑️ Hapus Produk
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnBatal}
              onPress={closeActionSheet}
            >
              <Text style={styles.actionBtnBatalText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Edit Produk ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Edit Produk</Text>

            <Text style={styles.editLabel}>Nama Produk</Text>
            <TextInput
              style={styles.editInput}
              value={editNama}
              onChangeText={setEditNama}
              placeholder="Nama produk"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.editLabel}>Harga</Text>
            <TextInput
              style={styles.editInput}
              value={editHarga}
              onChangeText={setEditHarga}
              keyboardType="numeric"
              placeholder="Harga"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.editLabel}>Stok</Text>
            <TextInput
              style={styles.editInput}
              value={editStok}
              onChangeText={setEditStok}
              keyboardType="numeric"
              placeholder="Stok"
              placeholderTextColor="#aaa"
            />

            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonBatal]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editButtonBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonSimpan]}
                onPress={handleSimpanEdit}
              >
                <Text style={styles.editButtonSimpanText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Konfirmasi Hapus ── */}
      <Modal
        visible={!!produkToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setProdukToDelete(null)}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Hapus Produk</Text>
            <Text style={styles.confirmDeleteText}>
              Yakin ingin menghapus{" "}
              <Text style={{ fontWeight: "700" }}>{produkToDelete?.nama}</Text>?
              Aksi ini tidak bisa dibatalkan.
            </Text>
            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonBatal]}
                onPress={() => setProdukToDelete(null)}
              >
                <Text style={styles.editButtonBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonHapusConfirm]}
                onPress={confirmHapus}
              >
                <Text style={styles.editButtonSimpanText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#4B2E2B",
    padding: 24,
    paddingTop: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { fontSize: 18, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#d4b8b5", marginTop: 4 },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  menuCard: {
    width: "47%",
    backgroundColor: "#f5f0ee",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  menuIcon: { fontSize: 28 },
  menuLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B2E2B",
    textAlign: "center",
  },
  transaksiBtn: {
    margin: 20,
    backgroundColor: "#4B2E2B",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  transaksiBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B2E2B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  produkList: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 14,
    marginTop: 24,
    paddingHorizontal: 32,
  },
  produkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f0ee",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  produkInfo: { flex: 1 },
  produkNama: { fontSize: 15, fontWeight: "600", color: "#333" },
  produkHarga: {
    fontSize: 13,
    color: "#4B2E2B",
    fontWeight: "500",
    marginTop: 2,
  },
  produkModal: { fontSize: 11, color: "#999", marginTop: 2 },
  stokBadge: {
    backgroundColor: "#4B2E2B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stokBadgeHabis: { backgroundColor: "#e53e3e" },
  stokText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ── Titik tiga ──
  menuTitikTiga: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  titikTigaText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4B2E2B",
  },

  // ── Action Sheet (popup Edit/Hapus) ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  actionSheetTitle: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 6,
  },
  actionBtn: {
    backgroundColor: "#f5f0ee",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnHapus: { backgroundColor: "#fdeaea" },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: "#4B2E2B" },
  actionBtnTextHapus: { color: "#e53e3e" },
  actionBtnBatal: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  actionBtnBatalText: { fontSize: 15, fontWeight: "600", color: "#999" },

  // ── Modal Edit ──
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  editBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  editTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4B2E2B",
    marginBottom: 16,
    textAlign: "center",
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B2E2B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#e0d8d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  editButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: "center",
  },
  editButtonBatal: { backgroundColor: "#f5f0ee" },
  editButtonBatalText: { fontSize: 14, fontWeight: "600", color: "#777" },
  editButtonSimpan: { backgroundColor: "#4B2E2B" },
  editButtonSimpanText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  editButtonHapusConfirm: { backgroundColor: "#e53e3e" },

  // ── Konfirmasi Hapus ──
  confirmDeleteText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
});
