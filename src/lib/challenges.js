const PRODUCT_TYPE_CONFIG = {
  step1: {
    productTypeLabel: "Step 1 Challenge",
    rulesFlow: "one-step",
    profitTargetSummary: "10%",
    isInstant: false,
    initialPhase: "Phase 1",
    tagline:
      "Single-step evaluation built for disciplined traders who want a clean route to funded capital.",
  },
  step2: {
    productTypeLabel: "Step 2 Challenge",
    rulesFlow: "two-step",
    profitTargetSummary: "10% / 6%",
    isInstant: false,
    initialPhase: "Phase 1",
    tagline:
      "Two-phase verification for traders who prefer a lower-cost path with structured milestones.",
  },
  instant: {
    productTypeLabel: "Instant Funded Account",
    rulesFlow: "instant",
    profitTargetSummary: "Instant Funded",
    isInstant: true,
    initialPhase: "Funded",
    tagline:
      "Direct funded-style access with stricter payout protection and tighter platform-side risk controls.",
  },
};

const ACCOUNT_TARGETS = {
  5000: "10%",
  10000: "10%",
  25000: "8%",
  50000: "6%",
  100000: "5%",
};

const ACCOUNT_SKUS = [
  {
    accountSize: 5000,
    sizeLabel: "5K",
    sortBase: 10,
    prices: {
      step1: { listPrice: 3999, salePrice: 2799 },
      step2: { listPrice: 2199, salePrice: 1499 },
      instant: { listPrice: 4299, salePrice: 2999 },
    },
  },
  {
    accountSize: 10000,
    sizeLabel: "10K",
    sortBase: 20,
    prices: {
      step1: { listPrice: 5499, salePrice: 3799 },
      step2: { listPrice: 3599, salePrice: 2499 },
      instant: { listPrice: 6999, salePrice: 4899 },
    },
  },
  {
    accountSize: 25000,
    sizeLabel: "25K",
    sortBase: 30,
    prices: {
      step1: { listPrice: 8499, salePrice: 5999 },
      step2: { listPrice: 5699, salePrice: 3999 },
      instant: { listPrice: 11499, salePrice: 7999 },
    },
  },
  {
    accountSize: 50000,
    sizeLabel: "50K",
    sortBase: 40,
    prices: {
      step1: { listPrice: 12999, salePrice: 9099 },
      step2: { listPrice: 7999, salePrice: 5599 },
      instant: { listPrice: 18499, salePrice: 12999 },
    },
  },
  {
    accountSize: 100000,
    sizeLabel: "100K",
    sortBase: 50,
    prices: {
      step1: { listPrice: 19999, salePrice: 13999 },
      step2: { listPrice: 11499, salePrice: 7999 },
      instant: { listPrice: 32999, salePrice: 22999 },
    },
  },
];

const STATUS_ALIASES = {
  "pending credentials": "pending_credentials",
  "credentials ready": "pending_credentials",
  active: "active",
  passed: "passed",
  failed: "failed",
  breached: "breached",
  terminated: "failed",
  pending_credentials: "pending_credentials",
};

function getInstantTarget(accountSize) {
  return ACCOUNT_TARGETS[Number(accountSize)] || "10%";
}

function buildChallenge(config, productType, order) {
  const productConfig = PRODUCT_TYPE_CONFIG[productType];
  const pricing = config.prices[productType];
  const profitTargetSummary =
    productType === "instant" ? getInstantTarget(config.accountSize) : productConfig.profitTargetSummary;

  return {
    id: `${productType}-${config.sizeLabel.toLowerCase()}`,
    label: `${config.sizeLabel} ${productConfig.productTypeLabel}`,
    shortLabel: `${config.sizeLabel} / ${productConfig.productTypeLabel}`,
    accountSize: config.accountSize,
    sizeLabel: config.sizeLabel,
    productType,
    productTypeLabel: productConfig.productTypeLabel,
    listPrice: pricing.listPrice,
    salePrice: pricing.salePrice,
    finalPrice: pricing.salePrice,
    currency: "INR",
    profitTargetSummary,
    dailyLoss: 4,
    maxDrawdown: 7,
    rulesFlow: productConfig.rulesFlow,
    isInstant: productConfig.isInstant,
    isActive: true,
    sortOrder: config.sortBase + order,
    profitSplitTrader: productType === "instant" ? 60 : 70,
    profitSplitPlatform: productType === "instant" ? 40 : 30,
    firstPayoutCapUsd: 100,
    minTradingDays: 7,
    firstPayoutTradingDays: productType === "instant" ? 14 : 7,
    initialPhase: productConfig.initialPhase,
    tagline: productConfig.tagline,
  };
}

export const defaultChallengeCatalog = ACCOUNT_SKUS.flatMap((config) => [
  buildChallenge(config, "step1", 1),
  buildChallenge(config, "step2", 2),
  buildChallenge(config, "instant", 3),
]);

export const challengeCatalog = defaultChallengeCatalog;

export function normalizeLifecycleStatus(value) {
  if (!value) {
    return "pending_credentials";
  }

  const normalized = String(value).trim().toLowerCase();
  return STATUS_ALIASES[normalized] || "pending_credentials";
}

export function formatLifecycleStatus(status) {
  const value = normalizeLifecycleStatus(status);

  switch (value) {
    case "active":
      return "Active";
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "breached":
      return "Breached";
    default:
      return "Pending Credentials";
  }
}

export function calculateSavings(listPrice, salePrice) {
  return Math.max(Number(listPrice || 0) - Number(salePrice || 0), 0);
}

export function calculateDiscountPercent(listPrice, salePrice) {
  const original = Number(listPrice || 0);
  const current = Number(salePrice || 0);

  if (!original || current >= original) {
    return 0;
  }

  return Math.round(((original - current) / original) * 100);
}

export function formatProfitSplit(trader, platform) {
  return `${Number(trader || 0)}% Trader / ${Number(platform || 0)}% Platform`;
}

export function getChallengeById(challengeId, catalog = defaultChallengeCatalog) {
  return catalog.find((challenge) => challenge.id === challengeId) || null;
}

export function getChallengeByAccountSize(accountSize, catalog = defaultChallengeCatalog) {
  return (
    catalog.find(
      (challenge) =>
        Number(challenge.accountSize) === Number(accountSize) &&
        challenge.productType === "step1",
    ) || null
  );
}

export function getActiveChallenges(catalog = defaultChallengeCatalog) {
  return catalog
    .filter((challenge) => challenge.isActive !== false)
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
}

export function groupChallengesByAccountSize(catalog = defaultChallengeCatalog) {
  const groups = new Map();

  getActiveChallenges(catalog).forEach((challenge) => {
    if (!groups.has(challenge.accountSize)) {
      groups.set(challenge.accountSize, {
        accountSize: challenge.accountSize,
        sizeLabel: challenge.sizeLabel,
        products: [],
      });
    }

    groups.get(challenge.accountSize).products.push(challenge);
  });

  return [...groups.values()].sort(
    (left, right) => Number(left.accountSize) - Number(right.accountSize),
  );
}

export function getStartingPrice(catalog = defaultChallengeCatalog) {
  return getActiveChallenges(catalog).reduce((lowest, challenge) => {
    if (!lowest) {
      return challenge.salePrice;
    }

    return Math.min(lowest, Number(challenge.salePrice || 0));
  }, 0);
}

export function getHighestAccountSize(catalog = defaultChallengeCatalog) {
  return getActiveChallenges(catalog).reduce(
    (highest, challenge) => Math.max(highest, Number(challenge.accountSize || 0)),
    0,
  );
}

export function normalizeChallenge(rawChallenge) {
  const fallback = getChallengeById(rawChallenge?.id) || {};

  return {
    ...fallback,
    ...rawChallenge,
    accountSize: Number(rawChallenge?.accountSize ?? fallback.accountSize ?? 0),
    listPrice: Number(rawChallenge?.listPrice ?? fallback.listPrice ?? 0),
    salePrice: Number(rawChallenge?.salePrice ?? fallback.salePrice ?? 0),
    finalPrice: Number(
      rawChallenge?.finalPrice ?? rawChallenge?.salePrice ?? fallback.finalPrice ?? fallback.salePrice ?? 0,
    ),
    dailyLoss: Number(rawChallenge?.dailyLoss ?? fallback.dailyLoss ?? 0),
    maxDrawdown: Number(rawChallenge?.maxDrawdown ?? fallback.maxDrawdown ?? 0),
    sortOrder: Number(rawChallenge?.sortOrder ?? fallback.sortOrder ?? 0),
    profitSplitTrader: Number(
      rawChallenge?.profitSplitTrader ?? fallback.profitSplitTrader ?? 0,
    ),
    profitSplitPlatform: Number(
      rawChallenge?.profitSplitPlatform ?? fallback.profitSplitPlatform ?? 0,
    ),
    firstPayoutCapUsd: Number(
      rawChallenge?.firstPayoutCapUsd ?? fallback.firstPayoutCapUsd ?? 0,
    ),
    minTradingDays: Number(
      rawChallenge?.minTradingDays ?? fallback.minTradingDays ?? 0,
    ),
    firstPayoutTradingDays: Number(
      rawChallenge?.firstPayoutTradingDays ?? fallback.firstPayoutTradingDays ?? 0,
    ),
    isActive: rawChallenge?.isActive ?? fallback.isActive ?? true,
    isInstant: rawChallenge?.isInstant ?? fallback.isInstant ?? false,
    initialPhase: rawChallenge?.initialPhase || fallback.initialPhase || "Phase 1",
  };
}
