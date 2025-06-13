export interface TextDocumentSyncClientCapabilities {
  /**
	 * Whether text document synchronization supports dynamic registration.
	 */
  dynamicRegistration?: boolean;

  /**
	 * The client supports sending will save notifications.
	 */
  willSave?: boolean;

  /**
	 * The client supports sending a will save request and
	 * waits for a response providing text edits which will
	 * be applied to the document before it is saved.
	 */
  willSaveWaitUntil?: boolean;

  /**
	 * The client supports did save notifications.
	 */
  didSave?: boolean;
}
