import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Create Account" };

export default function RegisterPage({ searchParams }) {
  return (
    <div className="container-x flex min-h-[70vh] items-center py-12">
      <RegisterForm redirect={searchParams?.redirect} />
    </div>
  );
}