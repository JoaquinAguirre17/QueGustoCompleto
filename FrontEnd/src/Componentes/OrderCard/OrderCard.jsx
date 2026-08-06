const OrderCard = ({ order, changeStatus }) => {
  return (
    <div className="order-card">

      <h3>#{order.orderNumber}</h3>

      <p>
        👤 {order.customer.firstName}{" "}
        {order.customer.lastName}
      </p>

      <p>
        📌 Estado: <b>{order.status}</b>
      </p>

      <div className="actions">

        <button onClick={() =>
          changeStatus(order._id, "preparando")
        }>
          🔥 Preparando
        </button>

        <button onClick={() =>
          changeStatus(order._id, "listo")
        }>
          🍗 Listo
        </button>

        <button onClick={() =>
          changeStatus(order._id, "entregado")
        }>
          🚚 Entregado
        </button>

        <button onClick={() =>
          changeStatus(order._id, "cancelado")
        }
          className="danger"
        >
          ❌ Cancelar
        </button>

      </div>

    </div>
  );
};

export default OrderCard;