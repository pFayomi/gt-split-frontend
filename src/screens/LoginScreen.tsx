import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, TextInput } from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { useAppStore } from "../state/AppStore";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import PinEntry from "../components/PinEntry";

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

      <PinEntry
        title="Enter Password"
        pin={pin}
        length={6}
        error={error}
        status={loading ? "Checking..." : null}
        hint="Demo accounts use PIN: 123456"
        onKey={handleKey}
        biometric={
          biometricAvailable
            ? { label: biometricLabel, onPress: handleBiometricLogin }
            : undefined
        }
      />

      <Text style={styles.forgot}>Forgot password?</Text>
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
    forgot: { ...typography.bodyMedium, color: ACCENT, marginTop: spacing.md },
  });
}