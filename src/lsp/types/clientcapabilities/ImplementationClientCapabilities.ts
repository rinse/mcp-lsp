/**
 * Client Capability:
 * - property name (optional): textDocument.implementation
 * - property type: ImplementationClientCapabilities defined as follows:
 */
export interface ImplementationClientCapabilities {
  /**
   * Whether implementation supports dynamic registration.
   */
  dynamicRegistration?: boolean;

  /**
   * The client supports additional metadata in the form of implementation links.
   */
  linkSupport?: boolean;
}
