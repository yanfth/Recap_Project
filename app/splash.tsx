import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useAuth } from "./context/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { isSetupDone } = useAuth();

  const rScale = useRef(new Animated.Value(0)).current;
  const rOpacity = useRef(new Animated.Value(0)).current;
  const ecapOpacity = useRef(new Animated.Value(0)).current;
  const ecapTranslateX = useRef(new Animated.Value(-20)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Jalankan animasi dulu, BARU cek status user setelah selesai
    Animated.sequence([
      // 1. Huruf R muncul
      Animated.parallel([
        Animated.spring(rScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(rOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // 2. Jeda
      Animated.delay(200),

      // 3. "ecap" muncul
      Animated.parallel([
        Animated.timing(ecapOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(ecapTranslateX, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 4. Tahan
      Animated.delay(800),

      // 5. Fade out
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Setelah animasi selesai, cek status setup PIN dari AuthContext
      if (isSetupDone) {
        // User lama — langsung ke login
        router.replace("/login");
      } else {
        // User baru — ke Welcome (index)
        router.replace("/");
      }
    });
  }, [isSetupDone]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={{ opacity: containerOpacity }}>
        <View style={styles.logoRow}>
          <Animated.Text
            style={[
              styles.letterR,
              {
                opacity: rOpacity,
                transform: [{ scale: rScale }],
              },
            ]}
          >
            R
          </Animated.Text>

          <Animated.Text
            style={[
              styles.letterEcap,
              {
                opacity: ecapOpacity,
                transform: [{ translateX: ecapTranslateX }],
              },
            ]}
          >
            ecap
          </Animated.Text>
        </View>

        <Animated.Text style={[styles.tagline, { opacity: ecapOpacity }]}>
          Lebih Mudah Berjualan
        </Animated.Text>
      </Animated.View>
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
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  letterR: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#fff",
  },
  letterEcap: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#aab8d4",
    marginLeft: 2,
  },
  tagline: {
    fontSize: 14,
    color: "#aab8d4",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 2,
  },
});
