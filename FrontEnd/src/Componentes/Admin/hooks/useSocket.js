import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../config/api";

// Conexión única de Socket.IO
const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

const AUDIO_PATH = "/sounds/PEDIDODEEMPANADAS.mp3";
const SOUND_DURATION = 10000;

export const useSocket = () => {
  const [newOrder, setNewOrder] = useState(null);
  const [updatedOrder, setUpdatedOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioRef = useRef(null);
  const stopTimerRef = useRef(null);

  // Preparar el audio sin reproducirlo
  useEffect(() => {
    const audio = new Audio(AUDIO_PATH);

    audio.loop = true;
    audio.preload = "auto";

    audioRef.current = audio;

    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }

      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  // Activar sonido desde el botón, sin reproducirlo
  const enableSound = useCallback(() => {
    setSoundEnabled(true);
  }, []);

  // Desactivar sonido
  const disableSound = useCallback(() => {
    setSoundEnabled(false);

    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Reproducir alarma durante 10 segundos
  const playNewOrderSound = useCallback(async () => {
    if (!soundEnabled) return;

    const audio = audioRef.current;

    if (!audio) return;

    // Evitar acumular alarmas
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }

    audio.pause();
    audio.currentTime = 0;

    try {
      await audio.play();

      stopTimerRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        stopTimerRef.current = null;
      }, SOUND_DURATION);

    } catch (error) {
      console.warn("No se pudo reproducir la alarma:", error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    const handleNewOrder = (data) => {
      console.log("🟢 Socket → Nuevo pedido:", data);

      setNewOrder(data);
      playNewOrderSound();
    };

    const handleOrderUpdated = (data) => {
      console.log("🔄 Socket → Pedido actualizado:", data);

      setUpdatedOrder(data);
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("orderUpdated", handleOrderUpdated);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderUpdated", handleOrderUpdated);
    };
  }, [playNewOrderSound]);

  return {
    newOrder,
    updatedOrder,
    soundEnabled,
    enableSound,
    disableSound,
  };
};