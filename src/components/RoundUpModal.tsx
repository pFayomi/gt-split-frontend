import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { formatNaira } from "../data/format";

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
  const { height } = useWindowDimensions();

  const roundedAmount = Math.ceil(amount / 100) * 100;
  const extra = roundedAmount - amount;

  // Keeps the Modal mounted while the exit animation plays
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (extra <= 0) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View style={styles.root}>
        {/* Blurred backdrop - tap outside to dismiss */}
        <Animated.View style={[styles.fill, { opacity: backdropOpacity }]}>
          <BlurView intensity={25} tint="dark" style={styles.fill} />
          <View style={styles.dim} />
          <Pressable style={styles.fill} onPress={onDecline} />
        </Animated.View>

        {/* Bottom sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { minHeight: height * 0.42, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="wallet-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.amount}>{formatNaira(roundedAmount)}</Text>
          </View>

          <Text style={styles.title}>Round up to save?</Text>
          <Text style={styles.body}>
            Round your {formatNaira(amount)} payment up to {formatNaira(roundedAmount)}.
            The extra {formatNaira(extra)} goes into your Savings Box.
          </Text>

          <View style={styles.spacer} />

          <View style={styles.actions}>
            <Pressable
              onPress={onDecline}
              style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}
            >
              <Text style={styles.btnOutlineText} numberOfLines={1}>
                No thanks, pay {formatNaira(amount)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onAccept(roundedAmount)}
              style={({ pressed }) => [styles.btn, styles.btnFilled, pressed && styles.pressed]}
            >
              <Text style={styles.btnFilledText} numberOfLines={1}>
                Round up
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    fill: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    dim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 16,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border ?? "#D1D5DB",
      marginBottom: spacing.lg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    amount: {
      ...typography.h2,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: "left",
      marginBottom: spacing.xs,
    },
    body: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "left",
      lineHeight: 22,
    },
    spacer: { flex: 1, minHeight: spacing.xl },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    btn: {
      flex: 1,
      height: 52,
      borderRadius: radii.md ?? 12,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    btnOutline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border ?? "#E5E7EB",
    },
    btnFilled: {
      backgroundColor: colors.primary,
    },
    btnOutlineText: {
      ...typography.smallBold,
      color: colors.textPrimary,
    },
    btnFilledText: {
      ...typography.smallBold,
      color: "#FFFFFF",
    },
    pressed: { opacity: 0.85 },
  });
}