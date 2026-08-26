/** JSON value permitted across extension isolation and native RPC boundaries. */
export type ExtensionJsonValue =
  | null
  | boolean
  | number
  | string
  | ExtensionJsonValue[]
  | ExtensionJsonObject;

export type ExtensionJsonObject = { [key: string]: ExtensionJsonValue };
