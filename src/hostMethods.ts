import type { ExtensionHostCapabilityMap } from "./contract.js";

/** Canonical public host methods, shared by providers, tooling and host adapters. */
export const EXTENSION_HOST_API_METHODS = Object.freeze({
  projects: Object.freeze(["select", "get", "bindIntegrations", "forget"] as const),
  files: Object.freeze(["select", "get", "forget", "export"] as const),
  secrets: Object.freeze(["request", "get", "forget"] as const),
  workbench: Object.freeze(["updatePanel", "reveal", "close", "presentation", "resolveIcons"] as const),
  "tasks.execute": Object.freeze(["list", "sessions", "start", "observe", "reveal", "stop", "release"] as const),
  "extensions.manage": Object.freeze(["inspect", "requestInstall"] as const),
  "workspace.read": Object.freeze(["relativePath", "readText", "readTextIfExists", "findFiles"] as const),
  "workspace.write": Object.freeze(["applyEdits"] as const),
  "commands.execute": Object.freeze(["execute"] as const),
  "diagnostics.publish": Object.freeze(["publish", "clear"] as const),
  "tools.execute": Object.freeze(["invoke"] as const),
  storage: Object.freeze(["get", "set", "delete"] as const),
  network: Object.freeze(["request"] as const),
  authentication: Object.freeze(["getSession"] as const),
  notifications: Object.freeze(["show"] as const),
  "services.manage": Object.freeze(["list", "status", "start", "stop", "restart", "readLog"] as const),
  terminal: Object.freeze(["profiles", "launch"] as const),
  "terminal.packages": Object.freeze(["inspectStack", "requestTransaction", "inspectTransaction", "cancelTransaction"] as const),
} satisfies {
  readonly [TCapability in keyof ExtensionHostCapabilityMap]: readonly (keyof ExtensionHostCapabilityMap[TCapability])[];
});

export type ExtensionHostCapability = keyof typeof EXTENSION_HOST_API_METHODS;
export type ExtensionHostMethod<TCapability extends ExtensionHostCapability> =
  (typeof EXTENSION_HOST_API_METHODS)[TCapability][number];

type ExtensionHostMethodId = {
  [TCapability in ExtensionHostCapability]: `${TCapability}:${ExtensionHostMethod<TCapability>}`;
}[ExtensionHostCapability];

/** User decisions and observations end by response, cancellation or owner disposal. */
export const EXTENSION_HOST_API_INTERACTIVE_METHODS = Object.freeze([
  "projects:select", "projects:bindIntegrations", "files:select", "files:export",
  "secrets:request", "extensions.manage:requestInstall", "terminal.packages:requestTransaction",
  "tasks.execute:start", "tasks.execute:observe", "commands.execute:execute",
] as const satisfies readonly ExtensionHostMethodId[]);
