import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { API_BASE_URL } from "../data/config";
import Avatar from "../components/Avatar";
import { StatusBadge } from "../components/Card";

export default function MySplitsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { currentUser } = useAppStore();
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const loadSplits = useCallback(async () => {
    if (!currentUser?.accountNumber) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/splits/host/${currentUser.accountNumber}`);
      const data = await response.json();
      setSplits(Array.isArray(data) ? data : []);
    } catch (e) {
      setSplits([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      loadSplits();
    }, [loadSplits])
  );

  const handleToggle = async (splitId: string, participantId: string) => {
    await fetch(`${API_BASE_URL}/splits/${splitId}/participants/${participantId}/toggle`, {
      method: "PATCH",
    });
    loadSplits();
  };

  const handleRemind = async (splitId: string, participantId: string) => {
    setRemindingId(participantId);
    try {
      await fetch(`${API_BASE_URL}/splits/${splitId}/participants/${participantId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: currentUser?.fullName }),
      });
      Alert.alert("Reminder sent", "They'll get an email, SMS and WhatsApp reminder.");
    } catch (e) {
      Alert.alert("Couldn't send reminder", "Check your connection and try again.");
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate("Home", { tab: "home" })}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Splits</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : splits.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>You haven't created any splits yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {splits.map((split) => {
            const paidCount = split.participants.filter((p: any) => p.status === "paid").length;
            const total = split.participants.length;
            return (
              <View key={split.id} style={styles.splitCard}>
                <View style={styles.splitHeader}>
                  <Text style={styles.splitTitle}>{split.title}</Text>
                  <Text style={styles.splitProgress}>{paidCount}/{total} paid</Text>
                </View>
                <Text style={styles.splitAmount}>{formatNaira(Number(split.totalAmount))}</Text>

                {split.participants.map((p: any) => (
                  <View key={p.id} style={styles.participantRow}>
                    <Avatar initials={p.initials} size={32} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.participantName}>{p.name}</Text>
                      <Text style={styles.participantShare}>{formatNaira(Number(p.share))}</Text>
                    </View>
                    {p.status === "paid" ? (
                      <Pressable onPress={() => handleToggle(split.id, p.id)}>
                        <StatusBadge status="paid" />
                      </Pressable>
                    ) : (
                      <View style={styles.pendingActions}>
                        <Pressable
                          onPress={() => handleRemind(split.id, p.id)}
                          disabled={remindingId === p.id}
                          style={styles.remindButton}
                        >
                          <Text style={styles.remindButtonText}>
                            {remindingId === p.id ? "Sending..." : "Remind"}
                          </Text>
                        </Pressable>
                        <Pressable onPress={() => handleToggle(split.id, p.id)}>
                          <StatusBadge status="pending" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
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
    splitCard: {
      backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md,
      marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow,
    },
    splitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    splitTitle: { ...typography.bodyBold, color: colors.textPrimary },
    splitProgress: { ...typography.small, color: colors.textSecondary },
    splitAmount: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
    participantRow: {
      flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs,
      borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs,
    },
    participantName: { ...typography.smallBold, color: colors.textPrimary },
    participantShare: { ...typography.small, color: colors.textSecondary },
    pendingActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    remindButton: {
      paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: radii.pill,
      backgroundColor: colors.primaryLight,
    },
    remindButtonText: { color: colors.primary, ...typography.label },
  });
}