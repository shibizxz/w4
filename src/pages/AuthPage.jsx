import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/zenvex-logo.svg";
import { useAuth } from "../contexts/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { recordDemoActivity } from "../lib/demo";
import { getErrorMessage } from "../lib/errors";
import { firebaseConfigError, isFirebaseConfigured } from "../lib/firebase";

function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = useMemo(
    () => searchParams.get("redirect") || "/dashboard",
    [searchParams],
  );

  const { user, loading, register, login, enterDemo } = useAuth();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useDocumentTitle(mode === "login" ? "Login" : "Register");

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [loading, navigate, redirectTarget, user]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!isFirebaseConfigured) {
        const session = await enterDemo({
          name: formData.name,
          email: formData.email,
        });
        recordDemoActivity(
          session.user.uid,
          mode === "register" ? "registration" : "login",
          mode === "register" ? "Demo user registered" : "User signed in to demo mode",
          {
            email: session.user.email,
          },
        );
      } else if (mode === "register") {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }

      navigate(redirectTarget, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <section className="glass-card overflow-hidden p-8 sm:p-10">
        <span className="zen-chip">Welcome to Zenvex Capital</span>
        <h1 className="mt-6 font-display text-4xl text-white sm:text-5xl">
          Secure access for funded traders.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
          Register, purchase your challenge, and track funded account progress
          from a single premium dashboard built for speed and clarity.
        </p>

        <div className="mt-10 flex max-w-md items-center gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <img
            alt="Zenvex Capital logo"
            className="h-20 w-20 rounded-3xl border border-white/10 bg-background/80 p-3"
            src={logo}
          />
          <div>
            <p className="font-display text-2xl text-white">Zenvex Capital</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Email/password authentication with persistent trader sessions and
              protected dashboard access.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <LockKeyhole className="text-primary" size={20} />
            <p className="mt-4 font-semibold text-white">Protected routes</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Checkout and dashboard pages stay accessible only to logged-in users.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <UserRound className="text-primary" size={20} />
            <p className="mt-4 font-semibold text-white">Simple onboarding</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Create an account in seconds and continue to your selected challenge.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card p-8 sm:p-10">
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
              mode === "login" ? "bg-primary text-background" : "text-slate-300"
            }`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
              mode === "register" ? "bg-primary text-background" : "text-slate-300"
            }`}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-3xl text-white">
            {mode === "login" ? "Trader login" : "Create your trader account"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            {mode === "login"
              ? "Access your Zenvex Capital dashboard and challenge checkout."
              : "Open your Zenvex Capital account and maintain your session automatically."}
          </p>
        </div>

        {!isFirebaseConfigured ? (
          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {firebaseConfigError} You can still use the form below to enter a local
            demo session for client review.
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="name">
                Name
              </label>
              <input
                className="field-input"
                id="name"
                name="name"
                onChange={handleChange}
                placeholder="Your name"
                required
                type="text"
                value={formData.name}
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              className="field-input"
              id="email"
              name="email"
              onChange={handleChange}
              placeholder="trader@email.com"
              required
              type="email"
              value={formData.email}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-300"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="field-input"
              id="password"
              name="password"
              onChange={handleChange}
              placeholder="Enter password"
              required
              type="password"
              value={formData.password}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            className="primary-button w-full gap-2"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? "Processing..."
              : !isFirebaseConfigured
                ? "Continue in Demo"
                : mode === "login"
                  ? "Login"
                  : "Create account"}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Prefer to start with a plan first?{" "}
          <Link className="text-primary transition hover:text-emerald-300" to="/challenges">
            Browse challenges
          </Link>
        </p>
      </section>
    </div>
  );
}

export default AuthPage;
