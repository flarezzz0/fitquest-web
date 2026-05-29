import { Tabs } from "expo-router";
import { Text, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { colors } from "../../theme/colors";

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

  return (
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
      <Tabs.Screen name="index" options={{ title: "หน้าแรก" }} />
      <Tabs.Screen name="upload" options={{ title: "บันทึก" }} />
      <Tabs.Screen name="quests" options={{ title: "เควส" }} />
      <Tabs.Screen name="shop" options={{ title: "ร้านค้า" }} />
      <Tabs.Screen name="profile" options={{ title: "โปรไฟล์" }} />
    </Tabs>
  );
}

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
