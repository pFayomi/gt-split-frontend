import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { spacing, typography, radii } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const SERVICES = [
  { icon: "airplane-outline", label: "Buy airtime", route: null },
  { icon: "wifi-outline", label: "Buy data", route: null },
  { icon: "receipt-outline", label: "Split Bills", route: "CreateSplit", highlight: true },
  { icon: "paper-plane-outline", label: "Airlines, Travels & Transportation", route: null },
  { icon: "play-circle-outline", label: "Cable TV", route: null },
  { icon: "trending-up-outline", label: "Capital Market & Investments", route: null },
  { icon: "lock-closed-outline", label: "Distributors & Agent Payments", route: null },
  { icon: "water-outline", label: "Electricity & Water", route: null },
  { icon: "gift-outline", label: "Entertainment & E-Vouchers", route: null },
  { icon: "home-outline", label: "Estate & Associations", route: null },
  { icon: "business-outline", label: "Financial Institutions", route: null },
  { icon: "document-text-outline", label: "Government Taxes and Levies", route: null },
];

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {SERVICES.map((service) => (
          <Pressable
            key={service.label}
            style={styles.row}
            onPress={() => {
              if (service.route) navigation.navigate(service.route);
            }}
          >
            <View
              style={[
                styles.iconWrap,
                service.highlight && { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name={service.icon as any}
                size={20}
                color={service.highlight ? colors.white : colors.primary}
              />
            </View>
            <Text style={styles.label}>{service.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      padding: spacing.lg, backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { ...typography.h3, color: colors.textPrimary },
    scrollContent: { padding: spacing.lg },
    row: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
      borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border,
    },
    iconWrap: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight,
      alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
    },
    label: { flex: 1, ...typography.bodyBold, color: colors.textPrimary },
  });
}