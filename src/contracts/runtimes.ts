/** One development-runtime capability required by an extension. */
export interface ExtensionRuntimeRequirement {
  /** Manifest-local identity referenced by runtime execution plans. */
  readonly id: string;
  /** Stable runtime family, such as `python`, `node`, `java`, or `rust`. */
  readonly runtime: string;
  /** Inclusive semantic-version floor. Extensions do not pin or cap the selected version. */
  readonly minimumVersion: string;
  readonly capabilities: readonly string[];
}

/** One symbolic command exposed by a terminal-package runtime provider. */
export interface ExtensionTerminalPackageRuntimeCommand {
  readonly id: string;
  /** Normalized prefix-relative regular file owned by the terminal package. */
  readonly executable: string;
}

/** A bounded version probe using one command declared by the same provider. */
export interface ExtensionRuntimeVersionProbe {
  readonly command: string;
  readonly args: readonly string[];
  readonly stream: "stdout" | "stderr";
  /** Exact text before the first semantic-version token in the selected stream. */
  readonly prefix: string;
}

/** A runtime installed through the terminal package system. */
export interface ExtensionTerminalPackageRuntimeSource {
  readonly kind: "terminalPackage";
  /** Stable terminal-package provider identity resolved by the host. */
  readonly providerId: string;
}

/** A signed managed tool which explicitly supports general development execution. */
export interface ExtensionManagedToolRuntimeSource {
  readonly kind: "managedTool";
  readonly toolId: string;
}

export type ExtensionRuntimeSource =
  | ExtensionTerminalPackageRuntimeSource
  | ExtensionManagedToolRuntimeSource;

interface ExtensionRuntimeProviderContributionBase {
  readonly id: string;
  readonly runtime: string;
  readonly label: string;
  readonly capabilities: readonly string[];
}

/** Declarative discovery of one user-installed terminal-package runtime. */
export interface ExtensionTerminalPackageRuntimeProviderContribution
  extends ExtensionRuntimeProviderContributionBase {
  readonly source: ExtensionTerminalPackageRuntimeSource;
  readonly commands: readonly ExtensionTerminalPackageRuntimeCommand[];
  readonly versionProbe: ExtensionRuntimeVersionProbe;
}

/** Declarative discovery of one app-managed development runtime. */
export interface ExtensionManagedToolRuntimeProviderContribution
  extends ExtensionRuntimeProviderContributionBase {
  readonly source: ExtensionManagedToolRuntimeSource;
}

export type ExtensionRuntimeProviderContribution =
  | ExtensionTerminalPackageRuntimeProviderContribution
  | ExtensionManagedToolRuntimeProviderContribution;

/** Opaque identity of one exact runtime observation. No native path is exposed. */
export interface ExtensionRuntimeIdentity {
  readonly source: ExtensionRuntimeSource;
  readonly runtimeId: string;
  /** Changes when the selected executable or its owning installation changes. */
  readonly fingerprint: string;
}

/** Public metadata for one installed runtime candidate. */
export interface ExtensionRuntimeDescriptor {
  readonly identity: ExtensionRuntimeIdentity;
  readonly runtime: string;
  readonly label: string;
  readonly version: string;
  readonly capabilities: readonly string[];
}

export type ExtensionRuntimeUnavailableReason =
  | "notSelected"
  | "missing"
  | "changed"
  | "incompatible"
  | "probeFailed";

/** Host-owned global selection for one runtime family. */
export type ExtensionRuntimeSelection =
  | {
      readonly state: "ready";
      readonly runtime: string;
      readonly provider: ExtensionRuntimeDescriptor;
    }
  | {
      readonly state: "unavailable";
      readonly runtime: string;
      readonly selected: ExtensionRuntimeIdentity | null;
      readonly reason: ExtensionRuntimeUnavailableReason;
      /** Bounded diagnostic suitable for a precise user-facing notification. */
      readonly detail: string;
    };

export type ExtensionTaskConsole = "terminal" | "captured";

/** Symbolic route through the globally selected runtime. */
export interface ExtensionRuntimeExecutionBase {
  readonly kind: "runtime";
  readonly requirement: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly console: ExtensionTaskConsole;
}
