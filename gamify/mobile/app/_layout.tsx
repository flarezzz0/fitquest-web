import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { useStore } from "../store/useStore";
import { ToastProvider } from "../components/Toast";
import { getTokenFromUrl, fetchUserInfo } from "../services/auth";

export default function RootLayout() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s._hydrated);
  const setUser = useStore((s) => s.setUser);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    const checkRedirect = async () => {
      const tokenData = getTokenFromUrl();
      if (tokenData) {
        const userInfo = await fetchUserInfo(tokenData.accessToken);
        if (userInfo) setUser(userInfo);
      }
    };
    checkRedirect();
  }, []);

  return (
    <ToastProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        {hydrated ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
