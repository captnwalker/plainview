import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildToolUrl, hyphenName, slugify, templateVars, toolsForQuery } from "./build-url.ts";
import { classifyQuery } from "./classify.ts";
import { TOOLS } from "./tools.ts";

describe("slug helpers", () => {
  it("slugifies names", () => {
    assert.equal(slugify("Jane Q. Public"), "jane-q-public");
    assert.equal(hyphenName("Jane Q. Public"), "Jane-Q.-Public");
  });
});

describe("buildToolUrl", () => {
  it("prefills TruePeopleSearch with name and city/state", () => {
    const classified = classifyQuery("Jane Q. Public", {
      ageMin: "",
      ageMax: "",
      city: "Fort Myers",
      state: "FL",
      country: "United States",
      username: "",
    });
    const tool = TOOLS.find((t) => t.id === "truepeoplesearch");
    assert.ok(tool);
    const link = buildToolUrl(tool, templateVars(classified, { ageMin: "", ageMax: "", city: "Fort Myers", state: "FL", country: "United States", username: "" }));
    assert.equal(link.prefilled, true);
    assert.match(link.url, /truepeoplesearch\.com\/results/);
    assert.match(link.url, /Jane/);
    assert.match(link.url, /Fort/);
  });

  it("falls back to homepage when a required identity field is missing", () => {
    const classified = classifyQuery("8.8.8.8");
    const tool = TOOLS.find((t) => t.id === "hibp");
    assert.ok(tool);
    const link = buildToolUrl(tool, templateVars(classified));
    assert.equal(link.prefilled, false);
    assert.equal(link.url, tool.homepage);
  });

  it("builds a GitHub profile URL for usernames", () => {
    const classified = classifyQuery("@octocat");
    const tool = TOOLS.find((t) => t.id === "github-user");
    assert.ok(tool);
    const link = buildToolUrl(tool, templateVars(classified));
    assert.equal(link.url, "https://github.com/octocat");
  });

  it("groups person-name tools with a Best first moves section", () => {
    const sections = toolsForQuery(classifyQuery("Jane Q. Public"));
    const ids = sections.map((s) => s.id);
    assert.ok(ids.includes("best"));
    assert.ok(ids.includes("us-records"));
    assert.ok(ids.includes("advanced"));
    const advanced = sections.find((s) => s.id === "advanced");
    assert.ok(advanced?.links.some((l) => l.tool.id === "spokeo"));
    assert.ok(!advanced?.links.some((l) => /checkmate|truthfinder|beenverified|fastbackgroundcheck/i.test(l.tool.id)));
  });

  it("hides infrastructure tools for a person name", () => {
    const sections = toolsForQuery(classifyQuery("Jane Q. Public"));
    assert.ok(!sections.some((s) => s.id === "infra"));
  });

  it("shows infrastructure tools for a domain", () => {
    const sections = toolsForQuery(classifyQuery("example.com"));
    assert.ok(sections.some((s) => s.id === "infra"));
    const infra = sections.find((s) => s.id === "infra");
    assert.ok(infra?.links.some((l) => l.tool.id === "crtsh"));
  });
});
