import { cn } from "@/lib/cn.ts";

type LogoProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className, title = "Plainview" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt={title}
      width={128}
      height={128}
      draggable={false}
      className={cn("object-contain", className)}
    />
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
      <BrandMark className={compact ? "size-9" : "size-10"} />
      <Wordmark className={compact ? "text-lg" : "text-xl"} />
    </span>
  );
}
