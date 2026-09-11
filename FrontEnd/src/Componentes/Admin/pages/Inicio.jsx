
import { useEffect, useState } from "react";
import axios from "axios";
import "./Inicio.css";

const API_URL = "http://localhost:3000/api";

const Inicio = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    listos: 0,
    entregados: 0,
    cancelados: 0,
    activos: 0,
    facturacion: 0
  });

  const cargarPedidos = async () => {
    try {
      setError("");

      const response = await axios.get(
        `${API_URL}/orders`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setOrders(data);

      const pendientes = data.filter(
        (order) => order.status === "Pendiente"
      ).length;

      const listos = data.filter(
        (order) => order.status === "Listo"
      ).length;

      const entregados = data.filter(
        (order) => order.status === "Entregado"
      ).length;

      const cancelados = data.filter(
        (order) => order.status === "Cancelado"
      ).length;

      const activos = data.filter(
        (order) =>
          order.status !== "Entregado" &&
          order.status !== "Cancelado"
      ).length;

      const facturacion = data
        .filter(
          (order) => order.status !== "Cancelado"
        )
        .reduce(
          (total, order) =>
            total + Number(order.total || 0),
          0
        );

      setStats({
        total: data.length,
        pendientes,
        listos,
        entregados,
        cancelados,
        activos,
        facturacion
      });

    } catch (err) {
      console.error(
        "Error cargando dashboard:",
        err
      );

      setError(
        "No se pudieron cargar los pedidos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos();
    }, 30000);

    return () => {
      clearInterval(intervalo);
    };
  }, []);

  const formatearPrecio = (valor) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const obtenerClaseEstado = (status) => {
    switch (status) {
      case "Pendiente":
        return "qg-inicio-status-pendiente";

      case "Listo":
        return "qg-inicio-status-listo";

      case "Entregado":
        return "qg-inicio-status-entregado";

      case "Cancelado":
        return "qg-inicio-status-cancelado";

      default:
        return "";
    }
  };

  const pedidosRecientes = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .slice(0, 6);

  return (
    <div className="qg-inicio-page">

      <div className="qg-inicio-header">

        <div>
          <span className="qg-inicio-eyebrow">
            PANEL DE CONTROL
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Resumen de los pedidos del local
          </p>
        </div>

        <button
          className="qg-inicio-refresh"
          onClick={cargarPedidos}
          disabled={loading}
        >
          ↻
          <span>Actualizar</span>
        </button>

      </div>


      {error && (
        <div className="qg-inicio-error">
          <span>⚠️</span>
          <p>{error}</p>

          <button onClick={cargarPedidos}>
            Reintentar
          </button>
        </div>
      )}


      <section className="qg-inicio-stats">

        <div className="qg-inicio-stat qg-inicio-stat-total">

          <div className="qg-inicio-stat-icon">
            🧾
          </div>

          <div className="qg-inicio-stat-info">

            <span>
              Total pedidos
            </span>

            <strong>
              {loading ? "—" : stats.total}
            </strong>

          </div>

        </div>


        <div className="qg-inicio-stat qg-inicio-stat-active">

          <div className="qg-inicio-stat-icon">
            🔔
          </div>

          <div className="qg-inicio-stat-info">

            <span>
              Pedidos activos
            </span>

            <strong>
              {loading ? "—" : stats.activos}
            </strong>

          </div>

        </div>


        <div className="qg-inicio-stat qg-inicio-stat-pending">

          <div className="qg-inicio-stat-icon">
            ⏳
          </div>

          <div className="qg-inicio-stat-info">

            <span>
              Pendientes
            </span>

            <strong>
              {loading ? "—" : stats.pendientes}
            </strong>

          </div>

        </div>


        <div className="qg-inicio-stat qg-inicio-stat-ready">

          <div className="qg-inicio-stat-icon">
            🍽️
          </div>

          <div className="qg-inicio-stat-info">

            <span>
              Listos
            </span>

            <strong>
              {loading ? "—" : stats.listos}
            </strong>

          </div>

        </div>

      </section>


      <section className="qg-inicio-secondary-stats">

        <div className="qg-inicio-secondary-card">

          <span>
            Entregados
          </span>

          <strong>
            {loading ? "—" : stats.entregados}
          </strong>

        </div>


        <div className="qg-inicio-secondary-card">

          <span>
            Cancelados
          </span>

          <strong>
            {loading ? "—" : stats.cancelados}
          </strong>

        </div>


        <div className="qg-inicio-secondary-card qg-inicio-revenue">

          <span>
            Facturación
          </span>

          <strong>
            {loading
              ? "—"
              : formatearPrecio(
                  stats.facturacion
                )}
          </strong>

        </div>

      </section>


      <section className="qg-inicio-orders">

        <div className="qg-inicio-section-header">

          <div>
            <h2>
              🧾 Últimos pedidos
            </h2>

            <p>
              Actividad reciente del local
            </p>
          </div>

          <span className="qg-inicio-order-count">
            {orders.length} pedidos
          </span>

        </div>


        {loading ? (

          <div className="qg-inicio-empty">
            <div className="qg-inicio-loader" />
            <p>
              Cargando pedidos...
            </p>
          </div>

        ) : pedidosRecientes.length === 0 ? (

          <div className="qg-inicio-empty">

            <span>
              🧾
            </span>

            <h3>
              No hay pedidos
            </h3>

            <p>
              Cuando ingrese un pedido aparecerá aquí.
            </p>

          </div>

        ) : (

          <div className="qg-inicio-order-list">

            {pedidosRecientes.map((order) => (

              <div
                key={order._id}
                className="qg-inicio-order"
              >

                <div className="qg-inicio-order-main">

                  <div className="qg-inicio-order-number">
                    #{order.orderNumber}
                  </div>

                  <div className="qg-inicio-order-customer">

                    <strong>
                      {order.customer?.firstName}{" "}
                      {order.customer?.lastName}
                    </strong>

                    <span>
                      {formatearFecha(
                        order.createdAt
                      )}
                    </span>

                  </div>

                </div>


                <div className="qg-inicio-order-right">

                  <span
                    className={`qg-inicio-status ${obtenerClaseEstado(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  <strong className="qg-inicio-order-total">
                    {formatearPrecio(
                      order.total
                    )}
                  </strong>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
};

export default Inicio;

