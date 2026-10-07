import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  BackHandler,
} from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatNaira } from "../data/format";
import { Beneficiary } from "../data/types";
import { CURRENT_USER } from "../data/seed";
import { useAppStore } from "../state/AppStore";
import PinEntry from "../components/PinEntry";
import SuccessSheet from "../components/SuccessSheet";

const PIN_LENGTH = 4;
const NARRATION_MAX = 50;

// Accent colours taken from the reference design
const SEND_ORANGE = "#FF5A1F";
const AVATAR_BG = "#FBE3E6";
const AVATAR_BORDER = "#F4C6CC";
const AVATAR_TEXT = "#E8344E";
const RATE_BG = "#12261A";
const RATE_TEXT = "#3DDC5A";

/** Groups the digits as you type: 1234.5 -> 1,234.5 (max two decimals). */
function formatAmountInput(raw: string) {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const decimals = rest.join("").slice(0, 2);
  const grouped = whole ? Number(whole).toLocaleString("en-US") : "";
  if (!cleaned.includes(".")) return grouped;
  return `${grouped || "0"}.${decimals}`;
}

export default function TransferAmountScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const beneficiary: Beneficiary = route.params.beneficiary;
  const { currentUser, balance, verifyPin, sendTransfer } = useAppStore();

  const fromAccountNumber = currentUser?.accountNumber ?? CURRENT_USER.accountNumber;
  const fromName = currentUser?.fullName ?? CURRENT_USER.fullName;

  // "details" collects the amount, "pin" asks for the password before sending.
  const [step, setStep] = useState<"details" | "pin">("details");
  const [amountInput, setAmountInput] = useState("");
  const [narration, setNarration] = useState("");
  const [pin, setPin] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  const amount = Number(amountInput.replace(/,/g, ""));

  const animateStep = (direction: 1 | -1) => {
    slide.setValue(48 * direction);
    Animated.timing(slide, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const amountError =
    error ??
    (amountInput.length > 0 && !(amount > 0)
      ? "Enter an amount greater than zero"
      : amount > balance
      ? "Insufficient balance for this transfer"
      : null);

  const goToPin = () => {
    if (!(amount > 0)) {
      setError("Enter an amount to continue");
      return;
    }
    if (amount > balance) {
      setError("Insufficient balance for this transfer");
      return;
    }
    setError(null);
    setPin("");
    setStep("pin");
    animateStep(1);
  };

  const backToDetails = () => {
    if (processing) return;
    setError(null);
    setPin("");
    setStep("details");
    animateStep(-1);
  };

  React.useEffect(() => {
    if (step !== "pin") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      backToDetails();
      return true;
    });
    return () => subscription.remove();
  }, [step, processing]);

  React.useEffect(() => {
    if (!success) return;
    // The sheet slides itself out; onClose then lands us back on the home tab.
    const timer = setTimeout(() => setSuccess(false), 2500);
    return () => clearTimeout(timer);
  }, [success]);

  const goHome = () => {
    setSuccess(false);
    navigation.navigate("Home", { tab: "home" });
  };

  const handleKey = (key: string) => {
    setError(null);
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "" || pin.length >= PIN_LENGTH || processing) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      submitTransfer(next);
    }
  };

  const submitTransfer = async (enteredPin: string) => {
    setProcessing(true);
    setError(null);

    const pinAccepted = await verifyPin(enteredPin);
    if (!pinAccepted) {
      setProcessing(false);
      setError("Incorrect PIN. Try again.");
      setPin("");
      return;
    }

    const result = await sendTransfer(beneficiary, amount, narration);
    setProcessing(false);
    if (!result.success) {
      setError(result.error ?? "Transfer failed");
      setPin("");
      return;
    }
    setSuccess(true);
  };

  const sendDisabled = !(amount > 0) || amount > balance || processing;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </Pressable>
        {step === "pin" && <Text style={styles.title}>Confirm transfer</Text>}
        <View style={{ width: 26 }} />
      </View>

      <Animated.View
        style={[styles.step, { transform: [{ translateX: slide }], opacity: slide.interpolate({
          inputRange: [-48, 0, 48],
          outputRange: [0.4, 1, 0.4],
        }) }]}
      >
        {step === "details" ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* receiver: the account the money lands in */}
            <View style={styles.receiverRow}>
              <View style={styles.receiverText}>
                <Text style={styles.receiverHeading} numberOfLines={1} ellipsizeMode="tail">
                  {beneficiary.fullName}
                </Text>
                <Text style={styles.receiverMeta} numberOfLines={1}>
                  {beneficiary.fullName}
                </Text>
                <Text style={styles.receiverMeta} numberOfLines={1}>
                  GTBank • {beneficiary.accountNumber} • NGN
                </Text>
                <View style={styles.rateRow}>
                  <Text style={styles.receiverMeta}>Transfer success rate</Text>
                  <View style={styles.rateBadge}>
                    <Text style={styles.rateText}>100%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initialsOf(beneficiary.fullName)}</Text>
                </View>
                <View style={styles.bankBadge}>
                  <Ionicons name="business" size={11} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* sender: the account the money leaves + amount field */}
            <View style={[styles.senderCard, amountError && styles.senderCardError]}>
              <View style={styles.senderLeft}>
                <View style={styles.senderNumberRow}>
                  <Text style={styles.senderNumber}>{fromAccountNumber}</Text>
                  <Ionicons name="chevron-down" size={16} color={SEND_ORANGE} />
                </View>
                <Text style={styles.senderLabel} numberOfLines={1}>
                  From {CURRENT_USER.accountLabel}
                </Text>
                <Text style={styles.senderBalance} numberOfLines={1}>
                  {formatNaira(balance)}
                </Text>
              </View>

              <View style={styles.amountWrap}>
                <Text style={styles.nairaSign}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountInput}
                  onChangeText={(text) => {
                    setError(null);
                    setAmountInput(formatAmountInput(text));
                  }}
                  onFocus={() => setError(null)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={goToPin}
                />
              </View>
            </View>

            {/* narration shown as "Remark" */}
            <View style={styles.narrationField}>
              <TextInput
                style={styles.narrationInput}
                value={narration}
                onChangeText={(text) => {
                  setError(null);
                  setNarration(text.slice(0, NARRATION_MAX));
                }}
                placeholder="Remark"
                placeholderTextColor={colors.textMuted}
                maxLength={NARRATION_MAX}
                returnKeyType="done"
                onSubmitEditing={goToPin}
              />
              {narration.length > 0 && (
                <Text style={styles.narrationCount}>
                  {NARRATION_MAX - narration.length}
                </Text>
              )}
            </View>

            {amountError && <Text style={styles.errorText}>{amountError}</Text>}
          </ScrollView>
        ) : (
          <View style={styles.pinBody}>
            <Text style={styles.pinSummary}>
              {formatNaira(amount)} to {beneficiary.fullName}
            </Text>
            <Text style={styles.pinSubSummary}>
              {fromAccountNumber} → {beneficiary.accountNumber}
            </Text>

            <PinEntry
              title="Enter Password"
              pin={pin}
              length={PIN_LENGTH}
              error={error}
              status={processing ? "Processing..." : null}
              hint="Demo accounts use PIN: 1234"
              onKey={handleKey}
            />
          </View>
        )}
      </Animated.View>

      {step !== "pin" && (
        <View style={styles.footer}>
          <Pressable
            onPress={goToPin}
            disabled={sendDisabled}
            style={({ pressed }) => [
              styles.sendButton,
              sendDisabled && styles.sendButtonDisabled,
              pressed && !sendDisabled && styles.sendButtonPressed,
            ]}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      )}

      <SuccessSheet
        visible={success}
        onClose={goHome}
        badge="swap-horizontal"
        amount={amount}
        title={`Successfully sent to ${beneficiary.fullName}`}
        body={`Account ${beneficiary.accountNumber}`}
        primary={{ label: "Done", onPress: goHome }}
      />
    </SafeAreaView>
  );

  function goBack() {
    if (step === "pin") {
      backToDetails();
      return;
    }
    navigation.goBack();
  }
}

function initialsOf(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    title: { ...typography.h3, color: colors.textPrimary },
    step: { flex: 1 },

    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

    /* receiver */
    receiverRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    receiverText: { flex: 1 },
    receiverHeading: {
      fontSize: 30,
      lineHeight: 38,
      fontWeight: "800",
      letterSpacing: -0.6,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    receiverMeta: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
    rateRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    rateBadge: {
      backgroundColor: RATE_BG,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginTop: 4,
    },
    rateText: { ...typography.body, color: RATE_TEXT },

    avatarWrap: { width: 84, height: 84, marginTop: spacing.xs },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: AVATAR_BG,
      borderWidth: 1.5,
      borderColor: AVATAR_BORDER,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 22, fontWeight: "500", color: AVATAR_TEXT },
    bankBadge: {
      position: "absolute",
      right: 0,
      bottom: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    /* sender + amount */
    senderCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radii.md ?? 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    senderCardError: { borderColor: colors.danger },
    senderLeft: { flexShrink: 0, maxWidth: "50%" },
    senderNumberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    senderNumber: { ...typography.bodyBold, color: colors.textPrimary },
    senderLabel: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xs },
    senderBalance: { ...typography.small, color: colors.textMuted, marginTop: 2 },

    amountWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 4,
    },
    nairaSign: { fontSize: 26, lineHeight: 32, color: colors.textSecondary },
    amountInput: {
      flex: 1,
      minWidth: 60,
      textAlign: "right",
      color: colors.textPrimary,
      fontSize: 26,
      lineHeight: 32,
      paddingVertical: 0,
      fontFamily: typography.display.fontFamily,
    },

    /* remark (narration) */
    narrationField: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radii.md ?? 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    narrationInput: {
      flex: 1,
      ...typography.body,
      fontSize: 17,
      color: colors.textPrimary,
      paddingVertical: spacing.sm,
    },
    narrationCount: { ...typography.small, color: colors.textMuted },

    errorText: { ...typography.small, color: colors.danger, marginTop: spacing.sm, textAlign: "center" },

    /* send */
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    sendButton: {
      minWidth: 170,
      width: "52%",
      height: 52,
      borderRadius: 4,
      backgroundColor: SEND_ORANGE,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: { opacity: 0.45 },
    sendButtonPressed: { opacity: 0.85 },
    sendLabel: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },

    /* pin step (unchanged) */
    pinBody: { flex: 1, alignItems: "center", paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
    pinSummary: { ...typography.h3, color: colors.textPrimary, textAlign: "center" },
    pinSubSummary: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xs },
  });
}