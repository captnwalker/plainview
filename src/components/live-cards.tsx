import { ExternalLink } from "lucide-react";
import type { LiveSourceCard, SourceStatus } from "@/lib/lookup-types.ts";
import { cn } from "@/lib/cn.ts";

const STATUS_LABEL: Record<SourceStatus, string> = {
  ok: "Live",
  empty: "No hit",
  unavailable: "Unavailable",
  rate_limited: "Rate limited",
  skipped: "Skipped",
};

export function LiveCards({ cards, loading }: { cards: LiveSourceCard[]; loading: boolean }) {
  if (loading && cards.length === 0) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border border-line bg-canvas-elevated" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards
        .filter((card) => card.status !== "skipped")
        .map((card) => (
          <article key={card.id} className="rounded-xl border border-line bg-canvas-elevated p-4">
            <header className="mb-2 flex items-start justify-between gap-3">
              <h3 className="font-medium text-ink">{card.title}</h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                  card.status === "ok" && "bg-accent/10 text-accent",
                  card.status === "empty" && "text-ink-muted",
                  (card.status === "unavailable" || card.status === "rate_limited") && "text-warn",
                )}
              >
                {STATUS_LABEL[card.status]}
              </span>
            </header>
            <p className="text-sm leading-relaxed text-ink-muted">{card.summary}</p>
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt=""
                className="mt-3 size-16 rounded-md border border-line object-cover"
              />
            ) : null}
            {card.fields && card.fields.length > 0 ? (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {card.fields.map((field) => (
                  <div key={field.label} className="contents">
                    <dt className="text-ink-subtle">{field.label}</dt>
                    <dd className="min-w-0 truncate text-ink">{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {card.items && card.items.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {card.items.map((item) => (
                  <li key={item.title + (item.url ?? "")}>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <span className="text-ink">{item.title}</span>
                    )}
                    {item.detail ? <span className="block text-ink-muted">{item.detail}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {card.outboundUrl ? (
              <a
                href={card.outboundUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                Open source <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </article>
        ))}
    </div>
  );
}
