import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from "react-native-reanimated";
import { Platform, Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, SafeAreaView, ScrollView, KeyboardAvoidingView } from "react-native";
import { clearHistory, getHistory, HistoryOrder } from "../store/historyStore";
import { useAuth } from "../context/AuthContext";
import { Produk, useStock } from "../hooks/useStock";
import { handleExportExcel } from "../utils/exportUtils";

export default function DashboardOwnerScreen() {
  const router = useRouter();
  const { namaToko } = useLocalSearchParams();
  const auth = useAuth();
  const { produkList, loading, editProduk, hapusProduk, tambahStok } = useStock();
  const [storeName, setStoreName] = useState((namaToko as string) || "");
  const [showEditTokoModal, setShowEditTokoModal] = useState(false);
  const [inputStoreName, setInputStoreName] = useState("");
  const [historyList, setHistoryList] = useState<HistoryOrder[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockToAdd, setStockToAdd] = useState("");
  const [selectedLowStockProduk, setSelectedLowStockProduk] = useState<Produk | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  // ── State untuk popup titik tiga ──
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editHarga, setEditHarga] = useState("");
  const [editStok, setEditStok] = useState("");
  const [produkToDelete, setProdukToDelete] = useState<Produk | null>(null);

  useFocusEffect(
    useCallback(() => {
      getHistory().then((data) => setHistoryList(data));
      AsyncStorage.getItem("nama_toko").then((name) => {
        if (name) setStoreName(name);
      });
    }, [])
  );

  const confirmLogout = () => {
    setShowLogoutModal(false);
    auth?.logout();
    router.replace("/login");
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
    await editProduk(selectedProduk.id, {
      nama: editNama.trim(),
      harga: hargaNum,
      stok: stokNum,
    });
    setShowEditModal(false);
    setSelectedProduk(null);
  };

  const handleSimpanToko = async () => {
    if (inputStoreName.trim() === "") return;
    await AsyncStorage.setItem("nama_toko", inputStoreName.trim());
    setStoreName(inputStoreName.trim());
    setShowEditTokoModal(false);
  };

  const handleExport = () => {
    handleExportExcel(historyList, storeName);
  };

  const confirmClearData = async () => {
    await clearHistory();
    setHistoryList([]);
    setShowClearModal(false);
    Alert.alert("Sukses", "Data berhasil direset.");
  };

  const totalSales = useMemo(() => historyList.reduce((sum, order) => sum + order.totalHarga, 0), [historyList]);
  const totalTransactions = historyList.length;
  const lowStockCount = useMemo(() => produkList.filter(p => p.stok <= 5).length, [produkList]);

  const salesChartData = useMemo(() => {
    const today = new Date().toDateString();
    const todaysOrders = historyList.filter(o => new Date(o.waktu).toDateString() === today);
    
    if (todaysOrders.length === 0) return { data: [], max: 0, firstHour: "", lastHour: "" };

    const hours = todaysOrders.map(o => new Date(o.waktu).getHours());
    const minHour = Math.min(...hours);
    const maxHour = Math.max(...hours, new Date().getHours());

    const grouped: Record<number, number> = {};
    for (let i = minHour; i <= maxHour; i++) {
      grouped[i] = 0;
    }

    todaysOrders.forEach(o => {
      const h = new Date(o.waktu).getHours();
      grouped[h] += o.totalHarga;
    });

    const data = Object.keys(grouped).map(h => ({
      hour: parseInt(h, 10),
      label: `${h.padStart(2, '0')}:00`,
      total: grouped[parseInt(h, 10)]
    }));

    const maxSales = Math.max(...data.map(d => d.total));

    return { 
      data, 
      max: maxSales > 0 ? maxSales : 1,
      firstHour: `${minHour.toString().padStart(2, '0')}:00`,
      lastHour: `${maxHour.toString().padStart(2, '0')}:00`
    };
  }, [historyList]);

  const filteredProduk = useMemo(() => {
    let result = produkList;
    if (activeFilter !== "Semua") {
      result = result.filter(p => {
        const categoryLower = (p.kategori || "").toLowerCase();
        const isMinuman = categoryLower === "minuman" || categoryLower.includes("drink") || categoryLower.includes("tea") || categoryLower.includes("coffee");
        if (activeFilter === "Makanan") return !isMinuman;
        if (activeFilter === "Minuman") return isMinuman;
        return true;
      });
    }
    if (searchQuery) {
      result = result.filter(p => p.nama.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [produkList, searchQuery, activeFilter]);

  const renderHeader = () => (
    <View style={styles.contentContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <Text style={[styles.pageTitle, { marginTop: 0 }]}>{storeName || "Owner Dashboard"}</Text>
      </View>
      <Text style={styles.pageSubtitle}>Owner Dashboard • Overview of your store's performance today.</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.btnLight} onPress={() => router.push("/addmenu" as any)}>
          <Text style={styles.btnLightText}>+ Add Barang & Stok</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDark} onPress={handleExport}>
          <Text style={styles.btnDarkText}>📄 Export SPS</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.card} onPress={() => setShowStatsModal(true)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Total Sales</Text>
          <View style={[styles.iconCircle, { backgroundColor: '#6C9484' }]}><Text style={{ fontSize: 14 }}>💵</Text></View>
        </View>
        <Text style={styles.cardValue}>Rp {totalSales.toLocaleString('id-ID')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => setShowHistoryModal(true)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Transactions</Text>
          <View style={[styles.iconCircle, { backgroundColor: '#D1E1F0' }]}><Text style={{ fontSize: 14 }}>🧾</Text></View>
        </View>
        <Text style={styles.cardValue}>{totalTransactions}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardAlert]} onPress={() => setShowLowStockModal(true)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitleAlert}>Low Stock Alerts</Text>
          <View style={[styles.iconCircle, { backgroundColor: '#8A2E2E' }]}><Text style={{ fontSize: 14, color: '#FFF' }}>⚠️</Text></View>
        </View>
        <Text style={styles.cardValueAlert}>{lowStockCount} Items</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Current Inventory</Text>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search inventory..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery}/>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterPill, activeFilter === "Semua" && styles.filterPillActive]} onPress={() => setActiveFilter("Semua")}>
          <Text style={[styles.filterText, activeFilter === "Semua" && styles.filterTextActive]}>Semua</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterPill, activeFilter === "Makanan" && styles.filterPillActive]} onPress={() => setActiveFilter("Makanan")}>
          <Text style={[styles.filterText, activeFilter === "Makanan" && styles.filterTextActive]}>Makanan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterPill, activeFilter === "Minuman" && styles.filterPillActive]} onPress={() => setActiveFilter("Minuman")}>
          <Text style={[styles.filterText, activeFilter === "Minuman" && styles.filterTextActive]}>Minuman</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.8 }]}>Item Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Stock</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Category</Text>
        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={{ padding: 8 }}>
           <Text style={{ fontSize: 24, color: '#555' }}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>recap</Text>
        <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={{ padding: 8 }}>
          <Image source={require("../../assets/images/Logout.png")} style={{ width: 20, height: 20, tintColor: '#555' }} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProduk}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const categoryLower = (item.kategori || "").toLowerCase();
          const isMinuman = categoryLower === "minuman" || categoryLower.includes("drink") || categoryLower.includes("tea") || categoryLower.includes("coffee");
          const imageSource = isMinuman ? require("../../assets/images/Drink.png") : require("../../assets/images/Food.png");
          
          return (
          <TouchableOpacity style={styles.tableRow} onPress={() => openActionSheet(item)}>
            <View style={styles.itemIconBox}>
              <Image source={imageSource} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1.8, paddingRight: 8, justifyContent: 'center' }}><Text style={styles.itemName} numberOfLines={2}>{item.nama}</Text></View>
            <View style={{ flex: 0.8, justifyContent: 'center' }}><Text style={[styles.itemCategory, { color: '#337066', fontWeight: 'bold' }]}>{item.stok}</Text></View>
            <View style={{ flex: 1.2, justifyContent: 'center' }}><Text style={styles.itemCategory}>{item.kategori || "Barang"}</Text></View>
            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}><Text style={styles.itemPrice}>Rp {item.harga.toLocaleString('id-ID')}</Text></View>
          </TouchableOpacity>
        )}}
      />

      <Modal visible={showActionSheet} transparent animationType="fade" onRequestClose={closeActionSheet}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeActionSheet}>
          <View style={styles.actionSheet}>
            {selectedProduk && <Text style={styles.actionSheetTitle}>{selectedProduk.nama}</Text>}
            <TouchableOpacity style={styles.actionBtn} onPress={handlePilihEdit}><Text style={styles.actionBtnText}>✏️ Edit Produk</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnHapus]} onPress={handlePilihHapus}><Text style={[styles.actionBtnText, styles.actionBtnTextHapus]}>🗑️ Hapus Produk</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnBatal} onPress={closeActionSheet}><Text style={styles.actionBtnBatalText}>Batal</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Edit Produk</Text>
            <Text style={styles.editLabel}>Nama</Text>
            <TextInput style={styles.editInput} value={editNama} onChangeText={setEditNama} />
            <Text style={styles.editLabel}>Harga</Text>
            <TextInput style={styles.editInput} value={editHarga} onChangeText={setEditHarga} keyboardType="numeric" />
            <Text style={styles.editLabel}>Stok</Text>
            <TextInput style={styles.editInput} value={editStok} onChangeText={setEditStok} keyboardType="numeric" />
            <View style={styles.editButtonRow}>
              <TouchableOpacity style={[styles.editButton, styles.editButtonBatal]} onPress={() => setShowEditModal(false)}><Text style={styles.editButtonBatalText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.editButtonSimpan]} onPress={handleSimpanEdit}><Text style={styles.editButtonSimpanText}>Simpan</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditTokoModal} transparent animationType="fade" onRequestClose={() => setShowEditTokoModal(false)}>
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Ubah Nama Toko</Text>
            <Text style={styles.editLabel}>Nama Toko</Text>
            <TextInput style={styles.editInput} value={inputStoreName} onChangeText={setInputStoreName} placeholder="Masukkan nama toko" />
            <View style={styles.editButtonRow}>
              <TouchableOpacity style={[styles.editButton, styles.editButtonBatal]} onPress={() => setShowEditTokoModal(false)}><Text style={styles.editButtonBatalText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.editButtonSimpan]} onPress={handleSimpanToko}><Text style={styles.editButtonSimpanText}>Simpan</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!produkToDelete} transparent animationType="fade" onRequestClose={() => setProdukToDelete(null)}>
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Hapus Produk</Text>
            <Text style={styles.confirmDeleteText}>Yakin ingin menghapus {produkToDelete?.nama}?</Text>
            <View style={styles.editButtonRow}>
              <TouchableOpacity style={[styles.editButton, styles.editButtonBatal]} onPress={() => setProdukToDelete(null)}><Text style={styles.editButtonBatalText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.editButtonHapusConfirm]} onPress={confirmHapus}><Text style={styles.editButtonSimpanText}>Hapus</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showClearModal} animationType="fade" transparent onRequestClose={() => setShowClearModal(false)}>
        <Pressable style={styles.modalOverlayCentered} onPress={() => setShowClearModal(false)}>
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmIcon}>⚠️</Text>
            <Text style={styles.confirmTitle}>Clear Data?</Text>
            <Text style={styles.confirmDesc}>Semua transaksi hari ini akan dihapus.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowClearModal(false)}><Text style={styles.cancelText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmResetBtn} onPress={confirmClearData}><Text style={styles.confirmResetText}>Clear</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showLogoutModal} animationType="fade" transparent onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalOverlayCentered} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Image source={require("../../assets/images/Logout.png")} style={{ width: 40, height: 40, marginBottom: 12, tintColor: '#1A2E35' }} resizeMode="contain" />
            <Text style={styles.confirmTitle}>Keluar</Text>
            <Text style={styles.confirmDesc}>Yakin ingin keluar?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogoutModal(false)}><Text style={styles.cancelText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmResetBtn, { backgroundColor: "#4A6B5C" }]} onPress={confirmLogout}><Text style={styles.confirmResetText}>Keluar</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showInfoModal} animationType="fade" transparent onRequestClose={() => setShowInfoModal(false)}>
        <Pressable style={styles.modalOverlayCentered} onPress={() => setShowInfoModal(false)}>
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmIcon}>ℹ️</Text>
            <Text style={styles.confirmTitle}>Info</Text>
            <Text style={styles.confirmDesc}>{infoMessage}</Text>
            <View style={styles.confirmActions}><TouchableOpacity style={[styles.confirmResetBtn, { backgroundColor: "#4A6B5C" }]} onPress={() => setShowInfoModal(false)}><Text style={styles.confirmResetText}>OK</Text></TouchableOpacity></View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Low Stock List Modal */}
      <Modal visible={showLowStockModal} animationType="slide" transparent onRequestClose={() => setShowLowStockModal(false)}>
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.confirmBox, { padding: 20, width: '90%', maxHeight: '80%', alignItems: 'stretch' }]}>
            <Text style={[styles.confirmTitle, { textAlign: 'center' }]}>Menu Stok Menipis</Text>
            <ScrollView style={{ width: '100%', marginVertical: 10 }}>
              {produkList.filter(p => p.stok <= 10).length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>Semua stok aman!</Text>
              ) : (
                produkList.filter(p => p.stok <= 10).map((p) => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#F9FAF9', borderRadius: 8, marginBottom: 8 }}
                    onPress={() => {
                      setSelectedLowStockProduk(p);
                      setShowLowStockModal(false);
                      setShowAddStockModal(true);
                    }}
                  >
                    <Text style={{ fontWeight: '600', color: '#1A2E35' }}>{p.nama}</Text>
                    <Text style={{ color: '#E74C3C', fontWeight: 'bold' }}>Sisa: {p.stok}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={{ width: '100%', marginTop: 10, paddingVertical: 14, borderRadius: 12, backgroundColor: '#4A6B5C', alignItems: 'center' }} onPress={() => setShowLowStockModal(false)}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>Kembali</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Stock Modal */}
      <Modal visible={showAddStockModal} animationType="fade" transparent onRequestClose={() => { setShowAddStockModal(false); setStockToAdd(""); }}>
        <View style={styles.modalOverlayCentered}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Tambah Stok</Text>
            <Text style={styles.confirmDesc}>Masukkan jumlah stok yang ingin ditambahkan untuk {selectedLowStockProduk?.nama}.</Text>
            <TextInput
              style={{ backgroundColor: '#F0F0F0', width: '100%', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 20, fontSize: 16 }}
              placeholder="Contoh: 10"
              keyboardType="numeric"
              value={stockToAdd}
              onChangeText={setStockToAdd}
            />
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddStockModal(false); setStockToAdd(""); }}>
                <Text style={styles.cancelText}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmResetBtn, { backgroundColor: "#4A6B5C" }]} onPress={async () => {
                if (selectedLowStockProduk && stockToAdd) {
                  await tambahStok(selectedLowStockProduk.id, parseInt(stockToAdd.replace(/\D/g, "")) || 0);
                  setShowAddStockModal(false);
                  setStockToAdd("");
                  setInfoMessage(`Stok ${selectedLowStockProduk.nama} berhasil ditambah!`);
                  setShowInfoModal(true);
                }
              }}>
                <Text style={styles.confirmResetText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sales Statistics Modal */}
      <Modal visible={showStatsModal} animationType="slide" transparent onRequestClose={() => setShowStatsModal(false)}>
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.confirmBox, { width: '90%', padding: 20, alignItems: 'stretch' }]}>
            <Text style={[styles.confirmTitle, { textAlign: 'center', marginBottom: 4 }]}>Statistik Penjualan Hari Ini</Text>
            {salesChartData.data.length > 0 ? (
              <Text style={{ textAlign: 'center', color: '#667A80', fontSize: 12, marginBottom: 20 }}>
                {salesChartData.firstHour} - {salesChartData.lastHour}
              </Text>
            ) : null}

            {salesChartData.data.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#999', marginVertical: 40 }}>Belum ada transaksi hari ini.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 180, paddingTop: 20, paddingBottom: 10 }}>
                  {salesChartData.data.map((item, index) => {
                    const barHeight = (item.total / salesChartData.max) * 120;
                    return (
                      <View key={index} style={{ alignItems: 'center', marginHorizontal: 8 }}>
                        <Text style={{ fontSize: 10, color: '#667A80', marginBottom: 4 }}>
                          {item.total > 0 ? (item.total >= 1000 ? `${(item.total / 1000).toFixed(0)}k` : item.total) : ''}
                        </Text>
                        <View style={{ width: 30, height: barHeight, backgroundColor: '#6C9484', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                        <Text style={{ fontSize: 10, color: '#1A2E35', marginTop: 8, fontWeight: '600' }}>{item.label}</Text>
                      </View>
                    )
                  })}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: '#4A6B5C', alignItems: 'center' }} onPress={() => setShowStatsModal(false)}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction History Modal */}
      <Modal visible={showHistoryModal} animationType="slide" transparent onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.confirmBox, { width: '95%', maxHeight: '85%', padding: 20, alignItems: 'stretch' }]}>
            <Text style={[styles.confirmTitle, { textAlign: 'center', marginBottom: 16 }]}>Riwayat Transaksi</Text>
            
            <ScrollView style={{ width: '100%', marginBottom: 16 }}>
              {historyList.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>Belum ada transaksi.</Text>
              ) : (
                historyList.map((order) => {
                  const dateObj = new Date(order.waktu);
                  const timeString = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  const dateString = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                  const qtyCount = order.items.reduce((sum, i) => sum + i.qty, 0);

                  return (
                    <View key={order.nomorStruk} style={{ flexDirection: 'row', backgroundColor: '#F9FAF9', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, backgroundColor: '#E2ECE8', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Image source={require("../../assets/images/Cash.png")} style={{ width: 20, height: 20, tintColor: '#4A6D5E' }} resizeMode="contain" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A2E35' }}>Order #{order.nomorStruk.slice(-4)}</Text>
                        <Text style={{ fontSize: 12, color: '#667A80', marginTop: 2 }}>{dateString} • {timeString}</Text>
                        <Text style={{ fontSize: 12, color: '#99A8A4', marginTop: 2 }}>{qtyCount} item • {order.metodeBayar}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A2E35' }}>Rp {order.totalHarga.toLocaleString("id-ID")}</Text>
                        <Text style={{ fontSize: 11, color: '#4A6D5E', fontWeight: '600', marginTop: 4 }}>Completed</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: '#4A6B5C', alignItems: 'center' }} onPress={() => setShowHistoryModal(false)}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sidebar */}
      {showSidebar && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 1000, elevation: 1000, flexDirection: 'row' }]}>
          <Animated.View style={styles.sidebarOverlayBg} entering={FadeIn} exiting={FadeOut}>
            <Pressable style={{flex: 1}} onPress={() => setShowSidebar(false)} />
          </Animated.View>
          <Animated.View style={[styles.sidebarContent, { position: 'absolute', top: 0, left: 0, bottom: 0 }]} entering={SlideInLeft} exiting={SlideOutLeft}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <Text style={styles.sidebarClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => { setShowSidebar(false); setInputStoreName(storeName); setShowEditTokoModal(true); }}>
              <Text style={styles.sidebarItemIcon}>✏️</Text>
              <Text style={styles.sidebarItemText}>Ubah Nama Toko</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => { setShowSidebar(false); router.push("/pengaturan-pin" as any); }}>
              <Text style={styles.sidebarItemIcon}>🔑</Text>
              <Text style={styles.sidebarItemText}>Ubah PIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => { setShowSidebar(false); setShowClearModal(true); }}>
              <Text style={styles.sidebarItemIcon}>🗑️</Text>
              <Text style={styles.sidebarItemText}>Hapus Riwayat</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBFA" },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 16, backgroundColor: '#F8FBFA' },
  logo: { fontSize: 20, fontWeight: '700', color: '#337066' },
  listContent: { paddingBottom: 40 },
  contentContainer: { paddingHorizontal: 24 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#1A2E35', marginTop: 10 },
  pageSubtitle: { fontSize: 13, color: '#667A80', marginTop: 4, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btnLight: { flex: 1, backgroundColor: '#F2F6F5', borderWidth: 1, borderColor: '#E2E8E6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnLightText: { color: '#337066', fontSize: 14, fontWeight: '600' },
  btnDark: { flex: 1, backgroundColor: '#4A6B5C', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDarkText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardAlert: { backgroundColor: '#FAD4D0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 13, color: '#667A80', fontWeight: '500' },
  cardTitleAlert: { fontSize: 13, color: '#B53333', fontWeight: '600' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontSize: 28, fontWeight: '700', color: '#1A2E35', marginBottom: 4 },
  cardValueAlert: { color: '#8A2E2E', fontSize: 28, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A2E35', marginTop: 16, marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2F2', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 13, color: '#1A2E35' },
  filterRow: { flexDirection: "row", marginBottom: 16 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "#E2E8E6", marginRight: 8 },
  filterPillActive: { backgroundColor: "#4A6B5C" },
  filterText: { fontSize: 13, color: "#667A80", fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF" },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8E6', marginBottom: 8 },
  tableHeaderText: { fontSize: 11, color: '#99A8A4', fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F2F6F5' },
  itemIconBox: { width: 40, height: 40, backgroundColor: '#F2F6F5', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemIconChar: { fontSize: 18 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1A2E35', marginBottom: 2 },
  itemCategory: { fontSize: 12, color: '#667A80' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#1A2E35' },
  emptyText: { textAlign: "center", color: "#999", fontSize: 14, marginTop: 24, paddingHorizontal: 32 },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  actionSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36, gap: 10 },
  actionSheetTitle: { fontSize: 13, color: "#999", textAlign: "center", marginBottom: 6 },
  actionBtn: { backgroundColor: "#f5f0ee", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  actionBtnHapus: { backgroundColor: "#fdeaea" },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: "#1A2E35" },
  actionBtnTextHapus: { color: "#e53e3e" },
  actionBtnBatal: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 4 },
  actionBtnBatalText: { fontSize: 15, fontWeight: "600", color: "#999" },
  editOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  editBox: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 },
  editTitle: { fontSize: 17, fontWeight: '700', color: '#1A2E35', marginBottom: 16, textAlign: 'center' },
  editLabel: { fontSize: 12, fontWeight: '600', color: '#1A2E35', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  editInput: { borderWidth: 1, borderColor: '#e0d8d6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#333' },
  editButtonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  editButton: { flex: 1, paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  editButtonBatal: { backgroundColor: '#f5f0ee' },
  editButtonBatalText: { fontSize: 14, fontWeight: '600', color: '#777' },
  editButtonSimpan: { backgroundColor: '#4A6B5C' },
  editButtonSimpanText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  editButtonHapusConfirm: { backgroundColor: '#e53e3e' },
  confirmDeleteText: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  confirmBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '80%', maxWidth: 340, alignItems: 'center' },
  confirmIcon: { fontSize: 40, marginBottom: 12 },
  confirmTitle: { fontSize: 18, fontWeight: "700", color: "#1A2E35", marginBottom: 8 },
  confirmDesc: { fontSize: 14, color: "#667A80", textAlign: "center", marginBottom: 0 },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#888" },
  confirmResetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e74c3c",
    alignItems: "center",
  },
  confirmResetText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarOverlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebarContent: { width: 280, backgroundColor: '#FFF', height: '100%', padding: 24, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: Platform.OS === 'android' ? 24 : 0 },
  sidebarTitle: { fontSize: 20, fontWeight: '700', color: '#1A2E35' },
  sidebarClose: { fontSize: 24, color: '#99A8A4', paddingHorizontal: 8 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F6F5' },
  sidebarItemIcon: { fontSize: 20, marginRight: 16 },
  sidebarItemText: { fontSize: 15, fontWeight: '600', color: '#1A2E35' },
});
