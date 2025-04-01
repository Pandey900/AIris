import socket from "socket.io-client";

let socketInstance = null;

export const initializeSocket = (projectId) => {
  if (!projectId) {
    console.error("Cannot initialize socket: projectId is undefined");
    return null;
  }

  try {
    socketInstance = socket(import.meta.env.VITE_API_URL, {
      auth: {
        token: localStorage.getItem("token"),
      },
      query: {
        projectId,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log(`Socket connected for project: ${projectId}`);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return socketInstance;
  } catch (error) {
    console.error("Socket initialization error:", error);
    return null;
  }
};

export const receiveMessage = (eventName, cb) => {
  if (!socketInstance) {
    console.error("Socket not initialized. Cannot receive messages.");
    return;
  }
  socketInstance.on(eventName, cb);
};

export const sendMessage = (eventName, data) => {
  if (!socketInstance) {
    console.error("Socket not initialized. Cannot send message.");
    return;
  }
  socketInstance.emit(eventName, data);
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("Socket disconnected");
  }
};
