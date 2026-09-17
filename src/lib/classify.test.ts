import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyQuery, looksLikeSsn } from "./classify.ts";

describe("looksLikeSsn", () => {
  it("rejects dashed and nine-digit SSN shapes", () => {
    assert.equal(looksLikeSsn("123-45-6789"), true);
    assert.equal(looksLikeSsn("123 45 6789"), true);
    assert.equal(looksLikeSsn("123456789"), true);
  });

  it("does not treat ZIP+4 or 10-digit phones as SSNs", () => {
    assert.equal(looksLikeSsn("33901-1234"), false);
    assert.equal(looksLikeSsn("9415550142"), false);
    assert.equal(looksLikeSsn("Jane Q. Public"), false);
  });
});

describe("classifyQuery", () => {
  it("rejects SSN input and stops", () => {
    const result = classifyQuery("123-45-6789");
    assert.equal(result.rejected, "ssn");
    assert.equal(result.type, "unknown");
  });

  it("classifies email and lowercases it", () => {
    const result = classifyQuery("Name@Example.COM");
    assert.equal(result.type, "email");
    assert.equal(result.email, "name@example.com");
    assert.equal(result.domain, "example.com");
    assert.ok(result.secondaryTypes.includes("domain"));
  });

  it("classifies a US phone into E.164", () => {
    const result = classifyQuery("941-555-0142");
    assert.equal(result.type, "phone");
    assert.equal(result.phoneE164, "+19415550142");
    assert.ok(result.phoneNational);
  });

  it("classifies +1 phones", () => {
    const result = classifyQuery("+1 415 555 2671");
    assert.equal(result.type, "phone");
    assert.equal(result.phoneE164, "+14155552671");
  });

  it("classifies person names and strips honorifics", () => {
    const result = classifyQuery("Dr. Jane Q. Public");
    assert.equal(result.type, "person_name");
    assert.equal(result.displayName, "Jane Q. Public");
    assert.ok(result.honorific?.toLowerCase().startsWith("dr"));
    assert.equal(result.givenName, "Jane");
    assert.equal(result.familyName, "Public");
    assert.ok(result.nameVariants?.includes("Jane Public"));
  });

  it("classifies Last, First", () => {
    const result = classifyQuery("Public, Jane");
    assert.equal(result.type, "person_name");
    assert.equal(result.displayName, "Jane Public");
  });

  it("classifies usernames and strips @", () => {
    const result = classifyQuery("@handle_one");
    assert.equal(result.type, "username");
    assert.equal(result.username, "handle_one");
  });

  it("classifies a US address with ZIP", () => {
    const result = classifyQuery("512 Maple Ave, Fort Myers, FL 33901");
    assert.equal(result.type, "us_address");
    assert.equal(result.city, "Fort Myers");
    assert.equal(result.state, "FL");
    assert.equal(result.zip, "33901");
  });

  it("classifies ipv4, ipv6, domain, and url", () => {
    assert.equal(classifyQuery("8.8.8.8").type, "ipv4");
    assert.equal(classifyQuery("2001:4860:4860::8888").type, "ipv6");
    assert.equal(classifyQuery("example.com").type, "domain");
    const url = classifyQuery("https://www.example.com/path");
    assert.equal(url.type, "url");
    assert.ok(url.secondaryTypes.includes("domain"));
    assert.equal(url.domain, "example.com");
  });

  it("applies city and username filters", () => {
    const result = classifyQuery("Jane Public", { ageMin: "", ageMax: "", city: "Miami", state: "FL", country: "United States", username: "janep" });
    assert.equal(result.city, "Miami");
    assert.equal(result.state, "FL");
    assert.equal(result.username, "janep");
    assert.ok(result.secondaryTypes.includes("username"));
  });
});
