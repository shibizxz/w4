import { httpsCallable } from "firebase/functions";
import { ArrowLeft, CreditCard, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/zenvex-logo.svg";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useChallengeCatalog from "../hooks/useChallengeCatalog";
import {
  calculateSavings,
  formatProfitSplit,
  getChallengeById,
} from "../lib/challenges";
import { createDemoOrder } from "../lib/demo";
import { getErrorMessage } from "../lib/errors";
import { functions } from "../lib/firebase";
import { formatCurrency } from "../lib/formatters";
import { loadRazorpayScript } from "../lib/razorpay";

function CheckoutPage() {
  const navigate = useNavigate();
  const { challengeId } = useParams();
  const { user, profile } = useAuth();
  const { challenges, loading } = useChallengeCatalog();
  const challenge = useMemo(() => getChallengeById(challengeId, challenges), [challengeId, challenges]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useDocumentTitle("Checkout");

  const handlePayNow = async () => {
    if (!challenge) {
      return;
    }

    setProcessing(true);
    setError("");

    if (!functions) {
      const demoOrder = createDemoOrder(challenge, {
        uid: user?.uid || "demo-user",
        displayName: profile?.name || user?.displayName || "Demo Trader",
        email: user?.email || profile?.email || "demo@zenvexcapital.com",
      });

      window.setTimeout(() => {
        navigate(`/success?orderId=${demoOrder.orderId}`, { replace: true });
      }, 900);
      return;
    }

    if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
      setError("Missing VITE_RAZORPAY_KEY_ID in the frontend environment.");
      setProcessing(false);
      return;
    }

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay checkout.");
      }

      const createRazorpayOrder = httpsCallable(functions, "createRazorpayOrder");
      const verifyRazorpayPayment = httpsCallable(functions, "verifyRazorpayPayment");
      const response = await createRazorpayOrder({ challengeId: challenge.id });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: response.data.razorpayOrderId,
        amount: response.data.amount,
        currency: response.data.currency,
        name: "Zenvex Capital",
        description: `${challenge.label} Purchase`,
        image: logo,
        prefill: {
          name: profile?.name || user?.displayName || "",
          email: user?.email || "",
        },
        theme: {
          color: "#00C896",
        },
        handler: async (paymentResponse) => {
          try {
            const verified = await verifyRazorpayPayment({
              challengeId: challenge.id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });

            navigate(`/success?orderId=${verified.data.orderId}`, { replace: true });
          } catch (verificationError) {
            setError(getErrorMessage(verificationError));
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError("Checkout was closed before the payment was completed.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (failure) => {
        setError(
          failure?.error?.description || "Payment failed before verification completed.",
        );
        setProcessing(false);
      });

      razorpay.open();
    } catch (checkoutError) {
      setError(getErrorMessage(checkoutError));
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Loading checkout" />
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

  const savings = calculateSavings(challenge.listPrice, challenge.salePrice);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="glass-card p-8 sm:p-10">
        <Link
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-primary"
          to={`/challenges/${challenge.id}`}
        >
          <ArrowLeft size={16} />
          Back to challenge details
        </Link>

        <h1 className="mt-6 font-display text-4xl text-white">Secure checkout</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Complete your {challenge.label} purchase to activate your Zenvex Capital
          funded flow with pricing, split, and payout policy snapshotted at payment time.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-primary">
              Selected product
            </p>
            <h2 className="mt-3 font-display text-3xl text-white">{challenge.label}</h2>
            <p className="mt-2 text-sm text-slate-400">
              ${challenge.accountSize.toLocaleString()} account size
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Wallet className="text-primary" size={18} />
              <p className="mt-4 text-sm text-slate-400">Profit Split</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatProfitSplit(
                  challenge.profitSplitTrader,
                  challenge.profitSplitPlatform,
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <CreditCard className="text-primary" size={18} />
              <p className="mt-4 text-sm text-slate-400">Profit Target</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {challenge.profitTargetSummary}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="text-primary" size={18} />
              <p className="mt-4 text-sm text-slate-400">Drawdown</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {challenge.maxDrawdown}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-8 sm:p-10">
        <div className="flex items-center gap-4">
          <img
            alt="Zenvex Capital logo"
            className="h-16 w-16 rounded-3xl border border-white/10 bg-background/80 p-2.5"
            src={logo}
          />
          <div>
            <p className="font-display text-2xl text-white">Order summary</p>
            <p className="mt-1 text-sm text-slate-400">
              Logged in as {profile?.name || user?.displayName || user?.email}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <span className="text-sm text-slate-300">List price</span>
            <span className="font-semibold text-slate-400 line-through">
              {formatCurrency(challenge.listPrice, challenge.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <span className="text-sm text-slate-300">Platform discount</span>
            <span className="font-semibold text-primary">
              -{formatCurrency(savings, challenge.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4">
            <span className="text-sm text-slate-200">Payable today</span>
            <span className="font-semibold text-white">
              {formatCurrency(challenge.salePrice, challenge.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <span className="text-sm text-slate-300">First payout policy</span>
            <span className="font-semibold text-white">
              USD {challenge.firstPayoutCapUsd} / {challenge.firstPayoutTradingDays} days
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <span className="text-sm text-slate-300">Payment status</span>
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-200">
              Awaiting payment
            </span>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!functions ? (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-emerald-100">
            Demo mode is active. This button simulates a successful Razorpay payment
            so your client can review the full purchase flow.
          </div>
        ) : null}

        <button
          className="primary-button mt-8 w-full"
          disabled={processing}
          onClick={handlePayNow}
          type="button"
        >
          {processing
            ? functions
              ? "Opening checkout..."
              : "Creating demo order..."
            : functions
              ? "Pay with Razorpay"
              : "Simulate Demo Purchase"}
        </button>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          {functions
            ? "On successful payment, Zenvex Capital saves your order, creates the admin provisioning record, records split and payout policy snapshots, and seeds the dashboard before redirecting to confirmation."
            : "In demo mode, Zenvex Capital stores a local sample order, account record, and dashboard snapshot so the client can review the funded flow without live credentials."}
        </p>
      </section>
    </div>
  );
}

export default CheckoutPage;
