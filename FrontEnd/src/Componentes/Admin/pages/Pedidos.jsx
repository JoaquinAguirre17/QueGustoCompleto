import { useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "../hooks/useSocket";
import OrderCard from "../../OrderCard/OrderCard";
import "./Pedidos.css";
const Pedidos = () => {
  const [orders, setOrders] = useState([]);

  const { newOrder, updatedOrder } = useSocket();

  /* =========================
     CARGAR PEDIDOS INICIALES
  ========================= */
  useEffect(() => {
    const fetchOrders = async () => {
      const res = await axios.get(
        "http://localhost:3000/api/orders"
      );
      setOrders(res.data);
    };

    fetchOrders();
  }, []);

  /* =========================
     NUEVOS PEDIDOS
  ========================= */
  useEffect(() => {
    if (newOrder) {
      setOrders((prev) => [newOrder, ...prev]);
    }
  }, [newOrder]);

  /* =========================
     ACTUALIZAR PEDIDOS
  ========================= */
  useEffect(() => {
    if (updatedOrder) {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === updatedOrder._id
            ? updatedOrder
            : o
        )
      );
    }
  }, [updatedOrder]);

  /* =========================
     CAMBIAR ESTADO
  ========================= */
  const changeStatus = async (id, status) => {
    await axios.patch(
      `http://localhost:3000/api/orders/${id}/status`,
      { status }
    );
  };

  return (
    <div>
      <h1>🧾 Pedidos en vivo</h1>

      <div className="orders-grid">

        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            changeStatus={changeStatus}
          />
        ))}

      </div>

    </div>
  );
};

export default Pedidos;