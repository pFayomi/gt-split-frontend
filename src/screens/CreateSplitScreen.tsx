import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CURRENT_USER } from "../data/seed";
import { useAppStore } from "../state/AppStore";
import * as Contacts from "expo-contacts/legacy";

// ---- GTWorld look & feel tokens -------------------------------------------
const GT_ORANGE = "#E04F16";
const GT_ORANGE_LIGHT = "#FDEBE3";
// Translucent so the same border reads correctly on light and dark surfaces
const GT_ORANGE_BORDER = "rgba(224,79,22,0.32)";
const GT_RADIUS = 8; // GTWorld uses small, crisp corner radii

// Tinted avatar palette (soft fill + vivid initials, like the beneficiaries list)
const AVATAR_TINTS = [
  { bg: "#FEF4E4", border: "#FADFB5", fg: "#F5A623" },
  { bg: "#E7F8F1", border: "#BDEBD6", fg: "#2FC88A" },
  { bg: "#EAF7E8", border: "#C4EBC0", fg: "#4CC24A" },
  { bg: GT_ORANGE_LIGHT, border: GT_ORANGE_BORDER, fg: GT_ORANGE },
];

function tintFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}
// ---------------------------------------------------------------------------

// iPhone 15 logical screen width is 393pt. All sizes below are designed for that width.
const BASE_WIDTH = 393;

type Participant = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  isGTUser: boolean;
};

function resolveName(contact: Contacts.Contact): string {
  if (contact.name && contact.name.trim().length > 0) return contact.name;
  const combined = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  if (combined.length > 0) return combined;
  return contact.phoneNumbers?.[0]?.number ?? "Unnamed contact";
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function CreateSplitScreen() {
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();
  const factor = Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.1);
  const scale = (size: number) => Math.round(size * factor);
  const styles = getStyles(colors, scale, mode);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefill = route.params ?? {};
  const [splitName, setSplitName] = useState(prefill.splitName ?? "");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const { currentUser } = useAppStore();

  const handleBrowseContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") return;

    const contact = await Contacts.presentContactPickerAsync();
    if (!contact) return; // user cancelled the picker

    const name = resolveName(contact);
    const newParticipant: Participant = {
      id: `device-${contact.id}`,
      name,
      initials: initialsFor(name),
      phone: contact.phoneNumbers?.[0]?.number ?? "",
      email: "",
      isGTUser: false,
    };

    setParticipants((prev) => {
      if (prev.some((p) => p.id === newParticipant.id)) return prev; // no duplicates
      return [...prev, newParticipant];
    });
  };

  const updateEmail = (id: string, email: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, email } : p)));
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const hasName = splitName.trim().length > 0;
  const hasParticipant = participants.length > 0;
  const canProceed = hasName && hasParticipant;

  const handleProceed = () => {
    navigation.navigate("ChooseSplitType", {
      splitName,
      participants,
      prefillAmount: prefill.totalAmount,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={scale(24)} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Create Split</Text>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt" size={scale(20)} color={GT_ORANGE} />
          </View>
        </View>
        <Text style={styles.subtitle}>Split shared expenses with friends, family & colleagues</Text>

        <View style={styles.sourceCard}>
          <View style={styles.sourceIcon}>
            <Ionicons name="wallet-outline" size={scale(20)} color={GT_ORANGE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceAccountNumber}>
              {currentUser?.accountNumber ?? CURRENT_USER.accountNumber}
            </Text>
            <Text style={styles.sourceAccountLabel}>{CURRENT_USER.accountLabel}</Text>
          </View>
        </View>

        <Text style={styles.label}>Enter Split Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dinner Split"
          placeholderTextColor={colors.textMuted}
          value={splitName}
          onChangeText={setSplitName}
        />

        <View style={styles.contactHeaderRow}>
          <Text style={styles.label}>Participants</Text>
          <Pressable onPress={handleBrowseContacts} style={styles.addButton}>
            <Ionicons name="add" size={scale(16)} color={GT_ORANGE} />
            <Text style={styles.browseLink}>Add participant</Text>
          </Pressable>
        </View>

        {participants.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={scale(28)} color={GT_ORANGE} />
            </View>
            <Text style={styles.emptyTitle}>No participants selected</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add participant" to pick someone from your contacts
            </Text>
          </View>
        ) : (
          participants.map((p) => {
            const tint = tintFor(p.id);
            return (
              <View key={p.id} style={styles.contactCard}>
                <View style={styles.contactRow}>
                  <View
                    style={[
                      styles.avatar,
                      mode === "light"
                        ? { backgroundColor: tint.bg, borderColor: tint.border }
                        : // Dark mode: tint of the accent colour instead of a bright pastel fill
                          { backgroundColor: `${tint.fg}2E`, borderColor: `${tint.fg}55` },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: tint.fg }]}>{p.initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.contactPhone} numberOfLines={1}>
                      {p.phone}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeParticipant(p.id)} style={styles.removeButton}>
                    <Ionicons name="close" size={scale(16)} color={colors.danger} />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.emailInput}
                  placeholder="Email for notifications (optional)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={p.email}
                  onChangeText={(val) => updateEmail(p.id, val)}
                />
              </View>
            );
          })
        )}

        {!canProceed && (
          <Text style={styles.hint}>
            {!hasName && !hasParticipant
              ? "Enter a split name and add at least one participant to continue"
              : !hasName
              ? "Enter a split name to continue"
              : "Add at least one participant to continue"}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleProceed}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.proceedButton,
            !canProceed && styles.proceedButtonDisabled,
            pressed && canProceed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.proceedText}>Proceed</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors: any, scale: (n: number) => number, mode: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerIcon: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: GT_ORANGE_BORDER,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.h2,
      fontSize: scale(28),
      lineHeight: scale(34),
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: spacing.lg,
      maxWidth: "80%",
    },
    sourceCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: GT_RADIUS,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    sourceIcon: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    sourceAccountNumber: {
      ...typography.bodyBold,
      fontSize: scale(17),
      lineHeight: scale(22),
      color: colors.textPrimary,
    },
    sourceAccountLabel: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.textSecondary,
      marginTop: 2,
    },
    label: {
      ...typography.bodyBold,
      fontSize: scale(17),
      lineHeight: scale(22),
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    contactHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    // Styled like the selected "All" filter chip in GTWorld
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: GT_ORANGE_BORDER,
      borderRadius: 20,
      paddingVertical: 6,
      paddingLeft: 8,
      paddingRight: 12,
    },
    browseLink: {
      ...typography.smallBold,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: GT_ORANGE,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: GT_RADIUS,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      ...typography.body,
      fontSize: scale(15),
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    contactCard: {
      backgroundColor: colors.card,
      borderRadius: GT_RADIUS,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    avatar: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      ...typography.bodyBold,
      fontSize: scale(16),
    },
    emailInput: {
      backgroundColor: mode === "light" ? "#F7F8FB" : colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      ...typography.small,
      fontSize: scale(13),
      color: colors.textPrimary,
    },
    contactName: {
      ...typography.bodyBold,
      fontSize: scale(15),
      lineHeight: scale(20),
      color: colors.textPrimary,
    },
    contactPhone: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.textSecondary,
    },
    removeButton: {
      width: scale(28),
      height: scale(28),
      borderRadius: scale(14),
      backgroundColor: colors.dangerLight,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: GT_RADIUS,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    emptyIcon: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      ...typography.bodyBold,
      fontSize: scale(15),
      lineHeight: scale(20),
      color: colors.textPrimary,
    },
    emptySubtitle: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    hint: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.danger,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      backgroundColor: colors.background,
      alignItems: "flex-end",
    },
    proceedButton: {
      width: "55%",
      backgroundColor: GT_ORANGE,
      borderRadius: 10,
      paddingVertical: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: GT_ORANGE,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    proceedButtonDisabled: { opacity: 0.45, shadowOpacity: 0 },
    proceedText: {
      ...typography.button,
      fontSize: scale(16),
      color: colors.white,
    },
  });
}