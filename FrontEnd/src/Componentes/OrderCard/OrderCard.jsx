
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

    changeStatus(
      order._id,
      status
    );

  };


  /* =====================================================
     IMPRIMIR COMANDA

     Generamos una ventana nueva con una comanda
     especialmente preparada para impresora térmica.
  ===================================================== */


const printOrder = (order) => {
  if (!order) return;

  const customerName =
    `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();

  /* =====================================================
     PRODUCTOS
  ===================================================== */

  const itemsHTML =
    order.items
      ?.map((item) => {
        const modifiersHTML =
          item.modifiers?.length > 0
            ? `
              <div class="print-modifiers">
                ${item.modifiers
                  .map(
                    (modifier) => `
                      <div class="print-modifier">
                        • ${modifier.group}: ${modifier.option}
                        ${
                          modifier.extraPrice > 0
                            ? ` (+$${modifier.extraPrice})`
                            : ""
                        }
                      </div>
                    `
                  )
                  .join("")}
              </div>
            `
            : "";

        return `
          <div class="print-item">

            <div class="print-item-main">

              <div class="print-item-name">
                <strong>
                  ${item.quantity}x ${item.title}
                </strong>
              </div>

              <div class="print-item-price">
                $${item.subtotal}
              </div>

            </div>

            ${modifiersHTML}

          </div>
        `;
      })
      .join("") || "";

  /* =====================================================
     CREAR VENTANA DE IMPRESIÓN
  ===================================================== */

  const printWindow = window.open(
    "",
    "_blank",
    "width=400,height=700,left=100,top=100"
  );

  if (!printWindow) {
    alert(
      "El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes para este sitio."
    );
    return;
  }

  /* =====================================================
     HTML DE LA COMANDA
  ===================================================== */

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Comanda ${order.orderNumber}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }

          body {
            width: 80mm;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 13px;
          }

          .ticket {
            width: 80mm;
            padding: 5mm;
            
            /* ESPACIO EXTRA PARA LA CORTADORA */
            padding-bottom: 30mm;
          }

          .header {
            text-align: center;
            margin-bottom: 10px;
          }

          .business {
            font-size: 22px;
            font-weight: bold;
          }

          .order-number {
            font-size: 18px;
            font-weight: bold;
            margin-top: 5px;
          }

          .separator {
            border-top: 2px dashed #000;
            margin: 10px 0;
          }

          .info {
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 4px;
          }

          .info strong {
            font-weight: bold;
          }

          .print-item {
            margin-bottom: 10px;
          }

          .print-item-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }

          .print-item-name {
            flex: 1;
            word-wrap: break-word;
          }

          .print-item-price {
            white-space: nowrap;
            font-weight: bold;
          }

          .print-modifiers {
            padding-left: 10px;
            margin-top: 4px;
            font-size: 12px;
          }

          .print-modifier {
            margin-bottom: 2px;
          }

          .total {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: bold;
          }

          .payment {
            margin-top: 8px;
            font-size: 13px;
          }

          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 11px;
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

              padding-left: 3mm;
              padding-right: 3mm;
              padding-top: 3mm;

              /* MUCHO ESPACIO ABAJO */
              padding-bottom: 30mm;
            }

            @page {
              size: 80mm auto;
              margin: 0;
            }

          }

        </style>

      </head>


      <body>

        <div class="ticket">

          <!-- CABECERA -->

          <div class="header">

            <div class="business">
              QUE GUSTO
            </div>

            <div class="order-number">
              PEDIDO #${order.orderNumber}
            </div>

          </div>


          <div class="separator"></div>


          <!-- CLIENTE -->

          <div class="info">

            <strong>Cliente:</strong>
            ${customerName || "Sin nombre"}

          </div>


          ${
            order.customer?.phone
              ? `
                <div class="info">
                  <strong>Teléfono:</strong>
                  ${order.customer.phone}
                </div>
              `
              : ""
          }


          ${
            order.customer?.address
              ? `
                <div class="info">
                  <strong>Dirección:</strong>
                  ${order.customer.address}
                </div>
              `
              : ""
          }


          <div class="info">

            <strong>Estado:</strong>
            ${order.status || "pendiente"}

          </div>


          <div class="separator"></div>


          <!-- PRODUCTOS -->

          ${itemsHTML}


          <div class="separator"></div>


          <!-- TOTAL -->

          <div class="total">

            <span>
              TOTAL
            </span>

            <span>
              $${order.total}
            </span>

          </div>


          <!-- PAGO -->

          <div class="payment">

            <strong>
              Forma de pago:
            </strong>

            ${order.paymentMethod || "No especificado"}

          </div>


          <div class="separator"></div>


          <!-- FOOTER -->

          <div class="footer">

            Gracias por elegir Que Gusto ❤️

          </div>

        </div>


        <script>

          setTimeout(() => {

            window.focus();

            window.print();

          }, 500);


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

  printWindow.focus();
};




  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="qg-order-card">


      {/* =================================================
          CABECERA
      ================================================= */}

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


      {/* =================================================
          CLIENTE
      ================================================= */}

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


      {/* =================================================
          PRODUCTOS
      ================================================= */}

      <div className="qg-order-products">

        <h4 className="qg-order-products-title">
          🍗 Productos
        </h4>


        {
          order.items?.map(
            (item, index) => (

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


                  {/* ======================================
                      MODIFICADORES
                  ====================================== */}

                  {
                    item.modifiers?.length > 0 && (

                      <div className="qg-order-modifiers">

                        {
                          item.modifiers.map(
                            (
                              modifier,
                              modifierIndex
                            ) => (

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

            )
          )
        }

      </div>


      {/* =================================================
          TOTAL
      ================================================= */}

      <div className="qg-order-total">

        <span className="qg-order-total-label">
          Total
        </span>

        <strong className="qg-order-total-value">
          ${order.total}
        </strong>

      </div>


      {/* =================================================
          PAGO
      ================================================= */}

      <div className="qg-order-payment">

        <span className="qg-order-payment-label">
          💳 Pago
        </span>

        <strong className="qg-order-payment-method">
          {order.paymentMethod || "No especificado"}
        </strong>

      </div>


      {/* =================================================
          ACCIONES
      ================================================= */}

      <div className="qg-order-actions">


        {/* ================================================
            IMPRIMIR COMANDA
        ================================================ */}

        <button
          type="button"
          className="qg-order-button qg-order-button-print"
          onClick={printOrder}
        >
          🖨️ Imprimir comanda
        </button>


        {/* ================================================
            PENDIENTE → LISTO
        ================================================ */}

        {
          order.status === "Pendiente" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-ready"
              onClick={() =>
                handleStatus("Listo")
              }
            >
              🍗 Marcar como listo
            </button>

          )
        }


        {/* ================================================
            AVISAR POR WHATSAPP
            SOLO CUANDO ESTÁ LISTO
        ================================================ */}

        {
          order.status === "Listo" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-whatsapp"
              onClick={() =>
                notifyWhatsApp(order)
              }
              disabled={!order.customer?.phone}
            >
              💬 Avisar por WhatsApp
            </button>

          )
        }


        {/* ================================================
            LISTO → ENTREGADO
        ================================================ */}

        {
          order.status === "Listo" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-delivered"
              onClick={() =>
                handleStatus("Entregado")
              }
            >
              ✅ Marcar como entregado
            </button>

          )
        }


        {/* ================================================
            CANCELAR
        ================================================ */}

        {
          order.status !== "Entregado" &&
          order.status !== "Cancelado" && (

            <button
              type="button"
              className="qg-order-button qg-order-button-danger"
              onClick={() =>
                handleStatus("Cancelado")
              }
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
