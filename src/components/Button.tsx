import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { radii, typography, spacing } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";

type Variant = "primary" | "muted" | "outline" | "danger" | "ghost";

export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const variantStyle = styles[variant];
  const textColor =
    variant === "primary" || variant === "danger"
      ? colors.white
      : variant === "muted"
      ? colors.primary
      : variant === "outline"
      ? colors.textPrimary
      : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    base: {
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { ...typography.bodyBold },
    primary: { backgroundColor: colors.primary },
    muted: { backgroundColor: colors.primaryLight },
    outline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    danger: { backgroundColor: colors.danger },
    ghost: { backgroundColor: "transparent" },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
  });
}