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
  Modal,
  ActivityIndicator,
} from "react-native";
import { spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CURRENT_USER } from "../data/seed";
import { useAppStore } from "../state/AppStore";
import { API_BASE_URL } from "../data/config";
import { Beneficiary } from "../data/types";

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

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/** Stable id for an account-backed participant so re-adding never duplicates. */
function accountId(acc: Beneficiary) {
  return `user-${acc.accountNumber}`;
}

/** A row offered inside the "Add participants" sheet, GTWorld account or not. */
type PickerItem = {
  key: string;
  name: string;
  phone: string;
  isGTUser: boolean;
  meta: string;
  /** Saved address-book style contact shown as its own card in the sheet. */
  saved?: boolean;
};

/** Same normalisation the backend uses, so duplicate numbers are caught. */
function phoneKey(phone: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.startsWith("234") ? digits : digits.replace(/^0/, "234");
}

/** Saved contacts offered as ready-made cards inside the "Add participants" sheet. */
const SAVED_CONTACTS: PickerItem[] = [
  {
    key: `contact-${phoneKey("08123456789")}`,
    name: "Jude",
    phone: "08123456789",
    isGTUser: false,
    meta: "Saved contact • 08123456789",
    saved: true,
  },
];

export default function CreateSplitScreen() {
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();
  const factor = Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.1);
  const scale = (size: number) => Math.round(size * factor);
  const styles = getStyles(colors, scale, mode);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefill = (route.params as any) ?? {};
  const [splitName, setSplitName] = useState(prefill.splitName ?? "");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const { currentUser } = useAppStore();
  const myAccountNumber = currentUser?.accountNumber ?? CURRENT_USER.accountNumber;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [accounts, setAccounts] = useState<Beneficiary[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  // Non-GTWorld contacts typed in during this session; they sit in the same list.
  const [contacts, setContacts] = useState<PickerItem[]>(SAVED_CONTACTS);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const items: PickerItem[] = [
    ...accounts
      .filter(
        (acc) =>
          !SAVED_CONTACTS.some((c) => phoneKey(c.phone) === phoneKey(acc.phone ?? ""))
      )
      .map((acc) => ({
        key: accountId(acc),
        name: acc.fullName,
        phone: acc.phone ?? "",
        isGTUser: true,
        meta: `GTBank • ${acc.accountNumber}`,
      })),
    ...contacts,
  ];

  const isAdded = (item: PickerItem) => participants.some((p) => p.id === item.key);

  const savedItems = items.filter((i) => i.saved);
  const otherItems = items.filter((i) => !i.saved);

  const openPicker = async () => {
    setSelected([]);
    setContacts(SAVED_CONTACTS);
    setManualOpen(false);
    setManualName("");
    setManualPhone("");
    setManualError(null);
    setPickerOpen(true);
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      const list: Beneficiary[] = Array.isArray(data) ? data : [];
      // The picker offers every other account on the backend, never yourself.
      setAccounts(list.filter((b) => b.accountNumber !== myAccountNumber));
    } catch (e) {
      setAccountsError("Could not load accounts. Check your connection.");
    } finally {
      setAccountsLoading(false);
    }
  };

  const toggleItem = (item: PickerItem) => {
    if (isAdded(item)) return;
    setSelected((prev) =>
      prev.includes(item.key)
        ? prev.filter((k) => k !== item.key)
        : [...prev, item.key]
    );
  };

  /** Drafts a contact that is not on GTWorld into the list, pre-selected. */
  const addManualContact = () => {
    const name = manualName.trim();
    const phone = manualPhone.trim();

    if (!name) {
      setManualError("Enter the contact's name.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setManualError("Enter a valid phone number.");
      return;
    }
    const key = `contact-${phoneKey(phone)}`;
    if (contacts.some((c) => c.key === key)) {
      setManualError("This contact is already in the list.");
      return;
    }
    if (participants.some((p) => phoneKey(p.phone) === phoneKey(phone))) {
      setManualError("That number is already a participant in this split.");
      return;
    }

    setContacts((prev) => [
      ...prev,
      { key, name, phone, isGTUser: false, meta: `Not on GTWorld • ${phone}` },
    ]);
    setSelected((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setManualName("");
    setManualPhone("");
    setManualError(null);
  };

  const confirmAdd = () => {
    setParticipants((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const next = [...prev];
      items.forEach((item) => {
        if (!selected.includes(item.key) || existing.has(item.key)) return;
        next.push({
          id: item.key,
          name: item.name,
          initials: initialsFor(item.name),
          phone: item.phone,
          email: "",
          isGTUser: item.isGTUser,
        });
      });
      return next;
    });
    setPickerOpen(false);
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
      narration: prefill.narration ?? null,
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
          <Pressable onPress={openPicker} style={styles.addButton}>
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
              Tap "Add participant" to pick from the other accounts or add any contact
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

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.pickerRoot}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setPickerOpen(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Add participants</Text>
            <Text style={styles.pickerSubtitle}>
              Select from the other accounts on GTWorld, or add any contact.
            </Text>

            <Pressable
              onPress={() => {
                setManualOpen((o) => !o);
                setManualError(null);
              }}
              style={({ pressed }) => [styles.manualToggle, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="person-add-outline" size={scale(16)} color={GT_ORANGE} />
              <Text style={styles.manualToggleText}>Add a contact not on GTWorld</Text>
              <Ionicons
                name={manualOpen ? "chevron-up" : "chevron-down"}
                size={scale(16)}
                color={GT_ORANGE}
              />
            </Pressable>

            {manualOpen && (
              <View style={styles.manualForm}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Contact's full name"
                  placeholderTextColor={colors.textMuted}
                  value={manualName}
                  onChangeText={(v) => {
                    setManualName(v);
                    setManualError(null);
                  }}
                />
                <TextInput
                  style={styles.manualInput}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={manualPhone}
                  onChangeText={(v) => {
                    setManualPhone(v);
                    setManualError(null);
                  }}
                />
                {!!manualError && <Text style={styles.manualError}>{manualError}</Text>}
                <Pressable
                  onPress={addManualContact}
                  style={({ pressed }) => [styles.manualAddBtn, pressed && { opacity: 0.75 }]}
                >
                  <Ionicons name="add" size={scale(16)} color={GT_ORANGE} />
                  <Text style={styles.manualAddBtnText}>Add to list</Text>
                </Pressable>
              </View>
            )}

            <ScrollView
              style={styles.pickerScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {savedItems.length > 0 && (
                <>
                  <Text style={styles.pickerSectionLabel}>Contacts</Text>
                  {savedItems.map((item) => {
                    const tint = tintFor(item.key);
                    const added = isAdded(item);
                    const on = selected.includes(item.key);
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => toggleItem(item)}
                        disabled={added}
                        style={({ pressed }) => [
                          styles.contactCard,
                          added && styles.pickRowAdded,
                          on && styles.contactCardSelected,
                          pressed && !added && { opacity: 0.7 },
                        ]}
                      >
                        <View style={styles.contactRow}>
                          <View
                            style={[
                              styles.avatar,
                              mode === "light"
                                ? { backgroundColor: tint.bg, borderColor: tint.border }
                                : { backgroundColor: `${tint.fg}2E`, borderColor: `${tint.fg}55` },
                            ]}
                          >
                            <Text style={[styles.avatarText, { color: tint.fg }]}>
                              {initialsFor(item.name)}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: spacing.sm }}>
                            <Text style={styles.contactName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.contactPhone} numberOfLines={1}>
                              {item.phone}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.checkCircle,
                              (on || added) && styles.checkCircleOn,
                              added && !on && styles.checkCircleMuted,
                            ]}
                          >
                            {(on || added) && (
                              <Ionicons
                                name="checkmark"
                                size={scale(16)}
                                color={on && !added ? "#fff" : colors.textSecondary}
                              />
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              )}
              {accountsLoading ? (
                <View style={styles.pickerStateWrap}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : otherItems.length === 0 ? (
                <View style={styles.pickerStateWrap}>
                  <Ionicons
                    name="people-outline"
                    size={scale(36)}
                    color={colors.textMuted}
                  />
                  <Text style={styles.pickerStateText}>
                    {accountsError
                      ? "Could not load accounts. You can still add a contact above."
                      : "No other accounts available. Add a contact above."}
                  </Text>
                  {accountsError && (
                    <Pressable onPress={openPicker} style={styles.pickerRetry}>
                      <Text style={styles.pickerRetryText}>Try again</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
                  <Text style={styles.pickerSectionLabel}>Other accounts</Text>
                  {accountsError && (
                    <Text style={styles.pickerWarning}>
                      Could not load GTWorld accounts. Only your added contacts are shown.
                    </Text>
                  )}
                  {otherItems.map((item) => {
                    const tint = tintFor(item.key);
                    const added = isAdded(item);
                    const on = selected.includes(item.key);
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => toggleItem(item)}
                        disabled={added}
                        style={({ pressed }) => [
                          styles.pickRow,
                          added && styles.pickRowAdded,
                          !item.isGTUser && styles.pickRowExternal,
                          pressed && !added && { opacity: 0.7 },
                        ]}
                      >
                        <View
                          style={[
                            styles.avatar,
                            mode === "light"
                              ? { backgroundColor: tint.bg, borderColor: tint.border }
                              : { backgroundColor: `${tint.fg}2E`, borderColor: `${tint.fg}55` },
                          ]}
                        >
                          <Text style={[styles.avatarText, { color: tint.fg }]}>
                            {initialsFor(item.name)}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: spacing.sm }}>
                          <Text style={styles.pickName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.pickMeta} numberOfLines={1}>
                            {item.meta}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.checkCircle,
                            (on || added) && styles.checkCircleOn,
                            added && !on && styles.checkCircleMuted,
                          ]}
                        >
                          {(on || added) && (
                            <Ionicons
                              name="checkmark"
                              size={scale(16)}
                              color={on && !added ? "#fff" : colors.textSecondary}
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              )}
            </ScrollView>

            <View style={styles.pickerActions}>
              <Pressable
                onPress={() => setPickerOpen(false)}
                style={({ pressed }) => [
                  styles.pickerBtn,
                  styles.pickerBtnOutline,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.pickerBtnOutlineText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmAdd}
                disabled={selected.length === 0}
                style={({ pressed }) => [
                  styles.pickerBtn,
                  styles.pickerBtnPrimary,
                  selected.length === 0 && styles.pickerBtnDisabled,
                  pressed && selected.length > 0 && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.pickerBtnPrimaryText}>
                  Add{selected.length > 0 ? ` (${selected.length})` : ""}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    pickerRoot: { flex: 1, justifyContent: "flex-end" },
    pickerBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 16,
    },
    pickerHandle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    pickerTitle: {
      ...typography.bodyBold,
      fontSize: scale(19),
      lineHeight: scale(25),
      color: colors.textPrimary,
    },
    pickerSubtitle: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: spacing.md,
    },
    manualToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: GT_RADIUS,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: GT_ORANGE_BORDER,
      backgroundColor: colors.primaryLight,
      marginBottom: spacing.sm,
    },
    manualToggleText: {
      ...typography.smallBold,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: GT_ORANGE,
      flex: 1,
    },
    manualForm: {
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: GT_RADIUS,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: mode === "light" ? "#F7F8FB" : colors.background,
      marginBottom: spacing.sm,
    },
    manualInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: GT_RADIUS,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      ...typography.body,
      fontSize: scale(14),
      color: colors.textPrimary,
    },
    manualError: {
      ...typography.small,
      fontSize: scale(12),
      lineHeight: scale(16),
      color: colors.danger,
    },
    manualAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      height: scale(38),
      borderRadius: GT_RADIUS,
      backgroundColor: GT_ORANGE_LIGHT,
      borderWidth: 1,
      borderColor: GT_ORANGE_BORDER,
    },
    manualAddBtnText: {
      ...typography.smallBold,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: GT_ORANGE,
    },
    pickerScroll: { maxHeight: scale(330) },
    pickerSectionLabel: {
      ...typography.smallBold,
      fontSize: scale(12),
      lineHeight: scale(16),
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    contactCardSelected: {
      borderColor: GT_ORANGE_BORDER,
      backgroundColor: colors.primaryLight,
    },
    pickerWarning: {
      ...typography.small,
      fontSize: scale(12),
      lineHeight: scale(16),
      color: colors.danger,
      marginBottom: spacing.sm,
    },
    pickerStateWrap: {
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    pickerStateText: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    pickerRetry: {
      marginTop: spacing.xs,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
    },
    pickerRetryText: { ...typography.smallBold, color: GT_ORANGE },
    pickRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: GT_RADIUS,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    pickRowAdded: { opacity: 0.6 },
    pickRowExternal: { borderStyle: "dashed", borderColor: GT_ORANGE_BORDER },
    pickName: {
      ...typography.bodyBold,
      fontSize: scale(15),
      lineHeight: scale(20),
      color: colors.textPrimary,
    },
    pickMeta: {
      ...typography.small,
      fontSize: scale(13),
      lineHeight: scale(18),
      color: colors.textSecondary,
      marginTop: 2,
    },
    checkCircle: {
      width: scale(26),
      height: scale(26),
      borderRadius: scale(13),
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: spacing.sm,
    },
    checkCircleOn: { backgroundColor: GT_ORANGE, borderColor: GT_ORANGE },
    checkCircleMuted: { backgroundColor: colors.primaryLight },
    pickerActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
    pickerBtn: {
      flex: 1,
      height: scale(46),
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    pickerBtnOutline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    pickerBtnOutlineText: { ...typography.button, fontSize: scale(15), color: colors.textPrimary },
    pickerBtnPrimary: { backgroundColor: GT_ORANGE },
    pickerBtnPrimaryText: { ...typography.button, fontSize: scale(15), color: colors.white },
    pickerBtnDisabled: { opacity: 0.45 },
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