import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getAdminEmail } from "../lib/admin";
import { getErrorMessage } from "../lib/errors";
import { auth, firebaseConfigError, isFirebaseConfigured } from "../lib/firebase";

function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = useMemo(
    () => searchParams.get("redirect") || "/admin",
    [searchParams],
  );
  const { user, loading, isAdmin, enterDemoAdmin } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const adminEmail = getAdminEmail();

  useDocumentTitle("Admin Login");

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAdmin, loading, navigate, redirectTarget, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!isFirebaseConfigured || !auth) {
        await enterDemoAdmin();
        navigate(redirectTarget, { replace: true });
        return;
      }

      await signInWithEmailAndPassword(auth, adminEmail, password);
      navigate(redirectTarget, { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
      <section className="glass-card p-8 sm:p-10">
        <span className="zen-chip">Admin Access</span>
        <h1 className="mt-5 font-display text-4xl text-white sm:text-5xl">
          Manage purchased accounts and provisioning.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
          The admin panel is used to review paid challenge orders, provision MT
          credentials, mark breach status manually, and update trader account phases.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
            <ShieldCheck className="text-primary" size={20} />
            <p className="mt-4 font-semibold text-white">Protected access</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Only the configured admin email can access admin data and account
              update functions.
            </p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
            <LockKeyhole className="text-primary" size={20} />
            <p className="mt-4 font-semibold text-white">Firebase Auth</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Create the admin user in Firebase Authentication using the approved
              email and password before signing in here.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card p-8 sm:p-10">
        <h2 className="font-display text-3xl text-white">Admin login</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Sign in with the configured Zenvex Capital admin Firebase account.
        </p>

        {!isFirebaseConfigured ? (
          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {firebaseConfigError} Demo admin preview is available here for client
            review, but the password is not validated until Firebase is connected.
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="adminEmail">
              Admin Email
            </label>
            <input
              className="field-input"
              id="adminEmail"
              readOnly
              type="email"
              value={adminEmail}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-300"
              htmlFor="adminPassword"
            >
              Password
            </label>
            <input
              className="field-input"
              id="adminPassword"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                isFirebaseConfigured
                  ? "Enter admin password"
                  : "Any text works in demo mode"
              }
              required={isFirebaseConfigured}
              type="password"
              value={password}
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
              ? "Signing in..."
              : isFirebaseConfigured
                ? "Sign in to Admin"
                : "Open Demo Admin"}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Need the public site instead?{" "}
          <Link className="text-primary transition hover:text-emerald-300" to="/">
            Return home
          </Link>
        </p>
      </section>
    </div>
  );
}

export default AdminLoginPage;
