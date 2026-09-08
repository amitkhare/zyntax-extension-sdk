import { describe, expect, it } from "vitest";
import fixture from "../fixtures/manifest-conformance.json" with { type: "json" };
import { matchesFileOpener, parseFileOpenerOptions, type WorkbenchContribution } from "../src/index.js";

describe("declarative system file actions", () => {
  it.each(fixture.fileOpeners.cases)("validates shared operation fields: %j", ({ patch, valid }) => {
    const parse = () => parseFileOpenerOptions({ ...fixture.fileOpeners.base, ...patch });
    if (valid) expect(parse).not.toThrow();
    else expect(parse).toThrow(TypeError);
  });

  it("matches compound extensions and extensionless names without provider code", () => {
    const action: WorkbenchContribution = {
      kind: "fileOpener", id: "view", placement: "explorer.file", label: "Open",
      ...parseFileOpenerOptions({
        extensions: [".tar.gz"], filenames: ["LICENSE"], mimeType: "application/gzip", requiredPermissions: [],
      }),
    };
    expect(matchesFileOpener(action, "Archive.TAR.GZ")).toBe(true);
    expect(matchesFileOpener(action, "license")).toBe(true);
    expect(matchesFileOpener(action, "archive.zip")).toBe(false);
    expect(matchesFileOpener(action, "archive.tar.gz.txt")).toBe(false);
  });
});
