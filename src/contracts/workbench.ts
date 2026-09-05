import type { ExtensionCancellationToken } from "../contract.js";

export type WorkbenchContributionKind =
  | "menu"
  | "toolbar"
  | "touchEditorToolbar"
  | "status"
  | "panel"
  | "customView";

export type WorkbenchMenuPlacement =
  | "workbench.menu"
  | "explorer.context"
  | "editor.context"
  | "editor.tab.context"
  | "panel.context";

export type WorkbenchToolbarPlacement =
  | "workbench.header"
  | "explorer.header"
  | "editor.header"
  | "panel.header";

export type TouchEditorToolbarPlacement =
  | "editor.touch.primary"
  | "editor.touch.overflow";

export type WorkbenchStatusPlacement = "status.left" | "status.right";

export type WorkbenchPanelPlacement =
  | "sidebar.primary"
  | "sidebar.secondary"
  | "bottom"
  | "editor"
  | "dialog";

/** Icons are selected from this host-owned set; packages cannot provide components or markup. */
export type WorkbenchIconId =
  | "add"
  | "arrow-left"
  | "branch"
  | "check"
  | "chevron-right"
  | "close"
  | "code"
  | "copy"
  | "delete"
  | "download"
  | "edit"
  | "file"
  | "folder"
  | "info"
  | "menu"
  | "more"
  | "play"
  | "refresh"
  | "save"
  | "search"
  | "settings"
  | "terminal"
  | "warning";

/** Display context for the active file-icon theme; grants no access to this path. */
export interface WorkbenchFileIcon {
  readonly kind: "file" | "folder";
  readonly path: string;
  readonly expanded?: boolean;
  readonly root?: boolean;
  readonly languageId?: string;
}

export type WorkbenchIcon = WorkbenchIconId | WorkbenchFileIcon;

export type WorkbenchJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly WorkbenchJsonValue[]
  | { readonly [key: string]: WorkbenchJsonValue };

export type WorkbenchCommandArguments = Readonly<
  Record<string, WorkbenchJsonValue>
>;

export interface WorkbenchCommandReference {
  readonly command: string;
  readonly args?: WorkbenchCommandArguments;
}

interface WorkbenchContributionBase {
  readonly id: string;
  readonly when?: string;
  readonly group?: string;
  readonly order?: number;
}

interface WorkbenchCommandContributionBase extends WorkbenchContributionBase {
  readonly label: string;
  readonly compactLabel?: string;
  readonly tooltip?: string;
  readonly icon?: WorkbenchIcon;
  readonly command: WorkbenchCommandReference;
  readonly enablement?: string;
}

export interface WorkbenchMenuContribution
  extends WorkbenchCommandContributionBase {
  readonly kind: "menu";
  readonly placement: WorkbenchMenuPlacement;
}

export interface WorkbenchToolbarContribution
  extends WorkbenchCommandContributionBase {
  readonly kind: "toolbar";
  readonly placement: WorkbenchToolbarPlacement;
}

export interface TouchEditorToolbarContribution
  extends WorkbenchCommandContributionBase {
  readonly kind: "touchEditorToolbar";
  readonly placement: TouchEditorToolbarPlacement;
}

export interface WorkbenchStatusContribution extends WorkbenchContributionBase {
  readonly kind: "status";
  readonly placement: WorkbenchStatusPlacement;
  readonly text: string;
  readonly tooltip?: string;
  readonly icon?: WorkbenchIcon;
  readonly command?: WorkbenchCommandReference;
  readonly enablement?: string;
}

interface WorkbenchViewItemBase {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: WorkbenchIcon;
  readonly when?: string;
  readonly enablement?: string;
  /** Dynamic state, combined with declarative enablement; does not hide the item. */
  readonly disabled?: boolean;
  readonly command?: WorkbenchCommandReference;
}

export interface WorkbenchListItem extends WorkbenchViewItemBase {}

export interface WorkbenchTreeItem extends WorkbenchViewItemBase {
  readonly children?: readonly WorkbenchTreeItem[];
}

export interface WorkbenchEmptyState {
  readonly title: string;
  readonly description?: string;
}

export interface WorkbenchListViewDescriptor {
  readonly kind: "list";
  readonly ariaLabel: string;
  readonly items: readonly WorkbenchListItem[];
  readonly empty?: WorkbenchEmptyState;
}

export interface WorkbenchTreeViewDescriptor {
  readonly kind: "tree";
  readonly ariaLabel: string;
  readonly items: readonly WorkbenchTreeItem[];
  readonly empty?: WorkbenchEmptyState;
}

interface WorkbenchFormFieldBase {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly required?: boolean;
  readonly when?: string;
  readonly enablement?: string;
  readonly disabled?: boolean;
}

export interface WorkbenchTextFormField extends WorkbenchFormFieldBase {
  readonly type: "text" | "textarea";
  readonly placeholder?: string;
  readonly defaultValue?: string;
}

export interface WorkbenchCheckboxFormField extends WorkbenchFormFieldBase {
  readonly type: "checkbox";
  readonly defaultValue?: boolean;
}

export interface WorkbenchSelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface WorkbenchSelectFormField extends WorkbenchFormFieldBase {
  readonly type: "select";
  readonly options: readonly WorkbenchSelectOption[];
  readonly defaultValue?: string;
}

export type WorkbenchFormField =
  | WorkbenchTextFormField
  | WorkbenchCheckboxFormField
  | WorkbenchSelectFormField;

export interface WorkbenchFormSubmitDescriptor {
  readonly label: string;
  readonly icon?: WorkbenchIcon;
  readonly command: string;
  readonly enablement?: string;
  readonly disabled?: boolean;
}

export interface WorkbenchFormViewDescriptor {
  readonly kind: "form";
  readonly ariaLabel: string;
  readonly fields: readonly WorkbenchFormField[];
  readonly submit: WorkbenchFormSubmitDescriptor;
}

export interface WorkbenchDetailTextSection {
  readonly kind: "text";
  readonly id: string;
  readonly title?: string;
  readonly text: string;
}

export interface WorkbenchDetailProperty {
  readonly label: string;
  readonly value: string;
}

export interface WorkbenchDetailPropertiesSection {
  readonly kind: "properties";
  readonly id: string;
  readonly title?: string;
  readonly properties: readonly WorkbenchDetailProperty[];
}

export interface WorkbenchDetailAction extends WorkbenchViewItemBase {
  readonly command: WorkbenchCommandReference;
}

export interface WorkbenchDetailActionsSection {
  readonly kind: "actions";
  readonly id: string;
  readonly title?: string;
  readonly actions: readonly WorkbenchDetailAction[];
}

export type WorkbenchDetailSection =
  | WorkbenchDetailTextSection
  | WorkbenchDetailPropertiesSection
  | WorkbenchDetailActionsSection;

export interface WorkbenchDetailViewDescriptor {
  readonly kind: "detail";
  readonly ariaLabel: string;
  readonly sections: readonly WorkbenchDetailSection[];
}

export type WorkbenchDeclarativeViewDescriptor =
  | WorkbenchListViewDescriptor
  | WorkbenchTreeViewDescriptor
  | WorkbenchFormViewDescriptor
  | WorkbenchDetailViewDescriptor;

export interface WorkbenchPanelContribution extends WorkbenchContributionBase {
  readonly kind: "panel";
  readonly placement: WorkbenchPanelPlacement;
  readonly title: string;
  readonly icon?: WorkbenchIcon;
  readonly view: WorkbenchDeclarativeViewDescriptor;
}

/** Updates a manifest-declared panel owned by the calling extension activation. */
export interface WorkbenchPanelUpdate {
  /** Replace content; omitted content preserves the current view and its form draft. */
  readonly view?: WorkbenchDeclarativeViewDescriptor;
  readonly title?: string;
  readonly busy?: boolean;
  /** Restore form defaults explicitly, e.g. after selecting a different project.
   * Otherwise updates reconcile stable field IDs and preserve user drafts.
   */
  readonly resetForm?: boolean;
}

export type WorkbenchPresentationColor =
  | "background"
  | "surface"
  | "header"
  | "border"
  | "accent"
  | "accentHover"
  | "foreground"
  | "muted"
  | "success"
  | "warning"
  | "danger"
  | "selection"
  | "hover"
  | "active"
  | "scrollbar"
  | "focus";

/** Shared presentation data for isolated custom views, without app CSS or asset paths. */
export interface WorkbenchPresentation {
  /** Increases when colors, typography or icon selection changes. */
  readonly revision: number;
  readonly colorScheme: "light" | "dark";
  readonly highContrast: boolean;
  readonly colors: Readonly<Record<WorkbenchPresentationColor, string>>;
  readonly fontFamily: string;
  /** CSS pixels. */
  readonly fontSize: number;
  readonly iconTheme: string;
}

export type WorkbenchIconDataUrl = `data:image/svg+xml;base64,${string}`;

export interface WorkbenchResolvedIcons {
  /** Presentation revision used to resolve every icon in this result. */
  readonly revision: number;
  /** Host-produced SVG data URLs in the same order as the requested icons. */
  readonly icons: readonly WorkbenchIconDataUrl[];
}

/** All panel IDs refer to this activation's declared panels, never arbitrary host UI. */
export interface ExtensionWorkbenchApi {
  /** At least one update field is required; other panel state remains unchanged. */
  updatePanel(
    panel: string,
    update: WorkbenchPanelUpdate,
    cancellation: ExtensionCancellationToken,
  ): Promise<void>;
  reveal(panel: string, cancellation: ExtensionCancellationToken): Promise<void>;
  /** Closes presentation only; it does not stop extension-owned tasks. */
  close(panel: string): Promise<void>;
  presentation(
    cancellation: ExtensionCancellationToken,
  ): Promise<WorkbenchPresentation>;
  resolveIcons(
    icons: readonly WorkbenchIcon[],
    cancellation: ExtensionCancellationToken,
  ): Promise<WorkbenchResolvedIcons>;
}

/**
 * A manifest-owned static document rendered by the host in a dedicated isolated renderer.
 * Every resource is a normalized `views/*` package asset. Runtime code receives no file path,
 * native bridge, browser network primitive, or application origin.
 */
export interface WorkbenchCustomViewContribution
  extends WorkbenchContributionBase {
  readonly kind: "customView";
  readonly placement: WorkbenchPanelPlacement;
  readonly title: string;
  readonly icon?: WorkbenchIcon;
  readonly entrypoint: string;
  readonly resources: readonly string[];
}

export type WorkbenchContribution =
  | WorkbenchMenuContribution
  | WorkbenchToolbarContribution
  | TouchEditorToolbarContribution
  | WorkbenchStatusContribution
  | WorkbenchPanelContribution
  | WorkbenchCustomViewContribution;

export interface ExtensionViewHostRequest {
  readonly type: "hostRequest";
  readonly id: string;
  readonly capability: string;
  readonly method: string;
  readonly payload: WorkbenchCommandArguments;
}

export interface ExtensionViewHostCancel {
  readonly type: "hostCancel";
  readonly id: string;
}

export interface ExtensionViewHostSuccess {
  readonly type: "hostResponse";
  readonly id: string;
  readonly ok: true;
  readonly result: WorkbenchJsonValue;
}

export interface ExtensionViewHostFailure {
  readonly type: "hostResponse";
  readonly id: string;
  readonly ok: false;
  readonly error: {
    readonly name: string;
    readonly message: string;
  };
}

/** Sent when the view opens and whenever shared presentation changes. */
export interface ExtensionViewPresentationEvent {
  readonly type: "presentation";
  readonly presentation: WorkbenchPresentation;
}

export type ExtensionViewHostMessage =
  | ExtensionViewHostRequest
  | ExtensionViewHostCancel;

export type ExtensionViewHostResponse =
  | ExtensionViewHostSuccess
  | ExtensionViewHostFailure
  | ExtensionViewPresentationEvent;

/** Exact origin-scoped object injected only by the dedicated native extension-view renderer. */
export interface ExtensionViewHostBridge {
  postMessage(message: string): void;
  addEventListener(
    type: "message",
    listener: (event: { readonly data: string }) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: { readonly data: string }) => void,
  ): void;
}

export const EXTENSION_VIEW_HOST_OBJECT = "zyntaxExtensionView" as const;

declare global {
  interface Window {
    readonly zyntaxExtensionView: ExtensionViewHostBridge;
  }
}
