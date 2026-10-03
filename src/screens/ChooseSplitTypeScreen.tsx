import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { spacing, typography, radii, fw } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { computeEqualSplit } from "../data/splitMaths";
import { useAppStore } from "../state/AppStore";
import { CURRENT_USER } from "../data/seed";

// GTBank brand orange (base color for this screen). Surfaces/text come from the theme.
const GT_ORANGE = "#F05A22";
const GT_GREEN = "#1FB141";

// Bottom sheet takes ~42% of the screen (≈ 360pt on an iPhone 15's 852pt height)
const SCREEN_H = Dimensions.get("window").height;
const SHEET_H = Math.round(SCREEN_H * 0.42);

type SplitType = "equal" | "custom";

const SPLIT_OPTIONS: { key: SplitType; label: string }[] = [
  { key: "equal", label: "Equal" },
  { key: "custom", label: "Custom Amount" },
];

export default function ChooseSplitTypeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { splitName, participants, prefillAmount } = route.params;
  const { createSplit } = useAppStore();

  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [totalAmount, setTotalAmount] = useState(prefillAmount ? String(prefillAmount) : "");
  const [amountFocused, setAmountFocused] = useState(false);
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSplitId, setCreatedSplitId] = useState<string | null>(null);

  // dropdown state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<View>(null);

  // success sheet animation (0 = hidden, 1 = shown)
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const numericTotal = parseFloat(totalAmount) || 0;
  const equalSplit = computeEqualSplit(numericTotal, participants.length);
  const equalShare = equalSplit.participantShare;

  const assignedTotal = Object.values(customShares).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const customHostShare = Math.max(numericTotal - assignedTotal, 0);
  const hostShare = splitType === "equal" ? equalSplit.hostShare : customHostShare;
  const remaining = customHostShare;

  const canProceed = numericTotal > 0;
  const currentLabel = SPLIT_OPTIONS.find((o) => o.key === splitType)!.label;

  const openMenu = () => {
    dropdownRef.current?.measureInWindow((x, y, w, h) => {
      const screenW = Dimensions.get("window").width;
      setMenuPos({ top: y + h + 6, right: screenW - (x + w) });
      setMenuOpen(true);
    });
  };

  const selectSplitType = (type: SplitType) => {
    setSplitType(type);
    setMenuOpen(false);
  };

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

  const openSuccessSheet = () => {
    sheetAnim.setValue(0);
    setShowSuccessModal(true);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
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
    openSuccessSheet();
  };

  /** Slides the sheet back out, then runs `afterClose` once it is off-screen. */
  const dismissSuccessSheet = (afterClose: () => void) => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
      afterClose();
    });
  };

  const goHome = () => dismissSuccessSheet(() => navigation.navigate("Home", { tab: "home" }));

  const goToTracking = () => {
    const splitId = createdSplitId;
    if (!splitId) return;
    dismissSuccessSheet(() => navigation.navigate("SplitTracking", { splitId }));
  };

  const InitialsBadge = ({ initials }: { initials: string }) => (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{initials}</Text>
    </View>
  );

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_H, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {/* Split name + icon */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.splitNameLabel}>Splitting</Text>
            <Text style={styles.splitName} numberOfLines={1}>
              {splitName}
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="receipt" size={24} color={GT_ORANGE} />
          </View>
        </View>

        {/* Total amount card */}
        <Text style={styles.amountLabel}>Total amount</Text>
        <View style={[styles.amountCard, amountFocused && styles.amountCardFocused]}>
          <Text style={styles.currency}>₦</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={totalAmount}
            onChangeText={setTotalAmount}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            selectionColor={GT_ORANGE}
            returnKeyType="done"
          />
          {totalAmount.length > 0 && (
            <Pressable onPress={() => setTotalAmount("")} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Split among + dropdown */}
        <View style={styles.splitHeaderRow}>
          <Text style={styles.splitHeaderLabel}>
            Split among <Text style={styles.dot}>•</Text>{" "}
            <Text style={styles.splitCount}>{participants.length + 1}</Text>
          </Text>

          <Pressable onPress={openMenu} hitSlop={8}>
            <View ref={dropdownRef} collapsable={false} style={styles.dropdownTrigger}>
              <Text style={styles.dropdownText}>{currentLabel}</Text>
              <Ionicons
                name={menuOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color={GT_ORANGE}
              />
            </View>
          </Pressable>
        </View>

        {splitType === "custom" && numericTotal > 0 && (
          <View style={styles.remainingBanner}>
            <Text style={styles.remainingText}>{formatNaira(remaining)} left to assign</Text>
          </View>
        )}

        {/* You */}
        <View style={styles.participantRow}>
          <InitialsBadge initials={CURRENT_USER.initials} />
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>You</Text>
            <Text style={styles.participantSub}>Paid Share</Text>
          </View>
          <Text style={styles.shareAmount}>{formatNaira(hostShare)}</Text>
        </View>

        {/* Others */}
        {participants.map((p: any) => (
          <View key={p.id} style={styles.participantRow}>
            <InitialsBadge initials={p.initials} />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{p.name}</Text>
              <Text style={styles.participantSub}>You're Owed</Text>
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
                selectionColor={GT_ORANGE}
              />
            )}
          </View>
        ))}

        {splitType === "custom" && numericTotal === 0 && (
          <Text style={styles.hint}>Enter a total amount above before assigning shares</Text>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleProceed}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.sendBtn,
            !canProceed && styles.sendBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.sendBtnText}>Send split requests</Text>
        </Pressable>
      </View>

      {/* Dropdown menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: menuPos.top, right: menuPos.right }]}>
            {SPLIT_OPTIONS.map((opt, i) => {
              const active = opt.key === splitType;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => selectSplitType(opt.key)}
                  style={[styles.menuItem, i > 0 && styles.menuItemBorder]}
                >
                  <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={GT_ORANGE} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Success bottom sheet */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={goHome}
      >
        <View style={styles.sheetRoot}>
          {/* Blurred version of the screen behind (fades in) */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: sheetAnim }]}>
            <BlurView
              intensity={Platform.OS === "ios" ? 35 : 60}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.sheetDim} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[styles.sheet, { height: SHEET_H, transform: [{ translateY: sheetTranslateY }] }]}
          >
            <View style={styles.sheetHandle} />

            {/* Icon + amount */}
            <View style={styles.sheetTopRow}>
              <View style={styles.sheetIcons}>
                <View style={styles.sheetCheck}>
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </View>
                <View style={styles.sheetReceipt}>
                  <Ionicons name="receipt" size={15} color={GT_ORANGE} />
                </View>
              </View>
              <Text style={styles.sheetAmount}>{formatNaira(numericTotal)}</Text>
            </View>

            <Text style={styles.sheetTitle}>
              Request to split the bill for {splitName} has been sent
            </Text>

            {/* Buttons */}
            <View style={styles.sheetBtnRow}>
              <Pressable
                onPress={goToTracking}
                style={({ pressed }) => [
                  styles.sheetBtn,
                  styles.sheetBtnOutline,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.sheetBtnOutlineText}>Review</Text>
              </Pressable>

              <Pressable
                onPress={goHome}
                style={({ pressed }) => [
                  styles.sheetBtn,
                  styles.sheetBtnPrimary,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.sheetBtnPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.xl },

    backBtn: { alignSelf: "flex-start", marginBottom: 20 },

    titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
    splitNameLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 2 },
    splitName: { ...typography.sectionTitle, color: colors.textPrimary },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },

    // Total amount card
    amountLabel: { ...typography.smallBold, fontSize: 14, lineHeight: 20, color: colors.textPrimary, marginBottom: 8 },
    amountCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 16,
      height: 72,
      marginBottom: 28,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    amountCardFocused: {
      borderColor: GT_ORANGE,
      shadowColor: GT_ORANGE,
      shadowOpacity: 0.18,
    },
    currency: { ...typography.h1, fontSize: 30, lineHeight: 36, color: GT_ORANGE, marginRight: 8 },
    amountInput: {
      flex: 1,
      ...typography.h1,
      fontSize: 32,
      lineHeight: 38,
      color: colors.textPrimary,
      padding: 0,
    },

    splitHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    splitHeaderLabel: { ...typography.small, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
    dot: { color: colors.textPrimary },
    splitCount: { color: colors.textPrimary, ...fw("700") },
    dropdownTrigger: { flexDirection: "row", alignItems: "center", gap: 4 },
    dropdownText: { ...typography.smallBold, fontSize: 14, lineHeight: 20, color: GT_ORANGE },

    remainingBanner: {
      backgroundColor: colors.primaryLight,
      borderRadius: radii.md,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    remainingText: { color: GT_ORANGE, ...typography.smallBold, fontSize: 14, lineHeight: 20 },

    participantRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    badgeText: { ...typography.smallBold, fontSize: 14, lineHeight: 20, color: GT_ORANGE },
    participantInfo: { flex: 1, marginLeft: 12 },
    participantName: { ...typography.bodyBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
    participantSub: { ...typography.small, fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
    shareAmount: { ...typography.bodyBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
    customInput: {
      width: 120,
      textAlign: "right",
      borderWidth: 1.5,
      borderColor: GT_ORANGE,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      ...typography.bodyBold,
      fontSize: 16,
      lineHeight: 22,
      color: colors.textPrimary,
      backgroundColor: colors.card,
    },
    hint: { ...typography.small, color: colors.textSecondary, textAlign: "center", marginTop: 8 },

    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      alignItems: "flex-end",
      backgroundColor: "transparent",
    },
    sendBtn: {
      backgroundColor: GT_ORANGE,
      borderRadius: 10,
      paddingVertical: 15,
      paddingHorizontal: 24,
    },
    sendBtnDisabled: { backgroundColor: "#F6B9A1" },
    sendBtnText: { color: colors.white, ...typography.button },

    menu: {
      position: "absolute",
      minWidth: 190,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    menuItemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    menuItemText: { ...typography.body, color: colors.textPrimary },
    menuItemTextActive: { color: GT_ORANGE, ...fw("700") },

    // Success bottom sheet (sized for iPhone 15, 393pt wide)
    sheetRoot: { flex: 1, justifyContent: "flex-end" },
    sheetDim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 30,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 20,
    },
    sheetTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    sheetIcons: { flexDirection: "row", alignItems: "center" },
    sheetCheck: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: GT_GREEN,
      alignItems: "center",
      justifyContent: "center",
    },
    // Sits on top of the check circle — the card-coloured ring is what makes
    // the overlap read as two badges instead of a clipping glitch.
    sheetReceipt: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 2.5,
      borderColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -10,
    },
    sheetAmount: { ...typography.display, color: colors.textPrimary },
    sheetTitle: {
      ...typography.bodyBold,
      fontSize: 20,
      lineHeight: 27,
      color: colors.textPrimary,
      marginBottom: "auto",
    },
    sheetBtnRow: { flexDirection: "row", gap: 12 },
    sheetBtn: {
      flex: 1,
      height: 50,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetBtnOutline: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetBtnOutlineText: { ...typography.buttonLarge, color: colors.textPrimary },
    sheetBtnPrimary: { backgroundColor: GT_ORANGE },
    sheetBtnPrimaryText: { ...typography.buttonLarge, color: "#fff" },
  });
}