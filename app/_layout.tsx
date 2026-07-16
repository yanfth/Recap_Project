import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        >
          {/* Splash (sekarang index) / Auth screens */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* App screens */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              title: "Modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen name="add-stock" options={{ headerShown: false }} />
          <Stack.Screen
            name="kasir-transaksi"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="pengaturan-pin"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Dashboard-owner" options={{ headerShown: false }} />
          <Stack.Screen name="Dashboard-kasir" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
