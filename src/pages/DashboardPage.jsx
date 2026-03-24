import { httpsCallable } from "firebase/functions";
import {
  Activity,
  BadgeDollarSign,
  Gauge,
  ShieldAlert,
  Target,
  WalletCards,
} from "lucide-react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../contexts/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { formatLifecycleStatus, normalizeLifecycleStatus } from "../lib/challenges";
import {
  createDemoPayoutRequest,
  loadDemoDashboard,
  loadDemoPayoutRequests,
} from "../lib/demo";
import { getErrorMessage } from "../lib/errors";
import { db, functions } from "../lib/firebase";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from "../lib/formatters";
import {
  calculateEligiblePayout,
  formatPayoutMethod,
  formatPayoutStatus,
  payoutMethodOptions,
} from "../lib/payouts";

function DashboardPage() {
  const { user, profile } = useAuth();
  const [dashboardState, setDashboardState] = useState({
    data: null,
    payoutRequests: [],
    loading: true,
    error: "",
  });
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    method: payoutMethodOptions[0].value,
  });
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState("");

  useDocumentTitle("Dashboard");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      if (!user) {
        return;
      }

      if (!db) {
        if (isMounted) {
          setDashboardState({
            data: loadDemoDashboard(),
            payoutRequests: loadDemoPayoutRequests(user.uid),
            loading: false,
            error: "",
          });
        }

        return;
      }

      try {
        const [dashboardSnapshot, payoutSnapshot] = await Promise.all([
          getDocs(
            query(
              collection(db, "dashboard"),
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc"),
              limit(1),
            ),
          ),
          getDocs(
            query(
              collection(db, "payoutRequests"),
              where("userId", "==", user.uid),
              orderBy("requestedAt", "desc"),
            ),
          ),
        ]);

        const dashboardDoc = dashboardSnapshot.empty
          ? null
          : { id: dashboardSnapshot.docs[0].id, ...dashboardSnapshot.docs[0].data() };

        if (isMounted) {
          setDashboardState({
            data: dashboardDoc,
            payoutRequests: payoutSnapshot.docs.map((document) => ({
              id: document.id,
              ...document.data(),
            })),
            loading: false,
            error: "",
          });
        }
      } catch (loadError) {
        if (isMounted) {
          setDashboardState({
            data: null,
            payoutRequests: [],
            loading: false,
            error: getErrorMessage(loadError),
          });
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const payoutStats = useMemo(() => {
    const previousSuccessfulPayouts = dashboardState.payoutRequests.filter((item) =>
      ["approved", "paid"].includes(String(item.status || "").toLowerCase()),
    ).length;

    if (!dashboardState.data) {
      return {
        grossProfit: 0,
        traderShare: 0,
        maxAllowedAmount: 0,
        minimumTradingDays: 0,
        isFirstPayout: true,
      };
    }

    return calculateEligiblePayout(dashboardState.data, previousSuccessfulPayouts);
  }, [dashboardState.data, dashboardState.payoutRequests]);

  const handlePayoutRequest = async (event) => {
    event.preventDefault();

    if (!dashboardState.data) {
      return;
    }

    setSubmittingPayout(true);
    setPayoutMessage("");

    try {
      const amount = Number(payoutForm.amount);

      if (!functions) {
        createDemoPayoutRequest({
          accountId: dashboardState.data.accountId,
          amount,
          method: payoutForm.method,
          userId: user?.uid || "demo-user",
        });

        setDashboardState((current) => ({
          ...current,
          payoutRequests: loadDemoPayoutRequests(user?.uid || "demo-user"),
        }));
      } else {
        const createPayoutRequest = httpsCallable(functions, "createPayoutRequest");
        await createPayoutRequest({
          accountId: dashboardState.data.accountId,
          amount,
          method: payoutForm.method,
        });

        const payoutSnapshot = await getDocs(
          query(
            collection(db, "payoutRequests"),
            where("userId", "==", user.uid),
            orderBy("requestedAt", "desc"),
          ),
        );

        setDashboardState((current) => ({
          ...current,
          payoutRequests: payoutSnapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })),
        }));
      }

      setPayoutForm({
        amount: "",
        method: payoutMethodOptions[0].value,
      });
      setPayoutMessage("Payout request submitted successfully.");
    } catch (submitError) {
      setPayoutMessage(getErrorMessage(submitError));
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (dashboardState.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Loading your funded dashboard" />
      </div>
    );
  }

  if (dashboardState.error) {
    return (
      <div className="glass-card p-8">
        <h1 className="font-display text-3xl text-white">Dashboard unavailable</h1>
        <p className="mt-4 text-slate-400">{dashboardState.error}</p>
      </div>
    );
  }

  if (!dashboardState.data) {
    return (
      <div className="glass-card p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">
          No active challenge yet
        </p>
        <h1 className="mt-4 font-display text-4xl text-white">
          Purchase a challenge to unlock your dashboard.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          {db
            ? "Once your Zenvex Capital payment is verified, a dashboard record is created automatically and this page will show your latest account metrics."
            : "Start a demo purchase from the challenges page and this dashboard will populate with local sample metrics for your client presentation."}
        </p>
        <Link className="primary-button mt-8" to="/challenges">
          Browse challenges
        </Link>
      </div>
    );
  }

  const dashboard = dashboardState.data;
  const normalizedStatus = normalizeLifecycleStatus(dashboard.status);
  const isPendingCredentials = normalizedStatus === "pending_credentials";
  const isBreached = normalizedStatus === "breached" || dashboard.isBreached;
  const meetsTradingDays =
    Number(dashboard.tradingDaysCompleted || 0) >= Number(payoutStats.minimumTradingDays || 0);
  const canRequestPayout =
    ["active", "passed"].includes(normalizedStatus) &&
    !isBreached &&
    meetsTradingDays &&
    payoutStats.maxAllowedAmount > 0;

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <div>
            <span className="zen-chip">Trader dashboard</span>
            <h1 className="mt-5 font-display text-4xl text-white sm:text-5xl">
              {profile?.name || "Trader"}, your funded overview is live.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Zenvex Capital keeps phase, payout readiness, profit pace, and
              drawdown room visible at a glance.
            </p>
            {isPendingCredentials ? (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4 text-sm leading-6 text-slate-200">
                Your payment is confirmed. MT credentials are entered in the admin
                panel and then shared manually by email in this MVP.
              </div>
            ) : null}
            {isBreached ? (
              <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-100">
                This account has been marked as breached after an admin review of
                the drawdown or rule limits. Payout requests are disabled.
              </div>
            ) : null}
            {!db ? (
              <p className="mt-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Demo data stored locally for presentation
              </p>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Account size</p>
                <p className="mt-3 font-display text-3xl text-white">
                  ${Number(dashboard.accountSize || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {dashboard.phase}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
              <span className="text-sm text-slate-400">Status</span>
              <span className="font-semibold text-white">
                {formatLifecycleStatus(dashboard.status)}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
              <span className="text-sm text-slate-400">Product</span>
              <span className="font-semibold text-white">{dashboard.productTypeLabel}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <StatCard
          icon={BadgeDollarSign}
          subtitle="Current account balance"
          title="Balance"
          value={formatCompactCurrency(dashboard.balance, "USD")}
        />
        <StatCard
          icon={Activity}
          subtitle="Live progress toward the target"
          title="Profit %"
          value={formatPercent(dashboard.profitPercent)}
        />
        <StatCard
          icon={ShieldAlert}
          subtitle="Maximum allowed challenge drawdown"
          title="Drawdown"
          value={formatPercent(dashboard.maxDrawdown)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">
                Target completion
              </p>
              <h2 className="mt-3 font-display text-3xl text-white">
                {dashboard.profitTargetSummary || "10%"}
              </h2>
            </div>
            <Target className="text-primary" size={24} />
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    (Number(dashboard.profitPercent || 0) /
                      Math.max(parseFloat(dashboard.profitTargetSummary) || 10, 1)) *
                      100,
                    100,
                  ),
                )}%`,
              }}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Trading days completed</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {Number(dashboard.tradingDaysCompleted || 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Trader split</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {Number(dashboard.profitSplitTrader || 0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Gauge className="text-primary" size={22} />
            <div>
              <p className="font-semibold text-white">Payout eligibility</p>
              <p className="text-sm text-slate-400">Current snapshot for manual review</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <span className="text-sm text-slate-300">Gross profit</span>
              <span className="font-semibold text-white">
                {formatCompactCurrency(payoutStats.grossProfit, "USD")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <span className="text-sm text-slate-300">Trader share</span>
              <span className="font-semibold text-white">
                {formatCompactCurrency(payoutStats.traderShare, "USD")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <span className="text-sm text-slate-300">Current max request</span>
              <span className="font-semibold text-white">
                {formatCompactCurrency(payoutStats.maxAllowedAmount, "USD")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <span className="text-sm text-slate-300">Trading day requirement</span>
              <span className="font-semibold text-white">
                {dashboard.tradingDaysCompleted || 0} / {payoutStats.minimumTradingDays}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <WalletCards className="text-primary" size={22} />
            <div>
              <h2 className="font-display text-3xl text-white">Request payout</h2>
              <p className="text-sm text-slate-400">
                Manual approval is required before any payout is released.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handlePayoutRequest}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="amount">
                Requested amount (USD)
              </label>
              <input
                className="field-input"
                id="amount"
                min="1"
                name="amount"
                onChange={(event) =>
                  setPayoutForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="100"
                step="0.01"
                type="number"
                value={payoutForm.amount}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="method">
                Payout method
              </label>
              <select
                className="field-input"
                id="method"
                onChange={(event) =>
                  setPayoutForm((current) => ({ ...current, method: event.target.value }))
                }
                value={payoutForm.method}
              >
                {payoutMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {payoutMessage ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-slate-100">
                {payoutMessage}
              </div>
            ) : null}

            <button
              className="primary-button w-full"
              disabled={!canRequestPayout || submittingPayout}
              type="submit"
            >
              {submittingPayout ? "Submitting request..." : "Submit payout request"}
            </button>
          </form>

          {!canRequestPayout ? (
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Payout requests become available only when the account is active or
              passed, trading-day requirements are met, and the current payout cap
              has not been exceeded.
            </p>
          ) : null}
        </div>

        <div className="glass-card p-6 sm:p-8">
          <h2 className="font-display text-3xl text-white">Payout history</h2>
          <div className="mt-6 space-y-4">
            {dashboardState.payoutRequests.length ? (
              dashboardState.payoutRequests.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[26px] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-white">
                      {formatCurrency(item.amount, "USD", "en-US")}
                    </p>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {formatPayoutStatus(item.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {formatPayoutMethod(item.method)}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {item.requestedAt
                      ? new Date(item.requestedAt).toLocaleString("en-IN")
                      : "Pending timestamp"}
                  </p>
                  {item.rejectionReason ? (
                    <p className="mt-3 text-sm text-rose-200">{item.rejectionReason}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-[26px] border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
                No payout requests submitted yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
