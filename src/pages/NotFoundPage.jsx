import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

function NotFoundPage() {
  useDocumentTitle("Page not found");

  return (
    <div className="mx-auto max-w-3xl">
      <section className="glass-card p-8 text-center sm:p-10">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">404</p>
        <h1 className="mt-4 font-display text-4xl text-white">
          This Zenvex Capital page does not exist.
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-300">
          The route may have changed, or the requested page is no longer available.
        </p>
        <Link className="primary-button mt-8" to="/">
          Return home
        </Link>
      </section>
    </div>
  );
}

export default NotFoundPage;
