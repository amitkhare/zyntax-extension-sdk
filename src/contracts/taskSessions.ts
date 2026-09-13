import type { ExtensionCancellationToken } from "../contract.js";
import type { ExtensionTaskDescriptor } from "../extensionFirst.js";
import type { ExtensionProjectScope } from "./projectContexts.js";

/** Native resolution never returns installation paths or host routing variables to providers. */
export type ExtensionTaskPath =
  | { readonly kind: "projectPath"; readonly path: readonly string[] }
  | { readonly kind: "selectedPath"; readonly file: string; readonly path: readonly string[] }
  | {
      readonly kind: "packagePath";
      readonly stack: string;
      readonly package: string;
      /** Normalized prefix-relative path belonging to this installed stack requirement. */
      readonly path: readonly string[];
    }
  | {
      readonly kind: "extensionResource";
      /** Exact signed resources/* asset of the owning extension, resolved read-only. */
      readonly path: string;
    };

/** Command/runtime literals permit tab, CR and LF, with at most 16 KiB UTF-8 per
 * literal and 64 KiB total resolved argv (including runtime prefixes). NUL,
 * other ISO controls and malformed Unicode are rejected. There are at most
 * 32 caller arguments. Managed-tool literals retain their 512-code-unit,
 * control-free limit; these relaxed rules never change runtime routing.
 */
export type ExtensionTaskArgument = string | ExtensionTaskPath;

/** Secret values stay private; only their references may appear in environment bindings.
 * Environment literals retain their 512-code-unit, control-free limit on every route.
 */
export type ExtensionTaskEnvironmentValue = ExtensionTaskArgument
  | { readonly kind: "secret"; readonly secret: string };

export interface ExtensionTaskInputs {
  /** Process-local values. The host rejects keys reserved for its execution/routing contract. */
  readonly environment: Readonly<Record<string, ExtensionTaskEnvironmentValue>>;
}

export interface ExtensionTaskSelection {
  readonly project: ExtensionProjectScope;
  /** Must identify a task provider contributed by this extension. */
  readonly taskType: string;
}

export interface ExtensionTaskStartRequest extends ExtensionTaskSelection {
  /** Resolved again by the owning provider and reviewed by the host before launch. */
  readonly task: ExtensionTaskDescriptor;
}

export interface ExtensionTaskSession {
  readonly id: string;
  readonly taskId: string;
  readonly project: ExtensionProjectScope;
  readonly terminalSessionId: string | null;
  readonly state: "starting" | "running" | "succeeded" | "failed" | "cancelled";
  readonly exitCode: number | null;
}

export interface ExtensionTaskSessionUpdate {
  readonly session: ExtensionTaskSession;
  /** Monotonic cursor covering both output and lifecycle changes, not a timestamp. */
  readonly cursor: number;
  readonly output: readonly { readonly stream: "stdout" | "stderr"; readonly text: string }[];
  /** The requested cursor predates retained output; lifecycle state is always current. */
  readonly outputTruncated: boolean;
}

/** One owner-scoped lifecycle for existing captured jobs and terminal sessions. */
export interface ExtensionTasksApi {
  list(request: ExtensionTaskSelection, cancellation: ExtensionCancellationToken): Promise<readonly ExtensionTaskDescriptor[]>;
  /** Lists this owner's active sessions and retained results, including after its panel reopens. */
  sessions(cancellation: ExtensionCancellationToken): Promise<readonly ExtensionTaskSession[]>;
  /** Resolves scope and inputs once. Cancellation before a successful response stops newly
   * started work too; after that response, use stop on the returned session.
   */
  start(request: ExtensionTaskStartRequest, cancellation: ExtensionCancellationToken): Promise<ExtensionTaskSession>;
  /** Waits for changes after cursor (0 reads retained state). No timer polling is required.
   * Cancelling observation does not stop the task. Terminal states return immediately.
   */
  observe(session: string, cursor: number, cancellation: ExtensionCancellationToken): Promise<ExtensionTaskSessionUpdate>;
  reveal(session: string, cancellation: ExtensionCancellationToken): Promise<void>;
  /** Stops the complete process tree and closes its PTY; repeated stops are harmless. */
  stop(session: string, cancellation: ExtensionCancellationToken): Promise<ExtensionTaskSession>;
  /** Disposes retained results after exit. Active sessions must be stopped first. */
  release(session: string): Promise<void>;
}
