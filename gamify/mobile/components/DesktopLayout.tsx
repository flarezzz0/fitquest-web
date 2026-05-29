import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { colors } from "../theme/colors";

const NAV_ITEMS = [
  { key: "dashboard" as const, icon: "🏠", label: "แดชบอร์ด" },
  { key: "upload" as const, icon: "📸", label: "บันทึกกิจกรรม" },
  { key: "quests" as const, icon: "📅", label: "เควส" },
  { key: "shop" as const, icon: "🛒", label: "ร้านค้า" },
  { key: "profile" as const, icon: "👤", label: "โปรไฟล์" },
];

export type PageKey = (typeof NAV_ITEMS)[number]["key"];

interface Props {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}

export default function DesktopLayout({ activePage, onNavigate, children }: Props) {
  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        {/* Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🎮</Text>
          <View>
            <Text style={styles.logoTitle}>FitQuest</Text>
            <Text style={styles.logoSub}>AI Fitness Tracker</Text>
          </View>
        </View>

        {/* Nav Items */}
        <View style={styles.navSection}>
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => onNavigate(item.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom info */}
        <View style={styles.sidebarFooter}>
          <View style={styles.divider} />
          <Text style={styles.footerText}>FitQuest v1.0</Text>
          <Text style={styles.footerSub}>AI Agent System</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.bg,
  },
  sidebar: {
    width: 240,
    backgroundColor: colors.pureBlack,
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  logoSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  navSection: {
    flex: 1,
    paddingVertical: 12,
    gap: 2,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: "rgba(0,102,204,0.12)",
  },
  navIcon: { fontSize: 20, width: 28, textAlign: "center" },
  navLabel: { fontSize: 14, fontWeight: "500", color: colors.textDim },
  navLabelActive: { color: colors.primary, fontWeight: "600" },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginBottom: 12 },
  footerText: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },
  footerSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  content: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
