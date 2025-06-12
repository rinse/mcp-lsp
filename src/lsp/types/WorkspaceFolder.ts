import { URI } from "./Uri";

export interface WorkspaceFolder {
	/**
	 * The associated URI for this workspace folder.
	 */
	uri: URI;

	/**
	 * The name of the workspace folder. Used to refer to this
	 * workspace folder in the user interface.
	 */
	name: string;
}
