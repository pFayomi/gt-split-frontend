import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Split, Participant, Transaction, SplitType, Beneficiary } from "../data/types";
import { SEED_TRANSACTIONS, CURRENT_USER } from "../data/seed";
import { API_BASE_URL, TRANSFER_PIN } from "../data/config";
import { computeEqualSplit } from "../data/splitMaths";

const STORAGE_KEY = "gt-split:v1";

type CurrentUser = { id: string; accountNumber: string; fullName: string; phone?: string };

type PersistedState = {
  isAuthenticated: boolean;
  splits: Split[];
  transactions: Transaction[];
};

type CreateSplitInput = {
  title: string;
  totalAmount: number;
  splitType: SplitType;
  sourceAccountLabel: string;
  narration?: string | null;
  participants: { id: string; name: string; initials: string; phone: string; email?: string; isGTUser: boolean; customShare?: number }[];
};

type AppStoreValue = {
  ready: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  currentUser: CurrentUser | null;
  balance: number;
  refreshBalance: () => Promise<void>;
  login: (accountNumber: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginWithBiometrics: () => void;
  logout: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
  sendTransfer: (
    beneficiary: Beneficiary,
    amount: number,
    narration?: string
  ) => Promise<{ success: boolean; error?: string }>;
  splits: Split[];
  transactions: Transaction[];
  createSplit: (input: CreateSplitInput) => Promise<Split>;
  markParticipantPaid: (splitId: string, participantId: string) => Promise<void>;
  cancelSplit: (splitId: string) => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function mapServerTransactions(txData: any[]): Transaction[] {
  return txData.map((t: any) => ({
    id: t.id,
    kind: t.kind,
    title: t.title,
    subtitle: t.subtitle,
    amount: Number(t.amount),
    direction: t.direction,
    date: new Date(t.createdAt).toLocaleDateString(),
    splitId: t.splitId,
    narration: t.narration ?? null,
  }));
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: PersistedState = JSON.parse(raw);
          setIsAuthenticated(parsed.isAuthenticated ?? false);
          setSplits(parsed.splits ?? []);
          setTransactions(parsed.transactions?.length ? parsed.transactions : SEED_TRANSACTIONS);
        }
      } catch (e) {
        // ignore corrupt storage, start fresh
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const state: PersistedState = { isAuthenticated, splits, transactions };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [ready, isAuthenticated, splits, transactions]);

  const login = useCallback(async (accountNumber: string, pin: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, pin }),
      });

      if (!response.ok) {
        return { success: false, error: "Invalid account number or PIN" };
      }

      const data = await response.json();
      setAuthToken(data.accessToken);
      setCurrentUser(data.user);
      setIsAuthenticated(true);

      try {
        const balanceRes = await fetch(`${API_BASE_URL}/transactions/balance/${data.user.accountNumber}`);
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance);

        const txRes = await fetch(`${API_BASE_URL}/transactions/account/${data.user.accountNumber}`);
        const txData = await txRes.json();
        if (txData.length > 0) {
          setTransactions(mapServerTransactions(txData));
        }
      } catch (e) {
        // balance/transactions fetch failed, keep defaults
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Could not reach the server. Check your connection." };
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthToken(null);
    setCurrentUser(null);
  }, []);

  const loginWithBiometrics = useCallback(() => setIsAuthenticated(true), []);

  /**
   * Confirms a transfer with the 4-digit transfer PIN. This is not the login PIN:
   * /auth/login validates the 6-digit login PIN, so a 4-digit transfer PIN sent
   * there could never succeed. Login itself is unchanged.
   */
  const verifyPin = useCallback(async (pin: string) => {
    if (!currentUser) return false;
    return pin === TRANSFER_PIN;
  }, [currentUser]);

  const refreshBalance = useCallback(async () => {
    if (!currentUser) return;
    try {
      const balanceRes = await fetch(`${API_BASE_URL}/transactions/balance/${currentUser.accountNumber}`);
      const balanceData = await balanceRes.json();
      setBalance(balanceData.balance);

      const txRes = await fetch(`${API_BASE_URL}/transactions/account/${currentUser.accountNumber}`);
      const txData = await txRes.json();
      setTransactions(mapServerTransactions(txData));
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  /**
   * Moves money from the signed-in account to a beneficiary: debit the sender,
   * credit the receiver, then reload the sender's balance and history so the
   * home screen reflects the new figures straight away. The optional narration
   * is the sender's note and is stored on both sides of the transfer.
   */
  const sendTransfer = useCallback(
    async (beneficiary: Beneficiary, amount: number, narration?: string) => {
      if (!currentUser) return { success: false, error: "You are not signed in" };
      const note = narration?.trim() || undefined;
      try {
        const debitRes = await fetch(`${API_BASE_URL}/transactions/debit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber: currentUser.accountNumber,
            amount,
            kind: "transfer",
            title: `Transfer to ${beneficiary.fullName}`,
            subtitle: `To ${beneficiary.accountNumber}`,
            narration: note,
          }),
        });

        if (!debitRes.ok) {
          const failure = await debitRes.json().catch(() => null);
          return { success: false, error: failure?.message ?? "Transfer failed. Check your balance." };
        }

        await fetch(`${API_BASE_URL}/transactions/credit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber: beneficiary.accountNumber,
            amount,
            kind: "transfer",
            title: `Transfer from ${currentUser.fullName}`,
            subtitle: `From ${currentUser.accountNumber}`,
            narration: note,
          }),
        });

        await refreshBalance();
        return { success: true };
      } catch (err) {
        return { success: false, error: "Could not reach the server." };
      }
    },
    [currentUser, refreshBalance]
  );

  const createSplit = useCallback(async (input: CreateSplitInput) => {
    const hostShare =
      input.splitType === "equal"
        ? computeEqualSplit(input.totalAmount, input.participants.length).hostShare
        : input.totalAmount - input.participants.reduce((sum, p) => sum + (p.customShare ?? 0), 0);

    const response = await fetch(`${API_BASE_URL}/splits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        totalAmount: input.totalAmount,
        hostAccountNumber: currentUser?.accountNumber ?? CURRENT_USER.accountNumber,
        hostName: currentUser?.fullName ?? CURRENT_USER.name,
        splitType: input.splitType,
        sourceAccountLabel: input.sourceAccountLabel,
        narration: input.narration ?? null,
        participants: input.participants.map((p) => ({
          name: p.name,
          initials: p.initials,
          phone: p.phone,
          email: p.email,
          isGTUser: p.isGTUser,
          customShare: p.customShare,
        })),
      }),
    });

    const serverSplit = await response.json();

    const split: Split = {
      id: serverSplit.id,
      title: serverSplit.title,
      totalAmount: Number(serverSplit.totalAmount),
      createdAt: serverSplit.createdAt,
      hostId: CURRENT_USER.id,
      splitType: serverSplit.splitType,
      sourceAccountLabel: serverSplit.sourceAccountLabel,
      participants: serverSplit.participants.map((p: any) => ({
        ...p,
        share: Number(p.share),
      })),
      status: serverSplit.status,
    };

    const tx: Transaction = {
      id: uid("tx"),
      kind: "billsplit",
      title: `For ${input.title} split`,
      subtitle: "Split",
      amount: hostShare,
      direction: "out",
      date: "Today",
      splitId: split.id,
    };

    setSplits((prev) => [split, ...prev]);
    setTransactions((prev) => [tx, ...prev]);
    return split;
  }, [currentUser]);

  const markParticipantPaid = useCallback(async (splitId: string, participantId: string) => {
    const response = await fetch(
      `${API_BASE_URL}/splits/${splitId}/participants/${participantId}/toggle`,
      { method: "PATCH" }
    );
    const updatedSplit = await response.json();

    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? {
              ...s,
              status: updatedSplit.status,
              participants: updatedSplit.participants.map((p: any) => ({
                ...p,
                share: Number(p.share),
              })),
            }
          : s
      )
    );
  }, []);

  const cancelSplit = useCallback((splitId: string) => {
    setSplits((prev) => prev.map((s) => (s.id === splitId ? { ...s, status: "cancelled" } : s)));
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      ready,
      isAuthenticated,
      authToken,
      currentUser,
      balance,
      refreshBalance,
      login,
      loginWithBiometrics,
      logout,
      verifyPin,
      sendTransfer,
      splits,
      transactions,
      createSplit,
      markParticipantPaid,
      cancelSplit,
    }),
    [ready, isAuthenticated, authToken, currentUser, balance, refreshBalance, splits, transactions, login, loginWithBiometrics, logout, verifyPin, sendTransfer, createSplit, markParticipantPaid, cancelSplit]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}