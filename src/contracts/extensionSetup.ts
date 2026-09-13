import type { ExtensionCancellationToken } from "../contract.js";

export interface ExtensionIntegrationStatus {
  readonly id: string;
  readonly installedVersion: string | null;
  readonly enabled: boolean;
  readonly compatible: boolean;
}

/** Public package metadata only; never another extension's settings, grants or data. */
export interface ExtensionPackageSummary {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string | null;
  readonly installedVersion: string | null;
  readonly enabled: boolean;
  readonly appVariants: readonly ("lite" | "full" | "dev")[];
}

export interface ExtensionPackageQuery {
  readonly source: "installed" | "catalog";
  /** Case-insensitive substring of the public id, name or description, at most 256 characters. */
  readonly query?: string;
  /** Zero-based offset in the current id-sorted result. Catalogs may change between queries. */
  readonly offset?: number;
  /** Integer from 1 to 100, defaults to 25. */
  readonly limit?: number;
}

export interface ExtensionPackagePage {
  readonly items: readonly ExtensionPackageSummary[];
  readonly total: number;
  readonly nextOffset: number | null;
}

/** Optional installs use the existing declared integrations and their version constraints. */
export interface ExtensionExtensionsApi {
  /** Reads installed public metadata or searches the verified catalog. Does not install,
   * enable, activate or grant access to any package. Catalog lookup may access the network.
   * Installation continues to require a declared integration and host-owned consent.
   */
  query(request: ExtensionPackageQuery, cancellation: ExtensionCancellationToken): Promise<ExtensionPackagePage>;
  inspect(id: string, cancellation: ExtensionCancellationToken): Promise<ExtensionIntegrationStatus>;
  /** Host owns consent, dependencies, quotas and download. Does not silently enable a disabled extension. */
  requestInstall(id: string, cancellation: ExtensionCancellationToken): Promise<ExtensionIntegrationStatus>;
}

export interface ExtensionSecretReference {
  readonly id: string;
}

export interface ExtensionSecretsApi {
  /** Host-owned private input and encrypted storage. Raw values never enter provider/view RPC. */
  request(
    request: { readonly key: string; readonly title: string },
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionSecretReference | null>;
  get(key: string, cancellation: ExtensionCancellationToken): Promise<ExtensionSecretReference | null>;
  forget(key: string): Promise<void>;
}
