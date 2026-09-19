import { Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/logo.tsx";
import { ThemeToggle } from "@/components/theme-toggle.tsx";
import { cn } from "@/lib/cn.ts";

const NAV = [
  { to: "/about", label: "About" },
  { to: "/tools", label: "Tools" },
  { to: "/legal", label: "Legal" },
  { to: "/remove", label: "Remove my listings" },
] as const;

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link to="/" className="rounded-md" aria-label="Plainview home">
          <BrandLockup compact />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "hidden h-11 items-center rounded-md px-3 text-sm text-ink-muted transition-colors duration-150 hover:text-ink sm:inline-flex",
                minimal && "sm:inline-flex",
              )}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
