import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../state/AppStore";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import CreateSplitScreen from "../screens/CreateSplitScreen";
import ChooseSplitTypeScreen from "../screens/ChooseSplitTypeScreen";
import SplitTrackingScreen from "../screens/SplitTrackingScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen";
import PaymentsScreen from "../screens/PaymentsScreen";
import TransferScreen from "../screens/TransferScreen";
import MyRequestsScreen from "../screens/MyRequestsScreen";
import MySplitsScreen from "../screens/MySplitsScreen";

export type RootStackParamList = {
  Home: undefined;
  CreateSplit: undefined;
  ChooseSplitType: { splitName: string; participants: any[] };
  SplitTracking: { splitId: string };
  TransactionDetail: { transaction: any };
  Payments: undefined;
  Transfer: { amount: number; roundedAmount: number; roundUpAccepted: boolean; splitTitle: string; splitId: string; hostAccountNumber: string; participantId: string };
  MyRequests: undefined;
  MySplits: undefined;
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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateSplit" component={CreateSplitScreen} />
        <Stack.Screen name="ChooseSplitType" component={ChooseSplitTypeScreen} />
        <Stack.Screen name="SplitTracking" component={SplitTrackingScreen} />
        <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        <Stack.Screen name="Payments" component={PaymentsScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
        <Stack.Screen name="MySplits" component={MySplitsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}