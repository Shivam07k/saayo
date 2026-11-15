import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Login" };

export default function LoginPage({ searchParams }) {
  return (
    <div className="container-x flex min-h-[70vh] items-center py-12">
      <LoginForm redirect={searchParams?.redirect} />
    </div>
  );
}