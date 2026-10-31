
import "./OrderCard.css";

const OrderCard = ({
  order,
  changeStatus,
  notifyWhatsApp
}) => {

  /* =====================================================
     CAMBIAR ESTADO
  ===================================================== */

  const handleStatus = (status) => {
    changeStatus(order._id, status);
  };


  /* =====================================================
     UTILIDADES DE IMPRESIÓN
  ===================================================== */

  const escapeHTML = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };


  const money = (value) => {
    return Number(value || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };


  const formatDate = (date) => {

    const parsedDate = date
      ? new Date(date)
      : new Date();

    if (Number.isNaN(parsedDate.getTime())) {
      return "Fecha no disponible";
    }

    return parsedDate.toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  };


  /* =====================================================
     IMPRIMIR COMANDA - QUE GUSTO

     Compatible con el modelo Order de MongoDB.

     Impresora térmica de 80mm.
  ===================================================== */

  const printOrder = (order) => {

    if (!order) return;

    /* ================================================
       DATOS DEL CLIENTE
    ================================================ */

    const customer = order.customer || {};

    const customerName =
      `${customer.firstName || ""} ${customer.lastName || ""}`
        .trim() || "Sin nombre";

    const phone = customer.phone || "";
    const address = customer.address || "";
    const observations = customer.notes || "";


    /* ================================================
       DATOS DEL PEDIDO
    ================================================ */

    const orderNumber = escapeHTML(
      order.orderNumber || "---"
    );

    const paymentMethod = escapeHTML(
      order.paymentMethod || "Efectivo"
    );

    const status = escapeHTML(
      order.status || "Pendiente"
    );

    const createdAt = formatDate(order.createdAt);


    /* ================================================
       PRODUCTOS Y MODIFICADORES
    ================================================ */

    const itemsHTML = (order.items || [])
      .map((item) => {

        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const subtotal = Number(item.subtotal || 0);

        /* MODIFICADORES */

        const modifiersHTML = (item.modifiers || [])
          .map((modifier) => {

            const extra = Number(
              modifier.extraPrice || 0
            );

            return `
              <div class="modifier">

                <span>
                  + ${escapeHTML(modifier.group || "Extra")}:
                  ${escapeHTML(modifier.option || "")}
                </span>

                ${
                  extra > 0
                    ? `<strong>+$${money(extra)}</strong>`
                    : ""
                }

              </div>
            `;

          })
          .join("");


        /* PRODUCTO */

        return `
          <div class="product">

            <div class="product-main">

              <div class="quantity">
                ${quantity}x
              </div>

              <div class="product-info">

                <div class="product-name">
                  ${escapeHTML(item.title || "Producto")}
                </div>

                <div class="unit-price">
                  Precio unitario: $${money(unitPrice)}
                </div>

                ${
                  modifiersHTML
                    ? `
                      <div class="modifiers">
                        ${modifiersHTML}
                      </div>
                    `
                    : ""
                }

              </div>

            </div>

            <div class="product-subtotal">
              Subtotal: $${money(subtotal)}
            </div>

          </div>
        `;

      })
      .join("");


    /* ================================================
       VENTANA DE IMPRESIÓN
    ================================================ */

    const printWindow = window.open(
      "",
      "_blank",
      "width=400,height=700"
    );

    if (!printWindow) {

      alert(
        "El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes."
      );

      return;
    }


    /* ================================================
       DOCUMENTO HTML
    ================================================ */

    printWindow.document.open();

    printWindow.document.write(`

      <!DOCTYPE html>

      <html lang="es">

        <head>

          <meta charset="UTF-8">

          <meta name="viewport" content="width=device-width, initial-scale=1">

          <title>Comanda #${orderNumber}</title>

          <style>

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 80mm;
              background: white;
              color: black;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 13px;
              font-weight: 500;
            }

            .ticket {
              width: 80mm;
              padding: 4mm 4mm 30mm;
            }


            /* =================================
               CABECERA
            ================================= */

            .header {
              text-align: center;
              padding-bottom: 12px;
            }

            .business {
              font-size: 27px;
              font-weight: 900;
              letter-spacing: 1px;
            }

            .business-subtitle {
              font-size: 11px;
              margin-top: 3px;
              letter-spacing: 2px;
            }

            .order-number {
              margin-top: 12px;
              font-size: 23px;
              font-weight: 900;
              border: 2px solid black;
              padding: 7px 3px;
            }

            .order-date {
              margin-top: 7px;
              font-size: 12px;
            }


            /* =================================
               SEPARADORES
            ================================= */

            .separator {
              border-top: 2px dashed black;
              margin: 11px 0;
            }

            .solid-separator {
              border-top: 2px solid black;
              margin: 10px 0;
            }


            /* =================================
               SECCIONES
            ================================= */

            .section-title {
              font-size: 14px;
              font-weight: 900;
              text-transform: uppercase;
              margin-bottom: 8px;
            }

            .info-row {
              margin-bottom: 6px;
              line-height: 1.4;
              overflow-wrap: anywhere;
            }

            .info-row strong {
              font-weight: 900;
            }


            /* =================================
               PRODUCTOS
            ================================= */

            .products-title {
              font-size: 17px;
              font-weight: 900;
              margin-bottom: 12px;
              text-transform: uppercase;
            }

            .product {
              margin-bottom: 13px;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .product-main {
              display: flex;
              align-items: flex-start;
              gap: 7px;
            }

            .quantity {
              font-size: 16px;
              font-weight: 900;
              min-width: 32px;
            }

            .product-info {
              flex: 1;
              min-width: 0;
            }

            .product-name {
              font-size: 15px;
              font-weight: 900;
              line-height: 1.3;
              overflow-wrap: anywhere;
            }

            .unit-price {
              font-size: 11px;
              margin-top: 4px;
            }

            .product-subtotal {
              text-align: right;
              font-size: 14px;
              font-weight: 900;
              margin-top: 5px;
            }


            /* =================================
               MODIFICADORES
            ================================= */

            .modifiers {
              margin-top: 5px;
              padding-left: 5px;
              font-size: 12px;
            }

            .modifier {
              display: flex;
              justify-content: space-between;
              gap: 5px;
              margin-bottom: 4px;
              line-height: 1.3;
            }

            .modifier strong {
              white-space: nowrap;
            }


            /* =================================
               TOTAL
            ================================= */

            .total {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 21px;
              font-weight: 900;
              padding: 10px 0;
            }


            /* =================================
               PAGO
            ================================= */

            .payment {
              font-size: 13px;
              line-height: 1.6;
            }


            /* =================================
               OBSERVACIONES
            ================================= */

            .observations {
              margin-top: 10px;
              border: 1px dashed black;
              padding: 8px;
              font-size: 13px;
              line-height: 1.5;
              overflow-wrap: anywhere;
            }


            /* =================================
               FOOTER
            ================================= */

            .footer {
              text-align: center;
              margin-top: 18px;
              font-size: 12px;
              line-height: 1.5;
              font-weight: bold;
            }


            /* =================================
               IMPRESIÓN
            ================================= */

            @media print {

              @page {
                size: 80mm auto;
                margin: 0;
              }

              html,
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }

              .ticket {
                width: 80mm;
                padding: 3mm 3mm 30mm;
              }

              .product,
              .header,
              .total {
                break-inside: avoid;
                page-break-inside: avoid;
              }

            }

          </style>

        </head>


        <body>

          <div class="ticket">


            <!-- CABECERA -->

            <div class="header">

              <div class="business">
                QUE GUSTO!!!
              </div>

              <div class="business-subtitle">
                ROTISERÍA
              </div>

              <div class="order-number">
                PEDIDO #${orderNumber}
              </div>

              <div class="order-date">
                ${escapeHTML(createdAt)}
              </div>

            </div>


            <div class="separator"></div>


            <!-- CLIENTE -->

            <div class="section-title">
              Datos del cliente
            </div>

            <div class="info-row">

              <strong>Nombre:</strong>
              ${escapeHTML(customerName)}

            </div>


            ${
              phone
                ? `
                  <div class="info-row">

                    <strong>Teléfono:</strong>
                    ${escapeHTML(phone)}

                  </div>
                `
                : ""
            }


            ${
              address
                ? `
                  <div class="info-row">

                    <strong>Dirección:</strong>
                    ${escapeHTML(address)}

                  </div>
                `
                : ""
            }


            <div class="separator"></div>


            <!-- PRODUCTOS -->

            <div class="products-title">
              Detalle del pedido
            </div>


            ${
              itemsHTML ||
              "<p>No hay productos registrados</p>"
            }


            <div class="separator"></div>


            <!-- TOTAL -->

            <div class="total">

              <span>TOTAL</span>

              <span>
                $${money(order.total)}
              </span>

            </div>


            <div class="solid-separator"></div>


            <!-- PAGO -->

            <div class="payment">

              <div>

                <strong>Forma de pago:</strong>
                ${paymentMethod}

              </div>

              <div>

                <strong>Estado:</strong>
                ${status}

              </div>

            </div>


            <!-- OBSERVACIONES -->

            ${
              observations
                ? `
                  <div class="observations">

                    <strong>
                      OBSERVACIONES DEL CLIENTE:
                    </strong>

                    <br><br>

                    ${escapeHTML(observations)}

                  </div>
                `
                : ""
            }


            <div class="separator"></div>


            <!-- FOOTER -->

            <div class="footer">

              ¡GRACIAS POR ELEGIR<br>
              QUE GUSTO!!!

              <br><br>

              Buen provecho ❤️

            </div>


          </div>


          <script>

            window.onload = () => {

              setTimeout(() => {

                window.focus();
                window.print();

              }, 500);

            };

            window.onafterprint = () => {

              setTimeout(() => {

                window.close();

              }, 500);

            };

          </script>

        </body>

      </html>

    `);

    printWindow.document.close();

  };


  /* =====================================================
     RENDER DE LA TARJETA
  ===================================================== */

  return (

    <div className="qg-order-card">


      {/* ================================================
          CABECERA
      ================================================ */}

      <div className="qg-order-header">

        <div className="qg-order-header-content">

          <span className="qg-order-label">
            PEDIDO
          </span>

          <h3 className="qg-order-number">
            #{order.orderNumber}
          </h3>

        </div>


        <span
          className={`qg-order-status qg-order-status-${String(
            order.status
          )
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          {order.status}
        </span>

      </div>


      {/* ================================================
          CLIENTE
      ================================================ */}

      <div className="qg-order-customer">

        <p className="qg-order-customer-name">

          <span className="qg-order-customer-icon">
            👤
          </span>

          <strong>
            {order.customer?.firstName}{" "}
            {order.customer?.lastName}
          </strong>

        </p>


        {
          order.customer?.phone && (

            <p className="qg-order-customer-data">

              <span className="qg-order-customer-icon">
                📞
              </span>

              <span>
                {order.customer.phone}
              </span>

            </p>

          )
        }


        {
          order.customer?.address && (

            <p className="qg-order-customer-data">

              <span className="qg-order-customer-icon">
                📍
              </span>

              <span>
                {order.customer.address}
              </span>

            </p>

          )
        }

      </div>


      {/* ================================================
          PRODUCTOS
      ================================================ */}

      <div className="qg-order-products">

        <h4 className="qg-order-products-title">
          🍗 Productos
        </h4>


        {
          order.items?.map((item, index) => (

            <div
              className="qg-order-product"
              key={index}
            >

              <div className="qg-order-product-info">

                <div className="qg-order-product-title">

                  <strong>
                    {item.quantity}x {item.title}
                  </strong>

                </div>


                {/* MODIFICADORES */}

                {
                  item.modifiers?.length > 0 && (

                    <div className="qg-order-modifiers">

                      {
                        item.modifiers.map(
                          (modifier, modifierIndex) => (

                            <p
                              className="qg-order-modifier"
                              key={modifierIndex}
                            >

                              <span className="qg-order-modifier-icon">
                                🍟
                              </span>

                              <b>
                                {modifier.group}:
                              </b>{" "}

                              <span>
                                {modifier.option}
                              </span>


                              {
                                modifier.extraPrice > 0 && (

                                  <span className="qg-order-modifier-extra">

                                    {" "}
                                    (+$
                                    {modifier.extraPrice})

                                  </span>

                                )
                              }

                            </p>

                          )
                        )
                      }

                    </div>

                  )
                }

              </div>


              <strong className="qg-order-product-price">

                ${item.subtotal}

              </strong>

            </div>

          ))
        }

      </div>


      {/* ================================================
          TOTAL
      ================================================ */}

      <div className="qg-order-total">

        <span className="qg-order-total-label">
          Total
        </span>

        <strong className="qg-order-total-value">
          ${order.total}
        </strong>

      </div>


      {/* ================================================
          PAGO
      ================================================ */}

      <div className="qg-order-payment">

        <span className="qg-order-payment-label">
          💳 Pago
        </span>

        <strong className="qg-order-payment-method">
          {order.paymentMethod || "No especificado"}
        </strong>

      </div>


      {/* ================================================
          ACCIONES
      ================================================ */}

      <div className="qg-order-actions">


        {/* IMPRIMIR COMANDA */}

        <button
          type="button"
          className="qg-order-button qg-order-button-print"
          onClick={() => printOrder(order)}
        >
          🖨️ Imprimir comanda
        </button>


        {/* PENDIENTE → LISTO */}

        {
          order.status === "Pendiente" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-ready"
              onClick={() => handleStatus("Listo")}
            >
              🍗 Marcar como listo
            </button>

          )
        }


        {/* AVISAR POR WHATSAPP */}

        {
          order.status === "Listo" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-whatsapp"
              onClick={() => notifyWhatsApp(order)}
              disabled={!order.customer?.phone}
            >
              💬 Avisar por WhatsApp
            </button>

          )
        }


        {/* LISTO → ENTREGADO */}

        {
          order.status === "Listo" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-delivered"
              onClick={() => handleStatus("Entregado")}
            >
              ✅ Marcar como entregado
            </button>

          )
        }


        {/* CANCELAR */}

        {
          order.status !== "Entregado" &&
          order.status !== "Cancelado" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-danger"
              onClick={() => handleStatus("Cancelado")}
            >
              ❌ Cancelar pedido
            </button>

          )
        }


      </div>

    </div>

  );

};


export default OrderCard;
