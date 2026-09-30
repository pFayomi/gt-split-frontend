import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { API_BASE_URL } from "../data/config";
import Button from "../components/Button";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function TransferScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { amount, splitTitle, splitId, roundedAmount, roundUpAccepted, hostAccountNumber, participantId } = route.params;
  const { currentUser, refreshBalance } = useAppStore();

  const finalAmount = roundUpAccepted ? roundedAmount : amount;

  const [pin, setPin] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess(false);
      navigation.navigate("Home");
    }, 2500);
    return () => clearTimeout(timer);
  }, [success]);

  const handleKey = (key: string) => {
    setError(null);
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "" || pin.length >= 4 || processing) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      submitPayment(next);
    }
  };

  const submitPayment = async (enteredPin: string) => {
    if (!currentUser) return;
    setProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/debit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: currentUser.accountNumber,
          amount: finalAmount,
          kind: "billsplit",
          title: `For ${splitTitle} split`,
          subtitle: "Split payment",
          splitId,
        }),
      });

      if (!response.ok) {
        setError("Payment failed. Check your balance.");
        setPin("");
        setProcessing(false);
        return;
      }

      await fetch(`${API_BASE_URL}/transactions/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: hostAccountNumber,
          amount,
          title: `${currentUser.fullName} settled their share`,
          subtitle: splitTitle,
        }),
      });

      if (participantId) {
        await fetch(`${API_BASE_URL}/splits/${splitId}/participants/${participantId}/toggle`, {
          method: "PATCH",
        });
      }

      if (roundUpAccepted) {
        const roundUpExtra = roundedAmount - amount;
        await fetch(`${API_BASE_URL}/savings/contribute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber: hostAccountNumber ?? currentUser.accountNumber,
            contributorName: currentUser.fullName,
            splitId,
            splitTitle,
            amount: roundUpExtra,
          }),
        });
      }

      await refreshBalance();
      setSuccess(true);
    } catch (e) {
      setError("Could not reach the server.");
      setPin("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate("Home")}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>You're paying</Text>
        <Text style={styles.amount}>{formatNaira(finalAmount)}</Text>
        <Text style={styles.subtitle}>{splitTitle}</Text>
        {roundUpAccepted && (
          <Text style={styles.roundUpNote}>
            Includes {formatNaira(roundedAmount - amount)} round-up to the Savings Box
          </Text>
        )}

        <Text style={styles.pinLabel}>Enter your PIN to confirm</Text>
        <View style={styles.dotsRow}>
          {Array.from({ length: 4 }).map((_, i) => (
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
        {processing && <Text style={styles.statusText}>Processing...</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.keypad}>
          {KEYS.map((k, idx) => (
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
          ))}
        </View>
      </View>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.modalTitle}>Payment Successful</Text>
            <Text style={styles.modalBody}>
              {formatNaira(finalAmount)} sent for {splitTitle}.
            </Text>
            <Button
              label="Done"
              onPress={() => {
                setSuccess(false);
                navigation.navigate("Home");
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      padding: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { ...typography.h3, color: colors.textPrimary },
    body: { flex: 1, alignItems: "center", paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
    label: { ...typography.small, color: colors.textSecondary },
    amount: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xs },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    roundUpNote: { ...typography.small, color: colors.primary, marginTop: spacing.sm, textAlign: "center" },
    pinLabel: { ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
    dotsRow: { flexDirection: "row", gap: 12, marginBottom: spacing.sm },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
    statusText: { color: colors.textSecondary, ...typography.small, marginTop: spacing.xs },
    errorText: { color: colors.danger, ...typography.small, marginTop: spacing.xs, textAlign: "center" },
    keypad: { marginTop: spacing.xl, width: 280, flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
    key: { width: 84, height: 66, alignItems: "center", justifyContent: "center", borderRadius: radii.md },
    keyText: { fontSize: 24, color: colors.textPrimary, fontWeight: "500" },
    modalOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl,
      alignItems: "center", width: "100%", maxWidth: 320, gap: spacing.sm,
    },
    modalTitle: { ...typography.h2, color: colors.textPrimary },
    modalBody: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.sm },
  });
}