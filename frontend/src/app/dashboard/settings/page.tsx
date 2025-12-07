"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  User,
  Wallet,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  LogOut,
  Copy,
  CheckCircle2,
  ExternalLink,
  Settings,
  Key,
  Mail,
  CreditCard
} from "lucide-react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { shortenAddress } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    claims: true,
    marketing: false,
  });
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">
              {user?.fullName || "Anonymous User"}
            </h3>
            <p className="text-gray-400 mt-1">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <button
            onClick={() => window.open(user?.profileImageUrl, "_blank")}
            className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </motion.div>

      {/* Wallet Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Wallet</h2>
        </div>

        {isConnected && address ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{shortenAddress(address)}</p>
                  <p className="text-sm text-gray-400">
                    {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "Loading..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <a
                  href={`https://coston2-explorer.flare.network/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            <button
              onClick={() => disconnect()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300">No Wallet Connected</h3>
            <p className="text-gray-500 mt-1 mb-4">
              Connect your wallet to manage policies on-chain
            </p>
            <button className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all">
              Connect Wallet
            </button>
          </div>
        )}
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { key: "email", label: "Email Notifications", description: "Receive updates via email", icon: Mail },
            { key: "push", label: "Push Notifications", description: "Browser push notifications", icon: Bell },
            { key: "claims", label: "Claim Alerts", description: "Notify when claims are processed", icon: Shield },
            { key: "marketing", label: "Marketing", description: "Receive promotional offers", icon: CreditCard },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <item.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ 
                  ...prev, 
                  [item.key]: !prev[item.key as keyof typeof prev] 
                }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications]
                    ? "bg-violet-600"
                    : "bg-gray-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications[item.key as keyof typeof notifications]
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appearance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Appearance</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-lg">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">Theme</p>
              <p className="text-sm text-gray-500">Choose your preferred theme</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`p-2 rounded-lg transition-colors ${
                theme === "light"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <Sun className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <Moon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Security</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Key className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 transition-colors">
              Enable
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Globe className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-medium">Active Sessions</p>
                <p className="text-sm text-gray-500">Manage your logged-in devices</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
              View
            </button>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-red-500/5 backdrop-blur border border-red-500/20 rounded-xl"
      >
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors">
          Delete Account
        </button>
      </motion.div>
    </div>
  );
}
