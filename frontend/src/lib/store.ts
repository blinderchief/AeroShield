"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// User preferences store
interface PreferencesState {
  theme: "dark" | "light" | "system";
  currency: "USD" | "EUR" | "GBP";
  notifications: {
    email: boolean;
    push: boolean;
    claims: boolean;
    marketing: boolean;
  };
  setTheme: (theme: "dark" | "light" | "system") => void;
  setCurrency: (currency: "USD" | "EUR" | "GBP") => void;
  setNotifications: (notifications: Partial<PreferencesState["notifications"]>) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "dark",
      currency: "USD",
      notifications: {
        email: true,
        push: true,
        claims: true,
        marketing: false,
      },
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setNotifications: (notifications) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notifications },
        })),
    }),
    {
      name: "aeroshield-preferences",
    }
  )
);

// Policy purchase flow store
interface PolicyFlowState {
  step: number;
  flightData: {
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
  } | null;
  aiAssessment: {
    riskScore: number;
    delayProbability: number;
    riskFactors: Array<{ name: string; score: number; impact: string }>;
    suggestedPremium: number;
    recommendations: string[];
  } | null;
  coverage: {
    amount: number;
    delay1h: number;
    delay2h: number;
    delay4h: number;
    cancellation: number;
    premium: number;
  } | null;
  setStep: (step: number) => void;
  setFlightData: (data: PolicyFlowState["flightData"]) => void;
  setAiAssessment: (data: PolicyFlowState["aiAssessment"]) => void;
  setCoverage: (data: PolicyFlowState["coverage"]) => void;
  reset: () => void;
}

export const usePolicyFlowStore = create<PolicyFlowState>((set) => ({
  step: 1,
  flightData: null,
  aiAssessment: null,
  coverage: null,
  setStep: (step) => set({ step }),
  setFlightData: (flightData) => set({ flightData }),
  setAiAssessment: (aiAssessment) => set({ aiAssessment }),
  setCoverage: (coverage) => set({ coverage }),
  reset: () =>
    set({
      step: 1,
      flightData: null,
      aiAssessment: null,
      coverage: null,
    }),
}));

// Wallet state store
interface WalletState {
  isConnecting: boolean;
  pendingTx: string | null;
  recentTxs: Array<{
    hash: string;
    type: string;
    status: "pending" | "confirmed" | "failed";
    timestamp: number;
  }>;
  setConnecting: (isConnecting: boolean) => void;
  setPendingTx: (hash: string | null) => void;
  addRecentTx: (tx: WalletState["recentTxs"][0]) => void;
  updateTxStatus: (hash: string, status: "pending" | "confirmed" | "failed") => void;
  clearRecentTxs: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isConnecting: false,
      pendingTx: null,
      recentTxs: [],
      setConnecting: (isConnecting) => set({ isConnecting }),
      setPendingTx: (pendingTx) => set({ pendingTx }),
      addRecentTx: (tx) =>
        set((state) => ({
          recentTxs: [tx, ...state.recentTxs.slice(0, 9)],
        })),
      updateTxStatus: (hash, status) =>
        set((state) => ({
          recentTxs: state.recentTxs.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
        })),
      clearRecentTxs: () => set({ recentTxs: [] }),
    }),
    {
      name: "aeroshield-wallet",
    }
  )
);

// UI state store
interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  activeModal: string | null;
  toasts: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message?: string;
  }>;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<UIState["toasts"][0], "id">) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  activeModal: null,
  toasts: [],
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
