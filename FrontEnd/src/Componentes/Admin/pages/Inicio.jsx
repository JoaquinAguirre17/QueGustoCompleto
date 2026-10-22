import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Inicio.css";

const API_URL = "http://localhost:3000/api";
const TIME_ZONE = "America/Argentina/Cordoba";
const INTERVALO_ACTUALIZACION = 30000;

const ESTADOS = {
  PENDIENTE: "Pendiente",
  PREPARANDO: "Preparando",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

/* =========================================
   UTILIDADES
========================================= */

// Normaliza estados para evitar diferencias por mayúsculas
// o espacios al comparar los valores recibidos de la API.
const normalizarTexto = (valor) =>
  String(valor ?? "").trim().toLocaleLowerCase("es-AR");

// Devuelve la fecha actual en la zona horaria de Argentina.
const obtenerFechaLocal = (fecha = new Date()) => {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
};

// Comprueba si una fecha corresponde al día actual en Argentina.
const esPedidoDeHoy = (fecha) => {
  if (!fecha) return false;

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return false;

  return obtenerFechaLocal(date) === obtenerFechaLocal();
};

// Convierte un importe en número y evita resultados inválidos.
const obtenerImporte = (valor) => {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
};

// Formatea importes en pesos argentinos.
const formatearPrecio = (valor) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(obtenerImporte(valor));

// Formatea una fecha con día y hora local de Argentina.
const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

// Obtiene el nombre del cliente sin mostrar valores undefined.
const obtenerNombreCliente = (order) => {
  const nombre = [
    order.customer?.firstName,
    order.customer?.lastName,
  ]
    .filter((parte) => String(parte ?? "").trim())
    .join(" ")
    .trim();

  return nombre || "Cliente sin nombre";
};

// Proporciona una clase visual según el estado del pedido.
const obtenerClaseEstado = (status) => {
  switch (normalizarTexto(status)) {
    case "pendiente":
      return "qg-inicio-status-pendiente";

    case "preparando":
    case "en preparación":
    case "en preparacion":
      return "qg-inicio-status-preparando";

    case "listo":
      return "qg-inicio-status-listo";

    case "entregado":
      return "qg-inicio-status-entregado";

    case "cancelado":
      return "qg-inicio-status-cancelado";

    default:
      return "qg-inicio-status-default";
  }
};

// Devuelve un nombre legible para el estado.
const obtenerNombreEstado = (status) => {
  const estado = normalizarTexto(status);

  const nombres = {
    pendiente: "Pendiente",
    preparando: "Preparando",
    "en preparación": "Preparando",
    "en preparacion": "Preparando",
    listo: "Listo",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

  return nombres[estado] || status || "Sin estado";
};

// Usa el número de pedido si existe; de lo contrario,
// muestra una parte del identificador de MongoDB.
const obtenerNumeroPedido = (order) => {
  if (
    order.orderNumber !== undefined &&
    order.orderNumber !== null &&
    String(order.orderNumber).trim() !== ""
  ) {
    return order.orderNumber;
  }

  return order._id ? String(order._id).slice(-6).toUpperCase() : "S/N";
};

/* =========================================
   COMPONENTE PRINCIPAL
========================================= */

const Inicio = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Evita que se acumulen solicitudes si una respuesta demora.
  const solicitudEnCurso = useRef(false);
  const componenteActivo = useRef(false);

  /* =========================================
     CARGAR PEDIDOS
  ========================================= */

  const cargarPedidos = useCallback(async (manual = false) => {
    if (solicitudEnCurso.current) return;

    solicitudEnCurso.current = true;

    if (manual && componenteActivo.current) {
      setRefreshing(true);
    }

    try {
      const response = await axios.get(`${API_URL}/orders`, {
        timeout: 15000,
      });

      if (!componenteActivo.current) return;

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.orders)
          ? response.data.orders
          : [];

      setOrders(data);
      setError("");
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error("Error cargando dashboard:", err);

      if (componenteActivo.current) {
        setError(
          "No se pudieron actualizar los pedidos. Comprobá tu conexión e intentá nuevamente."
        );
      }
    } finally {
      solicitudEnCurso.current = false;

      if (componenteActivo.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  /* =========================================
     ACTUALIZACIÓN AUTOMÁTICA
  ========================================= */

  useEffect(() => {
    componenteActivo.current = true;

    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos();
    }, INTERVALO_ACTUALIZACION);

    return () => {
      componenteActivo.current = false;
      clearInterval(intervalo);
    };
  }, [cargarPedidos]);

  /* =========================================
     ESTADÍSTICAS
  ========================================= */

  const pedidosHoy = orders.filter((order) =>
    esPedidoDeHoy(order.createdAt)
  );

  const pedidosPendientes = orders.filter(
    (order) =>
      normalizarTexto(order.status) ===
      normalizarTexto(ESTADOS.PENDIENTE)
  );

  const pedidosPreparando = orders.filter((order) => {
    const estado = normalizarTexto(order.status);

    return estado === "preparando" ||
      estado === "en preparación" ||
      estado === "en preparacion";
  });

  const pedidosListos = orders.filter(
    (order) =>
      normalizarTexto(order.status) ===
      normalizarTexto(ESTADOS.LISTO)
  );

  const pedidosEntregados = orders.filter(
    (order) =>
      normalizarTexto(order.status) ===
      normalizarTexto(ESTADOS.ENTREGADO)
  );

  const pedidosCancelados = orders.filter(
    (order) =>
      normalizarTexto(order.status) ===
      normalizarTexto(ESTADOS.CANCELADO)
  );

  // Excluye pedidos cancelados del importe operativo.
  // No implica que los pedidos restantes estén cobrados.
  const facturacionPedidosHoy = pedidosHoy
    .filter(
      (order) =>
        normalizarTexto(order.status) !==
        normalizarTexto(ESTADOS.CANCELADO)
    )
    .reduce(
      (total, order) => total + obtenerImporte(order.total),
      0
    );

  // Importe de pedidos entregados hoy.
  // Para conocer el dinero efectivamente cobrado hay que
  // comprobar el estado de pago guardado en cada pedido.
  const importeEntregadoHoy = pedidosHoy
    .filter(
      (order) =>
        normalizarTexto(order.status) ===
        normalizarTexto(ESTADOS.ENTREGADO)
    )
    .reduce(
      (total, order) => total + obtenerImporte(order.total),
      0
    );

  const ticketPromedio =
    pedidosHoy.filter(
      (order) =>
        normalizarTexto(order.status) !==
        normalizarTexto(ESTADOS.CANCELADO)
    ).length > 0
      ? facturacionPedidosHoy /
        pedidosHoy.filter(
          (order) =>
            normalizarTexto(order.status) !==
            normalizarTexto(ESTADOS.CANCELADO)
        ).length
      : 0;

  const pedidosActivos =
    pedidosPendientes.length +
    pedidosPreparando.length +
    pedidosListos.length;

  /* =========================================
     PEDIDOS RECIENTES
  ========================================= */

  const pedidosRecientes = [...orders]
    .sort((a, b) => {
      const fechaA = new Date(a.createdAt || 0).getTime();
      const fechaB = new Date(b.createdAt || 0).getTime();

      return fechaB - fechaA;
    })
    .slice(0, 6);

  /* =========================================
     RENDERIZADO
  ========================================= */

  return (
    <main className="qg-inicio-page">
      {/* ENCABEZADO */}
      <header className="qg-inicio-header">
        <div className="qg-inicio-header-copy">
          <span className="qg-inicio-eyebrow">
            QUE GUSTO / ADMINISTRACIÓN
          </span>

          <h1>Panel general</h1>

          <p>
            Controlá los pedidos y la actividad diaria de tu local.
          </p>
        </div>

        <div className="qg-inicio-header-actions">
          <div className="qg-inicio-update-info">
            <span className="qg-inicio-connection-dot" />

            <span>
              {ultimaActualizacion
                ? `Actualizado ${new Intl.DateTimeFormat("es-AR", {
                    timeZone: TIME_ZONE,
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }).format(ultimaActualizacion)}`
                : "Esperando datos"}
            </span>
          </div>

          <button
            type="button"
            className="qg-inicio-refresh"
            onClick={() => cargarPedidos(true)}
            disabled={loading || refreshing}
          >
            <span
              className={
                refreshing
                  ? "qg-inicio-refresh-icon qg-inicio-spinning"
                  : "qg-inicio-refresh-icon"
              }
              aria-hidden="true"
            >
              ↻
            </span>

            <span>
              {refreshing ? "Actualizando..." : "Actualizar"}
            </span>
          </button>
        </div>
      </header>

      {/* ERROR DE CONEXIÓN */}
      {error && (
        <div className="qg-inicio-error" role="alert">
          <span className="qg-inicio-error-icon" aria-hidden="true">
            !
          </span>

          <div className="qg-inicio-error-content">
            <strong>No se pudo actualizar el panel</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => cargarPedidos(true)}
            disabled={refreshing}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* MÉTRICAS PRINCIPALES */}
      <section
        className="qg-inicio-stats"
        aria-label="Estadísticas principales"
      >
        <article className="qg-inicio-stat qg-inicio-stat-total">
          <div className="qg-inicio-stat-top">
            <span className="qg-inicio-stat-label">
              Pedidos de hoy
            </span>

            <span className="qg-inicio-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="5"
                  y="3"
                  width="14"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M9 8h6M9 12h6M9 16h3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          <strong className="qg-inicio-stat-value">
            {loading ? "—" : pedidosHoy.length}
          </strong>

          <span className="qg-inicio-stat-description">
            Pedidos recibidos durante el día
          </span>
        </article>

        <article className="qg-inicio-stat qg-inicio-stat-revenue">
          <div className="qg-inicio-stat-top">
            <span className="qg-inicio-stat-label">
              Importe de pedidos de hoy
            </span>

            <span className="qg-inicio-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="6"
                  width="18"
                  height="13"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M16 12h2M3 10h18M7 15h3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          <strong className="qg-inicio-stat-value qg-inicio-stat-value-price">
            {loading ? "—" : formatearPrecio(facturacionPedidosHoy)}
          </strong>

          <span className="qg-inicio-stat-description">
            Excluye los pedidos cancelados; no confirma cobros
          </span>
        </article>

        <article className="qg-inicio-stat qg-inicio-stat-pending">
          <div className="qg-inicio-stat-top">
            <span className="qg-inicio-stat-label">
              Pendientes
            </span>

            <span className="qg-inicio-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M12 7v5l3 2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <strong className="qg-inicio-stat-value">
            {loading ? "—" : pedidosPendientes.length}
          </strong>

          <span className="qg-inicio-stat-description">
            Pedidos que necesitan atención
          </span>
        </article>

        <article className="qg-inicio-stat qg-inicio-stat-ready">
          <div className="qg-inicio-stat-top">
            <span className="qg-inicio-stat-label">
              Listos para entregar
            </span>

            <span className="qg-inicio-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16v13H4zM3 4h18v3H3z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="m9 13 2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <strong className="qg-inicio-stat-value">
            {loading ? "—" : pedidosListos.length}
          </strong>

          <span className="qg-inicio-stat-description">
            A la espera de entrega o retiro
          </span>
        </article>
      </section>

      {/* RESUMEN SECUNDARIO */}
      <section
        className="qg-inicio-secondary-stats"
        aria-label="Resumen complementario"
      >
        <article className="qg-inicio-secondary-card">
          <span className="qg-inicio-secondary-icon qg-inicio-icon-preparing">
            <span aria-hidden="true">◷</span>
          </span>

          <div className="qg-inicio-secondary-info">
            <span>En preparación</span>
            <strong>{loading ? "—" : pedidosPreparando.length}</strong>
          </div>
        </article>

        <article className="qg-inicio-secondary-card">
          <span className="qg-inicio-secondary-icon qg-inicio-icon-delivered">
            <span aria-hidden="true">✓</span>
          </span>

          <div className="qg-inicio-secondary-info">
            <span>Entregados hoy</span>
            <strong>
              {loading
                ? "—"
                : pedidosEntregados.filter((order) =>
                    esPedidoDeHoy(order.createdAt)
                  ).length}
            </strong>
          </div>
        </article>

        <article className="qg-inicio-secondary-card">
          <span className="qg-inicio-secondary-icon qg-inicio-icon-active">
            <span aria-hidden="true">≡</span>
          </span>

          <div className="qg-inicio-secondary-info">
            <span>Pedidos activos</span>
            <strong>{loading ? "—" : pedidosActivos}</strong>
          </div>
        </article>

        <article className="qg-inicio-secondary-card">
          <span className="qg-inicio-secondary-icon qg-inicio-icon-cancelled">
            <span aria-hidden="true">×</span>
          </span>

          <div className="qg-inicio-secondary-info">
            <span>Cancelados hoy</span>
            <strong>
              {loading
                ? "—"
                : pedidosCancelados.filter((order) =>
                    esPedidoDeHoy(order.createdAt)
                  ).length}
            </strong>
          </div>
        </article>
      </section>

      {/* INFORMACIÓN ECONÓMICA */}
      <section className="qg-inicio-finance">
        <div className="qg-inicio-finance-heading">
          <div>
            <span className="qg-inicio-eyebrow">
              RESUMEN ECONÓMICO
            </span>

            <h2>Actividad de hoy</h2>
          </div>

          <span className="qg-inicio-finance-badge">
            <span aria-hidden="true">●</span>
            Día actual
          </span>
        </div>

        <div className="qg-inicio-finance-grid">
          <div className="qg-inicio-finance-item">
            <span>Importe de pedidos entregados</span>

            <strong>
              {loading ? "—" : formatearPrecio(importeEntregadoHoy)}
            </strong>

            <small>
              Según estado del pedido, no necesariamente cobrado
            </small>
          </div>

          <div className="qg-inicio-finance-item">
            <span>Ticket promedio</span>

            <strong>
              {loading ? "—" : formatearPrecio(ticketPromedio)}
            </strong>

            <small>
              Promedio de pedidos no cancelados de hoy
            </small>
          </div>

          <div className="qg-inicio-finance-item">
            <span>Pedidos registrados</span>

            <strong>{loading ? "—" : orders.length}</strong>

            <small>
              Registros devueltos por el servidor
            </small>
          </div>
        </div>
      </section>

      {/* ÚLTIMOS PEDIDOS */}
      <section className="qg-inicio-orders">
        <div className="qg-inicio-section-header">
          <div>
            <span className="qg-inicio-eyebrow">
              MOVIMIENTOS RECIENTES
            </span>

            <h2>Últimos pedidos</h2>

            <p>
              Consultá los pedidos recibidos y su estado actual.
            </p>
          </div>

          <span className="qg-inicio-order-count">
            {loading ? "—" : `${orders.length} registros`}
          </span>
        </div>

        {loading ? (
          <div className="qg-inicio-empty">
            <span className="qg-inicio-loader" />

            <strong>Cargando pedidos</strong>

            <p>Estamos obteniendo la información del local.</p>
          </div>
        ) : pedidosRecientes.length === 0 ? (
          <div className="qg-inicio-empty">
            <span className="qg-inicio-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="5"
                  y="3"
                  width="14"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M9 8h6M9 12h6M9 16h3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <h3>Todavía no hay pedidos</h3>

            <p>
              Cuando ingrese un pedido, aparecerá en esta sección.
            </p>

            {error && (
              <button
                type="button"
                className="qg-inicio-empty-retry"
                onClick={() => cargarPedidos(true)}
              >
                Intentar nuevamente
              </button>
            )}
          </div>
        ) : (
          <div className="qg-inicio-order-list">
            {pedidosRecientes.map((order) => (
              <article
                key={order._id || obtenerNumeroPedido(order)}
                className="qg-inicio-order"
              >
                <div className="qg-inicio-order-main">
                  <div className="qg-inicio-order-avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7h16v13H4zM3 4h18v3H3z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 11h8M8 15h5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="qg-inicio-order-customer">
                    <strong>
                      Pedido #{obtenerNumeroPedido(order)}
                    </strong>

                    <span>{obtenerNombreCliente(order)}</span>

                    <small>
                      {formatearFecha(order.createdAt)}
                    </small>
                  </div>
                </div>

                <div className="qg-inicio-order-right">
                  <span
                    className={`qg-inicio-status ${obtenerClaseEstado(
                      order.status
                    )}`}
                  >
                    <span
                      className="qg-inicio-status-dot"
                      aria-hidden="true"
                    />

                    {obtenerNombreEstado(order.status)}
                  </span>

                  <strong className="qg-inicio-order-total">
                    {formatearPrecio(order.total)}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="qg-inicio-footer">
        <span>
          Que Gusto · Panel de administración
        </span>

        <span>
          Actualización automática cada 30 segundos
        </span>
      </footer>
    </main>
  );
};

export default Inicio;