
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../config/api";

// Conexión única al servidor Socket.IO
const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export const useSocket = () => {
  const [newOrder, setNewOrder] = useState(null);
  const [updatedOrder, setUpdatedOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Reproduce un sonido únicamente si el administrador habilitó el audio
  const playSound = useCallback((file) => {
    if (!soundEnabled) return;

    const audio = new Audio(file);
    audio.volume = 0.8;

    audio.play().catch((error) => {
      console.warn("No se pudo reproducir el sonido:", error);
    });
  }, [soundEnabled]);

  // Activar sonido desde un botón (requiere interacción del usuario)
  const enableSound = useCallback(async () => {
    try {
      const audio = new Audio("/sounds/PEDIDODEEMPANADAS.mp3");
      audio.volume = 0.5;

      // La reproducción comienza dentro de la interacción del usuario.
      await audio.play();

      setSoundEnabled(true);

      console.log("🔊 Sonidos de pedidos activados");
      return true;
    } catch (error) {
      console.error(
        "No se pudo activar el sonido. Verificá que exista el archivo MP3:",
        error
      );

      return false;
    }
  }, []);

  useEffect(() => {
    // NUEVO PEDIDO
    const handleNewOrder = (data) => {
      console.log("🟢 Socket → Nuevo pedido:", data);

      setNewOrder(data);

      playSound("/sounds/PEDIDODEEMPANADAS.mp3");
    };

    // PEDIDO ACTUALIZADO
    const handleOrderUpdated = (data) => {
      console.log("🔄 Socket → Pedido actualizado:", data);

      setUpdatedOrder(data);

      playSound("/sounds/QueGustoo.ogg");
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("orderUpdated", handleOrderUpdated);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderUpdated", handleOrderUpdated);
    };
  }, [playSound]);

  return {
    newOrder,
    updatedOrder,
    soundEnabled,
    enableSound,
  };
};
