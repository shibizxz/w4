export const payoutMethodOptions = [
  { value: "crypto_usdt", label: "Crypto (USDT)" },
  { value: "inr_bank_transfer", label: "INR Bank Transfer" },
  { value: "inr_upi", label: "INR UPI" },
];

const payoutMethodLabels = Object.fromEntries(
  payoutMethodOptions.map((option) => [option.value, option.label]),
);

export const payoutStatusOptions = ["pending", "approved", "rejected", "paid"];

export function formatPayoutMethod(method) {
  return payoutMethodLabels[method] || "Unknown";
}

export function formatPayoutStatus(status) {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "paid":
      return "Paid";
    default:
      return "Pending";
  }
}

export function calculateGrossProfit(account) {
  const balance = Number(account?.balance || 0);
  const startingBalance = Number(account?.accountSize || account?.initialBalance || 0);
  return Math.max(balance - startingBalance, 0);
}

export function calculateEligiblePayout(account, previousSuccessfulPayouts = 0) {
  const grossProfit = calculateGrossProfit(account);
  const splitPercent = Number(account?.profitSplitTrader || 0);
  const traderShare = Number(((grossProfit * splitPercent) / 100).toFixed(2));
  const firstPayoutCap = Number(account?.firstPayoutCapUsd || 0);
  const isFirstPayout = Number(previousSuccessfulPayouts || 0) === 0;
  const maxAllowedAmount = isFirstPayout
    ? Math.min(traderShare, firstPayoutCap || traderShare)
    : traderShare;

  return {
    grossProfit,
    traderShare,
    isFirstPayout,
    maxAllowedAmount: Number(Math.max(maxAllowedAmount, 0).toFixed(2)),
    minimumTradingDays: isFirstPayout
      ? Number(account?.firstPayoutTradingDays || account?.minTradingDays || 0)
      : Number(account?.minTradingDays || 0),
  };
}
