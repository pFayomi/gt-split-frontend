import React from "react";
import { AppStoreProvider } from "./src/state/AppStore";
import { ThemeProvider } from "./src/theme/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <ThemeProvider>
      <AppStoreProvider>
        <RootNavigator />
      </AppStoreProvider>
    </ThemeProvider>
  );
}