import { useEffect, useState } from "react";
import axios from "axios";
import "./ventas.css";

const Ventas = () => {
  const [orders, setOrders] = useState([]);

  const [stats, setStats] = useState({
    totalVentas: 0,
    totalPedidos: 0,
    promedio: 0,
    efectivo: 0,
    transferencia: 0
  });

  /* =========================
     CARGAR PEDIDOS
  ========================= */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/orders"
        );

        const data = res.data;

        setOrders(data);

        /* =========================
           SOLO PEDIDOS ENTREGADOS
        ========================= */
        const entregados = data.filter(
          (o) => o.status === "entregado"
        );

        const totalVentas = entregados.reduce(
          (acc, order) => acc + order.total,
          0
        );

        const efectivo = entregados.filter(
          (o) => o.paymentMethod === "efectivo"
        ).reduce((acc, o) => acc + o.total, 0);

        const transferencia = entregados.filter(
          (o) => o.paymentMethod === "transferencia"
        ).reduce((acc, o) => acc + o.total, 0);

        const promedio =
          entregados.length > 0
            ? totalVentas / entregados.length
            : 0;

        setStats({
          totalVentas,
          totalPedidos: entregados.length,
          promedio,
          efectivo,
          transferencia
        });

      } catch (error) {
        console.log("Error cargando ventas", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="ventas-page">

      <h1>💰 Ventas</h1>

      {/* STATS */}
      <div className="ventas-grid">

        <div className="venta-card total">
          <h3>Total vendido</h3>
          <p>${stats.totalVentas}</p>
        </div>

        <div className="venta-card pedidos">
          <h3>Pedidos entregados</h3>
          <p>{stats.totalPedidos}</p>
        </div>

        <div className="venta-card promedio">
          <h3>Promedio por pedido</h3>
          <p>${stats.promedio.toFixed(2)}</p>
        </div>

        <div className="venta-card efectivo">
          <h3>Efectivo</h3>
          <p>${stats.efectivo}</p>
        </div>

        <div className="venta-card transferencia">
          <h3>Transferencia</h3>
          <p>${stats.transferencia}</p>
        </div>

      </div>

      {/* LISTADO */}
      <div className="ventas-list">

        <h2>🧾 Historial de ventas</h2>

        {orders
          .filter((o) => o.status === "entregado")
          .map((order) => (
            <div key={order._id} className="venta-row">

              <div>
                <b>{order.orderNumber}</b>
                <p>
                  {order.customer.firstName}{" "}
                  {order.customer.lastName}
                </p>
              </div>

              <div>
                <span>${order.total}</span>
                <small>{order.paymentMethod}</small>
              </div>

            </div>
          ))}

      </div>

    </div>
  );
};

export default Ventas;