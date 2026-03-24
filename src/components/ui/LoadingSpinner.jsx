function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
      <p className="text-sm text-slate-300">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
