
import { useEffect, useState } from "react";
import axios from "axios";

import { useSocket } from "../hooks/useSocket";
import OrderCard from "../../OrderCard/OrderCard";

import "./Pedidos.css";


const API_URL = "http://localhost:3000/api";


const Pedidos = () => {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const {
    newOrder,
    updatedOrder
  } = useSocket();


  /* =====================================================
     ESTADOS QUE NO QUEREMOS MOSTRAR
     
     Cuando un pedido pasa a alguno de estos estados,
     desaparece de esta sección.
  ===================================================== */

  const hiddenStatuses = [
    "Entregado",
    "Cancelado"
  ];


  /* =====================================================
     VERIFICAR SI EL PEDIDO DEBE MOSTRARSE
  ===================================================== */

  const isVisibleOrder = (order) => {

    if (!order) {
      return false;
    }


    return !hiddenStatuses.includes(
      order.status
    );

  };


  /* =====================================================
     FORMATEAR TELÉFONO PARA WHATSAPP
     
     Ejemplo:

     0351 1234567
            ↓
     5493511234567
  ===================================================== */

  const formatWhatsAppPhone = (phone) => {

    if (!phone) {
      return "";
    }


    let cleanPhone = String(phone)
      .replace(/\D/g, "");


    /*
      Si empieza con 0:

      03511234567
      ↓
      3511234567
    */

    if (cleanPhone.startsWith("0")) {

      cleanPhone =
        cleanPhone.substring(1);

    }


    /*
      Si no tiene código de Argentina,
      agregamos 54.
    */

    if (!cleanPhone.startsWith("54")) {

      cleanPhone =
        "54" + cleanPhone;

    }


    /*
      WhatsApp Argentina utiliza 549
      para números móviles.

      Ejemplo:

      543511234567
      ↓
      5493511234567
    */

    if (!cleanPhone.startsWith("549")) {

      cleanPhone =
        "549" +
        cleanPhone.substring(2);

    }


    return cleanPhone;

  };


  /* =====================================================
     AVISAR AL CLIENTE POR WHATSAPP
  ===================================================== */

  const notifyWhatsApp = (order) => {

    /*
      El teléfono está directamente
      en order.customer.phone
    */

    const phone =
      order?.customer?.phone;


    if (!phone) {

      alert(
        "Este cliente no tiene un número de teléfono."
      );

      return;

    }


    const whatsappPhone =
      formatWhatsAppPhone(phone);


    if (!whatsappPhone) {

      alert(
        "El número de teléfono no es válido."
      );

      return;

    }


    /*
      Nombre del cliente
    */

    const firstName =
      order?.customer?.firstName ||
      "cliente";


    /*
      Número de pedido
    */

    const orderNumber =
      order?.orderNumber ||
      "";


    /*
      Mensaje que se abrirá en WhatsApp.
    */

    const message =
      `Hola ${firstName}! 👋\n\n` +
      `Te avisamos desde Que Gusto que tu pedido ` +
      `#${orderNumber} ya está listo para entregar. 🍽️\n\n` +
      `¡Te esperamos! 😊`;


    /*
      Crear URL de WhatsApp
    */

    const whatsappUrl =
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        message
      )}`;


    /*
      Abrir WhatsApp
    */

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );

  };


  /* =====================================================
     CARGAR PEDIDOS INICIALES
  ===================================================== */

  useEffect(() => {

    const fetchOrders = async () => {

      try {

        setLoading(true);
        setError("");


        const res = await axios.get(
          `${API_URL}/orders`
        );


        const fetchedOrders =
          Array.isArray(res.data)
            ? res.data
            : [];


        /*
          Filtrar pedidos entregados/cancelados.

          De esta forma, si recargamos la página
          tampoco vuelven a aparecer.
        */

        const visibleOrders =
          fetchedOrders.filter(
            isVisibleOrder
          );


        setOrders(
          visibleOrders
        );


      } catch (error) {

        console.error(
          "❌ Error obteniendo pedidos:",
          error
        );


        setError(
          "No se pudieron cargar los pedidos"
        );


      } finally {

        setLoading(false);

      }

    };


    fetchOrders();

  }, []);


  /* =====================================================
     NUEVO PEDIDO EN TIEMPO REAL
  ===================================================== */

  useEffect(() => {

    if (!newOrder) {
      return;
    }


    console.log(
      "🟢 Nuevo pedido recibido:",
      newOrder
    );


    /*
      Si por alguna razón llega un pedido
      ya entregado o cancelado, no lo mostramos.
    */

    if (!isVisibleOrder(newOrder)) {

      console.log(
        "ℹ️ Nuevo pedido ignorado:",
        newOrder.status
      );

      return;

    }


    setOrders((prevOrders) => {

      /*
        Evitar pedidos duplicados.
      */

      const exists =
        prevOrders.some(
          (order) =>
            order._id === newOrder._id
        );


      if (exists) {

        console.log(
          "⚠️ El pedido ya existe:",
          newOrder._id
        );


        return prevOrders;

      }


      /*
        Agregar el nuevo pedido
        al principio de la lista.
      */

      return [
        newOrder,
        ...prevOrders
      ];

    });

  }, [newOrder]);


  /* =====================================================
     PEDIDO ACTUALIZADO EN TIEMPO REAL
  ===================================================== */

  useEffect(() => {

    if (!updatedOrder) {
      return;
    }


    console.log(
      "🔄 Pedido actualizado:",
      updatedOrder
    );


    setOrders((prevOrders) => {

      /* =================================================
         SI PASÓ A ENTREGADO O CANCELADO
         
         LO ELIMINAMOS DE LA PANTALLA
      ================================================= */

      if (!isVisibleOrder(updatedOrder)) {

        console.log(
          "🗑️ Eliminando pedido:",
          updatedOrder._id,
          updatedOrder.status
        );


        return prevOrders.filter(
          (order) =>
            order._id !== updatedOrder._id
        );

      }


      /* =================================================
         SI SIGUE ACTIVO
         
         ACTUALIZAMOS LA TARJETA
      ================================================= */

      const exists =
        prevOrders.some(
          (order) =>
            order._id === updatedOrder._id
        );


      if (exists) {

        return prevOrders.map(
          (order) =>
            order._id === updatedOrder._id
              ? updatedOrder
              : order
        );

      }


      /* =================================================
         SI NO EXISTÍA Y SIGUE ACTIVO
         
         LO AGREGAMOS
      ================================================= */

      return [
        updatedOrder,
        ...prevOrders
      ];

    });

  }, [updatedOrder]);


  /* =====================================================
     CAMBIAR ESTADO DEL PEDIDO
  ===================================================== */

  const changeStatus = async (
    id,
    status
  ) => {

    try {

      console.log(
        "🔄 Cambiando estado:",
        {
          id,
          status
        }
      );


      /*
        Actualizamos el estado en el backend.
      */

      await axios.patch(
        `${API_URL}/orders/${id}/status`,
        {
          status
        }
      );


      console.log(
        "✅ Estado actualizado correctamente"
      );


      /*
        Si el estado es Entregado o Cancelado,
        lo eliminamos inmediatamente.

        Esto no depende de esperar a Socket.IO.
      */

      if (
        hiddenStatuses.includes(status)
      ) {

        setOrders((prevOrders) =>
          prevOrders.filter(
            (order) =>
              order._id !== id
          )
        );

      }


    } catch (error) {

      console.error(
        "❌ Error actualizando estado:",
        error
      );


      alert(
        error.response?.data?.message ||
        "No se pudo actualizar el estado"
      );

    }

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="pedidos-page">

        <h1>
          🧾 Pedidos en vivo
        </h1>

        <p>
          Cargando pedidos...
        </p>

      </div>

    );

  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {

    return (

      <div className="pedidos-page">

        <h1>
          🧾 Pedidos en vivo
        </h1>

        <p className="error-message">
          {error}
        </p>


        <button
          onClick={() =>
            window.location.reload()
          }
        >
          Reintentar
        </button>

      </div>

    );

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="pedidos-page">

      <h1>
        🧾 Pedidos en vivo
      </h1>


      {
        orders.length === 0 ? (

          <div className="empty-orders">

            <p>
              📭 No hay pedidos pendientes.
            </p>

          </div>

        ) : (

          <div className="orders-grid">

            {
              orders.map((order) => (

                <div
                  key={order._id}
                  className="order-wrapper"
                >

                  {/* ======================================
                      TARJETA DEL PEDIDO
                  ====================================== */}

                  <OrderCard
                    order={order}
                    changeStatus={changeStatus}
                    notifyWhatsApp={notifyWhatsApp}
                  />

                </div>

              ))
            }

          </div>

        )
      }

    </div>

  );

};


export default Pedidos;

