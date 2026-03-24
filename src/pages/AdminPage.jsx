import { httpsCallable } from "firebase/functions";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Mail,
  ShieldAlert,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../contexts/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  adminPhaseOptions,
  adminStatusOptions,
  formatDateTime,
  getAdminStatusLabel,
  normalizeAdminAccount,
} from "../lib/admin";
import { normalizeChallenge } from "../lib/challenges";
import {
  loadDemoAdminOverview,
  reviewDemoPayoutRequest,
  updateDemoAdminAccount,
  updateDemoChallenge,
} from "../lib/demo";
import { getErrorMessage } from "../lib/errors";
import { functions } from "../lib/firebase";
import { formatCompactCurrency, formatCurrency } from "../lib/formatters";
import {
  formatPayoutMethod,
  formatPayoutStatus,
  payoutStatusOptions,
} from "../lib/payouts";

function AdminPage() {
  const { user } = useAuth();
  const [overviewState, setOverviewState] = useState({
    loading: true,
    error: "",
    users: [],
    orders: [],
    accounts: [],
    challenges: [],
    payoutRequests: [],
    userActivity: [],
    adminAuditLogs: [],
    analytics: {
      totalSales: 0,
      paidOrders: 0,
      activeAccounts: 0,
      payoutRequests: 0,
    },
  });
  const [savingAccountId, setSavingAccountId] = useState("");
  const [savingChallengeId, setSavingChallengeId] = useState("");
  const [savingPayoutId, setSavingPayoutId] = useState("");

  useDocumentTitle("Admin");

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      if (!user) {
        return;
      }

      if (!functions) {
        if (isMounted) {
          const demoOverview = loadDemoAdminOverview();
          setOverviewState({
            loading: false,
            error: "",
            users: demoOverview.users || [],
            orders: demoOverview.orders || [],
            accounts: (demoOverview.accounts || []).map((item) => normalizeAdminAccount(item)),
            challenges: (demoOverview.challenges || []).map((item) => normalizeChallenge(item)),
            payoutRequests: demoOverview.payoutRequests || [],
            userActivity: demoOverview.userActivity || [],
            adminAuditLogs: demoOverview.adminAuditLogs || [],
            analytics: demoOverview.analytics,
          });
        }
        return;
      }

      try {
        const getAdminOverview = httpsCallable(functions, "getAdminOverview");
        const response = await getAdminOverview();
        const data = response.data;

        if (isMounted) {
          setOverviewState({
            loading: false,
            error: "",
            users: data.users || [],
            orders: data.orders || [],
            accounts: (data.accounts || []).map((item) => normalizeAdminAccount(item)),
            challenges: (data.challenges || []).map((item) => normalizeChallenge(item)),
            payoutRequests: data.payoutRequests || [],
            userActivity: data.userActivity || [],
            adminAuditLogs: data.adminAuditLogs || [],
            analytics: data.analytics || {
              totalSales: 0,
              paidOrders: 0,
              activeAccounts: 0,
              payoutRequests: 0,
            },
          });
        }
      } catch (loadError) {
        if (isMounted) {
          setOverviewState((current) => ({
            ...current,
            loading: false,
            error: getErrorMessage(loadError),
          }));
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const userMap = useMemo(
    () =>
      Object.fromEntries(
        overviewState.users.map((profile) => [profile.userId, profile]),
      ),
    [overviewState.users],
  );

  const orderMap = useMemo(
    () =>
      Object.fromEntries(overviewState.orders.map((order) => [order.id || order.orderId, order])),
    [overviewState.orders],
  );

  const handleAccountFieldChange = (accountId, field, value) => {
    setOverviewState((current) => ({
      ...current,
      accounts: current.accounts.map((account) =>
        account.id === accountId ? { ...account, [field]: value } : account,
      ),
    }));
  };

  const handleChallengeFieldChange = (challengeId, field, value) => {
    setOverviewState((current) => ({
      ...current,
      challenges: current.challenges.map((challenge) =>
        challenge.id === challengeId ? { ...challenge, [field]: value } : challenge,
      ),
    }));
  };

  const handlePayoutFieldChange = (payoutRequestId, field, value) => {
    setOverviewState((current) => ({
      ...current,
      payoutRequests: current.payoutRequests.map((item) =>
        item.id === payoutRequestId ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSaveChallenge = async (challenge) => {
    setSavingChallengeId(challenge.id);

    try {
      if (!functions) {
        const updatedChallenge = updateDemoChallenge(challenge.id, {
          listPrice: Number(challenge.listPrice),
          salePrice: Number(challenge.salePrice),
          profitSplitTrader: Number(challenge.profitSplitTrader),
          profitSplitPlatform: Number(challenge.profitSplitPlatform),
          firstPayoutCapUsd: Number(challenge.firstPayoutCapUsd),
          minTradingDays: Number(challenge.minTradingDays),
          firstPayoutTradingDays: Number(challenge.firstPayoutTradingDays),
          isActive: Boolean(challenge.isActive),
        });

        const demoOverview = loadDemoAdminOverview();
        setOverviewState((current) => ({
          ...current,
          error: "",
          challenges: current.challenges.map((item) =>
            item.id === challenge.id ? updatedChallenge : item,
          ),
          analytics: demoOverview.analytics,
          adminAuditLogs: demoOverview.adminAuditLogs,
        }));
        return;
      }

      const updateAdminChallenge = httpsCallable(functions, "updateAdminChallenge");
      const response = await updateAdminChallenge({
        challengeId: challenge.id,
        updates: {
          listPrice: Number(challenge.listPrice),
          salePrice: Number(challenge.salePrice),
          profitSplitTrader: Number(challenge.profitSplitTrader),
          profitSplitPlatform: Number(challenge.profitSplitPlatform),
          firstPayoutCapUsd: Number(challenge.firstPayoutCapUsd),
          minTradingDays: Number(challenge.minTradingDays),
          firstPayoutTradingDays: Number(challenge.firstPayoutTradingDays),
          isActive: Boolean(challenge.isActive),
        },
      });

      setOverviewState((current) => ({
        ...current,
        challenges: current.challenges.map((item) =>
          item.id === challenge.id ? normalizeChallenge(response.data.challenge) : item,
        ),
      }));
    } catch (saveError) {
      setOverviewState((current) => ({
        ...current,
        error: getErrorMessage(saveError),
      }));
    } finally {
      setSavingChallengeId("");
    }
  };

  const handleSaveAccount = async (account) => {
    setSavingAccountId(account.id);

    try {
      if (!functions) {
        const updatedAccount = updateDemoAdminAccount(account.id, {
          phase: account.phase,
          status: account.status,
          balance: Number(account.balance),
          profitPercent: Number(account.profitPercent),
          tradingDaysCompleted: Number(account.tradingDaysCompleted),
          mtLogin: account.mtLogin || "",
          mtPassword: account.mtPassword || "",
          serverName: account.serverName || "",
          investorPassword: account.investorPassword || "",
          credentialsShared: Boolean(account.credentialsShared),
          isBreached: Boolean(account.isBreached),
          breachReason: account.breachReason || "",
          notes: account.notes || "",
        });

        const demoOverview = loadDemoAdminOverview();
        setOverviewState((current) => ({
          ...current,
          error: "",
          accounts: current.accounts.map((item) =>
            item.id === account.id ? updatedAccount : item,
          ),
          analytics: demoOverview.analytics,
          adminAuditLogs: demoOverview.adminAuditLogs,
        }));
        return;
      }

      const updateAdminAccount = httpsCallable(functions, "updateAdminAccount");
      const response = await updateAdminAccount({
        accountId: account.id,
        updates: {
          phase: account.phase,
          status: account.status,
          balance: Number(account.balance),
          profitPercent: Number(account.profitPercent),
          tradingDaysCompleted: Number(account.tradingDaysCompleted),
          mtLogin: account.mtLogin || "",
          mtPassword: account.mtPassword || "",
          serverName: account.serverName || "",
          investorPassword: account.investorPassword || "",
          credentialsShared: Boolean(account.credentialsShared),
          deliveryMethod: Boolean(account.credentialsShared) ? "email" : "",
          isBreached: Boolean(account.isBreached),
          breachReason: account.breachReason || "",
          notes: account.notes || "",
        },
      });

      setOverviewState((current) => ({
        ...current,
        accounts: current.accounts.map((item) =>
          item.id === account.id ? normalizeAdminAccount(response.data.account) : item,
        ),
      }));
    } catch (saveError) {
      setOverviewState((current) => ({
        ...current,
        error: getErrorMessage(saveError),
      }));
    } finally {
      setSavingAccountId("");
    }
  };

  const handleReviewPayout = async (payoutRequest) => {
    setSavingPayoutId(payoutRequest.id);

    try {
      if (!functions) {
        const updatedPayout = reviewDemoPayoutRequest(payoutRequest.id, {
          status: payoutRequest.status,
          rejectionReason: payoutRequest.rejectionReason || "",
          reviewNotes: payoutRequest.reviewNotes || "",
          consistencyConfirmed: Boolean(payoutRequest.consistencyConfirmed),
          ruleComplianceConfirmed: Boolean(payoutRequest.ruleComplianceConfirmed),
        });

        const demoOverview = loadDemoAdminOverview();
        setOverviewState((current) => ({
          ...current,
          payoutRequests: current.payoutRequests.map((item) =>
            item.id === payoutRequest.id ? updatedPayout : item,
          ),
          adminAuditLogs: demoOverview.adminAuditLogs,
        }));
        return;
      }

      const reviewPayoutRequest = httpsCallable(functions, "reviewPayoutRequest");
      const response = await reviewPayoutRequest({
        payoutRequestId: payoutRequest.id,
        status: payoutRequest.status,
        rejectionReason: payoutRequest.rejectionReason || "",
        reviewNotes: payoutRequest.reviewNotes || "",
        consistencyConfirmed: Boolean(payoutRequest.consistencyConfirmed),
        ruleComplianceConfirmed: Boolean(payoutRequest.ruleComplianceConfirmed),
      });

      setOverviewState((current) => ({
        ...current,
        payoutRequests: current.payoutRequests.map((item) =>
          item.id === payoutRequest.id ? response.data.payoutRequest : item,
        ),
      }));
    } catch (saveError) {
      setOverviewState((current) => ({
        ...current,
        error: getErrorMessage(saveError),
      }));
    } finally {
      setSavingPayoutId("");
    }
  };

  if (overviewState.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Loading admin overview" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 sm:p-10">
        <span className="zen-chip">Admin Panel</span>
        <h1 className="mt-5 font-display text-4xl text-white sm:text-5xl">
          Pricing, payouts, provisioning, and trader controls in one place.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
          Orders are created automatically after payment. Pricing, MT credentials,
          payout approvals, and breach status remain admin-managed until MT5 live
          data integration is added.
        </p>

        {!functions ? (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-slate-100">
            Demo admin mode is active. All admin records and edits are stored only
            in this browser for presentation purposes.
          </div>
        ) : null}

        {overviewState.error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {overviewState.error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          subtitle="Paid order revenue snapshot"
          title="Total Sales"
          value={formatCompactCurrency(overviewState.analytics.totalSales, "INR", "en-IN")}
        />
        <StatCard
          icon={WalletCards}
          subtitle="Successful purchase records"
          title="Paid Orders"
          value={String(overviewState.analytics.paidOrders)}
        />
        <StatCard
          icon={ClipboardList}
          subtitle="Live active lifecycle states"
          title="Active Accounts"
          value={String(overviewState.analytics.activeAccounts)}
        />
        <StatCard
          icon={ShieldAlert}
          subtitle="Pending + reviewed payout items"
          title="Payout Requests"
          value={String(overviewState.analytics.payoutRequests)}
        />
      </section>

      <section className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <WalletCards className="text-primary" size={20} />
          <div>
            <h2 className="font-display text-2xl text-white">Pricing & Plans</h2>
            <p className="text-sm text-slate-400">
              Edit future-facing sale price, split, and payout policy values for each SKU.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {overviewState.challenges.map((challenge) => (
            <article
              key={challenge.id}
              className="rounded-[26px] border border-white/10 bg-white/5 p-5"
            >
              <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-primary">
                    {challenge.productTypeLabel}
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-white">{challenge.sizeLabel}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {challenge.label} | {challenge.isInstant ? "Instant funded" : "Evaluation"}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      List Price
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handleChallengeFieldChange(challenge.id, "listPrice", event.target.value)
                      }
                      type="number"
                      value={challenge.listPrice}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Sale Price
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handleChallengeFieldChange(challenge.id, "salePrice", event.target.value)
                      }
                      type="number"
                      value={challenge.salePrice}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      First Payout Cap (USD)
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handleChallengeFieldChange(
                          challenge.id,
                          "firstPayoutCapUsd",
                          event.target.value,
                        )
                      }
                      type="number"
                      value={challenge.firstPayoutCapUsd}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Trader Split
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handleChallengeFieldChange(
                          challenge.id,
                          "profitSplitTrader",
                          event.target.value,
                        )
                      }
                      type="number"
                      value={challenge.profitSplitTrader}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Platform Split
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handleChallengeFieldChange(
                          challenge.id,
                          "profitSplitPlatform",
                          event.target.value,
                        )
                      }
                      type="number"
                      value={challenge.profitSplitPlatform}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Min Trading Days
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handleChallengeFieldChange(
                          challenge.id,
                          "minTradingDays",
                          event.target.value,
                        )
                      }
                      type="number"
                      value={challenge.minTradingDays}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      First Payout Days
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handleChallengeFieldChange(
                          challenge.id,
                          "firstPayoutTradingDays",
                          event.target.value,
                        )
                      }
                      type="number"
                      value={challenge.firstPayoutTradingDays}
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-4 text-sm text-slate-200">
                    <input
                      checked={Boolean(challenge.isActive)}
                      onChange={(event) =>
                        handleChallengeFieldChange(
                          challenge.id,
                          "isActive",
                          event.target.checked,
                        )
                      }
                      type="checkbox"
                    />
                    Active for purchase
                  </label>
                  <button
                    className="primary-button w-full"
                    disabled={savingChallengeId === challenge.id}
                    onClick={() => handleSaveChallenge(challenge)}
                    type="button"
                  >
                    {savingChallengeId === challenge.id ? "Saving..." : "Save SKU"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-primary" size={20} />
          <div>
            <h2 className="font-display text-2xl text-white">Account Operations</h2>
            <p className="text-sm text-slate-400">
              Update lifecycle state, trader metrics, MT credentials, and delivery tracking.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {overviewState.accounts.length ? overviewState.accounts.map((account) => {
            const relatedUser = userMap[account.userId];
            const relatedOrder = orderMap[account.orderId];

            return (
              <article
                key={account.id}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6"
              >
                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-primary">
                          {account.productTypeLabel}
                        </p>
                        <h3 className="mt-2 font-display text-2xl text-white">
                          {account.challengeLabel}
                        </h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                        {getAdminStatusLabel(account.status)}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Trader
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {relatedUser?.name || "Unknown user"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {relatedUser?.email || account.userId}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Order
                        </p>
                        <p className="mt-2 break-all text-sm font-semibold text-white">
                          {account.orderId}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {relatedOrder?.finalPrice
                            ? `${relatedOrder.challengeLabel} - ${formatCurrency(relatedOrder.finalPrice, "INR")}`
                            : "Awaiting sync"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4 text-sm text-slate-300">
                      <p>
                        Created: <span className="text-white">{formatDateTime(account.createdAt)}</span>
                      </p>
                      <p className="mt-2">
                        Credentials shared:{" "}
                        <span className="text-white">
                          {account.credentialsShared
                            ? formatDateTime(account.credentialsSharedAt)
                            : "No"}
                        </span>
                      </p>
                      <p className="mt-2">
                        Breach status:{" "}
                        <span className="text-white">
                          {account.isBreached
                            ? `Breached${account.breachedAt ? ` on ${formatDateTime(account.breachedAt)}` : ""}`
                            : "Safe"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Phase
                      </label>
                      <select
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "phase", event.target.value)
                        }
                        value={account.phase || "Phase 1"}
                      >
                        {adminPhaseOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Status
                      </label>
                      <select
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "status", event.target.value)
                        }
                        value={account.status || "pending_credentials"}
                      >
                        {adminStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {getAdminStatusLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Balance
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "balance", event.target.value)
                        }
                        type="number"
                        value={account.balance || ""}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Profit %
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "profitPercent", event.target.value)
                        }
                        type="number"
                        value={account.profitPercent || ""}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Trading Days Completed
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(
                            account.id,
                            "tradingDaysCompleted",
                            event.target.value,
                          )
                        }
                        type="number"
                        value={account.tradingDaysCompleted || 0}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        MT Login
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "mtLogin", event.target.value)
                        }
                        placeholder="Trading account login"
                        type="text"
                        value={account.mtLogin || ""}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        MT Password
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "mtPassword", event.target.value)
                        }
                        placeholder="Trading account password"
                        type="text"
                        value={account.mtPassword || ""}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Server Name
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "serverName", event.target.value)
                        }
                        placeholder="Optional server"
                        type="text"
                        value={account.serverName || ""}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Investor Password
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(
                            account.id,
                            "investorPassword",
                            event.target.value,
                          )
                        }
                        placeholder="Optional investor password"
                        type="text"
                        value={account.investorPassword || ""}
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-4 text-sm text-slate-200">
                      <input
                        checked={Boolean(account.credentialsShared)}
                        onChange={(event) =>
                          handleAccountFieldChange(
                            account.id,
                            "credentialsShared",
                            event.target.checked,
                          )
                        }
                        type="checkbox"
                      />
                      Credentials sent by email
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-4 text-sm text-slate-200">
                      <input
                        checked={Boolean(account.isBreached)}
                        onChange={(event) =>
                          handleAccountFieldChange(
                            account.id,
                            "isBreached",
                            event.target.checked,
                          )
                        }
                        type="checkbox"
                      />
                      Mark as breached
                    </label>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Breach Reason
                      </label>
                      <input
                        className="field-input"
                        onChange={(event) =>
                          handleAccountFieldChange(
                            account.id,
                            "breachReason",
                            event.target.value,
                          )
                        }
                        placeholder="Explain the drawdown or rule violation"
                        type="text"
                        value={account.breachReason || ""}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Internal Notes
                      </label>
                      <textarea
                        className="field-input min-h-28 resize-y"
                        onChange={(event) =>
                          handleAccountFieldChange(account.id, "notes", event.target.value)
                        }
                        placeholder="Provisioning notes, payout notes, or support comments"
                        value={account.notes || ""}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        className="primary-button w-full gap-2"
                        disabled={savingAccountId === account.id}
                        onClick={() => handleSaveAccount(account)}
                        type="button"
                      >
                        {savingAccountId === account.id ? "Saving account..." : "Save Account Changes"}
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          }) : (
            <div className="rounded-[26px] border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
              Paid orders will appear here automatically after successful checkout.
            </div>
          )}
        </div>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-primary" size={20} />
          <div>
            <h2 className="font-display text-2xl text-white">Payout Review</h2>
            <p className="text-sm text-slate-400">
              Manual approval stays required in the current phase.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {overviewState.payoutRequests.length ? overviewState.payoutRequests.map((item) => (
            <article
              key={item.id}
              className="rounded-[26px] border border-white/10 bg-white/5 p-5"
            >
              <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">{item.challengeLabel}</h3>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {formatPayoutStatus(item.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {userMap[item.userId]?.email || item.userId}
                  </p>
                  <p className="mt-3 text-sm text-slate-300">
                    Amount: {formatCurrency(item.amount, "USD", "en-US")}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Method: {formatPayoutMethod(item.method)}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Status
                    </label>
                    <select
                      className="field-input"
                      onChange={(event) =>
                        handlePayoutFieldChange(item.id, "status", event.target.value)
                      }
                      value={item.status || "pending"}
                    >
                      {payoutStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {formatPayoutStatus(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4 text-sm text-slate-300">
                    <p>
                      Max allowed:{" "}
                      <span className="text-white">
                        {formatCurrency(
                          item.eligibilitySnapshot?.maxAllowedAmount || 0,
                          "USD",
                          "en-US",
                        )}
                      </span>
                    </p>
                    <p className="mt-2">
                      Trading days:{" "}
                      <span className="text-white">
                        {item.eligibilitySnapshot?.tradingDaysCompleted || 0} /{" "}
                        {item.eligibilitySnapshot?.minTradingDays || 0}
                      </span>
                    </p>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-4 text-sm text-slate-200">
                    <input
                      checked={Boolean(item.consistencyConfirmed)}
                      onChange={(event) =>
                        handlePayoutFieldChange(
                          item.id,
                          "consistencyConfirmed",
                          event.target.checked,
                        )
                      }
                      type="checkbox"
                    />
                    Consistency reviewed
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-4 text-sm text-slate-200">
                    <input
                      checked={Boolean(item.ruleComplianceConfirmed)}
                      onChange={(event) =>
                        handlePayoutFieldChange(
                          item.id,
                          "ruleComplianceConfirmed",
                          event.target.checked,
                        )
                      }
                      type="checkbox"
                    />
                    Rule compliance reviewed
                  </label>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Review Notes
                    </label>
                    <textarea
                      className="field-input min-h-24 resize-y"
                      onChange={(event) =>
                        handlePayoutFieldChange(item.id, "reviewNotes", event.target.value)
                      }
                      value={item.reviewNotes || ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Rejection Reason
                    </label>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        handlePayoutFieldChange(item.id, "rejectionReason", event.target.value)
                      }
                      type="text"
                      value={item.rejectionReason || ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      className="primary-button w-full"
                      disabled={savingPayoutId === item.id}
                      onClick={() => handleReviewPayout(item)}
                      type="button"
                    >
                      {savingPayoutId === item.id ? "Saving payout..." : "Save Payout Review"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )) : (
            <div className="rounded-[26px] border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
              Payout requests will appear here after traders submit them from the dashboard.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <div>
              <h2 className="font-display text-2xl text-white">Users</h2>
              <p className="text-sm text-slate-400">Registered trader profiles</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {overviewState.users.map((profile) => (
              <div
                key={profile.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <p className="font-semibold text-white">{profile.name}</p>
                <p className="mt-1 text-sm text-slate-400">{profile.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Joined {formatDateTime(profile.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Mail className="text-primary" size={20} />
            <div>
              <h2 className="font-display text-2xl text-white">Paid Orders</h2>
              <p className="text-sm text-slate-400">Latest successful challenge purchases</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {overviewState.orders.map((order) => (
              <div
                key={order.id || order.orderId}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-white">{order.challengeLabel}</p>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {order.paymentStatus}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {userMap[order.userId]?.email || order.userId}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {formatCurrency(order.finalPrice || order.salePrice || 0, "INR")}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={20} />
            <div>
              <h2 className="font-display text-2xl text-white">User Activity</h2>
              <p className="text-sm text-slate-400">Recent signup, login, purchase, and payout events</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {overviewState.userActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <p className="font-semibold text-white">{item.summary}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {userMap[item.userId]?.email || item.userId}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-primary" size={20} />
            <div>
              <h2 className="font-display text-2xl text-white">Admin Audit Log</h2>
              <p className="text-sm text-slate-400">
                Secure history of pricing, payout, and lifecycle actions
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {overviewState.adminAuditLogs.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <p className="font-semibold text-white">{item.summary}</p>
                <p className="mt-1 text-sm text-slate-400">{item.actorEmail}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
