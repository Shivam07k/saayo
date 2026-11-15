import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Edit Product" };

export default function EditProductPage({ params }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Edit product</h2>
      <ProductForm id={params.id} />
    </div>
  );
}