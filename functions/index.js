const crypto = require("crypto");
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const Razorpay = require("razorpay");
const {
  defaultChallengeCatalog,
  getDefaultChallengeById,
  normalizeChallenge,
} = require("./challengeCatalog");

initializeApp();

const db = getFirestore();
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramAdminChatId = defineSecret("TELEGRAM_ADMIN_CHAT_ID");

const DEFAULT_ADMIN_EMAIL = "arbassyed777@gmail.com";
const ADMIN_PHASE_OPTIONS = ["Phase 1", "Phase 2", "Funded"];
const ACCOUNT_STATUS_OPTIONS = [
  "pending_credentials",
  "active",
  "passed",
  "failed",
  "breached",
];
const PAYOUT_STATUS_OPTIONS = ["pending", "approved", "rejected", "paid"];
const PAYOUT_METHOD_OPTIONS = ["crypto_usdt", "inr_bank_transfer", "inr_upi"];
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

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
}

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLifecycleStatus(value) {
  const normalized = sanitizeText(value).toLowerCase();
  return STATUS_ALIASES[normalized] || "pending_credentials";
}

function parseDateValue(value) {
  const timestamp = Date.parse(value || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function serializeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)]),
    );
  }

  return value;
}

function serializeDocument(documentSnapshot) {
  return {
    id: documentSnapshot.id,
    ...serializeValue(documentSnapshot.data()),
  };
}

function sortRecords(records) {
  return [...records].sort((left, right) => {
    const rightTime = parseDateValue(right.updatedAt || right.createdAt || right.requestedAt);
    const leftTime = parseDateValue(left.updatedAt || left.createdAt || left.requestedAt);
    return rightTime - leftTime;
  });
}

function assertAuthenticated(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return request.auth;
}

function assertAdmin(request) {
  const auth = assertAuthenticated(request);
  const email = normalizeEmail(auth.token?.email);

  if (!email || email !== getAdminEmail()) {
    throw new HttpsError("permission-denied", "Admin access is required.");
  }

  return auth;
}

function buildChallengeSnapshot(challenge) {
  return {
    challengeId: challenge.id,
    challengeLabel: challenge.label,
    shortLabel: challenge.shortLabel,
    sizeLabel: challenge.sizeLabel,
    accountSize: challenge.accountSize,
    productType: challenge.productType,
    productTypeLabel: challenge.productTypeLabel,
    listPrice: challenge.listPrice,
    salePrice: challenge.salePrice,
    finalPrice: challenge.finalPrice || challenge.salePrice,
    currency: challenge.currency,
    profitTargetSummary: challenge.profitTargetSummary,
    dailyLoss: challenge.dailyLoss,
    maxDrawdown: challenge.maxDrawdown,
    rulesFlow: challenge.rulesFlow,
    isInstant: Boolean(challenge.isInstant),
    profitSplitTrader: challenge.profitSplitTrader,
    profitSplitPlatform: challenge.profitSplitPlatform,
    firstPayoutCapUsd: challenge.firstPayoutCapUsd,
    minTradingDays: challenge.minTradingDays,
    firstPayoutTradingDays: challenge.firstPayoutTradingDays,
    initialPhase: challenge.initialPhase,
    tagline: challenge.tagline,
  };
}

function deriveProfitPercent(balance, accountSize) {
  const startingBalance = parseNumber(accountSize, 0);

  if (!startingBalance) {
    return 0;
  }

  return Number((((parseNumber(balance, 0) - startingBalance) / startingBalance) * 100).toFixed(2));
}

function calculateEligiblePayout(account, previousSuccessfulPayouts = 0) {
  const balance = parseNumber(account.balance, account.accountSize);
  const accountSize = parseNumber(account.accountSize, 0);
  const grossProfit = Math.max(balance - accountSize, 0);
  const traderShare = Number(
    ((grossProfit * parseNumber(account.profitSplitTrader, 0)) / 100).toFixed(2),
  );
  const firstPayoutCapUsd = parseNumber(account.firstPayoutCapUsd, 0);
  const isFirstPayout = Number(previousSuccessfulPayouts || 0) === 0;
  const maxAllowedAmount = isFirstPayout
    ? Math.min(traderShare, firstPayoutCapUsd || traderShare)
    : traderShare;

  return {
    grossProfit,
    traderShare,
    isFirstPayout,
    maxAllowedAmount: Number(Math.max(maxAllowedAmount, 0).toFixed(2)),
    minimumTradingDays: isFirstPayout
      ? parseNumber(account.firstPayoutTradingDays, account.minTradingDays)
      : parseNumber(account.minTradingDays, 0),
  };
}

async function writeUserActivity({ userId, type, summary, metadata = {} }) {
  await db.collection("userActivity").add({
    userId,
    type,
    summary,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function writeAdminAuditLog({ auth, action, targetType, targetId, summary, metadata = {} }) {
  await db.collection("adminAuditLogs").add({
    action,
    actorUid: auth.uid,
    actorEmail: normalizeEmail(auth.token?.email),
    targetType,
    targetId,
    summary,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function getUserProfile(userId) {
  const snapshot = await db.collection("users").where("userId", "==", userId).limit(1).get();
  return snapshot.empty ? null : serializeDocument(snapshot.docs[0]);
}

async function sendTelegramMessage(text) {
  const botToken = sanitizeText(telegramBotToken.value());
  const chatId = sanitizeText(telegramAdminChatId.value());

  if (!botToken || !chatId) {
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Telegram notification failed", error);
    return false;
  }
}

async function sendTelegramMessageSafe(text) {
  try {
    await sendTelegramMessage(text);
  } catch (error) {
    console.error("Telegram notification failed", error);
  }
}

function formatRegistrationTelegram(profile) {
  return [
    "New User Registered",
    `${profile.name || "Trader"} (${profile.email || "No email"})`,
    `Registered: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
  ].join("\n");
}

function formatPurchaseTelegram(profile, challenge) {
  return [
    "New Challenge Purchase",
    `${profile?.name || "Trader"} | ${profile?.email || "No email"}`,
    `${challenge.sizeLabel} | ${challenge.productTypeLabel}`,
    `Payment Successful | INR ${challenge.finalPrice || challenge.salePrice}`,
  ].join("\n");
}

function formatPayoutTelegram(profile, payoutRequest) {
  return [
    "Payout Request",
    `${profile?.name || "Trader"} | ${profile?.email || "No email"}`,
    `Amount: USD ${payoutRequest.amount}`,
    `Method: ${payoutRequest.method}`,
  ].join("\n");
}

function formatStatusTelegram(profile, account) {
  return [
    "Account Status Update",
    `${profile?.name || "Trader"} | ${profile?.email || "No email"}`,
    `${account.challengeLabel} -> ${account.status}`,
  ].join("\n");
}

async function getStoredChallenges() {
  const snapshot = await db.collection("challenges").orderBy("sortOrder", "asc").get();

  if (snapshot.empty) {
    return defaultChallengeCatalog;
  }

  return snapshot.docs.map((document) =>
    normalizeChallenge({ id: document.id, ...document.data() }),
  );
}

async function getChallengeOrThrow(challengeId) {
  const normalizedId = sanitizeText(challengeId);

  if (!normalizedId) {
    throw new HttpsError("invalid-argument", "Challenge ID is required.");
  }

  const storedCatalog = await getStoredChallenges();
  const challenge =
    storedCatalog.find((item) => item.id === normalizedId) || getDefaultChallengeById(normalizedId);

  if (!challenge || challenge.isActive === false) {
    throw new HttpsError("invalid-argument", "Invalid challenge selected.");
  }

  return normalizeChallenge(challenge);
}

function getRazorpayClient() {
  return new Razorpay({
    key_id: razorpayKeyId.value(),
    key_secret: razorpayKeySecret.value(),
  });
}

async function createProvisioningRecords({
  auth,
  challenge,
  razorpayOrderId,
  razorpayPaymentId,
}) {
  const orderReference = db.collection("orders").doc();
  const accountReference = db.collection("accounts").doc();
  const dashboardReference = db.collection("dashboard").doc();
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  const snapshot = buildChallengeSnapshot(challenge);
  const initialStatus = "pending_credentials";
  const initialBalance = challenge.accountSize;
  const initialPhase = challenge.initialPhase || "Phase 1";

  batch.set(orderReference, {
    userId: auth.uid,
    ...snapshot,
    paymentStatus: "paid",
    couponCode: null,
    couponDiscountType: null,
    couponDiscountValue: null,
    couponDiscountAmount: 0,
    razorpayOrderId,
    razorpayPaymentId,
    createdAt: now,
  });

  batch.set(accountReference, {
    userId: auth.uid,
    orderId: orderReference.id,
    ...snapshot,
    phase: initialPhase,
    status: initialStatus,
    initialBalance,
    balance: initialBalance,
    profitPercent: 0,
    tradingDaysCompleted: 0,
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
    notes: "",
    createdAt: now,
    updatedAt: now,
  });

  batch.set(dashboardReference, {
    userId: auth.uid,
    orderId: orderReference.id,
    accountId: accountReference.id,
    ...snapshot,
    phase: initialPhase,
    status: initialStatus,
    initialBalance,
    balance: initialBalance,
    profitPercent: 0,
    tradingDaysCompleted: 0,
    isBreached: false,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();

  await writeUserActivity({
    userId: auth.uid,
    type: "purchase",
    summary: `Purchased ${challenge.label}`,
    metadata: {
      challengeId: challenge.id,
      orderId: orderReference.id,
      finalPrice: challenge.finalPrice || challenge.salePrice,
    },
  });

  return {
    orderId: orderReference.id,
    accountId: accountReference.id,
  };
}

exports.onUserProfileCreated = onDocumentCreated(
  {
    region: "asia-south1",
    document: "users/{userDoc}",
    secrets: [telegramBotToken, telegramAdminChatId],
  },
  async (event) => {
    if (!event.data) {
      return;
    }

    const profile = serializeDocument(event.data);

    await writeUserActivity({
      userId: profile.userId,
      type: "registration",
      summary: "User profile created",
      metadata: {
        name: profile.name || "",
        email: profile.email || "",
      },
    });

    await sendTelegramMessageSafe(formatRegistrationTelegram(profile));
  },
);

exports.createRazorpayOrder = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeyId, razorpayKeySecret],
  },
  async (request) => {
    const auth = assertAuthenticated(request);
    const challenge = await getChallengeOrThrow(request.data?.challengeId);
    const razorpay = getRazorpayClient();
    const receipt = `zenvex_${auth.uid.slice(0, 8)}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: (challenge.finalPrice || challenge.salePrice) * 100,
      currency: challenge.currency,
      receipt,
      notes: {
        challengeId: challenge.id,
        userId: auth.uid,
        accountSize: String(challenge.accountSize),
        productType: challenge.productType,
      },
    });

    return {
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
      finalPrice: challenge.finalPrice || challenge.salePrice,
    };
  },
);

exports.verifyRazorpayPayment = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeySecret, telegramBotToken, telegramAdminChatId],
  },
  async (request) => {
    const auth = assertAuthenticated(request);
    const challenge = await getChallengeOrThrow(request.data?.challengeId);
    const razorpayOrderId = request.data?.razorpayOrderId;
    const razorpayPaymentId = request.data?.razorpayPaymentId;
    const razorpaySignature = request.data?.razorpaySignature;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new HttpsError("invalid-argument", "Missing Razorpay payment payload.");
    }

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret.value())
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature.length !== razorpaySignature.length) {
      throw new HttpsError("permission-denied", "Razorpay signature verification failed.");
    }

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "utf8"),
      Buffer.from(razorpaySignature, "utf8"),
    );

    if (!isSignatureValid) {
      throw new HttpsError("permission-denied", "Razorpay signature verification failed.");
    }

    const existingOrderSnapshot = await db
      .collection("orders")
      .where("razorpayPaymentId", "==", razorpayPaymentId)
      .limit(1)
      .get();

    if (!existingOrderSnapshot.empty) {
      return {
        orderId: existingOrderSnapshot.docs[0].id,
        paymentStatus: "paid",
      };
    }

    const { orderId } = await createProvisioningRecords({
      auth,
      challenge,
      razorpayOrderId,
      razorpayPaymentId,
    });

    const profile = await getUserProfile(auth.uid);
    await sendTelegramMessageSafe(formatPurchaseTelegram(profile, challenge));

    return {
      orderId,
      paymentStatus: "paid",
    };
  },
);

exports.createPayoutRequest = onCall(
  {
    region: "asia-south1",
    secrets: [telegramBotToken, telegramAdminChatId],
  },
  async (request) => {
    const auth = assertAuthenticated(request);
    const accountId = sanitizeText(request.data?.accountId);
    const method = sanitizeText(request.data?.method);
    const amount = parseNumber(request.data?.amount, 0);

    if (!accountId) {
      throw new HttpsError("invalid-argument", "Account ID is required.");
    }

    if (!PAYOUT_METHOD_OPTIONS.includes(method)) {
      throw new HttpsError("invalid-argument", "Select a valid payout method.");
    }

    if (amount <= 0) {
      throw new HttpsError("invalid-argument", "Enter a valid payout amount.");
    }

    const accountReference = db.collection("accounts").doc(accountId);
    const accountSnapshot = await accountReference.get();

    if (!accountSnapshot.exists) {
      throw new HttpsError("not-found", "Account record not found.");
    }

    const account = serializeDocument(accountSnapshot);

    if (account.userId !== auth.uid) {
      throw new HttpsError("permission-denied", "You do not own this account.");
    }

    if (!["active", "passed"].includes(normalizeLifecycleStatus(account.status))) {
      throw new HttpsError(
        "failed-precondition",
        "Only active or passed accounts can request a payout.",
      );
    }

    const accountPayoutsSnapshot = await db
      .collection("payoutRequests")
      .where("accountId", "==", accountId)
      .get();
    const accountPayouts = accountPayoutsSnapshot.docs.map((document) =>
      serializeDocument(document),
    );

    if (accountPayouts.some((item) => item.status === "pending")) {
      throw new HttpsError(
        "failed-precondition",
        "There is already a pending payout request for this account.",
      );
    }

    const payoutEligibility = calculateEligiblePayout(
      account,
      accountPayouts.filter((item) => ["approved", "paid"].includes(item.status)).length,
    );

    if (parseNumber(account.tradingDaysCompleted, 0) < payoutEligibility.minimumTradingDays) {
      throw new HttpsError(
        "failed-precondition",
        `Minimum trading days not met yet. Required: ${payoutEligibility.minimumTradingDays}.`,
      );
    }

    if (amount > payoutEligibility.maxAllowedAmount) {
      throw new HttpsError(
        "invalid-argument",
        `Requested amount exceeds the current maximum allowed payout of USD ${payoutEligibility.maxAllowedAmount}.`,
      );
    }

    const payoutReference = db.collection("payoutRequests").doc();
    await payoutReference.set({
      userId: auth.uid,
      accountId,
      orderId: account.orderId,
      challengeId: account.challengeId,
      challengeLabel: account.challengeLabel,
      amount,
      method,
      status: "pending",
      consistencyConfirmed: false,
      ruleComplianceConfirmed: false,
      reviewNotes: "",
      rejectionReason: "",
      requestedAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: "",
      splitSnapshot: {
        trader: account.profitSplitTrader,
        platform: account.profitSplitPlatform,
      },
      eligibilitySnapshot: {
        grossProfit: payoutEligibility.grossProfit,
        traderShare: payoutEligibility.traderShare,
        firstPayoutCapUsd: account.firstPayoutCapUsd,
        minTradingDays: payoutEligibility.minimumTradingDays,
        tradingDaysCompleted: parseNumber(account.tradingDaysCompleted, 0),
        isFirstPayout: payoutEligibility.isFirstPayout,
        maxAllowedAmount: payoutEligibility.maxAllowedAmount,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeUserActivity({
      userId: auth.uid,
      type: "payout_request",
      summary: `Requested payout of USD ${amount}`,
      metadata: {
        accountId,
        amount,
        method,
      },
    });

    const profile = await getUserProfile(auth.uid);
    await sendTelegramMessageSafe(
      formatPayoutTelegram(profile, { amount, method }),
    );

    return {
      payoutRequestId: payoutReference.id,
      status: "pending",
    };
  },
);

exports.getAdminOverview = onCall(
  {
    region: "asia-south1",
  },
  async (request) => {
    assertAdmin(request);

    const [
      usersSnapshot,
      ordersSnapshot,
      accountsSnapshot,
      payoutsSnapshot,
      activitySnapshot,
      logsSnapshot,
    ] = await Promise.all([
      db.collection("users").get(),
      db.collection("orders").get(),
      db.collection("accounts").get(),
      db.collection("payoutRequests").get(),
      db.collection("userActivity").get(),
      db.collection("adminAuditLogs").get(),
    ]);

    const challenges = await getStoredChallenges();
    const users = sortRecords(usersSnapshot.docs.map((document) => serializeDocument(document)));
    const orders = sortRecords(ordersSnapshot.docs.map((document) => serializeDocument(document)));
    const accounts = sortRecords(
      accountsSnapshot.docs.map((document) => {
        const account = serializeDocument(document);
        account.status = normalizeLifecycleStatus(account.status);
        return account;
      }),
    );
    const payoutRequests = sortRecords(
      payoutsSnapshot.docs.map((document) => serializeDocument(document)),
    );
    const userActivity = sortRecords(
      activitySnapshot.docs.map((document) => serializeDocument(document)),
    ).slice(0, 25);
    const adminAuditLogs = sortRecords(
      logsSnapshot.docs.map((document) => serializeDocument(document)),
    ).slice(0, 25);

    return {
      users,
      orders,
      accounts,
      challenges,
      payoutRequests,
      userActivity,
      adminAuditLogs,
      analytics: {
        totalSales: orders.reduce(
          (sum, order) => sum + parseNumber(order.finalPrice || order.salePrice || order.price, 0),
          0,
        ),
        paidOrders: orders.filter((order) => order.paymentStatus === "paid").length,
        activeAccounts: accounts.filter((account) => account.status === "active").length,
        payoutRequests: payoutRequests.length,
      },
    };
  },
);

exports.updateAdminChallenge = onCall(
  {
    region: "asia-south1",
  },
  async (request) => {
    const auth = assertAdmin(request);
    const challengeId = sanitizeText(request.data?.challengeId);
    const updates = request.data?.updates;

    if (!challengeId) {
      throw new HttpsError("invalid-argument", "Challenge ID is required.");
    }

    if (!updates || typeof updates !== "object") {
      throw new HttpsError("invalid-argument", "Challenge updates are required.");
    }

    const fallbackChallenge = getDefaultChallengeById(challengeId);

    if (!fallbackChallenge) {
      throw new HttpsError("not-found", "Challenge not found.");
    }

    const listPrice = parseNumber(updates.listPrice, fallbackChallenge.listPrice);
    const salePrice = parseNumber(updates.salePrice, fallbackChallenge.salePrice);
    const profitSplitTrader = parseNumber(
      updates.profitSplitTrader,
      fallbackChallenge.profitSplitTrader,
    );
    const profitSplitPlatform = parseNumber(
      updates.profitSplitPlatform,
      fallbackChallenge.profitSplitPlatform,
    );
    const firstPayoutCapUsd = parseNumber(
      updates.firstPayoutCapUsd,
      fallbackChallenge.firstPayoutCapUsd,
    );
    const minTradingDays = parseNumber(
      updates.minTradingDays,
      fallbackChallenge.minTradingDays,
    );
    const firstPayoutTradingDays = parseNumber(
      updates.firstPayoutTradingDays,
      fallbackChallenge.firstPayoutTradingDays,
    );
    const isActive =
      typeof updates.isActive === "boolean" ? updates.isActive : fallbackChallenge.isActive;

    if (listPrice <= 0 || salePrice <= 0 || salePrice > listPrice) {
      throw new HttpsError("invalid-argument", "Provide valid list and sale prices.");
    }

    if (
      profitSplitTrader <= 0 ||
      profitSplitPlatform <= 0 ||
      profitSplitTrader + profitSplitPlatform !== 100
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Profit split must total 100 between trader and platform.",
      );
    }

    if (firstPayoutCapUsd <= 0 || minTradingDays < 0 || firstPayoutTradingDays < 0) {
      throw new HttpsError("invalid-argument", "Provide valid payout policy settings.");
    }

    const challengeReference = db.collection("challenges").doc(challengeId);
    const nextChallenge = normalizeChallenge({
      ...fallbackChallenge,
      ...updates,
      id: challengeId,
      listPrice,
      salePrice,
      finalPrice: salePrice,
      profitSplitTrader,
      profitSplitPlatform,
      firstPayoutCapUsd,
      minTradingDays,
      firstPayoutTradingDays,
      isActive,
      updatedAt: new Date().toISOString(),
    });

    await challengeReference.set(
      {
        ...nextChallenge,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await writeAdminAuditLog({
      auth,
      action: "challenge_update",
      targetType: "challenge",
      targetId: challengeId,
      summary: `Updated pricing and split for ${challengeId}`,
      metadata: {
        listPrice,
        salePrice,
        profitSplitTrader,
        profitSplitPlatform,
      },
    });

    const challengeSnapshot = await challengeReference.get();

    return {
      challenge: serializeDocument(challengeSnapshot),
    };
  },
);

exports.updateAdminAccount = onCall(
  {
    region: "asia-south1",
    secrets: [telegramBotToken, telegramAdminChatId],
  },
  async (request) => {
    const auth = assertAdmin(request);
    const accountId = sanitizeText(request.data?.accountId);
    const updates = request.data?.updates;

    if (!accountId) {
      throw new HttpsError("invalid-argument", "Account ID is required.");
    }

    if (!updates || typeof updates !== "object") {
      throw new HttpsError("invalid-argument", "Account updates are required.");
    }

    const accountReference = db.collection("accounts").doc(accountId);
    const accountSnapshot = await accountReference.get();

    if (!accountSnapshot.exists) {
      throw new HttpsError("not-found", "Account record not found.");
    }

    const currentAccount = serializeDocument(accountSnapshot);
    const nextPhase = sanitizeText(updates.phase || currentAccount.phase || "Phase 1");
    const requestedStatus = normalizeLifecycleStatus(updates.status || currentAccount.status);
    const nextMtLogin =
      typeof updates.mtLogin === "string" ? updates.mtLogin.trim() : currentAccount.mtLogin || "";
    const nextMtPassword =
      typeof updates.mtPassword === "string" ? updates.mtPassword : currentAccount.mtPassword || "";
    const nextServerName =
      typeof updates.serverName === "string"
        ? updates.serverName.trim()
        : currentAccount.serverName || "";
    const nextInvestorPassword =
      typeof updates.investorPassword === "string"
        ? updates.investorPassword
        : currentAccount.investorPassword || "";
    const nextCredentialsShared =
      typeof updates.credentialsShared === "boolean"
        ? updates.credentialsShared
        : Boolean(currentAccount.credentialsShared);
    const nextDeliveryMethod =
      typeof updates.deliveryMethod === "string"
        ? updates.deliveryMethod.trim()
        : currentAccount.deliveryMethod || "";
    const nextIsBreached =
      typeof updates.isBreached === "boolean"
        ? updates.isBreached
        : Boolean(currentAccount.isBreached);
    const nextBreachReason =
      typeof updates.breachReason === "string"
        ? updates.breachReason.trim()
        : currentAccount.breachReason || "";
    const nextNotes =
      typeof updates.notes === "string" ? updates.notes.trim() : currentAccount.notes || "";
    const nextBalance =
      updates.balance !== undefined
        ? parseNumber(updates.balance, currentAccount.balance)
        : parseNumber(currentAccount.balance, currentAccount.accountSize);
    const nextProfitPercent =
      updates.profitPercent !== undefined
        ? parseNumber(updates.profitPercent, currentAccount.profitPercent)
        : deriveProfitPercent(nextBalance, currentAccount.accountSize);
    const nextTradingDaysCompleted =
      updates.tradingDaysCompleted !== undefined
        ? parseNumber(updates.tradingDaysCompleted, currentAccount.tradingDaysCompleted)
        : parseNumber(currentAccount.tradingDaysCompleted, 0);

    if (!ADMIN_PHASE_OPTIONS.includes(nextPhase)) {
      throw new HttpsError("invalid-argument", "Invalid account phase selected.");
    }

    if (!ACCOUNT_STATUS_OPTIONS.includes(requestedStatus)) {
      throw new HttpsError("invalid-argument", "Invalid account status selected.");
    }

    if (nextCredentialsShared && (!nextMtLogin || !nextMtPassword)) {
      throw new HttpsError(
        "invalid-argument",
        "Enter both MT login and MT password before marking credentials as shared.",
      );
    }

    if (nextCredentialsShared && nextDeliveryMethod !== "email") {
      throw new HttpsError(
        "invalid-argument",
        "Credential delivery is tracked as email in the current phase.",
      );
    }

    if (nextIsBreached && !nextBreachReason) {
      throw new HttpsError(
        "invalid-argument",
        "Add a breach reason before marking the account as breached.",
      );
    }

    const normalizedStatus = nextIsBreached ? "breached" : requestedStatus;

    const updatePayload = {
      phase: nextPhase,
      status: normalizedStatus,
      balance: nextBalance,
      profitPercent: nextProfitPercent,
      tradingDaysCompleted: Math.max(nextTradingDaysCompleted, 0),
      mtLogin: nextMtLogin,
      mtPassword: nextMtPassword,
      serverName: nextServerName,
      investorPassword: nextInvestorPassword,
      credentialsShared: nextCredentialsShared,
      deliveryMethod: nextCredentialsShared ? nextDeliveryMethod || "email" : "",
      breachReason: nextIsBreached ? nextBreachReason : "",
      isBreached: nextIsBreached,
      notes: nextNotes,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (nextCredentialsShared && !currentAccount.credentialsShared) {
      updatePayload.credentialsSharedAt = FieldValue.serverTimestamp();
    } else if (!nextCredentialsShared) {
      updatePayload.credentialsSharedAt = null;
    }

    if (nextIsBreached && !currentAccount.isBreached) {
      updatePayload.breachedAt = FieldValue.serverTimestamp();
    } else if (!nextIsBreached) {
      updatePayload.breachedAt = null;
    }

    const dashboardSnapshot = await db
      .collection("dashboard")
      .where("accountId", "==", accountId)
      .limit(1)
      .get();

    const batch = db.batch();
    batch.update(accountReference, updatePayload);

    if (!dashboardSnapshot.empty) {
      batch.update(dashboardSnapshot.docs[0].ref, {
        phase: updatePayload.phase,
        status: updatePayload.status,
        balance: updatePayload.balance,
        profitPercent: updatePayload.profitPercent,
        tradingDaysCompleted: updatePayload.tradingDaysCompleted,
        isBreached: updatePayload.isBreached,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    await writeAdminAuditLog({
      auth,
      action: "account_update",
      targetType: "account",
      targetId: accountId,
      summary: `Updated account ${accountId}`,
      metadata: {
        phase: nextPhase,
        status: normalizedStatus,
        credentialsShared: nextCredentialsShared,
        isBreached: nextIsBreached,
      },
    });

    const updatedAccountSnapshot = await accountReference.get();
    const updatedAccount = serializeDocument(updatedAccountSnapshot);
    const profile = await getUserProfile(updatedAccount.userId);

    if (
      normalizeLifecycleStatus(currentAccount.status) !== normalizeLifecycleStatus(updatedAccount.status) ||
      Boolean(currentAccount.isBreached) !== Boolean(updatedAccount.isBreached)
    ) {
      await sendTelegramMessageSafe(formatStatusTelegram(profile, updatedAccount));
    }

    return {
      account: {
        ...updatedAccount,
        status: normalizeLifecycleStatus(updatedAccount.status),
      },
    };
  },
);

exports.reviewPayoutRequest = onCall(
  {
    region: "asia-south1",
  },
  async (request) => {
    const auth = assertAdmin(request);
    const payoutRequestId = sanitizeText(request.data?.payoutRequestId);
    const status = sanitizeText(request.data?.status).toLowerCase();
    const rejectionReason = sanitizeText(request.data?.rejectionReason);
    const reviewNotes = sanitizeText(request.data?.reviewNotes);
    const consistencyConfirmed = Boolean(request.data?.consistencyConfirmed);
    const ruleComplianceConfirmed = Boolean(request.data?.ruleComplianceConfirmed);

    if (!payoutRequestId) {
      throw new HttpsError("invalid-argument", "Payout request ID is required.");
    }

    if (!PAYOUT_STATUS_OPTIONS.includes(status)) {
      throw new HttpsError("invalid-argument", "Select a valid payout status.");
    }

    const payoutReference = db.collection("payoutRequests").doc(payoutRequestId);
    const payoutSnapshot = await payoutReference.get();

    if (!payoutSnapshot.exists) {
      throw new HttpsError("not-found", "Payout request not found.");
    }

    const payoutRequest = serializeDocument(payoutSnapshot);

    if (status === "rejected" && !rejectionReason) {
      throw new HttpsError("invalid-argument", "Add a rejection reason before rejecting.");
    }

    if ((status === "approved" || status === "paid") && (!consistencyConfirmed || !ruleComplianceConfirmed)) {
      throw new HttpsError(
        "failed-precondition",
        "Confirm consistency and rule compliance before approving a payout.",
      );
    }

    const updatePayload = {
      status,
      rejectionReason: status === "rejected" ? rejectionReason : "",
      reviewNotes,
      consistencyConfirmed,
      ruleComplianceConfirmed,
      reviewedBy: normalizeEmail(auth.token?.email),
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await payoutReference.update(updatePayload);

    await writeAdminAuditLog({
      auth,
      action: "payout_review",
      targetType: "payoutRequest",
      targetId: payoutRequestId,
      summary: `Marked payout request ${payoutRequestId} as ${status}`,
      metadata: {
        status,
        amount: payoutRequest.amount,
      },
    });

    const updatedPayoutSnapshot = await payoutReference.get();
    return {
      payoutRequest: serializeDocument(updatedPayoutSnapshot),
    };
  },
);
