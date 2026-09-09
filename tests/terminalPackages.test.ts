import { describe, expectTypeOf, it } from "vitest";
import type {
  ExtensionTerminalPackageSelection,
  ExtensionTerminalPackageStackInspection,
  ExtensionTerminalPackageTransactionRequest,
  ExtensionTerminalPackageTransactionSnapshot,
  ExtensionTerminalPackageVersion,
  ExtensionTerminalPackagesApi,
} from "../src/contracts/terminalPackages.js";
import type { ExtensionCancellationToken } from "../src/contract.js";

describe("terminal package contract", () => {
  it("supports cancellable signed-index refresh and event-driven transaction completion", () => {
    expectTypeOf<Parameters<ExtensionTerminalPackagesApi["refreshStack"]>>()
      .toEqualTypeOf<[string, ExtensionCancellationToken]>();
    expectTypeOf<Awaited<ReturnType<ExtensionTerminalPackagesApi["refreshStack"]>>>()
      .toEqualTypeOf<ExtensionTerminalPackageStackInspection>();
    expectTypeOf<Parameters<ExtensionTerminalPackagesApi["waitTransaction"]>>()
      .toEqualTypeOf<[string, ExtensionCancellationToken]>();
    expectTypeOf<Awaited<ReturnType<ExtensionTerminalPackagesApi["waitTransaction"]>>>()
      .toEqualTypeOf<ExtensionTerminalPackageTransactionSnapshot>();
  });
  it("requires explicit stack-local selections and exact versions for every operation", () => {
    expectTypeOf<Parameters<ExtensionTerminalPackagesApi["requestTransaction"]>[0]>()
      .toEqualTypeOf<ExtensionTerminalPackageTransactionRequest>();
    expectTypeOf<ExtensionTerminalPackageTransactionRequest["intent"]>()
      .toEqualTypeOf<"install" | "repair" | "update" | "remove">();
    expectTypeOf<ExtensionTerminalPackageTransactionRequest["packages"]>()
      .toEqualTypeOf<readonly ExtensionTerminalPackageSelection[]>();
    expectTypeOf<{ stack: string; intent: "install" }>()
      .not.toExtend<ExtensionTerminalPackageTransactionRequest>();
    expectTypeOf<{ id: string }>().not.toExtend<ExtensionTerminalPackageSelection>();
    expectTypeOf<{ package: string; version: string }>()
      .not.toExtend<ExtensionTerminalPackageSelection>();
  });

  it("reports installed and available versions without exposing repository internals", () => {
    type Package = ExtensionTerminalPackageStackInspection["packages"][number];
    expectTypeOf<Package["installedVersion"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Package["candidateVersion"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Package["versions"]>()
      .toEqualTypeOf<readonly ExtensionTerminalPackageVersion[]>();
    expectTypeOf<keyof ExtensionTerminalPackageVersion>()
      .toEqualTypeOf<"version" | "architecture">();
  });
});
