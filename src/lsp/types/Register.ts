import { LSPAny } from "./BaseTypes";
import { DocumentSelector } from "./DocumentFilter";

/**
 * General parameters to register for a capability.
 */
export interface Registration {
  /**
	 * The id used to register the request. The id can be used to deregister
	 * the request again.
	 */
  id: string;

  /**
	 * The method / capability to register for.
	 */
  method: string;

  /**
	 * Options necessary for the registration.
	 */
  registerOptions?: LSPAny;
}

export interface RegistrationParams {
  registrations: Registration[];
}

/**
 * Static registration options to be returned in the initialize request.
 */
export interface StaticRegistrationOptions {
  /**
	 * The id used to register the request. The id can be used to deregister
	 * the request again. See also Registration#id.
	 */
  id?: string;
}

/**
 * General text document registration options.
 */
export interface TextDocumentRegistrationOptions {
  /**
	 * A document selector to identify the scope of the registration. If set to
	 * null the document selector provided on the client side will be used.
	 */
  documentSelector: DocumentSelector | null;
}
