import { LEGAL_DISCLAIMER } from "@/lib/legal.ts";

export function DisclaimerBanner() {
  return (
    <aside
      className="rounded-lg border border-line bg-canvas-elevated px-4 py-3 text-xs leading-relaxed text-ink-muted"
      aria-label="Legal notice"
    >
      {LEGAL_DISCLAIMER}
    </aside>
  );
}
