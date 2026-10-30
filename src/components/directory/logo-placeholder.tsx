import Image from "next/image";

// Shown when a listing has no logo (the live site's black image icon tile).
export function LogoPlaceholder({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/directory/default-business.jpg"
      alt=""
      width={150}
      height={150}
      className={`aspect-square w-full object-contain ${className}`}
    />
  );
}
