import type { ExtensionCancellationToken, ExtensionJsonObject } from "../contract.js";

/** Opaque owner-scoped managed process; no PID, native path or executable authority. */
export interface ExtensionProcessSnapshot {
  readonly id: string;
  readonly state: "running" | "terminated";
  /** Process exit or shutdown has not yet confirmed complete cleanup. Stop may be retried. */
  readonly cleanupPending: boolean;
  /** Explicit transport/overflow/cleanup failure; valid retained frames remain observable. */
  readonly error: string | null;
}

export interface ExtensionProcessUpdate {
  readonly process: ExtensionProcessSnapshot;
  /** Lossless, ordered JSON frames after the requested cursor. */
  readonly messages: readonly {
    readonly cursor: number;
    readonly message: ExtensionJsonObject;
  }[];
  /** Monotonic safe nonnegative integer covering frames and lifecycle changes. */
  readonly cursor: number;
}

/**
 * Generic Content-Length framed JSON transport. Extensions own protocol sequencing and
 * state; the host owns bounded framing, backpressure, managed execution and cleanup.
 */
export interface ExtensionProcessesApi {
  /**
   * Consumes a ticket issued by a host provider broker, never a caller-supplied executable.
   * Both the provider's tool authority and the consumer's activation/project are enforced.
   * Cancellation before success stops any newly opened process; later use stop explicitly.
   * Inspect the returned state/error: a startup failure after a managed handle exists may
   * return a terminated snapshot. Retain its id to retry stop when cleanupPending is true,
   * then release it after cleanup. Pre-handle failures and cancelled opens still reject.
   */
  open(ticket: string, cancellation: ExtensionCancellationToken): Promise<ExtensionProcessSnapshot>;
  /**
   * Ordered bounded write. Structured {$documentPath: canonicalUri} references are resolved
   * through the ticket's trusted project with no-follow confinement immediately before send.
   * Ordinary JSON remains protocol data; the host does not interpret DAP/LSP commands.
   */
  send(process: string, message: ExtensionJsonObject, cancellation: ExtensionCancellationToken): Promise<void>;
  /**
   * Wait for frames/lifecycle changes after cursor (zero begins observation). One ordered
   * consumer acknowledges through its last returned cursor; no timer polling is needed.
   * Invalid, future or no-longer-retained cursors are rejected, never silently skipped.
   * Frame/queue overflow fails and stops the process rather than dropping protocol data.
   * Cancelling observation stops only that wait, not the managed process.
   */
  observe(process: string, cursor: number, cancellation: ExtensionCancellationToken): Promise<ExtensionProcessUpdate>;
  /** Idempotent complete process-tree cleanup, also enforced on project/trust/owner loss. */
  stop(process: string, cancellation: ExtensionCancellationToken): Promise<ExtensionProcessSnapshot>;
  /** Release a retained process only once it is terminated and cleanup is complete. */
  release(process: string): Promise<void>;
  /** This calling owner's processes only; hiding its panel does not dispose them. */
  sessions(cancellation: ExtensionCancellationToken): Promise<readonly ExtensionProcessSnapshot[]>;
}
