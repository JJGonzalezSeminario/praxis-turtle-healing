export default function QMLoading() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 animate-pulse">
      {/* Header-Skeleton */}
      <div className="mb-8">
        <div className="skeleton h-9 w-64 mb-2" />
        <div className="skeleton h-5 w-96" />
      </div>

      {/* Checklisten-Karten-Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="skeleton w-14 h-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="skeleton w-5 h-5 rounded-full shrink-0" />
                  <div className="skeleton h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
