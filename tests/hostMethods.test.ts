import { expect, expectTypeOf, it } from "vitest";
import fixture from "../fixtures/manifest-conformance.json" with { type: "json" };
import {
  EXTENSION_HOST_API_METHODS,
  EXTENSION_HOST_API_INTERACTIVE_METHODS,
  type ExtensionHostCapabilityMap,
} from "../src/index.js";

it("covers every declared host method with one immutable inventory", () => {
  type Inventory = typeof EXTENSION_HOST_API_METHODS;
  expectTypeOf<{ [T in keyof Inventory]: Inventory[T][number] }>().toEqualTypeOf<{
    readonly [T in keyof ExtensionHostCapabilityMap]: keyof ExtensionHostCapabilityMap[T];
  }>();
  expect(Object.isFrozen(EXTENSION_HOST_API_METHODS)).toBe(true);
  for (const methods of Object.values(EXTENSION_HOST_API_METHODS)) {
    expect(Object.isFrozen(methods)).toBe(true);
    expect(new Set(methods).size).toBe(methods.length);
  }
});

it("declares interaction waits only for known capability methods", () => {
  const methods: Readonly<Record<string, readonly string[]>> = EXTENSION_HOST_API_METHODS;
  const interactive = new Set<string>(EXTENSION_HOST_API_INTERACTIVE_METHODS);
  expect(Object.isFrozen(EXTENSION_HOST_API_INTERACTIVE_METHODS)).toBe(true);
  for (const id of interactive) {
    const [capability, method] = id.split(":");
    expect(methods[capability]).toContain(method);
  }
  for (const item of fixture.hostMethods.cases) {
    expect(methods[item.capability]?.includes(item.method) === true).toBe(item.valid);
    expect(interactive.has(`${item.capability}:${item.method}`)).toBe(item.interactive);
  }
});
