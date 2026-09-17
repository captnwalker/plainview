import { useState } from "react";
import { copyMarkdown, type ToolSection } from "@/lib/build-url.ts";
import type { ClassifiedQuery } from "@/lib/classify.ts";
import type { SearchFilters } from "@/lib/filters.ts";

export function ResultsActions({
  classified,
  sections,
  filters,
  query,
}: {
  classified: ClassifiedQuery;
  sections: ToolSection[];
  filters: SearchFilters;
  query: string;
}) {
  const [note, setNote] = useState<string | null>(null);
  const topLinks = (sections.find((s) => s.id === "best")?.links ?? sections[0]?.links ?? []).slice(0, 5);

  async function copyQuery() {
    await navigator.clipboard.writeText(query);
    setNote("Query copied.");
  }

  async function copyMd() {
    await navigator.clipboard.writeText(copyMarkdown(classified, sections, filters));
    setNote("Markdown copied. This is a list of links, not a report.");
  }

  function openTop() {
    let opened = 0;
    for (const link of topLinks) {
      const win = window.open(link.url, "_blank", "noopener,noreferrer");
      if (win) opened += 1;
    }
    setNote(
      opened < topLinks.length
        ? "Your browser blocked some tabs. Allow pop-ups for this site to open the top five links."
        : "Opened the first five destinations in new tabs.",
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyQuery()}
          className="inline-flex h-11 items-center rounded-md border border-line px-3 text-sm text-ink hover:bg-canvas-elevated"
        >
          Copy query
        </button>
        <button
          type="button"
          onClick={openTop}
          className="inline-flex h-11 items-center rounded-md border border-line px-3 text-sm text-ink hover:bg-canvas-elevated"
        >
          Open top 5 in new tabs
        </button>
        <button
          type="button"
          onClick={() => void copyMd()}
          className="inline-flex h-11 items-center rounded-md border border-line px-3 text-sm text-ink hover:bg-canvas-elevated"
        >
          Copy markdown
        </button>
      </div>
      {note ? (
        <p className="text-sm text-ink-muted" role="status">
          {note}
        </p>
      ) : (
        <p className="text-sm text-ink-subtle">No dossier download. Links only.</p>
      )}
    </div>
  );
}
