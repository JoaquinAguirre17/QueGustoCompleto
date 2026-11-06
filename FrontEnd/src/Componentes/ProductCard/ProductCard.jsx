
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

import {
  FaEye,
  FaStar,
  FaTag
} from "react-icons/fa";

import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  if (!product) return null;

  /* =========================
     IMAGEN DEL PRODUCTO
  ========================= */

  const imageUrl = `${API_URL}/products/${product._id}/image`;
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
     VER DETALLE
  ========================= */

const handleViewDetail = () => {
  navigate(`/detalle/${product._id}`);
};

  /* =========================
     INTERFAZ
  ========================= */

  return (
    <article
      className="qg-card"
      onClick={handleViewDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleViewDetail();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Ver detalle de ${product.title}`}
    >

      {/* IMAGEN */}

      <div className="qg-card-image">

        <img
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackImage;
          }}
        />

        {/* DESTACADO */}

        {product.featured && (
          <span className="qg-featured">
            <FaStar />
            Destacado
          </span>
        )}

        {/* PROMOCIÓN */}

        {hasPromo && (
          <span className="qg-promo">
            <FaTag />
            Oferta
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
            type="button"
            className="qg-add-btn"
            onClick={(event) => {
              event.stopPropagation();
              handleViewDetail();
            }}
          >
            <FaEye />
            Ver detalle
          </button>

        </div>

      </div>

    </article>
  );
};

export default ProductCard;
