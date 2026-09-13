import { describe, expect, expectTypeOf, it } from "vitest";
import {
  EXTENSION_HOST_API_INTERACTIVE_METHODS,
  EXTENSION_HOST_API_METHODS,
  EXTENSION_PERMISSIONS,
  type ExtensionDebugApi,
  type ExtensionDebugConfiguration,
  type ExtensionDebugLaunch,
  type ExtensionDebugPreparedProcess,
  type ExtensionDebugSessionSnapshot,
  type ExtensionDebugWorkspaceContext,
  type ExtensionEditorApi,
  type ExtensionEditorEvent,
  type ExtensionEditorMarker,
  type ExtensionEditorUpdate,
  type ExtensionHostApi,
  type ExtensionProcessesApi,
  type ExtensionProcessSnapshot,
  type ExtensionProcessUpdate,
  type ExtensionProjectScope,
  type WorkbenchIconId,
} from "../src/index.js";

describe("extension-owned protocol workbench contracts", () => {
  it("separates provider preparation, generic transport and editor permissions", () => {
    for (const permission of ["debug.execute", "editor", "processes.execute"]) {
      expect(EXTENSION_PERMISSIONS).toContain(permission);
    }
    expectTypeOf<ExtensionHostApi<"debug.execute">["debug.execute"]>().toEqualTypeOf<ExtensionDebugApi>();
    expectTypeOf<ExtensionHostApi<"processes.execute">["processes.execute"]>().toEqualTypeOf<ExtensionProcessesApi>();
    expectTypeOf<ExtensionHostApi<"editor">["editor"]>().toEqualTypeOf<ExtensionEditorApi>();
    expect(EXTENSION_HOST_API_METHODS["debug.execute"]).toEqual([
      "context", "configurations", "bindConfiguration", "selectPath", "prepare",
    ]);
    expectTypeOf<Extract<keyof ExtensionDebugApi, "start" | "stop" | "request" | "observe">>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof ExtensionProcessesApi, "spawn" | "shell" | "adapterPath">>().toEqualTypeOf<never>();
  });

  it("keeps launch and process preparation identities opaque", () => {
    expectTypeOf<keyof ExtensionDebugLaunch>().toEqualTypeOf<"id" | "configuration">();
    expectTypeOf<ExtensionDebugLaunch["configuration"]>().toEqualTypeOf<ExtensionDebugConfiguration>();
    expectTypeOf<ExtensionDebugWorkspaceContext["project"]>().toEqualTypeOf<ExtensionProjectScope>();
    expectTypeOf<Extract<keyof ExtensionDebugWorkspaceContext, "breakpoints">>().toEqualTypeOf<never>();
    expectTypeOf<Awaited<ReturnType<ExtensionDebugApi["prepare"]>>>().toEqualTypeOf<ExtensionDebugPreparedProcess>();
    expectTypeOf<keyof ExtensionDebugPreparedProcess>().toEqualTypeOf<"ticket" | "configuration">();
    expectTypeOf<Awaited<ReturnType<ExtensionDebugApi["selectPath"]>>>().toEqualTypeOf<string | null>();
  });

  it("retains the minimal provider-era snapshot without core protocol state in transport", () => {
    const legacy: ExtensionDebugSessionSnapshot = {
      id: "session", state: "running", breakpoints: [],
      configuration: { type: "example", request: "launch", name: "Example" },
    };
    const process: ExtensionProcessSnapshot = { id: "owned", state: "terminated", cleanupPending: false, error: "Protocol queue exceeded its limit" };
    expect(legacy.state).toBe("running");
    expect(process.error).toContain("limit");
    expectTypeOf<keyof ExtensionProcessSnapshot>().toEqualTypeOf<"id" | "state" | "cleanupPending" | "error">();
    expectTypeOf<Awaited<ReturnType<ExtensionProcessesApi["observe"]>>>().toEqualTypeOf<ExtensionProcessUpdate>();
    expectTypeOf<ExtensionProcessUpdate["messages"][number]["cursor"]>().toEqualTypeOf<number>();
    for (const method of ["processes.execute:observe", "processes.execute:open", "debug.execute:selectPath", "debug.execute:prepare", "editor:observe", "editor:save"]) {
      expect(EXTENSION_HOST_API_INTERACTIVE_METHODS).toContain(method);
    }
  });

  it("uses generic mapped markers and interactions without debugger-specific persistence", () => {
    const marker: ExtensionEditorMarker = { id: "point", uri: "file:///project/main.py", line: 4, icon: "circle", filled: true, tone: "danger", label: "Source annotation" };
    const event: ExtensionEditorEvent = { kind: "markers", group: "annotations", markers: [marker] };
    const icons: readonly WorkbenchIconId[] = ["bug", "pause", "stop", "step-over", "step-into", "step-out"];
    expect(event.markers[0]).toEqual(marker);
    expect(icons).toHaveLength(6);
    expectTypeOf<Awaited<ReturnType<ExtensionEditorApi["observe"]>>>().toEqualTypeOf<ExtensionEditorUpdate>();
    expectTypeOf<Awaited<ReturnType<ExtensionEditorApi["resolvePath"]>>>().toEqualTypeOf<{ readonly uri: string } | null>();
    expectTypeOf<Extract<keyof ExtensionEditorApi, "setBreakpoints" | "saveWatches" | "debugSession">>().toEqualTypeOf<never>();
  });
});
