import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shadow, typography, fw } from "../theme/theme";
import { useTheme } from "../theme/ThemeContext";

const ORANGE = "#F4511E";

export type NavTab = "home" | "payments";

type Props = {
  /** which tab is currently highlighted */
  active: NavTab;
  onHome: () => void;
  onPayments: () => void;
};

/** Floating frosted tab bar (white glass in light mode, smoked glass in dark mode) */
export default function BottomNavBar({ active, onHome, onPayments }: Props) {
  const { colors, mode } = useTheme();
  const styles = getStyles(colors);

  const barBg = mode === "light" ? "rgba(255,255,255,0.80)" : "rgba(40,40,46,0.85)";
  const barBorder = mode === "light" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.14)";
  const tabActiveBg = mode === "light" ? "rgba(20,20,40,0.07)" : "rgba(255,255,255,0.12)";

  return (
    <View style={[styles.bottomBar, { backgroundColor: barBg, borderColor: barBorder }]}>
      <BottomTab
        icon="home"
        label="Home"
        active={active === "home"}
        activeBg={tabActiveBg}
        onPress={onHome}
        colors={colors}
      />
      <BottomTab
        icon="cube"
        label="Products"
        activeBg={tabActiveBg}
        onPress={() => {}}
        colors={colors}
      />
      <BottomTab
        icon="transfer"
        label="Transfers"
        activeBg={tabActiveBg}
        onPress={() => {}}
        colors={colors}
      />
      <BottomTab
        icon="payments"
        label="Payments"
        active={active === "payments"}
        activeBg={tabActiveBg}
        onPress={onPayments}
        colors={colors}
      />
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

function BottomTab({
  icon,
  label,
  active,
  activeBg,
  onPress,
  colors,
}: {
  icon: string;
  label: string;
  active?: boolean;
  activeBg: string;
  onPress: () => void;
  colors: any;
}) {
  const styles = getStyles(colors);
  const tint = active ? ORANGE : colors.textPrimary;
  return (
    <Pressable
      style={[styles.bottomTab, active && { backgroundColor: activeBg }]}
      onPress={onPress}
    >
      <View style={styles.tabIconBox}>
        {icon === "transfer" ? (
          <View style={[styles.transferGlyph, { backgroundColor: tint }]}>
            <DoubleChevron size={12} color={colors.card} />
          </View>
        ) : icon === "payments" ? (
          <View style={[styles.paymentsGlyph, { backgroundColor: tint }]}>
            <View style={[styles.paymentsDot, { backgroundColor: colors.card }]} />
          </View>
        ) : (
          <Ionicons name={icon as any} size={26} color={tint} />
        )}
      </View>
      <Text style={[styles.bottomTabLabel, { color: tint }, active && fw("600")]}>
        {label}
      </Text>
    </Pressable>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    // ================= NAV BAR STYLES START =================
    // floating nav bar
    bottomBar: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: Platform.OS === "ios" ? 22 : 14,
      flexDirection: "row",
      alignItems: "center",
      padding: 5,
      borderRadius: 38,
      borderWidth: 2,
      ...shadow,
    },
    bottomTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 30,
    },
    tabIconBox: { height: 28, alignItems: "center", justifyContent: "center", marginBottom: 3 },
    bottomTabLabel: { ...typography.label },
    transferGlyph: {
      width: 26, height: 26, borderRadius: 13,
      alignItems: "center", justifyContent: "center",
    },
    paymentsGlyph: {
      width: 30, height: 22, borderRadius: 3,
      alignItems: "center", justifyContent: "center",
    },
    paymentsDot: { width: 10, height: 10, borderRadius: 5 },
    // ================== NAV BAR STYLES END ==================
  });
}