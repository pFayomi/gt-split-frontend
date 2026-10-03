import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { API_BASE_URL } from "../data/config";
import { normalizePhone } from "../data/phone";
import RoundUpModal from "../components/RoundUpModal";

export default function MyRequestsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { currentUser } = useAppStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingParticipant, setPayingParticipant] = useState<{
    splitId: string;
    participantId: string;
    amount: number;
    splitTitle: string;
    hostAccountNumber: string;
  } | null>(null);

  const loadRequests = async () => {
    if (!currentUser?.phone) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/splits/participant/${currentUser.phone}`);
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRequests();
    }, [currentUser])
  );

  const myPhone = currentUser?.phone ? normalizePhone(currentUser.phone) : "";
  const myPendingEntries = requests.flatMap((split) =>
    (split.participants ?? [])
      .filter((p: any) => normalizePhone(p.phone ?? "") === myPhone && p.status === "pending")
      .map((p: any) => ({ split, participant: p }))
  );

  const startPayment = (
    splitId: string,
    participantId: string,
    amount: number,
    splitTitle: string,
    hostAccountNumber: string
  ) => {
    const roundedAmount = Math.ceil(amount / 10) * 10;
    if (roundedAmount - amount <= 0) {
      navigation.navigate("Transfer", {
        amount,
        roundedAmount: amount,
        roundUpAccepted: false,
        splitTitle,
        splitId,
        hostAccountNumber,
        participantId,
      });
      return;
    }
    setPayingParticipant({ splitId, participantId, amount, splitTitle, hostAccountNumber });
  };

  const goToTransfer = (roundUpAccepted: boolean, roundedAmount?: number) => {
    if (!payingParticipant) return;
    const { splitId, participantId, amount, splitTitle, hostAccountNumber } = payingParticipant;
    setPayingParticipant(null);
    navigation.navigate("Transfer", {
      amount,
      roundedAmount: roundedAmount ?? amount,
      roundUpAccepted,
      splitTitle,
      splitId,
      hostAccountNumber,
      participantId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate("Home", { tab: "home" })}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !currentUser?.phone ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No phone number on file for this account</Text>
        </View>
      ) : myPendingEntries.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>You're all settled up</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {myPendingEntries.map(({ split, participant }) => (
            <View key={participant.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.splitTitle}>{split.title}</Text>
                <Text style={styles.splitSub}>You owe</Text>
              </View>
              <Text style={styles.amount}>{formatNaira(Number(participant.share))}</Text>
              <Pressable
                style={styles.payButton}
                onPress={() =>
                  startPayment(
                    split.id,
                    participant.id,
                    Number(participant.share),
                    split.title,
                    split.hostAccountNumber
                  )
                }
              >
                <Text style={styles.payButtonText}>Pay</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <RoundUpModal
        visible={!!payingParticipant}
        amount={payingParticipant?.amount ?? 0}
        onAccept={(roundedAmount) => goToTransfer(true, roundedAmount)}
        onDecline={() => goToTransfer(false)}
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
    scrollContent: { padding: spacing.lg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: "center", paddingHorizontal: spacing.lg },
    card: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
      borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border, ...shadow,
    },
    splitTitle: { ...typography.bodyBold, color: colors.textPrimary },
    splitSub: { ...typography.small, color: colors.textSecondary },
    amount: { ...typography.bodyBold, color: colors.textPrimary, marginRight: spacing.sm },
    payButton: { paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.primary },
    payButtonText: { color: colors.white, ...typography.smallBold },
  });
}