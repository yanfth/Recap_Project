import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLanjut = async () => {
    await AsyncStorage.setItem("has_seen_welcome", "true");
    router.push("/login");
  };

  return (
    // Delete This Stage if not use
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.imageArea}>
        <Image
          source={require("../../assets/images/landing_Page.png")}
          style={styles.landingImage}
          resizeMode="contain"
        />
      </View>

      {/* Bagian bawah */}
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>
          Welcome To <Text style={styles.bold}>Recap</Text>
        </Text>
        <Text style={styles.subtitle}>
          Lebih Mudah{"\n"}Berjualan Dengan{" "}
          <Text style={styles.bold}>Recap</Text>
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleLanjut}>
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
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeImage: {
    width: "80%",
    height: "80%",
  },
  // Delete This Stage if not use
  landingImage: {
    width: "100%",
    height: 350,
    alignSelf: "center",
  },
  bottomSheet: {
    backgroundColor: "#1B543A",
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
    color: "#fff",
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
    color: "#1B543A",
    fontSize: 16,
    fontWeight: "500",
  },
});
