import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <div className="skeleton h-10 w-64 max-w-full" />
        <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      </div>
      <LoadingSkeleton rows={8} className="grid-cols-2 md:grid-cols-4" />
    </div>
  );
}