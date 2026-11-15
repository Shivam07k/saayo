import Link from "next/link";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {Icon && <Icon className="h-12 w-12 text-slate-300 dark:text-slate-700" />}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <Link href={action.href} className="btn-primary mt-2">{action.label}</Link>}
    </div>
  );
}