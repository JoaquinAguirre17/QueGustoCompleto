import { useEffect, useState } from "react";
import axios from "axios";
import "./Menu.css";

const API = "http://localhost:3000/api";

const Menu = () => {
  /* ==================================================
     ESTADOS INICIALES
  ================================================== */

  const emptyProduct = {
    title: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    image: "",
    stock: "",
    useStock: false,
    active: true,
    featured: false,
  };

  const emptyModifier = {
    name: "",
    type: "single",
    required: false,
    minSelect: 0,
    maxSelect: 1,
    options: [],
  };

  const emptyOption = {
    label: "",
    price: "",
  };

  /* ==================================================
     ESTADOS
  ================================================== */

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(emptyProduct);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showModifierModal, setShowModifierModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [modifier, setModifier] =
    useState(emptyModifier);

  const [option, setOption] =
    useState(emptyOption);

  /* ==================================================
     CARGAR PRODUCTOS
  ================================================== */

  useEffect(() => {
    getProducts();
  }, []);

  const getProducts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API}/products`
      );

      setProducts(
        res.data.products || res.data
      );
    } catch (error) {
      console.error(error);

      alert(
        "❌ Error cargando productos"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==================================================
     MANEJO FORMULARIO PRODUCTO
  ================================================== */

  const handleProductChange = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ==================================================
     ABRIR MODAL NUEVO PRODUCTO
  ================================================== */

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setShowProductModal(true);
  };

  /* ==================================================
     ABRIR MODAL EDITAR PRODUCTO
  ================================================== */

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      title: product.title || "",
      description: product.description || "",
      category: product.category || "",
      price: product.price ?? "",
      cost: product.cost ?? "",
      image: product.image || "",
      stock: product.stock ?? "",
      useStock: product.useStock || false,
      active:
        product.active === undefined
          ? true
          : product.active,
      featured: product.featured || false,
    });

    setShowProductModal(true);
  };

  /* ==================================================
     GUARDAR PRODUCTO
  ================================================== */

  const saveProduct = async (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      form.price === ""
    ) {
      alert(
        "⚠️ Completá nombre, categoría y precio"
      );

      return;
    }

    const data = {
      ...form,

      price: Number(form.price),

      cost:
        form.cost === ""
          ? 0
          : Number(form.cost),

      stock:
        form.useStock && form.stock !== ""
          ? Number(form.stock)
          : 0,
    };

    try {
      /* EDITAR */

      if (editingProduct) {
        const res = await axios.put(
          `${API}/products/${editingProduct._id}`,
          data
        );

        setProducts((prev) =>
          prev.map((product) =>
            product._id === editingProduct._id
              ? res.data.product
              : product
          )
        );

        alert(
          "✅ Producto actualizado correctamente"
        );
      }

      /* CREAR */

      else {
        const res = await axios.post(
          `${API}/products`,
          data
        );

        setProducts((prev) => [
          ...prev,
          res.data.product,
        ]);

        alert(
          "✅ Producto creado correctamente"
        );
      }

      closeProductModal();

    } catch (error) {
      console.error(error);

      alert(
        "❌ Error guardando producto"
      );
    }
  };

  /* ==================================================
     CERRAR MODAL PRODUCTO
  ================================================== */

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setForm(emptyProduct);
  };

  /* ==================================================
     ELIMINAR PRODUCTO
  ================================================== */

  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este producto?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API}/products/${id}`
      );

      setProducts((prev) =>
        prev.filter(
          (product) => product._id !== id
        )
      );

      alert(
        "🗑 Producto eliminado correctamente"
      );
    } catch (error) {
      console.error(error);

      alert(
        "❌ Error eliminando producto"
      );
    }
  };

  /* ==================================================
     MODAL MODIFICADORES
  ================================================== */

  const openModifierModal = (product) => {
    setSelectedProduct(product);

    setModifier(emptyModifier);

    setOption(emptyOption);

    setShowModifierModal(true);
  };

  const closeModifierModal = () => {
    setShowModifierModal(false);

    setSelectedProduct(null);

    setModifier(emptyModifier);

    setOption(emptyOption);
  };

  /* ==================================================
     AGREGAR OPCIÓN
  ================================================== */

  const addOption = () => {
    if (!option.label.trim()) {
      alert(
        "⚠️ Ingresá el nombre de la opción"
      );

      return;
    }

    setModifier((prev) => ({
      ...prev,

      options: [
        ...prev.options,
        {
          label: option.label.trim(),

          price:
            option.price === ""
              ? 0
              : Number(option.price),

          active: true,
        },
      ],
    }));

    setOption(emptyOption);
  };

  /* ==================================================
     ELIMINAR OPCIÓN NUEVA
  ================================================== */

  const removeNewOption = (index) => {
    setModifier((prev) => ({
      ...prev,

      options: prev.options.filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* ==================================================
     GUARDAR MODIFICADOR
  ================================================== */

  const saveModifier = async () => {
    if (!modifier.name.trim()) {
      alert(
        "⚠️ Ingresá el nombre del modificador"
      );

      return;
    }

    if (modifier.options.length === 0) {
      alert(
        "⚠️ Agregá al menos una opción"
      );

      return;
    }

    try {
      const modifiers = [
        ...(selectedProduct.modifiers || []),
        modifier,
      ];

      const res = await axios.put(
        `${API}/products/${selectedProduct._id}`,
        {
          modifiers,
        }
      );

      setProducts((prev) =>
        prev.map((product) =>
          product._id === selectedProduct._id
            ? res.data.product
            : product
        )
      );

      setSelectedProduct(
        res.data.product
      );

      setModifier(emptyModifier);

      setOption(emptyOption);

      alert(
        "✅ Modificador agregado correctamente"
      );

    } catch (error) {
      console.error(error);

      alert(
        "❌ Error guardando modificador"
      );
    }
  };

  /* ==================================================
     ELIMINAR MODIFICADOR EXISTENTE
  ================================================== */

  const deleteModifier = async (
    modifierIndex
  ) => {
    if (
      !window.confirm(
        "¿Eliminar este grupo de opciones?"
      )
    ) {
      return;
    }

    try {
      const modifiers =
        selectedProduct.modifiers.filter(
          (_, index) =>
            index !== modifierIndex
        );

      const res = await axios.put(
        `${API}/products/${selectedProduct._id}`,
        {
          modifiers,
        }
      );

      setProducts((prev) =>
        prev.map((product) =>
          product._id === selectedProduct._id
            ? res.data.product
            : product
        )
      );

      setSelectedProduct(
        res.data.product
      );

    } catch (error) {
      console.error(error);

      alert(
        "❌ Error eliminando modificador"
      );
    }
  };

  /* ==================================================
     FORMATEAR PRECIO
  ================================================== */

  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      "es-AR",
      {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }
    ).format(price || 0);
  };

  /* ==================================================
     RENDER
  ================================================== */

  return (
    <div className="menu-container">

      {/* HEADER */}

      <div className="menu-header">

        <div>
          <span className="menu-label">
            PANEL DE ADMINISTRACIÓN
          </span>

          <h1>
            🍔 Administración del menú
          </h1>

          <p>
            Gestioná tus productos y opciones
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openCreateModal}
        >
          ➕ Nuevo producto
        </button>

      </div>


      {/* PRODUCTOS */}

      {loading ? (

        <div className="loading-box">
          <div className="loader"></div>

          <p>
            Cargando productos...
          </p>
        </div>

      ) : products.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            🍔
          </div>

          <h2>
            No hay productos
          </h2>

          <p>
            Creá tu primer producto para
            comenzar.
          </p>

          <button
            className="primary-btn"
            onClick={openCreateModal}
          >
            Crear producto
          </button>

        </div>

      ) : (

        <div className="products-grid">

          {products.map((product) => (

            <div
              className="product-card"
              key={product._id}
            >

              {/* IMAGEN */}

              <div className="product-image">

                {product.image ? (

                  <img
                    src={product.image}
                    alt={product.title}
                  />

                ) : (

                  <div className="no-image">
                    🍔
                  </div>

                )}

                <span
                  className={
                    product.active
                      ? "status active"
                      : "status inactive"
                  }
                >
                  {product.active
                    ? "Activo"
                    : "Inactivo"}
                </span>

              </div>


              {/* CONTENIDO */}

              <div className="product-content">

                <div className="product-top">

                  <span className="category-badge">
                    {product.category}
                  </span>

                  {product.featured && (
                    <span className="featured-badge">
                      ⭐ Destacado
                    </span>
                  )}

                </div>


                <h3>
                  {product.title}
                </h3>


                <p className="description">

                  {product.description ||
                    "Sin descripción"}

                </p>


                <div className="product-price">

                  {formatPrice(
                    product.price
                  )}

                </div>


                {/* STOCK */}

                {product.useStock && (

                  <div className="stock-info">

                    📦 Stock:
                    <strong>
                      {product.stock}
                    </strong>

                  </div>

                )}


                {/* MODIFICADORES */}

                {product.modifiers?.length > 0 && (

                  <div className="modifier-info">

                    🍟{" "}
                    {product.modifiers.length}{" "}
                    grupo(s) de opciones

                  </div>

                )}


                {/* ACCIONES */}

                <div className="product-actions">

                  <button
                    className="edit-btn"
                    onClick={() =>
                      openEditModal(product)
                    }
                  >
                    ✏️ Editar
                  </button>


                  <button
                    className="modifier-btn"
                    onClick={() =>
                      openModifierModal(
                        product
                      )
                    }
                  >
                    🍟 Opciones
                  </button>


                  <button
                    className="delete-btn"
                    onClick={() =>
                      deleteProduct(
                        product._id
                      )
                    }
                  >
                    🗑
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}


      {/* ==================================================
          MODAL PRODUCTO
      ================================================== */}

      {showProductModal && (

        <div
          className="modal-overlay"
          onClick={closeProductModal}
        >

          <div
            className="modal-box product-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span>
                  PRODUCTO
                </span>

                <h2>

                  {editingProduct
                    ? "✏️ Editar producto"
                    : "➕ Nuevo producto"}

                </h2>

              </div>


              <button
                className="close-btn"
                onClick={
                  closeProductModal
                }
              >
                ✕
              </button>

            </div>


            <form onSubmit={saveProduct}>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Nombre del producto
                  </label>

                  <input
                    placeholder="Ej: Milanesa napolitana"
                    value={form.title}
                    onChange={(e) =>
                      handleProductChange(
                        "title",
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Categoría
                  </label>

                  <input
                    placeholder="Ej: Milanesas"
                    value={form.category}
                    onChange={(e) =>
                      handleProductChange(
                        "category",
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group full-width">

                  <label>
                    Descripción
                  </label>

                  <textarea
                    placeholder="Descripción del producto"
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      handleProductChange(
                        "description",
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Precio de venta
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) =>
                      handleProductChange(
                        "price",
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Costo
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.cost}
                    onChange={(e) =>
                      handleProductChange(
                        "cost",
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group full-width">

                  <label>
                    URL de imagen
                  </label>

                  <input
                    placeholder="https://..."
                    value={form.image}
                    onChange={(e) =>
                      handleProductChange(
                        "image",
                        e.target.value
                      )
                    }
                  />

                </div>


                {form.image && (

                  <div className="image-preview">

                    <img
                      src={form.image}
                      alt="Vista previa"
                    />

                  </div>

                )}

              </div>


              {/* STOCK */}

              <div className="settings-section">

                <h3>
                  📦 Stock
                </h3>


                <label className="switch-row">

                  <input
                    type="checkbox"
                    checked={
                      form.useStock
                    }
                    onChange={(e) =>
                      handleProductChange(
                        "useStock",
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Controlar stock
                  </span>

                </label>


                {form.useStock && (

                  <div className="form-group stock-field">

                    <label>
                      Cantidad disponible
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) =>
                        handleProductChange(
                          "stock",
                          e.target.value
                        )
                      }
                    />

                  </div>

                )}

              </div>


              {/* CONFIGURACIÓN */}

              <div className="settings-section">

                <h3>
                  ⚙️ Configuración
                </h3>


                <div className="settings-options">

                  <label className="switch-row">

                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        handleProductChange(
                          "active",
                          e.target.checked
                        )
                      }
                    />

                    <span>
                      Producto activo
                    </span>

                  </label>


                  <label className="switch-row">

                    <input
                      type="checkbox"
                      checked={
                        form.featured
                      }
                      onChange={(e) =>
                        handleProductChange(
                          "featured",
                          e.target.checked
                        )
                      }
                    />

                    <span>
                      ⭐ Producto destacado
                    </span>

                  </label>

                </div>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeProductModal
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="primary-btn"
                >
                  💾{" "}

                  {editingProduct
                    ? "Guardar cambios"
                    : "Crear producto"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          MODAL MODIFICADORES
      ================================================== */}

      {showModifierModal &&
        selectedProduct && (

          <div
            className="modal-overlay"
            onClick={closeModifierModal}
          >

            <div
              className="modal-box modifier-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <span>
                    OPCIONES
                  </span>

                  <h2>
                    🍟 Modificadores
                  </h2>

                  <p>
                    {selectedProduct.title}
                  </p>

                </div>


                <button
                  className="close-btn"
                  onClick={
                    closeModifierModal
                  }
                >
                  ✕
                </button>

              </div>


              {/* NUEVO MODIFICADOR */}

              <div className="modifier-form">

                <div className="form-group">

                  <label>
                    Nombre del grupo
                  </label>

                  <input
                    placeholder="Ej: Elegí tu guarnición"
                    value={modifier.name}
                    onChange={(e) =>
                      setModifier(
                        (prev) => ({
                          ...prev,
                          name: e.target.value,
                        })
                      )
                    }
                  />

                </div>


                <div className="modifier-settings">

                  <div className="form-group">

                    <label>
                      Tipo
                    </label>

                    <select
                      value={modifier.type}
                      onChange={(e) =>
                        setModifier(
                          (prev) => ({
                            ...prev,
                            type: e.target.value,

                            maxSelect:
                              e.target.value ===
                              "single"
                                ? 1
                                : prev.maxSelect,
                          })
                        )
                      }
                    >

                      <option value="single">
                        Una opción
                      </option>

                      <option value="multiple">
                        Varias opciones
                      </option>

                    </select>

                  </div>


                  <label className="switch-row required-switch">

                    <input
                      type="checkbox"
                      checked={
                        modifier.required
                      }
                      onChange={(e) =>
                        setModifier(
                          (prev) => ({
                            ...prev,
                            required:
                              e.target.checked,
                          })
                        )
                      }
                    />

                    <span>
                      Obligatorio
                    </span>

                  </label>

                </div>


                {/* AGREGAR OPCIONES */}

                <div className="option-adder">

                  <div className="form-group">

                    <input
                      placeholder="Ej: Papas fritas"
                      value={option.label}
                      onChange={(e) =>
                        setOption(
                          (prev) => ({
                            ...prev,
                            label:
                              e.target.value,
                          })
                        )
                      }
                    />

                  </div>


                  <div className="form-group">

                    <input
                      type="number"
                      min="0"
                      placeholder="Precio extra"
                      value={option.price}
                      onChange={(e) =>
                        setOption(
                          (prev) => ({
                            ...prev,
                            price:
                              e.target.value,
                          })
                        )
                      }
                    />

                  </div>


                  <button
                    type="button"
                    className="add-btn"
                    onClick={addOption}
                  >
                    ➕
                  </button>

                </div>


                {/* OPCIONES NUEVAS */}

                {modifier.options.length > 0 && (

                  <div className="options-list">

                    {modifier.options.map(
                      (item, index) => (

                        <div
                          className="option-item"
                          key={index}
                        >

                          <span>
                            🍟 {item.label}
                          </span>

                          <div>

                            {item.price > 0 && (
                              <small>
                                +
                                {formatPrice(
                                  item.price
                                )}
                              </small>
                            )}

                            <button
                              onClick={() =>
                                removeNewOption(
                                  index
                                )
                              }
                            >
                              ✕
                            </button>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}


                <button
                  className="primary-btn save-modifier-btn"
                  onClick={saveModifier}
                >
                  💾 Guardar grupo
                </button>

              </div>


              {/* MODIFICADORES EXISTENTES */}

              {selectedProduct.modifiers
                ?.length > 0 && (

                <div className="existing-modifiers">

                  <h3>
                    Opciones actuales
                  </h3>


                  {selectedProduct.modifiers.map(
                    (currentModifier, index) => (

                      <div
                        className="existing-modifier"
                        key={index}
                      >

                        <div className="existing-header">

                          <div>

                            <strong>
                              {currentModifier.name}
                            </strong>

                            <span>
                              {currentModifier.type ===
                              "single"
                                ? "Selección única"
                                : "Selección múltiple"}
                            </span>

                          </div>


                          <button
                            className="delete-mini-btn"
                            onClick={() =>
                              deleteModifier(
                                index
                              )
                            }
                          >
                            🗑
                          </button>

                        </div>


                        <div className="existing-options">

                          {currentModifier.options.map(
                            (item, optionIndex) => (

                              <span
                                key={optionIndex}
                              >
                                {item.label}

                                {item.price > 0 &&
                                  ` +${formatPrice(
                                    item.price
                                  )}`}
                              </span>

                            )
                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        )}

    </div>
  );
};

export default Menu;