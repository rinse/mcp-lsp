import { HoverOptions } from "../HoverRequest";

export interface ServerCapabilities {
  /**
   * The server provides hover support.
   */
  hoverProvider?: boolean | HoverOptions;
}
