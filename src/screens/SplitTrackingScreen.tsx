import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { CURRENT_USER } from "../data/seed";

const GT_ORANGE = "#E35205";
const GT_ORANGE_SOFT = "#FCE3D6";
const PAID_GREEN = "#22A559";
const PENDING_YELLOW = "#F5B800";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function InitialsBubble({ initials, status, styles }: { initials: string; status: "paid" | "pending"; styles: any }) {
  const paid = status === "paid";
  return (
    <View style={styles.bubbleWrap}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{initials}</Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: paid ? PAID_GREEN : PENDING_YELLOW }]}>
        <Ionicons name={paid ? "checkmark" : "time"} size={10} color="#fff" />
      </View>
    </View>
  );
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

  const goHome = () => navigation.navigate("Home", { tab: "home" });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={goHome} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>{split.title.trim().charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.totalAmount}>{formatNaira(split.totalAmount)}</Text>
        <Text style={styles.title}>For {split.title}</Text>

        <View style={styles.progressCard}>
          <Text style={styles.remainingText}>
            {split.status === "settled" ? "Fully settled" : `${formatNaira(remaining)} left`}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
        </View>

        <View style={styles.participantRow}>
          <InitialsBubble initials={myInitials} status="paid" styles={styles} />
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>You</Text>
            <Text style={styles.participantSub}>Host {"\u2022"} You've paid {formatNaira(myShare)}</Text>
          </View>
        </View>

        {split.participants.map((p) => {
          const status = p.status === "paid" ? "paid" : "pending";
          return (
            <Pressable
              key={p.id}
              onPress={() => handleToggle(p.id)}
              style={({ pressed }) => [styles.participantRow, pressed && { opacity: 0.85 }]}
            >
              <InitialsBubble initials={p.initials} status={status} styles={styles} />
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{p.name}</Text>
                <Text style={styles.participantSub}>{status === "paid" ? "Paid Share" : "Pending"}</Text>
              </View>
              <Text style={styles.participantAmount}>{formatNaira(p.share)}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.tapHint}>Tap a participant to toggle paid / pending</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={goHome}
          style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="home" size={18} color="#fff" />
          <Text style={styles.footerLabel}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
    hostBadge: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    hostBadgeText: { ...typography.bodyBold, color: GT_ORANGE },
    totalAmount: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
    title: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },

    progressCard: {
      backgroundColor: "#fff", borderRadius: radii.md, paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm, marginBottom: spacing.lg,
    },
    remainingText: { ...typography.small, color: colors.textPrimary, textAlign: "right", marginBottom: spacing.xs },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: GT_ORANGE_SOFT, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 3, backgroundColor: GT_ORANGE },

    participantRow: {
      flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
      borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
      marginBottom: spacing.sm, borderWidth: 1, borderColor: "#B9BCC6",
    },
    participantInfo: { flex: 1, marginLeft: spacing.sm },
    participantName: { ...typography.bodyBold, color: "#111" },
    participantSub: { ...typography.small, color: colors.textSecondary },
    participantAmount: { ...typography.bodyBold, color: "#111" },

    bubbleWrap: { width: 40, height: 40 },
    bubble: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff",
      borderWidth: 1, borderColor: "#ECECF0", alignItems: "center", justifyContent: "center",
    },
    bubbleText: { ...typography.small, color: GT_ORANGE, fontWeight: "600" },
    statusDot: {
      position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: 8,
      alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff",
    },

    tapHint: { ...typography.small, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xxl },

    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      backgroundColor: colors.background,
      alignItems: "flex-end",
    },
    footerBtn: {
      width: "55%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: GT_ORANGE,
      borderRadius: 10,
      paddingVertical: spacing.md,
      shadowColor: GT_ORANGE,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    footerLabel: { ...typography.button, fontSize: 16, color: "#fff" },
  });
}