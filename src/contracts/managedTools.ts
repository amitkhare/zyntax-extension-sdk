import type { ExtensionManagedToolArgument } from "./manifest.js";

/** Maximum ASCII bytes in one normalized managed-tool package path. */
export const MANAGED_TOOL_MAX_PATH_BYTES = 384 as const;
/** Maximum ASCII bytes in one managed-tool package path segment. */
export const MANAGED_TOOL_MAX_PATH_SEGMENT_BYTES = 96 as const;

/**
 * Validate an exact, case-sensitive relative POSIX package path without rewriting it.
 * Package roots, duplicate entries, and file/directory/link topology are validated
 * separately by the archive builder and installer.
 */
export function isManagedToolPath(value: unknown): value is string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > MANAGED_TOOL_MAX_PATH_BYTES
    || !/^[\x20-\x7e]+$/u.test(value)
  ) return false;
  return value.split("/").every((segment) =>
    segment.length >= 1
    && segment.length <= MANAGED_TOOL_MAX_PATH_SEGMENT_BYTES
    && segment !== "."
    && segment !== ".."
    && segment.trim() === segment
    && !segment.endsWith(".")
    && !/[<>:"\\|?*]/u.test(segment));
}

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
  /** Exact case-sensitive package-relative path under `payload/`. */
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
