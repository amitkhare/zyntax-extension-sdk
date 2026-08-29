/** One selected-runtime capability required by an extension. */
export interface ExtensionSelectedRuntimeRequirement {
  /** Manifest-local identity referenced by selected-runtime execution plans. */
  readonly id: string;
  /** Canonical runtime family shared by providers and consumers, such as `python`. */
  readonly runtime: string;
  /** Strict conjunctive semantic-version range. */
  readonly version: string;
  readonly capabilities: readonly string[];
}

/** A bounded version probe for one exact runtime executable. */
export interface ExtensionRuntimeVersionProbe {
  readonly arguments: readonly string[];
  readonly stream: "stdout" | "stderr";
  /** Exact text before the first semantic-version token in the selected stream. */
  readonly prefix: string;
}

/** A package-owned executable inside the app's terminal runtime prefix. */
export interface ExtensionTerminalPackageRuntimeSource {
  readonly kind: "terminalPackage";
  /** Development-stack contribution declared by the same manifest. */
  readonly stack: string;
  /** Stack-local terminal-package requirement identity. */
  readonly package: string;
  /** Normalized prefix-relative regular file owned by the declared package. */
  readonly executable: string;
  readonly versionProbe: ExtensionRuntimeVersionProbe;
}

/** Declarative discovery of one user-installed runtime without PATH lookup. */
export interface ExtensionRuntimeProviderContribution {
  readonly id: string;
  readonly runtime: string;
  readonly label: string;
  readonly capabilities: readonly string[];
  readonly source: ExtensionTerminalPackageRuntimeSource;
}

/** Opaque identity of one exact runtime observation. No native path is exposed. */
export interface ExtensionRuntimeIdentity {
  readonly providerId: string;
  readonly runtimeId: string;
  /** Changes when the selected executable or its owning package changes. */
  readonly fingerprint: string;
}

/** Public metadata for one available selected-runtime candidate. */
export interface ExtensionRuntimeDescriptor {
  readonly identity: ExtensionRuntimeIdentity;
  readonly runtime: string;
  readonly label: string;
  readonly version: string;
  readonly capabilities: readonly string[];
}

export type ExtensionRuntimeSelectionScope = "device" | "project";

export type ExtensionRuntimeUnavailableReason =
  | "notSelected"
  | "missing"
  | "changed"
  | "incompatible"
  | "probeFailed";

/** Host-owned resolution of a selected-runtime requirement. */
export type ExtensionRuntimeSelection =
  | {
      readonly state: "ready";
      readonly scope: ExtensionRuntimeSelectionScope;
      readonly runtime: ExtensionRuntimeDescriptor;
    }
  | {
      readonly state: "unavailable";
      readonly scope: ExtensionRuntimeSelectionScope | null;
      readonly selected: ExtensionRuntimeIdentity | null;
      readonly reason: ExtensionRuntimeUnavailableReason;
      /** Bounded diagnostic suitable for a precise user-facing notification. */
      readonly detail: string;
    };

/** Symbolic selected-runtime route. The host resolves the exact executable. */
export interface ExtensionSelectedRuntimeExecutionBase {
  readonly kind: "selectedRuntime";
  readonly requirement: string;
  readonly arguments: readonly string[];
}
