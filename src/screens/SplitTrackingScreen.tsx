import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Avatar from "../components/Avatar";
import { StatusBadge } from "../components/Card";
import Button from "../components/Button";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { CURRENT_USER } from "../data/seed";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function SplitTrackingScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { splitId } = route.params;
  const { splits, markParticipantPaid, currentUser } = useAppStore();

  const split = splits.find((s) => s.id === splitId);

  if (!split) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Split not found.</Text>
      </SafeAreaView>
    );
  }

  const paidTotal = split.participants
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.share, 0);
  const remaining = split.totalAmount - paidTotal;
  const progress = split.totalAmount > 0 ? paidTotal / split.totalAmount : 0;
  const myInitials = currentUser ? initialsFor(currentUser.fullName) : CURRENT_USER.initials;
  const myShare = split.totalAmount - split.participants.reduce((sum, p) => sum + p.share, 0);

  const handleToggle = (participantId: string) => {
    markParticipantPaid(split.id, participantId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.navigate("Home")}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{split.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.totalAmount}>{formatNaira(split.totalAmount)}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
        <Text style={styles.remainingText}>
          {split.status === "settled" ? "Fully settled" : `${formatNaira(remaining)} left`}
        </Text>

        <View style={styles.participantRow}>
          <Avatar initials={myInitials} size={36} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.participantName}>You</Text>
            <Text style={styles.participantSub}>Host \u2022 You're owed {formatNaira(myShare)}</Text>
          </View>
          <StatusBadge status="paid" />
        </View>

        {split.participants.map((p) => (
          <View key={p.id} style={styles.participantRow}>
            <Avatar initials={p.initials} size={36} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.participantName}>{p.name}</Text>
              <Text style={styles.participantSub}>{formatNaira(p.share)}</Text>
            </View>
            <Pressable onPress={() => handleToggle(p.id)}>
              <StatusBadge status={p.status === "paid" ? "paid" : "pending"} />
            </Pressable>
          </View>
        ))}

        <Text style={styles.tapHint}>Tap a status badge to toggle paid / pending</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Back to Home"
          onPress={() => navigation.navigate("Home")}
          variant="outline"
        />
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
    title: { ...typography.h3, color: colors.textPrimary },
    totalAmount: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
    progressTrack: {
      height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden", marginBottom: spacing.xs,
    },
    progressFill: { height: "100%", backgroundColor: colors.primary },
    remainingText: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.lg },
    participantRow: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
      borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border, ...shadow,
    },
    participantName: { ...typography.bodyBold, color: colors.textPrimary },
    participantSub: { ...typography.small, color: colors.textSecondary },
    tapHint: { ...typography.small, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xxl },
    footer: { padding: spacing.lg, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  });
}
