import { createFileRoute } from "@tanstack/react-router";
import { classifyQuery } from "@/lib/classify.ts";
import { parseFilters } from "@/lib/filters.ts";
import { SSN_REJECTION } from "@/lib/legal.ts";
import { runLookup } from "@/lib/lookup.server.ts";

export const Route = createFileRoute("/api/lookup")({
  server: {
    handlers: {
      GET: async ({ request }) => handleLookup(request),
      POST: async ({ request }) => handleLookup(request),
    },
  },
});

async function handleLookup(request: Request): Promise<Response> {
  try {
    const parsed = await readRequest(request);
    if ("error" in parsed) {
      return Response.json(parsed, { status: parsed.status });
    }
    const classified = classifyQuery(parsed.q, parsed.filters);
    if (classified.rejected === "ssn") {
      return Response.json(
        { error: "ssn", message: SSN_REJECTION, classified },
        { status: 400 },
      );
    }
    const result = await runLookup(parsed.q, parsed.filters);
    return Response.json(result);
  } catch {
    return Response.json({ error: "lookup_failed", message: "unavailable" }, { status: 500 });
  }
}

async function readRequest(
  request: Request,
): Promise<{ q: string; filters?: ReturnType<typeof parseFilters> } | { error: string; message: string; status: number }> {
  let q = "";
  let filtersInput: Record<string, unknown> = {};

  if (request.method === "GET") {
    const url = new URL(request.url);
    q = url.searchParams.get("q") ?? "";
    filtersInput = Object.fromEntries(url.searchParams.entries());
  } else {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { q?: unknown; filters?: Record<string, unknown> };
      q = typeof body.q === "string" ? body.q : "";
      filtersInput = body.filters ?? {};
    } else {
      const text = await request.text();
      if (text) {
        try {
          const body = JSON.parse(text) as { q?: unknown; filters?: Record<string, unknown> };
          q = typeof body.q === "string" ? body.q : "";
          filtersInput = body.filters ?? {};
        } catch {
          q = "";
        }
      }
    }
  }

  q = q.trim();
  if (!q) {
    return { error: "invalid", message: "Query is required.", status: 400 };
  }
  if (q.length > 300) {
    return { error: "invalid", message: "Query is too long.", status: 400 };
  }
  return { q, filters: parseFilters(filtersInput) };
}
