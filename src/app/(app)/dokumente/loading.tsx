export default function DokumenteLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-pulse">
      {/* Header-Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="skeleton h-9 w-72 mb-2" />
          <div className="skeleton h-5 w-80" />
        </div>
        <div className="skeleton h-12 w-48 rounded-xl" />
      </div>

      {/* Suchleiste + Filter-Skeleton */}
      <div className="space-y-4 mb-8">
        <div className="skeleton h-14 w-full max-w-md rounded-2xl" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-32 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Dokumenten-Liste-Skeleton */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-zinc-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-5 flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
            </div>
            <div className="skeleton h-10 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
