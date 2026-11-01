
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";

import "./Menu.css";
import { API_URL } from "../../../config/api";

const API = API_URL;

/* =========================================
   PRODUCTO VACÍO
========================================= */

const EMPTY_PRODUCT = {
  title: "",
  description: "",
  category: "",
  price: "",
  cost: "",
  stock: "",
  useStock: false,
  active: true,

  featured: false,
  isPromo: false,
  promoPrice: "",
};

/* =========================================
   MODIFICADORES Y OPCIONES
========================================= */

const EMPTY_MODIFIER = {
  name: "",
  type: "single",
  required: false,
  minSelect: 0,
  maxSelect: 1,
  options: [],
};

const EMPTY_OPTION = {
  label: "",
  price: "",
};

/* =========================================
   COMPONENTE MENU
========================================= */

const Menu = () => {

  /* =========================================
     ESTADOS PRINCIPALES
  ========================================= */

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ...EMPTY_PRODUCT,
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  /* =========================================
     ESTADOS DE IMÁGENES
  ========================================= */

  // Archivo seleccionado desde el dispositivo
  const [selectedImage, setSelectedImage] = useState(null);

  // Vista previa de la imagen
  const [imagePreview, setImagePreview] = useState("");

  // Referencia al input file
  const imageInputRef = useRef(null);

  /*
   * Liberar las URL temporales creadas para
   * las vistas previas y evitar fugas de memoria.
   */
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /* =========================================
     ESTADOS DE MODIFICADORES
  ========================================= */

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showModifierModal, setShowModifierModal] = useState(false);

  const [modifier, setModifier] = useState({
    ...EMPTY_MODIFIER,
  });

  const [option, setOption] = useState({
    ...EMPTY_OPTION,
  });

  /* =========================================
     ESTADOS DE FILTROS
  ========================================= */

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("Todas");

  const [statusFilter, setStatusFilter] = useState("Todos");

  /* =========================================
     FORMATEAR PRECIOS
  ========================================= */

  const formatPrice = (value) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  /* =========================================
     OBTENER URL DE IMAGEN LOCAL
  ========================================= */

  const getProductImageUrl = (product) => {
    /*
     * El backend utiliza:
     * .select("-image.data")
     *
     * Por eso seguimos recibiendo contentType,
     * pero no descargamos el Buffer.
     */

    if (!product?.image?.contentType) {
      return "";
    }

    return `${API}/products/${product._id}/image`;
  };

  /* =========================================
     CARGAR PRODUCTOS
  ========================================= */

  const getProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API}/products`
      );

      const data = response.data;

      setProducts(
        Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : []
      );

    } catch (err) {
      console.error(
        "Error cargando productos:",
        err
      );

      setError(
        "No se pudieron cargar los productos. Revisá la conexión con el servidor."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  /* =========================================
     CATEGORÍAS DISPONIBLES
  ========================================= */

  const categories = useMemo(
    () => [
      "Todas",
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ],
    [products]
  );

  /* =========================================
     FILTRAR PRODUCTOS
  ========================================= */

  const filteredProducts = useMemo(() => {

    return products.filter((product) => {

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        [
          product.title,
          product.description,
          product.category,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchText)
        );

      const matchesCategory =
        categoryFilter === "Todas" ||
        product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "Todos" ||
        (
          statusFilter === "Activos" &&
          product.active !== false
        ) ||
        (
          statusFilter === "Inactivos" &&
          product.active === false
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });

  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
  ]);

  /* =========================================
     ESTADÍSTICAS
  ========================================= */

  const stats = useMemo(
    () => ({
      total: products.length,

      active: products.filter(
        (product) => product.active !== false
      ).length,

      featured: products.filter(
        (product) => product.featured === true
      ).length,

      promos: products.filter(
        (product) => product.isPromo === true
      ).length,

      inactive: products.filter(
        (product) => product.active === false
      ).length,
    }),
    [products]
  );

  /* =========================================
     ACTUALIZAR FORMULARIO
  ========================================= */

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================
     SELECCIONAR IMAGEN LOCAL
  ========================================= */

  const handleImageChange = (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    // Validar formato
    if (!file.type.startsWith("image/")) {
      alert("Seleccioná un archivo de imagen válido.");

      event.target.value = "";
      return;
    }

    // Validar tamaño máximo: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar los 5 MB.");

      event.target.value = "";
      return;
    }

    // Guardar archivo para enviarlo a MongoDB
    setSelectedImage(file);

    // Crear vista previa temporal
    const preview = URL.createObjectURL(file);

    setImagePreview(preview);
  };

  /* =========================================
     LIMPIAR IMAGEN SELECCIONADA
  ========================================= */

  const clearSelectedImage = () => {

    setSelectedImage(null);

    /*
     * Si estamos editando, volvemos a mostrar
     * la imagen que ya estaba guardada.
     *
     * Si estamos creando, dejamos la vista vacía.
     */

    if (editingProduct) {
      setImagePreview(
        getProductImageUrl(editingProduct)
      );
    } else {
      setImagePreview("");
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  /* =========================================
     ABRIR MODAL PARA CREAR PRODUCTO
  ========================================= */

  const openCreateModal = () => {

    setEditingProduct(null);

    setForm({
      ...EMPTY_PRODUCT,
    });

    setSelectedImage(null);
    setImagePreview("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    setShowProductModal(true);
  };

  /* =========================================
     ABRIR MODAL PARA EDITAR PRODUCTO
  ========================================= */

  const openEditModal = (product) => {

    setEditingProduct(product);

    setForm({
      title: product.title || "",
      description: product.description || "",
      category: product.category || "",

      price: product.price ?? "",
      cost: product.cost ?? "",

      stock: product.stock ?? "",
      useStock: product.useStock ?? false,

      active: product.active !== false,

      featured: product.featured ?? false,
      isPromo: product.isPromo ?? false,
      promoPrice: product.promoPrice ?? "",
    });

    // No se descarga el Buffer de MongoDB
    setSelectedImage(null);

    // Mostrar imagen existente
    setImagePreview(
      getProductImageUrl(product)
    );

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    setShowProductModal(true);
  };

  /* =========================================
     CERRAR MODAL DE PRODUCTO
  ========================================= */

  const closeProductModal = () => {

    if (saving) return;

    setShowProductModal(false);

    setEditingProduct(null);

    setForm({
      ...EMPTY_PRODUCT,
    });

    setSelectedImage(null);
    setImagePreview("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  /* =========================================
     GUARDAR O ACTUALIZAR PRODUCTO
     Envía FormData para recibir imágenes
  ========================================= */

  const saveProduct = async (event) => {

    event.preventDefault();

    // Validar campos obligatorios
    if (
      !form.title.trim() ||
      !form.category.trim() ||
      form.price === ""
    ) {
      alert(
        "Completá el nombre, la categoría y el precio."
      );

      return;
    }

    // La imagen es obligatoria al crear
    if (!editingProduct && !selectedImage) {
      alert("Seleccioná una imagen para el producto.");

      return;
    }

    const price = Number(form.price);

    const cost =
      form.cost === ""
        ? 0
        : Number(form.cost);

    const stock = form.useStock
      ? Number(form.stock || 0)
      : 0;

    // Validar números
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      alert("Ingresá valores numéricos válidos.");

      return;
    }

    // Validar precio promocional
    let promoPrice = null;

    if (form.isPromo) {

      if (
        form.promoPrice === "" ||
        form.promoPrice === null
      ) {
        alert(
          "Ingresá el precio promocional del producto."
        );

        return;
      }

      promoPrice = Number(form.promoPrice);

      if (
        !Number.isFinite(promoPrice) ||
        promoPrice < 0 ||
        promoPrice >= price
      ) {
        alert(
          "El precio promocional debe ser válido y menor que el precio normal."
        );

        return;
      }
    }

    try {

      setSaving(true);

      /* =====================================
         CREAR FORMDATA
      ===================================== */

      const formData = new FormData();

      // Datos principales
      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "category",
        form.category.trim()
      );

      // Precios
      formData.append(
        "price",
        String(price)
      );

      formData.append(
        "cost",
        String(cost)
      );

      // Stock
      formData.append(
        "stock",
        String(stock)
      );

      formData.append(
        "useStock",
        String(Boolean(form.useStock))
      );

      // Configuración
      formData.append(
        "active",
        String(Boolean(form.active))
      );

      formData.append(
        "featured",
        String(Boolean(form.featured))
      );

      // Promociones
      formData.append(
        "isPromo",
        String(Boolean(form.isPromo))
      );

      formData.append(
        "promoPrice",
        form.isPromo
          ? String(promoPrice)
          : ""
      );

      // Modificadores existentes
      formData.append(
        "modifiers",
        JSON.stringify(
          editingProduct?.modifiers || []
        )
      );

      // Imagen local
      // En edición es opcional: si no se selecciona
      // una imagen nueva, se conserva la anterior.
      if (selectedImage) {
        formData.append(
          "image",
          selectedImage
        );
      }

      /* =====================================
         CREAR O ACTUALIZAR
      ===================================== */

      let response;

      if (editingProduct) {

        // Actualizar producto
        response = await axios.put(
          `${API}/products/${editingProduct._id}`,
          formData
        );

        const updated =
          response.data.product || response.data;

        setProducts((previous) =>
          previous.map((product) =>
            product._id === editingProduct._id
              ? updated
              : product
          )
        );

      } else {

        // Crear producto
        response = await axios.post(
          `${API}/products`,
          formData
        );

        const created =
          response.data.product || response.data;

        setProducts((previous) => [
          ...previous,
          created,
        ]);
      }

      // Cerrar y limpiar
      setShowProductModal(false);

      setEditingProduct(null);

      setForm({
        ...EMPTY_PRODUCT,
      });

      setSelectedImage(null);
      setImagePreview("");

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      alert(
        editingProduct
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente."
      );

    } catch (err) {

      console.error(
        "Error guardando producto:",
        err
      );

      alert(
        err.response?.data?.message ||
        "No se pudo guardar el producto."
      );

    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     ELIMINAR PRODUCTO
  ========================================= */

  const deleteProduct = async (product) => {

    const confirmed = window.confirm(
      `¿Querés eliminar "${product.title}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {

      await axios.delete(
        `${API}/products/${product._id}`
      );

      setProducts((previous) =>
        previous.filter(
          (item) => item._id !== product._id
        )
      );

    } catch (err) {

      console.error(
        "Error eliminando producto:",
        err
      );

      alert(
        err.response?.data?.message ||
        "No se pudo eliminar el producto."
      );
    }
  };

  /* =========================================
     ABRIR MODAL DE MODIFICADORES
  ========================================= */

  const openModifierModal = (product) => {

    setSelectedProduct(product);

    setModifier({
      ...EMPTY_MODIFIER,
      options: [],
    });

    setOption({
      ...EMPTY_OPTION,
    });

    setShowModifierModal(true);
  };

  /* =========================================
     CERRAR MODAL DE MODIFICADORES
  ========================================= */

  const closeModifierModal = () => {

    setShowModifierModal(false);

    setSelectedProduct(null);

    setModifier({
      ...EMPTY_MODIFIER,
      options: [],
    });

    setOption({
      ...EMPTY_OPTION,
    });
  };

  /* =========================================
     AGREGAR OPCIÓN A UN GRUPO
  ========================================= */

  const addOption = () => {

    if (!option.label.trim()) {
      alert("Ingresá el nombre de la opción.");

      return;
    }

    const price =
      option.price === ""
        ? 0
        : Number(option.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      alert("Ingresá un precio extra válido.");

      return;
    }

    setModifier((previous) => ({
      ...previous,

      options: [
        ...previous.options,
        {
          label: option.label.trim(),
          price,
          active: true,
        },
      ],
    }));

    setOption({
      ...EMPTY_OPTION,
    });
  };

  /* =========================================
     ELIMINAR OPCIÓN NUEVA
  ========================================= */

  const removeNewOption = (index) => {

    setModifier((previous) => ({
      ...previous,

      options: previous.options.filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* =========================================
     GUARDAR MODIFICADORES
  ========================================= */

  const saveModifiers = async (modifiers) => {

    if (!selectedProduct) return null;

    const response = await axios.put(
      `${API}/products/${selectedProduct._id}`,
      { modifiers }
    );

    const updated =
      response.data.product || response.data;

    setProducts((previous) =>
      previous.map((product) =>
        product._id === selectedProduct._id
          ? updated
          : product
      )
    );

    setSelectedProduct(updated);

    return updated;
  };

  /* =========================================
     CREAR GRUPO DE MODIFICADORES
  ========================================= */

  const saveModifier = async (event) => {

    event.preventDefault();

    if (!modifier.name.trim()) {
      alert("Ingresá el nombre del grupo.");

      return;
    }

    if (modifier.options.length === 0) {
      alert("Agregá al menos una opción.");

      return;
    }

    try {

      const modifiers = [
        ...(selectedProduct.modifiers || []),
        {
          ...modifier,
          name: modifier.name.trim(),
        },
      ];

      await saveModifiers(modifiers);

      setModifier({
        ...EMPTY_MODIFIER,
        options: [],
      });

      setOption({
        ...EMPTY_OPTION,
      });

      alert(
        "Grupo de opciones guardado correctamente."
      );

    } catch (err) {

      console.error(
        "Error guardando modificador:",
        err
      );

      alert(
        "No se pudo guardar el grupo de opciones."
      );
    }
  };

  /* =========================================
     ELIMINAR GRUPO DE MODIFICADORES
  ========================================= */

  const deleteModifier = async (index) => {

    if (
      !window.confirm(
        "¿Eliminar este grupo de opciones?"
      )
    ) {
      return;
    }

    try {

      const modifiers = (
        selectedProduct.modifiers || []
      ).filter((_, i) => i !== index);

      await saveModifiers(modifiers);

    } catch (err) {

      console.error(
        "Error eliminando modificador:",
        err
      );

      alert("No se pudo eliminar el grupo.");
    }
  };

  /* =========================================
     VALIDAR PRECIO PROMOCIONAL
  ========================================= */

  const hasValidPromoPrice = (product) => {

    if (
      !product ||
      product.isPromo !== true ||
      product.promoPrice === null ||
      product.promoPrice === undefined ||
      product.promoPrice === ""
    ) {
      return false;
    }

    const normalPrice = Number(product.price);
    const offerPrice = Number(product.promoPrice);

    return (
      Number.isFinite(normalPrice) &&
      Number.isFinite(offerPrice) &&
      offerPrice >= 0 &&
      offerPrice < normalPrice
    );
  };

  /* =========================================
     RENDERIZADO
  ========================================= */

  return (
    <main className="qg-menu">

      {/* =====================================
          ENCABEZADO
      ===================================== */}

      <header className="qg-menu__header">

        <div>
          <span className="qg-menu__eyebrow">
            QUE GUSTO / ADMINISTRACIÓN
          </span>

          <h1>Menú de productos</h1>

          <p>
            Administrá tus platos, precios,
            disponibilidad, destacados y promociones.
          </p>
        </div>

        <button
          type="button"
          className="qg-menu__button qg-menu__button--primary"
          onClick={openCreateModal}
        >
          <span aria-hidden="true">＋</span>
          Nuevo producto
        </button>

      </header>

      {/* =====================================
          ESTADÍSTICAS
      ===================================== */}

      <section
        className="qg-menu__stats"
        aria-label="Resumen de productos"
      >

        <article className="qg-menu__stat">
          <span className="qg-menu__stat-icon">
            ▤
          </span>

          <div>
            <span>Total de productos</span>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="qg-menu__stat">
          <span className="qg-menu__stat-icon qg-menu__stat-icon--green">
            ✓
          </span>

          <div>
            <span>Activos</span>
            <strong>{stats.active}</strong>
          </div>
        </article>

        <article className="qg-menu__stat">
          <span className="qg-menu__stat-icon qg-menu__stat-icon--orange">
            ★
          </span>

          <div>
            <span>Destacados</span>
            <strong>{stats.featured}</strong>
          </div>
        </article>

        <article className="qg-menu__stat">
          <span className="qg-menu__stat-icon qg-menu__stat-icon--orange">
            %
          </span>

          <div>
            <span>En promoción</span>
            <strong>{stats.promos}</strong>
          </div>
        </article>

        <article className="qg-menu__stat">
          <span className="qg-menu__stat-icon qg-menu__stat-icon--gray">
            ◌
          </span>

          <div>
            <span>Inactivos</span>
            <strong>{stats.inactive}</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          CATÁLOGO
      ===================================== */}

      <section className="qg-menu__catalog">

        <div className="qg-menu__catalog-heading">

          <div>
            <h2>Catálogo</h2>

            <p>
              Buscá y administrá los productos del negocio.
            </p>
          </div>

          <button
            type="button"
            className="qg-menu__button qg-menu__button--secondary"
            onClick={getProducts}
            disabled={loading}
          >
            ↻ Actualizar
          </button>

        </div>

        {/* FILTROS */}

        <div className="qg-menu__filters">

          <label className="qg-menu__search">

            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              placeholder="Buscar producto, descripción..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </label>

          <label className="qg-menu__filter">

            <span>Categoría</span>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

          </label>

          <label className="qg-menu__filter">

            <span>Estado</span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="Todos">Todos</option>
              <option value="Activos">Activos</option>
              <option value="Inactivos">Inactivos</option>
            </select>

          </label>

        </div>

        {/* CARGA, ERROR O CATÁLOGO */}

        {loading ? (

          <div className="qg-menu__feedback">

            <span className="qg-menu__spinner" />

            <h3>Cargando menú...</h3>

            <p>Estamos buscando tus productos.</p>

          </div>

        ) : error ? (

          <div className="qg-menu__feedback qg-menu__feedback--error">

            <h3>No se pudo cargar el menú</h3>

            <p>{error}</p>

            <button
              type="button"
              className="qg-menu__button qg-menu__button--primary"
              onClick={getProducts}
            >
              Reintentar
            </button>

          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="qg-menu__feedback">

            <span className="qg-menu__empty-icon">
              🍽️
            </span>

            <h3>
              {products.length === 0
                ? "Todavía no hay productos"
                : "No encontramos resultados"}
            </h3>

            <p>
              {products.length === 0
                ? "Creá tu primer producto para comenzar."
                : "Probá con otra búsqueda o cambiá los filtros."}
            </p>

            {products.length === 0 && (
              <button
                type="button"
                className="qg-menu__button qg-menu__button--primary"
                onClick={openCreateModal}
              >
                Crear producto
              </button>
            )}

          </div>

        ) : (

          <div className="qg-menu__grid">

            {filteredProducts.map((product) => (

              <article
                className="qg-menu__product"
                key={product._id}
              >

                {/* IMAGEN Y ETIQUETAS */}

                <div className="qg-menu__product-image">

                  {getProductImageUrl(product) ? (

                    <img
                      src={getProductImageUrl(product)}
                      alt={product.title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                  ) : (

                    <span className="qg-menu__product-placeholder">
                      🍔
                    </span>

                  )}

                  <span
                    className={`qg-menu__status ${
                      product.active === false
                        ? "qg-menu__status--inactive"
                        : "qg-menu__status--active"
                    }`}
                  >
                    {product.active === false
                      ? "Inactivo"
                      : "Activo"}
                  </span>

                  {product.featured && (
                    <span className="qg-menu__featured">
                      ★ Destacado
                    </span>
                  )}

                  {product.isPromo && (
                    <span className="qg-menu__promo">
                      🏷️ En promoción
                    </span>
                  )}

                </div>

                {/* INFORMACIÓN */}

                <div className="qg-menu__product-body">

                  <span className="qg-menu__category">
                    {product.category || "Sin categoría"}
                  </span>

                  <h3>{product.title}</h3>

                  <p className="qg-menu__description">
                    {product.description ||
                      "Sin descripción disponible."}
                  </p>

                  {/* PRECIOS */}

                  <div className="qg-menu__price">

                    {hasValidPromoPrice(product) ? (

                      <>
                        <span className="qg-menu__old-price">
                          {formatPrice(product.price)}
                        </span>

                        <strong className="qg-menu__promo-price">
                          {formatPrice(product.promoPrice)}
                        </strong>

                        <span className="qg-menu__savings">
                          Ahorrás{" "}
                          {formatPrice(
                            Number(product.price) -
                            Number(product.promoPrice)
                          )}
                        </span>
                      </>

                    ) : (

                      <strong>
                        {formatPrice(product.price)}
                      </strong>

                    )}

                  </div>

                  {/* STOCK */}

                  {product.useStock && (
                    <div className="qg-menu__stock">

                      <span>Stock disponible</span>

                      <strong>
                        {product.stock ?? 0} unidades
                      </strong>

                    </div>
                  )}

                  {/* MODIFICADORES */}

                  {(product.modifiers || []).length > 0 && (
                    <div className="qg-menu__modifier-summary">
                      🍟 {product.modifiers.length} grupo(s)
                      de opciones
                    </div>
                  )}

                  {/* ACCIONES */}

                  <div className="qg-menu__actions">

                    <button
                      type="button"
                      className="qg-menu__action qg-menu__action--edit"
                      onClick={() => openEditModal(product)}
                    >
                      ✎ Editar
                    </button>

                    <button
                      type="button"
                      className="qg-menu__action qg-menu__action--options"
                      onClick={() => openModifierModal(product)}
                    >
                      Opciones
                    </button>

                    <button
                      type="button"
                      className="qg-menu__action qg-menu__action--delete"
                      aria-label={`Eliminar ${product.title}`}
                      title="Eliminar producto"
                      onClick={() => deleteProduct(product)}
                    >
                      🗑
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

      {/* =====================================
          MODAL CREAR / EDITAR PRODUCTO
      ===================================== */}

      {showProductModal && (

        <div
          className="qg-menu__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProductModal();
            }
          }}
        >

          <section
            className="qg-menu__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qg-product-modal-title"
          >

            {/* ENCABEZADO DEL MODAL */}

            <header className="qg-menu__modal-header">

              <div>

                <span className="qg-menu__eyebrow">
                  DATOS DEL PRODUCTO
                </span>

                <h2 id="qg-product-modal-title">
                  {editingProduct
                    ? "Editar producto"
                    : "Nuevo producto"}
                </h2>

              </div>

              <button
                type="button"
                className="qg-menu__close"
                onClick={closeProductModal}
                aria-label="Cerrar"
                disabled={saving}
              >
                ×
              </button>

            </header>

            <form onSubmit={saveProduct}>

              <div className="qg-menu__form-grid">

                {/* NOMBRE */}

                <label className="qg-menu__field">

                  Nombre *

                  <input
                    required
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    placeholder="Ej. Milanesa con guarnición"
                  />

                </label>

                {/* CATEGORÍA */}

                <label className="qg-menu__field">

                  Categoría *

                  <input
                    required
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    placeholder="Ej. Minutas"
                  />

                </label>

                {/* DESCRIPCIÓN */}

                <label className="qg-menu__field qg-menu__field--full">

                  Descripción

                  <textarea
                    rows="3"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Ingredientes, acompañamientos y detalles..."
                  />

                </label>

                {/* PRECIO NORMAL */}

                <label className="qg-menu__field">

                  Precio de venta *

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateForm("price", event.target.value)
                    }
                    placeholder="Ej. 8500"
                  />

                </label>

                {/* COSTO */}

                <label className="qg-menu__field">

                  Costo

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(event) =>
                      updateForm("cost", event.target.value)
                    }
                    placeholder="Ej. 5000"
                  />

                </label>

                {/* =================================
                    IMAGEN LOCAL
                ================================= */}

                <div className="qg-menu__field qg-menu__field--full">

                  <span>Imagen del producto *</span>

                  <label className="qg-menu__image-upload">

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                    />

                    <span className="qg-menu__image-upload-icon">
                      📷
                    </span>

                    <strong>
                      Seleccionar imagen
                    </strong>

                    <small>
                      JPG, PNG o WEBP · Máximo 5 MB
                    </small>

                  </label>

                  {/* VISTA PREVIA */}

                  {imagePreview && (

                    <div className="qg-menu__preview">

                      <img
                        src={imagePreview}
                        alt="Vista previa del producto"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />

                      <div className="qg-menu__preview-info">

                        <span>
                          {selectedImage
                            ? selectedImage.name
                            : "Imagen actual del producto"}
                        </span>

                        {selectedImage && (
                          <small>
                            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                          </small>
                        )}

                      </div>

                      <button
                        type="button"
                        onClick={clearSelectedImage}
                        disabled={saving}
                      >
                        {selectedImage
                          ? "Cancelar selección"
                          : "Cambiar imagen"}
                      </button>

                    </div>

                  )}

                  {!imagePreview && (
                    <small>
                      {editingProduct
                        ? "Seleccioná una nueva imagen si querés reemplazar la actual."
                        : "Es necesario seleccionar una imagen para crear el producto."}
                    </small>
                  )}

                </div>

              </div>

              {/* =================================
                  CONFIGURACIÓN DEL PRODUCTO
              ================================= */}

              <div className="qg-menu__settings">

                <h3>Inventario y publicación</h3>

                {/* STOCK */}

                <label className="qg-menu__check">

                  <input
                    type="checkbox"
                    checked={form.useStock}
                    onChange={(event) =>
                      updateForm(
                        "useStock",
                        event.target.checked
                      )
                    }
                  />

                  <span>Controlar stock</span>

                </label>

                {form.useStock && (

                  <label className="qg-menu__field">

                    Unidades disponibles

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(event) =>
                        updateForm("stock", event.target.value)
                      }
                    />

                  </label>

                )}

                {/* ACTIVO */}

                <label className="qg-menu__check">

                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      updateForm(
                        "active",
                        event.target.checked
                      )
                    }
                  />

                  <span>Producto activo</span>

                </label>

                {/* DESTACADO */}

                <label className="qg-menu__check">

                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateForm(
                        "featured",
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    ★ Destacar producto en la página principal
                  </span>

                </label>

                {/* PROMOCIÓN */}

                <label className="qg-menu__check">

                  <input
                    type="checkbox"
                    checked={form.isPromo}
                    onChange={(event) => {

                      const enabled = event.target.checked;

                      setForm((previous) => ({
                        ...previous,

                        isPromo: enabled,

                        promoPrice: enabled
                          ? previous.promoPrice
                          : "",
                      }));

                    }}
                  />

                  <span>🏷️ Activar promoción</span>

                </label>

                {/* PRECIO PROMOCIONAL */}

                {form.isPromo && (

                  <label className="qg-menu__field">

                    Precio promocional *

                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.promoPrice}
                      onChange={(event) =>
                        updateForm(
                          "promoPrice",
                          event.target.value
                        )
                      }
                      placeholder="Ej. 7500"
                    />

                    <small>
                      Debe ser menor que el precio normal.
                    </small>

                  </label>

                )}

                {/* RESUMEN DE PROMOCIÓN */}

                {form.isPromo &&
                  form.price !== "" &&
                  form.promoPrice !== "" &&
                  Number(form.promoPrice) >= 0 &&
                  Number(form.promoPrice) < Number(form.price) && (

                    <div className="qg-menu__promo-preview">

                      <span>Vista previa de la oferta</span>

                      <div>

                        <del>
                          {formatPrice(form.price)}
                        </del>

                        <strong>
                          {formatPrice(form.promoPrice)}
                        </strong>

                      </div>

                      <small>
                        Ahorrás{" "}
                        {formatPrice(
                          Number(form.price) -
                          Number(form.promoPrice)
                        )}
                      </small>

                    </div>

                  )}

              </div>

              {/* BOTONES DEL FORMULARIO */}

              <footer className="qg-menu__modal-footer">

                <button
                  type="button"
                  className="qg-menu__button qg-menu__button--secondary"
                  onClick={closeProductModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="qg-menu__button qg-menu__button--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : "Guardar producto"}
                </button>

              </footer>

            </form>

          </section>

        </div>

      )}

      {/* =====================================
          MODAL DE MODIFICADORES
      ===================================== */}

      {showModifierModal && selectedProduct && (

        <div
          className="qg-menu__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModifierModal();
            }
          }}
        >

          <section
            className="qg-menu__modal qg-menu__modal--modifiers"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qg-modifier-modal-title"
          >

            {/* ENCABEZADO */}

            <header className="qg-menu__modal-header">

              <div>

                <span className="qg-menu__eyebrow">
                  PERSONALIZACIÓN
                </span>

                <h2 id="qg-modifier-modal-title">
                  Opciones del producto
                </h2>

                <p>{selectedProduct.title}</p>

              </div>

              <button
                type="button"
                className="qg-menu__close"
                onClick={closeModifierModal}
                aria-label="Cerrar"
              >
                ×
              </button>

            </header>

            {/* CREAR GRUPO */}

            <form
              className="qg-menu__modifier-form"
              onSubmit={saveModifier}
            >

              <h3>Crear grupo de opciones</h3>

              <label className="qg-menu__field">

                Nombre del grupo *

                <input
                  required
                  value={modifier.name}
                  onChange={(event) =>
                    setModifier((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ej. Elegí tu guarnición"
                />

              </label>

              <div className="qg-menu__modifier-settings">

                {/* TIPO */}

                <label className="qg-menu__field">

                  Tipo de selección

                  <select
                    value={modifier.type}
                    onChange={(event) =>
                      setModifier((previous) => ({
                        ...previous,

                        type: event.target.value,

                        maxSelect:
                          event.target.value === "single"
                            ? 1
                            : Math.max(
                                2,
                                previous.maxSelect
                              ),
                      }))
                    }
                  >

                    <option value="single">
                      Una opción
                    </option>

                    <option value="multiple">
                      Varias opciones
                    </option>

                  </select>

                </label>

                {/* OBLIGATORIO */}

                <label className="qg-menu__check">

                  <input
                    type="checkbox"
                    checked={modifier.required}
                    onChange={(event) =>
                      setModifier((previous) => ({
                        ...previous,
                        required: event.target.checked,
                      }))
                    }
                  />

                  <span>Selección obligatoria</span>

                </label>

              </div>

              {/* AGREGAR OPCIONES */}

              <h3>Agregar opciones</h3>

              <div className="qg-menu__option-adder">

                <label className="qg-menu__field">

                  Nombre

                  <input
                    value={option.label}
                    onChange={(event) =>
                      setOption((previous) => ({
                        ...previous,
                        label: event.target.value,
                      }))
                    }
                    placeholder="Ej. Papas fritas"
                  />

                </label>

                <label className="qg-menu__field">

                  Precio extra

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={option.price}
                    onChange={(event) =>
                      setOption((previous) => ({
                        ...previous,
                        price: event.target.value,
                      }))
                    }
                    placeholder="0"
                  />

                </label>

                <button
                  type="button"
                  className="qg-menu__button qg-menu__button--primary"
                  onClick={addOption}
                >
                  Añadir
                </button>

              </div>

              {/* OPCIONES NUEVAS */}

              {modifier.options.length > 0 && (

                <div className="qg-menu__option-list">

                  {modifier.options.map((item, index) => (

                    <div
                      className="qg-menu__option-row"
                      key={`${item.label}-${index}`}
                    >

                      <span>{item.label}</span>

                      <div>

                        <strong>
                          {item.price > 0
                            ? `+${formatPrice(item.price)}`
                            : "Sin extra"}
                        </strong>

                        <button
                          type="button"
                          className="qg-menu__remove-option"
                          onClick={() => removeNewOption(index)}
                          aria-label={`Quitar ${item.label}`}
                        >
                          ×
                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              )}

              <button
                type="submit"
                className="qg-menu__button qg-menu__button--primary qg-menu__save-modifier"
              >
                Guardar grupo de opciones
              </button>

            </form>

            {/* GRUPOS EXISTENTES */}

            <div className="qg-menu__existing-modifiers">

              <h3>Grupos existentes</h3>

              {(selectedProduct.modifiers || []).length === 0 ? (

                <p className="qg-menu__muted">
                  Este producto todavía no tiene grupos de opciones.
                </p>

              ) : (

                selectedProduct.modifiers.map((group, index) => (

                  <article
                    className="qg-menu__existing-group"
                    key={`${group.name}-${index}`}
                  >

                    <div className="qg-menu__existing-group-header">

                      <div>

                        <strong>{group.name}</strong>

                        <span>
                          {group.type === "single"
                            ? "Selección única"
                            : "Selección múltiple"}

                          {group.required
                            ? " · Obligatorio"
                            : " · Opcional"}
                        </span>

                      </div>

                      <button
                        type="button"
                        className="qg-menu__remove-option"
                        onClick={() => deleteModifier(index)}
                        aria-label={`Eliminar grupo ${group.name}`}
                      >
                        🗑
                      </button>

                    </div>

                    <div className="qg-menu__existing-options">

                      {(group.options || []).map(
                        (item, optionIndex) => (

                          <span
                            key={`${item.label}-${optionIndex}`}
                          >

                            {item.label}

                            {Number(item.price) > 0 &&
                              ` · +${formatPrice(item.price)}`}

                          </span>

                        )
                      )}

                    </div>

                  </article>

                ))

              )}

            </div>

          </section>

        </div>

      )}

    </main>
  );
};

export default Menu;
