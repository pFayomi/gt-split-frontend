import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { CURRENT_USER } from "../data/seed";
import { useAppStore } from "../state/AppStore";
import { formatNaira } from "../data/format";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "../data/config";
import { normalizePhone } from "../data/phone";

export default function HomeScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const { logout, transactions, currentUser, balance, refreshBalance } = useAppStore();
  const navigation = useNavigation<any>();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const recentTransactions = showAllTransactions ? transactions : transactions.slice(0, 3);
  const accountNumber = currentUser?.accountNumber ?? CURRENT_USER.accountNumber;
  const accountLast4 = accountNumber.slice(-4);

  const loadPendingCount = useCallback(async () => {
    if (!currentUser?.phone) return;
    try {
      const response = await fetch(`${API_BASE_URL}/splits/participant/${currentUser.phone}`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const myPhone = normalizePhone(currentUser.phone);
      const count = list.reduce((sum: number, split: any) => {
        const mine = (split.participants ?? []).filter(
          (p: any) => normalizePhone(p.phone ?? "") === myPhone && p.status === "pending"
        );
        return sum + mine.length;
      }, 0);
      setPendingCount(count);
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      refreshBalance();
      loadPendingCount();
    }, [refreshBalance, loadPendingCount])
  );

  const goTo = (screen: string) => {
    setShowMenu(false);
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {currentUser?.fullName ?? CURRENT_USER.name}!</Text>
          <View style={styles.headerIcons}>
            <View>
              <Pressable onPress={() => setShowMenu((v) => !v)} style={styles.bellButton}>
                <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
                {pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </Pressable>
              {showMenu && (
                <View style={styles.dropdown}>
                  <Pressable onPress={() => goTo("MyRequests")} style={styles.dropdownItem}>
                    <Ionicons name="notifications-outline" size={16} color={colors.textPrimary} />
                    <Text style={styles.dropdownText}>My Requests</Text>
                    {pendingCount > 0 && (
                      <View style={styles.dropdownBadge}>
                        <Text style={styles.badgeText}>{pendingCount}</Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable onPress={() => goTo("MySplits")} style={styles.dropdownItem}>
                    <Ionicons name="receipt-outline" size={16} color={colors.textPrimary} />
                    <Text style={styles.dropdownText}>My Splits</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <Pressable onPress={toggleTheme} style={styles.themeToggle}>
              <Ionicons
                name={mode === "light" ? "moon-outline" : "sunny-outline"}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            <Pressable onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {pendingCount > 0 && (
          <Pressable
            style={styles.requestsBanner}
            onPress={() => navigation.navigate("MyRequests")}
          >
            <Ionicons name="alert-circle" size={18} color={colors.primary} />
            <Text style={styles.requestsBannerText}>
              You have {pendingCount} pending split request{pendingCount === 1 ? "" : "s"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        )}

        <View style={styles.balanceCard}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>{CURRENT_USER.accountLabel}</Text>
            <View style={styles.accountNumberPill}>
              <Text style={styles.accountNumberText}>{accountNumber}</Text>
              <Ionicons name="copy-outline" size={13} color={colors.textSecondary} />
            </View>
          </View>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel}>Book balance</Text>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
          </View>
          <Text style={styles.balanceAmount}>{formatNaira(balance)}</Text>

          <View style={styles.balanceActions}>
            <Pressable style={styles.actionPill}>
              <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
              <Text style={styles.actionPillText}>Fund Account</Text>
            </Pressable>
            <Pressable style={styles.actionPillOutline}>
              <Ionicons name="arrow-redo-outline" size={15} color={colors.textPrimary} />
              <Text style={styles.actionPillOutlineText}>Transfer</Text>
            </Pressable>
            <Pressable style={styles.actionPillOutline}>
              <Ionicons name="reader-outline" size={15} color={colors.textPrimary} />
              <Text style={styles.actionPillOutlineText}>Account Details</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Shortcuts</Text>
        <View style={styles.shortcutsRow}>
          <Shortcut icon="locate-outline" label="Near me" colors={colors} />
          <Shortcut icon="water-outline" label="Buy data" colors={colors} />
          <Shortcut icon="paper-plane-outline" label="Buy Airtime" colors={colors} />
          <Shortcut icon="sync-outline" label="Fx Sales" colors={colors} />
          <Pressable onPress={() => navigation.navigate("CreateSplit")}>
            <Shortcut icon="receipt-outline" label="Split Bills" tint={colors.danger} colors={colors} />
          </Pressable>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transaction history</Text>
          <Pressable onPress={() => setShowAllTransactions((v) => !v)}>
            <Text style={styles.seeMore}>{showAllTransactions ? "Show less" : "See more"}</Text>
          </Pressable>
        </View>
        <Text style={styles.dateGroup}>Yesterday</Text>
        {recentTransactions.map((tx) => (
          <Pressable
            key={tx.id}
            style={styles.txRow}
            onPress={() => navigation.navigate("TransactionDetail", { transaction: tx })}
          >
            <View style={styles.txIcon}>
              <Ionicons
                name={tx.kind === "billsplit" ? "receipt-outline" : "arrow-redo-outline"}
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
              <Text style={styles.txSubtitle}>{tx.subtitle}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.txAmount}>
                {tx.direction === "out" ? "-" : "+"}{formatNaira(tx.amount)}
              </Text>
              <Text style={styles.txFrom}>From \u2022 {accountLast4}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
          </Pressable>
        ))}

        <PromoCard
          bg="#F8CBC0"
          title="Investments"
          body="Make your money work. Open a GTMF account to earn more!"
          cta="Open account"
          icon="leaf-outline"
          colors={colors}
        />
        <PromoCard
          bg="#CBB9EC"
          title="Pension"
          body="Link your Guaranty Trust Pension Account and manage your retirement funds."
          cta="Link account"
          icon="lock-closed-outline"
          colors={colors}
        />
        <PromoCard
          bg="#F2955B"
          title="Quick Credit"
          body="Get instant access to credit facilities tailored for you."
          cta="Apply now"
          icon="cash-outline"
          colors={colors}
        />

        <Text style={styles.disclaimer}>
          Banking services powered by Guaranty Trust Bank Ltd, Licensed by the Central Bank of Nigeria (CBN)
        </Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <BottomTab icon="home" label="Home" active onPress={() => {}} colors={colors} />
        <BottomTab icon="grid-outline" label="Products" onPress={() => {}} colors={colors} />
        <BottomTab icon="card-outline" label="Payments" onPress={() => navigation.navigate("Payments")} colors={colors} />
        <BottomTab icon="swap-horizontal-outline" label="Transfers" onPress={() => {}} colors={colors} />
        <BottomTab icon="stats-chart-outline" label="Finances" onPress={() => {}} colors={colors} />
      </View>
    </SafeAreaView>
  );
}

function Shortcut({ icon, label, tint, colors }: { icon: any; label: string; tint?: string; colors: any }) {
  const styles = getStyles(colors);
  return (
    <View style={styles.shortcut}>
      <View style={styles.shortcutIcon}>
        <Ionicons name={icon} size={20} color={tint ?? colors.primary} />
      </View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </View>
  );
}

function PromoCard({
  bg,
  title,
  body,
  cta,
  icon,
  colors,
}: {
  bg: string;
  title: string;
  body: string;
  cta: string;
  icon: any;
  colors: any;
}) {
  const styles = getStyles(colors);
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={[styles.promoInner, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={44} color="rgba(0,0,0,0.35)" />
      </View>
      <Text style={styles.promoBody}>{body}</Text>
      <Pressable style={styles.promoButton}>
        <Text style={styles.promoButtonText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

function BottomTab({
  icon,
  label,
  active,
  onPress,
  colors,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onPress: () => void;
  colors: any;
}) {
  const styles = getStyles(colors);
  return (
    <Pressable style={styles.bottomTab} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? colors.primary : colors.textMuted} />
      <Text style={[styles.bottomTabLabel, active && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    headerIcons: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    themeToggle: { padding: 2 },
    bellButton: { position: "relative" },
    badge: {
      position: "absolute", top: -6, right: -6, backgroundColor: colors.danger,
      borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
    dropdown: {
      position: "absolute", top: 30, right: 0, backgroundColor: colors.card,
      borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, ...shadow,
      minWidth: 170, zIndex: 10, overflow: "hidden",
    },
    dropdownItem: {
      flexDirection: "row", alignItems: "center", gap: spacing.xs,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dropdownText: { flex: 1, ...typography.small, color: colors.textPrimary },
    dropdownBadge: {
      backgroundColor: colors.danger, borderRadius: 8, minWidth: 16, height: 16,
      alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    },
    requestsBanner: {
      flexDirection: "row", alignItems: "center", gap: spacing.xs,
      backgroundColor: colors.primaryLight, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.md,
    },
    requestsBannerText: { flex: 1, color: colors.primary, ...typography.smallBold },
    greeting: { ...typography.h3, color: colors.textPrimary },
    balanceCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, ...shadow },
    accountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    accountLabel: { ...typography.small, color: colors.textSecondary },
    accountNumberPill: { flexDirection: "row", alignItems: "center", gap: 4 },
    accountNumberText: { ...typography.small, color: colors.textSecondary },
    dotsRow: { flexDirection: "row", gap: 4, marginTop: spacing.xs, marginBottom: spacing.sm },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary },
    balanceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    balanceLabel: { ...typography.small, color: colors.textSecondary },
    balanceAmount: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xs, marginBottom: spacing.md },
    balanceActions: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
    actionPill: {
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: colors.primaryLight, paddingVertical: 8, paddingHorizontal: spacing.sm, borderRadius: radii.pill,
    },
    actionPillText: { color: colors.primary, ...typography.smallBold },
    actionPillOutline: {
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: spacing.sm, borderRadius: radii.pill,
    },
    actionPillOutlineText: { color: colors.textPrimary, ...typography.smallBold },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xl },
    seeMore: { color: colors.primary, ...typography.smallBold },
    dateGroup: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
    shortcutsRow: { flexDirection: "row", justifyContent: "space-between" },
    shortcut: { alignItems: "center", width: 60 },
    shortcutIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight,
      alignItems: "center", justifyContent: "center", marginBottom: spacing.xs,
    },
    shortcutLabel: { ...typography.label, color: colors.textSecondary, textAlign: "center" },
    txRow: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radii.md,
      padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    txIcon: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight,
      alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
    },
    txTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 13 },
    txSubtitle: { ...typography.small, color: colors.textSecondary },
    txAmount: { ...typography.bodyBold, color: colors.textPrimary },
    txFrom: { ...typography.small, color: colors.textMuted },
    promoInner: { height: 120, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
    promoBody: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
    promoButton: { backgroundColor: colors.primaryLight, paddingVertical: 10, borderRadius: radii.pill, alignItems: "center" },
    promoButtonText: { color: colors.primary, ...typography.bodyBold },
    disclaimer: { ...typography.small, color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
    bottomBar: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 10,
    },
    bottomTab: { alignItems: "center", gap: 2 },
    bottomTabLabel: { fontSize: 10, color: colors.textMuted },
  });
}