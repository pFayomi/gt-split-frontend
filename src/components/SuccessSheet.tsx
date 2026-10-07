import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { formatNaira } from "../data/format";

// Green confirmation tick, same as the create-split sheet.
const GT_GREEN = "#1FB141";

/**
 * The project's single dialog: a blurred bottom sheet in the shape of the
 * "split request sent" sheet (handle, badge + amount, title, button row).
 *
 * It owns only the open/close animation — `visible` stays owned by the calling
 * screen, and the action callbacks run after the sheet has finished sliding
 * out, so navigation still happens off-screen.
 */
export default function SuccessSheet({
  visible,
  onClose,
  icon,
  badge,
  amount,
  title,
  body,
  secondary,
  primary,
}: {
  visible: boolean;
  /** Runs after the exit animation when the sheet is dismissed, not actioned. */
  onClose: () => void;
  /**
   * "success" (default) draws the green tick with `badge` overlapping it;
   * "accent" draws `icon.name` in the orange tint used for non-success prompts.
   */
  icon?: { name: any; tone?: "success" | "accent" };
  /** Small icon that overlaps the leading badge. */
  badge?: any;
  /** Shown large on the right of the top row. Omit for a title-only sheet. */
  amount?: number;
  title: string;
  body?: string;
  secondary?: { label: string; onPress: () => void };
  primary: { label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { height } = useWindowDimensions();
  const tone = icon?.tone ?? "success";

  // Keeps the Modal mounted while the exit animation plays
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
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

  /** Slides out, then runs `after` (a button action) or `onClose` if omitted. */
  const dismissThen = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      if (after) after();
      else onClose();
    });
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismissThen()}
    >
      <View style={styles.root}>
        {/* Blurred backdrop - tap outside to dismiss */}
        <Animated.View style={[styles.fill, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={Platform.OS === "ios" ? 35 : 60}
            tint="dark"
            blurMethod="dimezisBlurView"
            style={styles.fill}
          />
          <View style={styles.dim} />
          <Pressable style={styles.fill} onPress={() => dismissThen()} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { minHeight: height * 0.42, transform: [{ translateY }] }]}>
          <View style={styles.handle} />

          <View style={styles.topRow}>
            <View style={styles.badges}>
              {tone === "success" ? (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </View>
              ) : (
                <View style={styles.accentBadge}>
                  <Ionicons name={icon?.name ?? "checkmark"} size={22} color={colors.primary} />
                </View>
              )}
              {!!badge && (
                <View style={styles.overlayBadge}>
                  <Ionicons name={badge} size={15} color={colors.primary} />
                </View>
              )}
            </View>
            {amount !== undefined && <Text style={styles.amount}>{formatNaira(amount)}</Text>}
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!body && <Text style={styles.body}>{body}</Text>}

          <View style={styles.spacer} />

          <View style={styles.actions}>
            {secondary && (
              <Pressable
                onPress={() => dismissThen(secondary.onPress)}
                style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}
              >
                <Text style={styles.btnOutlineText} numberOfLines={1}>
                  {secondary.label}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => dismissThen(primary.onPress)}
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
            >
              <Text style={styles.btnPrimaryText} numberOfLines={1}>
                {primary.label}
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
    root: { flex: 1, justifyContent: "flex-end" },
    fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    dim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.25)" },

    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 30,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 16,
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 20,
    },

    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    badges: { flexDirection: "row", alignItems: "center" },
    checkBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: GT_GREEN,
      alignItems: "center",
      justifyContent: "center",
    },
    accentBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    // Sits on top of the leading badge — the card-coloured ring is what makes
    // the overlap read as two badges instead of a clipping glitch.
    overlayBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 2.5,
      borderColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -10,
    },
    amount: { ...typography.display, color: colors.textPrimary },

    title: { ...typography.bodyBold, fontSize: 20, lineHeight: 27, color: colors.textPrimary },
    body: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginTop: 6 },
    spacer: { flex: 1, minHeight: 20 },

    actions: { flexDirection: "row", gap: 12 },
    btn: {
      flex: 1,
      height: 50,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    btnOutline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    btnOutlineText: { ...typography.buttonLarge, color: colors.textPrimary },
    btnPrimary: { backgroundColor: colors.primary },
    btnPrimaryText: { ...typography.buttonLarge, color: "#fff" },
    pressed: { opacity: 0.8 },
  });
}