import { WebContainer } from "@webcontainer/api";

let webContainerInstance = null;

export async function getWebContainer() {
  if (webContainerInstance) {
    return webContainerInstance;
  }

  try {
    console.log("Booting WebContainer...");
    // Boot the WebContainer
    webContainerInstance = await WebContainer.boot();
    console.log("WebContainer booted successfully");

    // Use proper event name: 'server-ready' instead of 'ready'
    webContainerInstance.on("server-ready", (port, url) => {
      console.log(`Server ready on port ${port} at ${url}`);
    });

    return webContainerInstance;
  } catch (error) {
    console.error("Failed to initialize WebContainer:", error);
    webContainerInstance = null;
    return null;
  }
}
