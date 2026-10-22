
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cart from "../cart/Cart";
import "./Home.css";

const API_URL = "http://localhost:3000/api";

const categories = [
  {
    id: "empanadas",
    name: "Empanadas",
    emoji: "🥟",
    description: "Clásicas, jugosas y recién hechas",
  },
  {
    id: "minutas",
    name: "Minutas",
    emoji: "🍟",
    description: "Sabores caseros para disfrutar",
  },
  {
    id: "pizzas",
    name: "Pizzas",
    emoji: "🍕",
    description: "Para compartir o darte un gusto",
  },
  {
    id: "hamburguesas",
    name: "Hamburguesas",
    emoji: "🍔",
    description: "Grandes, sabrosas e irresistibles",
  },
];

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.products)) return data.products;
  return [];
};

const getProductPrice = (product) => {
  const price = Number(product.price ?? product.pricing?.sale ?? product.pricing?.list ?? 0);
  return Number.isFinite(price) ? price : 0;
};

const getProductImage = (product) => {
  const image = product.image;

  if (typeof image === "string") return image;
  if (image?.url) return image.url;

  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    if (typeof firstImage === "string") return firstImage;
    if (firstImage?.url) return firstImage.url;
  }

  return "";
};

const isPromotion = (product) => {
  const tags = Array.isArray(product.tags)
    ? product.tags.map((tag) => String(tag).toLowerCase().trim())
    : [];

  return (
    product.isPromo === true ||
    product.promo === true ||
    tags.some((tag) => ["promo", "promos", "promoción", "promocion"].includes(tag))
  );
};

const formatPrice = (price) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);

const Home = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(false);

        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar los productos");
        }

        const data = await response.json();

        setProducts(
          normalizeProducts(data).filter(
            (product) => product.active !== false && product.status !== "archived"
          )
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error cargando productos:", error);
          setProductsError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => controller.abort();
  }, []);

  const featuredProducts = products
    .filter((product) => product.featured === true)
    .slice(0, 4);

  const promotionProducts = products
    .filter(isPromotion)
    .slice(0, 4);

  const openProduct = (product) => {
    const id = product._id ?? product.id;

    if (id) {
      navigate(`/detalle/${id}`);
    } else {
      navigate("/productos");
    }
  };

  const renderProductCard = (product, promotion = false) => {
    const image = getProductImage(product);
    const price = getProductPrice(product);

    return (
      <article
        className="qg-home__product-card"
        key={product._id ?? product.id ?? product.title}
      >
        <button
          type="button"
          className="qg-home__product-image"
          onClick={() => openProduct(product)}
          aria-label={`Ver ${product.title}`}
        >
          {image ? (
            <img src={image} alt={product.title} loading="lazy" />
          ) : (
            <span className="qg-home__product-placeholder">🍽️</span>
          )}

          {promotion && (
            <span className="qg-home__product-badge">
              ✨ En promoción
            </span>
          )}
        </button>

        <div className="qg-home__product-info">
          <span className="qg-home__product-category">
            {product.category || "Que Gusto"}
          </span>

          <h3>{product.title || "Producto"}</h3>

          {product.description && (
            <p>{product.description}</p>
          )}

          <div className="qg-home__product-footer">
            <strong>{formatPrice(price)}</strong>

            <button
              type="button"
              className="qg-home__product-button"
              onClick={() => openProduct(product)}
              aria-label={`Ver detalles de ${product.title}`}
            >
              Ver producto <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="qg-home">
      {/* HERO */}
      <section className="qg-home__hero">
        <div className="qg-home__hero-content">
          <span className="qg-home__eyebrow">
            🍗 HECHO CON GANAS, HECHO PARA VOS
          </span>

          <h1>
            Cuando tenés hambre,
            <span> Que Gusto.</span>
          </h1>

          <p>
            Empanadas, minutas, pizzas, sándwiches y hamburguesas.
            Tus favoritos, preparados para disfrutar.
          </p>

          <div className="qg-home__hero-actions">
            <button
              className="qg-home__button qg-home__button--primary"
              onClick={() => navigate("/productos")}
            >
              Ver menú <span aria-hidden="true">→</span>
            </button>

            <a className="qg-home__secondary-link" href="#categorias">
              Explorar categorías
            </a>
          </div>

          <div className="qg-home__hero-note">
            <span className="qg-home__status-dot" />
            <span>Elegí tus favoritos y hacé tu pedido</span>
          </div>
        </div>

        <div className="qg-home__hero-decoration" aria-hidden="true">
          <div className="qg-home__hero-circle">
            <span className="qg-home__hero-emoji">🍔</span>
            <span className="qg-home__floating qg-home__floating--one">🍕</span>
            <span className="qg-home__floating qg-home__floating--two">🍟</span>
            <span className="qg-home__floating qg-home__floating--three">🥟</span>
          </div>
          <span className="qg-home__hero-caption">
            Algo rico te está esperando
          </span>
        </div>
      </section>

      {/* CARRITO */}
      <section className="qg-home__cart">
        <Cart />
      </section>

      {/* PROMOCIONES */}
      <section className="qg-home__products-section qg-home__promotions">
        <div className="qg-home__section-heading">
          <div>
            <span className="qg-home__eyebrow">PARA APROVECHAR</span>
            <h2>Promos que tientan 🔥</h2>
            <p>Descubrí los productos que tenemos en promoción.</p>
          </div>

          <button
            className="qg-home__all-link"
            onClick={() => navigate("/productos")}
          >
            Ver menú completo →
          </button>
        </div>

        {loadingProducts ? (
          <p className="qg-home__products-message">Cargando promociones...</p>
        ) : productsError ? (
          <p className="qg-home__products-message">
            No pudimos cargar las promociones. Intentá nuevamente más tarde.
          </p>
        ) : promotionProducts.length > 0 ? (
          <div className="qg-home__product-grid">
            {promotionProducts.map((product) =>
              renderProductCard(product, true)
            )}
          </div>
        ) : (
          <div className="qg-home__empty-promotions">
            <span>🍕</span>
            <div>
              <h3>¡Pronto vas a encontrar promos acá!</h3>
              <p>
                Estamos preparando opciones para que disfrutes tus favoritos.
              </p>
            </div>
            <button
              className="qg-home__product-button"
              onClick={() => navigate("/productos")}
            >
              Explorar menú →
            </button>
          </div>
        )}
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="qg-home__products-section">
        <div className="qg-home__section-heading">
          <div>
            <span className="qg-home__eyebrow">LOS ELEGIDOS</span>
            <h2>Favoritos de Que Gusto ⭐</h2>
            <p>Una selección especial de nuestro menú.</p>
          </div>

          <button
            className="qg-home__all-link"
            onClick={() => navigate("/productos")}
          >
            Ver todos →
          </button>
        </div>

        {loadingProducts ? (
          <p className="qg-home__products-message">Cargando productos...</p>
        ) : productsError ? (
          <p className="qg-home__products-message">
            No pudimos cargar los productos destacados.
          </p>
        ) : featuredProducts.length > 0 ? (
          <div className="qg-home__product-grid">
            {featuredProducts.map((product) =>
              renderProductCard(product)
            )}
          </div>
        ) : (
          <div className="qg-home__empty-featured">
            <span>⭐</span>
            <p>
              Todavía no hay productos destacados. Podés elegirlos desde la
              administración del menú.
            </p>
          </div>
        )}
      </section>

      {/* CATEGORÍAS */}
      <section className="qg-home__categories" id="categorias">
        <div className="qg-home__section-heading">
          <div>
            <span className="qg-home__eyebrow">NUESTRO MENÚ</span>
            <h2>¿Qué se te antoja hoy?</h2>
            <p>Encontrá algo rico para cada momento.</p>
          </div>

          <button
            className="qg-home__all-link"
            onClick={() => navigate("/productos")}
          >
            Ver todo el menú →
          </button>
        </div>

        <div className="qg-home__category-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`qg-home__category-card qg-home__category-card--${category.id}`}
              onClick={() => navigate(`/productos/${category.id}`)}
            >
              <span className="qg-home__category-emoji" aria-hidden="true">
                {category.emoji}
              </span>

              <span className="qg-home__category-info">
                <strong>{category.name}</strong>
                <span>{category.description}</span>
              </span>

              <span className="qg-home__category-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* BANNER FINAL */}
      <section className="qg-home__bottom-banner">
        <div>
          <span className="qg-home__eyebrow">
            TU PRÓXIMA COMIDA FAVORITA
          </span>
          <h2>Hoy es un buen día para comer rico.</h2>
          <p>Recorré nuestro menú y elegí lo que más te guste.</p>
        </div>

        <button
          className="qg-home__button qg-home__button--light"
          onClick={() => navigate("/productos")}
        >
          Hacer mi pedido <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
};

export default Home;
