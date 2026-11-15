export default function LoadingSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-square w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}