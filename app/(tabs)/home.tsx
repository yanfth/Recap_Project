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
    if (namaToko.trim() === "") return;
    router.push(`/dashboard?namaToko=${namaToko}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Bagian atas putih */}
      <View style={styles.topArea}>
        <Text style={styles.title}>Ayo Siapkan Toko Mu</Text>

        <Text style={styles.label}>Masukkan Nama Toko Mu</Text>

        <TextInput
          style={styles.input}
          placeholder="Nama Tokomu"
          placeholderTextColor="#aaa"
          value={namaToko}
          onChangeText={setNamaToko}
          underlineColorAndroid="transparent" // ← tambahkan ini
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

      {/* Bagian bawah biru */}
      <View style={styles.bottomSheet}>
        <Text style={styles.recapTitle}>Recap</Text>
        <Text style={styles.recapSubtitle}>
          Lebih Mudah Berjualan Dengan <Text style={styles.bold}>Recap</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topArea: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 32,
    justifyContent: "center",
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#4B2E2B",
    textAlign: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#444",
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#4B2E2B",
    paddingVertical: 8,
    fontSize: 15,
    color: "#4B2E2B",
  },
  button: {
    backgroundColor: "#4B2E2B",
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
  bottomSheet: {
    backgroundColor: "#4B2E2B",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
    paddingBottom: 48,
    alignItems: "center",
    overflow: "hidden",
  },
  recapTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  recapSubtitle: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
    color: "#fff",
  },
  circleSmall: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#aab8d4",
    bottom: 80,
    right: 40,
  },
  circleLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#2e4068",
    bottom: -60,
    right: -40,
  },
});
