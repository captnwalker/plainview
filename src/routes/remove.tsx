import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CHECKLIST_STATUSES,
  OPT_OUT_BROKERS,
  OPT_OUT_NOT_IN_SCOPE,
  type ChecklistStatus,
  type OptOutBroker,
} from "@/lib/opt-out.ts";
import { clearChecklist, readChecklist, setChecklistStatus, type ChecklistState } from "@/lib/opt-out-checklist.ts";

export const Route = createFileRoute("/remove")({
  component: RemovePage,
  head: () => ({ meta: [{ title: "Remove my listings · Plainview" }] }),
});

const ATTESTATION =
  "I am requesting help removing my own information. I will not submit an opt-out for anyone else.";

function RemovePage() {
  const [attested, setAttested] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistState>({});

  useEffect(() => {
    setChecklist(readChecklist());
  }, []);

  function updateStatus(id: string, status: ChecklistStatus) {
    setChecklist(setChecklistStatus(id, status));
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl">Remove my listings</h1>
      <p className="mt-4 text-ink-muted">
        This page sends you to each people-search site’s <strong>official</strong> opt-out form so you can
        request removal of <strong>your</strong> row. Plainview does not submit the form, solve CAPTCHAs,
        read your email, or store these requests on a server.
      </p>

      <div className="mt-6 rounded-xl border border-line bg-canvas-elevated p-4 text-sm leading-relaxed text-ink-muted">
        <p>
          Opt-out is for the person in the listing (or a legally authorized agent on that site’s own form).
          Submitting a request in someone else’s name is not offered here and is not allowed.
        </p>
        <p className="mt-2">
          One site does not clear the others. Listings often return after the next public-records refresh.
          Recheck in a few months.
        </p>
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong p-4 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-[var(--pv-accent)]"
          checked={attested}
          onChange={(event) => setAttested(event.target.checked)}
        />
        <span>{ATTESTATION}</span>
      </label>

      {!attested ? (
        <p className="mt-4 text-sm text-ink-subtle">
          Check the box above to enable official-form links and the local checklist. Search results never
          include a “remove this person” button.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Sites that publish a self-service opt-out</h2>
        <p className="mt-2 text-sm text-ink-muted">
          If an official URL has moved, open the homepage and look in the footer for Opt out or Do not sell
          my personal information.
        </p>
        <ul className="mt-6 space-y-4">
          {OPT_OUT_BROKERS.map((broker) => (
            <BrokerCard
              key={broker.id}
              broker={broker}
              attested={attested}
              status={checklist[broker.id] ?? "idle"}
              onStatus={(status) => updateStatus(broker.id, status)}
            />
          ))}
        </ul>
        {attested ? (
          <button
            type="button"
            className="mt-4 text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            onClick={() => {
              clearChecklist();
              setChecklist({});
            }}
          >
            Clear checklist on this browser
          </button>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">What this page cannot remove</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {OPT_OUT_NOT_IN_SCOPE.map((item) => (
            <li key={item.name} className="py-3">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-ink-muted">{item.reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-ink-muted">
        Paid services such as Optery, DeleteMe, or Incogni resubmit opt-outs on a schedule if you want that.
        They are separate companies. Plainview does not send them your data.
      </p>
      <p className="mt-4 text-sm text-ink-muted">
        See also <Link to="/legal" className="text-accent hover:underline">Legal</Link> and{" "}
        <Link to="/tools" className="text-accent hover:underline">Tools</Link>.
      </p>
    </main>
  );
}

function BrokerCard({
  broker,
  attested,
  status,
  onStatus,
}: {
  broker: OptOutBroker;
  attested: boolean;
  status: ChecklistStatus;
  onStatus: (status: ChecklistStatus) => void;
}) {
  return (
    <li className="rounded-xl border border-line bg-canvas-elevated p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">{broker.name}</h3>
        {broker.mayReturn ? (
          <span className="text-xs uppercase tracking-wide text-ink-subtle">May relist</span>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-2 text-sm text-ink-muted sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">How</dt>
          <dd>{broker.method}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">They ask for</dt>
          <dd>{broker.asksFor}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">Confirm</dt>
          <dd>{broker.confirm}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">Typical lag</dt>
          <dd>{broker.typicalLag}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-ink-muted">{broker.notes}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {attested ? (
          <a
            href={broker.optOutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-fg"
            onClick={() => {
              if (status === "idle") onStatus("requested");
            }}
          >
            Open official form
          </a>
        ) : (
          <span className="inline-flex h-10 items-center rounded-md border border-line px-3 text-sm text-ink-subtle">
            Attest first to enable the link
          </span>
        )}
        <a
          href={broker.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-muted hover:underline"
        >
          Homepage
        </a>
      </div>
      {attested ? (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-ink-subtle">On this browser</span>
          <select
            className="h-10 rounded-md border border-line bg-canvas px-2 text-ink"
            value={status}
            onChange={(event) => onStatus(event.target.value as ChecklistStatus)}
          >
            {CHECKLIST_STATUSES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </li>
  );
}
