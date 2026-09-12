import { describe, expect, expectTypeOf, it } from "vitest";
import fixture from "../fixtures/manifest-conformance.json" with { type: "json" };
import type { ExtensionViewProjectLifecycleEvent } from "../src/index.js";
import type {
  ExtensionViewHostResponse,
  ExtensionWorkbenchApi,
  WorkbenchIcon,
  WorkbenchPanelContribution,
  WorkbenchPanelUpdate,
  WorkbenchPresentation,
  WorkbenchPresentationColor,
  WorkbenchResolvedIcons,
} from "../src/contracts/workbench.js";

describe("workbench public contract", () => {
  it("reuses declarative panels in dialogs and accepts themed file icons", () => {
    const panel: WorkbenchPanelContribution = {
      kind: "panel",
      id: "project-tools",
      placement: "dialog",
      title: "Project tools",
      icon: { kind: "folder", path: "workspace", root: true },
      view: {
        kind: "list",
        ariaLabel: "Build outputs",
        items: [{ id: "output", label: "Application", icon: "file" }],
      },
    };
    const update: WorkbenchPanelUpdate = { busy: true };
    expect(panel.placement).toBe("dialog");
    expect(update.view).toBeUndefined();
    expectTypeOf<NonNullable<typeof panel.icon>>().toEqualTypeOf<WorkbenchIcon>();
  });

  it("carries shared presentation and revision-bound icon results without host internals", () => {
    expectTypeOf<
      Extract<ExtensionViewHostResponse, { type: "presentation" }>["presentation"]
    >().toEqualTypeOf<WorkbenchPresentation>();
    expectTypeOf<
      Awaited<ReturnType<ExtensionWorkbenchApi["resolveIcons"]>>
    >().toEqualTypeOf<WorkbenchResolvedIcons>();
    expectTypeOf<WorkbenchResolvedIcons["icons"][number]>()
      .toEqualTypeOf<`data:image/svg+xml;base64,${string}`>();
    expectTypeOf<keyof WorkbenchPresentation["colors"]>()
      .toEqualTypeOf<WorkbenchPresentationColor>();
    expectTypeOf<Extract<keyof WorkbenchPresentation, "nativeBridge" | "assetsPath">>()
      .toEqualTypeOf<never>();
  });

  it("exports owner-scoped project lifecycle notices on the existing view bridge", () => {
    expectTypeOf<
      Extract<ExtensionViewHostResponse, { type: "projectLifecycle" }>
    >().toEqualTypeOf<ExtensionViewProjectLifecycleEvent>();
    expectTypeOf<keyof ExtensionViewProjectLifecycleEvent>()
      .toEqualTypeOf<"type" | "revision" | "closedProjects">();
    expectTypeOf<ExtensionViewProjectLifecycleEvent["closedProjects"]>()
      .toEqualTypeOf<readonly string[]>();

    const received: ExtensionViewHostResponse = {
      type: "projectLifecycle",
      revision: 4,
      closedProjects: ["project-selected-root", "project-selected-child"],
    };
    expect(received).toEqual(fixture.customViewEvents.projectLifecycle[1]);
    for (const event of fixture.customViewEvents.projectLifecycle) {
      expect(event.type).toBe("projectLifecycle");
      expect(Number.isSafeInteger(event.revision) && event.revision > 0).toBe(true);
      expect(event.closedProjects.length).toBeGreaterThan(0);
      expect(new Set(event.closedProjects).size).toBe(event.closedProjects.length);
      expect(Object.keys(event).sort()).toEqual(["closedProjects", "revision", "type"]);
    }
  });
});
