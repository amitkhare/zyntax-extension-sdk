export declare const EXTENSION_PERMISSIONS: readonly [
  "authentication",
  "commands.execute",
  "diagnostics.publish",
  "extension.execute",
  "network",
  "notifications",
  "runtimes.execute",
  "services.manage",
  "storage",
  "terminal",
  "terminal.packages",
  "tools.execute",
  "workspace.read",
  "workspace.write",
];

export declare const EXTENSION_TERMINAL_PACKAGE_REPOSITORIES: readonly [
  "zyntax",
  "termux-main",
];
export declare const EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS: 8;
export declare const EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS: 32;
export declare const EXTENSION_DEVELOPMENT_STACK_MAX_LABEL_LENGTH: 120;
export declare const EXTENSION_DEVELOPMENT_STACK_MAX_DESCRIPTION_LENGTH: 512;
export declare const EXTENSION_TERMINAL_PACKAGE_MAX_SYMBOL_LENGTH: 96;
export declare const EXTENSION_TERMINAL_PACKAGE_MAX_REQUEST_BYTES: number;
export declare const EXTENSION_TERMINAL_PACKAGE_MAX_RESULT_BYTES: number;

export declare const EXTENSION_EXECUTION_MAX_ARGUMENTS: 32;
export declare const EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH: 512;
export declare const EXTENSION_EXECUTION_MAX_NODE_MODULES: 16;
export declare const EXTENSION_LSP_POSITION_CAPABILITIES: readonly [
  "completion",
  "hover",
  "signatureHelp",
  "definition",
  "implementation",
  "typeDefinition",
  "references",
  "rename",
  "codeActions",
  "typeHierarchy",
  "documentHighlights",
];
export declare const EXTENSION_LSP_DOCUMENT_CAPABILITIES: readonly [
  "diagnostics",
  "semanticTokens",
  "workspaceSymbols",
  "documentSymbols",
  "foldingRanges",
  "documentFormatting",
];
export declare const EXTENSION_LSP_EXCLUSIVE_CAPABILITIES: readonly [
  "rename",
  "typeHierarchy",
  "semanticTokens",
  "documentFormatting",
];
export declare const EXTENSION_LSP_STANDARD_CLIENT_REQUESTS: readonly [
  "window/showDocument",
  "window/showMessageRequest",
  "workspace/applyEdit",
];
export declare function isExtensionExecutionArgument(value: unknown): value is string;

export declare const EXTENSION_PROVIDER_KINDS: readonly [
  "completion",
  "structuralRegions",
  "virtualDocuments",
  "documentParser",
  "documentFormatting",
  "rangeFormatting",
  "diagnostics",
  "codeActions",
  "fixAll",
  "debugConfiguration",
  "debugAdapter",
  "notebookType",
  "notebookKernel",
  "command",
  "agent",
  "aiProvider",
  "fileSearch",
  "textSearch",
  "quickOpen",
  "inlineCompletion",
  "assistedEdit",
  "aiCodeAction",
  "decoration",
  "documentColor",
  "hover",
  "preview",
  "task",
  "terminalProfile",
  "scm",
  "projectTemplate",
];

export declare const EXTENSION_ACTIVATION_PROVIDER_KINDS: readonly Exclude<
  (typeof EXTENSION_PROVIDER_KINDS)[number],
  "command" | "agent" | "documentParser"
>[];

export declare const EXTENSION_SEARCH_PROVIDER_KINDS: readonly [
  "fileSearch",
  "textSearch",
  "quickOpen",
];

export declare const EXTENSION_CONTRIBUTION_FIELDS: readonly [
  "languages",
  "grammars",
  "languageServers",
  "persistentServices",
  "developmentStacks",
  "runtimeProviders",
  "formatters",
  "rangeFormatters",
  "documentFormattingProviders",
  "rangeFormattingProviders",
  "diagnosticsProviders",
  "debuggers",
  "notebookTypes",
  "notebookKernels",
  "searchProviders",
  "inlineCompletionProviders",
  "assistedEditProviders",
  "aiCodeActionProviders",
  "decorationProviders",
  "documentColorProviders",
  "hoverProviders",
  "previewProviders",
  "taskProviders",
  "terminalProfileProviders",
  "scmProviders",
  "projectTemplateProviders",
  "commands",
  "settings",
  "authenticationProviders",
  "workbench",
  "agents",
  "aiProviders",
  "snippets",
  "completionProviders",
  "structuralRegions",
  "virtualDocuments",
  "themes",
  "iconThemes",
  "keymaps",
  "typescriptCompanions",
];
