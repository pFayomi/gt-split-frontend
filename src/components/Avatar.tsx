import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/theme";

const PALETTE = ["#F15A22", "#2E7D32", "#6C4EE3", "#0E7C86", "#C2410C", "#B0459A"];

function hashToIndex(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash + input.charCodeAt(i)) % PALETTE.length;
  return hash;
}

export default function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  const bg = PALETTE[hashToIndex(initials)];
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: colors.white, fontWeight: "700" },
});