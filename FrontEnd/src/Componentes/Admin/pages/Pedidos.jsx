
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config/api";
import { useSocket } from "../hooks/useSocket";
import OrderCard from "../../OrderCard/OrderCard";
import "./Pedidos.css";

const HIDDEN_STATUSES = ["Entregado", "Cancelado"];

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

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

const getItemTitle = (item) => {
  return (
    item?.title ||
    item?.name ||
    item?.product?.title ||
    item?.product?.name ||
    "Producto"
  );
};

const getItemModifiers = (item) => {
  const modifiers = item?.modifiers || item?.selectedModifiers || [];

  if (Array.isArray(modifiers)) {
    return modifiers;
  }

  // Permite también recibir modificadores agrupados en un objeto.
  if (modifiers && typeof modifiers === "object") {
    return Object.entries(modifiers).flatMap(([group, options]) => {
      const normalizedOptions = Array.isArray(options)
        ? options
        : [options];

      return normalizedOptions
        .filter(Boolean)
        .map((option) => {
          if (typeof option === "string") {
            return {
              group,
              option,
              extraPrice: 0,
            };
          }

          return {
            group,
            option: option.label || option.option || option.name || "",
            extraPrice:
              Number(option.extraPrice ?? option.price) || 0,
          };
        });
    });
  }

  return [];
};

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

const Pedidos = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrders, setUpdatingOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [takeOrderOpen, setTakeOrderOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [manualCart, setManualCart] = useState([]);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [sendingOrder, setSendingOrder] = useState(false);
  const [manualForm, setManualForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    notes: "",
    deliveryType: "retiro",
    paymentMethod: "Efectivo",
  });

const {
  newOrder,
  updatedOrder,
  soundEnabled,
  enableSound,
  disableSound,
} = useSocket();

  // Evita imprimir dos veces el mismo pedido durante esta sesión.
  const printedOrdersRef = useRef(new Set());

  // Evita procesar repetidamente el mismo evento de Socket.IO.
  const processedOrdersRef = useRef(new Set());

  const isVisibleOrder = useCallback((order) => {
    return Boolean(order) && !HIDDEN_STATUSES.includes(order.status);
  }, []);

  /* =====================================================
     IMPRESIÓN AUTOMÁTICA DE COMANDA
  ===================================================== */

  const printOrder = useCallback((order) => {
    if (!order?._id) return;

    const orderId = order._id;

    if (printedOrdersRef.current.has(orderId)) {
      return;
    }

    // Marcamos antes de abrir la ventana para evitar duplicados.
    printedOrdersRef.current.add(orderId);

    const printWindow = window.open(
      "",
      "_blank",
      "width=420,height=750"
    );

    if (!printWindow) {
      printedOrdersRef.current.delete(orderId);

      alert(
        "El navegador bloqueó la impresión automática. " +
        "Permití las ventanas emergentes para Que Gusto."
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
        const quantity = Number(item.quantity) || 1;
        const title = getItemTitle(item);

        const unitPrice =
          Number(item.price ?? item.unitPrice) || 0;

        const subtotal =
          Number(item.subtotal ?? item.total) ||
          unitPrice * quantity;

        const modifiersHTML = getItemModifiers(item)
          .map((modifier) => {
            const group = modifier.group || "Extra";
            const option =
              modifier.option ||
              modifier.label ||
              modifier.name ||
              "";

            const extraPrice =
              Number(modifier.extraPrice ?? modifier.price) || 0;

            return `
              <div class="modifier">
                <span>
                  • ${escapeHtml(group)}:
                  ${escapeHtml(option)}
                </span>

                ${extraPrice > 0
                ? `<strong>+$${formatMoney(extraPrice)}</strong>`
                : ""
              }
              </div>
            `;
          })
          .join("");

        return `
          <article class="item">
            <div class="item-main">
              <div class="item-description">
                <strong class="item-quantity">
                  ${escapeHtml(quantity)}x
                </strong>

                <strong class="item-name">
                  ${escapeHtml(title)}
                </strong>
              </div>

              <strong class="item-price">
                $${formatMoney(subtotal)}
              </strong>
            </div>

            ${modifiersHTML
            ? `<div class="modifiers">${modifiersHTML}</div>`
            : ""
          }

            ${item.notes || item.observation
            ? `
                  <div class="item-notes">
                    <strong>Observación:</strong>
                    ${escapeHtml(item.notes || item.observation)}
                  </div>
                `
            : ""
          }
          </article>
        `;
      })
      .join("");

    const customerInfo = [
      customer.phone
        ? `
          <div class="info-row">
            <strong>Teléfono:</strong>
            <span>${escapeHtml(customer.phone)}</span>
          </div>
        `
        : "",

      customer.address
        ? `
          <div class="info-row">
            <strong>Dirección:</strong>
            <span>${escapeHtml(customer.address)}</span>
          </div>
        `
        : "",
    ].join("");

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Argentina/Cordoba",
      })
      : new Date().toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Argentina/Cordoba",
      });

    const paymentMethod =
      order.paymentMethod ||
      order.payment?.method ||
      "No especificado";

    const deliveryType =
      order.deliveryType ||
      order.delivery ||
      "No especificado";

    const total = Number(order.total) || 0;

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            Comanda ${escapeHtml(order.orderNumber || orderId)}
          </title>

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
              font-size: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              padding: 0;
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
              font-size: 25px;
              font-weight: 900;
              letter-spacing: 1.5px;
            }

            .business-subtitle {
              margin-top: 3px;
              font-size: 10px;
              letter-spacing: 2px;
              font-weight: bold;
            }

            .order-number {
              margin-top: 12px;
              font-size: 19px;
              font-weight: 900;
            }

            .order-date {
              margin-top: 5px;
              font-size: 11px;
            }

            .separator {
              margin: 12px 0;
              border-top: 2px dashed #000;
            }

            .section-title {
              margin-bottom: 8px;
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 8px;
              margin-bottom: 5px;
              line-height: 1.4;
            }

            .info-row strong {
              flex-shrink: 0;
            }

            .info-row span {
              text-align: right;
            }

            .item {
              margin-bottom: 13px;
              break-inside: avoid;
            }

            .item-main {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 8px;
            }

            .item-description {
              display: flex;
              align-items: flex-start;
              gap: 5px;
              flex: 1;
              min-width: 0;
            }

            .item-quantity {
              flex-shrink: 0;
              font-size: 14px;
            }

            .item-name {
              font-size: 13px;
              line-height: 1.35;
            }

            .item-price {
              flex-shrink: 0;
              white-space: nowrap;
              font-size: 13px;
            }

            .modifiers {
              margin-top: 5px;
              padding-left: 17px;
              font-size: 11px;
            }

            .modifier {
              display: flex;
              justify-content: space-between;
              gap: 5px;
              margin-bottom: 4px;
              line-height: 1.3;
            }

            .modifier span {
              flex: 1;
            }

            .modifier strong {
              white-space: nowrap;
            }

            .item-notes {
              margin-top: 6px;
              padding: 6px;
              border: 1px dashed #000;
              font-size: 11px;
              line-height: 1.4;
            }

            .order-observations {
              margin-top: 8px;
              padding: 8px;
              border: 1px dashed #000;
              font-size: 11px;
              line-height: 1.4;
            }

            .total {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 8px;
              font-size: 19px;
              font-weight: 900;
            }

            .payment {
              margin-top: 12px;
              line-height: 1.5;
            }

            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 11px;
              line-height: 1.5;
            }

            .footer strong {
              display: block;
              margin-bottom: 4px;
              font-size: 13px;
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
              <div class="business-subtitle">
                PEDIDOS ONLINE
              </div>

              <div class="order-number">
                PEDIDO #${escapeHtml(order.orderNumber || "")}
              </div>

              <div class="order-date">
                ${escapeHtml(orderDate)}
              </div>
            </header>

            <div class="separator"></div>

            <section>
              <div class="section-title">
                Datos del cliente
              </div>

              <div class="info-row">
                <strong>Cliente:</strong>
                <span>${escapeHtml(customerName || "Sin nombre")}</span>
              </div>

              ${customerInfo}

              <div class="info-row">
                <strong>Entrega:</strong>
                <span>${escapeHtml(deliveryType)}</span>
              </div>

              <div class="info-row">
                <strong>Estado:</strong>
                <span>${escapeHtml(order.status || "Pendiente")}</span>
              </div>
            </section>

            ${customer.notes
        ? `
                  <div class="order-observations">
                    <strong>Observaciones del cliente:</strong><br />
                    ${escapeHtml(customer.notes)}
                  </div>
                `
        : ""
      }

            <div class="separator"></div>

            <section>
              <div class="section-title">
                Detalle del pedido
              </div>

              ${itemsHTML || "<p>Sin productos</p>"}
            </section>

            <div class="separator"></div>

            <div class="total">
              <span>TOTAL</span>
              <span>$${formatMoney(total)}</span>
            </div>

            <div class="payment">
              <strong>Forma de pago:</strong>
              ${escapeHtml(paymentMethod)}
            </div>

            <div class="separator"></div>

            <footer class="footer">
              <strong>¡Gracias por elegir Que Gusto!</strong>
              Tu pedido es importante para nosotros.
            </footer>

          </main>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 600);
            };

            window.onafterprint = () => {
              setTimeout(() => {
                window.close();
              }, 300);
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
     CARGAR PEDIDOS
  ===================================================== */

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(`${API_URL}/orders`);

      const fetchedOrders = Array.isArray(response.data)
        ? response.data
        : [];

      setOrders(fetchedOrders.filter(isVisibleOrder));
    } catch (err) {
      console.error("Error cargando pedidos:", err);

      setError(
        err.response?.data?.message ||
        "No se pudieron cargar los pedidos."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isVisibleOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* =====================================================
     RECIBIR NUEVOS PEDIDOS
  ===================================================== */

  useEffect(() => {
    if (!newOrder?._id) return;

    const orderId = newOrder._id;

    if (processedOrdersRef.current.has(orderId)) {
      return;
    }

    processedOrdersRef.current.add(orderId);

    if (!isVisibleOrder(newOrder)) {
      return;
    }

    setOrders((previousOrders) => {
      const exists = previousOrders.some(
        (order) => order._id === orderId
      );

      if (exists) return previousOrders;

      return [newOrder, ...previousOrders];
    });

    // Imprime automáticamente el pedido nuevo.
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
     TOMAR PEDIDO MANUAL
  ===================================================== */

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      const fetchedProducts = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.products)
          ? response.data.products
          : [];

      setProducts(
        fetchedProducts.filter((product) => product.active !== false)
      );
    } catch (err) {
      console.error("Error cargando productos:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openTakeOrder = () => {
    setTakeOrderOpen(true);
    setProductSearch("");

    if (products.length === 0) {
      loadProducts();
    }
  };

  const closeTakeOrder = () => {
    if (sendingOrder) return;
    setTakeOrderOpen(false);
  };

  const getProductId = (product) =>
    String(product?._id || product?.id || "");

  const createPromoSelections = (product, quantity = 1) => {
    const groups = product?.promoConfig?.selectionGroups || [];
    const selections = [];

    for (let packIndex = 1; packIndex <= quantity; packIndex++) {
      groups.forEach((group) => {
        const allowedIds = (group.allowedProducts || []).map(String);
        const firstProduct = products.find(
          (item) => allowedIds.includes(getProductId(item))
        );

        if (firstProduct) {
          selections.push({
            packIndex,
            group: group.name,
            products: [{
              product: getProductId(firstProduct),
              quantity: Number(group.requiredQuantity) || 1,
            }],
          });
        }
      });
    }

    return selections;
  };

  const addManualProduct = (product) => {
    const productId = getProductId(product);
    if (!productId) return;

    if (product.useStock) {
      const stock = Number(product.stock) || 0;
      if (stock <= 0) {
        alert("Este producto no tiene stock disponible.");
        return;
      }
    }

    const modifiers = [];

    (product.modifiers || [])
      .filter((modifier) => modifier.active !== false)
      .forEach((modifier) => {
        const current = selectedModifiers[`${productId}-${modifier.name}`];

        if (Array.isArray(current)) {
          current.forEach((option) => {
            modifiers.push({ group: modifier.name, option });
          });
        } else if (current) {
          modifiers.push({ group: modifier.name, option: current });
        }
      });

    const existingIndex = manualCart.findIndex((item) => {
      if (item.productId !== productId) return false;

      return (
        JSON.stringify(item.modifiers) ===
        JSON.stringify(modifiers)
      );
    });

    if (existingIndex >= 0) {
      setManualCart((previous) =>
        previous.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return;
    }

    const configurablePromo =
      product.isPromo === true &&
      product.promoConfig?.enabled === true;

    setManualCart((previous) => [
      ...previous,
      {
        productId,
        title: product.title,
        price:
          product.isPromo && product.promoPrice != null
            ? Number(product.promoPrice)
            : Number(product.price) || 0,
        quantity: 1,
        modifiers,
        promoSelections:
          configurablePromo
            ? createPromoSelections(product, 1)
            : [],
      },
    ]);
  };

  const updateManualQuantity = (index, quantity) => {
    const nextQuantity = Number(quantity);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) return;

    setManualCart((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const product = products.find(
          (candidate) => getProductId(candidate) === item.productId
        );

        const configurablePromo =
          product?.isPromo === true &&
          product?.promoConfig?.enabled === true;

        return {
          ...item,
          quantity: nextQuantity,
          promoSelections: configurablePromo
            ? createPromoSelections(product, nextQuantity)
            : item.promoSelections,
        };
      })
    );
  };

  const updatePromoSelection = (
    cartIndex,
    packIndex,
    groupName,
    selectedProductId
  ) => {
    setManualCart((previous) =>
      previous.map((item, index) => {
        if (index !== cartIndex) return item;

        const product = products.find(
          (candidate) => getProductId(candidate) === item.productId
        );
        const group = product?.promoConfig?.selectionGroups?.find(
          (candidate) => candidate.name === groupName
        );

        return {
          ...item,
          promoSelections: item.promoSelections.map((selection) =>
            selection.packIndex === packIndex &&
            selection.group === groupName
              ? {
                  ...selection,
                  products: [{
                    product: selectedProductId,
                    quantity: Number(group?.requiredQuantity) || 1,
                  }],
                }
              : selection
          ),
        };
      })
    );
  };

  const removeManualItem = (index) => {
    setManualCart((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const manualCartTotal = manualCart.reduce(
    (total, item) =>
      total +
      (Number(item.price) || 0) *
      (Number(item.quantity) || 0),
    0
  );

  const filteredProducts = products.filter((product) => {
    const search = productSearch.trim().toLocaleLowerCase("es");
    if (!search) return true;

    return (
      String(product.title || "").toLocaleLowerCase("es").includes(search) ||
      String(product.category || "").toLocaleLowerCase("es").includes(search)
    );
  });

  const submitManualOrder = async () => {
    if (sendingOrder) return;

    if (manualCart.length === 0) {
      alert("Agregá al menos un producto al pedido.");
      return;
    }

    if (
      !manualForm.firstName.trim() ||
      !manualForm.lastName.trim() ||
      !manualForm.phone.trim()
    ) {
      alert("Completá nombre, apellido y teléfono.");
      return;
    }

    if (
      manualForm.deliveryType === "delivery" &&
      !manualForm.address.trim()
    ) {
      alert("Ingresá la dirección de entrega.");
      return;
    }

    const payload = {
      customer: {
        firstName: manualForm.firstName.trim(),
        lastName: manualForm.lastName.trim(),
        phone: manualForm.phone.trim(),
        address:
          manualForm.deliveryType === "delivery"
            ? manualForm.address.trim()
            : "",
        notes: manualForm.notes.trim(),
      },
      deliveryType: manualForm.deliveryType,
      paymentMethod: manualForm.paymentMethod,
      items: manualCart.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        modifiers: item.modifiers,
        promoSelections: item.promoSelections,
      })),
    };

    try {
      setSendingOrder(true);
      const response = await axios.post(
        `${API_URL}/orders`,
        payload
      );

      if (!response.data?.success || !response.data?.order) {
        throw new Error(
          response.data?.message ||
          "No se pudo crear el pedido."
        );
      }

      const createdOrder = response.data.order;
      printOrder(createdOrder);
      setOrders((previous) => [
        createdOrder,
        ...previous.filter(
          (order) => order._id !== createdOrder._id
        ),
      ]);

      alert(
        `Pedido enviado correctamente. Número: ${createdOrder.orderNumber || ""}`
      );

      setManualCart([]);
      setManualForm({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        notes: "",
        deliveryType: "retiro",
        paymentMethod: "Efectivo",
      });
      setTakeOrderOpen(false);
    } catch (err) {
      console.error("Error creando pedido manual:", err);
      alert(
        err.response?.data?.message ||
        err.message ||
        "No se pudo crear el pedido."
      );
    } finally {
      setSendingOrder(false);
    }
  };

  /* =====================================================
     PANTALLA DE CARGA
  ===================================================== */

  if (loading) {
    return (
      <main className="pedidos-page">
        <section className="pedidos-loading">
          <span className="pedidos-spinner" />
          <h2>Cargando pedidos</h2>
          <p>Estamos preparando tu panel de cocina...</p>
        </section>
      </main>
    );
  }

  /* =====================================================
     PANTALLA DE ERROR
  ===================================================== */

  if (error) {
    return (
      <main className="pedidos-page">
        <header className="pedidos-header">
          <div className="pedidos-heading">
            <span className="pedidos-eyebrow">
              QUE GUSTO · ADMINISTRACIÓN
            </span>
            <h1>Pedidos en vivo</h1>
          </div>
        </header>

        <section className="pedidos-feedback pedidos-feedback-error">
          <span className="pedidos-feedback-icon">!</span>
          <h2>No pudimos cargar los pedidos</h2>
          <p>{error}</p>

          <button
            type="button"
            className="pedidos-primary-button"
            onClick={() => fetchOrders()}
          >
            Reintentar
          </button>
        </section>
      </main>
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

          <p>
            Gestioná los pedidos y seguí el trabajo de la cocina.
          </p>
        </div>

        <div className="pedidos-header-actions">
          <div className="pedidos-live-indicator">
            <span className="pedidos-live-dot" />
            Tiempo real
          </div>

          <button
            type="button"
            className="pedidos-take-order-button"
            onClick={openTakeOrder}
          >
            ＋ Tomar Pedido
          </button>

          <button
            type="button"
            className={`pedidos-sound-button ${soundEnabled ? "active" : ""}`}
            onClick={soundEnabled ? disableSound : enableSound}
          >
            {soundEnabled ? "🔊 Sonido activado" : "🔇 Activar sonido"}
          </button>

          <button
            type="button"
            className="pedidos-refresh-button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? "refresh-spinning" : ""}>
              ↻
            </span>
            {refreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </header>

      {/* RESUMEN */}

      <section className="pedidos-summary">
        <article className="pedidos-summary-card">
          <div className="summary-icon summary-icon-total">▤</div>
          <div className="summary-info">
            <span>Pedidos activos</span>
            <strong>{orders.length}</strong>
          </div>
        </article>

        <article className="pedidos-summary-card">
          <div className="summary-icon summary-icon-pending">◷</div>
          <div className="summary-info">
            <span>Pendientes</span>
            <strong>
              {orders.filter(
                (order) => order.status === "Pendiente"
              ).length}
            </strong>
          </div>
        </article>

        <article className="pedidos-summary-card">
          <div className="summary-icon summary-icon-preparing">♨</div>
          <div className="summary-info">
            <span>En preparación</span>
            <strong>
              {orders.filter(
                (order) => order.status === "Preparando"
              ).length}
            </strong>
          </div>
        </article>

        <article className="pedidos-summary-card">
          <div className="summary-icon summary-icon-ready">✓</div>
          <div className="summary-info">
            <span>Listos</span>
            <strong>
              {orders.filter(
                (order) => order.status === "Listo"
              ).length}
            </strong>
          </div>
        </article>
      </section>

      {/* LISTADO DE PEDIDOS */}

      <section className="pedidos-content">
        <div className="pedidos-section-heading">
          <div>
            <span className="pedidos-eyebrow">
              COCINA Y ENTREGAS
            </span>
            <h2>Pedidos actuales</h2>
            <p>
              Los pedidos nuevos aparecen automáticamente.
            </p>
          </div>

          <span className="pedidos-count">
            {orders.length}{" "}
            {orders.length === 1 ? "pedido" : "pedidos"}
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
                    <span>Actualizando pedido...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {takeOrderOpen && (
        <div
          className="take-order-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTakeOrder();
            }
          }}
        >
          <section
            className="take-order-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Tomar pedido"
          >
            <header className="take-order-header">
              <div>
                <span className="pedidos-eyebrow">VENTA PRESENCIAL</span>
                <h2>Tomar Pedido</h2>
              </div>
              <button
                type="button"
                className="take-order-close"
                onClick={closeTakeOrder}
                disabled={sendingOrder}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>

            <div className="take-order-body">
              <div className="take-order-products">
                <label className="take-order-search">
                  <span>Buscar producto</span>
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(event) =>
                      setProductSearch(event.target.value)
                    }
                    placeholder="Nombre o categoría..."
                  />
                </label>

                {productsLoading ? (
                  <div className="take-order-loading">
                    <span className="pedidos-spinner" />
                    Cargando productos...
                  </div>
                ) : (
                  <div className="take-order-product-grid">
                    {filteredProducts.map((product) => {
                      const productId = getProductId(product);
                      const modifiers =
                        (product.modifiers || []).filter(
                          (modifier) => modifier.active !== false
                        );

                      return (
                        <article
                          className="take-order-product"
                          key={productId}
                        >
                          <div className="take-order-product-info">
                            {product.image?.contentType && (
                              <img
                                src={`${API_URL}/products/${productId}/image`}
                                alt=""
                              />
                            )}
                            <div>
                              <strong>{product.title}</strong>
                              <span>{product.category}</span>
                            </div>
                            <b>
                              $
                              {formatMoney(
                                product.isPromo &&
                                product.promoPrice != null
                                  ? product.promoPrice
                                  : product.price
                              )}
                            </b>
                          </div>

                          {modifiers.length > 0 && (
                            <div className="take-order-modifiers">
                              {modifiers.map((modifier) => (
                                <fieldset key={modifier.name}>
                                  <legend>
                                    {modifier.name}
                                    {modifier.required ? " *" : ""}
                                  </legend>
                                  {(modifier.options || [])
                                    .filter((option) => option.active !== false)
                                    .map((option) => {
                                      const stateKey =
                                        `${productId}-${modifier.name}`;
                                      const current =
                                        selectedModifiers[stateKey];
                                      const isChecked =
                                        modifier.type === "multiple"
                                          ? (Array.isArray(current)
                                            ? current
                                            : []
                                          ).includes(option.label)
                                          : current === option.label;

                                      return (
                                        <label key={option.label}>
                                          <input
                                            type={
                                              modifier.type === "multiple"
                                                ? "checkbox"
                                                : "radio"
                                            }
                                            name={stateKey}
                                            checked={isChecked}
                                            onChange={() => {
                                              setSelectedModifiers((previous) => {
                                                if (modifier.type === "multiple") {
                                                  const selected =
                                                    Array.isArray(
                                                      previous[stateKey]
                                                    )
                                                      ? previous[stateKey]
                                                      : [];

                                                  return {
                                                    ...previous,
                                                    [stateKey]: isChecked
                                                      ? selected.filter(
                                                        (value) =>
                                                          value !== option.label
                                                      )
                                                      : [...selected, option.label],
                                                  };
                                                }

                                                return {
                                                  ...previous,
                                                  [stateKey]: option.label,
                                                };
                                              });
                                            }}
                                          />
                                          <span>
                                            {option.label}
                                            {Number(option.price) > 0 &&
                                              ` (+$${formatMoney(option.price)})`}
                                          </span>
                                        </label>
                                      );
                                    })}
                                </fieldset>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            className="take-order-add"
                            onClick={() => addManualProduct(product)}
                            disabled={
                              product.useStock &&
                              (Number(product.stock) || 0) <= 0
                            }
                          >
                            {product.useStock &&
                            (Number(product.stock) || 0) <= 0
                              ? "Sin stock"
                              : "+ Agregar"}
                          </button>
                        </article>
                      );
                    })}

                    {filteredProducts.length === 0 && !productsLoading && (
                      <div className="take-order-empty">
                        No se encontraron productos.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <aside className="take-order-cart">
                <h3>Datos del cliente</h3>

                <div className="take-order-form-grid">
                  <label>
                    Nombre *
                    <input
                      value={manualForm.firstName}
                      onChange={(event) =>
                        setManualForm((previous) => ({
                          ...previous,
                          firstName: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Apellido *
                    <input
                      value={manualForm.lastName}
                      onChange={(event) =>
                        setManualForm((previous) => ({
                          ...previous,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Teléfono *
                    <input
                      value={manualForm.phone}
                      onChange={(event) =>
                        setManualForm((previous) => ({
                          ...previous,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Entrega
                    <select
                      value={manualForm.deliveryType}
                      onChange={(event) =>
                        setManualForm((previous) => ({
                          ...previous,
                          deliveryType: event.target.value,
                        }))
                      }
                    >
                      <option value="retiro">Retiro en local</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </label>
                  {manualForm.deliveryType === "delivery" && (
                    <label className="take-order-full">
                      Dirección *
                      <input
                        value={manualForm.address}
                        onChange={(event) =>
                          setManualForm((previous) => ({
                            ...previous,
                            address: event.target.value,
                          }))
                        }
                      />
                    </label>
                  )}
                  <label>
                    Pago
                    <select
                      value={manualForm.paymentMethod}
                      onChange={(event) =>
                        setManualForm((previous) => ({
                          ...previous,
                          paymentMethod: event.target.value,
                        }))
                      }
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </label>
                  <label className="take-order-full">
                    Observaciones
                    <textarea
                      value={manualForm.notes}
                      onChange={(event) =>
                        setManualForm((previous) => ({
                          ...previous,
                          notes: event.target.value,
                        }))
                      }
                      rows="2"
                    />
                  </label>
                </div>

                <div className="take-order-cart-heading">
                  <h3>Carrito</h3>
                  <span>{manualCart.length} líneas</span>
                </div>

                <div className="take-order-cart-items">
                  {manualCart.length === 0 ? (
                    <div className="take-order-cart-empty">
                      Todavía no agregaste productos.
                    </div>
                  ) : (
                    manualCart.map((item, index) => {
                      const product = products.find(
                        (candidate) =>
                          getProductId(candidate) === item.productId
                      );
                      const configurablePromo =
                        product?.isPromo === true &&
                        product?.promoConfig?.enabled === true;

                      return (
                        <article
                          className="take-order-cart-item"
                          key={`${item.productId}-${index}`}
                        >
                          <div className="take-order-cart-item-main">
                            <strong>{item.title}</strong>
                            <button
                              type="button"
                              onClick={() => removeManualItem(index)}
                              aria-label={`Eliminar ${item.title}`}
                            >
                              ×
                            </button>
                          </div>

                          {item.modifiers.length > 0 && (
                            <div className="take-order-cart-modifiers">
                              {item.modifiers.map((modifier) => (
                                <span key={`${modifier.group}-${modifier.option}`}>
                                  {modifier.group}: {modifier.option}
                                </span>
                              ))}
                            </div>
                          )}

                          {configurablePromo && (
                            <div className="take-order-promo-selections">
                              {Array.from(
                                { length: item.quantity },
                                (_, packOffset) => packOffset + 1
                              ).map((packIndex) =>
                                (product.promoConfig.selectionGroups || []).map(
                                  (group) => {
                                    const allowedIds =
                                      (group.allowedProducts || []).map(String);
                                    const allowedProducts =
                                      products.filter((candidate) =>
                                        allowedIds.includes(
                                          getProductId(candidate)
                                        )
                                      );
                                    const selection =
                                      item.promoSelections.find(
                                        (candidate) =>
                                          candidate.packIndex === packIndex &&
                                          candidate.group === group.name
                                      );
                                    const selectedId =
                                      selection?.products?.[0]?.product || "";

                                    return (
                                      <label
                                        key={`${packIndex}-${group.name}`}
                                      >
                                        Pack {packIndex} · {group.name}
                                        <select
                                          value={selectedId}
                                          onChange={(event) =>
                                            updatePromoSelection(
                                              index,
                                              packIndex,
                                              group.name,
                                              event.target.value
                                            )
                                          }
                                        >
                                          {allowedProducts.map((allowed) => (
                                            <option
                                              key={getProductId(allowed)}
                                              value={getProductId(allowed)}
                                            >
                                              {allowed.title}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                    );
                                  }
                                )
                              )}
                            </div>
                          )}

                          <div className="take-order-cart-item-bottom">
                            <div className="take-order-quantity">
                              <button
                                type="button"
                                onClick={() =>
                                  updateManualQuantity(
                                    index,
                                    item.quantity - 1
                                  )
                                }
                              >
                                −
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateManualQuantity(
                                    index,
                                    item.quantity + 1
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                            <strong>
                              $
                              {formatMoney(
                                (Number(item.price) || 0) *
                                item.quantity
                              )}
                            </strong>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                <footer className="take-order-footer">
                  <div>
                    <span>Total</span>
                    <strong>${formatMoney(manualCartTotal)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={submitManualOrder}
                    disabled={sendingOrder || manualCart.length === 0}
                  >
                    {sendingOrder
                      ? "Enviando..."
                      : "Enviar comanda"}
                  </button>
                </footer>
              </aside>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default Pedidos;
