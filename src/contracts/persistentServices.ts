/** Catalog-owned service launch identity. Arguments and environments belong to the tool entrypoint. */
export interface ExtensionPersistentServiceExecution {
  readonly tool: string;
  readonly entrypoint: string;
}

/** Host-supervised service shutdown policy. */
export interface ExtensionPersistentServiceLifecycle {
  readonly stopSignal: "INT" | "TERM";
  /** Time allowed for graceful process-group shutdown before the host kills it. */
  readonly stopTimeoutMs: number;
}

/** Host-owned health observation; TCP probes are always restricted to loopback. */
export type ExtensionPersistentServiceProbe =
  | { readonly kind: "process" }
  | {
      readonly kind: "tcp";
      readonly port: number;
      readonly connectTimeoutMs: number;
    };

/** Bounded UTF-8 process output retained by the host. */
export interface ExtensionPersistentServiceLog {
  readonly maxBytes: number;
}

/**
 * A long-running managed-tool process owned by one exact extension activation.
 *
 * Executable paths, environments, and provider-supplied argv are intentionally absent. The
 * native host resolves `execution` from the installed manifest and signed managed-tool catalog.
 */
export interface ExtensionPersistentServiceContribution {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly execution: ExtensionPersistentServiceExecution;
  readonly lifecycle: ExtensionPersistentServiceLifecycle;
  readonly probe: ExtensionPersistentServiceProbe;
  readonly log: ExtensionPersistentServiceLog;
}

export type ExtensionPersistentServiceState =
  | "stopped"
  | "running"
  | "unhealthy"
  | "failed";

export interface ExtensionPersistentServiceStatus {
  readonly id: string;
  readonly label: string;
  readonly state: ExtensionPersistentServiceState;
  readonly pid: number | null;
  readonly startedAt: number | null;
  readonly exitCode: number | null;
}

export interface ExtensionPersistentServiceLogSlice {
  readonly text: string;
  readonly truncated: boolean;
  readonly totalBytes: number;
}
