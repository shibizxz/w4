import { formatLifecycleStatus, normalizeLifecycleStatus } from "./challenges";

const DEFAULT_ADMIN_EMAIL = "arbassyed777@gmail.com";

export function getAdminEmail() {
  return (import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

export function isAdminEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase() === getAdminEmail();
}

export function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export const adminStatusOptions = [
  "pending_credentials",
  "active",
  "passed",
  "failed",
  "breached",
];

export const adminPhaseOptions = ["Phase 1", "Phase 2", "Funded"];

export function getAdminStatusLabel(status) {
  return formatLifecycleStatus(status);
}

export function normalizeAdminAccount(account) {
  return {
    ...account,
    status: normalizeLifecycleStatus(account?.status),
    isBreached: Boolean(account?.isBreached || normalizeLifecycleStatus(account?.status) === "breached"),
    balance: Number(account?.balance ?? account?.accountSize ?? 0),
    profitPercent: Number(account?.profitPercent ?? 0),
    tradingDaysCompleted: Number(account?.tradingDaysCompleted ?? 0),
  };
}
