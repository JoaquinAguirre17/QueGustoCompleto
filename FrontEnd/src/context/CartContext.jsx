
import { createContext, useContext, useState } from "react";

const CartContext = createContext();

/* ==========================================
   NORMALIZAR SELECCIONES
========================================== */

const normalizeSelections = (selections = []) => {
  if (!Array.isArray(selections)) return [];

  return selections
    .map((group) => ({
      group: group.group,

      products: (group.products || [])
        .map((item) => ({
          product:
            typeof item.product === "object"
              ? item.product?._id || item.product?.id
              : item.product,

          quantity: Number(item.quantity || 0),
        }))
        .sort((a, b) =>
          String(a.product).localeCompare(String(b.product))
        ),
    }))
    .sort((a, b) =>
      String(a.group).localeCompare(String(b.group))
    );
};

/* ==========================================
   COMPARAR PRODUCTOS
========================================== */

const sameProduct = (a, b) => {
  return (
    a._id === b._id &&

    JSON.stringify(a.selectedModifiers || {}) ===
      JSON.stringify(b.selectedModifiers || {}) &&

    JSON.stringify(normalizeSelections(a.promoSelections)) ===
      JSON.stringify(normalizeSelections(b.promoSelections))
  );
};

/* ==========================================
   CART PROVIDER
========================================== */

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  /* AGREGAR PRODUCTO */

  const addToCart = (product) => {
    if (!product || !product._id) {
      console.error("Producto inválido");
      return;
    }

    const quantityToAdd = Math.max(
      1,
      Number(product.quantity) || 1
    );

    setCart((previousCart) => {
      const exists = previousCart.find((item) =>
        sameProduct(item, product)
      );

      if (exists) {
        return previousCart.map((item) =>
          sameProduct(item, product)
            ? {
                ...item,
                quantity: item.quantity + quantityToAdd,
              }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          quantity: quantityToAdd,
        },
      ];
    });
  };

  /* ELIMINAR PRODUCTO */

  const removeFromCart = (index) => {
    setCart((previousCart) =>
      previousCart.filter((_, i) => i !== index)
    );
  };

  /* ACTUALIZAR CANTIDAD */

  const updateQuantity = (index, quantity) => {
    const newQuantity = Number(quantity);

    if (!Number.isInteger(newQuantity) || newQuantity < 1) {
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item, i) =>
        i === index
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  /* VACIAR CARRITO */

  const clearCart = () => {
    setCart([]);
  };

  /* CANTIDAD TOTAL */

  const cartQuantity = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  /* TOTAL */

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartQuantity,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
