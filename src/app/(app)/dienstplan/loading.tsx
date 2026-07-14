export default function DienstplanLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-pulse">
      {/* Header-Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="skeleton h-9 w-64 mb-2" />
          <div className="skeleton h-5 w-56" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-12 w-36 rounded-xl" />
          <div className="skeleton h-12 w-36 rounded-xl" />
        </div>
      </div>

      {/* Wochen-Navigation-Skeleton */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-zinc-200 mb-6">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="skeleton h-6 w-48" />
        <div className="skeleton w-10 h-10 rounded-lg" />
      </div>

      {/* Kalender-Grid-Skeleton */}
      <div className="grid grid-cols-7 gap-3">
        {/* Wochentag-Header */}
        {[...Array(7)].map((_, i) => (
          <div key={i} className="skeleton h-8 rounded-lg" />
        ))}
        {/* Schichten */}
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-3 min-h-[120px] space-y-2">
            {i % 3 === 0 && <div className="skeleton h-8 rounded-lg" />}
            {i % 2 === 0 && <div className="skeleton h-8 rounded-lg" />}
            {i % 4 === 0 && <div className="skeleton h-8 rounded-lg" />}
          </div>
        ))}
      </div>
    </div>
  )
}
