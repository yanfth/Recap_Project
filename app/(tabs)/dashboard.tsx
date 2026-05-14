import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Dashboard() {
  const { namaToko } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.greeting}>Selamat Datang! 👋</Text>
      <Text style={styles.tokoName}>{namaToko}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B2A4A",
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    color: "#aab8d4",
    fontSize: 18,
    marginBottom: 8,
  },
  tokoName: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
});
