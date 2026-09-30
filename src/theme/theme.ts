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

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyBold: { fontSize: 15, fontWeight: "600" as const },
  small: { fontSize: 13, fontWeight: "400" as const },
  smallBold: { fontSize: 13, fontWeight: "600" as const },
  label: { fontSize: 12, fontWeight: "500" as const },
};

export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};