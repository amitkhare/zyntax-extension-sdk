# Zyntax Extension SDK

`@zyntax/extension-sdk` is the canonical public contract for executable Zyntax
extension providers. It contains plain-data manifest and RPC types, canonical
capability names, and small authoring helpers. It has no editor, WebView,
filesystem, network, native-command, or app-private dependencies.

Provider code is bundled by the Zyntax extension tooling into a self-contained
`providers/*.js` module. Import only this package for host DTOs and provider
helpers; do not import application source or tooling internals.

Tooling consumes the `provider-methods`, `manifest-constants`, and `capabilities`
subpaths so manifest validation and provider bundle validation share one public
vocabulary.

```ts
import {
  EXTENSION_API_VERSION,
  defineCompletionProvider,
  type ExtensionCompletionProvider,
} from "@zyntax/extension-sdk";

export const extensionApiVersion = EXTENSION_API_VERSION;

export const createCompletionProvider = defineCompletionProvider(
  (): ExtensionCompletionProvider => ({
    provideCompletions(request, cancellation) {
      cancellation.throwIfCancellationRequested();
      return null;
    },
    dispose() {},
  }),
);
```

Manifest validation remains host/tooling-owned. The SDK does not grant
permissions or platform access.

## Notebook kernels

A notebook-kernel provider returns only a symbolic managed-tool descriptor. The
host owns the adapter process and its full-duplex framed JSON-RPC session. The
public protocol defines initialization, execution, strictly ordered
status/output/comm events, kernel-to-host input requests, explicit interrupt and
restart generations, cancellation, and idempotent shutdown. Output events are
authoritative and are not duplicated in the final execution result.

Kernel adapters remain runtime-neutral. They must not expose native paths,
process handles, transport sockets, or renderer objects, and the host never
infers a runtime from a notebook language or file name.

Language-server mappings declare only verified routes. Position routes are
`completion`, `hover`, `signatureHelp`, `definition`, `implementation`,
`typeDefinition`, `references`, `rename`, `codeActions`, `typeHierarchy`, and
`documentHighlights`. Document/workspace routes are `diagnostics`,
`semanticTokens`, `workspaceSymbols`, `documentSymbols`, `foldingRanges`, and
`documentFormatting`. The host negotiates the matching standard LSP methods and
routes parser-owned source or virtual coordinates; it never infers a claim from
the server, language, filename, or installed package.

Declarative TextMate contributions reference exact UTF-8 JSON
(`syntaxes/*.tmLanguage.json`) or XML plist (`syntaxes/*.tmLanguage`) assets. The
host validates and loads the declared format directly; extensions do not convert
or execute grammar assets. A primary grammar declares its sorted canonical
`languages` bindings; one immutable asset may serve multiple identities when the
upstream grammar is genuinely shared. Injection-only grammars omit `languages`.

The published package contains compiled ESM and declaration files in `dist/`.
Extension builds never execute TypeScript source directly from `node_modules`.

The SDK also defines bounded plain-data contracts for inline completions,
assisted edits, AI code actions, decorations, document colors, hover, tasks, terminal
profiles, SCM state, and project templates. A task provider returns one reviewed
execution plan. A `terminal` plan contains only a command name, literal argument
array, and project-relative working-directory segments and requires the explicit
`terminal` permission. A `managedTool` plan contains only an exact manifest-declared
tool and entrypoint, bounded literal arguments, and project-relative working-directory
segments and requires `tools.execute`. The host resolves either plan only after
approval, owns its lifetime and cancellation, and never exposes a native path,
environment, shell fragment, or process handle to the provider. Terminal-profile
and project-template providers likewise return descriptors or host-reviewed plans
while the host owns process launch, filesystem writes, approvals, and transactions.
Assisted-edit providers expose both bounded unary proposals and one ordered push
stream. A streaming invocation emits progress or proposal events through the
host-provided sink, observes the cancellation token, and completes once. The native
transport owns ordering, byte/count limits, cancellation, and terminal delivery;
providers never poll or open a second request.

Hover providers receive the exact parser-owned source region at the requested
position and return only bounded plain-text or Markdown content with a
snapshot-bound source range. The host sanitizes and renders that content in the
same tooltip surface as LSP hover, suppresses the surface while completion is
pending or active, and owns pointer and touch activation. Providers cannot
return HTML, DOM, editor objects, or infer embedded languages from filenames or
source scans.

Managed-tool adapters use the exported `EXTENSION_MANAGED_TOOL_INVOCATION_METHOD`
and JSON-RPC request/response types over the host's Content-Length-framed stdio
transport. Extension code selects only a manifest-declared tool and entrypoint;
it never supplies an executable path, environment, or terminal command.

The SDK exports the canonical managed-tool request, result, frame, and JSON
structure limits plus `extensionJsonUtf8ByteLength` for exact host-neutral
checks. Diagnostics providers have high per-provider item and encoded-byte
ceilings plus one document-wide aggregate budget; providers must bound their
own results before crossing either RPC boundary.

Long-running managed tools use the declarative `persistentServices` contribution and the
`services.manage` permission. A service selects only a signed tool and entrypoint and declares
bounded stop, health-probe, and log policy; it cannot declare argv, an environment, a path, or
shell text. Providers operate only their own symbolic service ids. The host owns the canonical
workspace/trust decision, process group, health, bounded UTF-8 logs, and exact activation cleanup.

Terminal development dependencies use `contributes.developmentStacks` and the independent
`terminal.packages` permission. A stack contains one to 32 required package symbols from the fixed
host-known `zyntax` or `termux-main` repository identity. It cannot contain repository URLs, keys,
versions, package-manager options, commands, paths, environment values, or scripts. The
`terminal.packages` host API accepts only a declared stack id and `install`, `repair`, or `update`;
the host resolves signed candidates, presents the complete Package Manager review, owns the one
durable mutation queue, and returns only a bounded symbolic transaction snapshot. This permission
does not grant `terminal`, `network`, or `tools.execute`.

```json
{
  "permissions": ["extension.execute", "terminal.packages"],
  "contributes": {
    "developmentStacks": [{
      "id": "web-runtime",
      "label": "Web runtime",
      "packages": [{ "repository": "termux-main", "package": "nodejs-lts" }]
    }]
  }
}
```

Managed execution arguments may contain a signed resource reference instead of
a literal string. The native host resolves it immediately before launch and the
path never enters extension-provider code. Node entrypoints may additionally
declare a sorted `nodeModules` array which binds a valid npm package name to a
signed package-directory resource. The host projects the entrypoint and those
packages into one immutable module tree and launches it with normal Node module
resolution. Manifests never declare `NODE_PATH`, installation directories, or
package-specific host behavior; each resource package must carry a matching
`package.json` name.

Managed document formatters declare their exact stdio protocol. Use
`framed-jsonrpc` for an adapter that implements the canonical formatting RPC, or
`raw-stdio` for a direct CLI which accepts the exact document bytes on stdin and
returns one bounded UTF-8 document on stdout. Raw formatter arguments are fixed
manifest strings or signed resource references; the host does not substitute a
language, URI, option, or shell fragment at runtime. The explicit current-document
path reference is available only to document formatters. Contribute separate formatter descriptors when a CLI
requires a different constant argument for each canonical language.

Project-template providers return either an atomic UTF-8 file plan or a
symbolic managed-tool plan. Managed generators run only after host review, in a
new app-owned staging root, and must produce the declared regular-file markers
before the host atomically publishes the project. The provider and managed tool
receive JSON and canonical URIs only; native paths never cross the provider
boundary.

Debugger configuration providers receive the active project and document as
canonical URIs. Use `debugDocumentPath(documentUri)` for configuration fields
such as `program`; the host validates that URI against the active project and
resolves the native path only when it sends the DAP launch or attach request.
Providers and manifests never contain app-private filesystem paths.

For a launch field which the user must select, use
`debugProjectPath(id, label, kind)`. Zyntax reviews and persists the selected
canonical document URI per project. The symbolic slot remains in provider
requests; only the managed DAP host resolves it to a native path immediately
before adapter launch.

Providers with `workspace.read` can query the host-owned project index through
`findFiles({ include, exclude?, maxResults }, cancellation)`. Globs are relative
to the open project; a basename-only glob matches at any depth. Results contain
only canonical document URIs and project-relative paths, are deterministic and
bounded, and remain subject to the same project-confined `readText` boundary.
`relativePath(uri, cancellation)` resolves a canonical document URI to its
project-relative identity, or `null` when the document is outside the open
project. The isolated provider never receives a native path or direct filesystem
access.

Preview providers may select registered editor languages or declare strict `paths`
globs. Project files expose their project-relative path; external and untitled
documents expose their canonical display name. Path selectors route previews without
claiming syntax or language support. Every provider declares one `input` mode and
one required `placement`: `adjacent` toggles in the editor area on phones and sits
beside the editor on wider screens, while `replace-editor` owns the editor area for
visual resources that have no useful source view. The host derives layout only from
this declaration, never from a package id or filename. The required `encoding` is
`utf8` for text documents or `base64` for binary source snapshots; `text` input
always requires `utf8`. The same selected provider metadata controls the bounded
file read and read-only editor policy.
`text` receives the bounded canonical text snapshot and may return structured,
table, plain-text, or bounded HTML markup data. Markup declares `linked` or
`independent` scrolling and is limited to inert semantic HTML: scripts, event handlers,
active controls, remote resources, classes, ids, and extension styling are not part of
the surface. The host sanitizes it and applies theme-aware semantic styling inside the
preview pane. `document` receives metadata only and may select a declared HTML, SVG, or
raster renderer for the exact source snapshot; it never receives bytes, resource URLs,
markup, DOM, Vue, filesystem or native handles, or a WebView.
HTML resources are always script-blocked and declare only whether canonical project
subresources are available. The host validates the bounded result,
mints and disposes the canonical resource session, confines project resources,
and owns the renderer.
Preview request and result budgets are exported as
`EXTENSION_PREVIEW_MAX_INPUT_BYTES`, `EXTENSION_PREVIEW_MAX_BINARY_INPUT_BYTES`,
and `EXTENSION_PREVIEW_MAX_RESULT_BYTES`.

```json
{
  "contributes": {
    "previewProviders": [{
      "id": "preview",
      "module": "providers/preview.js",
      "export": "createPreview",
      "input": "text",
      "placement": "adjacent",
      "encoding": "utf8",
      "languages": [{
        "id": "example",
        "schemes": ["file", "untitled"],
        "group": "example.preview",
        "priority": 100,
        "composition": "exclusive"
      }]
    }]
  }
}
```
