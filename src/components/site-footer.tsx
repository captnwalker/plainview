import { Link } from "@tanstack/react-router";
import { LEGAL_DISCLAIMER } from "@/lib/legal.ts";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6">
        <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">{LEGAL_DISCLAIMER}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link to="/about" className="text-ink hover:underline">
            About
          </Link>
          <Link to="/tools" className="text-ink hover:underline">
            Tools
          </Link>
          <Link to="/legal" className="text-ink hover:underline">
            Legal
          </Link>
          <Link to="/remove" className="text-ink hover:underline">
            Remove my listings
          </Link>
          <span className="text-ink-subtle">Not a consumer reporting agency.</span>
        </div>
      </div>
    </footer>
  );
}
