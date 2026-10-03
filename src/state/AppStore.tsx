import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Split, Participant, Transaction, SplitType } from "../data/types";
import { SEED_TRANSACTIONS, CURRENT_USER } from "../data/seed";
import { API_BASE_URL } from "../data/config";
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
      splits,
      transactions,
      createSplit,
      markParticipantPaid,
      cancelSplit,
    }),
    [ready, isAuthenticated, authToken, currentUser, balance, refreshBalance, splits, transactions, login, loginWithBiometrics, logout, createSplit, markParticipantPaid, cancelSplit]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}