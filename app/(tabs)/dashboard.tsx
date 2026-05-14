import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Dashboard() {
  const { namaToko } = useLocalSearchParams();
  const router = useRouter();
  const [namaMenu, setNamaMenu] = useState("");
  const [harga, setHarga] = useState("");
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const fotoOptions = [
    { id: "food", label: "Food", emoji: "🍜" },
    { id: "drink", label: "Drink", emoji: "🥤" },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Bagian atas putih */}
        <View style={styles.topArea}>
          <Text style={styles.title}>Halo , {namaToko}</Text>
          <Text style={styles.subtitle}>Ayo masukkan Menu Tokomu !</Text>

          {/* Nama Menu */}
          <Text style={styles.label}>Nama Menu</Text>
          <TextInput
            style={styles.input}
            placeholder="Ayam Goreng"
            placeholderTextColor="#aaa"
            value={namaMenu}
            onChangeText={setNamaMenu}
            underlineColorAndroid="transparent"
          />

          {/* Harga */}
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

          {/* Foto Product */}
          <Text style={styles.label}>Foto Product</Text>
          <View style={styles.fotoContainer}>
            {fotoOptions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.fotoCard,
                  selectedFoto === item.id && styles.fotoCardSelected,
                ]}
                onPress={() => setSelectedFoto(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.fotoIconBox}>
                  <Text style={styles.fotoEmoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.fotoLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tombol Lanjut */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {}}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              activeOpacity={1}
            >
              <Text style={styles.buttonText}>Lanjut</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bagian bawah biru */}
        <View style={styles.bottomSheet} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2A4A",
  },
  scroll: {
    flexGrow: 1,
  },
  topArea: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 28,
    gap: 12,
    justifyContent: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  bottomSheet: {
    backgroundColor: "#1B2A4A",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
    paddingBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1B2A4A",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 14,
    color: "#1B2A4A",
  },
  fotoContainer: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 16,
    padding: 16,
  },
  fotoCard: {
    alignItems: "center",
    gap: 8,
    opacity: 0.6,
  },
  fotoCardSelected: {
    opacity: 1,
  },
  fotoIconBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#1B2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoEmoji: {
    fontSize: 36,
  },
  fotoLabel: {
    fontSize: 12,
    color: "#444",
  },
  button: {
    backgroundColor: "#1B2A4A",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  bottomSheet: {
    height: 60,
    backgroundColor: "#1B2A4A",
  },
});
