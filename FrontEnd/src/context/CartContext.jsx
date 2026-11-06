import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const CartContext = createContext();

/* ==========================================
   NORMALIZAR ID
========================================== */

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return String(value._id || value.id || "");
};

/* ==========================================
   NORMALIZAR MODIFICADORES
========================================== */

const normalizeModifiers = (modifiers = {}) => {
  if (
    !modifiers ||
    typeof modifiers !== "object" ||
    Array.isArray(modifiers)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(modifiers)
      .map(([group, selected]) => {
        const normalized = Array.isArray(selected)
          ? [...selected].map(String).sort()
          : selected;

        return [group, normalized];
      })
      .sort(([a], [b]) => a.localeCompare(b))
  );
};

/* ==========================================
   NORMALIZAR SELECCIONES DE PROMOCIÓN
========================================== */

const normalizeSelections = (selections = []) => {
  if (!Array.isArray(selections)) return [];

  return selections
    .map((group) => ({
      group: String(group.group || ""),

      products: (group.products || [])
        .map((item) => ({
          product: getId(item.product),

          quantity: Number(item.quantity || 0),
        }))
        .filter(
          (item) =>
            item.product &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        )
        .sort((a, b) =>
          a.product.localeCompare(b.product)
        ),
    }))
    .sort((a, b) =>
      a.group.localeCompare(b.group)
    );
};

/* ==========================================
   NORMALIZAR PRODUCTOS INCLUIDOS
========================================== */

const normalizeIncludedProducts = (products = []) => {
  if (!Array.isArray(products)) return [];

  return products
    .map((item) => ({
      product: getId(item.product),

      quantity: Number(item.quantity || 0),
    }))
    .filter(
      (item) =>
        item.product &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    )
    .sort((a, b) =>
      a.product.localeCompare(b.product)
    );
};

/* ==========================================
   COMPARAR PRODUCTOS
========================================== */

const sameProduct = (a, b) => {
  return (
    getId(a._id) === getId(b._id) &&

    JSON.stringify(
      normalizeModifiers(a.selectedModifiers)
    ) ===
      JSON.stringify(
        normalizeModifiers(b.selectedModifiers)
      ) &&

    JSON.stringify(
      normalizeSelections(a.promoSelections)
    ) ===
      JSON.stringify(
        normalizeSelections(b.promoSelections)
      ) &&

    JSON.stringify(
      normalizeIncludedProducts(a.includedProducts)
    ) ===
      JSON.stringify(
        normalizeIncludedProducts(b.includedProducts)
      ) &&

    Number(a.price || 0) === Number(b.price || 0)
  );
};

/* ==========================================
   CART PROVIDER
========================================== */

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  /* ==========================================
     AGREGAR PRODUCTO
  ========================================== */

  const addToCart = (product) => {
    if (!product || !getId(product._id)) {
      console.error("Producto inválido");
      return;
    }

    const quantityToAdd = Math.max(
      1,
      Number(product.quantity) || 1
    );

    setCart((previousCart) => {
      const exists = previousCart.some((item) =>
        sameProduct(item, product)
      );

      if (exists) {
        return previousCart.map((item) =>
          sameProduct(item, product)
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) +
                  quantityToAdd,
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

  /* ==========================================
     ELIMINAR PRODUCTO
  ========================================== */

  const removeFromCart = (index) => {
    setCart((previousCart) =>
      previousCart.filter((_, i) => i !== index)
    );
  };

  /* ==========================================
     ACTUALIZAR CANTIDAD
  ========================================== */

  const updateQuantity = (index, quantity) => {
    const newQuantity = Number(quantity);

    if (
      !Number.isInteger(newQuantity) ||
      newQuantity < 1
    ) {
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  };

  /* ==========================================
     ACTUALIZAR UN PRODUCTO COMPLETO
     SIN PERDER SU CONFIGURACIÓN
  ========================================== */

  const updateCartItem = (index, updatedProduct) => {
    setCart((previousCart) =>
      previousCart.map((item, i) =>
        i === index
          ? {
              ...item,
              ...updatedProduct,
              quantity: item.quantity,
            }
          : item
      )
    );
  };

  /* ==========================================
     VACIAR CARRITO
  ========================================== */

  const clearCart = () => {
    setCart([]);
  };

  /* ==========================================
     CANTIDAD TOTAL
  ========================================== */

  const cartQuantity = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /* ==========================================
     TOTAL DEL CARRITO
  ========================================== */

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /* ==========================================
     VALORES DEL CONTEXTO
  ========================================== */

  return (
    <CartContext.Provider
      value={{
        cart,

        addToCart,

        removeFromCart,

        updateQuantity,

        updateCartItem,

        clearCart,

        cartQuantity,

        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/* ==========================================
   HOOK
========================================== */

export const useCart = () => useContext(CartContext);