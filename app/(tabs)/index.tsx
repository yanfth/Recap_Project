import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Bagian atas - area gambar */}
      <View style={styles.imageArea} />

      {/* Bagian bawah - biru gelap */}
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>
          Welcome To <Text style={styles.bold}>Recap</Text>
        </Text>
        <Text style={styles.subtitle}>
          Lebih Mudah{"\n"}Berjualan Dengan{" "}
          <Text style={styles.bold}>Recap</Text>
        </Text>

        {/* Tombol Lanjut */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.buttonText}>Lanjut</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bottomSheet: {
    backgroundColor: "#1B2A4A",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
    paddingBottom: 48,
    alignItems: "center",
    overflow: "hidden",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#aab8d4",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 999,
    zIndex: 10,
  },
  buttonText: {
    color: "#1B2A4A",
    fontSize: 16,
    fontWeight: "500",
  },
});
