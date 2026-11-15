import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { toPlain } from "@/lib/utils";
import ProfileForm from "@/components/ProfileForm";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black">Profile & Settings</h1>
        <p className="text-sm text-slate-500">Update your personal information and password</p>
      </header>
      <ProfileForm user={toPlain(user)} />
    </div>
  );
}