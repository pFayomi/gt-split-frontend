import React from "react";
import { useFonts } from "expo-font";
import {
  Figtree_300Light,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black,
} from "@expo-google-fonts/figtree";
import { AppStoreProvider } from "./src/state/AppStore";
import { ThemeProvider } from "./src/theme/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  // Keys must match the family names in src/theme/theme.ts `fonts`
  const [fontsLoaded, fontError] = useFonts({
    Figtree_300Light,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });

  // Hold the first frame until the weights are ready so nothing renders in a fallback font
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <AppStoreProvider>
        <RootNavigator />
      </AppStoreProvider>
    </ThemeProvider>
  );
}