import { useEffect, useState } from "react";
import axios from "axios";
import "./Inicio.css";

const Inicio = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    preparando: 0,
    listos: 0
  });

  /* =========================
     CARGAR PEDIDOSssss
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/orders"
        );

        const data = res.data;

        setOrders(data);

        /* =========================
           CALCULAR ESTADÍSTICAS
        ========================= */
        const total = data.length;

        const pendientes = data.filter(
          (o) => o.status === "pendiente"
        ).length;

        const preparando = data.filter(
          (o) => o.status === "preparando"
        ).length;

        const listos = data.filter(
          (o) => o.status === "listo"
        ).length;

        setStats({
          total,
          pendientes,
          preparando,
          listos
        });

      } catch (error) {
        console.log("Error cargando dashboard", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="inicio-page">

      <h1>📊 Dashboard</h1>

      {/* CARDS ESTADÍSTICAS */}
      <div className="stats-grid">

        <div className="stat-card total">
          <h3>Total pedidos</h3>
          <p>{stats.total}</p>
        </div>

        <div className="stat-card pendiente">
          <h3>Pendientes</h3>
          <p>{stats.pendientes}</p>
        </div>

        <div className="stat-card preparando">
          <h3>Preparando</h3>
          <p>{stats.preparando}</p>
        </div>

        <div className="stat-card listo">
          <h3>Listos</h3>
          <p>{stats.listos}</p>
        </div>

      </div>

      {/* ÚLTIMOS PEDIDOS */}
      <div className="recent-orders">

        <h2>🧾 Últimos pedidos</h2>

        {orders.slice(0, 5).map((order) => (
          <div key={order._id} className="order-row">

            <div>
              <b>{order.orderNumber}</b>
              <p>
                {order.customer.firstName}{" "}
                {order.customer.lastName}
              </p>
            </div>

            <span className={`status ${order.status}`}>
              {order.status}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
};

export default Inicio;