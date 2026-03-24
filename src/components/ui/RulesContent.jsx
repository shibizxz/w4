import {
  AlertTriangle,
  ClipboardCheck,
  MailCheck,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { noHiddenRulesStatement } from "../../lib/platform";
import {
  evaluationFlows,
  instantAccountExamples,
  instantAccountRules,
  operationalRules,
  tradingPolicies,
} from "../../lib/rules";

function RulesContent({ includeOperations = true }) {
  return (
    <div className="space-y-10">
      <section className="rounded-[30px] border border-primary/20 bg-primary/10 p-6 text-sm leading-7 text-slate-100 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-primary">No Hidden Rules</p>
        <p className="mt-3 max-w-4xl">{noHiddenRulesStatement}</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {evaluationFlows.map((flow) => (
          <article key={flow.id} className="glass-card p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="zen-chip">{flow.label}</span>
                <h2 className="mt-4 font-display text-3xl text-white">
                  {flow.label} Trading Plan
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {flow.description}
                </p>
              </div>
              <ShieldCheck className="mt-1 text-primary" size={22} />
            </div>

            <div className="mt-8 space-y-6">
              {flow.sections.map((section) => (
                <div
                  key={`${flow.id}-${section.title}`}
                  className="rounded-[26px] border border-white/10 bg-white/5 p-5"
                >
                  <h3 className="font-display text-2xl text-white">{section.title}</h3>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {section.metrics.map((metric) => (
                      <div
                        key={`${section.title}-${metric.label}`}
                        className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4"
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {section.payout?.length ? (
                    <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                      <p className="text-sm font-semibold text-white">Payout</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                        {section.payout.map((item) => (
                          <li key={item} className="flex gap-3">
                            <ClipboardCheck className="mt-0.5 shrink-0 text-primary" size={16} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-white">Rules</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {section.rules.map((rule) => (
                        <li key={rule} className="flex gap-3">
                          <AlertTriangle className="mt-0.5 shrink-0 text-primary" size={16} />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="glass-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="zen-chip">Instant Account Examples</span>
            <h2 className="mt-4 font-display text-3xl text-white">
              Account Size Comparison
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              These examples show how drawdown, targets, and constancy expectations
              scale from 5K to 100K instant-funded style accounts.
            </p>
          </div>
          <TrendingUp className="mt-1 text-primary" size={22} />
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-4 font-medium">Account</th>
                  <th className="px-4 py-4 font-medium">Balance</th>
                  <th className="px-4 py-4 font-medium">Daily DD</th>
                  <th className="px-4 py-4 font-medium">Max DD</th>
                  <th className="px-4 py-4 font-medium">Target</th>
                  <th className="px-4 py-4 font-medium">Trading Days</th>
                  <th className="px-4 py-4 font-medium">Constancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-background/30 text-white">
                {instantAccountExamples.map((example, index) => (
                  <tr key={example.id}>
                    <td className="px-4 py-4 text-slate-300">{index + 1}</td>
                    <td className="px-4 py-4 font-semibold">{example.accountSize}</td>
                    <td className="px-4 py-4">{example.dailyDrawdown}</td>
                    <td className="px-4 py-4">{example.maximumDrawdown}</td>
                    <td className="px-4 py-4">{example.target}</td>
                    <td className="px-4 py-4">{example.tradingDays}</td>
                    <td className="px-4 py-4">{example.constancy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Rules for Instant Accounts</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
            {instantAccountRules.map((rule) => (
              <li key={rule} className="flex gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={16} />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="zen-chip">Trading Policies</span>
            <h2 className="mt-4 font-display text-3xl text-white">
              Additional Risk Controls
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              These policies support platform sustainability, payout integrity, and
              trader transparency while MT5 automation is still a future phase.
            </p>
          </div>
          <ShieldCheck className="mt-1 text-primary" size={22} />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {tradingPolicies.map((policy) => (
            <article
              key={policy.title}
              className="rounded-[26px] border border-white/10 bg-white/5 p-5"
            >
              <h3 className="font-semibold text-white">{policy.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{policy.description}</p>
            </article>
          ))}
        </div>
      </section>

      {includeOperations ? (
        <section className="glass-card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="zen-chip">Operations Workflow</span>
              <h2 className="mt-4 font-display text-3xl text-white">
                Purchase, Breach, and Credential Handling
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                These notes clarify what is fully automated today and what remains
                admin-managed until MT5-based tracking is introduced.
              </p>
            </div>
            <MailCheck className="mt-1 text-primary" size={22} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {operationalRules.map((item) => (
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
      ) : null}
    </div>
  );
}

export default RulesContent;
