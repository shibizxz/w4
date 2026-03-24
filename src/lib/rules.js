export const evaluationFlows = [
  {
    id: "one-step",
    label: "1-Step Evaluation",
    description:
      "Single evaluation phase followed by a funded account with the same drawdown protections.",
    sections: [
      {
        title: "Phase 1",
        metrics: [
          { label: "Profit Target", value: "10%" },
          { label: "Daily Drawdown", value: "4% (Hard Breach)" },
          { label: "Maximum Drawdown", value: "7% (Hard Breach)" },
          { label: "Trading Period", value: "Unlimited" },
          { label: "Weekend Trading", value: "Allowed" },
        ],
        rules: [
          "All drawdown rules are strictly enforced.",
          "The same trading rules and restrictions apply throughout the evaluation.",
        ],
      },
      {
        title: "Funded Account After Phase 1",
        metrics: [
          { label: "Profit Target", value: "No Profit Target" },
          { label: "Daily Drawdown", value: "4% (Hard Breach)" },
          { label: "Maximum Drawdown", value: "7% (Hard Breach)" },
          { label: "Trading Period", value: "Unlimited" },
          { label: "Weekend Trading", value: "Allowed" },
        ],
        payout: [
          "First payout after 7 trading days.",
          "Next payouts every 7 days.",
        ],
        rules: [
          "The same trading rules and restrictions apply as the evaluation phase.",
          "Any drawdown violation breaches the account and leads to termination.",
        ],
      },
    ],
  },
  {
    id: "two-step",
    label: "2-Step Evaluation",
    description:
      "Two evaluation phases with the same drawdown framework before the funded account is activated.",
    sections: [
      {
        title: "Phase 1",
        metrics: [
          { label: "Profit Target", value: "10%" },
          { label: "Daily Drawdown", value: "4% (Hard Breach)" },
          { label: "Maximum Drawdown", value: "7% (Hard Breach)" },
          { label: "Trading Period", value: "Unlimited" },
          { label: "Weekend Trading", value: "Allowed" },
        ],
        rules: ["All drawdown rules are strictly enforced."],
      },
      {
        title: "Phase 2 (Verification)",
        metrics: [
          { label: "Profit Target", value: "6%" },
          { label: "Daily Drawdown", value: "4% (Hard Breach)" },
          { label: "Maximum Drawdown", value: "7% (Hard Breach)" },
          { label: "Trading Period", value: "Unlimited" },
          { label: "Weekend Trading", value: "Allowed" },
        ],
        rules: ["The same rules from Phase 1 continue to apply."],
      },
      {
        title: "Funded Account After Phase 2",
        metrics: [
          { label: "Profit Target", value: "No Profit Target" },
          { label: "Daily Drawdown", value: "4% (Hard Breach)" },
          { label: "Maximum Drawdown", value: "7% (Hard Breach)" },
          { label: "Trading Period", value: "Unlimited" },
          { label: "Weekend Trading", value: "Allowed" },
        ],
        payout: [
          "First payout after 7 trading days.",
          "Next payouts every 7 days.",
        ],
        rules: [
          "The same trading rules and restrictions apply as the evaluation phases.",
          "Any drawdown violation breaches the account and leads to termination.",
        ],
      },
    ],
  },
];

export const instantAccountExamples = [
  {
    id: "instant-5k",
    accountSize: "$5,000",
    dailyDrawdown: "4%",
    maximumDrawdown: "7%",
    target: "10%",
    tradingDays: "Unlimited",
    constancy: "Moderate",
  },
  {
    id: "instant-10k",
    accountSize: "$10,000",
    dailyDrawdown: "4%",
    maximumDrawdown: "7%",
    target: "10%",
    tradingDays: "Unlimited",
    constancy: "High",
  },
  {
    id: "instant-25k",
    accountSize: "$25,000",
    dailyDrawdown: "4%",
    maximumDrawdown: "7%",
    target: "8%",
    tradingDays: "Unlimited",
    constancy: "High",
  },
  {
    id: "instant-50k",
    accountSize: "$50,000",
    dailyDrawdown: "4%",
    maximumDrawdown: "7%",
    target: "6%",
    tradingDays: "Unlimited",
    constancy: "Very High",
  },
  {
    id: "instant-100k",
    accountSize: "$100,000",
    dailyDrawdown: "4%",
    maximumDrawdown: "7%",
    target: "5%",
    tradingDays: "Unlimited",
    constancy: "Very High",
  },
];

export const instantAccountRules = [
  "Maintain both daily and maximum drawdown rules at all times.",
  "Follow the stated target and constancy expectations for the account tier.",
  "Adjust position sizing in line with disciplined risk management.",
  "Instant funded accounts use a lower default profit split and a delayed first payout review.",
];

export const tradingPolicies = [
  {
    title: "IP Address Rule",
    description:
      "Traders should use a consistent device and network. Frequent IP changes, VPNs, or multi-location activity may trigger a manual security review.",
  },
  {
    title: "One Account Per Trader",
    description:
      "Each trader may operate only one account per challenge type. Duplicate identities, devices, or IPs may lead to termination.",
  },
  {
    title: "Martingale Strategy Rule",
    description:
      "Martingale and similar loss-recovery sizing strategies are prohibited and may result in account breach.",
  },
  {
    title: "Grid / Layering Rule",
    description:
      "Excessive layering or unmanaged grid positions are not allowed. Traders must maintain controlled position sizing.",
  },
  {
    title: "Risk Consistency Rule",
    description:
      "Sudden abnormal jumps in lot size or inconsistent risk behavior may be flagged for review.",
  },
  {
    title: "News Trading Rule",
    description:
      "High-impact news trading may be restricted or closely reviewed where abnormal spike-based behavior is detected.",
  },
  {
    title: "Copy Trading Rule",
    description:
      "Copy trading across accounts, signals from another funded account, or mirrored third-party strategies are prohibited.",
  },
  {
    title: "Expert Advisors Rule",
    description:
      "EAs are allowed only if they do not exploit latency, arbitrage, or system inefficiencies.",
  },
  {
    title: "Hedging Rule",
    description:
      "Hedging within the same account is not allowed unless explicitly permitted by policy.",
  },
  {
    title: "Trading Behavior Rule",
    description:
      "Gambling behavior, revenge trading, or reckless overtrading is not allowed on Zenvex Capital accounts.",
  },
  {
    title: "Account Sharing Rule",
    description:
      "Only the registered account holder may trade the account. Sharing with third parties is prohibited.",
  },
  {
    title: "Payout Eligibility Rule",
    description:
      "Payouts are processed only when all platform rules are followed and the account passes admin review.",
  },
  {
    title: "Minimum Trading Days Rule",
    description:
      "Traders must complete the required trading days before payout eligibility. Instant-funded accounts use a stricter first-payout requirement.",
  },
  {
    title: "Consistency Rule",
    description:
      "Large profits from a single outlier trade may be flagged during payout review until MT5-based automation is added.",
  },
  {
    title: "Reverse Trading Cooling Period",
    description:
      "After a losing trade, immediate re-entry or revenge trading is prohibited. Traders should wait at least 15 minutes before the next trade.",
  },
  {
    title: "Funded Stage Risk Rule",
    description:
      "In the funded stage, traders should not risk more than 1% of balance per trade. Risk consistency remains mandatory.",
  },
];

export const operationalRules = [
  {
    question: "If someone buys a challenge, are the details updated automatically or manually?",
    answer:
      "Payment success updates the system automatically. Zenvex Capital creates the order, account provisioning record, and dashboard starter state right away so the admin can act on it immediately.",
  },
  {
    question: "If someone crosses the maximum loss limit, is the account breached automatically?",
    answer:
      "In the current phase it is handled manually by admin. The platform does not yet receive live MT trading data, so breach status must be updated after review. This becomes automatic in Phase 2 after MT5 integration.",
  },
  {
    question: "How does the user receive MT5 login details?",
    answer:
      "In v1 the admin enters MT5 login credentials in the admin panel and then shares them manually by email. The system tracks whether those credentials were sent.",
  },
];
