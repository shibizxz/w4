import {
  adminPhaseOptions,
  adminStatusOptions,
  normalizeAdminAccount,
} from "./admin";
import {
  defaultChallengeCatalog,
  normalizeChallenge,
  normalizeLifecycleStatus,
} from "./challenges";
import { calculateEligiblePayout } from "./payouts";

const DEMO_SESSION_STORAGE_KEY = "zenvex_demo_session";
const DEMO_DASHBOARD_STORAGE_KEY = "zenvex_demo_dashboard";
const DEMO_ORDER_STORAGE_KEY = "zenvex_demo_order";
const DEMO_ADMIN_OVERVIEW_STORAGE_KEY = "zenvex_demo_admin_overview";
const DEMO_CHALLENGE_CATALOG_STORAGE_KEY = "zenvex_demo_challenge_catalog";

function readStorage(key) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage`, error);
    return null;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

function createTimestamp(hoursAgo = 0) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function buildAnalytics(overview) {
  return {
    totalSales: overview.orders.reduce(
      (sum, order) => sum + Number(order.finalPrice || order.salePrice || order.price || 0),
      0,
    ),
    paidOrders: overview.orders.filter((order) => order.paymentStatus === "paid").length,
    activeAccounts: overview.accounts.filter((account) => account.status === "active").length,
    payoutRequests: overview.payoutRequests.length,
  };
}

function createDefaultChallengeCatalog() {
  return defaultChallengeCatalog.map((challenge) => ({ ...challenge }));
}

function createDefaultDemoAdminOverview() {
  const challenges = createDefaultChallengeCatalog();
  const seededChallenge = challenges.find((item) => item.id === "step1-10k") || challenges[0];

  return {
    users: [
      {
        id: "demo-user-doc",
        userId: "demo-user",
        name: "Demo Trader",
        email: "trader@zenvexcapital.com",
        createdAt: createTimestamp(72),
      },
      {
        id: "demo-user-doc-2",
        userId: "demo-user-2",
        name: "Nadia Forex",
        email: "nadia@zenvexcapital.com",
        createdAt: createTimestamp(36),
      },
    ],
    challenges,
    orders: [
      {
        id: "demo-order-seeded",
        userId: "demo-user-2",
        challengeId: seededChallenge.id,
        challengeLabel: seededChallenge.label,
        accountSize: seededChallenge.accountSize,
        productType: seededChallenge.productType,
        productTypeLabel: seededChallenge.productTypeLabel,
        listPrice: seededChallenge.listPrice,
        salePrice: seededChallenge.salePrice,
        finalPrice: seededChallenge.salePrice,
        paymentStatus: "paid",
        createdAt: createTimestamp(6),
      },
    ],
    accounts: [
      {
        id: "demo-account-seeded",
        userId: "demo-user-2",
        orderId: "demo-order-seeded",
        challengeId: seededChallenge.id,
        challengeLabel: seededChallenge.label,
        accountSize: seededChallenge.accountSize,
        productType: seededChallenge.productType,
        productTypeLabel: seededChallenge.productTypeLabel,
        phase: seededChallenge.initialPhase,
        status: "pending_credentials",
        initialBalance: seededChallenge.accountSize,
        balance: seededChallenge.accountSize,
        profitPercent: 0,
        tradingDaysCompleted: 0,
        listPrice: seededChallenge.listPrice,
        salePrice: seededChallenge.salePrice,
        finalPrice: seededChallenge.salePrice,
        profitSplitTrader: seededChallenge.profitSplitTrader,
        profitSplitPlatform: seededChallenge.profitSplitPlatform,
        firstPayoutCapUsd: seededChallenge.firstPayoutCapUsd,
        minTradingDays: seededChallenge.minTradingDays,
        firstPayoutTradingDays: seededChallenge.firstPayoutTradingDays,
        mtLogin: "",
        mtPassword: "",
        serverName: "",
        investorPassword: "",
        credentialsShared: false,
        credentialsSharedAt: null,
        deliveryMethod: "",
        isBreached: false,
        breachReason: "",
        breachedAt: null,
        notes: "Demo account waiting for MT credentials.",
        createdAt: createTimestamp(6),
        updatedAt: createTimestamp(6),
      },
    ],
    payoutRequests: [],
    userActivity: [
      {
        id: "demo-activity-1",
        userId: "demo-user-2",
        type: "purchase",
        summary: `Purchased ${seededChallenge.label}`,
        metadata: { challengeId: seededChallenge.id },
        createdAt: createTimestamp(6),
      },
    ],
    adminAuditLogs: [],
  };
}

function writeDemoAdminOverview(overview) {
  writeStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY, overview);
}

function writeDemoChallengeCatalog(challenges) {
  writeStorage(DEMO_CHALLENGE_CATALOG_STORAGE_KEY, challenges);
}

function ensureOverviewShape(overview) {
  const fallback = createDefaultDemoAdminOverview();

  return {
    users: overview?.users || fallback.users,
    challenges: (overview?.challenges || loadDemoChallengeCatalog()).map((item) =>
      normalizeChallenge(item),
    ),
    orders: overview?.orders || fallback.orders,
    accounts: (overview?.accounts || fallback.accounts).map((item) =>
      normalizeAdminAccount(item),
    ),
    payoutRequests: overview?.payoutRequests || [],
    userActivity: overview?.userActivity || [],
    adminAuditLogs: overview?.adminAuditLogs || [],
  };
}

function formatNameFromEmail(email) {
  const username = email.split("@")[0] || "Demo Trader";
  return username
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function appendDemoActivity(overview, activity) {
  return {
    ...overview,
    userActivity: [
      {
        id: `demo-activity-${Date.now()}`,
        ...activity,
      },
      ...overview.userActivity,
    ],
  };
}

function appendDemoAdminLog(overview, log) {
  return {
    ...overview,
    adminAuditLogs: [
      {
        id: `demo-log-${Date.now()}`,
        ...log,
      },
      ...overview.adminAuditLogs,
    ],
  };
}

export function createDemoIdentity({ name, email }) {
  const safeEmail = email?.trim() || "demo@zenvexcapital.com";
  const safeName = name?.trim() || formatNameFromEmail(safeEmail) || "Demo Trader";

  return {
    uid: "demo-user",
    displayName: safeName,
    email: safeEmail,
    isDemo: true,
  };
}

export function loadDemoSession() {
  return readStorage(DEMO_SESSION_STORAGE_KEY);
}

export function saveDemoSession(identity) {
  const session = {
    user: identity,
    profile: {
      userId: identity.uid,
      name: identity.displayName,
      email: identity.email,
      isDemo: true,
    },
  };

  writeStorage(DEMO_SESSION_STORAGE_KEY, session);
  return session;
}

export function clearDemoSession() {
  removeStorage(DEMO_SESSION_STORAGE_KEY);
}

export function loadDemoDashboard() {
  const dashboard = readStorage(DEMO_DASHBOARD_STORAGE_KEY);

  if (!dashboard) {
    return null;
  }

  return {
    ...dashboard,
    status: normalizeLifecycleStatus(dashboard.status),
    balance: Number(dashboard.balance ?? dashboard.accountSize ?? 0),
    profitPercent: Number(dashboard.profitPercent ?? 0),
    tradingDaysCompleted: Number(dashboard.tradingDaysCompleted ?? 0),
    profitTargetSummary: dashboard.profitTargetSummary || "10%",
    profitSplitTrader: Number(dashboard.profitSplitTrader ?? 70),
    profitSplitPlatform: Number(dashboard.profitSplitPlatform ?? 30),
    firstPayoutCapUsd: Number(dashboard.firstPayoutCapUsd ?? 100),
    firstPayoutTradingDays: Number(dashboard.firstPayoutTradingDays ?? 7),
  };
}

export function loadDemoOrder() {
  return readStorage(DEMO_ORDER_STORAGE_KEY);
}

export function loadDemoChallengeCatalog() {
  const storedCatalog = readStorage(DEMO_CHALLENGE_CATALOG_STORAGE_KEY);

  if (storedCatalog?.length) {
    return storedCatalog.map((item) => normalizeChallenge(item));
  }

  const seededCatalog = createDefaultChallengeCatalog();
  writeDemoChallengeCatalog(seededCatalog);
  return seededCatalog;
}

export function loadDemoAdminOverview() {
  const storedOverview = readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY);
  const overview = storedOverview
    ? ensureOverviewShape(storedOverview)
    : createDefaultDemoAdminOverview();

  if (!storedOverview) {
    writeDemoAdminOverview(overview);
  }

  return {
    ...overview,
    analytics: buildAnalytics(overview),
  };
}

export function recordDemoActivity(userId, type, summary, metadata = {}) {
  const overview = ensureOverviewShape(readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY));
  const nextOverview = appendDemoActivity(overview, {
    userId,
    type,
    summary,
    metadata,
    createdAt: new Date().toISOString(),
  });

  writeDemoAdminOverview(nextOverview);
}

function syncDemoPurchaseToAdminOverview({ identity, order, account, dashboard }) {
  const overview = ensureOverviewShape(readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY));
  const users = overview.users.some((user) => user.userId === identity.uid)
    ? overview.users.map((user) =>
        user.userId === identity.uid
          ? {
              ...user,
              name: identity.displayName,
              email: identity.email,
            }
          : user,
      )
    : [
        {
          id: `demo-user-${Date.now()}`,
          userId: identity.uid,
          name: identity.displayName,
          email: identity.email,
          createdAt: order.createdAt,
        },
        ...overview.users,
      ];

  let updatedOverview = {
    ...overview,
    users,
    orders: [{ id: order.orderId, ...order }, ...overview.orders],
    accounts: [account, ...overview.accounts.filter((item) => item.id !== account.id)],
  };

  updatedOverview = appendDemoActivity(updatedOverview, {
    userId: identity.uid,
    type: "purchase",
    summary: `Purchased ${order.challengeLabel}`,
    metadata: {
      orderId: order.orderId,
      challengeId: order.challengeId,
    },
    createdAt: order.createdAt,
  });

  writeDemoAdminOverview(updatedOverview);
  writeStorage(DEMO_DASHBOARD_STORAGE_KEY, dashboard);
  writeStorage(DEMO_ORDER_STORAGE_KEY, order);
}

export function updateDemoChallenge(challengeId, updates) {
  const overview = ensureOverviewShape(readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY));
  const challenge = overview.challenges.find((item) => item.id === challengeId);

  if (!challenge) {
    throw new Error("Demo challenge not found.");
  }

  const listPrice = Number(updates.listPrice ?? challenge.listPrice);
  const salePrice = Number(updates.salePrice ?? challenge.salePrice);
  const profitSplitTrader = Number(updates.profitSplitTrader ?? challenge.profitSplitTrader);
  const profitSplitPlatform = Number(
    updates.profitSplitPlatform ?? challenge.profitSplitPlatform,
  );

  if (listPrice <= 0 || salePrice <= 0 || salePrice > listPrice) {
    throw new Error("Provide valid list and sale prices.");
  }

  if (profitSplitTrader + profitSplitPlatform !== 100) {
    throw new Error("Profit split must total 100.");
  }

  const updatedChallenge = normalizeChallenge({
    ...challenge,
    ...updates,
    listPrice,
    salePrice,
    finalPrice: salePrice,
  });

  let nextOverview = {
    ...overview,
    challenges: overview.challenges.map((item) =>
      item.id === challengeId ? updatedChallenge : item,
    ),
  };

  nextOverview = appendDemoAdminLog(nextOverview, {
    action: "challenge_update",
    actorEmail: "demo-admin@zenvexcapital.com",
    targetType: "challenge",
    targetId: challengeId,
    summary: `Updated pricing for ${challengeId}`,
    createdAt: new Date().toISOString(),
  });

  writeDemoChallengeCatalog(nextOverview.challenges);
  writeDemoAdminOverview(nextOverview);

  return updatedChallenge;
}

export function updateDemoAdminAccount(accountId, updates) {
  const overview = ensureOverviewShape(readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY));
  const account = overview.accounts.find((item) => item.id === accountId);

  if (!account) {
    throw new Error("Demo account record not found.");
  }

  const nextPhase = typeof updates.phase === "string" ? updates.phase : account.phase;
  const requestedStatus = normalizeLifecycleStatus(updates.status || account.status);
  const nextMtLogin =
    typeof updates.mtLogin === "string" ? updates.mtLogin.trim() : account.mtLogin || "";
  const nextMtPassword =
    typeof updates.mtPassword === "string" ? updates.mtPassword : account.mtPassword || "";
  const nextServerName =
    typeof updates.serverName === "string" ? updates.serverName.trim() : account.serverName || "";
  const nextInvestorPassword =
    typeof updates.investorPassword === "string"
      ? updates.investorPassword
      : account.investorPassword || "";
  const nextCredentialsShared =
    typeof updates.credentialsShared === "boolean"
      ? updates.credentialsShared
      : Boolean(account.credentialsShared);
  const nextIsBreached =
    typeof updates.isBreached === "boolean"
      ? updates.isBreached
      : Boolean(account.isBreached);
  const nextBreachReason =
    typeof updates.breachReason === "string"
      ? updates.breachReason.trim()
      : account.breachReason || "";
  const nextNotes =
    typeof updates.notes === "string" ? updates.notes.trim() : account.notes || "";
  const nextBalance =
    updates.balance !== undefined ? Number(updates.balance) : Number(account.balance || account.accountSize);
  const nextProfitPercent =
    updates.profitPercent !== undefined
      ? Number(updates.profitPercent)
      : Number((((nextBalance - account.accountSize) / account.accountSize) * 100).toFixed(2));
  const nextTradingDaysCompleted =
    updates.tradingDaysCompleted !== undefined
      ? Number(updates.tradingDaysCompleted)
      : Number(account.tradingDaysCompleted || 0);

  if (!adminPhaseOptions.includes(nextPhase)) {
    throw new Error("Invalid account phase selected.");
  }

  if (!adminStatusOptions.includes(requestedStatus)) {
    throw new Error("Invalid account status selected.");
  }

  if (nextCredentialsShared && (!nextMtLogin || !nextMtPassword)) {
    throw new Error(
      "Enter both MT login and MT password before marking credentials as shared.",
    );
  }

  if (nextIsBreached && !nextBreachReason) {
    throw new Error("Add a breach reason before marking the account as breached.");
  }

  const now = new Date().toISOString();
  const updatedAccount = normalizeAdminAccount({
    ...account,
    phase: nextPhase,
    status: nextIsBreached ? "breached" : requestedStatus,
    balance: nextBalance,
    profitPercent: nextProfitPercent,
    tradingDaysCompleted: Math.max(nextTradingDaysCompleted, 0),
    mtLogin: nextMtLogin,
    mtPassword: nextMtPassword,
    serverName: nextServerName,
    investorPassword: nextInvestorPassword,
    credentialsShared: nextCredentialsShared,
    credentialsSharedAt: nextCredentialsShared ? account.credentialsSharedAt || now : null,
    deliveryMethod: nextCredentialsShared ? "email" : "",
    isBreached: nextIsBreached,
    breachReason: nextIsBreached ? nextBreachReason : "",
    breachedAt: nextIsBreached ? account.breachedAt || now : null,
    notes: nextNotes,
    updatedAt: now,
  });

  let nextOverview = {
    ...overview,
    accounts: overview.accounts.map((item) => (item.id === accountId ? updatedAccount : item)),
  };

  nextOverview = appendDemoAdminLog(nextOverview, {
    action: "account_update",
    actorEmail: "demo-admin@zenvexcapital.com",
    targetType: "account",
    targetId: accountId,
    summary: `Updated account ${accountId}`,
    createdAt: now,
  });

  writeDemoAdminOverview(nextOverview);

  const dashboard = loadDemoDashboard();

  if (dashboard && dashboard.accountId === accountId) {
    writeStorage(DEMO_DASHBOARD_STORAGE_KEY, {
      ...dashboard,
      phase: updatedAccount.phase,
      status: updatedAccount.status,
      balance: updatedAccount.balance,
      profitPercent: updatedAccount.profitPercent,
      tradingDaysCompleted: updatedAccount.tradingDaysCompleted,
      isBreached: updatedAccount.isBreached,
      updatedAt: now,
    });
  }

  return updatedAccount;
}

export function createDemoPayoutRequest({ accountId, amount, method, userId }) {
  const overview = ensureOverviewShape(readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY));
  const account = overview.accounts.find((item) => item.id === accountId);

  if (!account || account.userId !== userId) {
    throw new Error("Demo account record not found.");
  }

  if (!["active", "passed"].includes(normalizeLifecycleStatus(account.status))) {
    throw new Error("Only active or passed accounts can request a payout.");
  }

  const previousSuccessfulPayouts = overview.payoutRequests.filter(
    (item) =>
      item.accountId === accountId && ["approved", "paid"].includes(item.status),
  ).length;
  const eligibility = calculateEligiblePayout(account, previousSuccessfulPayouts);

  if (Number(account.tradingDaysCompleted || 0) < eligibility.minimumTradingDays) {
    throw new Error(
      `Minimum trading days not met yet. Required: ${eligibility.minimumTradingDays}.`,
    );
  }

  if (Number(amount) > eligibility.maxAllowedAmount) {
    throw new Error(
      `Requested amount exceeds the current maximum allowed payout of USD ${eligibility.maxAllowedAmount}.`,
    );
  }

  const now = new Date().toISOString();
  const payoutRequest = {
    id: `demo-payout-${Date.now()}`,
    userId,
    accountId,
    orderId: account.orderId,
    challengeId: account.challengeId,
    challengeLabel: account.challengeLabel,
    amount: Number(amount),
    method,
    status: "pending",
    consistencyConfirmed: false,
    ruleComplianceConfirmed: false,
    reviewNotes: "",
    rejectionReason: "",
    requestedAt: now,
    reviewedAt: null,
    reviewedBy: "",
    splitSnapshot: {
      trader: account.profitSplitTrader,
      platform: account.profitSplitPlatform,
    },
    eligibilitySnapshot: {
      grossProfit: eligibility.grossProfit,
      traderShare: eligibility.traderShare,
      firstPayoutCapUsd: account.firstPayoutCapUsd,
      minTradingDays: eligibility.minimumTradingDays,
      tradingDaysCompleted: Number(account.tradingDaysCompleted || 0),
      isFirstPayout: eligibility.isFirstPayout,
      maxAllowedAmount: eligibility.maxAllowedAmount,
    },
    createdAt: now,
    updatedAt: now,
  };

  let nextOverview = {
    ...overview,
    payoutRequests: [payoutRequest, ...overview.payoutRequests],
  };

  nextOverview = appendDemoActivity(nextOverview, {
    userId,
    type: "payout_request",
    summary: `Requested payout of USD ${amount}`,
    metadata: { accountId, method },
    createdAt: now,
  });

  writeDemoAdminOverview(nextOverview);

  return payoutRequest;
}

export function reviewDemoPayoutRequest(payoutRequestId, updates) {
  const overview = ensureOverviewShape(readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY));
  const payoutRequest = overview.payoutRequests.find((item) => item.id === payoutRequestId);

  if (!payoutRequest) {
    throw new Error("Demo payout request not found.");
  }

  const status = String(updates.status || payoutRequest.status).toLowerCase();
  const rejectionReason = String(updates.rejectionReason || "").trim();
  const reviewNotes = String(updates.reviewNotes || "").trim();
  const consistencyConfirmed = Boolean(updates.consistencyConfirmed);
  const ruleComplianceConfirmed = Boolean(updates.ruleComplianceConfirmed);

  if (status === "rejected" && !rejectionReason) {
    throw new Error("Add a rejection reason before rejecting.");
  }

  if ((status === "approved" || status === "paid") && (!consistencyConfirmed || !ruleComplianceConfirmed)) {
    throw new Error("Confirm consistency and rule compliance before approval.");
  }

  const now = new Date().toISOString();
  const updatedRequest = {
    ...payoutRequest,
    status,
    rejectionReason: status === "rejected" ? rejectionReason : "",
    reviewNotes,
    consistencyConfirmed,
    ruleComplianceConfirmed,
    reviewedBy: "demo-admin@zenvexcapital.com",
    reviewedAt: now,
    updatedAt: now,
  };

  let nextOverview = {
    ...overview,
    payoutRequests: overview.payoutRequests.map((item) =>
      item.id === payoutRequestId ? updatedRequest : item,
    ),
  };

  nextOverview = appendDemoAdminLog(nextOverview, {
    action: "payout_review",
    actorEmail: "demo-admin@zenvexcapital.com",
    targetType: "payoutRequest",
    targetId: payoutRequestId,
    summary: `Updated payout request ${payoutRequestId}`,
    createdAt: now,
  });

  writeDemoAdminOverview(nextOverview);
  return updatedRequest;
}

export function loadDemoPayoutRequests(userId) {
  const overview = ensureOverviewShape(readStorage(DEMO_ADMIN_OVERVIEW_STORAGE_KEY));
  return overview.payoutRequests.filter((item) => item.userId === userId);
}

export function createDemoOrder(challenge, identity) {
  const orderId = `demo_${Date.now()}`;
  const createdAt = new Date().toISOString();
  const initialBalance = challenge.accountSize;
  const accountId = `demo-account-${Date.now()}`;

  const order = {
    orderId,
    userId: identity.uid,
    challengeId: challenge.id,
    challengeLabel: challenge.label,
    accountSize: challenge.accountSize,
    productType: challenge.productType,
    productTypeLabel: challenge.productTypeLabel,
    listPrice: challenge.listPrice,
    salePrice: challenge.salePrice,
    finalPrice: challenge.salePrice,
    paymentStatus: "paid",
    createdAt,
    isDemo: true,
  };

  const account = normalizeAdminAccount({
    id: accountId,
    userId: identity.uid,
    orderId,
    challengeId: challenge.id,
    challengeLabel: challenge.label,
    accountSize: challenge.accountSize,
    productType: challenge.productType,
    productTypeLabel: challenge.productTypeLabel,
    phase: challenge.initialPhase,
    status: "pending_credentials",
    initialBalance,
    balance: initialBalance,
    profitPercent: 0,
    tradingDaysCompleted: 0,
    listPrice: challenge.listPrice,
    salePrice: challenge.salePrice,
    finalPrice: challenge.salePrice,
    profitSplitTrader: challenge.profitSplitTrader,
    profitSplitPlatform: challenge.profitSplitPlatform,
    firstPayoutCapUsd: challenge.firstPayoutCapUsd,
    minTradingDays: challenge.minTradingDays,
    firstPayoutTradingDays: challenge.firstPayoutTradingDays,
    mtLogin: "",
    mtPassword: "",
    serverName: "",
    investorPassword: "",
    credentialsShared: false,
    credentialsSharedAt: null,
    deliveryMethod: "",
    isBreached: false,
    breachReason: "",
    breachedAt: null,
    notes: "Created automatically after demo payment success.",
    createdAt,
    updatedAt: createdAt,
  });

  const dashboard = {
    userId: identity.uid,
    orderId,
    accountId,
    challengeId: challenge.id,
    challengeLabel: challenge.label,
    accountSize: challenge.accountSize,
    productType: challenge.productType,
    productTypeLabel: challenge.productTypeLabel,
    phase: challenge.initialPhase,
    status: "pending_credentials",
    initialBalance,
    balance: initialBalance,
    profitPercent: 0,
    tradingDaysCompleted: 0,
    maxDrawdown: challenge.maxDrawdown,
    dailyLoss: challenge.dailyLoss,
    profitTargetSummary: challenge.profitTargetSummary,
    profitSplitTrader: challenge.profitSplitTrader,
    profitSplitPlatform: challenge.profitSplitPlatform,
    firstPayoutCapUsd: challenge.firstPayoutCapUsd,
    firstPayoutTradingDays: challenge.firstPayoutTradingDays,
    isBreached: false,
    createdAt,
    updatedAt: createdAt,
    isDemo: true,
  };

  syncDemoPurchaseToAdminOverview({
    identity,
    order,
    account,
    dashboard,
  });

  return order;
}
