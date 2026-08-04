import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useThemeStore } from "@/stores/theme-store";

const iconSource = require("../assets/branding/centsy-icon.png");

function BrandHeaderTitle({ title }: { title: string }) {
  const colors = useThemeStore((s) => s.colors);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Image
        source={iconSource}
        style={{ width: 24, height: 24, borderRadius: 6 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>
        {title}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const colors = useThemeStore((s) => s.colors);
  const appearance = useThemeStore((s) => s.appearance);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={appearance === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen
            name="snap"
            options={{
              presentation: "modal",
              headerShown: true,
              headerTitle: () => <BrandHeaderTitle title="Snap receipt" />,
              headerTintColor: colors.primary,
              headerStyle: { backgroundColor: colors.background },
            }}
          />
          <Stack.Screen
            name="ai"
            options={{
              headerShown: true,
              headerTitle: () => <BrandHeaderTitle title="Centsy AI" />,
              headerTintColor: colors.primary,
              headerStyle: { backgroundColor: colors.background },
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              presentation: "modal",
              headerShown: true,
              headerTitle: () => <BrandHeaderTitle title="Account" />,
              headerTintColor: colors.primary,
              headerStyle: { backgroundColor: colors.background },
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
