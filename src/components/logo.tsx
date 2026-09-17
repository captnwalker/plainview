import { cn } from "@/lib/cn.ts";

type LogoProps = {
  className?: string;
  title?: string;
};

export function ViewfinderMark({ className, title = "Plainview" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-ink", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect x="3.5" y="3.5" width="25" height="25" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 6.5h3.5M6.5 8v3.5M24 6.5h-3.5M25.5 8v3.5M8 25.5h3.5M6.5 24v-3.5M24 25.5h-3.5M25.5 24v-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      <circle cx="16" cy="16" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="1.35" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[1.05em] font-medium tracking-tight", className)}>
      Plainview
    </span>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <ViewfinderMark className={compact ? "size-7" : "size-8"} />
      <Wordmark className={compact ? "text-lg" : "text-xl"} />
    </span>
  );
}
