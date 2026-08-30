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

/**
 * One manifest-owned symbolic executable route through the globally selected runtime.
 * The host resolves both fields without exposing an executable path or environment.
 */
export interface ExtensionRuntimeCommandReference {
  readonly requirement: string;
  readonly command: string;
}

/**
 * Explicit runtime executable reference embedded in arbitrary provider
 * configuration. Untagged objects remain ordinary provider-owned JSON.
 */
export interface ExtensionRuntimeCommandConfigurationReference {
  readonly $runtimeCommand: ExtensionRuntimeCommandReference;
}

const RUNTIME_COMMAND_SYMBOL = /^[a-z0-9][a-z0-9._-]{0,63}$/u;

/** Strict structural validation for an isolated-provider runtime command reference. */
export function isExtensionRuntimeCommandReference(
  value: unknown,
): value is ExtensionRuntimeCommandReference {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const reference = value as Record<string, unknown>;
  const fields = Object.keys(reference).sort();
  return fields.length === 2
    && fields[0] === "command"
    && fields[1] === "requirement"
    && typeof reference.requirement === "string"
    && RUNTIME_COMMAND_SYMBOL.test(reference.requirement)
    && typeof reference.command === "string"
    && RUNTIME_COMMAND_SYMBOL.test(reference.command);
}

/** Strict structural validation for the reserved provider-configuration value. */
export function isExtensionRuntimeCommandConfigurationReference(
  value: unknown,
): value is ExtensionRuntimeCommandConfigurationReference {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const tagged = value as Record<string, unknown>;
  const fields = Object.keys(tagged);
  return fields.length === 1
    && fields[0] === "$runtimeCommand"
    && isExtensionRuntimeCommandReference(tagged.$runtimeCommand);
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
export interface ExtensionRuntimeExecutionBase
  extends ExtensionRuntimeCommandReference {
  readonly kind: "runtime";
  readonly args: readonly string[];
  readonly console: ExtensionTaskConsole;
}
