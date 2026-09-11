import "./OrderCard.css";
const OrderCard = ({
  order,
  changeStatus
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


  return (

    <div className="order-card">


      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="order-header">

        <h3>
          #{order.orderNumber}
        </h3>

        <span className="order-status">
          {order.status}
        </span>

      </div>


      {/* =================================================
          CLIENTE
      ================================================= */}

      <div className="order-customer">

        <p>
          👤{" "}
          <strong>
            {order.customer.firstName}{" "}
            {order.customer.lastName}
          </strong>
        </p>


        {
          order.customer.phone && (

            <p>
              📞 {order.customer.phone}
            </p>

          )
        }


        {
          order.customer.address && (

            <p>
              📍 {order.customer.address}
            </p>

          )
        }

      </div>


      {/* =================================================
          PRODUCTOS
      ================================================= */}

      <div className="order-products">

        <h4>
          🍗 Productos
        </h4>


        {
          order.items?.map(
            (item, index) => (

              <div
                className="order-product"
                key={index}
              >

                <div>

                  <strong>
                    {item.quantity}x{" "}
                    {item.title}
                  </strong>


                  {/* ======================================
                      GUARNICIONES / MODIFICADORES
                  ====================================== */}

                  {
                    item.modifiers?.length > 0 && (

                      <div className="order-modifiers">

                        {
                          item.modifiers.map(
                            (modifier, modifierIndex) => (

                              <p
                                key={modifierIndex}
                              >

                                🍟{" "}
                                <b>
                                  {modifier.group}:
                                </b>{" "}

                                {modifier.option}

                                {
                                  modifier.extraPrice > 0 && (

                                    <span>
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


                <strong>
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

      <div className="order-total">

        <strong>
          Total: ${order.total}
        </strong>

      </div>


      {/* =================================================
          PAGO
      ================================================= */}

      <div className="order-payment">

        <p>
          💳 Pago:{" "}
          <strong>
            {order.paymentMethod}
          </strong>
        </p>

      </div>


      {/* =================================================
          ACCIONES
      ================================================= */}

      <div className="actions">


        {
          order.status === "Pendiente" && (

            <button
              onClick={() =>
                handleStatus("Aceptado")
              }
            >
              ✅ Aceptar
            </button>

          )
        }


        {
          (
            order.status === "Pendiente" ||
            order.status === "Aceptado"
          ) && (

            <button
              onClick={() =>
                handleStatus("Preparando")
              }
            >
              🔥 Preparando
            </button>

          )
        }


        {
          order.status === "Preparando" && (

            <button
              onClick={() =>
                handleStatus("Listo")
              }
            >
              🍗 Listo
            </button>

          )
        }


        {
          order.status === "Listo" && (

            <button
              onClick={() =>
                handleStatus("En camino")
              }
            >
              🚚 En camino
            </button>

          )
        }


        {
          (
            order.status === "Listo" ||
            order.status === "En camino"
          ) && (

            <button
              onClick={() =>
                handleStatus("Entregado")
              }
            >
              ✅ Entregado
            </button>

          )
        }


        {
          order.status !== "Entregado" &&
          order.status !== "Cancelado" && (

            <button
              onClick={() =>
                handleStatus("Cancelado")
              }
              className="danger"
            >
              ❌ Cancelar
            </button>

          )
        }

      </div>

    </div>

  );

};


export default OrderCard;

