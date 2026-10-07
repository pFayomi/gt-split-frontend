import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { API_BASE_URL, TRANSFER_PIN } from "../data/config";
import PinEntry from "../components/PinEntry";
import SuccessSheet from "../components/SuccessSheet";

const PIN_LENGTH = 4;

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
    // The sheet slides itself out; onClose then lands us back on the home tab.
    const timer = setTimeout(() => setSuccess(false), 2500);
    return () => clearTimeout(timer);
  }, [success]);

  const goHome = () => {
    setSuccess(false);
    navigation.navigate("Home", { tab: "home" });
  };

  const handleKey = (key: string) => {
    setError(null);
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "" || pin.length >= PIN_LENGTH || processing) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      submitPayment(next);
    }
  };

  const submitPayment = async (enteredPin: string) => {
    if (!currentUser) return;
    if (enteredPin !== TRANSFER_PIN) {
      setError("Incorrect PIN. Try again.");
      setPin("");
      return;
    }
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
        <Pressable onPress={() => navigation.navigate("Home", { tab: "home" })}>
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

        <PinEntry
          title="Enter your PIN to confirm"
          pin={pin}
          length={PIN_LENGTH}
          error={error}
          status={processing ? "Processing..." : null}
          hint="Demo accounts use PIN: 1234"
          onKey={handleKey}
        />
      </View>

      <SuccessSheet
        visible={success}
        onClose={goHome}
        badge="swap-horizontal"
        amount={finalAmount}
        title={`Split payment sent for ${splitTitle}`}
        primary={{ label: "Done", onPress: goHome }}
      />
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
  });
}