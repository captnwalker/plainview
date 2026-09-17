import { createFileRoute } from "@tanstack/react-router";
import { GROUP_META, TOOLS } from "@/lib/tools.ts";

export const Route = createFileRoute("/tools")({
  component: ToolsPage,
  head: () => ({ meta: [{ title: "Tools · Plainview" }] }),
});

function ToolsPage() {
  const groups = GROUP_META.filter((g) => g.id !== "best");
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl">Tools</h1>
      <p className="mt-4 text-ink-muted">
        Outbound sources Plainview can link to. We do not scrape these sites. Their data is unverified.
        None of them are offered as a consumer report.
      </p>
      {groups.map((group) => {
        const tools = TOOLS.filter((t) => t.group === group.id);
        if (!tools.length) return null;
        const unique = [...new Map(tools.map((t) => [t.homepage, t])).values()];
        return (
          <section key={group.id} className="mt-10">
            <h2 className="font-serif text-2xl">{group.title}</h2>
            {group.hint ? <p className="mt-1 text-sm text-ink-muted">{group.hint}</p> : null}
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {unique.map((tool) => (
                <li key={tool.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <a
                      href={tool.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-ink hover:underline"
                    >
                      {tool.name.replace(/ \(.+\)$/, "")}
                    </a>
                    <p className="text-sm text-ink-muted">{tool.blurb}</p>
                  </div>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-ink-subtle">
                    {tool.region}
                    {tool.paid ? " · paid" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
