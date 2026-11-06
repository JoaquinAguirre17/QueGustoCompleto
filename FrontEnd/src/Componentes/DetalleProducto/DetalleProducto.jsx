
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API_URL } from "../../config/api";
import "./DetalleProducto.css";

const API = API_URL.replace(/\/+$/, "");

/* ==========================================
   UTILIDADES
========================================== */

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  return String(value._id || value.id || "");
};

const getProductImage = (product) => {
  if (!product) return "";

  const image = product.image;
  const id = getId(product);

  if (typeof image === "string" && image.trim()) {
    return image;
  }

  if (image?.url) {
    return image.url;
  }

  if (
    image?.source === "mongo" ||
    image?.contentType ||
    image?.data ||
    image?.existing
  ) {
    return id ? `${API}/products/${id}/image` : "";
  }

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
  }).format(Number(price) || 0);

const getBasePrice = (product) => {
  if (!product) return 0;

  const normalPrice = Number(product.price || 0);
  const promoPrice = Number(product.promoPrice || 0);

  if (
    product.isPromo === true &&
    Number.isFinite(promoPrice) &&
    promoPrice > 0
  ) {
    return promoPrice;
  }

  return normalPrice;
};

const getResponseProducts = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

/* ==========================================
   COMPONENTE
========================================== */

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  /* ==========================================
     ESTADOS
  ========================================== */

  const [product, setProduct] = useState(null);
  const [catalog, setCatalog] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [selectedModifiers, setSelectedModifiers] = useState({});

  // Cada índice representa una promoción independiente.
  // Ejemplo:
  // {
  //   0: { "Empanadas": { idCarne: 2 } },
  //   1: { "Empanadas": { idPollo: 1, idJyQ: 1 } }
  // }
  const [selectedPromoProducts, setSelectedPromoProducts] = useState({});

  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);

  /* ==========================================
     CARGAR PRODUCTO INDIVIDUAL
  ========================================== */

  useEffect(() => {
    const controller = new AbortController();

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const response = await fetch(`${API}/products/${id}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "El producto no existe o fue eliminado."
              : "No se pudo cargar el producto."
          );
        }

        const data = await response.json();

        const loadedProduct =
          data.product ||
          data.data?.product ||
          data.data ||
          data;

        if (!loadedProduct?._id) {
          throw new Error(
            "La respuesta del servidor no contiene un producto válido."
          );
        }

        setProduct(loadedProduct);
        setQuantity(1);
        setSelectedModifiers({});
        setSelectedPromoProducts({});
        setImageError(false);
        setAdded(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error cargando detalle:", err);
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (!id) {
      setError("No se recibió el identificador del producto.");
      setLoading(false);
      return () => controller.abort();
    }

    loadProduct();

    return () => controller.abort();
  }, [id]);

  /* ==========================================
     CARGAR CATÁLOGO PARA PROMOCIONES
  ========================================== */

  useEffect(() => {
    const controller = new AbortController();

    const loadCatalog = async () => {
      const config = product?.promoConfig;

      const needsCatalog =
        product?.isPromo === true &&
        config?.enabled === true &&
        (
          (
            Array.isArray(config.selectionGroups) &&
            config.selectionGroups.length > 0
          ) ||
          (
            Array.isArray(config.includedProducts) &&
            config.includedProducts.some((item) => {
              return (
                typeof item.product === "string" ||
                !item.product?.title
              );
            })
          )
        );

      if (!needsCatalog) {
        setCatalog([]);
        setLoadingCatalog(false);
        return;
      }

      try {
        setLoadingCatalog(true);
        setError("");

        const response = await fetch(`${API}/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar los productos de la promoción."
          );
        }

        const data = await response.json();
        const products = getResponseProducts(data);

        setCatalog(
          products.filter((item) => item.active !== false)
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error cargando catálogo:", err);
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCatalog(false);
        }
      }
    };

    loadCatalog();

    return () => controller.abort();
  }, [product]);

  /* ==========================================
     MODIFICADORES
  ========================================== */

  const modifiers = useMemo(() => {
    return Array.isArray(product?.modifiers)
      ? product.modifiers.filter(
          (group) => group.active !== false
        )
      : [];
  }, [product]);

  /* ==========================================
     PRECIO BASE
  ========================================== */

  const basePrice = getBasePrice(product);

  /* ==========================================
     PRECIO DE MODIFICADORES
  ========================================== */

  const modifiersPrice = useMemo(() => {
    return modifiers.reduce((total, group) => {
      const selected = selectedModifiers[group.name];

      if (!selected) return total;

      const selectedLabels = Array.isArray(selected)
        ? selected
        : [selected];

      const extra = (group.options || [])
        .filter(
          (option) =>
            option.active !== false &&
            selectedLabels.includes(option.label)
        )
        .reduce(
          (sum, option) =>
            sum + Number(option.price || 0),
          0
        );

      return total + extra;
    }, 0);
  }, [modifiers, selectedModifiers]);

  /* ==========================================
     CONFIGURACIÓN DE PROMOCIÓN
  ========================================== */

  const promoConfig = product?.promoConfig;

  const isConfigurablePromo =
    product?.isPromo === true &&
    promoConfig?.enabled === true;

  const promoGroups = useMemo(() => {
    if (
      !isConfigurablePromo ||
      !Array.isArray(promoConfig?.selectionGroups)
    ) {
      return [];
    }

    return promoConfig.selectionGroups;
  }, [isConfigurablePromo, promoConfig]);

  /* ==========================================
     PRODUCTOS INCLUIDOS
  ========================================== */

  const includedProducts = useMemo(() => {
    if (
      !isConfigurablePromo ||
      !Array.isArray(promoConfig?.includedProducts)
    ) {
      return [];
    }

    return promoConfig.includedProducts
      .map((included) => {
        const productId = getId(included.product);

        const catalogProduct =
          catalog.find(
            (item) => getId(item) === productId
          ) ||
          (
            typeof included.product === "object"
              ? included.product
              : null
          );

        return {
          product: productId,
          title:
            catalogProduct?.title ||
            included.title ||
            "Producto incluido",
          quantity: Number(included.quantity || 1),
        };
      })
      .filter(
        (item) => item.product && item.quantity > 0
      );
  }, [isConfigurablePromo, promoConfig, catalog]);

  /* ==========================================
     PRODUCTOS PERMITIDOS POR GRUPO
  ========================================== */

  const getAllowedProducts = (group) => {
    const allowedIds = (
      group.allowedProducts || []
    )
      .map(getId)
      .filter(Boolean);

    return catalog.filter((item) =>
      allowedIds.includes(getId(item))
    );
  };

  /* ==========================================
     CONTADORES POR PROMOCIÓN Y GRUPO
  ========================================== */

  const getGroupSelectedQuantity = (group, packIndex) => {
    const selected =
      selectedPromoProducts[packIndex]?.[group.name] || {};

    return Object.values(selected).reduce(
      (total, value) =>
        total + Number(value || 0),
      0
    );
  };

  const getGroupRemaining = (group, packIndex) => {
    return Math.max(
      0,
      Number(group.requiredQuantity || 0) -
        getGroupSelectedQuantity(group, packIndex)
    );
  };

  const isPackComplete = (packIndex) => {
    return promoGroups.every((group) => {
      return (
        getGroupSelectedQuantity(group, packIndex) ===
        Number(group.requiredQuantity || 0)
      );
    });
  };

  const promoComplete = useMemo(() => {
    if (!isConfigurablePromo) return true;

    return Array.from(
      { length: quantity },
      (_, index) => index
    ).every((packIndex) => isPackComplete(packIndex));
  }, [
    isConfigurablePromo,
    quantity,
    promoGroups,
    selectedPromoProducts,
  ]);

  /* ==========================================
     MODIFICADORES OBLIGATORIOS
  ========================================== */

  const missingModifiers = modifiers.some((group) => {
    const selected = selectedModifiers[group.name];

    const selectedCount = Array.isArray(selected)
      ? selected.length
      : selected
        ? 1
        : 0;

    const minimum =
      group.type === "multiple"
        ? Number(
            group.minSelect ?? (group.required ? 1 : 0)
          )
        : group.required
          ? 1
          : 0;

    const maximum =
      group.type === "multiple"
        ? Number(group.maxSelect || Infinity)
        : 1;

    return (
      selectedCount < minimum ||
      selectedCount > maximum
    );
  });

  const missingPromo =
    isConfigurablePromo && !promoComplete;

  const missingRequired =
    missingModifiers || missingPromo;

  /* ==========================================
     PRECIO FINAL
  ========================================== */

  const unitPrice = basePrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  /* ==========================================
     CAMBIAR MODIFICADORES
  ========================================== */

  const handleModifierChange = (
    group,
    optionLabel,
    checked
  ) => {
    setSelectedModifiers((previous) => {
      const updated = { ...previous };

      if (group.type === "multiple") {
        const current = Array.isArray(updated[group.name])
          ? updated[group.name]
          : [];

        let next;

        if (checked) {
          const max = Number(
            group.maxSelect || Infinity
          );

          if (current.length >= max) {
            return previous;
          }

          next = [...current, optionLabel];
        } else {
          next = current.filter(
            (item) => item !== optionLabel
          );
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

  /* ==========================================
     CAMBIAR CANTIDAD DE PRODUCTOS DE PROMOCIÓN
  ========================================== */

  const handlePromoProductChange = (
    packIndex,
    group,
    productId,
    difference
  ) => {
    setSelectedPromoProducts((previous) => {
      const currentPack = {
        ...(previous[packIndex] || {}),
      };

      const currentGroup = {
        ...(currentPack[group.name] || {}),
      };

      const currentQuantity = Number(
        currentGroup[productId] || 0
      );

      const groupSelected = Object.values(
        currentGroup
      ).reduce(
        (total, value) =>
          total + Number(value || 0),
        0
      );

      const required = Number(
        group.requiredQuantity || 0
      );

      const nextQuantity =
        currentQuantity + difference;

      if (nextQuantity < 0) return previous;

      if (
        difference > 0 &&
        groupSelected >= required
      ) {
        return previous;
      }

      if (nextQuantity === 0) {
        delete currentGroup[productId];
      } else {
        currentGroup[productId] = nextQuantity;
      }

      currentPack[group.name] = currentGroup;

      return {
        ...previous,
        [packIndex]: currentPack,
      };
    });

    setAdded(false);
  };

  /* ==========================================
     CONSTRUIR SELECCIONES PARA EL CARRITO
     SE MANTIENE group + products
  ========================================== */

  const buildPromoSelections = () => {
    if (!isConfigurablePromo) return [];

    const selections = [];

    for (let packIndex = 0; packIndex < quantity; packIndex++) {
      promoGroups.forEach((group) => {
        const selected =
          selectedPromoProducts[packIndex]?.[group.name] || {};

        selections.push({
          // Dato adicional para identificar cada promoción.
          packIndex: packIndex + 1,

          // Se conservan las propiedades originales.
          group: group.name,

          products: Object.entries(selected)
            .filter(
              ([, selectedQuantity]) =>
                Number(selectedQuantity) > 0
            )
            .map(([productId, selectedQuantity]) => {
              const selectedProduct = catalog.find(
                (item) => getId(item) === productId
              );

              return {
                product: productId,
                title:
                  selectedProduct?.title ||
                  "Producto seleccionado",
                quantity: Number(selectedQuantity),
              };
            }),
        });
      });
    }

    return selections;
  };

  /* ==========================================
     AGREGAR AL CARRITO
  ========================================== */

  const handleAddToCart = () => {
    if (
      !product ||
      missingRequired ||
      loadingCatalog
    ) {
      return;
    }

    if (
      isConfigurablePromo &&
      !promoComplete
    ) {
      alert(
        "Completá todas las selecciones de cada promoción."
      );
      return;
    }

    const promoSelections = buildPromoSelections();

    addToCart({
      ...product,

      price: unitPrice,
      quantity,

      selectedModifiers: {
        ...selectedModifiers,
      },

      promoSelections,

      includedProducts: includedProducts.map(
        (item) => ({ ...item })
      ),
    });

    setAdded(true);
    navigate("/cart");
  };

  /* ==========================================
     CARGANDO
  ========================================== */

  if (loading) {
    return (
      <main className="qg-detail">
        <div className="qg-detail__message">
          Cargando producto...
        </div>
      </main>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error || !product) {
    return (
      <main className="qg-detail">
        <div className="qg-detail__message qg-detail__message--error">
          <h2>¡Ups! No encontramos el producto</h2>

          <p>
            {error || "No se pudo cargar el producto."}
          </p>

          <button
            onClick={() => navigate("/productos")}
          >
            Volver al menú
          </button>
        </div>
      </main>
    );
  }

  const image = getProductImage(product);

  /* ==========================================
     INTERFAZ
  ========================================== */

  return (
    <main className="qg-detail">

      <button
        className="qg-detail__back"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <div className="qg-detail__container">

        {/* IMAGEN */}

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

        {/* INFORMACIÓN */}

        <section className="qg-detail__content">

          <span className="qg-detail__category">
            {product.category || "Que Gusto"}
          </span>

          <h1>{product.title}</h1>

          <p className="qg-detail__description">
            {product.description ||
              "Un producto preparado para disfrutar."}
          </p>

          <div className="qg-detail__price">
            {formatPrice(unitPrice)}
            <span> por unidad</span>
          </div>

          {/* PRODUCTOS INCLUIDOS */}

          {isConfigurablePromo &&
            includedProducts.length > 0 && (
              <section className="qg-detail__promo-section">

                <div className="qg-detail__promo-title">
                  <h2>🎁 Esta promoción incluye</h2>
                </div>

                <div className="qg-detail__included-list">

                  {includedProducts.map((item) => (
                    <div
                      className="qg-detail__included-item"
                      key={item.product}
                    >
                      <span>{item.title}</span>
                      <strong>
                        x {item.quantity}
                      </strong>
                    </div>
                  ))}

                </div>
              </section>
            )}

          {/* GRUPOS CONFIGURABLES */}

          {isConfigurablePromo &&
            promoGroups.length > 0 && (
              <section className="qg-detail__promo-section">

                <div className="qg-detail__promo-title">
                  <h2>🍕 Elegí tus productos</h2>

                  <p>
                    Cada promoción se configura por separado.
                    Podés elegir combinaciones diferentes.
                  </p>
                </div>

                {loadingCatalog ? (
                  <p className="qg-detail__loading">
                    Cargando opciones...
                  </p>
                ) : (
                  Array.from(
                    { length: quantity },
                    (_, packIndex) => (
                      <div
                        className="qg-detail__promo-pack"
                        key={packIndex}
                      >

                        <div className="qg-detail__promo-pack-heading">
                          <h3>
                            Promoción {packIndex + 1}
                          </h3>

                          <span
                            className={
                              isPackComplete(packIndex)
                                ? "is-complete"
                                : ""
                            }
                          >
                            {isPackComplete(packIndex)
                              ? "Completa"
                              : "Pendiente"}
                          </span>
                        </div>

                        {promoGroups.map((group, index) => {
                          const allowedProducts =
                            getAllowedProducts(group);

                          const selectedQuantity =
                            getGroupSelectedQuantity(
                              group,
                              packIndex
                            );

                          const remaining =
                            getGroupRemaining(
                              group,
                              packIndex
                            );

                          const required = Number(
                            group.requiredQuantity || 0
                          );

                          return (
                            <div
                              className="qg-detail__promo-group"
                              key={`${packIndex}-${group.name}-${index}`}
                            >

                              <div className="qg-detail__promo-group-heading">

                                <div>
                                  <h3>{group.name}</h3>

                                  {group.description && (
                                    <p>{group.description}</p>
                                  )}
                                </div>

                                <span
                                  className={
                                    selectedQuantity === required
                                      ? "is-complete"
                                      : ""
                                  }
                                >
                                  {selectedQuantity}/{required}
                                </span>

                              </div>

                              <div className="qg-detail__progress">
                                <div
                                  className="qg-detail__progress-bar"
                                  style={{
                                    width: `${
                                      required > 0
                                        ? Math.min(
                                            100,
                                            (selectedQuantity / required) * 100
                                          )
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>

                              <p className="qg-detail__remaining">
                                {remaining > 0
                                  ? `Te faltan ${remaining} unidad(es) por elegir`
                                  : "¡Grupo completo!"}
                              </p>

                              {allowedProducts.length === 0 ? (
                                <p className="qg-detail__empty">
                                  No hay productos disponibles para este grupo.
                                </p>
                              ) : (
                                <div className="qg-detail__promo-products">

                                  {allowedProducts.map((option) => {
                                    const optionId = getId(option);

                                    const selected = Number(
                                      selectedPromoProducts[
                                        packIndex
                                      ]?.[group.name]?.[optionId] || 0
                                    );

                                    return (
                                      <div
                                        className="qg-detail__promo-product"
                                        key={optionId}
                                      >

                                        <div className="qg-detail__promo-product-info">
                                          <strong>
                                            {option.title}
                                          </strong>

                                          {option.description && (
                                            <small>
                                              {option.description}
                                            </small>
                                          )}
                                        </div>

                                        <div className="qg-detail__promo-controls">

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePromoProductChange(
                                                packIndex,
                                                group,
                                                optionId,
                                                -1
                                              )
                                            }
                                            disabled={selected <= 0}
                                            aria-label={`Quitar ${option.title}`}
                                          >
                                            −
                                          </button>

                                          <strong>
                                            {selected}
                                          </strong>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePromoProductChange(
                                                packIndex,
                                                group,
                                                optionId,
                                                1
                                              )
                                            }
                                            disabled={remaining <= 0}
                                            aria-label={`Agregar ${option.title}`}
                                          >
                                            +
                                          </button>

                                        </div>
                                      </div>
                                    );
                                  })}

                                </div>
                              )}

                            </div>
                          );
                        })}

                      </div>
                    )
                  )
                )}

              </section>
            )}

          {/* MODIFICADORES NORMALES */}

          {modifiers.length > 0 && (
            <div className="qg-detail__modifiers">

              <h2>Personalizá tu pedido</h2>

              {modifiers.map((group, index) => {
                const selected =
                  selectedModifiers[group.name];

                return (
                  <div
                    className="qg-detail__modifier-group"
                    key={`${group.name}-${index}`}
                  >

                    <div className="qg-detail__modifier-heading">

                      <h3>{group.name}</h3>

                      <span>
                        {group.required
                          ? "Obligatorio"
                          : "Opcional"}
                      </span>

                    </div>

                    {group.type === "multiple" && (
                      <p className="qg-detail__modifier-help">
                        Podés elegir hasta{" "}
                        {group.maxSelect || "varias"} opciones.
                      </p>
                    )}

                    <div className="qg-detail__options">

                      {(group.options || [])
                        .filter(
                          (option) =>
                            option.active !== false
                        )
                        .map((option, optionIndex) => {
                          const isSelected =
                            Array.isArray(selected)
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
                                  + {formatPrice(
                                    Number(option.price)
                                  )}
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

          {/* CANTIDAD */}

          <div className="qg-detail__quantity">

            <span>Cantidad de promociones</span>

            <div className="qg-detail__quantity-controls">

              <button
                type="button"
                onClick={() => {
                  setQuantity((value) =>
                    Math.max(1, value - 1)
                  );

                  setSelectedPromoProducts((previous) => {
                    const updated = { ...previous };
                    delete updated[quantity - 1];
                    return updated;
                  });
                }}
                disabled={quantity <= 1}
              >
                −
              </button>

              <strong>{quantity}</strong>

              <button
                type="button"
                onClick={() => {
                  setQuantity((value) => value + 1);
                }}
              >
                +
              </button>

            </div>

          </div>

          {/* RESUMEN */}

          <div className="qg-detail__summary">

            <span>Total del producto</span>

            <strong>
              {formatPrice(totalPrice)}
            </strong>

          </div>

          {/* BOTÓN */}

          <button
            className="qg-detail__add-button"
            onClick={handleAddToCart}
            disabled={
              missingRequired ||
              loadingCatalog
            }
          >
            {loadingCatalog
              ? "Cargando opciones..."
              : missingPromo
                ? "Completá cada promoción"
                : missingModifiers
                  ? "Completá las opciones obligatorias"
                  : "Agregar al carrito"}
          </button>

          <p className="qg-detail__note">
            Tu pedido se agregará al carrito para continuar
            con la compra.
          </p>

        </section>

      </div>

    </main>
  );
};

export default DetalleProducto;
