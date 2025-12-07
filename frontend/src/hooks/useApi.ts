"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, Policy, Claim, PoolStats, AIRiskAssessment } from "@/lib/api";

// Hook for fetching user's policies
export function usePolicies() {
  return useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const response = await apiClient.get<Policy[]>("/policies/my-policies");
      return response.data;
    },
  });
}

// Hook for fetching a single policy
export function usePolicy(policyId: string) {
  return useQuery({
    queryKey: ["policy", policyId],
    queryFn: async () => {
      const response = await apiClient.get<Policy>(`/policies/${policyId}`);
      return response.data;
    },
    enabled: !!policyId,
  });
}

// Hook for creating a policy
export function useCreatePolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (policyData: {
      flightNumber: string;
      departureAirport: string;
      arrivalAirport: string;
      departureTime: string;
      coverageAmount: number;
      payoutTiers: { delay1h: number; delay2h: number; delay4h: number; cancellation: number };
    }) => {
      const response = await apiClient.post<Policy>("/policies", policyData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}

// Hook for AI risk assessment
export function useRiskAssessment() {
  return useMutation({
    mutationFn: async (flightData: {
      airline: string;
      flightNumber: string;
      date: string;
      origin: string;
      destination: string;
    }) => {
      const response = await apiClient.post<AIRiskAssessment>("/ai/predict-delay", flightData);
      return response.data;
    },
  });
}

// Hook for pool stats
export function usePoolStats() {
  return useQuery({
    queryKey: ["poolStats"],
    queryFn: async () => {
      const response = await apiClient.get<PoolStats>("/pool/stats");
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook for user's claims
export function useClaims() {
  return useQuery({
    queryKey: ["claims"],
    queryFn: async () => {
      const response = await apiClient.get<Claim[]>("/claims/my-claims");
      return response.data;
    },
  });
}

// Hook for filing a claim
export function useFileClaim() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { policyId: string; reason: string }) => {
      const response = await apiClient.post<Claim>("/claims", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}

// Hook for LP position
export function useLPPosition() {
  return useQuery({
    queryKey: ["lpPosition"],
    queryFn: async () => {
      const response = await apiClient.get("/pool/my-position");
      return response.data;
    },
  });
}

// Hook for depositing to pool
export function useDeposit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiClient.post("/pool/deposit", { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lpPosition"] });
      queryClient.invalidateQueries({ queryKey: ["poolStats"] });
    },
  });
}

// Hook for withdrawing from pool
export function useWithdraw() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shares: number) => {
      const response = await apiClient.post("/pool/withdraw", { shares });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lpPosition"] });
      queryClient.invalidateQueries({ queryKey: ["poolStats"] });
    },
  });
}

// Hook for FTSO price feeds
export function usePriceFeeds() {
  return useQuery({
    queryKey: ["priceFeeds"],
    queryFn: async () => {
      const response = await apiClient.get("/ftso/prices");
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for flight search
export function useFlightSearch() {
  return useMutation({
    mutationFn: async (query: { flightNumber: string; date: string }) => {
      const response = await apiClient.get(`/flights/search`, { params: query });
      return response.data;
    },
  });
}
