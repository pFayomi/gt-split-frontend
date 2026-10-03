import { type TextStyle } from "react-native";

/**
 * Figtree — geometric-humanist with softly rounded letterforms: the clean,
 * friendly-but-premium fintech look. Loaded in App.tsx.
 *
 * A bundled font needs its exact family name per weight (React Native ignores
 * fontWeight for bundled families on Android), so weights are carried by
 * `fontFamily` and `fontWeight` is kept alongside for iOS/web.
 */
export const fonts = {
  light: "Figtree_300Light",
  regular: "Figtree_400Regular",
  medium: "Figtree_500Medium",
  semibold: "Figtree_600SemiBold",
  bold: "Figtree_700Bold",
  extrabold: "Figtree_800ExtraBold",
  black: "Figtree_900Black",
};

export type FontWeightToken = "300" | "400" | "500" | "600" | "700" | "800" | "900";

const FAMILY_BY_WEIGHT: Record<FontWeightToken, string> = {
  "300": fonts.light,
  "400": fonts.regular,
  "500": fonts.medium,
  "600": fonts.semibold,
  "700": fonts.bold,
  "800": fonts.extrabold,
  "900": fonts.black,
};

/** Pair a weight with its family so bolding works on every platform. */
export const fw = (weight: FontWeightToken): TextStyle => ({
  fontFamily: FAMILY_BY_WEIGHT[weight],
  fontWeight: weight,
});

export const lightColors = {
  primary: "#F15A22",
  primaryDark: "#D8481A",
  primaryLight: "#FDEAE1",
  background: "#F7F7F8",
  card: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textMuted: "#9A9A9A",
  border: "#ECECEC",
  success: "#1E9E52",
  successLight: "#E6F6EC",
  pending: "#E8A020",
  pendingLight: "#FDF3E1",
  danger: "#E5484D",
  dangerLight: "#FBE7E7",
  white: "#FFFFFF",
  black: "#000000",
};

export const darkColors = {
  primary: "#F15A22",
  primaryDark: "#FF7A45",
  primaryLight: "#3A2A20",
  background: "#121212",
  card: "#1E1E1E",
  textPrimary: "#F2F2F2",
  textSecondary: "#B0B0B0",
  textMuted: "#7A7A7A",
  border: "#2E2E2E",
  success: "#3FCB7C",
  successLight: "#1E3A2A",
  pending: "#F5B84D",
  pendingLight: "#3D3221",
  danger: "#F17070",
  dangerLight: "#3D2323",
  white: "#FFFFFF",
  black: "#000000",
};

// Kept for any file still importing `colors` directly during migration.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

/**
 * Type scale. Hierarchy comes from weight + size, not decoration:
 * extrabold/bold for headings and section titles, semibold/medium for buttons,
 * nav labels and account names, regular for supporting copy.
 */
export const typography = {
  /** Hero numbers, e.g. the account balance */
  display: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  /** Screen titles, e.g. "Payments" */
  screenTitle: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  /** Section titles, e.g. "Shortcuts", "Transaction history", "Investments" */
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, letterSpacing: -0.05 },
  bodyBold: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  smallMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, letterSpacing: -0.05 },
  smallBold: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  labelBold: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  /** Buttons and tappable pills */
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
  buttonLarge: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
};

export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};