import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-x flex min-h-[70vh] items-center py-12">
      <ForgotPasswordForm />
    </div>
  );
}