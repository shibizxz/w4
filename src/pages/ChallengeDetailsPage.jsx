import {
  ArrowRight,
  BadgeInfo,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RulesContent from "../components/ui/RulesContent";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useChallengeCatalog from "../hooks/useChallengeCatalog";
import {
  calculateDiscountPercent,
  calculateSavings,
  formatProfitSplit,
  getChallengeById,
} from "../lib/challenges";
import { formatCurrency } from "../lib/formatters";

function ChallengeDetailsPage() {
  const { challengeId } = useParams();
  const { challenges, loading } = useChallengeCatalog();
  const challenge = useMemo(() => getChallengeById(challengeId, challenges), [challengeId, challenges]);
  const [showRules, setShowRules] = useState(false);
  const savings = challenge ? calculateSavings(challenge.listPrice, challenge.salePrice) : 0;
  const discountPercent = challenge
    ? calculateDiscountPercent(challenge.listPrice, challenge.salePrice)
    : 0;

  useDocumentTitle(challenge ? `${challenge.label} Details` : "Challenge Details");

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Loading challenge details" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="glass-card p-8 text-center">
        <h1 className="font-display text-3xl text-white">Challenge not found</h1>
        <p className="mt-4 text-slate-400">
          The selected Zenvex Capital challenge could not be loaded.
        </p>
        <Link className="primary-button mt-6" to="/challenges">
          Back to challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-card p-8 sm:p-10">
          <span className="zen-chip">Challenge Details</span>
          <h1 className="mt-5 font-display text-4xl text-white sm:text-5xl">
            {challenge.label}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            {challenge.tagline} Review the price, split, payout rules, and shared
            trading policies before moving into secure checkout.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <Wallet className="text-primary" size={20} />
              <p className="mt-4 text-sm text-slate-400">Offer Price</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {formatCurrency(challenge.salePrice, challenge.currency)}
              </p>
              <p className="mt-2 text-sm text-slate-500 line-through">
                {formatCurrency(challenge.listPrice, challenge.currency)}
              </p>
              <p className="mt-2 text-sm text-primary">
                Save {formatCurrency(savings, challenge.currency)} ({discountPercent}% OFF)
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <ShieldAlert className="text-primary" size={20} />
              <p className="mt-4 text-sm text-slate-400">Risk Framework</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {challenge.dailyLoss}% / {challenge.maxDrawdown}%
              </p>
              <p className="mt-1 text-sm text-slate-400">Daily / Maximum Drawdown</p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-2xl text-white">Product snapshot</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Product Type
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {challenge.productTypeLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Profit Split
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatProfitSplit(
                    challenge.profitSplitTrader,
                    challenge.profitSplitPlatform,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Profit Target
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {challenge.profitTargetSummary}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  First Payout Rule
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  USD {challenge.firstPayoutCapUsd} / {challenge.firstPayoutTradingDays} days
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 sm:p-10">
          <span className="zen-chip">Purchase Flow</span>
          <h2 className="mt-5 font-display text-3xl text-white">
            Review, then continue to checkout
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Zenvex Capital automatically creates the order, account record, and
            dashboard snapshot after successful payment. MT credentials are still
            entered by admin and shared manually by email in the current phase.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Automatic after payment</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Order, account, dashboard, pricing snapshot, and payout-policy
                snapshot are stored immediately.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Manual in the current phase</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Payout approval, breach marking, and credential delivery stay admin
                managed until MT5 integration is added.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <Link className="primary-button gap-2" to={`/checkout/${challenge.id}`}>
              Continue to Checkout
              <ArrowRight size={16} />
            </Link>
            <Link className="secondary-button" to="/payout-policy">
              View Payout Policy
            </Link>
          </div>

          <div className="mt-8 rounded-[26px] border border-primary/20 bg-primary/10 p-5">
            <div className="flex items-start gap-3">
              <BadgeInfo className="mt-0.5 shrink-0 text-primary" size={18} />
              <p className="text-sm leading-6 text-slate-200">
                If a trader buys a challenge, the record updates automatically. If
                a trader crosses the loss limit, the breach is still marked manually
                in admin until MT5 tracking is added.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-8 sm:p-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="zen-chip">Rules Access</span>
            <h2 className="mt-4 font-display text-3xl text-white">
              Need to review the full rules?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Expand the complete trading plan, payout rules, and policy set directly
              on this challenge page.
            </p>
          </div>

          <button
            className="secondary-button gap-2 self-start sm:self-center"
            onClick={() => setShowRules((current) => !current)}
            type="button"
          >
            Rules
            {showRules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showRules ? (
          <div className="mt-8">
            <RulesContent />
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default ChallengeDetailsPage;
