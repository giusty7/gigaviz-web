export default function OpsNewsletterLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-8 bg-slate-800 rounded w-72" />
      <div className="h-4 bg-slate-800 rounded w-96" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-slate-800 rounded-xl" />
        <div className="h-24 bg-slate-800 rounded-xl" />
      </div>
      <div className="h-12 bg-slate-800 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
