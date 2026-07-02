export function PostSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg mb-6 overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-3 w-24" />
      </div>
      <div className="skeleton w-full h-80" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-40" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 9 }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-square" />
      ))}
    </div>
  );
}
