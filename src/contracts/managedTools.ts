import type { ExtensionManagedToolArgument } from "./manifest.js";

/** Maximum UTF-8 input accepted by one managed-tool probe. */
export const MANAGED_TOOL_PROBE_MAX_STDIN_BYTES = 65_536 as const;

/** Static literal or signed dependency resource supplied to a managed tool. */
export type ManagedToolEntrypointArgument = ExtensionManagedToolArgument;

/** One direct managed-tool dependency used to run a package-owned entrypoint. */
export interface ManagedToolEntrypointRunner {
  readonly tool: string;
  readonly entrypoint: string;
}

/**
 * One signed managed-tool package entrypoint.
 *
 * Static arguments are resolved by the host before invocation arguments. A
 * resource reference may name only a direct managed-tool dependency. Omit
 * `args` when the entrypoint has no static arguments.
 */
export interface ManagedToolEntrypoint {
  readonly id: string;
  readonly path: string;
  readonly runner?: ManagedToolEntrypointRunner;
  readonly args?: readonly ManagedToolEntrypointArgument[];
}

/** One bounded capability probe for a signed managed-tool entrypoint. */
export interface ManagedToolProbe {
  readonly capability: string;
  readonly entrypoint: string;
  readonly args: readonly string[];
  /** Exact non-empty UTF-8 input written before the host closes stdin. */
  readonly stdin?: string;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly expectedStdout: string;
}
