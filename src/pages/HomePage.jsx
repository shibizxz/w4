import {
  ArrowRight,
  BadgeIndianRupee,
  Percent,
  Shield,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import ChallengeCard from "../components/ui/ChallengeCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useChallengeCatalog from "../hooks/useChallengeCatalog";
import {
  getHighestAccountSize,
  getStartingPrice,
  groupChallengesByAccountSize,
} from "../lib/challenges";
import { formatCurrency } from "../lib/formatters";
import { homepageHighlights } from "../lib/platform";

const advantages = [
  {
    title: "Fast payouts",
    description:
      "Structured payout controls keep approvals clear without hiding the core rules from traders.",
  },
  {
    title: "Low fees",
    description:
      "Each Zenvex Capital SKU shows the list price, live offer price, and exact savings amount.",
  },
  {
    title: "Simple rules",
    description:
      "Targets, drawdowns, payout caps, and account-delivery workflow stay visible throughout the app.",
  },
];

function HomePage() {
  const { challenges, loading } = useChallengeCatalog();
  const groupedChallenges = groupChallengesByAccountSize(challenges);
  const featuredChallenges = challenges.slice(0, 6);
  const startingPrice = getStartingPrice(challenges);
  const highestAccountSize = getHighestAccountSize(challenges);

  useDocumentTitle("Trade Smart. Get Funded.");

  return (
    <div className="space-y-24 pb-10">
      <section className="grid gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <span className="zen-chip">Premium funded trading challenges</span>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-tight text-white sm:text-6xl">
            Trade Smart. Get Funded.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Pass the challenge and manage funded accounts with a premium,
            transparent evaluation flow built for disciplined traders.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {homepageHighlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
              >
                {highlight}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link className="primary-button gap-2" to="/challenges">
              Start Challenge
              <ArrowRight size={16} />
            </Link>
            <Link className="secondary-button" to="/auth">
              Sign in to your dashboard
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="glass-card p-5">
              <BadgeIndianRupee className="text-primary" size={22} />
              <p className="mt-4 text-3xl font-bold text-white">
                {formatCurrency(startingPrice, "INR")}
              </p>
              <p className="mt-1 text-sm text-slate-400">Starting from</p>
            </div>
            <div className="glass-card p-5">
              <Percent className="text-primary" size={22} />
              <p className="mt-4 text-3xl font-bold text-white">30%</p>
              <p className="mt-1 text-sm text-slate-400">Platform discount</p>
            </div>
            <div className="glass-card p-5">
              <WalletCards className="text-primary" size={22} />
              <p className="mt-4 text-3xl font-bold text-white">
                ${highestAccountSize.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-400">Largest live account</p>
            </div>
          </div>
        </div>

        <div className="glass-card relative overflow-hidden p-8">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
          <p className="text-sm uppercase tracking-[0.24em] text-primary">
            Capital ladder
          </p>
          <h2 className="mt-4 font-display text-3xl text-white">
            15 live products across evaluation and instant-funded paths.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Start with the account size that matches your risk appetite, then move
            into checkout with split, payout, and drawdown details already visible.
          </p>

          <div className="mt-8 space-y-4">
            {groupedChallenges.map((group) => (
              <div
                key={group.accountSize}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">${group.accountSize.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">
                      {group.products.map((item) => item.productTypeLabel).join(" | ")}
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    From {formatCurrency(Math.min(...group.products.map((item) => item.salePrice)), "INR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="zen-chip">Featured Offers</span>
            <h2 className="mt-4 font-display text-4xl text-white">
              Pick your funded path
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            Every Zenvex Capital product now shows list price, live offer price,
            split, drawdown, and rules access before checkout.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[16rem] items-center justify-center">
            <LoadingSpinner label="Loading challenge catalog" />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            {featuredChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <Link className="secondary-button gap-2" to="/challenges">
            Explore all 15 products
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="space-y-8" id="terms">
        <div>
          <span className="zen-chip">Why choose us</span>
          <h2 className="mt-4 font-display text-4xl text-white">
            Built to feel clear, focused, and premium
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {advantages.map((advantage) => (
            <article key={advantage.title} className="glass-card p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="text-primary" size={18} />
                <h3 className="font-display text-2xl text-white">{advantage.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {advantage.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Shield className="text-primary" size={20} />
            <h2 className="font-display text-3xl text-white">No Hidden Rules</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Every trader sees the same payout policy, drawdown rules, and account
            lifecycle rules that the admin team uses for review.
          </p>
          <Link className="secondary-button mt-6" to="/rules">
            Read the full rules
          </Link>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <WalletCards className="text-primary" size={20} />
            <h2 className="font-display text-3xl text-white">Controlled Payouts</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Profit split, first payout cap, and minimum trading-day checks are part
            of the challenge policy from day one.
          </p>
          <Link className="secondary-button mt-6" to="/payout-policy">
            View payout policy
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
