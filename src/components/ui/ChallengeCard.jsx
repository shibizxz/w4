import { ArrowRight, ShieldCheck, Target, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import {
  calculateDiscountPercent,
  calculateSavings,
  formatProfitSplit,
} from "../../lib/challenges";
import { formatCurrency } from "../../lib/formatters";

function ChallengeCard({ challenge, ctaLabel = "View Details" }) {
  const savings = calculateSavings(challenge.listPrice, challenge.salePrice);
  const discountPercent = calculateDiscountPercent(
    challenge.listPrice,
    challenge.salePrice,
  );

  return (
    <article className="glass-card flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-primary">
            {challenge.productTypeLabel}
          </p>
          <h3 className="mt-3 font-display text-3xl text-white">
            {challenge.sizeLabel}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            ${challenge.accountSize.toLocaleString()} account
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Save</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {discountPercent}% OFF
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{challenge.tagline}</p>

      <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Offer price</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <p className="text-3xl font-semibold text-white">
            {formatCurrency(challenge.salePrice, challenge.currency)}
          </p>
          <p className="text-sm text-slate-500 line-through">
            {formatCurrency(challenge.listPrice, challenge.currency)}
          </p>
        </div>
        <p className="mt-2 text-sm text-primary">
          You save {formatCurrency(savings, challenge.currency)}
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <Wallet className="text-primary" size={16} />
            Profit Split
          </span>
          <span className="font-semibold text-white">
            {formatProfitSplit(challenge.profitSplitTrader, challenge.profitSplitPlatform)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <Target className="text-primary" size={16} />
            Target
          </span>
          <span className="font-semibold text-white">{challenge.profitTargetSummary}</span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="text-primary" size={16} />
            Max Drawdown
          </span>
          <span className="font-semibold text-white">{challenge.maxDrawdown}%</span>
        </div>
      </div>

      <Link className="primary-button mt-6 w-full gap-2" to={`/challenges/${challenge.id}`}>
        {ctaLabel}
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}

export default ChallengeCard;
