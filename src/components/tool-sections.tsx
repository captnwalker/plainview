import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { BuiltToolLink, ToolSection } from "@/lib/build-url.ts";
import { cn } from "@/lib/cn.ts";

export function ToolSections({ sections }: { sections: ToolSection[] }) {
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`group-${section.id}`}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 id={`group-${section.id}`} className="font-serif text-xl text-ink">
              {section.title}
            </h2>
            {section.id === "advanced" ? (
              <span className="text-xs font-medium uppercase tracking-wide text-warn">Paid / advanced</span>
            ) : null}
          </div>
          {section.hint ? <p className="mb-3 text-sm text-ink-muted">{section.hint}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {section.links.map((link) => (
              <ToolCard key={link.tool.id} link={link} advanced={section.id === "advanced"} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ToolCard({ link, advanced }: { link: BuiltToolLink; advanced?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-line bg-canvas-elevated p-4",
        advanced && "border-dashed",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-ink">{link.tool.name}</h3>
        <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-subtle">
          {link.tool.region}
        </span>
      </header>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-muted">{link.tool.blurb}</p>
      {!link.prefilled ? (
        <p className="mt-2 text-xs text-ink-subtle">Opens the homepage — copy the query if the site has no prefill.</p>
      ) : null}
      {link.tool.paid ? <p className="mt-2 text-xs text-warn">Paid destination</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Open <ExternalLink className="size-3.5" />
        </a>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className="inline-flex h-11 items-center gap-1.5 rounded-md border border-line px-3 text-sm text-ink hover:bg-canvas"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy URL"}
        </button>
      </div>
    </article>
  );
}
