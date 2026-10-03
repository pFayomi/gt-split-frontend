import React, { useEffect, useState } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import HomeScreen from "./HomeScreen";
import PaymentsScreen from "./PaymentsScreen";
import BottomNavBar from "../components/BottomNavBar";

type Tab = "home" | "payments";

/**
 * Shell that hosts the two bottom-nav tabs.
 *
 * Both screens stay mounted and are toggled with opacity + pointerEvents, so
 * switching tabs is an instant repaint: no push/pop animation, the nav bar never
 * re-mounts, and each tab keeps its scroll position.
 */
export default function MainScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const [tab, setTab] = useState<Tab>("home");

  // Screens that finish a flow navigate here with an explicit tab; plain back
  // navigation carries no param, so the tab the user left is preserved
  // (e.g. Payments -> Split Bills -> back returns to Payments).
  const requestedTab: Tab | undefined = route.params?.tab;
  useEffect(() => {
    if (requestedTab) setTab(requestedTab);
  }, [requestedTab]);

  // Android hardware back returns to the Home tab first instead of closing the app.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tab !== "home") {
        setTab("home");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Home tab — always mounted */}
      <View
        style={[styles.pane, tab === "home" ? styles.paneOn : styles.paneOff]}
        accessibilityElementsHidden={tab !== "home"}
        importantForAccessibility={tab === "home" ? "auto" : "no-hide-descendants"}
      >
        <HomeScreen />
      </View>

      {/* Payments tab — always mounted */}
      <View
        style={[styles.pane, tab === "payments" ? styles.paneOn : styles.paneOff]}
        accessibilityElementsHidden={tab !== "payments"}
        importantForAccessibility={tab === "payments" ? "auto" : "no-hide-descendants"}
      >
        <PaymentsScreen />
      </View>

      {/* ================= NAV BAR START ================= */}
      <BottomNavBar
        active={tab}
        onHome={() => setTab("home")}
        onPayments={() => setTab("payments")}
      />
      {/* ================== NAV BAR END ================== */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pane: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  paneOn: { opacity: 1, pointerEvents: "auto" },
  paneOff: { opacity: 0, pointerEvents: "none" },
});