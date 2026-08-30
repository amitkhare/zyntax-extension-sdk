import type {
  AgentHarnessContribution,
  AIProviderContribution,
} from "../agent/contributions.js";
import type {
  ExtensionJsonObject,
  ExtensionJsonValue,
} from "./json.js";
import type { WorkbenchContribution } from "./workbench.js";
import type { ExtensionPersistentServiceContribution } from "./persistentServices.js";
import type { ExtensionDevelopmentStackContribution } from "./terminalPackages.js";
import type {
  ExtensionRuntimeProviderContribution,
  ExtensionRuntimeRequirement,
} from "./runtimes.js";
import {
  EXTENSION_ACTIVATION_PROVIDER_KINDS,
  EXTENSION_CONTRIBUTION_FIELDS,
  EXTENSION_EXECUTION_MAX_ARGUMENTS,
  EXTENSION_EXECUTION_MAX_NODE_MODULES,
  EXTENSION_LSP_DOCUMENT_CAPABILITIES,
  EXTENSION_LSP_EXCLUSIVE_CAPABILITIES,
  EXTENSION_LSP_POSITION_CAPABILITIES,
  EXTENSION_LSP_STANDARD_CLIENT_REQUESTS,
  EXTENSION_PERMISSIONS,
  EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS,
  EXTENSION_DEVELOPMENT_STACK_MAX_DESCRIPTION_LENGTH,
  EXTENSION_DEVELOPMENT_STACK_MAX_LABEL_LENGTH,
  EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS,
  EXTENSION_PROVIDER_KINDS,
  EXTENSION_RUNTIME_SOURCE_KINDS,
  EXTENSION_SEARCH_PROVIDER_KINDS,
  EXTENSION_TASK_CONSOLES,
  EXTENSION_TASK_EXECUTION_KINDS,
  EXTENSION_TERMINAL_PACKAGE_MAX_REQUEST_BYTES,
  EXTENSION_TERMINAL_PACKAGE_MAX_RESULT_BYTES,
  EXTENSION_TERMINAL_PACKAGE_MAX_SYMBOL_LENGTH,
  EXTENSION_TERMINAL_PACKAGE_REPOSITORIES,
  isExtensionExecutionArgument,
} from "../manifestConstants.js";

export type { ExtensionJsonObject, ExtensionJsonValue } from "./json.js";
export type * from "./workbench.js";
export type * from "./persistentServices.js";
export type * from "./terminalPackages.js";
export type * from "./runtimes.js";

export const EXTENSION_API_VERSION = 1 as const;

export {
  EXTENSION_ACTIVATION_PROVIDER_KINDS,
  EXTENSION_CONTRIBUTION_FIELDS,
  EXTENSION_EXECUTION_MAX_ARGUMENTS,
  EXTENSION_EXECUTION_MAX_NODE_MODULES,
  EXTENSION_LSP_DOCUMENT_CAPABILITIES,
  EXTENSION_LSP_EXCLUSIVE_CAPABILITIES,
  EXTENSION_LSP_POSITION_CAPABILITIES,
  EXTENSION_LSP_STANDARD_CLIENT_REQUESTS,
  EXTENSION_PERMISSIONS,
  EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS,
  EXTENSION_DEVELOPMENT_STACK_MAX_DESCRIPTION_LENGTH,
  EXTENSION_DEVELOPMENT_STACK_MAX_LABEL_LENGTH,
  EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS,
  EXTENSION_PROVIDER_KINDS,
  EXTENSION_RUNTIME_SOURCE_KINDS,
  EXTENSION_SEARCH_PROVIDER_KINDS,
  EXTENSION_TASK_CONSOLES,
  EXTENSION_TASK_EXECUTION_KINDS,
  EXTENSION_TERMINAL_PACKAGE_MAX_REQUEST_BYTES,
  EXTENSION_TERMINAL_PACKAGE_MAX_RESULT_BYTES,
  EXTENSION_TERMINAL_PACKAGE_MAX_SYMBOL_LENGTH,
  EXTENSION_TERMINAL_PACKAGE_REPOSITORIES,
  isExtensionExecutionArgument,
};

export type ExtensionPermission = (typeof EXTENSION_PERMISSIONS)[number];

export type ExtensionSearchProviderKind =
  (typeof EXTENSION_SEARCH_PROVIDER_KINDS)[number];

export type ExtensionProviderKind = (typeof EXTENSION_PROVIDER_KINDS)[number];

/** Commands and agent harnesses have dedicated activation events. */
export type ExtensionActivationProviderKind = Exclude<
  ExtensionProviderKind,
  "agent" | "command" | "documentParser"
>;

export type ExtensionActivationEvent =
  | { readonly kind: "document"; readonly language: string }
  | { readonly kind: "command"; readonly command: string }
  | { readonly kind: "formatter"; readonly formatter: string }
  | { readonly kind: "diagnostics"; readonly diagnostics: string }
  | { readonly kind: "debug"; readonly debugger: string }
  | { readonly kind: "notebook"; readonly notebook: string }
  | { readonly kind: "view"; readonly view: string }
  | { readonly kind: "agent"; readonly agent: string }
  | {
      readonly kind: "provider";
      readonly providerKind: ExtensionActivationProviderKind;
      readonly provider: string;
    };

export interface ManagedToolPlatform {
  os: "android";
  architecture: "arm64-v8a";
}

export interface ManagedToolRequirement {
  id: string;
  version: string;
  platforms: ManagedToolPlatform[];
  capabilities: string[];
}

/** A signed managed-tool resource resolved privately by the native host. */
export interface ExtensionToolResourceReference extends ExtensionJsonObject {
  $toolResource: ExtensionJsonObject & {
    tool: string;
    resource: string;
  };
}

/** An npm package projected into the execution's immutable Node module view. */
export interface ManagedNodeModuleBinding {
  name: string;
  resource: ExtensionToolResourceReference;
}

export type ExtensionManagedToolArgument =
  | string
  | ExtensionToolResourceReference;

export interface ManagedToolExecution {
  tool: string;
  entrypoint: string;
  args: ExtensionManagedToolArgument[];
  nodeModules?: ManagedNodeModuleBinding[];
}

/** Host-resolved current document identity for document-tool argv. */
export interface ExtensionCurrentDocumentPathArgument extends ExtensionJsonObject {
  readonly $documentPath: "current";
}

/** Host-owned current project trust state for process configuration. */
export interface ExtensionWorkspaceTrustReference extends ExtensionJsonObject {
  readonly $workspaceTrust: "isTrusted";
}

export type ExtensionDocumentToolArgument =
  | string
  | ExtensionToolResourceReference
  | ExtensionCurrentDocumentPathArgument;

export interface ManagedDocumentToolExecution
  extends Omit<ManagedToolExecution, "args"> {
  args: ExtensionDocumentToolArgument[];
}

export interface ExtensionLanguageContribution {
  id: string;
  extensions: string[];
  filenames?: string[];
  configuration?: string;
}

export type ExtensionTextMateTokenType =
  | "other"
  | "comment"
  | "string"
  | "regex";

export type ExtensionTextMateGrammarPath =
  | `syntaxes/${string}.tmLanguage`
  | `syntaxes/${string}.tmLanguage.json`;

export interface ExtensionTextMateGrammarContribution {
  /** Canonical language identities which share this exact primary grammar asset. */
  languages?: string[];
  scopeName: string;
  /** Exact UTF-8 JSON (`.tmLanguage.json`) or XML plist (`.tmLanguage`) asset. */
  path: ExtensionTextMateGrammarPath;
  injectTo?: string[];
  embeddedLanguages?: Record<string, string>;
  tokenTypes?: Record<string, ExtensionTextMateTokenType>;
  balancedBracketScopes?: string[];
  unbalancedBracketScopes?: string[];
}

export type ExtensionCapabilityComposition = "exclusive" | "additive";
export type ExtensionLanguageServerProviderRole =
  | "authoritative"
  | "companion";

export interface ExtensionPositionCapabilityProvider {
  group: string;
  role: ExtensionLanguageServerProviderRole;
  composition: ExtensionCapabilityComposition;
  priority: number;
  languages: string[];
}

export interface ExtensionDocumentCapabilityProvider {
  group: string;
  role: ExtensionLanguageServerProviderRole;
  composition: ExtensionCapabilityComposition;
  priority: number;
}

export interface ExtensionExclusiveDocumentCapabilityProvider
  extends Omit<ExtensionDocumentCapabilityProvider, "composition"> {
  composition: "exclusive";
}

export interface ExtensionExclusivePositionCapabilityProvider
  extends Omit<ExtensionPositionCapabilityProvider, "composition"> {
  composition: "exclusive";
}

export interface ExtensionLanguageServerCapabilityMatrix {
  completion?: ExtensionPositionCapabilityProvider[];
  hover?: ExtensionPositionCapabilityProvider[];
  signatureHelp?: ExtensionPositionCapabilityProvider[];
  definition?: ExtensionPositionCapabilityProvider[];
  implementation?: ExtensionPositionCapabilityProvider[];
  typeDefinition?: ExtensionPositionCapabilityProvider[];
  references?: ExtensionPositionCapabilityProvider[];
  rename?: ExtensionExclusivePositionCapabilityProvider[];
  codeActions?: ExtensionPositionCapabilityProvider[];
  typeHierarchy?: ExtensionExclusivePositionCapabilityProvider[];
  documentHighlights?: ExtensionPositionCapabilityProvider[];
  diagnostics?: ExtensionDocumentCapabilityProvider;
  semanticTokens?: ExtensionExclusiveDocumentCapabilityProvider;
  workspaceSymbols?: ExtensionDocumentCapabilityProvider;
  documentSymbols?: ExtensionDocumentCapabilityProvider;
  foldingRanges?: ExtensionDocumentCapabilityProvider;
  documentFormatting?: ExtensionExclusiveDocumentCapabilityProvider;
}

export interface ExtensionLanguageServerMapping {
  id: string;
  languageId: string;
  priority: number;
  composition: ExtensionCapabilityComposition;
  capabilities: ExtensionLanguageServerCapabilityMatrix;
}

export type ExtensionLanguageServerStandardRequest =
  (typeof EXTENSION_LSP_STANDARD_CLIENT_REQUESTS)[number];

export type ExtensionLanguageServerClientRequestService =
  | {
      id: string;
      method: string;
      service: "project.readFileBytes" | "project.readDirectory" | "project.stat";
    }
  | {
      id: string;
      method: string;
      service: "project.discoverDocuments";
      languages: string[];
    }
  | {
      id: string;
      method: string;
      service: "document.parse";
      module: `providers/${string}.js`;
      export: string;
      languageId: string;
      configuration?: ExtensionJsonObject;
    };

export interface ExtensionLanguageServerClientWatcherService {
  id: string;
  createMethod: string;
  deleteMethod: string;
  changeMethod: string;
}

export interface ExtensionLanguageServerClientServices {
  requests?: ExtensionLanguageServerClientRequestService[];
  watchers?: ExtensionLanguageServerClientWatcherService[];
  standardRequests?: ExtensionLanguageServerStandardRequest[];
}

export interface ExtensionDependency {
  id: string;
  version: string;
}

export interface ExtensionLanguageServerContribution {
  id: string;
  execution: ManagedToolExecution;
  languages: ExtensionLanguageServerMapping[];
  initializationOptions?: ExtensionJsonValue;
  workspaceConfiguration?: ExtensionJsonObject;
  requestTimeoutMs: number;
  memoryLimitBytes: number;
  maxMessageBytes: number;
  clientServices?: ExtensionLanguageServerClientServices;
}

export interface ExtensionDocumentFormatterMapping {
  id: string;
  priority: number;
}

/** Exact stdin/stdout protocol used by a managed document formatter. */
export type ExtensionDocumentFormatterProtocol =
  | "framed-jsonrpc"
  | "raw-stdio";

export interface ExtensionDocumentFormatterContribution {
  id: string;
  protocol: ExtensionDocumentFormatterProtocol;
  execution: ManagedDocumentToolExecution;
  languages: ExtensionDocumentFormatterMapping[];
  requestTimeoutMs: number;
  memoryLimitBytes: number;
  maxMessageBytes: number;
}

export interface ExtensionRangeFormatterContribution {
  id: string;
  execution: ManagedToolExecution;
  languages: ExtensionDocumentFormatterMapping[];
  requestTimeoutMs: number;
  memoryLimitBytes: number;
  maxMessageBytes: number;
}

export interface ExtensionSnippetLanguageMapping {
  id: string;
  sourceLanguages: string[];
  priority: number;
  group: string;
}

export interface ExtensionSnippetContribution {
  id: string;
  languages: ExtensionSnippetLanguageMapping[];
  path: string;
}

export type ExtensionCompletionProviderRole =
  | "authoritative"
  | "companion"
  | "supplemental"
  | "snippet"
  | "emmet";

export interface ExtensionCompletionProviderMapping {
  id: string;
  sourceLanguages: string[];
  priority: number;
  group: string;
  role: ExtensionCompletionProviderRole;
  composition: "additive" | "exclusive";
  triggerCharacters?: string[];
}

export interface ExtensionCompletionProviderContribution {
  id: string;
  module: string;
  export: string;
  languages: ExtensionCompletionProviderMapping[];
  configuration?: ExtensionJsonObject;
}

export interface ExtensionStructuralRegionProviderContribution {
  id: string;
  module: string;
  export: string;
  languages: string[];
}

export interface ExtensionVirtualDocumentProviderContribution {
  id: string;
  module: string;
  export: string;
  languages: string[];
  target: {
    dependency: string;
    languageServer: string;
    languageId: string;
  };
}

export interface ExtensionDiagnosticsProviderMapping {
  id: string;
  schemes: string[];
  group: string;
  priority: number;
  composition: ExtensionCapabilityComposition;
}

export interface ExtensionDiagnosticsProviderContribution {
  id: string;
  module: string;
  export: string;
  languages: ExtensionDiagnosticsProviderMapping[];
  provides: {
    diagnostics: boolean;
    codeActions: boolean;
    fixAll: boolean;
  };
}

export interface ExtensionFormattingProviderMapping {
  id: string;
  schemes: string[];
  group: string;
  priority: number;
}

export interface ExtensionFormattingProviderContribution {
  id: string;
  module: string;
  export: string;
  languages: ExtensionFormattingProviderMapping[];
}

export type ExtensionDocumentFormattingProviderContribution =
  ExtensionFormattingProviderContribution;

export type ExtensionRangeFormattingProviderContribution =
  ExtensionFormattingProviderContribution;

/** Shared language-and-scheme selector for isolated document capabilities. */
export interface ExtensionDocumentProviderMapping {
  id: string;
  schemes: string[];
  group: string;
  priority: number;
  composition: ExtensionCapabilityComposition;
}

/** A document selector whose provider must be the sole selected owner of its group. */
export interface ExtensionExclusiveDocumentProviderMapping
  extends Omit<ExtensionDocumentProviderMapping, "composition"> {
  composition: "exclusive";
}

export interface ExtensionDocumentProviderContribution {
  id: string;
  module: string;
  export: string;
  languages: ExtensionDocumentProviderMapping[];
}

export type ExtensionInlineCompletionProviderContribution =
  ExtensionDocumentProviderContribution;
export interface ExtensionAssistedEditProviderContribution
  extends Omit<ExtensionDocumentProviderContribution, "languages"> {
  languages: [
    ExtensionExclusiveDocumentProviderMapping,
    ...ExtensionExclusiveDocumentProviderMapping[],
  ];
}
export type ExtensionAICodeActionProviderContribution =
  ExtensionDocumentProviderContribution;
export type ExtensionDecorationProviderContribution =
  ExtensionDocumentProviderContribution;
export type ExtensionDocumentColorProviderContribution =
  ExtensionDocumentProviderContribution;
export type ExtensionHoverProviderContribution =
  ExtensionDocumentProviderContribution;

/** Preview-only selector for files that intentionally have no editor language identity. */
export interface ExtensionPreviewPathProviderMapping {
  id: string;
  /** Project-relative glob. A basename-only pattern matches at any depth. */
  glob: string;
  schemes: string[];
  group: string;
  priority: number;
  composition: "exclusive";
}

/** Controls whether the isolated provider receives document text or metadata only. */
export type ExtensionPreviewProviderInput = "text" | "document";

/** Declares how the host composes the preview with the source editor. */
export type ExtensionPreviewPlacement = "adjacent" | "replace-editor";

/** Declares how the host reads the canonical source before opening the document. */
export type ExtensionPreviewSourceEncoding = "utf8" | "base64";

interface ExtensionPreviewProviderBaseContribution {
  id: string;
  module: string;
  export: string;
}

type ExtensionPreviewProviderSourceContribution =
  | {
      input: "text";
      encoding: "utf8";
      placement: ExtensionPreviewPlacement;
    }
  | {
      input: "document";
      encoding: "utf8";
      placement: ExtensionPreviewPlacement;
    }
  | {
      input: "document";
      encoding: "base64";
      placement: "replace-editor";
    };

/** A preview must declare at least one exclusive language or path selector. */
export type ExtensionPreviewProviderContribution =
  ExtensionPreviewProviderBaseContribution &
  ExtensionPreviewProviderSourceContribution & (
    | {
        languages: [
          ExtensionExclusiveDocumentProviderMapping,
          ...ExtensionExclusiveDocumentProviderMapping[],
        ];
        paths?: ExtensionPreviewPathProviderMapping[];
      }
    | {
        languages?: ExtensionExclusiveDocumentProviderMapping[];
        paths: [
          ExtensionPreviewPathProviderMapping,
          ...ExtensionPreviewPathProviderMapping[],
        ];
      }
  );

export interface ExtensionDebuggerContribution {
  id: string;
  type: string;
  label: string;
  module: string;
  export: string;
  languages: string[];
  priority: number;
}

export interface ExtensionNotebookTypeContribution {
  id: string;
  type: string;
  label: string;
  module: string;
  export: string;
  priority: number;
}

export interface ExtensionNotebookKernelContribution {
  id: string;
  label: string;
  module: string;
  export: string;
  notebookTypes: string[];
  languages: string[];
  group: string;
  priority: number;
}

export interface ExtensionSearchProviderContribution {
  id: string;
  kind: ExtensionSearchProviderKind;
  module: string;
  export: string;
  schemes: string[];
  group: string;
  priority: number;
}

/** Shared project-URI selector for workflow contribution providers. */
export interface ExtensionWorkspaceProviderContribution {
  id: string;
  module: string;
  export: string;
  schemes: string[];
  group: string;
  priority: number;
  composition: ExtensionCapabilityComposition;
}

export interface ExtensionTaskProviderContribution
  extends ExtensionWorkspaceProviderContribution {
  taskTypes: string[];
}

export type ExtensionTerminalProfileProviderContribution =
  ExtensionWorkspaceProviderContribution;
export type ExtensionScmProviderContribution =
  ExtensionWorkspaceProviderContribution;
export type ExtensionProjectTemplateProviderContribution =
  ExtensionWorkspaceProviderContribution;

export interface ExtensionCommandProviderContribution {
  id: string;
  title: string;
  module: string;
  export: string;
}

export type ExtensionSettingType =
  | "string"
  | "number"
  | "integer"
  | "boolean";

export type ExtensionSettingScope = "application" | "workspace";
export type ExtensionSettingValue = string | number | boolean;

export interface ExtensionSettingProperty {
  key: string;
  type: ExtensionSettingType;
  title: string;
  description?: string;
  default: ExtensionSettingValue;
  enum?: ExtensionSettingValue[];
  minimum?: number;
  maximum?: number;
  scope: ExtensionSettingScope;
}

export interface ExtensionSettingsContribution {
  id: string;
  title: string;
  properties: ExtensionSettingProperty[];
}

export type ExtensionAuthenticationCredentialKind = "apiKey" | "bearerToken";

/** Native-owned account policy. Credential material never enters extension JavaScript. */
export interface ExtensionAuthenticationProviderContribution {
  id: string;
  label: string;
  credentialKind: ExtensionAuthenticationCredentialKind;
  scopes: string[];
  origins: string[];
  injection: {
    header: string;
    prefix: string;
  };
}

export interface ExtensionColorThemeContribution {
  id: string;
  label: string;
  kind: "dark" | "light";
  path: string;
}

export interface ExtensionFileIconThemeContribution {
  id: string;
  label: string;
  path: string;
}

export interface ExtensionKeymapContribution {
  id: string;
  label: string;
  path: string;
}

export interface ExtensionTypeScriptCompanionContribution {
  id: string;
  languageServer: string;
  target: {
    dependency: string;
    languageServer: string;
  };
  protocol: "vue-language-tools";
  typescriptSdk: ExtensionToolResourceReference;
  plugin: {
    name: string;
    resource: ExtensionToolResourceReference;
    languages: string[];
  };
  documentLanguageId: string;
  capabilities: ExtensionLanguageServerCapabilityMatrix;
}

/** Static extension behavior while the host has the project in Restricted Mode. */
export type ExtensionUntrustedWorkspaceSupport =
  | {
      readonly supported: true;
    }
  | {
      readonly supported: false;
      readonly description: string;
    }
  | {
      readonly supported: "limited";
      readonly description: string;
      readonly restrictedConfigurations?: string[];
    };

export interface ExtensionCapabilities {
  readonly untrustedWorkspaces: ExtensionUntrustedWorkspaceSupport;
}

export interface ExtensionManifest {
  manifestVersion: 1;
  id: string;
  name: string;
  version: string;
  publisher: string;
  description?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  issues?: string;
  engines: { zyntax: string };
  capabilities?: ExtensionCapabilities;
  activationEvents: ExtensionActivationEvent[];
  permissions: ExtensionPermission[];
  dependencies: ExtensionDependency[];
  toolRequirements: ManagedToolRequirement[];
  runtimeRequirements?: ExtensionRuntimeRequirement[];
  contributes: {
    languages?: ExtensionLanguageContribution[];
    grammars?: ExtensionTextMateGrammarContribution[];
    languageServers?: ExtensionLanguageServerContribution[];
    persistentServices?: ExtensionPersistentServiceContribution[];
    developmentStacks?: ExtensionDevelopmentStackContribution[];
    runtimeProviders?: ExtensionRuntimeProviderContribution[];
    formatters?: ExtensionDocumentFormatterContribution[];
    rangeFormatters?: ExtensionRangeFormatterContribution[];
    documentFormattingProviders?: ExtensionDocumentFormattingProviderContribution[];
    rangeFormattingProviders?: ExtensionRangeFormattingProviderContribution[];
    diagnosticsProviders?: ExtensionDiagnosticsProviderContribution[];
    debuggers?: ExtensionDebuggerContribution[];
    notebookTypes?: ExtensionNotebookTypeContribution[];
    notebookKernels?: ExtensionNotebookKernelContribution[];
    searchProviders?: ExtensionSearchProviderContribution[];
    inlineCompletionProviders?: ExtensionInlineCompletionProviderContribution[];
    assistedEditProviders?: ExtensionAssistedEditProviderContribution[];
    aiCodeActionProviders?: ExtensionAICodeActionProviderContribution[];
    decorationProviders?: ExtensionDecorationProviderContribution[];
    documentColorProviders?: ExtensionDocumentColorProviderContribution[];
    hoverProviders?: ExtensionHoverProviderContribution[];
    previewProviders?: ExtensionPreviewProviderContribution[];
    taskProviders?: ExtensionTaskProviderContribution[];
    terminalProfileProviders?: ExtensionTerminalProfileProviderContribution[];
    scmProviders?: ExtensionScmProviderContribution[];
    projectTemplateProviders?: ExtensionProjectTemplateProviderContribution[];
    commands?: ExtensionCommandProviderContribution[];
    settings?: ExtensionSettingsContribution[];
    authenticationProviders?: ExtensionAuthenticationProviderContribution[];
    workbench?: readonly WorkbenchContribution[];
    agents?: AgentHarnessContribution[];
    aiProviders?: AIProviderContribution[];
    snippets?: ExtensionSnippetContribution[];
    completionProviders?: ExtensionCompletionProviderContribution[];
    structuralRegions?: ExtensionStructuralRegionProviderContribution[];
    virtualDocuments?: ExtensionVirtualDocumentProviderContribution[];
    themes?: ExtensionColorThemeContribution[];
    iconThemes?: ExtensionFileIconThemeContribution[];
    keymaps?: ExtensionKeymapContribution[];
    typescriptCompanions?: ExtensionTypeScriptCompanionContribution[];
  };
}
