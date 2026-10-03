import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, TextInput } from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { useAppStore } from "../state/AppStore";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"];

// Brand accent taken from the design (orange)
const ACCENT = "#F26B3A";
const SOFT_GRAY = "#F2F2F2";

const DEMO_ACCOUNTS = [
  { label: "Erioluwa", accountNumber: "3005335181" },
  { label: "Bibian", accountNumber: "3005335182" },
  { label: "Chidi", accountNumber: "3005335183" },
  { label: "Oluwapelumi", accountNumber: "3005335184" },
];

export default function LoginScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const { login, loginWithBiometrics } = useAppStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const [accountNumber, setAccountNumber] = useState("");
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const isFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        setBiometricLabel(isFace ? "Face ID" : "Fingerprint");
        setBiometricAvailable(true);
      }
    })();
  }, []);

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Log in to GT World",
      fallbackLabel: "Use PIN instead",
    });
    if (result.success) {
      loginWithBiometrics();
    }
  };

  const attemptLogin = async (fullPin: string) => {
    setLoading(true);
    setError(null);
    const result = await login(accountNumber, fullPin);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed");
      setPin("");
    }
  };

  const handleKey = (key: string) => {
    setError(null);
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "" || key === "bio") return;
    if (pin.length >= 6 || loading) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 6) {
      attemptLogin(next);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={toggleTheme} style={styles.themeToggle}>
        <Ionicons
          name={mode === "light" ? "moon-outline" : "sunny-outline"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {/* Placeholder logo: swap the Ionicons for an <Image source={...} /> later */}
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Ionicons name="person" size={34} color={ACCENT} />
        </View>
      </View>

      <View style={styles.accountField}>
        <View style={styles.accountRow}>
          <TextInput
            style={styles.accountInput}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            placeholder="Account Number"
            placeholderTextColor={colors.textMuted}
          />
          <Pressable onPress={() => setShowDemoDropdown((v) => !v)} style={styles.dropdownToggle}>
            <Ionicons
              name={showDemoDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
        {showDemoDropdown && (
          <View style={styles.dropdownList}>
            {DEMO_ACCOUNTS.map((acc, i) => (
              <Pressable
                key={acc.accountNumber}
                onPress={() => {
                  setAccountNumber(acc.accountNumber);
                  setShowDemoDropdown(false);
                }}
                style={[
                  styles.dropdownItem,
                  i === DEMO_ACCOUNTS.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.dropdownItemText}>{acc.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.title}>Enter Password</Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && { backgroundColor: ACCENT },
              error && { backgroundColor: colors.danger },
            ]}
          />
        ))}
      </View>
      {loading && <Text style={styles.statusText}>Checking...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.keypad}>
        {KEYS.map((k, idx) => {
          if (k === "bio") {
            return (
              <View key={idx} style={styles.key}>
                {biometricAvailable && (
                  <Pressable onPress={handleBiometricLogin} style={styles.biometricButton}>
                    <Ionicons
                      name={biometricLabel === "Face ID" ? "scan-outline" : "finger-print-outline"}
                      size={28}
                      color={ACCENT}
                    />
                  </Pressable>
                )}
              </View>
            );
          }
          if (k === "del") {
            return (
              <Pressable key={idx} onPress={() => handleKey(k)} style={styles.key}>
                <View style={styles.delBox}>
                  <Text style={styles.delText}>{"\u2715"}</Text>
                </View>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={idx}
              onPress={() => handleKey(k)}
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

      <Text style={styles.forgot}>Forgot password?</Text>
      <Text style={styles.hint}>Demo accounts use PIN: 123456</Text>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    themeToggle: { position: "absolute", top: 50, right: spacing.lg, padding: 4 },
    logoWrap: { marginBottom: spacing.md },
    logoCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: "#2B2B2B",
      alignItems: "center",
      justifyContent: "center",
    },
    accountField: { width: 220, marginBottom: spacing.md },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: SOFT_GRAY,
      borderRadius: radii.md,
      overflow: "hidden",
    },
    accountInput: {
      flex: 1,
      paddingVertical: 8,
      paddingLeft: 32,
      textAlign: "center",
      color: "#222222",
      ...typography.small,
    },
    dropdownToggle: { width: 32, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
    dropdownList: {
      marginTop: 4,
      borderRadius: radii.md,
      backgroundColor: SOFT_GRAY,
      overflow: "hidden",
    },
    dropdownItem: {
      paddingVertical: 9,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#DDDDDD",
    },
    dropdownItemText: { color: "#222222", ...typography.small, textAlign: "center" },
    title: {
      ...typography.bodyBold,
      fontSize: 17,
      lineHeight: 23,
      color: colors.textPrimary,
      marginBottom: 14,
    },
    dotsRow: { flexDirection: "row", gap: 12, marginBottom: spacing.sm },
    dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#8A8A8A" },
    statusText: { color: colors.textSecondary, ...typography.small, marginTop: spacing.xs },
    errorText: { color: colors.danger, ...typography.small, marginTop: spacing.xs, textAlign: "center" },
    keypad: {
      marginTop: spacing.lg,
      width: 303,
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
    forgot: { ...typography.bodyMedium, color: ACCENT, marginTop: spacing.md },
    hint: { ...typography.small, fontSize: 11, lineHeight: 15, color: colors.textMuted, marginTop: spacing.sm },
  });
}