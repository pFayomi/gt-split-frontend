import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, TextInput } from "react-native";
import { spacing, typography, radii, shadow } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CURRENT_USER } from "../data/seed";
import { useAppStore } from "../state/AppStore";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import * as Contacts from "expo-contacts/legacy";

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
  const { colors } = useTheme();
  const styles = getStyles(colors);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Create Split</Text>
        <Text style={styles.subtitle}>Split shared expenses with friends, family & colleagues</Text>

        <View style={styles.sourceCard}>
          <Text style={styles.sourceAccountNumber}>{currentUser?.accountNumber ?? CURRENT_USER.accountNumber}</Text>
          <Text style={styles.sourceAccountLabel}>{CURRENT_USER.accountLabel}</Text>
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
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.browseLink}>Add participant</Text>
          </Pressable>
        </View>

        {participants.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No participants selected</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add participant" to pick someone from your contacts
            </Text>
          </View>
        ) : (
          participants.map((p) => (
            <View key={p.id} style={styles.contactCard}>
              <View style={styles.contactRow}>
                <Avatar initials={p.initials} size={36} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.contactName}>{p.name}</Text>
                  <Text style={styles.contactPhone}>{p.phone}</Text>
                </View>
                <Pressable onPress={() => removeParticipant(p.id)} style={styles.removeButton}>
                  <Ionicons name="close" size={16} color={colors.danger} />
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
          ))
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
        <Button label="Proceed" onPress={handleProceed} disabled={!canProceed} />
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    headerIcon: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight,
      alignItems: "center", justifyContent: "center",
    },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.small, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
    sourceCard: {
      backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md,
      borderWidth: 1, borderColor: colors.border, ...shadow, marginBottom: spacing.lg,
    },
    sourceAccountNumber: { ...typography.h3, color: colors.textPrimary },
    sourceAccountLabel: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
    label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.sm },
    contactHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
    addButton: { flexDirection: "row", alignItems: "center", gap: 2 },
    browseLink: { color: colors.primary, ...typography.smallBold },
    input: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
      padding: spacing.md, ...typography.body, color: colors.textPrimary, marginBottom: spacing.lg,
    },
    contactCard: {
      backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.sm,
      marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    contactRow: {
      flexDirection: "row", alignItems: "center", marginBottom: spacing.xs,
    },
    emailInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm,
      padding: 8, ...typography.small, color: colors.textPrimary,
    },
    contactName: { ...typography.bodyBold, color: colors.textPrimary },
    contactPhone: { ...typography.small, color: colors.textSecondary },
    removeButton: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dangerLight,
      alignItems: "center", justifyContent: "center",
    },
    emptyState: {
      alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl,
      backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
      borderStyle: "dashed",
    },
    emptyIcon: {
      width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background,
      alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
    },
    emptyTitle: { ...typography.bodyBold, color: colors.textPrimary },
    emptySubtitle: { ...typography.small, color: colors.textSecondary, marginTop: 4, textAlign: "center", paddingHorizontal: spacing.lg },
    hint: { ...typography.small, color: colors.danger, textAlign: "center", marginTop: spacing.sm },
    footer: {
      padding: spacing.lg, backgroundColor: colors.card,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
  });
}