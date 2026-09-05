import type { ExtensionCancellationToken } from "../contract.js";

export interface ExtensionIntegrationStatus {
  readonly id: string;
  readonly installedVersion: string | null;
  readonly enabled: boolean;
  readonly compatible: boolean;
}

/** Optional installs use the existing declared integrations and their version constraints. */
export interface ExtensionExtensionsApi {
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
