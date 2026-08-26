import type {
  ExtensionJsonObject,
  ExtensionJsonValue,
} from "./contracts/json.js";

/** Canonical JSON-RPC envelope used by one-shot managed tool invocations. */
export const EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION = "2.0" as const;
export const EXTENSION_MANAGED_TOOL_INVOCATION_METHOD =
  "zyntax/toolInvocation" as const;

export interface ExtensionManagedToolInvocationRequest {
  readonly jsonrpc: typeof EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION;
  readonly id: string;
  readonly method: typeof EXTENSION_MANAGED_TOOL_INVOCATION_METHOD;
  readonly params: ExtensionJsonObject;
}

export interface ExtensionManagedToolInvocationSuccess {
  readonly jsonrpc: typeof EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION;
  readonly id: string;
  readonly result: ExtensionJsonValue;
}

export interface ExtensionManagedToolInvocationFailure {
  readonly jsonrpc: typeof EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION;
  readonly id: string;
  readonly error: {
    readonly code: number;
    readonly message: string;
  };
}

export type ExtensionManagedToolInvocationResponse =
  | ExtensionManagedToolInvocationSuccess
  | ExtensionManagedToolInvocationFailure;

