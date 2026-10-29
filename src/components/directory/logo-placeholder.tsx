import { FaRegImages } from "react-icons/fa";

// Shown when a listing has no logo (the live site's black image icon tile).
export function LogoPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-ink text-brand grid aspect-square w-full place-items-center ${className}`}
    >
      <FaRegImages className="size-1/3" aria-hidden />
    </div>
  );
}
