import { getSections } from "@/lib/sections";
import SectionRenderer from "@/components/sections/SectionRenderer";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sections = await getSections("home");

  return (
    <div className="animate-fade-in">
      {sections.map((s) => (
        <SectionRenderer key={s.id} section={s} />
      ))}
    </div>
  );
}