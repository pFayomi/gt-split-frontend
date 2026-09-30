import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { radii, spacing, shadow, typography } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatusBadge({ status }: { status: "paid" | "pending" | "declined" }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const map = {
    paid: { bg: colors.successLight, fg: colors.success, label: "Paid" },
    pending: { bg: colors.pendingLight, fg: colors.pending, label: "Pending" },
    declined: { bg: colors.dangerLight, fg: colors.danger, label: "Declined" },
  } as const;
  const cfg = map[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.pill,
    },
    badgeText: { ...typography.smallBold },
  });
}