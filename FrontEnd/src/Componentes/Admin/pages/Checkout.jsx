
import { useState } from "react";
import axios from "axios";

import { useCart } from "../../../context/CartContext";
import { API_URL } from "../../../config/api";

import "./Checkout.css";

/* ==========================================
   CONFIGURACIÓN DE DELIVERY
========================================== */

const deliveryDisponible = () => {
  const fecha = new Date();

  const dia = fecha.getDay();
  const hora = fecha.getHours();

  // Si estamos entre las 00:00 y las 00:59,
  // corresponde al horario de la noche anterior.
  const diaOperativo =
    hora < 1
      ? dia === 0
        ? 6
        : dia - 1
      : dia;

  const diasDisponibles = [1, 2, 3, 4, 5, 6];

  return (
    diasDisponibles.includes(diaOperativo) &&
    (hora >= 20 || hora < 1)
  );
};

/* ==========================================
   NORMALIZAR IDENTIFICADOR
========================================== */

const getProductId = (product) => {
  if (!product) return null;

  if (typeof product === "string") {
    return product;
  }

  return product._id || product.id || null;
};

/* ==========================================
   FORMATEAR PRECIO
========================================== */

const formatPrice = (price) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
};

/* ==========================================
   NORMALIZAR MODIFICADORES
========================================== */

const prepararModificadores = (selectedModifiers = {}) => {
  const modifiers = [];

  Object.entries(selectedModifiers || {}).forEach(
    ([group, value]) => {
      if (Array.isArray(value)) {
        value.forEach((option) => {
          const optionName =
            typeof option === "object"
              ? option.label || option.option
              : option;

          if (optionName) {
            modifiers.push({
              group,
              option: optionName,
            });
          }
        });
      } else if (value) {
        const optionName =
          typeof value === "object"
            ? value.label || value.option
            : value;

        if (optionName) {
          modifiers.push({
            group,
            option: optionName,
          });
        }
      }
    }
  );

  return modifiers;
};

/* ==========================================
   NORMALIZAR PROMOCIONES
========================================== */

const prepararPromociones = (promoSelections = []) => {
  if (!Array.isArray(promoSelections)) {
    return [];
  }

  return promoSelections.map((group) => ({
    group: group.group,

    products: (group.products || []).map((selected) => ({
      product: getProductId(selected.product),
      quantity: Number(selected.quantity),
    })),
  }));
};

/* ==========================================
   COMPONENTE CHECKOUT
========================================== */

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    deliveryType: "retiro",
    paymentMethod: "Efectivo",
  });

  const [loading, setLoading] = useState(false);

  /* ==========================================
     CAMBIOS DEL FORMULARIO
  ========================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* ==========================================
     PREPARAR ITEMS
  ========================================== */

  const prepararItems = () => {
    return cart.map((item) => {
      const productId = getProductId(
        item._id || item.product
      );

      const quantity = Number(item.quantity || 1);

      if (!productId) {
        throw new Error(
          `No se pudo identificar "${item.title || "un producto"}"`
        );
      }

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        throw new Error(
          `La cantidad de "${item.title}" no es válida`
        );
      }

      const modifiers = prepararModificadores(
        item.selectedModifiers
      );

      const promoSelections = prepararPromociones(
        item.promoSelections
      );

      for (const group of promoSelections) {
        if (!group.group || !Array.isArray(group.products)) {
          throw new Error(
            `Selección inválida en "${item.title}"`
          );
        }

        for (const selected of group.products) {
          if (
            !selected.product ||
            !Number.isInteger(selected.quantity) ||
            selected.quantity < 1
          ) {
            throw new Error(
              `Revisá las variedades de "${group.group}"`
            );
          }
        }
      }

      return {
        product: productId,
        quantity,
        modifiers,
        promoSelections,
      };
    });
  };

  /* ==========================================
     CONFIRMAR PEDIDO
  ========================================== */

  const createOrder = async () => {
    if (loading) return;

    try {
      if (!cart.length) {
        alert("El carrito está vacío");
        return;
      }

      if (
        !form.firstName.trim() ||
        !form.lastName.trim() ||
        !form.phone.trim()
      ) {
        alert("Completá nombre, apellido y teléfono");
        return;
      }

      if (
        form.deliveryType === "delivery" &&
        !deliveryDisponible()
      ) {
        alert(
          "Delivery disponible de lunes a sábado de 20:00 a 01:00"
        );
        return;
      }

      if (
        form.deliveryType === "delivery" &&
        !form.address.trim()
      ) {
        alert("Ingresá la dirección");
        return;
      }

      if (
        !["Efectivo", "Transferencia"].includes(
          form.paymentMethod
        )
      ) {
        alert("Seleccioná un método de pago válido");
        return;
      }

      const items = prepararItems();

      const order = {
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),

          address:
            form.deliveryType === "delivery"
              ? form.address.trim()
              : "Retira en local",
        },

        items,

        paymentMethod: form.paymentMethod,

        deliveryType: form.deliveryType,
      };

      console.log(
        "PEDIDO ENVIADO AL BACKEND:",
        order
      );

      setLoading(true);

      const res = await axios.post(
        `${API_URL}/orders`,
        order
      );

      if (!res.data?.success || !res.data?.order) {
        throw new Error(
          res.data?.message ||
            "No se pudo confirmar el pedido"
        );
      }

      const orderNumber =
        res.data.order.orderNumber ||
        res.data.order._id;

      alert(
        `¡Pedido creado correctamente! Número: ${orderNumber}`
      );

      clearCart();

    } catch (error) {
      console.error("Error creando pedido:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "No se pudo crear el pedido";

      alert(message);

    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     PRODUCTOS INCLUIDOS
  ========================================== */

  const renderIncludedProducts = (item) => {
    if (!Array.isArray(item.includedProducts)) {
      return null;
    }

    if (!item.includedProducts.length) {
      return null;
    }

    return (
      <div className="checkout-promo-included">
        <strong>🎁 Incluye:</strong>

        {item.includedProducts.map((included, index) => (
          <p key={`${included.product}-${index}`}>
            {included.quantity} x {included.title}
          </p>
        ))}
      </div>
    );
  };

  /* ==========================================
     SELECCIONES DE PROMOCIONES
  ========================================== */

  const renderPromoSelections = (item) => {
    if (!Array.isArray(item.promoSelections)) {
      return null;
    }

    if (!item.promoSelections.length) {
      return null;
    }

    return item.promoSelections.map((group, index) => (
      <div
        key={`${group.group}-${index}`}
        className="checkout-promo-selection"
      >
        <strong>🍕 {group.group}</strong>

        {(group.products || []).map(
          (selected, selectedIndex) => {
            const title =
              selected.title ||
              (typeof selected.product === "object"
                ? selected.product?.title
                : null) ||
              "Producto seleccionado";

            return (
              <p key={`${title}-${selectedIndex}`}>
                {selected.quantity} x {title}
              </p>
            );
          }
        )}
      </div>
    ));
  };

  /* ==========================================
     MODIFICADORES
  ========================================== */

  const renderModifiers = (item) => {
    if (!item.selectedModifiers) return null;

    return Object.entries(item.selectedModifiers).map(
      ([name, value]) => {
        const options = Array.isArray(value)
          ? value
          : [value];

        return (
          <div
            key={name}
            className="checkout-modifier"
          >
            {options.map((option, index) => {
              const optionName =
                typeof option === "object"
                  ? option.label || option.option
                  : option;

              return (
                <p key={`${name}-${index}`}>
                  🍟 <b>{name}:</b> {optionName}
                </p>
              );
            })}
          </div>
        );
      }
    );
  };

  /* ==========================================
     INTERFAZ
  ========================================== */

  return (
    <main className="checkout-page">

      <h1>🍗 Finalizar pedido</h1>

      <div className="checkout-container">

        {/* FORMULARIO */}

        <section className="checkout-form">

          <h2>Datos del cliente</h2>

          <input
            name="firstName"
            placeholder="Nombre"
            value={form.firstName}
            onChange={handleChange}
            disabled={loading}
          />

          <input
            name="lastName"
            placeholder="Apellido"
            value={form.lastName}
            onChange={handleChange}
            disabled={loading}
          />

          <input
            name="phone"
            type="tel"
            placeholder="Teléfono"
            value={form.phone}
            onChange={handleChange}
            disabled={loading}
          />

          <h2>Entrega</h2>

          <select
            name="deliveryType"
            value={form.deliveryType}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="retiro">
              Retirar en local
            </option>

            <option
              value="delivery"
              disabled={!deliveryDisponible()}
            >
              Delivery
              {!deliveryDisponible() && " no disponible"}
            </option>
          </select>

          {form.deliveryType === "delivery" && (
            <input
              name="address"
              placeholder="Dirección"
              value={form.address}
              onChange={handleChange}
              disabled={loading}
            />
          )}

          <h2>Pago</h2>

          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="Efectivo">
              Efectivo
            </option>

            <option value="Transferencia">
              Transferencia
            </option>
          </select>

          <button
            type="button"
            className="checkout-btn"
            onClick={createOrder}
            disabled={loading || cart.length === 0}
          >
            {loading
              ? "Enviando pedido..."
              : "Confirmar pedido"}
          </button>

        </section>

        {/* RESUMEN */}

        <section className="checkout-summary">

          <h2>Resumen del pedido</h2>

          {cart.length === 0 ? (
            <p>No hay productos en el carrito</p>
          ) : (
            cart.map((item, index) => (

              <article
                className="summary-item"
                key={`${item._id}-${index}`}
              >

                <div className="summary-item-info">

                  <strong>{item.title}</strong>

                  {renderModifiers(item)}

                  {renderIncludedProducts(item)}

                  {renderPromoSelections(item)}

                </div>

                <div className="summary-item-price">
                  <span>
                    {item.quantity} x {formatPrice(item.price)}
                  </span>

                  <strong>
                    {formatPrice(
                      Number(item.price || 0) *
                      Number(item.quantity || 0)
                    )}
                  </strong>
                </div>

              </article>

            ))
          )}

          <div className="checkout-summary-total">
            <span>Total del pedido</span>

            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          <p className="checkout-summary-note">
            Revisá las variedades y cantidades antes de confirmar.
          </p>

        </section>

      </div>

    </main>
  );
};

export default Checkout;
