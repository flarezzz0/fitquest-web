import React from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  cta?: string;
  onCta?: () => void;
}

export default function EmptyState({ icon = "📭", title, subtitle, cta, onCta }: Props) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[s.box, { opacity: fadeAnim }]}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      {cta && onCta && (
        <Text style={s.cta} onPress={onCta}>{cta}</Text>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  box: { padding: 32, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: "600", color: colors.textDim, textAlign: "center" },
  sub: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 6, lineHeight: 18 },
  cta: { fontSize: 13, fontWeight: "600", color: colors.primary, marginTop: 12, textDecorationLine: "underline" },
});
