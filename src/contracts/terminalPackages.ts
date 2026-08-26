/** A package resolved only through a host-owned signed repository identity. */
export interface ExtensionTerminalPackageRequirement {
  readonly repository: string;
  readonly package: string;
}

/** A declarative, all-required terminal development stack. */
export interface ExtensionDevelopmentStackContribution {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly packages: readonly ExtensionTerminalPackageRequirement[];
}

export type ExtensionTerminalPackageIntent = "install" | "repair" | "update";

export type ExtensionTerminalPackageState =
  | "installed"
  | "missing"
  | "updateAvailable"
  | "unavailable";

export interface ExtensionTerminalPackageStackInspection {
  readonly stack: string;
  readonly state:
    | "ready"
    | "missing"
    | "updatesAvailable"
    | "repairRequired"
    | "unavailable";
  readonly packages: readonly {
    readonly repository: string;
    readonly package: string;
    readonly state: ExtensionTerminalPackageState;
  }[];
}

export interface ExtensionTerminalPackageTransactionReceipt {
  readonly transaction: string;
  readonly state: "previewing" | "awaitingApproval" | "queued";
}

export type ExtensionTerminalPackageTransactionState =
  | "previewing"
  | "awaitingApproval"
  | "queued"
  | "running"
  | "recovering"
  | "succeeded"
  | "declined"
  | "cancelled"
  | "failed";

export type ExtensionTerminalPackageTransactionPhase =
  | "catalog"
  | "audit"
  | "configure"
  | "repair"
  | "refresh"
  | "install"
  | "reinstall"
  | "update"
  | "verify"
  | "complete";

export type ExtensionTerminalPackageTransactionError =
  | "unavailable"
  | "busy"
  | "reviewExpired"
  | "database"
  | "network"
  | "storage"
  | "cancelled"
  | "failed";

export interface ExtensionTerminalPackageTransactionSnapshot {
  readonly transaction: string;
  readonly stack: string;
  readonly intent: ExtensionTerminalPackageIntent;
  readonly state: ExtensionTerminalPackageTransactionState;
  readonly phase: ExtensionTerminalPackageTransactionPhase;
  readonly completed: number;
  readonly total: number;
  readonly recovery: "notNeeded" | "repaired" | "attentionRequired";
  readonly error?: ExtensionTerminalPackageTransactionError;
}
