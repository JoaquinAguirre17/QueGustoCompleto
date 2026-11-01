
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API_URL } from "../../config/api";
import "./DetalleProducto.css";

const API = API_URL.replace(/\/$/, "");

const getProductImage = (product) => {
  if (!product) return "";

  const image = product.image;
  const id = product._id ?? product.id;

  // Imagen guardada como URL.
  if (typeof image === "string" && image.trim()) {
    return image;
  }

  if (image?.url) {
    return image.url;
  }

  // Imagen guardada como Buffer en MongoDB.
  if (
    image?.source === "mongo" ||
    image?.contentType ||
    image?.data ||
    image?.existing
  ) {
    return id ? `${API}/products/${id}/image` : "";
  }

  // Compatibilidad con productos que utilizan images[].
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];

    if (typeof firstImage === "string") return firstImage;
    if (firstImage?.url) return firstImage.url;
  }

  return "";
};

const formatPrice = (price) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);

const getBasePrice = (product) => {
  const normalPrice = Number(product?.price ?? 0);
  const promoPrice = Number(product?.promoPrice ?? 0);

  if (product?.isPromo && promoPrice > 0) {
    return promoPrice;
  }

  return normalPrice;
};

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);

  // Obtener el producto desde MongoDB.
  useEffect(() => {
    const controller = new AbortController();

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        let foundProduct = null;

        // Primero intentamos obtener el producto por ID.
        const response = await fetch(`${API}/products/${id}`, {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();

          foundProduct =
            data.product ??
            data.data ??
            data;
        } else {
          // Si no existe el endpoint individual, buscamos en el listado.
          const listResponse = await fetch(`${API}/products`, {
            signal: controller.signal,
          });

          if (!listResponse.ok) {
            throw new Error("No se pudieron cargar los productos.");
          }

          const data = await listResponse.json();

          const products = Array.isArray(data)
            ? data
            : data.products ?? [];

          foundProduct = products.find(
            (item) => String(item._id ?? item.id) === String(id)
          );
        }

        if (!foundProduct || foundProduct.active === false) {
          throw new Error("No encontramos este producto.");
        }

        setProduct(foundProduct);
        setSelectedModifiers({});
        setQuantity(1);
        setImageError(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error cargando detalle:", err);
          setError(err.message || "No se pudo cargar el producto.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => controller.abort();
  }, [id]);

  const modifiers = useMemo(() => {
    return Array.isArray(product?.modifiers)
      ? product.modifiers.filter((group) => group.active !== false)
      : [];
  }, [product]);

  const basePrice = getBasePrice(product);

  // Calcula el costo adicional de las opciones seleccionadas.
  const modifiersPrice = useMemo(() => {
    return modifiers.reduce((total, group) => {
      const selected = selectedModifiers[group.name];

      if (!selected) return total;

      const selectedLabels = Array.isArray(selected)
        ? selected
        : [selected];

      const extra = (group.options || [])
        .filter((option) => selectedLabels.includes(option.label))
        .reduce((sum, option) => {
          return sum + Number(option.price || 0);
        }, 0);

      return total + extra;
    }, 0);
  }, [modifiers, selectedModifiers]);

  const unitPrice = basePrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  // Verifica que estén completos los modificadores obligatorios.
  const missingRequired = modifiers.some((group) => {
    const selected = selectedModifiers[group.name];

    const selectedCount = Array.isArray(selected)
      ? selected.length
      : selected
        ? 1
        : 0;

    const minimum = group.type === "multiple"
      ? Number(group.minSelect ?? (group.required ? 1 : 0))
      : group.required
        ? 1
        : 0;

    return selectedCount < minimum;
  });

  const handleModifierChange = (group, optionLabel, checked) => {
    setSelectedModifiers((previous) => {
      const updated = { ...previous };

      if (group.type === "multiple") {
        const current = Array.isArray(updated[group.name])
          ? updated[group.name]
          : [];

        let next;

        if (checked) {
          const max = Number(group.maxSelect || Infinity);

          if (current.length >= max) {
            return previous;
          }

          next = [...current, optionLabel];
        } else {
          next = current.filter((item) => item !== optionLabel);
        }

        if (next.length > 0) {
          updated[group.name] = next;
        } else {
          delete updated[group.name];
        }
      } else {
        if (updated[group.name] === optionLabel) {
          delete updated[group.name];
        } else {
          updated[group.name] = optionLabel;
        }
      }

      return updated;
    });

    setAdded(false);
  };

  const handleAddToCart = () => {
    if (!product || missingRequired) return;

    addToCart({
      ...product,
      price: unitPrice,
      quantity,
      selectedModifiers: { ...selectedModifiers },
    });

    setAdded(true);

    // Después de agregar, llevamos al carrito.
    navigate("/cart");
  };

  if (loading) {
    return (
      <main className="qg-detail">
        <div className="qg-detail__message">
          Cargando producto...
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="qg-detail">
        <div className="qg-detail__message qg-detail__message--error">
          <h2>¡Ups! No encontramos el producto</h2>
          <p>{error}</p>

          <button onClick={() => navigate("/productos")}>
            Volver al menú
          </button>
        </div>
      </main>
    );
  }

  const image = getProductImage(product);

  return (
    <main className="qg-detail">
      <button
        className="qg-detail__back"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <div className="qg-detail__container">
        {/* Imagen */}
        <div className="qg-detail__image-wrapper">
          {image && !imageError ? (
            <img
              className="qg-detail__image"
              src={image}
              alt={product.title}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="qg-detail__image-placeholder">
              🍽️
            </div>
          )}

          {product.isPromo && (
            <span className="qg-detail__promo">
              🔥 En promoción
            </span>
          )}
        </div>

        {/* Información */}
        <section className="qg-detail__content">
          <span className="qg-detail__category">
            {product.category || "Que Gusto"}
          </span>

          <h1>{product.title}</h1>

          <p className="qg-detail__description">
            {product.description || "Un producto preparado para disfrutar."}
          </p>

          <div className="qg-detail__price">
            {formatPrice(unitPrice)}
            <span> por unidad</span>
          </div>

          {/* Modificadores */}
          {modifiers.length > 0 && (
            <div className="qg-detail__modifiers">
              <h2>Personalizá tu pedido</h2>

              {modifiers.map((group, index) => {
                const selected = selectedModifiers[group.name];

                return (
                  <div
                    className="qg-detail__modifier-group"
                    key={`${group.name}-${index}`}
                  >
                    <div className="qg-detail__modifier-heading">
                      <h3>{group.name}</h3>

                      <span>
                        {group.required ? "Obligatorio" : "Opcional"}
                      </span>
                    </div>

                    {group.type === "multiple" && (
                      <p className="qg-detail__modifier-help">
                        Podés elegir hasta {group.maxSelect || "varias"} opciones.
                      </p>
                    )}

                    <div className="qg-detail__options">
                      {(group.options || [])
                        .filter((option) => option.active !== false)
                        .map((option, optionIndex) => {
                          const isSelected = Array.isArray(selected)
                            ? selected.includes(option.label)
                            : selected === option.label;

                          return (
                            <label
                              className={`qg-detail__option ${
                                isSelected ? "is-selected" : ""
                              }`}
                              key={`${option.label}-${optionIndex}`}
                            >
                              <input
                                type={
                                  group.type === "multiple"
                                    ? "checkbox"
                                    : "radio"
                                }
                                name={`modifier-${group.name}`}
                                checked={Boolean(isSelected)}
                                onChange={(event) =>
                                  handleModifierChange(
                                    group,
                                    option.label,
                                    event.target.checked
                                  )
                                }
                              />

                              <span>{option.label}</span>

                              {Number(option.price) > 0 && (
                                <strong>
                                  + {formatPrice(Number(option.price))}
                                </strong>
                              )}
                            </label>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cantidad */}
          <div className="qg-detail__quantity">
            <span>Cantidad</span>

            <div className="qg-detail__quantity-controls">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>

              <strong>{quantity}</strong>

              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Total y carrito */}
          <div className="qg-detail__summary">
            <span>Total del producto</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>

          <button
            className="qg-detail__add-button"
            onClick={handleAddToCart}
            disabled={missingRequired}
          >
            {missingRequired
              ? "Completá las opciones obligatorias"
              : "Agregar al carrito"}
          </button>

          <p className="qg-detail__note">
            Tu pedido se agregará al carrito para continuar con la compra.
          </p>
        </section>
      </div>
    </main>
  );
};

export default DetalleProducto;
