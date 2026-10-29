import { PAGE_FIELDS } from "@/lib/page-fields";
// Preserve the original emphasis and line breaks until this text is edited.
export function PageText({
  path,
  name,
  value,
  children,
}: {
  path: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return value === PAGE_FIELDS[path]?.[name]?.value ? (
    <>{children}</>
  ) : (
    <span className="whitespace-pre-line">{value}</span>
  );
}
