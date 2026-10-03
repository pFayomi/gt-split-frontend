import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

type Service = {
  icon: string;
  family?: "material";
  label: string;
  route: string | null;
  bg: string;   // pastel circle background
  tint: string; // icon colour (also used for the soft ring)
};

const SERVICES: Service[] = [
  { icon: "signal-cellular-4-bar", family: "material", label: "Buy airtime", route: null, bg: "#EEE8FD", tint: "#A855F7" },
  { icon: "wifi", label: "Buy data", route: null, bg: "#E3EAFD", tint: "#2563EB" },
  { icon: "receipt", label: "Split Bills", route: "CreateSplit", bg: "#FDE9E5", tint: "#F0523A" },
  { icon: "airplane", label: "Airlines, Travels & Transportation/Logistics", route: null, bg: "#E1F2FD", tint: "#1D9BF0" },
  { icon: "tv", label: "Cable TV", route: null, bg: "#D5F5EE", tint: "#14D8C8" },
  { icon: "analytics", family: "material", label: "Capital Market & Investments", route: null, bg: "#FDEFD6", tint: "#F59E0B" },
  { icon: "clipboard", label: "Distributors & Agent Payments", route: null, bg: "#FDE2EA", tint: "#EC4899" },
  { icon: "water", label: "Electricity & Water", route: null, bg: "#DCEBFB", tint: "#0EA5E9" },
  { icon: "ticket", label: "Entertainment & E-Vouchers", route: null, bg: "#EEF8C9", tint: "#84CC16" },
  { icon: "home-work", family: "material", label: "Estate & Associations", route: null, bg: "#E3EAFD", tint: "#2563EB" },
  { icon: "account-balance", family: "material", label: "Financial Institutions", route: null, bg: "#EEE8FD", tint: "#A855F7" },
  // Extras not in the screenshot, restyled to match the same pastel-circle look
  { icon: "document-text", label: "Government Taxes and Levies", route: null, bg: "#FDE3E1", tint: "#EF4444" },

];

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* No back arrow: the floating nav bar is the way in and out of this screen. */}
        <Text style={styles.title}>Payments</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SERVICES.map((service) => {
          const IconComp: any = service.family === "material" ? MaterialIcons : Ionicons;
          return (
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
                  { backgroundColor: service.bg, borderColor: service.tint + "33" },
                ]}
              >
                <IconComp name={service.icon} size={22} color={service.tint} />
              </View>
              <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                {service.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 36,
      paddingBottom: 12,
    },
    title: {
      ...typography.screenTitle,
      fontSize: 32,
      lineHeight: 38,
      color: colors.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 120, // clears the floating bottom tab bar
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16, // 48 circle + 16 gap = 64 row pitch, as in the screenshot
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    label: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      marginRight: 8,
    },
  });
}