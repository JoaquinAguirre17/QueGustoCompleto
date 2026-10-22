
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { useSocket } from "../hooks/useSocket";
import OrderCard from "../../OrderCard/OrderCard";

import "./Pedidos.css";

const API_URL = "http://localhost:3000/api";

const HIDDEN_STATUSES = ["Entregado", "Cancelado"];

const Pedidos = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrders, setUpdatingOrders] = useState([]);

  const { newOrder, updatedOrder } = useSocket();

  // Evita imprimir dos veces el mismo pedido durante esta sesión.
  const printedOrdersRef = useRef(new Set());

  // Evita procesar repetidamente el mismo evento de Socket.IO.
  const processedOrdersRef = useRef(new Set());

  const isVisibleOrder = useCallback((order) => {
    return Boolean(order) && !HIDDEN_STATUSES.includes(order.status);
  }, []);

  // Escapa texto para evitar que los datos del cliente se interpreten como HTML.
  const escapeHtml = (value) => {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });
  };

  const formatMoney = (value) => {
    const amount = Number(value);

    return Number.isFinite(amount)
      ? amount.toLocaleString("es-AR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : "0";
  };

  /* =====================================================
     IMPRESIÓN DE COMANDA
  ===================================================== */

  const printOrder = useCallback((order) => {
    if (!order) return;

    const orderId = order._id;

    if (!orderId || printedOrdersRef.current.has(orderId)) {
      return;
    }

    // Marcamos el pedido antes de abrir la ventana para evitar duplicados.
    printedOrdersRef.current.add(orderId);

    const printWindow = window.open(
      "",
      "_blank",
      "width=420,height=700"
    );

    if (!printWindow) {
      // Permitimos reintentar desde el navegador si bloqueó la ventana.
      printedOrdersRef.current.delete(orderId);

      alert(
        "El navegador bloqueó la impresión. " +
        "Permití las ventanas emergentes para este sitio."
      );

      return;
    }

    const customer = order.customer || {};

    const customerName = [
      customer.firstName,
      customer.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const itemsHTML = (order.items || [])
      .map((item) => {
        const modifiersHTML = (item.modifiers || [])
          .map((modifier) => {
            const extraPrice = Number(modifier.extraPrice) || 0;

            return `
              <div class="print-modifier">
                • ${escapeHtml(modifier.group || "Extra")}:
                ${escapeHtml(modifier.option || "")}
                ${
                  extraPrice > 0
                    ? ` (+$${formatMoney(extraPrice)})`
                    : ""
                }
              </div>
            `;
          })
          .join("");

        return `
          <div class="print-item">
            <div class="print-item-main">
              <div class="print-item-name">
                <strong>
                  ${escapeHtml(item.quantity || 1)}x
                  ${escapeHtml(item.title || "Producto")}
                </strong>
              </div>

              <div class="print-item-price">
                $${formatMoney(item.subtotal)}
              </div>
            </div>

            ${
              modifiersHTML
                ? `<div class="print-modifiers">${modifiersHTML}</div>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    const customerInfo = [
      customer.phone
        ? `<div class="info"><strong>Teléfono:</strong> ${escapeHtml(customer.phone)}</div>`
        : "",
      customer.address
        ? `<div class="info"><strong>Dirección:</strong> ${escapeHtml(customer.address)}</div>`
        : "",
    ].join("");

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

          <title>Comanda #${escapeHtml(order.orderNumber || "")}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 13px;
            }

            .ticket {
              width: 80mm;
              padding: 4mm 4mm 35mm;
              overflow-wrap: anywhere;
            }

            .header {
              text-align: center;
              margin-bottom: 12px;
            }

            .business {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 1px;
            }

            .order-number {
              margin-top: 6px;
              font-size: 18px;
              font-weight: 800;
            }

            .separator {
              margin: 10px 0;
              border-top: 2px dashed #000;
            }

            .info {
              margin-bottom: 5px;
              line-height: 1.5;
            }

            .print-item {
              margin-bottom: 12px;
              break-inside: avoid;
            }

            .print-item-main {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 8px;
            }

            .print-item-name {
              flex: 1;
              min-width: 0;
              overflow-wrap: anywhere;
            }

            .print-item-price {
              white-space: nowrap;
              font-weight: bold;
            }

            .print-modifiers {
              margin-top: 5px;
              padding-left: 8px;
              font-size: 12px;
            }

            .print-modifier {
              margin-bottom: 3px;
            }

            .total {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              font-size: 18px;
              font-weight: 900;
            }

            .payment {
              margin-top: 10px;
              line-height: 1.5;
            }

            .footer {
              margin-top: 18px;
              text-align: center;
              font-size: 12px;
            }

            @page {
              size: 80mm auto;
              margin: 0;
            }

            @media print {
              html,
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }

              .ticket {
                width: 80mm;
                padding: 3mm 3mm 35mm;
              }
            }
          </style>
        </head>

        <body>
          <main class="ticket">
            <header class="header">
              <div class="business">QUE GUSTO</div>
              <div class="order-number">
                PEDIDO #${escapeHtml(order.orderNumber || "")}
              </div>
            </header>

            <div class="separator"></div>

            <section>
              <div class="info">
                <strong>Cliente:</strong>
                ${escapeHtml(customerName || "Sin nombre")}
              </div>

              ${customerInfo}

              <div class="info">
                <strong>Estado:</strong>
                ${escapeHtml(order.status || "Pendiente")}
              </div>

              <div class="info">
                <strong>Entrega:</strong>
                ${escapeHtml(order.deliveryType || "No especificado")}
              </div>
            </section>

            <div class="separator"></div>

            <section>
              ${itemsHTML || "<p>Sin productos</p>"}
            </section>

            <div class="separator"></div>

            <div class="total">
              <span>TOTAL</span>
              <span>$${formatMoney(order.total)}</span>
            </div>

            <div class="payment">
              <strong>Forma de pago:</strong>
              ${escapeHtml(order.paymentMethod || "No especificado")}
            </div>

            <div class="separator"></div>

            <footer class="footer">
              Gracias por elegir Que Gusto ❤️
            </footer>
          </main>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 500);
            };

            window.onafterprint = () => {
              setTimeout(() => window.close(), 300);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }, []);

  /* =====================================================
     FORMATEAR TELÉFONO ARGENTINO
  ===================================================== */

  const formatWhatsAppPhone = (phone) => {
    let cleanPhone = String(phone || "").replace(/\D/g, "");

    if (!cleanPhone) return "";

    if (cleanPhone.startsWith("00")) {
      cleanPhone = cleanPhone.substring(2);
    }

    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.substring(1);
    }

    if (!cleanPhone.startsWith("54")) {
      cleanPhone = `54${cleanPhone}`;
    }

    // Para números móviles argentinos, WhatsApp utiliza 549.
    if (!cleanPhone.startsWith("549")) {
      cleanPhone = `549${cleanPhone.substring(2)}`;
    }

    return cleanPhone;
  };

  /* =====================================================
     NOTIFICAR POR WHATSAPP
  ===================================================== */

  const notifyWhatsApp = (order) => {
    const phone = order?.customer?.phone;

    if (!phone) {
      alert("Este cliente no tiene un número de teléfono.");
      return;
    }

    const whatsappPhone = formatWhatsAppPhone(phone);

    if (!whatsappPhone) {
      alert("El número de teléfono no es válido.");
      return;
    }

    const firstName = order.customer?.firstName || "cliente";
    const orderNumber = order.orderNumber || "";

    const message =
      `Hola ${firstName}! 👋\n\n` +
      `Tu pedido #${orderNumber} ya está listo para entregar. 🍽️\n\n` +
      "¡Te esperamos en Que Gusto! 😊";

    const whatsappUrl =
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  /* =====================================================
     CARGAR PEDIDOS INICIALES
  ===================================================== */

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/orders`);

      const fetchedOrders = Array.isArray(response.data)
        ? response.data
        : [];

      const visibleOrders = fetchedOrders.filter(isVisibleOrder);

      setOrders(visibleOrders);
    } catch (err) {
      console.error("Error cargando pedidos:", err);

      setError(
        err.response?.data?.message ||
        "No se pudieron cargar los pedidos."
      );
    } finally {
      setLoading(false);
    }
  }, [isVisibleOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* =====================================================
     RECIBIR NUEVOS PEDIDOS POR SOCKET.IO
  ===================================================== */

  useEffect(() => {
    if (!newOrder?._id) return;

    const orderId = newOrder._id;

    // Ignorar eventos repetidos del mismo pedido.
    if (processedOrdersRef.current.has(orderId)) return;

    processedOrdersRef.current.add(orderId);

    // Si está entregado o cancelado, no se muestra.
    if (!isVisibleOrder(newOrder)) return;

    setOrders((previousOrders) => {
      const exists = previousOrders.some(
        (order) => order._id === orderId
      );

      if (exists) return previousOrders;

      return [newOrder, ...previousOrders];
    });

    // La impresión se mantiene independiente de la lista.
    printOrder(newOrder);
  }, [newOrder, isVisibleOrder, printOrder]);

  /* =====================================================
     ACTUALIZAR PEDIDOS POR SOCKET.IO
  ===================================================== */

  useEffect(() => {
    if (!updatedOrder?._id) return;

    setOrders((previousOrders) => {
      if (!isVisibleOrder(updatedOrder)) {
        return previousOrders.filter(
          (order) => order._id !== updatedOrder._id
        );
      }

      const exists = previousOrders.some(
        (order) => order._id === updatedOrder._id
      );

      if (exists) {
        return previousOrders.map((order) =>
          order._id === updatedOrder._id
            ? { ...order, ...updatedOrder }
            : order
        );
      }

      return [updatedOrder, ...previousOrders];
    });
  }, [updatedOrder, isVisibleOrder]);

  /* =====================================================
     CAMBIAR ESTADO
  ===================================================== */

  const changeStatus = async (id, status) => {
    if (updatingOrders.includes(id)) return;

    try {
      setUpdatingOrders((previous) => [...previous, id]);

      await axios.patch(`${API_URL}/orders/${id}/status`, {
        status,
      });

      // Quitamos inmediatamente los pedidos finalizados.
      if (HIDDEN_STATUSES.includes(status)) {
        setOrders((previousOrders) =>
          previousOrders.filter((order) => order._id !== id)
        );
      }
    } catch (err) {
      console.error("Error actualizando estado:", err);

      alert(
        err.response?.data?.message ||
        "No se pudo actualizar el estado del pedido."
      );
    } finally {
      setUpdatingOrders((previous) =>
        previous.filter((orderId) => orderId !== id)
      );
    }
  };

  /* =====================================================
     PANTALLA DE CARGA
  ===================================================== */

  if (loading) {
    return (
      <div className="pedidos-page">
        <div className="pedidos-loading">
          <span className="pedidos-spinner" />
          <h2>Cargando pedidos</h2>
          <p>Estamos preparando tu panel de cocina...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     PANTALLA DE ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="pedidos-page">
        <header className="pedidos-header">
          <div>
            <span className="pedidos-eyebrow">QUE GUSTO · ADMINISTRACIÓN</span>
            <h1>Pedidos en vivo</h1>
          </div>
        </header>

        <section className="pedidos-feedback pedidos-feedback-error">
          <span className="pedidos-feedback-icon">!</span>
          <h2>No pudimos cargar los pedidos</h2>
          <p>{error}</p>

          <button
            type="button"
            className="pedidos-retry-button"
            onClick={fetchOrders}
          >
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  /* =====================================================
     RENDER PRINCIPAL
  ===================================================== */

  return (
    <main className="pedidos-page">
      <header className="pedidos-header">
        <div className="pedidos-heading">
          <span className="pedidos-eyebrow">
            QUE GUSTO · ADMINISTRACIÓN
          </span>

          <h1>Pedidos en vivo</h1>

          <p>Gestioná los pedidos y seguí el trabajo de la cocina.</p>
        </div>

        <div className="pedidos-header-actions">
          <div className="pedidos-live-indicator">
            <span className="pedidos-live-dot" />
            Tiempo real
          </div>

          <button
            type="button"
            className="pedidos-refresh-button"
            onClick={fetchOrders}
            title="Actualizar pedidos"
            aria-label="Actualizar pedidos"
          >
            ↻ <span>Actualizar</span>
          </button>
        </div>
      </header>

      <section className="pedidos-summary">
        <div className="pedidos-summary-card">
          <span className="pedidos-summary-icon">▤</span>

          <div>
            <span className="pedidos-summary-label">Pedidos activos</span>
            <strong>{orders.length}</strong>
          </div>
        </div>

        <div className="pedidos-summary-card">
          <span className="pedidos-summary-icon">◷</span>

          <div>
            <span className="pedidos-summary-label">Pendientes</span>
            <strong>
              {orders.filter((order) => order.status === "Pendiente").length}
            </strong>
          </div>
        </div>

        <div className="pedidos-summary-card">
          <span className="pedidos-summary-icon">♨</span>

          <div>
            <span className="pedidos-summary-label">En preparación</span>
            <strong>
              {orders.filter((order) => order.status === "Preparando").length}
            </strong>
          </div>
        </div>

        <div className="pedidos-summary-card">
          <span className="pedidos-summary-icon">✓</span>

          <div>
            <span className="pedidos-summary-label">Listos</span>
            <strong>
              {orders.filter((order) => order.status === "Listo").length}
            </strong>
          </div>
        </div>
      </section>

      <section className="pedidos-content">
        <div className="pedidos-section-heading">
          <div>
            <h2>Pedidos actuales</h2>
            <p>Los pedidos nuevos aparecen automáticamente.</p>
          </div>

          <span className="pedidos-count">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="pedidos-empty">
            <div className="pedidos-empty-icon">▤</div>
            <h2>Todo tranquilo por ahora</h2>
            <p>
              Cuando ingrese un nuevo pedido, aparecerá en esta sección.
            </p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div
                key={order._id}
                className="order-wrapper"
                aria-busy={updatingOrders.includes(order._id)}
              >
                <OrderCard
                  order={order}
                  changeStatus={changeStatus}
                  notifyWhatsApp={notifyWhatsApp}
                />

                {updatingOrders.includes(order._id) && (
                  <div className="order-updating-overlay">
                    <span className="pedidos-spinner" />
                    <span>Actualizando...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Pedidos;
