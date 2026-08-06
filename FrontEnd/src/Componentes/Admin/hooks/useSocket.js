import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export const useSocket = () => {
  const [newOrder, setNewOrder] = useState(null);
  const [updatedOrder, setUpdatedOrder] = useState(null);

  useEffect(() => {

    socket.on("newOrder", (data) => {
      setNewOrder(data);

      // 🔊 sonido nuevo pedido
      new Audio("/sounds/new.mp3").play();
    });

    socket.on("orderUpdated", (data) => {
      setUpdatedOrder(data);

      // 🔊 sonido cambio estado
      new Audio("/sounds/update.mp3").play();
    });

    return () => {
      socket.off("newOrder");
      socket.off("orderUpdated");
    };

  }, []);

  return { newOrder, updatedOrder };
};