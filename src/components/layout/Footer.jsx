import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 text-sm text-slate-400">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg text-white">Zenvex Capital</p>
          <p className="mt-2 max-w-md">
            Contact: support@zenvexcapital.com | Premium funded trading challenges
            built for serious execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link className="transition hover:text-primary" to="/challenges">
            Challenges
          </Link>
          <Link className="transition hover:text-primary" to="/rules">
            Rules
          </Link>
          <Link className="transition hover:text-primary" to="/payout-policy">
            Payout Policy
          </Link>
          <Link className="transition hover:text-primary" to="/auth">
            Login
          </Link>
          <a className="transition hover:text-primary" href="#terms">
            Terms
          </a>
          <a
            className="transition hover:text-primary"
            href="https://x.com"
            rel="noreferrer"
            target="_blank"
          >
            X
          </a>
          <a
            className="transition hover:text-primary"
            href="https://instagram.com"
            rel="noreferrer"
            target="_blank"
          >
            Instagram
          </a>
          <a
            className="transition hover:text-primary"
            href="https://linkedin.com"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
