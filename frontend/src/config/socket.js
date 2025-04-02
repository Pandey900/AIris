import socket from "socket.io-client";

let socketInstance = null;

export const initilizeSocket = (projectId) => {
  socketInstance = socket(import.meta.env.VITE_API_URL, {
    auth: {
      token: localStorage.getItem("token"),
    },
    query: {
      projectId,
    },
  });
  return socketInstance;
};

export const receiveMessage = (eventName, cb) => {
  socketInstance.on(eventName, cb);
  if (!socketInstance) {
    console.error("Socket not initialized");
    return;
  }
};
export const sendMessage = (eventName, data) => {
  socketInstance.emit(eventName, data);
  if (!socketInstance) {
    console.error("Socket not initialized");
    return;
  }
};
