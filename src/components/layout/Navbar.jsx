import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/zenvex-logo.svg";

function Navbar() {
  const navigate = useNavigate();
  const { user, profile, logout, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isDemoUser = Boolean(user?.isDemo || profile?.isDemo);
  const adminPath = isAdmin ? "/admin" : "/admin/login";
  const navigation = [
    { label: "Home", to: "/" },
    { label: "Challenges", to: "/challenges" },
    { label: "Rules", to: "/rules" },
    { label: "Payout Policy", to: "/payout-policy" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Admin", to: adminPath },
  ];

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 py-4">
      <nav className="glass-card flex items-center justify-between px-4 py-3 sm:px-6">
        <Link
          className="flex items-center gap-3"
          onClick={() => setIsOpen(false)}
          to="/"
        >
          <img
            alt="Zenvex Capital logo"
            className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 p-1.5 sm:h-12 sm:w-12"
            src={logo}
          />
          <div>
            <p className="font-display text-lg leading-none text-white sm:text-xl">
              Zenvex Capital
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              Funded Trading Platform
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white"
                }`
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {isDemoUser ? (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Demo Mode
                </span>
              ) : null}
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {profile?.name || user.displayName || user.email}
              </span>
              <button className="secondary-button" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          ) : (
            <Link className="primary-button" to="/auth">
              Login / Register
            </Link>
          )}
        </div>

        <button
          aria-label="Toggle navigation menu"
          className="inline-flex rounded-full border border-white/10 p-2 text-slate-200 transition hover:border-primary hover:text-primary lg:hidden"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {isOpen ? (
        <div className="glass-card mt-3 flex flex-col gap-3 px-4 py-4 lg:hidden">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
              onClick={() => setIsOpen(false)}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}

          {user ? (
            <>
              {isDemoUser ? (
                <p className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Demo Mode
                </p>
              ) : null}
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {profile?.name || user.displayName || user.email}
              </p>
              <button
                className="secondary-button"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <Link className="primary-button" onClick={() => setIsOpen(false)} to="/auth">
              Login / Register
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
