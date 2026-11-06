
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
   OBTENER NOMBRE DEL PRODUCTO
========================================== */

const getProductTitle = (item) => {
  if (!item) return "";

  if (typeof item === "string") {
    return "";
  }

  return String(
    item.title ||
    item.name ||
    item.product?.title ||
    item.product?.name ||
    ""
  );
};

/* ==========================================
   NORMALIZAR SELECCIONES DE PROMOCIÓN

   Conservamos:
   - packIndex
   - group
   - product
   - title
   - quantity

   Cada pack mantiene sus propias selecciones.
========================================== */

const normalizeSelections = (selections = []) => {
  if (!Array.isArray(selections)) return [];

  return selections
    .map((group) => ({
      packIndex: Number(group.packIndex || 1),

      group: String(group.group || ""),

      products: (Array.isArray(group.products)
        ? group.products
        : []
      )
        .map((item) => ({
          product: getId(item.product),

          title: getProductTitle(item),

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
    .sort((a, b) => {
      if (a.packIndex !== b.packIndex) {
        return a.packIndex - b.packIndex;
      }

      return a.group.localeCompare(b.group);
    });
};

/* ==========================================
   NORMALIZAR PRODUCTOS INCLUIDOS

   Conservamos el nombre para mostrarlo
   correctamente en el carrito y checkout.
========================================== */

const normalizeIncludedProducts = (products = []) => {
  if (!Array.isArray(products)) return [];

  return products
    .map((item) => ({
      product: getId(item.product),

      title: getProductTitle(item),

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
   IDENTIFICAR PROMOCIONES CONFIGURABLES

   Estas promociones no se fusionan porque
   cada pack puede tener distintas selecciones.
========================================== */

const isConfigurablePromo = (product) => {
  return Boolean(
    product?.isPromo &&
    product?.promoConfig?.enabled
  );
};

/* ==========================================
   COMPARAR PRODUCTOS
========================================== */

const sameProduct = (a, b) => {
  return (
    getId(a._id || a.product) ===
      getId(b._id || b.product) &&

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

     Las promociones configurables se agregan
     como líneas independientes.

     Así cada promoción conserva sus propios
     productos seleccionados.
  ========================================== */

  const addToCart = (product) => {
    if (!product || !getId(product._id || product.product)) {
      console.error("Producto inválido");
      return;
    }

    const quantityToAdd = Math.max(
      1,
      Number(product.quantity) || 1
    );

    setCart((previousCart) => {
      // Promociones configurables.
      if (isConfigurablePromo(product)) {
        return [
          ...previousCart,
          {
            ...product,
            quantity: quantityToAdd,

            promoSelections: normalizeSelections(
              product.promoSelections
            ),

            includedProducts: normalizeIncludedProducts(
              product.includedProducts
            ),
          },
        ];
      }

      // Productos normales: buscar si ya existen.
      const exists = previousCart.some(
        (item) =>
          !isConfigurablePromo(item) &&
          sameProduct(item, product)
      );

      if (exists) {
        return previousCart.map((item) =>
          !isConfigurablePromo(item) &&
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

     No permitimos modificar directamente
     la cantidad de una promoción configurable.

     Para agregar otra, debe configurarse
     nuevamente desde el detalle.
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
      previousCart.map((item, i) => {
        if (i !== index) return item;

        if (isConfigurablePromo(item)) {
          return item;
        }

        return {
          ...item,
          quantity: newQuantity,
        };
      })
    );
  };

  /* ==========================================
     ACTUALIZAR UN PRODUCTO COMPLETO

     Conserva las configuraciones anteriores
     cuando no se envían nuevas selecciones.
  ========================================== */

  const updateCartItem = (index, updatedProduct) => {
    setCart((previousCart) =>
      previousCart.map((item, i) => {
        if (i !== index) return item;

        const updated = {
          ...item,
          ...updatedProduct,
          quantity: item.quantity,
        };

        if (updatedProduct.promoSelections !== undefined) {
          updated.promoSelections = normalizeSelections(
            updatedProduct.promoSelections
          );
        } else {
          updated.promoSelections = item.promoSelections || [];
        }

        if (updatedProduct.includedProducts !== undefined) {
          updated.includedProducts = normalizeIncludedProducts(
            updatedProduct.includedProducts
          );
        } else {
          updated.includedProducts = item.includedProducts || [];
        }

        return updated;
      })
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
