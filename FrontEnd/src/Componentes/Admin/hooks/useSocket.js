
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../config/api";

// Conexión al servidor Socket.IO
const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export const useSocket = () => {
  const [newOrder, setNewOrder] = useState(null);
  const [updatedOrder, setUpdatedOrder] = useState(null);

  useEffect(() => {
    // NUEVO PEDIDO
    const handleNewOrder = (data) => {
      console.log("🟢 Socket → Nuevo pedido:", data);

      setNewOrder(data);

      const audio = new Audio("/sounds/new.mp3");

      audio.play().catch((error) => {
        console.warn("🔇 No se pudo reproducir el sonido:", error);
      });
    };

    // PEDIDO ACTUALIZADO
    const handleOrderUpdated = (data) => {
      console.log("🔄 Socket → Pedido actualizado:", data);

      setUpdatedOrder(data);

      const audio = new Audio("/sounds/update.mp3");

      audio.play().catch((error) => {
        console.warn("🔇 No se pudo reproducir el sonido:", error);
      });
    };

    // EVENTOS
    socket.on("newOrder", handleNewOrder);
    socket.on("orderUpdated", handleOrderUpdated);

    // LIMPIEZA
    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderUpdated", handleOrderUpdated);
    };
  }, []);

  return {
    newOrder,
    updatedOrder,
  };
};
