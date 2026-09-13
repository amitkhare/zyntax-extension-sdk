import { describe, expect, it } from "vitest";
import { EXTENSION_TASK_MAX_ARGUMENT_BYTES, EXTENSION_TASK_MAX_ARGUMENTS_BYTES,
  isExtensionTaskArgumentLiteral } from "../src/runtimeLimits.js";
import { isExtensionExecutionArgument } from "../src/manifestConstants.js";

describe("task literal limits", () => {
  it("permits bounded UTF-8 script text only through the task validator", () => {
    expect(EXTENSION_TASK_MAX_ARGUMENT_BYTES).toBe(16384);
    expect(EXTENSION_TASK_MAX_ARGUMENTS_BYTES).toBe(65536);
    for (const value of ["", "first\r\n\tsecond", "é".repeat(8192), "🙂".repeat(4096)]) {
      expect(isExtensionTaskArgumentLiteral(value)).toBe(true);
    }
    expect(isExtensionExecutionArgument("a\nb")).toBe(false);
    expect(isExtensionExecutionArgument("a".repeat(513))).toBe(false);
  });
  it("rejects overflow, invalid Unicode and non-script controls", () => {
    for (const value of [null, "é".repeat(8193), "🙂".repeat(4097), "\0", "\u0001", "\u000b", "\u007f", "\u0085", "\ud800", "\udfff"]) {
      expect(isExtensionTaskArgumentLiteral(value)).toBe(false);
    }
  });
});
