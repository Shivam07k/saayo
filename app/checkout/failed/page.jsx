import Link from "next/link";
import { XCircle } from "lucide-react";
import { prisma } from "@/lib/db";

export const metadata = { title: "Payment Failed" };

export default async function CheckoutFailedPage({ searchParams }) {
  const order = searchParams.order
    ? await prisma.order.findUnique({ where: { orderNumber: searchParams.order } })
    : null;

  return (
    <div className="container-x max-w-xl py-16 text-center">
      <div className="card p-8">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-black">Payment not completed</h1>
        <p className="mt-2 text-sm text-slate-500">
          {order ? `Order ${order.orderNumber} was not paid. ` : ""}
          No charge was made. You can try again or choose a different payment method.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/checkout" className="btn-primary">Try Again</Link>
          <Link href="/cart" className="btn-outline">Back to Cart</Link>
        </div>
      </div>
    </div>
  );
}