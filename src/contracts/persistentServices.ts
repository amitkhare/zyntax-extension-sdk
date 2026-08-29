/** Catalog-owned managed-tool launch identity. */
export interface ExtensionManagedToolServiceExecution {
  readonly kind: "managedTool";
  readonly tool: string;
  readonly entrypoint: string;
}

/**
 * Signed terminal-package launch identity.
 *
 * The package owns the executable descriptor. Extensions name only an owned development stack
 * and symbolic entrypoint, so paths, commands, arguments, environments, and package-manager
 * internals never enter the extension API.
 */
export interface ExtensionTerminalPackageServiceExecution {
  readonly kind: "terminalPackage";
  readonly stack: string;
  /** Stack-local terminal-package requirement identity. */
  readonly package: string;
  readonly entrypoint: string;
}

export type ExtensionPersistentServiceExecution =
  | ExtensionManagedToolServiceExecution
  | ExtensionTerminalPackageServiceExecution;

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
 * A long-running host-resolved process owned by one exact extension activation.
 *
 * Executable paths, environments, and provider-supplied argv are intentionally absent. The
 * native host resolves `execution` from the installed manifest and either the signed managed-tool
 * catalog or a signed terminal-package entrypoint descriptor.
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
