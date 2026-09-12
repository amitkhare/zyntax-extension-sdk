import { describe, expect, it } from "vitest";
import fixture from "../fixtures/textmate-selector-conformance.json" with { type: "json" };
import { parseTextMateSelector, TEXTMATE_SELECTOR_RULES, type TextMateSelector } from "../src/index.js";

describe("bounded TextMate scope selectors", () => {
  it.each(fixture.cases)("validates shared selector: $selector", (entry) => {
    if (!entry.valid) {
      expect(() => parseTextMateSelector(entry.selector)).toThrow(TypeError);
      return;
    }
    const result = parseTextMateSelector(entry.selector);
    if ("ast" in entry) expect(result).toEqual(entry.ast);
    expectFrozen(result);
  });

  it("exports immutable limits and rejects all unsupported control characters", () => {
    expect(Object.isFrozen(TEXTMATE_SELECTOR_RULES)).toBe(true);
    for (let code = 0; code < 32; code++) {
      if (code === 9) continue;
      expect(() => parseTextMateSelector("source" + String.fromCharCode(code) + "string")).toThrow(TypeError);
    }
  });

  it("preserves repeated scopes and every exclusion without selector rewriting", () => {
    expect(parseTextMateSelector("source string source - (source > comment)")).toEqual({
      type: "all",
      terms: [
        { type: "path", scopes: ["source", "string", "source"], relations: ["descendant", "descendant"] },
        { type: "not", term: { type: "path", scopes: ["source", "comment"], relations: ["child"] } },
      ],
    });
  });
});

function expectFrozen(selector: TextMateSelector): void {
  expect(Object.isFrozen(selector)).toBe(true);
  if (selector.type === "path") {
    expect(Object.isFrozen(selector.scopes)).toBe(true);
    expect(Object.isFrozen(selector.relations)).toBe(true);
    expect(selector.relations).toHaveLength(selector.scopes.length - 1);
  } else if (selector.type === "not") expectFrozen(selector.term);
  else {
    expect(Object.isFrozen(selector.terms)).toBe(true);
    for (const term of selector.terms) expectFrozen(term);
  }
}
