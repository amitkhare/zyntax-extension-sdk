export const EXTENSION_NOTEBOOK_KERNEL_PROTOCOL =
  "zyntax-notebook-jsonrpc" as const;
export const EXTENSION_NOTEBOOK_KERNEL_JSON_RPC_VERSION = "2.0" as const;
export const EXTENSION_NOTEBOOK_KERNEL_INITIALIZE_METHOD =
  "zyntax/notebook/initialize" as const;
export const EXTENSION_NOTEBOOK_KERNEL_EXECUTE_METHOD =
  "zyntax/notebook/execute" as const;
export const EXTENSION_NOTEBOOK_KERNEL_INTERRUPT_METHOD =
  "zyntax/notebook/interrupt" as const;
export const EXTENSION_NOTEBOOK_KERNEL_RESTART_METHOD =
  "zyntax/notebook/restart" as const;
export const EXTENSION_NOTEBOOK_KERNEL_SHUTDOWN_METHOD =
  "zyntax/notebook/shutdown" as const;
export const EXTENSION_NOTEBOOK_KERNEL_EVENT_METHOD =
  "zyntax/notebook/event" as const;
export const EXTENSION_NOTEBOOK_KERNEL_INPUT_METHOD =
  "zyntax/notebook/input" as const;
export const EXTENSION_NOTEBOOK_KERNEL_COMM_METHOD =
  "zyntax/notebook/comm" as const;
export const EXTENSION_NOTEBOOK_KERNEL_CANCEL_METHOD = "$/cancelRequest" as const;

export interface ExtensionNotebookKernelCancelRequest {
  readonly id: string | number;
}
