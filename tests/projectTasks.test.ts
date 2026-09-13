import { expect, expectTypeOf, it } from "vitest";
import {
  EXTENSION_API_VERSION,
  EXTENSION_PERMISSIONS,
  type ExtensionCommandTaskExecution,
  type ExtensionHostCapabilityMap,
  type ExtensionProjectScope,
  type ExtensionTaskArgument,
  type ExtensionTaskEnvironmentValue,
  type ExtensionTaskSessionUpdate,
  type ExtensionWorkspaceDocumentRequest,
  type ExtensionProcessPrepareRequest,
} from "../src/index.js";

it("uses explicit project scope and owner-scoped task lifecycle in the single host contract", () => {
  expect(EXTENSION_API_VERSION).toBe(1);
  for (const permission of ["projects", "files", "secrets", "tasks.execute", "extensions.manage", "workbench"]) {
    expect(EXTENSION_PERMISSIONS).toContain(permission);
  }
  expectTypeOf<ExtensionWorkspaceDocumentRequest["project"]>().toEqualTypeOf<ExtensionProjectScope>();
  expectTypeOf<Parameters<ExtensionHostCapabilityMap["workspace.read"]["readText"]>[0]>()
    .toEqualTypeOf<ExtensionWorkspaceDocumentRequest>();
  expectTypeOf<Awaited<ReturnType<ExtensionHostCapabilityMap["tasks.execute"]["observe"]>>>()
    .toEqualTypeOf<ExtensionTaskSessionUpdate>();
});

it("prepares framed runtimes with one credential channel and no environment binding API", () => {
  expectTypeOf<keyof ExtensionProcessPrepareRequest>().toEqualTypeOf<"project" | "tool" | "entrypoint" | "credentials">();
  expectTypeOf<ExtensionProcessPrepareRequest["credentials"]>().toEqualTypeOf<true | undefined>();
});

it("supports captured terminal commands and confines secret bindings to process environment", () => {
  const execution: ExtensionCommandTaskExecution = {
    kind: "command", command: "bash", console: "captured", workingDirectory: [],
    args: [{ kind: "projectPath", path: ["build-script"] }],
    inputs: { environment: { BUILD_PASSWORD: { kind: "secret", secret: "selected-secret" } } },
  };
  expect(execution.console).toBe("captured");
  expectTypeOf<Extract<ExtensionTaskArgument, { readonly kind: "secret" }>>().toBeNever();
  expectTypeOf<Extract<ExtensionTaskEnvironmentValue, { readonly kind: "secret" }>>()
    .toEqualTypeOf<{ readonly kind: "secret"; readonly secret: string }>();
});
