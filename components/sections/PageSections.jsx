import { getSections } from "@/lib/sections";
import SectionRenderer from "@/components/sections/SectionRenderer";

export default async function PageSections({ page }) {
  const sections = await getSections(page);
  if (sections.length === 0) return null;
  return (
    <>
      {sections.map((s) => (
        <SectionRenderer key={s.id} section={s} />
      ))}
    </>
  );
}