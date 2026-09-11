
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

  const printOrder = () => {

    const customerName =
      `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();


    /* ===================================================
       PRODUCTOS DE LA COMANDA
    =================================================== */

    const itemsHTML =
      order.items?.map((item) => {

        const modifiersHTML =
          item.modifiers?.length > 0
            ? `
              <div class="qg-print-modifiers">

                ${
                  item.modifiers
                    .map(
                      (modifier) => `
                        <div class="qg-print-modifier">

                          • ${modifier.group}:
                          ${modifier.option}

                          ${
                            modifier.extraPrice > 0
                              ? ` (+$${modifier.extraPrice})`
                              : ""
                          }

                        </div>
                      `
                    )
                    .join("")
                }

              </div>
            `
            : "";


        return `
          <div class="qg-print-item">

            <div class="qg-print-item-main">

              <strong>
                ${item.quantity}x ${item.title}
              </strong>

              <strong>
                $${item.subtotal}
              </strong>

            </div>

            ${modifiersHTML}

          </div>
        `;

      }).join("");


    /* ===================================================
       ABRIR VENTANA DE IMPRESIÓN
    =================================================== */

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=400,height=700"
      );


    if (!printWindow) {

      alert(
        "El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes para este sitio."
      );

      return;

    }


    /* ===================================================
       DOCUMENTO DE IMPRESIÓN
    =================================================== */

    printWindow.document.write(`

      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8" />

          <title>
            Comanda #${order.orderNumber}
          </title>


          <style>

            * {
              box-sizing: border-box;
            }


            body {

              margin: 0;

              padding: 15px;

              width: 100%;

              font-family:
                Arial,
                Helvetica,
                sans-serif;

              color: #000;

              background: #fff;

              font-size: 14px;

            }


            .qg-print-ticket {

              width: 100%;

              max-width: 380px;

              margin: 0 auto;

            }


            .qg-print-header {

              text-align: center;

              margin-bottom: 12px;

            }


            .qg-print-business {

              font-size: 22px;

              font-weight: bold;

              margin-bottom: 6px;

            }


            .qg-print-order-number {

              font-size: 20px;

              font-weight: bold;

            }


            .qg-print-separator {

              border-top: 2px dashed #000;

              margin: 10px 0;

            }


            .qg-print-info {

              margin-bottom: 8px;

              line-height: 1.5;

            }


            .qg-print-info strong {

              font-weight: bold;

            }


            .qg-print-item {

              margin-bottom: 10px;

            }


            .qg-print-item-main {

              display: flex;

              justify-content: space-between;

              gap: 10px;

            }


            .qg-print-item-main strong:first-child {

              flex: 1;

            }


            .qg-print-modifiers {

              margin-top: 4px;

              padding-left: 12px;

              font-size: 13px;

            }


            .qg-print-modifier {

              margin-bottom: 2px;

            }


            .qg-print-total {

              display: flex;

              justify-content: space-between;

              font-size: 18px;

              font-weight: bold;

              margin-top: 10px;

            }


            .qg-print-payment {

              margin-top: 8px;

            }


            .qg-print-footer {

              text-align: center;

              margin-top: 20px;

              font-size: 12px;

            }


            @media print {

              body {

                padding: 0;

              }


              .qg-print-ticket {

                max-width: none;

              }


              @page {

                margin: 5mm;

              }

            }

          </style>

        </head>


        <body>

          <div class="qg-print-ticket">


            <!-- CABECERA -->

            <div class="qg-print-header">

              <div class="qg-print-business">
                QUE GUSTO
              </div>

              <div class="qg-print-order-number">
                PEDIDO #${order.orderNumber}
              </div>

            </div>


            <div class="qg-print-separator"></div>


            <!-- CLIENTE -->

            <div class="qg-print-info">

              <strong>
                Cliente:
              </strong>

              ${customerName || "Sin nombre"}

            </div>


            ${
              order.customer?.phone
                ? `
                  <div class="qg-print-info">

                    <strong>
                      Teléfono:
                    </strong>

                    ${order.customer.phone}

                  </div>
                `
                : ""
            }


            ${
              order.customer?.address
                ? `
                  <div class="qg-print-info">

                    <strong>
                      Dirección:
                    </strong>

                    ${order.customer.address}

                  </div>
                `
                : ""
            }


            <div class="qg-print-info">

              <strong>
                Estado:
              </strong>

              ${order.status}

            </div>


            <div class="qg-print-separator"></div>


            <!-- PRODUCTOS -->

            <div>

              ${itemsHTML}

            </div>


            <div class="qg-print-separator"></div>


            <!-- TOTAL -->

            <div class="qg-print-total">

              <span>
                TOTAL
              </span>

              <span>
                $${order.total}
              </span>

            </div>


            <!-- FORMA DE PAGO -->

            <div class="qg-print-payment">

              <strong>
                Forma de pago:
              </strong>

              ${order.paymentMethod || "No especificado"}

            </div>


            <div class="qg-print-separator"></div>


            <!-- FOOTER -->

            <div class="qg-print-footer">

              Gracias por elegir Que Gusto ❤️

            </div>


          </div>


          <script>

            window.onload = function() {

              window.print();

            };


            window.onafterprint = function() {

              window.close();

            };

          </script>

        </body>

      </html>

    `);


    printWindow.document.close();

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
