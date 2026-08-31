import type { ExtensionManagedToolArgument } from "./manifest.js";

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
