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

// Beritahu Expo Router bahwa layar pertama adalah "splash"
export const unstable_settings = {
  initialRouteName: "splash",
};

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
          {/* Splash — selalu jadi layar pertama */}
          <Stack.Screen name="splash" options={{ headerShown: false }} />

          {/* Auth screens */}
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
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
