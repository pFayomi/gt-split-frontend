import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, TextInput } from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { useAppStore } from "../state/AppStore";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"];

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
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>GT</Text>
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
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
        {showDemoDropdown && (
          <View style={styles.dropdownList}>
            {DEMO_ACCOUNTS.map((acc) => (
              <Pressable
                key={acc.accountNumber}
                onPress={() => {
                  setAccountNumber(acc.accountNumber);
                  setShowDemoDropdown(false);
                }}
                style={styles.dropdownItem}
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
              i < pin.length && { backgroundColor: colors.primary },
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
                      size={26}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
              </View>
            );
          }
          return (
            <Pressable
              key={idx}
              onPress={() => handleKey(k)}
              disabled={k === ""}
              style={({ pressed }) => [
                styles.key,
                pressed && k !== "" && { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text style={styles.keyText}>{k === "del" ? "\u2715" : k}</Text>
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
    container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
    themeToggle: { position: "absolute", top: 50, right: spacing.lg, padding: 4 },
    logoWrap: { marginBottom: spacing.md },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: { color: colors.white, fontWeight: "800", fontSize: 22 },
    accountField: { width: 240, marginBottom: spacing.lg },
    accountRow: {
      flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border,
      borderRadius: radii.md, overflow: "hidden",
    },
    accountInput: {
      flex: 1, padding: 10, textAlign: "center", color: colors.textPrimary, ...typography.small,
    },
    dropdownToggle: {
      paddingHorizontal: 10, paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: colors.border,
    },
    dropdownList: {
      marginTop: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
      backgroundColor: colors.card, overflow: "hidden",
    },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    dropdownItemText: { color: colors.textPrimary, ...typography.small, textAlign: "center" },
    title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    dotsRow: { flexDirection: "row", gap: 12, marginBottom: spacing.sm },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
    statusText: { color: colors.textSecondary, ...typography.small, marginTop: spacing.xs },
    errorText: { color: colors.danger, ...typography.small, marginTop: spacing.xs, textAlign: "center" },
    keypad: {
      marginTop: spacing.xl,
      width: 280,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    key: {
      width: 84,
      height: 66,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
    },
    keyText: { fontSize: 24, color: colors.textPrimary, fontWeight: "500" },
    biometricButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    forgot: { color: colors.primary, marginTop: spacing.lg, ...typography.bodyBold },
    hint: { color: colors.textMuted, marginTop: spacing.md, ...typography.small },
  });
}