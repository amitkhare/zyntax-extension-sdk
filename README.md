# Zyntax Extension SDK

`@zyntax/extension-sdk` is the canonical public contract for executable Zyntax
extension providers. It contains plain-data manifest and RPC types, canonical
capability names, and small authoring helpers. It has no editor, WebView,
filesystem, network, native-command, or app-private dependencies.

Extension manifests distinguish required `dependencies` from `integrations`.
Required dependencies are installed with the extension and must activate.
Integrations authorize composition with compatible optional packages. They are
never installed implicitly and never block activation. `extensions.manage` can
request a user-reviewed install of a declared integration. Both arrays are explicit.

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
    async provideCompletions(request, cancellation) {
      await cancellation.checkpoint();
      return null;
    },
    dispose() {},
  }),
);
```

Manifest validation remains host/tooling-owned. The SDK does not grant
permissions or platform access.

## Cooperative cancellation

Every provider cancellation token exposes `checkpoint()`. Awaiting it yields
isolated provider execution to the host event queue so queued cancellation and
control work can run, then rejects with the same host cancellation error as
`throwIfCancellationRequested()` when cancellation is requested. CPU-bound
provider work must await checkpoints at safe intervals; reading
`isCancellationRequested` or calling `throwIfCancellationRequested()` alone
does not yield execution to the host.

Providers must not publish partial state from work interrupted by a rejected
checkpoint. The synchronous token members remain useful before and after
already-asynchronous boundaries, while `checkpoint()` is the cooperative
boundary for long-running isolated work.

## Language filename associations

A contributed editor language always declares `extensions` and may also declare
exact `filenames` or basename-only `filenamePrefixes`. Prefix matching is
case-insensitive. Each prefix must be non-empty and contain no `/` or `\` path
separator; the host canonicalizes prefixes before matching.

When several associations match, the host chooses an exact filename first, then
the longest matching filename prefix, then the longest matching compound
extension. This lets a language claim a filename family such as `Dockerfile.*`
without enumerating every basename.

```json
{
  "contributes": {
    "languages": [{
      "id": "dockerfile",
      "extensions": [],
      "filenames": ["Dockerfile"],
      "filenamePrefixes": ["Dockerfile."]
    }]
  }
}
```

## Notebook file associations

Every contributed notebook type explicitly declares both `extensions` and
`filenames`. At least one of those arrays must be non-empty. Extensions are
canonical lowercase suffixes that include the leading dot, such as `.ipynb`;
filenames are exact basenames without path separators. Matching is
case-insensitive, including compound extensions.

These signed associations let the host offer a serializer only for files it
claims. The host also enforces the association when deserializing and
serializing, so a notebook provider cannot be selected for an unrelated file.
Notebook types do not create editor-language identities, and the host does not
infer associations from a type name or inspect file contents to choose one.

```json
{
  "contributes": {
    "notebookTypes": [{
      "id": "jupyter-notebook",
      "type": "jupyter-notebook",
      "label": "Jupyter Notebook",
      "module": "providers/jupyter-notebook.js",
      "export": "createJupyterNotebookSerializerProvider",
      "extensions": [".ipynb"],
      "filenames": [],
      "priority": 100
    }]
  }
}
```

## Bundled package lifecycle

An extension `extension.json` or managed-tool `tool.json` may declare the
optional top-level field `"required": true`. The field has authority only when
that exact package id is shipped in the APK's immutable package bundle. Such a
package remains visible and updateable through the normal package pipeline, but
the host does not allow its removal. Missing or `false` means removable. A Store
or file-installed package cannot make itself non-removable by declaring the
field, and an update cannot change the APK-owned lifecycle policy.

Bundling itself is established by placing a signed `.zntx` or `.ztool` in the
APK bundle directory; it is not another manifest field or a separate package
format. Managed-tool schema and archive validation remain owned by the managed
tooling, which applies the same optional boolean contract to `tool.json`.

Managed-tool package paths use exact case-sensitive POSIX identity on Android.
`isManagedToolPath` checks the shared path syntax: relative forward-slash paths,
printable ASCII, at most `MANAGED_TOOL_MAX_PATH_BYTES` (384) bytes overall and
`MANAGED_TOOL_MAX_PATH_SEGMENT_BYTES` (96) bytes per segment. Empty, `.` and `..`
segments, surrounding spaces, trailing dots, and `<>:"\\|?*` are rejected. Paths
are never lowercased or rewritten. `payload/include/Name.h` and
`payload/include/name.h` are distinct files, as are case-distinct directories.
Payloads containing case-distinct names require a case-sensitive build filesystem,
such as a Linux container, so staging preserves both names.

Builders and installers still reject exact duplicate paths, file/directory/link
conflicts, unsafe paths, and links outside the declared package graph. Archive
metadata remains at the package root; tool files and resources remain under
`payload/`. This does not change extension archive paths or manifest version 1.

## Notebook kernels

A notebook-kernel provider returns only a symbolic runtime descriptor. Its
`executable` names one manifest runtime requirement and one provider-neutral
command. Literal arguments and signed managed-tool resource references are
allowed; native paths, environment values, and fallback commands are not. The
host resolves the currently selected compatible runtime and signed resources,
then owns the adapter process and its full-duplex framed JSON-RPC session. The
public protocol defines initialization, execution, strictly ordered
status/output/comm events, kernel-to-host input requests, explicit interrupt and
restart generations, cancellation, and idempotent shutdown. Output events are
authoritative and are not duplicated in the final execution result. Event
sequence numbers increase across the complete adapter session, including kernel
restarts. A restart response commits the new generation before the adapter emits
any event for that generation.

Kernel adapters remain runtime-neutral. They must not expose native paths,
process handles, transport sockets, or renderer objects, and the host never
infers a runtime from a notebook language or file name.

```ts
const descriptor = {
  kind: "runtime" as const,
  executable: {
    requirement: "kernel-runtime",
    command: "runtime",
  },
  args: [{
    $toolResource: {
      tool: "publisher.kernel-adapter",
      resource: "adapter",
    },
  }],
  protocol: "zyntax-notebook-jsonrpc" as const,
};
```

## Runtime Manager

Runtime Manager is the device-wide authority for development runtimes. The user
selects one provider globally for each stable family such as `python`, `node`,
`java`, or `rust`. Each extension runtime requirement explicitly supports the
selected runtime, one exact extension-managed runtime, or both. Extensions do
not inspect or mutate the global selection, and the host never searches terminal
`PATH`.

A consumer declares `runtimeRequirements`. The `runtimes.execute` permission
authorizes runtime execution but exposes no selection or process API to isolated
providers. The three exact source forms are:

- `{ "selected": true }` uses only a compatible Runtime Manager selection.
- `{ "managed": { "tool": "publisher.runtime-tool" } }` uses only that exact
  owned managed-tool dependency.
- `{ "selected": true, "managed": { "tool": "publisher.runtime-tool" } }`
  uses a compatible selection first and the managed runtime when no usable
  selection is available.

The declared fallback does not change the global selection. A missing, changed,
incompatible, or failed selection remains diagnosable even when managed
execution can continue.

```json
{
  "permissions": ["runtimes.execute"],
  "toolRequirements": [{
    "id": "zyntax.python-runtime",
    "version": ">=3.14.6 <4",
    "platforms": [{ "os": "android", "architecture": "arm64-v8a" }],
    "capabilities": ["runtime.python"]
  }],
  "runtimeRequirements": [{
    "id": "python",
    "runtime": "python",
    "minimumVersion": "3.12.0",
    "capabilities": ["process.execute"],
    "sources": {
      "selected": true,
      "managed": { "tool": "zyntax.python-runtime" }
    }
  }]
}
```

The managed `tool` must name an entry in the same manifest's
`toolRequirements`. Its signed release must be a runtime tool whose
`projectRuntime` family, version, and capabilities satisfy the requirement.
Runtime executions continue to declare only `{ requirement, command }`; for a
managed runtime, the host resolves that command through the signed
`projectRuntime.commands` mapping. Extensions never duplicate its entrypoint,
runtime root, executable path, or environment.

Runtime inventory, verification, selection, and execution are host-owned. A
declarative `contributes.runtimeProviders` entry may describe how a signed
terminal-package repository exposes an installed runtime; it does not inspect
packages or execute code. The host verifies the exact owning package and
prefix-relative command files, performs the bounded version probe, and then adds
the candidate to Runtime Manager. It never searches `PATH`.

```json
{
  "permissions": ["terminal.packages"],
  "contributes": {
    "runtimeProviders": [{
      "id": "termux.node",
      "runtime": "node",
      "label": "Terminal Node.js",
      "capabilities": ["process.execute"],
      "package": { "repository": "termux-main", "name": "nodejs" },
      "commands": [
        { "id": "node", "path": "bin/node" },
        {
          "id": "npm",
          "path": "lib/node_modules/npm/bin/npm-cli.js",
          "package": { "repository": "termux-main", "name": "npm" },
          "capabilities": ["package-manager.npm"]
        }
      ],
      "versionProbe": {
        "command": "node",
        "args": ["--version"],
        "stream": "stdout",
        "prefix": "v"
      }
    }]
  }
}
```

The top-level `package` is the required primary owner. Commands use that owner
unless they declare an optional companion `package`. Companion commands and
their sorted, unique capabilities appear only while that package owns the
declared file. An owned command may be an ELF or a bounded shebang script. A
script is exposed only when its interpreter resolves to another exact command
declared by the same provider; the host materializes that interpreter and the
script path without consulting ambient `PATH`, and rejects missing or cyclic
interpreter chains. The version probe must use a primary-owned command, so a missing
companion never removes the runtime itself. Managed `.ztool` runtimes instead
declare the runtime they actually contain; they do not act as package-provider
registries. Selected and managed runtimes share the same provider-neutral
symbolic commands; no provider can declare a native path, environment, shell
fragment, or inferred fallback command.

A runtime task references its manifest-local requirement and a provider-neutral
command id. Its required console mode chooses an interactive PTY or captured
output without changing runtime resolution:

```ts
const execution = {
  kind: "runtime" as const,
  requirement: "python",
  command: "python",
  args: ["main.py"],
  workingDirectory: [],
  console: "terminal" as const,
};
```

`ExtensionRuntimeCommandReference` is the same two-field executable reference
for typed host process descriptors. Arbitrary provider configuration uses the
reserved, explicit `ExtensionRuntimeCommandConfigurationReference` sentinel:

```json
{
  "executable": {
    "$runtimeCommand": {
      "requirement": "language-runtime",
      "command": "runtime"
    }
  }
}
```

The host interprets only the tagged value; an ordinary JSON object containing
`requirement` and `command` remains provider-owned JSON. The two strict
validators check the exact path-free shapes. The host additionally verifies
that `requirement` belongs to the installed manifest and that the selected
provider exposes `command`.

Public runtime identities contain only an opaque installed-source identity,
stable candidate id, and exact observation fingerprint. Native locations never cross
the extension boundary. If an installation changes, its fingerprint changes
and the global selection becomes explicitly unavailable until the user selects
the current candidate.

## Incremental structural documents

A structural-region provider owns incremental parser state for each source
document that the host opens. `openDocument` receives an opaque, non-empty
`documentId` and the only complete source-text snapshot transferred for that
document generation. The provider retains the corresponding text and parser
state.

The host serializes lifecycle calls for each `documentId`.
`applyDocumentChanges` advances the open document from `baseVersion` to exactly
`baseVersion + 1` without changing its generation. Its changes are ordered,
non-overlapping UTF-16 ranges in the base revision, and every range in the batch
uses that same coordinate space. Lifecycle mutations commit atomically. The host
does not cancel them during ordinary editing; cancellation is reserved for
teardown. A generation change closes the old document and opens a new identity
with a fresh source snapshot.

Each successful open or change acknowledges the exact `documentId`, version,
and generation that was committed. `provideRegion` asynchronously returns the
validated root-to-owner path for one position and association.
`provideRegionDocument` asynchronously returns the complete region document
when a document-wide consumer needs it. Both target an exact version and
generation, and both results echo the `documentId`, source URI, version,
generation, and provider id so the host can reject stale or cross-document
output. The host cancels superseded queries and retains only the latest result;
implementations must yield cooperatively and observe the cancellation token
while preparing structure by awaiting `cancellation.checkpoint()` at safe
intervals.

`closeDocument` is required and idempotent. It echoes the released
`documentId`; disposing the provider releases every still-open document. The
contract has no stateless `provideRegions(snapshot)` method or compatibility
alias.

Language-server mappings declare only verified routes. Position routes are
`completion`, `hover`, `signatureHelp`, `definition`, `implementation`,
`typeDefinition`, `references`, `rename`, `codeActions`, `typeHierarchy`, and
`documentHighlights`. Document/workspace routes are `diagnostics`,
`semanticTokens`, `workspaceSymbols`, `documentSymbols`, `foldingRanges`, and
`documentFormatting`. The host negotiates the matching standard LSP methods and
routes parser-owned source or virtual coordinates; it never infers a claim from
the server, language, filename, or installed package.

A language-server contribution may declare `projectFiles`, a non-empty list of
at most `EXTENSION_LSP_MAX_PROJECT_FILES` (32) distinct project-relative file paths.
The server is eligible when **any** listed path is an actual regular file in the
open project. Matching is exact and case-sensitive, uses the current filesystem
rather than unsaved editor buffers, and is re-evaluated when the project or those
files change. No directory scan or glob matching is performed. Omitting
`projectFiles` makes the server unconditional.

`isExtensionProjectFilePath` validates the shared path syntax. Paths use forward
slashes and contain at most `EXTENSION_LSP_MAX_PROJECT_FILE_LENGTH` (384) UTF-16
code units. Unicode and interior spaces are allowed; absolute paths, empty,
`.` or `..` segments, surrounding segment whitespace, control characters,
backslashes, colons, and glob characters (`*?[]{}`) are rejected. Conditions
never authorize access outside the open project.

Eligible servers retain their declared language priority. At equal priority, a
matching project-conditioned exclusive server takes precedence over an
unconditional exclusive server. Equal priority and equal project specificity
remain an explicit conflict; additive servers remain additive. Catalog default
language recommendations consider only unconditional servers, since a catalog
has no project context.

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
execution plan. A `managedTool` plan selects a declared tool/entrypoint and requires
`tools.execute`; a `runtime` plan selects a declared requirement/command and requires
`runtimes.execute`; a `command` plan selects a bare command from the user's terminal
environment and requires `terminal`. Every route explicitly selects `terminal` or
`captured` console output, bounded arguments and contained working-directory segments.
Arguments may include `ExtensionTaskPath` bindings. Optional process inputs bind
environment values without exposing host routing variables. Package paths belong
to declared installed stack requirements; signed `resources/*` assets belong to
the exact extension generation. These references do not change execution domains:
managed execution cannot acquire terminal-package paths or switch to terminal tools.
The host resolves and reviews inputs before launch and owns cancellation. Terminal-profile
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
versions, package-manager options, commands, paths, environment values, or scripts.
`inspectStack` returns installed, candidate and available versions. Transactions require
`{ stack, intent, packages: [{ id, version }] }`: exact declared requirement selections for
`install`, `repair`, `update` or `remove` (the installed version for removal). The existing
Package Manager reviews the complete impact and owns the mutation queue; stale selections
are rejected. This permission does not grant execution. Separate SDK/NDK components remain
the responsibility of their installers, not a second package manager in the SDK.

```json
{
  "permissions": ["extension.execute", "terminal.packages"],
  "contributes": {
    "developmentStacks": [{
      "id": "web-runtime",
      "label": "Web runtime",
      "packages": [{ "id": "node", "repository": "termux-main", "package": "nodejs-lts" }]
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

A signed managed-tool `tool.json` entrypoint may also declare non-empty static
`args`. Each value is either a bounded literal string or the same
`$toolResource` reference, restricted to a direct managed-tool dependency. The
host resolves these static arguments immediately before launch and places them
before invocation arguments. Omit `args` when there are no static arguments;
an empty array is not a second canonical representation. This gives an adapter
an exact signed dependency resource through ordinary process arguments without
declaring an installation path, environment variable, shell fragment, or host
filesystem layout.

A managed-tool capability probe may declare non-empty `stdin` containing at most
`MANAGED_TOOL_PROBE_MAX_STDIN_BYTES` (65,536) UTF-8 bytes. The host writes those
exact bytes and then closes stdin before it waits for the bounded probe result.
When `stdin` is omitted, the host closes stdin immediately. This supports
protocol-aware checks without exposing paths, environments, shell commands, or
process control to package metadata.

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
`findFiles({ project, include, exclude?, maxResults }, cancellation)`. `project: null`
explicitly means the explorer workspace; a selected context ID means that project.
Globs are relative to that scope; a basename-only glob matches at any depth. Results contain
only canonical document URIs and project-relative paths, are deterministic and
bounded, and remain subject to the same project-confined `readText` boundary.
`readText`, `readTextIfExists` and `relativePath` take `{ project, uri }`.
`relativePath` returns its project-relative identity, or `null` outside the selected
project. The isolated provider never receives a native path or direct filesystem
access. `workspace.write.applyEdits` likewise takes `{ project, edits }`.

## Project panels and owned tasks

`projects.select` opens the host's location picker without changing the explorer.
Relative input is explorer-relative; `~/` uses terminal home. Selection keys are
saved locally per extension/workspace, while returned IDs never rebind to another
location. `projects.bindIntegrations` explicitly shares a selected project with
declared optional integrations after review; it shares no file/secret selections.
Providers receive their scope in `context.workspace.project`, and task requests
carry both scope and canonical project URI. Reads and language services must use
that scope, not silently substitute the explorer project.

`files.select` resolves relative input from its explicit project, supports user
selection outside that root, and returns an owned file/directory reference for
process bindings. Descendant paths must remain contained; a file reference allows
no descendants. `files.export` copies a scoped artifact to a user-chosen destination.
`secrets.request` uses host-owned private input and encrypted storage. Only references
cross provider RPC and enter task environment bindings, never raw values or argv.
Programs receiving credentials can print them; this is not a sandbox against a
malicious build script. Host records and errors must not disclose credentials.

`tasks.execute` operates the extension's declared task providers through one
`list/start/sessions/observe/reveal/stop/release` lifecycle. `start` resolves scope
and inputs once. Cancellation before a successful response also stops newly spawned
work; after that response, `stop` owns cancellation. Observation waits for changes
after a monotonic cursor and returns bounded output plus current lifecycle state;
it does not poll or stop work when cancelled. Closing a panel does not stop builds.
Exit frees the PTY, results stay until released, and extension disposal stops owned
work. Root changes affect future launches, not already-running tasks.

`workbench` updates/reveals/closes manifest-declared panels, including `dialog`
placement. Reuse list/tree/form/detail descriptors and host controls, not a separate
UI framework. Updates preserve stable-ID form drafts unless `resetForm` is requested.
Per-control `disabled` state keeps actions such as Stop usable while a panel is busy.
Semantic icons and file/folder icons resolve through app presentation; theme changes
apply live. Isolated custom views use `presentation()`, revision-bound `resolveIcons`
and `presentation` events for the same colors, typography and icons. They receive
no app component imports, stylesheet paths or native asset paths.

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
