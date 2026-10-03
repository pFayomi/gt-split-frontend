import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { CURRENT_USER } from "../data/seed";

export default function TransactionDetailScreen() {
  const { colors, mode } = useTheme();
  const styles = getStyles(colors, mode);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { transaction } = route.params;
  const { currentUser } = useAppStore();

  const accountNumber = currentUser?.accountNumber ?? CURRENT_USER.accountNumber;

  // split "₦24,500.00" into the big part and the smaller decimals, like the screenshot
  const formatted: string = formatNaira(transaction.amount);
  const dotIndex = formatted.lastIndexOf(".");
  const amountMain = dotIndex > 0 ? formatted.slice(0, dotIndex) : formatted;
  const amountDecimals = dotIndex > 0 ? formatted.slice(dotIndex) : "";

  // Rows are only drawn when there is data for them (nothing is invented).
  const rows: { label: string; value: string }[] = [
    { label: "Account debited", value: accountNumber },
    { label: "Sender", value: currentUser?.fullName ?? CURRENT_USER.name },
    { label: "Receiver Bank", value: transaction.receiverBank },
    { label: "Receiver Account", value: transaction.receiverAccount },
    { label: "Transaction Type", value: transaction.kind.toUpperCase() },
    { label: "SessionID", value: transaction.sessionId },
    { label: "Remark", value: transaction.remark },
  ].filter((r) => !!r.value);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {transaction.direction === "out" ? "- " : "+ "}
              {amountMain}
              <Text style={styles.amountDecimals}>{amountDecimals}</Text>
            </Text>
            <Text style={styles.subtitle}>{transaction.subtitle}</Text>
            <Text style={styles.date}>{transaction.date}</Text>
          </View>
          <View style={styles.kindIcon}>
            <DoubleChevron size={20} color={colors.primary} />
          </View>
        </View>

        {/* action pills: Send again + Receipt are visual only, Split Bill keeps the real navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.pillRow}
        >
          <Pressable style={styles.pill}>
            <DoubleChevron size={18} color={colors.primary} />
            <Text style={styles.pillText}>Send again</Text>
          </Pressable>
          <Pressable style={styles.pill}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.pillText}>Receipt</Text>
          </Pressable>
          {transaction.kind !== "billsplit" && (
            <Pressable
              style={styles.pill}
              onPress={() =>
                navigation.navigate("CreateSplit", {
                  splitName: `${transaction.subtitle} Split`,
                  totalAmount: transaction.amount,
                })
              }
            >
              <Ionicons name="receipt" size={20} color={colors.primary} />
              <Text style={styles.pillText}>Split Bill</Text>
            </Pressable>
          )}
        </ScrollView>

        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.textCard}>
          <Text style={styles.textCardText}>{transaction.title}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={26} color={colors.success} />
              <Text style={styles.statusText}>Success</Text>
            </View>
          </View>
          {rows.map((r) => (
            <View key={r.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{r.label}</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                {r.value}
              </Text>
            </View>
          ))}
        </View>

        {!!transaction.remark && (
          <View style={[styles.textCard, { marginTop: spacing.sm }]}>
            <Text style={styles.textCardText}>{transaction.remark}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Two overlapping chevrons (the GTBank "transfer" glyph) */
function DoubleChevron({ size = 16, color }: { size?: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons name="chevron-forward" size={size} color={color} />
      <Ionicons
        name="chevron-forward"
        size={size}
        color={color}
        style={{ marginLeft: -size * 0.72 }}
      />
    </View>
  );
}

function getStyles(colors: any, mode: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    backButton: { alignSelf: "flex-start", marginBottom: spacing.md },

    summaryRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    amount: { ...typography.display, color: colors.textPrimary },
    amountDecimals: { ...typography.bodyBold },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
    date: { ...typography.small, fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 6 },
    kindIcon: {
      width: 54, height: 54, borderRadius: 27, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      alignItems: "center", justifyContent: "center",
    },

    pillScroll: { marginHorizontal: -spacing.lg, marginTop: spacing.lg },
    pillRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg },
    pill: {
      flexDirection: "row", alignItems: "center", gap: 8, height: 44,
      backgroundColor: colors.primaryLight, paddingHorizontal: 18, borderRadius: radii.pill,
      borderWidth: 1, borderColor: "rgba(244,81,30,0.12)",
    },
    pillText: { color: colors.primary, ...typography.button },

    sectionTitle: {
      ...typography.bodyBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary,
      marginTop: spacing.xl, marginBottom: spacing.sm,
    },
    textCard: {
      backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    },
    textCardText: { ...typography.small, lineHeight: 19, color: colors.textPrimary },

    detailsCard: {
      marginTop: spacing.md,
      backgroundColor: mode === "light" ? "#F7F8FC" : colors.card,
      borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    },
    detailRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 12, gap: spacing.md,
    },
    detailLabel: { ...typography.small, color: colors.textSecondary },
    detailValue: {
      ...typography.smallBold, color: colors.textPrimary,
      flexShrink: 1, textAlign: "right",
    },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    statusText: { ...typography.smallBold, color: colors.textPrimary },
  });
}