import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
} from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { CURRENT_USER } from "../data/seed";
import { useAppStore } from "../state/AppStore";
import { formatNaira } from "../data/format";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "../data/config";
import { normalizePhone } from "../data/phone";

// GTBank brand orange + tints used across the new promo / nav styling
const ORANGE = "#F4511E";
const ORANGE_SOFT = "rgba(244,81,30,0.14)";
const ORANGE_BORDER = "rgba(244,81,30,0.28)";

// Shortcut colour families taken from the screenshot (tints work in light + dark mode)
const SHORTCUT_VARIANTS = {
  orange: { fg: ORANGE, bg: "rgba(244,81,30,0.08)", border: "rgba(244,81,30,0.35)" },
  blue: { fg: "#2F6BF0", bg: "rgba(47,107,240,0.14)", border: "rgba(47,107,240,0.22)" },
  purple: { fg: "#8B5CF6", bg: "rgba(139,92,246,0.14)", border: "rgba(139,92,246,0.25)" },
  red: { fg: "#E5484D", bg: "rgba(229,72,77,0.12)", border: "rgba(229,72,77,0.25)" },
} as const;
type ShortcutVariant = keyof typeof SHORTCUT_VARIANTS;

export default function HomeScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const { logout, transactions, currentUser, balance, refreshBalance } = useAppStore();
  const navigation = useNavigation<any>();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  // eye button: hides/shows every amount on the screen (balance + transactions).
  // Starts hidden like the screenshot; use useState(false) to start visible.
  const [balanceHidden, setBalanceHidden] = useState(true);
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
      {/* fixed header (stays put while the page scrolls, like the screenshot) */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
        </View>
        <Text
          style={styles.greeting}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          Hello, {currentUser?.fullName ?? CURRENT_USER.name}!
        </Text>
        <View style={styles.headerIcons}>
          <View>
            <Pressable onPress={() => setShowMenu((v) => !v)} style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
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
                  <Ionicons name="receipt" size={16} color={colors.textPrimary} />
                  <Text style={styles.dropdownText}>My Splits</Text>
                </Pressable>
              </View>
            )}
          </View>
          <Pressable onPress={toggleTheme} style={styles.iconButton}>
            <Ionicons
              name={mode === "light" ? "moon-outline" : "sunny-outline"}
              size={17}
              color={colors.textPrimary}
            />
          </Pressable>
          <Pressable onPress={logout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={styles.accountTypePill}>
              <Text style={styles.accountLabel}>{CURRENT_USER.accountLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </View>
            <View style={styles.accountNumberPill}>
              <Text style={styles.accountNumberText}>{accountNumber}</Text>
              <Ionicons name="copy" size={16} color={colors.primary} />
            </View>
          </View>

          <View style={styles.balanceAmountRow}>
            {balanceHidden ? (
              <AmountMask dots={3} dotSize={12} gap={13} color={colors.textPrimary} />
            ) : (
              <Text
                style={styles.balanceAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatNaira(balance)}
              </Text>
            )}
            <Pressable
              onPress={() => setBalanceHidden((v) => !v)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={balanceHidden ? "Show amounts" : "Hide amounts"}
            >
              <Ionicons
                name={balanceHidden ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel}>Book balance</Text>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillScroll}
            contentContainerStyle={styles.balanceActions}
          >
            <Pressable style={styles.actionPill}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.actionPillText}>Fund account</Text>
            </Pressable>
            <Pressable style={styles.actionPillOutline}>
              <DoubleChevron size={16} color={colors.primary} />
              <Text style={styles.actionPillOutlineText}>Transfer</Text>
            </Pressable>
            <Pressable style={styles.actionPillOutline}>
              <Ionicons name="reader-outline" size={20} color={colors.primary} />
              <Text style={styles.actionPillOutlineText}>Account Details</Text>
            </Pressable>
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Shortcuts</Text>
        <View style={styles.shortcutsRow}>
          <Shortcut icon="locate" label="Near me" variant="orange" rings colors={colors} />
          <Shortcut icon="wifi" label="Buy data" variant="blue" colors={colors} />
          <Shortcut icon="cellular" label="Buy Airtime" variant="purple" colors={colors} />
          <Shortcut icon="sync" label="Fx Sales" variant="purple" colors={colors} />
          <Pressable style={styles.shortcutPressable} onPress={() => navigation.navigate("CreateSplit")}>
            <Shortcut icon="receipt" label="Split Bills" variant="red" colors={colors} />
          </Pressable>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Transaction history</Text>
          <Pressable
            onPress={() => setShowAllTransactions((v) => !v)}
            style={styles.seeMoreWrap}
          >
            <Text style={styles.seeMore}>{showAllTransactions ? "Show less" : "See more"}</Text>
            <Ionicons
              name={showAllTransactions ? "chevron-up" : "chevron-forward"}
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
        <View style={styles.txCard}>
          <Text style={styles.dateGroup}>Yesterday</Text>
          {recentTransactions.map((tx, index) => (
            <Pressable
              key={tx.id}
              style={[styles.txRow, index > 0 && styles.txRowDivider]}
              onPress={() => navigation.navigate("TransactionDetail", { transaction: tx })}
            >
              <View style={styles.txIcon}>
                <View style={styles.txIconInner}>
                  {tx.kind === "billsplit" ? (
                    <Ionicons name="receipt" size={13} color={colors.white} />
                  ) : (
                    <DoubleChevron size={13} color={colors.white} />
                  )}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                <Text style={styles.txSubtitle}>{tx.subtitle}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {balanceHidden ? (
                  <AmountMask
                    dots={3}
                    dotSize={4}
                    gap={6}
                    color={colors.textPrimary}
                    style={styles.txAmountMask}
                  />
                ) : (
                  <Text style={styles.txAmount}>
                    {tx.direction === "out" ? "-" : "+"}
                    {formatNaira(tx.amount)}
                  </Text>
                )}
                <Text style={styles.txFrom}>From {"\u2022"} {accountLast4}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* ---------- Investments ---------- */}
        <Text style={styles.sectionTitle}>Investments</Text>
        <View style={styles.promoCard}>
          <Hero bg="#F985A3" height={144}>
            <TreeIllustration />
          </Hero>
          <View style={styles.promoFooter}>
            <Text style={styles.promoBody}>
              Make your money work. Open a GTFM account to earn more!
            </Text>
            <Pressable style={styles.promoButton}>
              <Ionicons name="wallet-outline" size={22} color={ORANGE} />
              <Text style={styles.promoButtonText}>Open account</Text>
            </Pressable>
          </View>
        </View>

        {/* ---------- Pension ---------- */}
        <Text style={styles.sectionTitle}>Pension</Text>
        <View style={styles.promoCard}>
          <Hero bg="#A65BF7" height={144}>
            <ChestIllustration />
          </Hero>
          <Pressable style={[styles.promoFooter, styles.promoFooterRow]}>
            <Text style={[styles.promoBody, styles.promoBodyFlex]}>
              Design your future with a retirement plan. Discover our pension products.
            </Text>
            <Ionicons name="chevron-forward" size={20} color={ORANGE} />
          </Pressable>
        </View>

        {/* ---------- Quick Credit ---------- */}
        <Text style={styles.sectionTitle}>Quick Credit</Text>
        <View style={styles.promoCard}>
          <Hero bg="#E98B43" height={108}>
            <CreditIllustration />
          </Hero>
          <View style={styles.promoFooter}>
            <Text style={[styles.promoBody, { marginBottom: spacing.sm }]}>
              Instant loans made easy
            </Text>
            <Pressable style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Apply now</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerLogo}>
            <Cube size={15} left={10} top={10} rotate="-14deg" />
          </View>
          <Text style={styles.disclaimer}>
            Banking services powered by Guaranty Trust Bank Ltd, Licensed by the Central Bank of Nigeria (CBN)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Dotted placeholder shown in place of an amount while amounts are hidden */
function AmountMask({
  dots,
  dotSize,
  gap,
  color,
  style,
}: {
  dots: number;
  dotSize: number;
  gap: number;
  color: string;
  style?: any;
}) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>
      {Array.from({ length: dots }).map((_, i) => (
        <View
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
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

function Shortcut({
  icon,
  label,
  variant = "orange",
  rings,
  colors,
}: {
  icon: any;
  label: string;
  variant?: ShortcutVariant;
  rings?: boolean;
  colors: any;
}) {
  const styles = getStyles(colors);
  const v = SHORTCUT_VARIANTS[variant];
  return (
    <View style={styles.shortcut}>
      <View style={[styles.shortcutIcon, { backgroundColor: v.bg, borderColor: v.border }]}>
        {rings && (
          <>
            <View style={[styles.ring, { width: 50, height: 50, borderRadius: 25, borderColor: v.border }]} />
            <View style={[styles.ring, { width: 38, height: 38, borderRadius: 19, borderColor: v.fg }]} />
          </>
        )}
        <Ionicons name={icon} size={22} color={v.fg} />
      </View>
      <Text style={styles.shortcutLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

/**
 * Promo hero: illustrations are drawn on a fixed 361pt-wide canvas and scaled
 * to whatever width the card actually has, so they fit every iPhone (15 = 393pt wide).
 */
function Hero({ bg, height, children }: { bg: string; height: number; children: React.ReactNode }) {
  const [w, setW] = useState(0);
  const s = w ? w / 361 : 1;
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{
        height: height * s,
        backgroundColor: bg,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: 361, height, transform: [{ scale: s }] }}>{children}</View>
    </View>
  );
}

/** A soft 3D "puff" (foliage ball) with a highlight */
function Puff({ left, top, size, color }: { left: number; top: number; size: number; color: string }) {
  return (
    <View
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: size * 0.16,
          top: size * 0.1,
          width: size * 0.44,
          height: size * 0.26,
          borderRadius: size * 0.13,
          backgroundColor: "rgba(255,255,255,0.2)",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: size * 0.1,
          bottom: 0,
          width: size * 0.8,
          height: size * 0.22,
          borderBottomLeftRadius: size / 2,
          borderBottomRightRadius: size / 2,
          backgroundColor: "rgba(0,40,10,0.16)",
        }}
      />
    </View>
  );
}

function Bar({
  left, top, width, height, color, rotate = "0deg", radius,
}: {
  left: number; top: number; width: number; height: number; color: string; rotate?: string; radius?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: radius ?? height / 2,
        backgroundColor: color,
        transform: [{ rotate }],
      }}
    />
  );
}

/** Investments hero: bonsai-style 3D tree on pink */
function TreeIllustration() {
  const wood = "#9A5A3A";
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* trunk + branches */}
      <Bar left={157} top={118} width={48} height={44} color="#A9643F" radius={22} />
      <Bar left={169} top={58} width={24} height={96} color={wood} radius={12} />
      <Bar left={176} top={64} width={5} height={70} color="rgba(255,255,255,0.18)" />
      <Bar left={116} top={84} width={70} height={9} color={wood} rotate="-30deg" />
      <Bar left={184} top={90} width={78} height={9} color={wood} rotate="26deg" />
      {/* canopies */}
      <Puff left={128} top={18} size={52} color="#4BA857" />
      <Puff left={196} top={14} size={62} color="#3A9247" />
      <Puff left={150} top={2} size={74} color="#3F9A4B" />
      <Puff left={86} top={52} size={58} color="#3F9A4B" />
      <Puff left={64} top={70} size={38} color="#4BA857" />
      <Puff left={204} top={66} size={62} color="#3A9247" />
      <Puff left={246} top={58} size={42} color="#4BA857" />
      <Puff left={102} top={102} size={36} color="#4BA857" />
    </View>
  );
}

/** Pension hero: golden treasure chest with padlock on purple */
function ChestIllustration() {
  const gold = "#F2C14E";
  const wood = "#D98443";
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* ground shadow */}
      <Bar left={104} top={124} width={152} height={14} color="rgba(40,0,80,0.22)" />
      <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: "-7deg" }] }]}>
        {/* coin on top */}
        <View
          style={{
            position: "absolute", left: 166, top: 6, width: 30, height: 30, borderRadius: 15,
            backgroundColor: "#F8D56A", borderWidth: 4, borderColor: "#EDB22F",
          }}
        />
        {/* lid */}
        <View
          style={{
            position: "absolute", left: 116, top: 26, width: 128, height: 54,
            borderTopLeftRadius: 64, borderTopRightRadius: 64,
            backgroundColor: wood, borderWidth: 7, borderBottomWidth: 0, borderColor: gold,
          }}
        />
        {/* body */}
        <View
          style={{
            position: "absolute", left: 120, top: 74, width: 120, height: 58, borderRadius: 10,
            backgroundColor: wood, borderWidth: 7, borderColor: gold,
          }}
        />
        <Bar left={132} top={92} width={96} height={3} color="#B8672F" />
        <Bar left={132} top={106} width={96} height={3} color="#B8672F" />
        {/* band */}
        <Bar left={114} top={70} width={132} height={9} color={gold} radius={4} />
        {/* lock */}
        <View
          style={{
            position: "absolute", left: 171, top: 60, width: 20, height: 20, borderRadius: 10,
            borderWidth: 4, borderColor: gold,
          }}
        />
        <Bar left={166} top={74} width={30} height={34} color={gold} radius={7} />
        <Bar left={178} top={84} width={7} height={7} color="#B8782A" radius={4} />
        <Bar left={180} top={89} width={3} height={9} color="#B8782A" radius={1} />
      </View>
    </View>
  );
}

/** A little 3D orange cube (also used as the footer logo) */
function Cube({ size, left, top, rotate }: { size: number; left: number; top: number; rotate: string }) {
  return (
    <View
      style={{
        position: "absolute", left, top, width: size, height: size,
        transform: [{ rotate }],
      }}
    >
      <View style={{ flex: 1, borderRadius: size * 0.22, backgroundColor: "#C4431C" }} />
      <View
        style={{
          position: "absolute", left: 0, top: 0, width: size * 0.88, height: size * 0.88,
          borderRadius: size * 0.22, backgroundColor: "#F26A3D",
        }}
      />
      <View
        style={{
          position: "absolute", right: size * 0.17, top: size * 0.4,
          width: size * 0.15, height: size * 0.15, borderRadius: 2,
          backgroundColor: "#FFFFFF", transform: [{ rotate: "20deg" }],
        }}
      />
    </View>
  );
}

/** Quick Credit hero: speeding cubes with motion trails on orange */
function CreditIllustration() {
  const trail = "rgba(255,228,204,0.40)";
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* big cube */}
      <Bar left={150} top={8} width={200} height={84} color={trail} rotate="-18deg" radius={40} />
      <Bar left={116} top={26} width={80} height={9} color={trail} rotate="-12deg" />
      <Bar left={108} top={50} width={92} height={9} color={trail} rotate="-12deg" />
      <Cube size={84} left={252} top={12} rotate="22deg" />
      {/* small top-left cube */}
      <Bar left={16} top={6} width={104} height={52} color={trail} rotate="-14deg" radius={26} />
      <Bar left={-6} top={16} width={44} height={8} color={trail} rotate="-8deg" />
      <Cube size={50} left={44} top={8} rotate="-14deg" />
      {/* small bottom cube */}
      <Bar left={80} top={64} width={90} height={42} color={trail} rotate="-12deg" radius={21} />
      <Cube size={38} left={112} top={62} rotate="-8deg" />
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: 130, // room for the floating tab bar
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 20,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    headerIcons: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: spacing.xs },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute", top: -4, right: -4, backgroundColor: colors.danger,
      borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    },
    badgeText: { ...typography.labelBold, color: colors.white, fontSize: 10, lineHeight: 12, letterSpacing: 0 },
    dropdown: {
      position: "absolute", top: 40, right: 0, backgroundColor: colors.card,
      borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, ...shadow,
      minWidth: 180, zIndex: 30, overflow: "hidden",
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
    greeting: { flex: 1, ...typography.h3, color: colors.textPrimary },

    // balance area sits directly on the page background (no card), like the screenshot
    balanceCard: { backgroundColor: "transparent", marginTop: spacing.xs },
    accountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    accountTypePill: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    },
    accountLabel: { ...typography.bodyMedium, color: colors.textSecondary },
    accountNumberPill: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    },
    accountNumberText: { ...typography.bodyMedium, color: colors.textSecondary, letterSpacing: 0.2 },
    balanceAmountRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      marginTop: spacing.lg, marginBottom: spacing.sm, minHeight: 40,
    },
    balanceAmount: { ...typography.display, color: colors.textPrimary, flexShrink: 1 },
    balanceHeaderRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      marginBottom: spacing.md,
    },
    balanceLabel: { ...typography.bodyMedium, color: colors.textSecondary },
    pillScroll: { marginHorizontal: -spacing.lg },
    balanceActions: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg },
    actionPill: {
      flexDirection: "row", alignItems: "center", gap: 8, height: 44,
      backgroundColor: colors.primaryLight, paddingHorizontal: 18, borderRadius: radii.pill,
      borderWidth: 1, borderColor: "rgba(244,81,30,0.12)",
    },
    actionPillText: { color: colors.primary, ...typography.button, fontSize: 16 },
    actionPillOutline: {
      flexDirection: "row", alignItems: "center", gap: 8, height: 44,
      backgroundColor: colors.primaryLight, paddingHorizontal: 18, borderRadius: radii.pill,
      borderWidth: 1, borderColor: "rgba(244,81,30,0.12)",
    },
    actionPillOutlineText: { color: colors.primary, ...typography.button, fontSize: 16 },

    sectionTitle: {
      ...typography.sectionTitle, color: colors.textPrimary,
      marginTop: spacing.xl, marginBottom: spacing.md,
    },
    sectionTitleInline: { marginTop: 0, marginBottom: 0 },
    sectionHeaderRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      marginTop: spacing.xl, marginBottom: spacing.md,
    },
    seeMoreWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
    seeMore: { color: colors.textSecondary, ...typography.bodyMedium },
    dateGroup: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.sm },

    // 5 shortcuts share the row width equally so they always fit the screen
    shortcutsRow: { flexDirection: "row", justifyContent: "space-between" },
    shortcutPressable: { flex: 1 },
    shortcut: { flex: 1, alignItems: "center" },
    shortcutIcon: {
      width: 58, height: 58, borderRadius: 29, borderWidth: 1,
      alignItems: "center", justifyContent: "center", marginBottom: spacing.xs,
    },
    ring: { position: "absolute", borderWidth: 1 },
    shortcutLabel: { ...typography.label, color: colors.textSecondary, textAlign: "center" },

    txCard: {
      backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs,
    },
    txRow: {
      flexDirection: "row", alignItems: "center",
      paddingVertical: spacing.sm,
    },
    txRowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    txIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
    },
    txIconInner: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
    },
    txTitle: { ...typography.bodyBold, color: colors.textPrimary },
    txSubtitle: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
    txAmount: { ...typography.bodyBold, color: colors.textPrimary },
    // keeps the same line height as the amount text it replaces
    txAmountMask: { height: 21, justifyContent: "center" },
    txFrom: { ...typography.small, color: colors.textSecondary, marginTop: 2 },

    // promo cards (Investments / Pension / Quick Credit)
    promoCard: {
      backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      overflow: "hidden",
    },
    promoFooter: { padding: spacing.md },
    promoFooterRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    promoBody: {
      ...typography.body, fontSize: 16, lineHeight: 24, color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    promoBodyFlex: { flex: 1, marginBottom: 0 },
    promoButton: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      height: 48, borderRadius: 6,
      backgroundColor: ORANGE_SOFT, borderWidth: 1, borderColor: ORANGE_BORDER,
    },
    promoButtonText: { color: ORANGE, ...typography.buttonLarge, fontSize: 18 },

    disclaimerCard: {
      flexDirection: "row", alignItems: "center", gap: spacing.sm,
      backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      padding: spacing.sm, marginTop: spacing.xl,
    },
    disclaimerLogo: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: ORANGE_SOFT,
    },
    disclaimer: { flex: 1, ...typography.small, fontSize: 12.5, lineHeight: 17, letterSpacing: 0.05, color: colors.textMuted },
  });
}