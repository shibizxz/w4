import { CheckCircle2 } from "lucide-react";
import ChallengeCard from "../components/ui/ChallengeCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useChallengeCatalog from "../hooks/useChallengeCatalog";
import { groupChallengesByAccountSize } from "../lib/challenges";

const rules = [
  "Dynamic cards rendered from the shared SKU catalog",
  "15 live products across Step 1, Step 2, and Instant Funded paths",
  "4% daily drawdown and 7% maximum drawdown hard-breach limits",
  "Every purchase opens a full challenge details page before checkout",
];

function ChallengesPage() {
  const { challenges, loading } = useChallengeCatalog();
  const groupedChallenges = groupChallengesByAccountSize(challenges);

  useDocumentTitle("Challenges");

  return (
    <div className="space-y-10">
      <section className="glass-card p-8 sm:p-10">
        <span className="zen-chip">Challenge plans</span>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="font-display text-4xl text-white sm:text-5xl">
              Choose your Zenvex Capital account size and funding path.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Browse Step 1, Step 2, and Instant Funded products grouped by account
              size, with the exact split, offer price, and rule access shown before
              checkout.
            </p>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
              >
                <CheckCircle2 className="text-primary" size={18} />
                {rule}
              </div>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[18rem] items-center justify-center">
          <LoadingSpinner label="Loading challenge catalog" />
        </div>
      ) : (
        <div className="space-y-8">
          {groupedChallenges.map((group) => (
            <section key={group.accountSize} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="zen-chip">${group.accountSize.toLocaleString()} Account</span>
                  <h2 className="mt-3 font-display text-3xl text-white">
                    {group.sizeLabel} Capital Options
                  </h2>
                </div>
                <p className="text-sm text-slate-400">
                  Choose between evaluation and instant-funded access at this size.
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                {group.products.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChallengesPage;
