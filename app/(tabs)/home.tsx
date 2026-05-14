import { Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [namaToko, setNamaToko] = useState("");
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

  const handleLanjut = () => {
    if (namaToko.trim() === "") return; // jangan lanjut kalau kosong
    router.push({
      pathname: "/dashboard",
      params: { namaToko }, // kirim nama toko ke halaman berikutnya
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.card}>
        <Text style={styles.title}>Ayo Siapkan Toko Mu</Text>

        <Text style={styles.label}>Masukkan Nama Toko Mu</Text>

        <TextInput
          style={styles.input}
          placeholder="contoh: Toko Berkah"
          placeholderTextColor="#aaa"
          value={namaToko}
          onChangeText={setNamaToko}
        />

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.button,
              namaToko.trim() === "" && styles.buttonDisabled,
            ]}
            onPress={handleLanjut}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
          >
            <Text style={styles.buttonText}>Lanjut</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.bottomBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2A4A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1B2A4A",
    textAlign: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#444",
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#1B2A4A",
    paddingVertical: 8,
    fontSize: 15,
    color: "#1B2A4A",
  },
  button: {
    backgroundColor: "#1B2A4A",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  bottomBar: {
    height: 60,
    width: "100%",
    backgroundColor: "#1B2A4A",
    marginTop: 16,
  },
});
