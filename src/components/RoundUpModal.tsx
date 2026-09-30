import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { formatNaira } from "../data/format";
import Button from "./Button";

export default function RoundUpModal({
  visible,
  amount,
  onAccept,
  onDecline,
}: {
  visible: boolean;
  amount: number;
  onAccept: (roundedAmount: number) => void;
  onDecline: () => void;
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const roundedAmount = Math.ceil(amount / 100) * 100;
  const extra = roundedAmount - amount;

  if (extra <= 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="wallet-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Round up to save?</Text>
          <Text style={styles.body}>
            Round your {formatNaira(amount)} payment up to {formatNaira(roundedAmount)}.
            The extra {formatNaira(extra)} goes into your Savings Box.
          </Text>
          <Button label={`Round up to ${formatNaira(roundedAmount)}`} onPress={() => onAccept(roundedAmount)} />
          <Pressable onPress={onDecline} style={styles.declineButton}>
            <Text style={styles.declineText}>No thanks, pay {formatNaira(amount)}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl,
      alignItems: "center", width: "100%", maxWidth: 320,
    },
    icon: {
      width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight,
      alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
    },
    title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
    body: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
    declineButton: { marginTop: spacing.sm, padding: spacing.sm },
    declineText: { color: colors.textSecondary, ...typography.smallBold },
  });
}