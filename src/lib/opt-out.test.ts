import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OPT_OUT_BROKERS, OPT_OUT_NOT_IN_SCOPE } from "./opt-out.ts";

describe("opt-out catalog", () => {
  it("only lists https official destinations", () => {
    assert.ok(OPT_OUT_BROKERS.length >= 6);
    for (const broker of OPT_OUT_BROKERS) {
      assert.match(broker.optOutUrl, /^https:\/\//);
      assert.match(broker.homepage, /^https:\/\//);
      assert.ok(broker.id && broker.name);
      assert.equal(typeof broker.mayReturn, "boolean");
    }
  });

  it("uses unique ids", () => {
    const ids = OPT_OUT_BROKERS.map((b) => b.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it("documents what this page cannot remove", () => {
    assert.ok(OPT_OUT_NOT_IN_SCOPE.length >= 4);
    for (const item of OPT_OUT_NOT_IN_SCOPE) {
      assert.ok(item.name);
      assert.ok(item.reason.length > 20);
    }
  });
});
