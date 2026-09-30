import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, TextInput, ScrollView, Modal } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { CURRENT_USER } from "../data/seed";

export default function ChooseSplitTypeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { splitName, participants, prefillAmount } = route.params;
  const { createSplit } = useAppStore();

  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [totalAmount, setTotalAmount] = useState(prefillAmount ? String(prefillAmount) : "");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSplitId, setCreatedSplitId] = useState<string | null>(null);

  const numericTotal = parseFloat(totalAmount) || 0;
  const equalShare = numericTotal > 0 ? numericTotal / (participants.length + 1) : 0;

  const assignedTotal = Object.values(customShares).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const hostShare = Math.max(numericTotal - assignedTotal, 0);
  const remaining = Math.max(numericTotal - assignedTotal, 0);

  const canProceed = numericTotal > 0;

  const handleCustomShareChange = (participantId: string, rawValue: string) => {
    const othersSum = participants.reduce((sum: number, p: any) => {
      if (p.id === participantId) return sum;
      return sum + (parseFloat(customShares[p.id] || "0") || 0);
    }, 0);
    const maxAllowed = Math.max(numericTotal - othersSum, 0);

    if (rawValue === "") {
      setCustomShares((prev) => ({ ...prev, [participantId]: "" }));
      return;
    }

    let numeric = parseFloat(rawValue) || 0;
    if (numeric > maxAllowed) numeric = maxAllowed;

    setCustomShares((prev) => ({ ...prev, [participantId]: String(numeric) }));
  };

  const handleProceed = async () => {
    const split = await createSplit({
      title: splitName,
      totalAmount: numericTotal,
      splitType,
      sourceAccountLabel: CURRENT_USER.accountLabel,
      participants: participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        initials: p.initials,
        phone: p.phone,
        email: p.email,
        isGTUser: p.isGTUser,
        customShare: splitType === "custom" ? parseFloat(customShares[p.id] || "0") : undefined,
      })),
    });
    setCreatedSplitId(split.id);
    setShowSuccessModal(true);
  };

  const goToTracking = () => {
    if (!createdSplitId) return;
    setShowSuccessModal(false);
    navigation.navigate("SplitTracking", { splitId: createdSplitId });
  };

  React.useEffect(() => {
    if (!showSuccessModal) return;
    const timer = setTimeout(goToTracking, 2500);
    return () => clearTimeout(timer);
  }, [showSuccessModal]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{splitName}</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.label}>Total Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="₦0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={totalAmount}
          onChangeText={setTotalAmount}
        />

        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, splitType === "equal" && styles.toggleButtonActive]}
            onPress={() => setSplitType("equal")}
          >
            <Text style={[styles.toggleText, splitType === "equal" && styles.toggleTextActive]}>
              Equal
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, splitType === "custom" && styles.toggleButtonActive]}
            onPress={() => setSplitType("custom")}
          >
            <Text style={[styles.toggleText, splitType === "custom" && styles.toggleTextActive]}>
              Custom / Line-Item
            </Text>
          </Pressable>
        </View>

        {splitType === "custom" && numericTotal > 0 && (
          <View style={styles.remainingBanner}>
            <Text style={styles.remainingText}>
              {formatNaira(remaining)} left to assign
            </Text>
          </View>
        )}

        <Text style={styles.label}>Split among • {participants.length + 1}</Text>

        <View style={styles.participantRow}>
          <Avatar initials={CURRENT_USER.initials} size={36} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.participantName}>You</Text>
            <Text style={styles.participantSub}>Paid share</Text>
          </View>
          <Text style={styles.shareAmount}>
            {formatNaira(splitType === "equal" ? equalShare : hostShare)}
          </Text>
        </View>

        {participants.map((p: any) => {
          const othersSum = participants.reduce((sum: number, other: any) => {
            if (other.id === p.id) return sum;
            return sum + (parseFloat(customShares[other.id] || "0") || 0);
          }, 0);
          const maxAllowed = Math.max(numericTotal - othersSum, 0);

          return (
            <View key={p.id} style={styles.participantRow}>
              <Avatar initials={p.initials} size={36} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.participantName}>{p.name}</Text>
                <Text style={styles.participantSub}>{p.isGTUser ? "GT User" : "External"}</Text>
              </View>
              {splitType === "equal" ? (
                <Text style={styles.shareAmount}>{formatNaira(equalShare)}</Text>
              ) : (
                <TextInput
                  style={styles.customInput}
                  placeholder="₦0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  editable={numericTotal > 0}
                  value={customShares[p.id] || ""}
                  onChangeText={(val) => handleCustomShareChange(p.id, val)}
                />
              )}
            </View>
          );
        })}

        {splitType === "custom" && numericTotal === 0 && (
          <Text style={styles.hint}>Enter a total amount above before assigning shares</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Proceed" onPress={handleProceed} disabled={!canProceed} />
      </View>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.modalTitle}>Split created!</Text>
            <Text style={styles.modalBody}>
              "{splitName}" has been sent to {participants.length} participant
              {participants.length === 1 ? "" : "s"}.
            </Text>
            <Button label="View Split" onPress={goToTracking} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    title: { ...typography.h3, color: colors.textPrimary },
    label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
    input: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
      padding: spacing.md, ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md,
    },
    toggleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
    toggleButton: {
      flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: "center",
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    toggleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleText: { color: colors.textPrimary, ...typography.smallBold },
    toggleTextActive: { color: colors.white },
    remainingBanner: {
      backgroundColor: colors.primaryLight, borderRadius: radii.md, padding: spacing.sm,
      alignItems: "center", marginBottom: spacing.md,
    },
    remainingText: { color: colors.primary, ...typography.smallBold },
    participantRow: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
      borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border, ...shadow,
    },
    participantName: { ...typography.bodyBold, color: colors.textPrimary },
    participantSub: { ...typography.small, color: colors.textSecondary },
    shareAmount: { ...typography.bodyBold, color: colors.textPrimary },
    customInput: {
      width: 90, textAlign: "right", borderWidth: 1, borderColor: colors.border,
      borderRadius: radii.sm, padding: 6, color: colors.textPrimary,
    },
    hint: { ...typography.small, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm },
    footer: { padding: spacing.lg, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
    modalOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl,
      alignItems: "center", width: "100%", maxWidth: 320,
    },
    modalIcon: { marginBottom: spacing.md },
    modalTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
    modalBody: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  });
}