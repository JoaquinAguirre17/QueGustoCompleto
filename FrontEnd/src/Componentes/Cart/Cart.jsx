
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

/* ==========================================
   UTILIDADES
========================================== */

const formatPrice = (price) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
};

const getProductId = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  return String(value._id || value.id || "");
};

const getPromoSelectionsByPack = (selections = []) => {
  if (!Array.isArray(selections)) return {};

  return selections.reduce((result, selection) => {
    const packIndex = Number(selection.packIndex || 1);

    if (!result[packIndex]) {
      result[packIndex] = {};
    }

    const groupName = selection.group || "Productos";

    if (!result[packIndex][groupName]) {
      result[packIndex][groupName] = [];
    }

    result[packIndex][groupName].push(
      ...(Array.isArray(selection.products)
        ? selection.products
        : [])
    );

    return result;
  }, {});
};

/* ==========================================
   COMPONENTE
========================================== */

const Cart = () => {
  const {
    cart,
    cartTotal,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  /* ==========================================
     CARRITO VACÍO
  ========================================== */

  if (!cart || cart.length === 0) {
    return (
      <main className="cart-page">
        <h2>🛒 Tu Pedido</h2>

        <div className="empty-cart">
          <span>🛍️</span>
          <h3>Tu carrito está vacío</h3>
          <p>Agregá algunos productos para comenzar tu pedido.</p>

          <button
            type="button"
            className="confirm-btn"
            onClick={() => navigate("/productos")}
          >
            Ver menú
          </button>
        </div>
      </main>
    );
  }

  /* ==========================================
     INTERFAZ
  ========================================== */

  return (
    <main className="cart-page">

      <h2>🛒 Tu Pedido</h2>

      <div className="cart-items">

        {cart.map((item, index) => {
          const quantity = Math.max(
            1,
            Number(item.quantity) || 1
          );

          const price = Number(item.price) || 0;

          const modifiers = item.selectedModifiers || {};

          const promoSelections = getPromoSelectionsByPack(
            item.promoSelections
          );

          const hasPromoSelections =
            Object.keys(promoSelections).length > 0;

          const includedProducts = Array.isArray(
            item.includedProducts
          )
            ? item.includedProducts
            : [];

          const isPromo =
            item.isPromo === true ||
            hasPromoSelections ||
            includedProducts.length > 0;

          return (
            <article
              key={`${item._id}-${index}`}
              className="cart-item"
            >

              {/* ==================================
                  INFORMACIÓN PRINCIPAL
              ================================== */}

              <div className="cart-item-info">

                <div className="cart-item-heading">

                  <div>
                    <h3>{item.title}</h3>

                    {isPromo && (
                      <span className="cart-promo-badge">
                        🔥 Promoción
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFromCart(index)}
                    aria-label={`Eliminar ${item.title}`}
                  >
                    ❌
                  </button>

                </div>

                {/* ==================================
                    MODIFICADORES
                ================================== */}

                {Object.keys(modifiers).length > 0 && (
                  <div className="cart-options">

                    <h4>Personalización</h4>

                    {Object.entries(modifiers).map(
                      ([name, value]) => (
                        <p key={name}>
                          🍟 <b>{name}:</b>{" "}
                          {Array.isArray(value)
                            ? value.join(", ")
                            : value}
                        </p>
                      )
                    )}

                  </div>
                )}

                {/* ==================================
                    PRODUCTOS DE CADA PROMOCIÓN
                ================================== */}

                {isPromo && (
                  <div className="cart-promo-details">

                    <h4>🎁 Detalle de la promoción</h4>

                    {Array.from(
                      { length: quantity },
                      (_, packIndex) => {
                        const currentPack =
                          promoSelections[packIndex + 1] || {};

                        return (
                          <div
                            className="cart-promo-pack"
                            key={packIndex}
                          >

                            <div className="cart-promo-pack-heading">
                              <strong>
                                Promoción {packIndex + 1}
                              </strong>
                            </div>

                            {/* PRODUCTOS FIJOS INCLUIDOS */}

                            {includedProducts.length > 0 && (
                              <div className="cart-promo-included">

                                <span className="cart-promo-label">
                                  Productos incluidos
                                </span>

                                {includedProducts.map(
                                  (included, includedIndex) => (
                                    <div
                                      className="cart-promo-product"
                                      key={`${getProductId(included.product)}-${includedIndex}`}
                                    >

                                      <span>
                                        {included.title ||
                                          included.product?.title ||
                                          "Producto incluido"}
                                      </span>

                                      <strong>
                                        x {Number(included.quantity) || 1}
                                      </strong>

                                    </div>
                                  )
                                )}

                              </div>
                            )}

                            {/* PRODUCTOS ELEGIDOS */}

                            {Object.entries(currentPack).map(
                              ([groupName, products]) => (
                                <div
                                  className="cart-promo-group"
                                  key={groupName}
                                >

                                  <span className="cart-promo-label">
                                    {groupName}
                                  </span>

                                  {products.map(
                                    (selected, selectedIndex) => (
                                      <div
                                        className="cart-promo-product"
                                        key={`${getProductId(selected.product)}-${selectedIndex}`}
                                      >

                                        <span>
                                          {selected.title ||
                                            selected.product?.title ||
                                            "Producto seleccionado"}
                                        </span>

                                        <strong>
                                          x {Number(selected.quantity) || 0}
                                        </strong>

                                      </div>
                                    )
                                  )}

                                </div>
                              )
                            )}

                            {!includedProducts.length &&
                              !Object.keys(currentPack).length && (
                                <p className="cart-promo-empty">
                                  No hay selecciones registradas para esta promoción.
                                </p>
                              )}

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

                {/* ==================================
                    PRECIO
                ================================== */}

                <div className="cart-item-footer">

                  <span>
                    {quantity} x {formatPrice(price)}
                  </span>

                  <strong>
                    {formatPrice(price * quantity)}
                  </strong>

                </div>

              </div>

            </article>
          );
        })}

      </div>

      {/* ======================================
          RESUMEN DEL PEDIDO
      ====================================== */}

      <section className="cart-summary">

        <div className="cart-summary-total">

          <span>Total del pedido</span>

          <h3>{formatPrice(cartTotal)}</h3>

        </div>

        <button
          type="button"
          className="clear-btn"
          onClick={() => {
            if (
              window.confirm(
                "¿Estás seguro de que querés vaciar todo el carrito?"
              )
            ) {
              clearCart();
            }
          }}
        >
          🗑 Vaciar carrito
        </button>

        <button
          type="button"
          className="confirm-btn"
          onClick={() => navigate("/checkout")}
        >
          Confirmar pedido
        </button>

        <button
          type="button"
          className="cart-continue-btn"
          onClick={() => navigate("/productos")}
        >
          ← Seguir comprando
        </button>

      </section>

    </main>
  );
};

export default Cart;
