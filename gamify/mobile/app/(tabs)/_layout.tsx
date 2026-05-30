import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Text, View, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { colors, useThemeColors } from "../../theme/colors";
import { useStore } from "../../store/useStore";
import { useTranslation } from "../../hooks/useTranslation";

const ICONS: Record<string, string> = {
  index: "🏠",
  upload: "📸",
  quests: "📅",
  shop: "🛒",
  profile: "👤",
};

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const themeMode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const { t } = useTranslation();
  const themeColors = useThemeColors();

  // Apply CSS custom properties for web reactive theming
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--fit-bg", themeColors.bg);
      root.style.setProperty("--fit-card", themeColors.card);
      root.style.setProperty("--fit-text", themeColors.text);
      root.style.setProperty("--fit-text-dim", themeColors.textDim);
      root.style.setProperty("--fit-text-muted", themeColors.textMuted);
      root.style.setProperty("--fit-border", themeColors.cardBorder);
      root.style.setProperty("--fit-primary", themeColors.primary);
      root.style.setProperty("--fit-success", themeColors.success);
      root.style.setProperty("--fit-warning", themeColors.warning);
      root.style.setProperty("--fit-error", themeColors.error);
      root.style.setProperty("--fit-gold", themeColors.gold);
    }
  }, [themeColors]);

  const toggleLang = () => setLanguage(language === "th" ? "en" : "th");
  const cycleTheme = () => {
    const next = themeMode === "dark" ? "light" : themeMode === "light" ? "system" : "dark";
    setThemeMode(next);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Floating Settings — top right */}
      <View style={styles.floatingBar}>
        {/* Language toggle */}
        <TouchableOpacity onPress={toggleLang} style={styles.pill}>
          <Text style={styles.pillIcon}>🌐</Text>
          <Text style={styles.pillText}>{language === "th" ? "TH" : "EN"}</Text>
        </TouchableOpacity>
        {/* Theme toggle */}
        <TouchableOpacity onPress={cycleTheme} style={styles.pill}>
          <Text style={styles.pillIcon}>
            {themeMode === "dark" ? "🌙" : themeMode === "light" ? "☀️" : "📱"}
          </Text>
          <Text style={styles.pillText}>
            {themeMode === "dark" ? "Dark" : themeMode === "light" ? "Light" : "Auto"}
          </Text>
        </TouchableOpacity>
      </View>

      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: isDesktop ? desktopStyles.tab : mobileStyles.tab,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: isDesktop ? desktopStyles.label : mobileStyles.label,
          tabBarItemStyle: isDesktop ? desktopStyles.item : undefined,
          tabBarIcon: ({ focused }) => (
            <Text style={[isDesktop ? desktopStyles.icon : mobileStyles.icon, { opacity: focused ? 1 : 0.5 }]}>
              {ICONS[route.name] || "❓"}
            </Text>
          ),
        })}
      >
        <Tabs.Screen name="index" options={{ title: t('nav.home') }} />
        <Tabs.Screen name="upload" options={{ title: t('nav.upload') }} />
        <Tabs.Screen name="quests" options={{ title: t('nav.quests') }} />
        <Tabs.Screen name="shop" options={{ title: t('nav.shop') }} />
        <Tabs.Screen name="profile" options={{ title: t('nav.profile') }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBar: {
    position: "absolute",
    top: Platform.OS === "web" ? 48 : 80,
    right: 14,
    zIndex: 999,
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(39,39,41,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pillIcon: { fontSize: 12 },
  pillText: { fontSize: 10, fontWeight: "600", color: colors.text },
});

const mobileStyles = StyleSheet.create({
  tab: {
    backgroundColor: colors.pureBlack,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 4,
    height: 64,
  },
  label: { fontSize: 10, fontWeight: "400", letterSpacing: -0.12 },
  icon: { fontSize: 22 },
});

const desktopStyles = StyleSheet.create({
  tab: {
    backgroundColor: colors.pureBlack,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingBottom: 12,
    paddingTop: 8,
    height: 72,
  },
  label: { fontSize: 13, fontWeight: "500" },
  icon: { fontSize: 26 },
  item: { paddingVertical: 6 },
});
