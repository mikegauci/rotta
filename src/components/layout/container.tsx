import type { ComponentProps } from "react";

// Matches Astra's .ast-container: 1210px max width with 20px side padding.
export function Container({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`mx-auto w-full max-w-[1210px] px-5 ${className}`}
      {...props}
    />
  );
}
