
import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { API_URL } from "../../config/api";

import {
  FaShoppingCart,
  FaStar,
  FaTag
} from "react-icons/fa";

import "./ProductCard.css";
import DetalleProducto from "../DetalleProducto/DetalleProducto";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const [open, setOpen] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState({});

  if (!product) return null;

  /* =========================
     MODIFICADORES
  ========================= */

  const modifiers = product.modifiers || [];

  const hasOptions = modifiers.some(
    (modifier) =>
      modifier.active !== false &&
      modifier.options?.some((option) => option.active !== false)
  );

  /* =========================
     IMAGEN LOCAL
  ========================= */

  const imageUrl = product.image?.data
    ? `${API_URL}/products/${product._id}/image`
    : `${API_URL}/products/${product._id}/image`;

  const fallbackImage = "/images/no-image.jpg";

  /* =========================
     PRECIO
  ========================= */

  const hasPromo =
    product.isPromo &&
    product.promoPrice !== null &&
    product.promoPrice !== undefined &&
    Number(product.promoPrice) > 0 &&
    Number(product.promoPrice) < Number(product.price);

  const finalPrice = hasPromo
    ? Number(product.promoPrice)
    : Number(product.price);

  /* =========================
     SELECCIONAR OPCIÓN
  ========================= */

  const selectOption = (name, value) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  /* =========================
     AGREGAR AL CARRITO
  ========================= */

  const handleAdd = () => {
    for (const modifier of modifiers) {
      if (modifier.active === false) continue;

      const activeOptions = (modifier.options || []).filter(
        (option) => option.active !== false
      );

      if (
        modifier.required &&
        activeOptions.length > 0 &&
        !selectedModifiers[modifier.name]
      ) {
        alert(`Elegí ${modifier.name}`);
        return;
      }
    }

    const productToCart = {
      ...product,
      price: finalPrice,
      originalPrice: hasPromo ? Number(product.price) : null,
      selectedModifiers
    };

    addToCart(productToCart);

    setOpen(false);
    setSelectedModifiers({});
  };

  /* =========================
     AGREGAR DIRECTAMENTE
  ========================= */

  const handleQuickAdd = () => {
    if (hasOptions) {
      setOpen(true);
      return;
    }

    addToCart({
      ...product,
      price: finalPrice,
      originalPrice: hasPromo ? Number(product.price) : null
    });
  };

  return (
    <>
      {/* =========================
          TARJETA DEL PRODUCTO
      ========================= */}

      <div className="qg-card">

        {/* IMAGEN */}

        <div className="qg-card-image">

          <img
            src={imageUrl}
            alt={product.title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackImage;
            }}
          />

          {/* DESTACADO */}

          {product.featured && (
            <span className="qg-featured">
              <FaStar /> Destacado
            </span>
          )}

          {/* PROMOCIÓN */}

          {hasPromo && (
            <span className="qg-promo">
              <FaTag /> Oferta
            </span>
          )}

        </div>

        {/* INFORMACIÓN */}

        <div className="qg-card-body">

          <span className="qg-category">
            {product.category}
          </span>

          <h3>{product.title}</h3>

          <p>
            {product.description || "Sin descripción"}
          </p>

          {/* PRECIO Y BOTÓN */}

          <div className="qg-card-footer">

            <div className="qg-price">

              {hasPromo && (
                <span className="qg-original-price">
                  ${Number(product.price).toLocaleString("es-AR")}
                </span>
              )}

              <span>
                ${finalPrice.toLocaleString("es-AR")}
              </span>

            </div>

            <button
              className="qg-add-btn"
              onClick={handleQuickAdd}
            >
              <DetalleProducto />
              Ver producto
            </button>

          </div>

        </div>

      </div>

      {/* =========================
          MODAL DE MODIFICADORES
      ========================= */}

      {open && (
        <div
          className="qg-modal-overlay"
          onClick={() => setOpen(false)}
        >

          <div
            className="qg-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>{product.title}</h2>

            <p>
              Elegí tus opciones
            </p>

            {/* MODIFICADORES */}

            {modifiers
              .filter((modifier) => modifier.active !== false)
              .map((modifier, index) => {

                const activeOptions = (modifier.options || []).filter(
                  (option) => option.active !== false
                );

                if (activeOptions.length === 0) return null;

                return (
                  <div
                    key={index}
                    className="qg-modifier"
                  >

                    <h3>
                      {modifier.name}
                      {modifier.required && " *"}
                    </h3>

                    {activeOptions.map((option, i) => (
                      <label
                        key={i}
                        className="qg-option"
                      >

                        <input
                          type="radio"
                          name={modifier.name}
                          checked={
                            selectedModifiers[modifier.name] ===
                            option.label
                          }
                          onChange={() =>
                            selectOption(
                              modifier.name,
                              option.label
                            )
                          }
                        />

                        <span>{option.label}</span>

                        {option.price > 0 && (
                          <span>
                            +${Number(option.price).toLocaleString("es-AR")}
                          </span>
                        )}

                      </label>
                    ))}

                  </div>
                );
              })}

            {/* BOTONES */}

            <div className="qg-modal-buttons">

              <button
                onClick={() => {
                  setOpen(false);
                  setSelectedModifiers({});
                }}
              >
                Cancelar
              </button>

              <button onClick={handleAdd}>
                Confirmar
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
};

export default ProductCard;
