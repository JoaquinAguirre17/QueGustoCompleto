import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");


export const useSocket = () => {

  const [newOrder, setNewOrder] = useState(null);

  const [updatedOrder, setUpdatedOrder] = useState(null);


  useEffect(() => {


    /* =====================================================
       NUEVO PEDIDO
    ===================================================== */

    const handleNewOrder = (data) => {

      console.log(
        "🟢 Socket → Nuevo pedido:",
        data
      );


      setNewOrder(data);


      /* 🔊 Sonido nuevo pedido */

      const audio = new Audio(
        "/sounds/new.mp3"
      );


      audio
        .play()
        .catch((error) => {

          console.warn(
            "🔇 No se pudo reproducir el sonido:",
            error
          );

        });

    };


    /* =====================================================
       PEDIDO ACTUALIZADO
    ===================================================== */

    const handleOrderUpdated = (data) => {

      console.log(
        "🔄 Socket → Pedido actualizado:",
        data
      );


      setUpdatedOrder(data);


      /* 🔊 Sonido actualización */

      const audio = new Audio(
        "/sounds/update.mp3"
      );


      audio
        .play()
        .catch((error) => {

          console.warn(
            "🔇 No se pudo reproducir el sonido:",
            error
          );

        });

    };


    /* =====================================================
       EVENTOS SOCKET.IO
    ===================================================== */

    socket.on(
      "newOrder",
      handleNewOrder
    );


    socket.on(
      "orderUpdated",
      handleOrderUpdated
    );


    /* =====================================================
       LIMPIAR EVENTOS
    ===================================================== */

    return () => {

      socket.off(
        "newOrder",
        handleNewOrder
      );


      socket.off(
        "orderUpdated",
        handleOrderUpdated
      );

    };

  }, []);


  return {
    newOrder,
    updatedOrder
  };

};

