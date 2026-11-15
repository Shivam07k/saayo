import ProductCard from "@/components/ProductCard";
import { cn } from "@/lib/utils";

export default function ProductGrid({ products = [], columns = 4, className }) {
  if (products.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3", columns === 4 && "xl:grid-cols-4", columns === 5 && "xl:grid-cols-5", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}