import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(date).toLocaleDateString("en-IN", options || defaultOptions);
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    // Past
    if (diffHours > -24) return `${Math.abs(diffHours)} hours ago`;
    if (diffDays > -7) return `${Math.abs(diffDays)} days ago`;
    return formatDate(date, { month: "short", day: "numeric" });
  } else {
    // Future
    if (diffHours < 24) return `in ${diffHours} hours`;
    if (diffDays < 7) return `in ${diffDays} days`;
    return formatDate(date, { month: "short", day: "numeric" });
  }
}

export function truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

// Alias for truncateAddress
export const shortenAddress = truncateAddress;

export function getRiskTier(probability: number): {
  tier: string;
  color: string;
  bgColor: string;
} {
  if (probability < 0.3) {
    return { tier: "Low", color: "text-green-400", bgColor: "bg-green-500/20" };
  }
  if (probability < 0.6) {
    return { tier: "Medium", color: "text-yellow-400", bgColor: "bg-yellow-500/20" };
  }
  return { tier: "High", color: "text-red-400", bgColor: "bg-red-500/20" };
}

export function getStatusConfig(status: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  const configs: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: "Pending", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    active: { label: "Active", color: "text-green-400", bgColor: "bg-green-500/20" },
    expired: { label: "Expired", color: "text-gray-400", bgColor: "bg-gray-500/20" },
    claimed: { label: "Claimed", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    paid: { label: "Paid", color: "text-purple-400", bgColor: "bg-purple-500/20" },
    cancelled: { label: "Cancelled", color: "text-red-400", bgColor: "bg-red-500/20" },
    initiated: { label: "Initiated", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    verifying: { label: "Verifying", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
    approved: { label: "Approved", color: "text-green-400", bgColor: "bg-green-500/20" },
    rejected: { label: "Rejected", color: "text-red-400", bgColor: "bg-red-500/20" },
    processing: { label: "Processing", color: "text-orange-400", bgColor: "bg-orange-500/20" },
    failed: { label: "Failed", color: "text-red-400", bgColor: "bg-red-500/20" },
  };

  return configs[status] || { label: status, color: "text-gray-400", bgColor: "bg-gray-500/20" };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const AIRLINE_NAMES: Record<string, string> = {
  "6E": "IndiGo",
  "AI": "Air India",
  "UK": "Vistara",
  "SG": "SpiceJet",
  "I5": "AirAsia India",
  "G8": "Go First",
  "QP": "Akasa Air",
};

export const AIRPORT_NAMES: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bangalore",
  HYD: "Hyderabad",
  MAA: "Chennai",
  CCU: "Kolkata",
  GOI: "Goa",
  PNQ: "Pune",
  AMD: "Ahmedabad",
  COK: "Kochi",
};
