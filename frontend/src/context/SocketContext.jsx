import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/axios";
import { useAuthStore } from "../store/authStore";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const instance = io(API_URL, {
      withCredentials: true, // sends the httpOnly cookie for socket auth
    });

    instance.on("connect", () => setConnected(true));
    instance.on("disconnect", () => setConnected(false));

    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
