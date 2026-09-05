import type { ExtensionCancellationToken } from "../contract.js";

/** A package resolved only through a host-owned signed repository identity. */
export interface ExtensionTerminalPackageRequirement {
  /** Stack-local symbolic identity used by other declarative contributions. */
  readonly id: string;
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

export type ExtensionTerminalPackageIntent = "install" | "repair" | "update" | "remove";

export interface ExtensionTerminalPackageVersion {
  readonly version: string;
  readonly architecture: string;
}

/** Selects a declared stack requirement, never an arbitrary package name. */
export interface ExtensionTerminalPackageSelection {
  readonly id: string;
  /** Exact available version, or the exact installed version for removal. */
  readonly version: string;
}

export interface ExtensionTerminalPackageTransactionRequest {
  readonly stack: string;
  readonly intent: ExtensionTerminalPackageIntent;
  /** Nonempty, unique stack-local selections reviewed together by the host. */
  readonly packages: readonly ExtensionTerminalPackageSelection[];
}

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
    readonly id: string;
    readonly repository: string;
    readonly package: string;
    readonly state: ExtensionTerminalPackageState;
    readonly installedVersion: string | null;
    readonly candidateVersion: string | null;
    /** Versions available from the declared repository for compatible architectures. */
    readonly versions: readonly ExtensionTerminalPackageVersion[];
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
  | "remove"
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

/** Reviewed access to terminal packages declared by this exact extension generation. */
export interface ExtensionTerminalPackagesApi {
  inspectStack(stack: string): Promise<ExtensionTerminalPackageStackInspection>;
  requestTransaction(
    request: ExtensionTerminalPackageTransactionRequest,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionTerminalPackageTransactionReceipt>;
  inspectTransaction(
    transaction: string,
  ): Promise<ExtensionTerminalPackageTransactionSnapshot>;
  cancelTransaction(
    transaction: string,
  ): Promise<ExtensionTerminalPackageTransactionSnapshot>;
}
