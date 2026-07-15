import { Stack, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useAuth } from "./context/AuthContext";
import { useEventListener } from "expo";

export default function SplashScreen() {
  const router = useRouter();
  const { isSetupDone } = useAuth();

  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Setup video player
  const player = useVideoPlayer(
    require("../assets/videos/splash.mp4"),
    (player) => {
      player.loop = false;
      player.play();
    },
  );

  useEventListener(player, "playToEnd", () => {
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      if (isSetupDone) {
        router.replace("/login");
      } else {
        router.replace("/");
      }
    });
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[styles.videoWrapper, { opacity: containerOpacity }]}
      >
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          contentFit="cover"
          nativeControls={false}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4B2E2B",
    justifyContent: "center",
    alignItems: "center",
  },
  videoWrapper: {
    flex: 1,
    width: "100%",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
