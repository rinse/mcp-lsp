import { ClientCapabilities } from "./types/clientcapabilities/ClientCapabilities";

export function createLSPClientCapabilities(): ClientCapabilities {
  return {
    workspace: {
      workspaceEdit: {
        documentChanges: false,
        resourceOperations: ['create', 'rename', 'delete'],
      },
    },
  };
}
