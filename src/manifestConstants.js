/** Canonical permission names accepted by every extension manifest layer. */
export const EXTENSION_PERMISSIONS = Object.freeze([
  "authentication",
  "commands.execute",
  "diagnostics.publish",
  "extension.execute",
  "network",
  "notifications",
  "services.manage",
  "storage",
  "terminal",
  "terminal.packages",
  "tools.execute",
  "workspace.read",
  "workspace.write",
]);

/** Fixed public identities for host-configured signed terminal-package repositories. */
export const EXTENSION_TERMINAL_PACKAGE_REPOSITORIES = Object.freeze([
  "zyntax",
  "termux-main",
]);

/** Canonical bounds for declarative development stacks and their public API. */
export const EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS = 8;
export const EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS = 32;
export const EXTENSION_DEVELOPMENT_STACK_MAX_LABEL_LENGTH = 120;
export const EXTENSION_DEVELOPMENT_STACK_MAX_DESCRIPTION_LENGTH = 512;
export const EXTENSION_TERMINAL_PACKAGE_MAX_SYMBOL_LENGTH = 96;
export const EXTENSION_TERMINAL_PACKAGE_MAX_REQUEST_BYTES = 8 * 1024;
export const EXTENSION_TERMINAL_PACKAGE_MAX_RESULT_BYTES = 16 * 1024;

/** Canonical bounds for literal managed-tool and task process arguments. */
export const EXTENSION_EXECUTION_MAX_ARGUMENTS = 32;
export const EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH = 512;
export const EXTENSION_EXECUTION_MAX_NODE_MODULES = 16;

/** Canonical standard-LSP routes accepted in language-server capability matrices. */
export const EXTENSION_LSP_POSITION_CAPABILITIES = Object.freeze([
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
]);

export const EXTENSION_LSP_DOCUMENT_CAPABILITIES = Object.freeze([
  "diagnostics",
  "semanticTokens",
  "workspaceSymbols",
  "documentSymbols",
  "foldingRanges",
  "documentFormatting",
]);

export const EXTENSION_LSP_EXCLUSIVE_CAPABILITIES = Object.freeze([
  "rename",
  "typeHierarchy",
  "semanticTokens",
  "documentFormatting",
]);

/** Standard server-to-client LSP requests that require explicit host authority. */
export const EXTENSION_LSP_STANDARD_CLIENT_REQUESTS = Object.freeze([
  "window/showDocument",
  "window/showMessageRequest",
  "workspace/applyEdit",
]);

/** Matches Java's Character.isISOControl contract used by the native authority. */
const EXTENSION_EXECUTION_ARGUMENT_CONTROL = /[\u0000-\u001f\u007f-\u009f]/u;

export function isExtensionExecutionArgument(value) {
  return typeof value === "string"
    && value.length <= EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH
    && !EXTENSION_EXECUTION_ARGUMENT_CONTROL.test(value);
}

/** Canonical executable provider kinds. */
export const EXTENSION_PROVIDER_KINDS = Object.freeze([
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
]);

/** Commands and agent harnesses use dedicated activation events. */
export const EXTENSION_ACTIVATION_PROVIDER_KINDS = Object.freeze(
  EXTENSION_PROVIDER_KINDS.filter(
    (kind) => kind !== "command" && kind !== "agent" && kind !== "documentParser",
  ),
);

/** Canonical search-provider kinds. */
export const EXTENSION_SEARCH_PROVIDER_KINDS = Object.freeze([
  "fileSearch",
  "textSearch",
  "quickOpen",
]);

/** Exact top-level fields allowed inside `manifest.contributes`. */
export const EXTENSION_CONTRIBUTION_FIELDS = Object.freeze([
  "languages",
  "grammars",
  "languageServers",
  "persistentServices",
  "developmentStacks",
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
]);
