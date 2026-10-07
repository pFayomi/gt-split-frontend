import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../state/AppStore";
import { Beneficiary } from "../data/types";
import LoginScreen from "../screens/LoginScreen";
import MainScreen from "../screens/MainScreen";
import CreateSplitScreen from "../screens/CreateSplitScreen";
import ChooseSplitTypeScreen from "../screens/ChooseSplitTypeScreen";
import SplitTrackingScreen from "../screens/SplitTrackingScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen";
import TransferScreen from "../screens/TransferScreen";
import TransferBeneficiariesScreen from "../screens/TransferBeneficiariesScreen";
import TransferAmountScreen from "../screens/TransferAmountScreen";
import MyRequestsScreen from "../screens/MyRequestsScreen";
import MySplitsScreen from "../screens/MySplitsScreen";

export type RootStackParamList = {
  /**
   * Hosts the Home + Payments tabs (see MainScreen).
   * Pass `{ tab: "home" }` when a flow finishes and should land on the Home tab;
   * omit it (plain back navigation) to keep whichever tab the user left.
   */
  Home: { tab?: "home" | "payments" } | undefined;
  CreateSplit: { splitName?: string; totalAmount?: number; narration?: string | null } | undefined;
  ChooseSplitType: { splitName: string; participants: any[]; prefillAmount?: number; narration?: string | null };
  SplitTracking: { splitId: string };
  TransactionDetail: { transaction: any };
  Transfer: { amount: number; roundedAmount: number; roundUpAccepted: boolean; splitTitle: string; splitId: string; hostAccountNumber: string; participantId: string };
  MyRequests: undefined;
  MySplits: undefined;
  /** Picker for a free-form GT World transfer: every account holder but the signed-in one. */
  TransferBeneficiaries: undefined;
  /** Amount + PIN confirmation for the beneficiary picked above. */
  TransferAmount: { beneficiary: Beneficiary };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={MainScreen} />
        <Stack.Screen name="CreateSplit" component={CreateSplitScreen} />
        <Stack.Screen name="ChooseSplitType" component={ChooseSplitTypeScreen} />
        <Stack.Screen name="SplitTracking" component={SplitTrackingScreen} />
        <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
        <Stack.Screen name="MySplits" component={MySplitsScreen} />
        <Stack.Screen name="TransferBeneficiaries" component={TransferBeneficiariesScreen} />
        <Stack.Screen name="TransferAmount" component={TransferAmountScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}