import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { useAppStore } from "../state/AppStore";
import { CURRENT_USER } from "../data/seed";
import Button from "../components/Button";

export default function TransactionDetailScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { transaction } = route.params;
  const { currentUser } = useAppStore();

  const accountNumber = currentUser?.accountNumber ?? CURRENT_USER.accountNumber;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Transaction</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.amount}>
          {transaction.direction === "out" ? "-" : "+"}{formatNaira(transaction.amount)}
        </Text>
        <Text style={styles.subtitle}>{transaction.subtitle}</Text>
        <Text style={styles.date}>{transaction.date}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.statusText}>Success</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account debited</Text>
            <Text style={styles.detailValue}>{accountNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{transaction.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Type</Text>
            <Text style={styles.detailValue}>{transaction.kind.toUpperCase()}</Text>
          </View>
        </View>

        {transaction.kind !== "billsplit" && (
          <Button
            label="Split This Bill"
            onPress={() =>
              navigation.navigate("CreateSplit", {
                splitName: `${transaction.subtitle} Split`,
                totalAmount: transaction.amount,
              })
            }
            style={{ marginTop: spacing.lg }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl },
    title: { ...typography.h3, color: colors.textPrimary },
    amount: { ...typography.h1, color: colors.textPrimary, textAlign: "center" },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
    date: { ...typography.small, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
    detailsCard: {
      backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md,
      borderWidth: 1, borderColor: colors.border, ...shadow,
    },
    detailRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    detailLabel: { ...typography.small, color: colors.textSecondary },
    detailValue: { ...typography.smallBold, color: colors.textPrimary },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    statusText: { ...typography.smallBold, color: colors.success },
  });
}