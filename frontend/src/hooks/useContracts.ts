"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { contractAddresses, InsurancePoolABI, PolicyManagerABI } from "@/lib/wagmi";
import { useWalletStore } from "@/lib/store";

// Hook for pool operations
export function useInsurancePool(chainId: number = 114) {
  const addresses = contractAddresses[chainId as keyof typeof contractAddresses];
  const { addRecentTx, updateTxStatus } = useWalletStore();

  const { data: poolStats, refetch: refetchPoolStats } = useReadContract({
    address: addresses?.insurancePool as `0x${string}`,
    abi: InsurancePoolABI,
    functionName: "getPoolStats",
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: string) => {
    const amountWei = parseEther(amount);
    writeContract({
      address: addresses?.insurancePool as `0x${string}`,
      abi: InsurancePoolABI,
      functionName: "deposit",
      args: [amountWei],
    });
    
    if (hash) {
      addRecentTx({
        hash,
        type: "deposit",
        status: "pending",
        timestamp: Date.now(),
      });
    }
  };

  const withdraw = async (shares: string) => {
    const sharesWei = parseEther(shares);
    writeContract({
      address: addresses?.insurancePool as `0x${string}`,
      abi: InsurancePoolABI,
      functionName: "withdraw",
      args: [sharesWei],
    });
    
    if (hash) {
      addRecentTx({
        hash,
        type: "withdraw",
        status: "pending",
        timestamp: Date.now(),
      });
    }
  };

  return {
    poolStats,
    deposit,
    withdraw,
    isPending,
    isConfirming,
    isSuccess,
    refetchPoolStats,
  };
}

// Hook for policy operations
export function usePolicyManager(chainId: number = 114) {
  const addresses = contractAddresses[chainId as keyof typeof contractAddresses];
  const { addRecentTx } = useWalletStore();

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createPolicy = async (params: {
    flightNumber: string;
    departureTime: number;
    arrivalTime: number;
    coverageAmount: bigint;
    delay1hPayout: number;
    delay2hPayout: number;
    delay4hPayout: number;
    cancellationPayout: number;
    premium: bigint;
    aiRiskScore: number;
  }) => {
    writeContract({
      address: addresses?.policyManager as `0x${string}`,
      abi: PolicyManagerABI,
      functionName: "createPolicy",
      args: [
        {
          flightNumber: params.flightNumber,
          departureTime: BigInt(params.departureTime),
          arrivalTime: BigInt(params.arrivalTime),
          coverageAmount: params.coverageAmount,
          delay1hPayout: params.delay1hPayout,
          delay2hPayout: params.delay2hPayout,
          delay4hPayout: params.delay4hPayout,
          cancellationPayout: params.cancellationPayout,
        },
        params.premium,
        params.aiRiskScore,
      ],
    });

    if (hash) {
      addRecentTx({
        hash,
        type: "createPolicy",
        status: "pending",
        timestamp: Date.now(),
      });
    }
  };

  return {
    createPolicy,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

// Hook for reading user policies
export function useUserPolicies(userAddress: `0x${string}` | undefined, chainId: number = 114) {
  const addresses = contractAddresses[chainId as keyof typeof contractAddresses];

  const { data: policyIds, refetch } = useReadContract({
    address: addresses?.policyManager as `0x${string}`,
    abi: PolicyManagerABI,
    functionName: "getUserPolicies",
    args: userAddress ? [userAddress] : undefined,
  });

  return {
    policyIds,
    refetch,
  };
}

// Hook for LP info
export function useLPInfo(lpAddress: `0x${string}` | undefined, chainId: number = 114) {
  const addresses = contractAddresses[chainId as keyof typeof contractAddresses];

  const { data: lpInfo, refetch } = useReadContract({
    address: addresses?.insurancePool as `0x${string}`,
    abi: InsurancePoolABI,
    functionName: "getLPInfo",
    args: lpAddress ? [lpAddress] : undefined,
  });

  return {
    lpInfo: lpInfo ? {
      depositAmount: formatEther(lpInfo[0]),
      shareBalance: formatEther(lpInfo[1]),
      currentValue: formatEther(lpInfo[2]),
      earnedYield: formatEther(lpInfo[3]),
      claimableYield: formatEther(lpInfo[4]),
    } : null,
    refetch,
  };
}
