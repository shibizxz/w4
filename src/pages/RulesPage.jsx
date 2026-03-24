import RulesContent from "../components/ui/RulesContent";
import useDocumentTitle from "../hooks/useDocumentTitle";

function RulesPage() {
  useDocumentTitle("Rules");

  return (
    <div className="space-y-10">
      <section className="glass-card p-8 sm:p-10">
        <span className="zen-chip">Trading Rules</span>
        <h1 className="mt-5 font-display text-4xl text-white sm:text-5xl">
          Zenvex Capital Trading Plan & Account Rules
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
          Review the complete evaluation structure, funded account conditions,
          drawdown rules, and operational workflow before purchasing or managing a
          Zenvex Capital challenge. For payout eligibility details, use the payout
          policy page alongside these rules.
        </p>
      </section>

      <RulesContent />
    </div>
  );
}

export default RulesPage;
