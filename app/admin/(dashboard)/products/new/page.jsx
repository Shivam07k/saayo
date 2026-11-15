import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New Product" };

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">New product</h2>
      <ProductForm />
    </div>
  );
}