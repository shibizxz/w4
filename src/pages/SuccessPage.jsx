import { CheckCircle2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useDocumentTitle("Payment success");

  return (
    <div className="mx-auto max-w-3xl">
      <section className="glass-card p-8 text-center sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <CheckCircle2 size={34} />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.24em] text-primary">
          Payment confirmed
        </p>
        <h1 className="mt-4 font-display text-4xl text-white">
          Welcome to Zenvex Capital.
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-300">
          Your challenge order has been saved successfully. The admin team can now
          see the order instantly, prepare your account credentials, and share them
          with you manually by email while your dashboard tracks the account and payout
          policy snapshot.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Order ID</p>
          <p className="mt-3 break-all font-display text-2xl text-white">
            {orderId || "Order generated successfully"}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link className="primary-button" to="/dashboard">
            Go to dashboard
          </Link>
          <Link className="secondary-button" to="/challenges">
            Explore more challenges
          </Link>
        </div>
      </section>
    </div>
  );
}

export default SuccessPage;
