"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Wallet,
  Copy,
  ExternalLink,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  QrCode,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletPage() {
  const { user } = useUser();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Mock transaction history
  const transactions = [
    {
      id: "1",
      type: "premium",
      description: "Policy Premium - 6E-542",
      amount: "-65.00",
      currency: "USDC",
      date: "2024-12-06",
      status: "completed",
    },
    {
      id: "2",
      type: "payout",
      description: "Claim Payout - AI-302",
      amount: "+2,500.00",
      currency: "USDC",
      date: "2024-12-05",
      status: "completed",
    },
    {
      id: "3",
      type: "deposit",
      description: "Wallet Deposit",
      amount: "+500.00",
      currency: "USDC",
      date: "2024-12-04",
      status: "completed",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet</h1>
          <p className="text-gray-400 mt-1">
            Manage your connected wallet and transactions
          </p>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass p-6"
      >
        {!isConnected ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Connect your wallet to view balances, make payments, and receive
              claim payouts directly to your account.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Wallet Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-white">
                      {truncateAddress(address!)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://coston2-explorer.flare.network/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-400">
                      Connected to Flare Coston2
                    </span>
                  </div>
                </div>
              </div>
              <ConnectButton />
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Native Balance</div>
                <div className="text-xl font-bold text-white">
                  {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0.0000 C2FLR"}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">USDC Balance</div>
                <div className="text-xl font-bold text-white">$0.00</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Total Claims Received</div>
                <div className="text-xl font-bold text-aeroshield-success">$0.00</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition">
                <Plus className="w-4 h-4" />
                <span>Add Funds</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition">
                <QrCode className="w-4 h-4" />
                <span>Receive</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition">
                <ArrowUpRight className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-glass p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <button className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 transition"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "payout" || tx.type === "deposit"
                        ? "bg-green-500/20"
                        : "bg-red-500/20"
                    }`}
                  >
                    {tx.type === "payout" || tx.type === "deposit" ? (
                      <ArrowDownLeft
                        className={`w-5 h-5 ${
                          tx.type === "payout" || tx.type === "deposit"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{tx.description}</div>
                    <div className="text-sm text-gray-400">{tx.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      tx.amount.startsWith("+")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {tx.amount} {tx.currency}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Flare Network Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-glass p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Network Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Network</div>
            <div className="text-white font-medium">Flare Coston2 Testnet</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Chain ID</div>
            <div className="text-white font-medium">114</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">RPC URL</div>
            <div className="text-white font-medium text-sm truncate">
              https://coston2-api.flare.network/ext/C/rpc
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Explorer</div>
            <a
              href="https://coston2-explorer.flare.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aeroshield-primary hover:underline font-medium text-sm flex items-center"
            >
              coston2-explorer.flare.network
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
