import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  faqItems,
  noHiddenRulesStatement,
  payoutPolicyPoints,
  payoutProofEntries,
} from "../lib/platform";

function PayoutPolicyPage() {
  useDocumentTitle("Payout Policy");

  return (
    <div className="space-y-10">
      <section className="glass-card p-8 sm:p-10">
        <span className="zen-chip">Payout Policy</span>
        <h1 className="mt-5 font-display text-4xl text-white sm:text-5xl">
          Clear payout rules for trader trust and platform safety.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
          Zenvex Capital uses a controlled payout workflow with transparent trader
          splits, first-withdrawal caps, and manual approval in the current phase.
        </p>
      </section>

      <section className="rounded-[30px] border border-primary/20 bg-primary/10 p-6 text-sm leading-7 text-slate-100 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-primary">No Hidden Rules</p>
        <p className="mt-3 max-w-4xl">{noHiddenRulesStatement}</p>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <h2 className="font-display text-3xl text-white">How payouts work</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {payoutPolicyPoints.map((point) => (
            <article
              key={point}
              className="rounded-[26px] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300"
            >
              {point}
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <h2 className="font-display text-3xl text-white">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-4">
          {faqItems.map((item) => (
            <article
              key={item.question}
              className="rounded-[26px] border border-white/10 bg-white/5 p-5"
            >
              <h3 className="font-semibold text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {payoutProofEntries.length ? (
        <section className="glass-card p-6 sm:p-8">
          <h2 className="font-display text-3xl text-white">Payout Proof</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {payoutProofEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[26px] border border-white/10 bg-white/5 p-5"
              >
                <p className="text-sm text-slate-300">{entry.caption}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default PayoutPolicyPage;
