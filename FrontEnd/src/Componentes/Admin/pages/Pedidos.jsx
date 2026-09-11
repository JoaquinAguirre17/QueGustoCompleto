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

        setOrders(
          Array.isArray(res.data)
            ? res.data
            : []
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


    setOrders((prevOrders) => {

      /* Evitar duplicados */

      const exists = prevOrders.some(
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

      const exists = prevOrders.some(
        (order) =>
          order._id === updatedOrder._id
      );


      /* Si existe, reemplazarlo */

      if (exists) {

        return prevOrders.map(
          (order) =>
            order._id === updatedOrder._id
              ? updatedOrder
              : order
        );

      }


      /* Si no existe, agregarlo */

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


      await axios.patch(
        `${API_URL}/orders/${id}/status`,
        {
          status
        }
      );


      console.log(
        "✅ Estado actualizado correctamente"
      );


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
          onClick={() => window.location.reload()}
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
              📭 No hay pedidos todavía.
            </p>

          </div>

        ) : (

          <div className="orders-grid">

            {
              orders.map((order) => (

                <OrderCard
                  key={order._id}
                  order={order}
                  changeStatus={changeStatus}
                />

              ))
            }

          </div>

        )
      }

    </div>

  );

};


export default Pedidos;

