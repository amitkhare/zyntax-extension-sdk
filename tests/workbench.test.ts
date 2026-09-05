import { describe, expect, expectTypeOf, it } from "vitest";
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
});
