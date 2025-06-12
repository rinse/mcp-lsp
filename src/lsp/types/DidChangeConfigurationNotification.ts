export interface DidChangeConfigurationClientCapabilities {
	/**
	 * Did change configuration notification supports dynamic registration.
	 *
	 * @since 3.6.0 to support the new pull model.
	 */
	dynamicRegistration?: boolean;
}
