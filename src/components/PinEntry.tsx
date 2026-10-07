import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";

// Same 3-wide grid as the login screen: "bio" holds the biometrics key when a
// screen offers one, and stays an empty slot when it does not.
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"];
const SOFT_GRAY = "#F2F2F2";

/**
 * The project's single password-entry UI: the "Enter Password" heading, the row
 * of PIN dots and the on-screen keypad lifted out of LoginScreen so every PIN
 * prompt in the app (login, split payment, account transfer) looks identical.
 *
 * Purely presentational — the owning screen keeps its pin state and its
 * `handleKey`, so no submission behaviour moves in here.
 */
export default function PinEntry({
  title,
  pin,
  length = 6,
  error,
  status,
  hint,
  onKey,
  biometric,
}: {
  title?: string;
  pin: string;
  length?: number;
  error?: string | null;
  /** Transient line under the dots, e.g. "Checking..." while a request runs. */
  status?: string | null;
  hint?: string;
  /** Receives a digit, "del", or "bio". The owner decides what those mean. */
  onKey: (key: string) => void;
  biometric?: { label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.root}>
      {!!title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.dotsRow}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && { backgroundColor: colors.primary },
              error && { backgroundColor: colors.danger },
            ]}
          />
        ))}
      </View>

      {!!status && <Text style={styles.statusText}>{status}</Text>}
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.keypad}>
        {KEYS.map((k, idx) => {
          if (k === "bio") {
            return (
              <View key={idx} style={styles.key}>
                {biometric && (
                  <Pressable onPress={biometric.onPress} style={styles.biometricButton}>
                    <Ionicons
                      name={biometric.label === "Face ID" ? "scan-outline" : "finger-print-outline"}
                      size={28}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
              </View>
            );
          }
          if (k === "del") {
            return (
              <Pressable key={idx} onPress={() => onKey(k)} style={styles.key}>
                <View style={styles.delBox}>
                  <Text style={styles.delText}>{"\u2715"}</Text>
                </View>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={idx}
              onPress={() => onKey(k)}
              disabled={k === ""}
              style={({ pressed }) => [
                styles.key,
                pressed && k !== "" && { backgroundColor: SOFT_GRAY },
              ]}
            >
              <Text style={styles.keyText}>{k}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    // Full-bleed so the heading and messages can centre across the screen,
    // while the dots and keypad stay at their natural width in the middle.
    root: { width: "100%" },
    title: {
      ...typography.bodyBold,
      fontSize: 17,
      lineHeight: 23,
      color: colors.textPrimary,
      textAlign: "center",
      alignSelf: "stretch",
      marginBottom: 14,
    },
    dotsRow: {
      flexDirection: "row",
      gap: 12,
      alignSelf: "center",
      marginBottom: spacing.sm,
    },
    dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#8A8A8A" },
    statusText: {
      color: colors.textSecondary,
      ...typography.small,
      marginTop: spacing.xs,
      textAlign: "center",
      alignSelf: "stretch",
    },
    errorText: {
      color: colors.danger,
      ...typography.small,
      marginTop: spacing.xs,
      textAlign: "center",
      alignSelf: "stretch",
    },
    keypad: {
      marginTop: spacing.lg,
      width: 303,
      alignSelf: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    key: {
      width: 101,
      height: 88,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
    },
    keyText: { ...typography.h1, fontSize: 32, lineHeight: 38, color: colors.textPrimary },
    delBox: {
      width: 42,
      height: 32,
      borderRadius: 7,
      backgroundColor: SOFT_GRAY,
      alignItems: "center",
      justifyContent: "center",
    },
    delText: { ...typography.smallMedium, fontSize: 14, color: "#444444" },
    biometricButton: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    hint: {
      ...typography.small,
      fontSize: 11,
      lineHeight: 15,
      color: colors.textMuted,
      marginTop: spacing.md,
      textAlign: "center",
      alignSelf: "stretch",
    },
  });
}