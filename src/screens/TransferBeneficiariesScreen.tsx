import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "../data/config";
import { Beneficiary } from "../data/types";
import { CURRENT_USER } from "../data/seed";
import { useAppStore } from "../state/AppStore";

// Soft tinted avatar palette (text / background / border), picked per name
const AVATAR_TONES = [
  { text: "#F2A21E", bg: "#FBF1E0", border: "#F6E3C2" }, // amber
  { text: "#2FC9A0", bg: "#E1F6F0", border: "#C4EBE1" }, // teal
  { text: "#35C759", bg: "#E3F6E8", border: "#C7EBD1" }, // green
  { text: "#9ACD1E", bg: "#EEF6DA", border: "#DDEBB8" }, // lime
  { text: "#E8344E", bg: "#FBE3E6", border: "#F4C6CC" }, // rose
  { text: "#4C8DF6", bg: "#E4EEFD", border: "#C9DCFA" }, // blue
];

function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function initialsOf(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function letterOf(fullName: string) {
  const first = fullName.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

type Row =
  | { type: "letter"; key: string; letter: string }
  | { type: "item"; key: string; item: Beneficiary };

export default function TransferBeneficiariesScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { currentUser } = useAppStore();
  const [query, setQuery] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myAccountNumber = currentUser?.accountNumber ?? CURRENT_USER.accountNumber;

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      const list: Beneficiary[] = Array.isArray(data) ? data : [];
      // The beneficiary list is every other account on the backend, never yourself.
      setBeneficiaries(list.filter((b) => b.accountNumber !== myAccountNumber));
    } catch (e) {
      setError("Could not load beneficiaries. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [myAccountNumber]);

  useFocusEffect(
    React.useCallback(() => {
      loadBeneficiaries();
    }, [loadBeneficiaries])
  );

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? beneficiaries.filter(
        (b) =>
          b.fullName.toLowerCase().includes(needle) || b.accountNumber.includes(needle)
      )
    : beneficiaries;

  // Presentation only: sort A-Z and insert a letter header before each group.
  const rows = useMemo<Row[]>(() => {
    const sorted = [...visible].sort((a, b) => a.fullName.localeCompare(b.fullName));
    const out: Row[] = [];
    let current = "";
    sorted.forEach((item) => {
      const letter = letterOf(item.fullName);
      if (letter !== current) {
        current = letter;
        out.push({ type: "letter", key: `letter-${letter}`, letter });
      }
      out.push({ type: "item", key: item.accountNumber, item });
    });
    return out;
  }, [visible]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.navigate("Home", { tab: "home" })}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={loading || error ? [] : rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Account transfer</Text>
            <Text style={styles.subtitle}>
              Enter the receiver's details to make an instant transfer.
            </Text>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={22} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Name or account number..."
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {!loading && !error && beneficiaries.length > 0 && (
              <Text style={styles.sectionTitle}>Your beneficiaries</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>{error}</Text>
              <Pressable onPress={loadBeneficiaries} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {needle ? "No beneficiary matches your search" : "No beneficiaries available"}
              </Text>
            </View>
          )
        }
        renderItem={({ item: row }) => {
          if (row.type === "letter") {
            return <Text style={styles.letter}>{row.letter}</Text>;
          }
          const item = row.item;
          const tone = toneFor(item.fullName);
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() =>
                navigation.navigate("TransferAmount", { beneficiary: item })
              }
            >
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: tone.bg, borderColor: tone.border },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: tone.text }]}>
                    {initialsOf(item.fullName)}
                  </Text>
                </View>
                <View style={styles.bankBadge}>
                  <Ionicons name="business" size={11} color={colors.primary} />
                </View>
              </View>

              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.fullName}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  GTBank • {item.accountNumber} • NGN
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },

    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

    title: {
      fontSize: 34,
      lineHeight: 42,
      fontWeight: "800",
      letterSpacing: -0.6,
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 26,
      color: colors.textPrimary,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md ?? 8,
      paddingHorizontal: spacing.md,
      height: 56,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      ...typography.body,
      fontSize: 17,
    },

    sectionTitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    letter: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    rowPressed: { opacity: 0.6 },
    rowText: { flex: 1 },
    rowName: { ...typography.bodyBold, fontSize: 17, color: colors.textPrimary },
    rowMeta: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

    avatarWrap: { width: 72, height: 72 },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 22, fontWeight: "400" },
    bankBadge: {
      position: "absolute",
      right: 0,
      bottom: 2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyWrap: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    retryButton: {
      marginTop: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.pill,
      backgroundColor: colors.primaryLight,
    },
    retryText: { ...typography.smallBold, color: colors.primary },
  });
}