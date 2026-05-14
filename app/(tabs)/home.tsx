import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Selamat Datang di Recap! 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B2A4A",
  },
  text: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
});
