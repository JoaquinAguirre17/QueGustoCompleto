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
   CONFIGURACIONES INICIALES
========================================= */

const createEmptyPromoConfig = () => ({
  enabled: false,
  includedProducts: [],
  selectionGroups: [],
});

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
  promoConfig: createEmptyPromoConfig(),
};

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
    promoConfig: createEmptyPromoConfig(),
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  /* =========================================
     IMÁGENES
  ========================================= */

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const imageInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /* =========================================
     MODIFICADORES
  ========================================= */

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModifierModal, setShowModifierModal] = useState(false);

  const [modifier, setModifier] = useState({
    ...EMPTY_MODIFIER,
    options: [],
  });

  const [option, setOption] = useState({
    ...EMPTY_OPTION,
  });

  /* =========================================
     FILTROS
  ========================================= */

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");

  /* =========================================
     UTILIDADES
  ========================================= */

  const formatPrice = (value) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const getProductImageUrl = (product) => {
    if (!product?._id || !product?.image?.contentType) return "";

    return `${API}/products/${product._id}/image`;
  };

  const normalizeId = (item) => {
    if (!item) return "";

    if (typeof item === "object") {
      return String(item._id || item.id || "");
    }

    return String(item);
  };

  const getResponseProduct = (response) =>
    response.data?.product || response.data;

  /* =========================================
     CARGAR PRODUCTOS
  ========================================= */

  const getProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API}/products`);
      const data = response.data;

      setProducts(
        Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : []
      );
    } catch (err) {
      console.error("Error cargando productos:", err);

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
     CATEGORÍAS
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
     PRODUCTOS DISPONIBLES PARA PROMOCIONES

     No permite incluir:
     - Productos inactivos.
     - La propia promoción.
     - Otras promociones.
  ========================================= */

  const availablePromoProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.active !== false &&
        normalizeId(product._id) !==
        normalizeId(editingProduct?._id) &&
        product.isPromo !== true
    );
  }, [products, editingProduct]);

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
        (statusFilter === "Activos" &&
          product.active !== false) ||
        (statusFilter === "Inactivos" &&
          product.active === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

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
     CONFIGURACIÓN DE PROMOCIONES
  ========================================= */

  const updatePromoConfig = (field, value) => {
    setForm((previous) => ({
      ...previous,
      promoConfig: {
        ...previous.promoConfig,
        [field]: value,
      },
    }));
  };

  const updatePromoGroup = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      promoConfig: {
        ...previous.promoConfig,
        selectionGroups:
          previous.promoConfig.selectionGroups.map(
            (group, i) =>
              i === index
                ? { ...group, [field]: value }
                : group
          ),
      },
    }));
  };

  const addPromoGroup = () => {
    setForm((previous) => ({
      ...previous,
      promoConfig: {
        ...previous.promoConfig,
        selectionGroups: [
          ...previous.promoConfig.selectionGroups,
          {
            name: "",
            description: "",
            requiredQuantity: 1,
            allowedProducts: [],
          },
        ],
      },
    }));
  };

  const removePromoGroup = (index) => {
    setForm((previous) => ({
      ...previous,
      promoConfig: {
        ...previous.promoConfig,
        selectionGroups:
          previous.promoConfig.selectionGroups.filter(
            (_, i) => i !== index
          ),
      },
    }));
  };

  const toggleAllowedProduct = (groupIndex, productId) => {
    setForm((previous) => ({
      ...previous,
      promoConfig: {
        ...previous.promoConfig,
        selectionGroups:
          previous.promoConfig.selectionGroups.map(
            (group, i) => {
              if (i !== groupIndex) return group;

              const exists = group.allowedProducts.some(
                (id) => normalizeId(id) === normalizeId(productId)
              );

              return {
                ...group,
                allowedProducts: exists
                  ? group.allowedProducts.filter(
                    (id) => normalizeId(id) !== normalizeId(productId)
                  )
                  : [...group.allowedProducts, productId],
              };
            }
          ),
      },
    }));
  };

  const toggleIncludedProduct = (productId) => {
    setForm((previous) => {
      const exists = previous.promoConfig.includedProducts.some(
        (item) =>
          normalizeId(item.product) === normalizeId(productId)
      );

      return {
        ...previous,
        promoConfig: {
          ...previous.promoConfig,
          includedProducts: exists
            ? previous.promoConfig.includedProducts.filter(
              (item) =>
                normalizeId(item.product) !== normalizeId(productId)
            )
            : [
              ...previous.promoConfig.includedProducts,
              {
                product: productId,
                quantity: 1,
              },
            ],
        },
      };
    });
  };

  const updateIncludedQuantity = (productId, quantity) => {
    setForm((previous) => ({
      ...previous,
      promoConfig: {
        ...previous.promoConfig,
        includedProducts:
          previous.promoConfig.includedProducts.map((item) =>
            normalizeId(item.product) === normalizeId(productId)
              ? {
                ...item,
                quantity: quantity === ""
                  ? ""
                  : Math.max(1, Number(quantity) || 1),
              }
              : item
          ),
      },
    }));
  };

  /* =========================================
     IMÁGENES
  ========================================= */

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Seleccioná un archivo de imagen válido.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);

    setImagePreview(
      editingProduct ? getProductImageUrl(editingProduct) : ""
    );

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  /* =========================================
     ABRIR MODAL CREAR
  ========================================= */

  const openCreateModal = () => {
    setEditingProduct(null);

    setForm({
      ...EMPTY_PRODUCT,
      promoConfig: createEmptyPromoConfig(),
    });

    setSelectedImage(null);
    setImagePreview("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    setShowProductModal(true);
  };

  /* =========================================
     ABRIR MODAL EDITAR

     Importante:
     No inventamos grupos cuando no existen.
     Conservamos la configuración original.
  ========================================= */

  const openEditModal = (product) => {
    setEditingProduct(product);

    const savedConfig = product.promoConfig || {};

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

      promoConfig: {
        enabled: savedConfig.enabled ?? false,

        includedProducts: (
          savedConfig.includedProducts || []
        ).map((item) => ({
          product: normalizeId(item.product),
          quantity: Number(item.quantity) || 1,
        })),

        selectionGroups: (
          savedConfig.selectionGroups || []
        ).map((group) => ({
          name: group.name || "",
          description: group.description || "",
          requiredQuantity:
            Number(group.requiredQuantity) || 1,
          allowedProducts: (
            group.allowedProducts || []
          ).map(normalizeId),
        })),
      },
    });

    setSelectedImage(null);
    setImagePreview(getProductImageUrl(product));

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    setShowProductModal(true);
  };

  /* =========================================
     CERRAR MODAL PRODUCTO
  ========================================= */

  const closeProductModal = () => {
    if (saving) return;

    setShowProductModal(false);
    setEditingProduct(null);

    setForm({
      ...EMPTY_PRODUCT,
      promoConfig: createEmptyPromoConfig(),
    });

    setSelectedImage(null);
    setImagePreview("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  /* =========================================
     VALIDAR PROMOCIONES
  ========================================= */

  const validatePromoConfig = () => {
    if (!form.isPromo || !form.promoConfig.enabled) {
      return true;
    }

    const groups = form.promoConfig.selectionGroups || [];
    const included = form.promoConfig.includedProducts || [];

    if (groups.length === 0 && included.length === 0) {
      alert(
        "Una promoción configurable debe tener productos incluidos o grupos de selección."
      );
      return false;
    }

    const includedIds = included.map((item) =>
      normalizeId(item.product)
    );

    if (includedIds.some((id) => !id)) {
      alert("Hay productos incluidos sin seleccionar.");
      return false;
    }

    if (new Set(includedIds).size !== includedIds.length) {
      alert("No podés incluir el mismo producto dos veces.");
      return false;
    }

    for (const item of included) {
      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
      ) {
        alert(
          "Las cantidades de los productos incluidos deben ser mayores a cero."
        );
        return false;
      }

      const productExists = availablePromoProducts.some(
        (product) =>
          normalizeId(product._id) === normalizeId(item.product)
      );

      if (!productExists) {
        alert(
          "Uno de los productos incluidos ya no está disponible. Revisá la configuración."
        );
        return false;
      }
    }

    const groupNames = groups.map((group) =>
      group.name.trim().toLowerCase()
    );

    if (new Set(groupNames).size !== groupNames.length) {
      alert("No puede haber dos grupos con el mismo nombre.");
      return false;
    }

    for (const group of groups) {
      if (!group.name.trim()) {
        alert("Todos los grupos deben tener un nombre.");
        return false;
      }

      if (
        !Number.isInteger(Number(group.requiredQuantity)) ||
        Number(group.requiredQuantity) < 1
      ) {
        alert(
          `La cantidad requerida del grupo "${group.name}" debe ser al menos 1.`
        );
        return false;
      }

      if (!group.allowedProducts?.length) {
        alert(
          `Seleccioná al menos un producto permitido para "${group.name}".`
        );
        return false;
      }

      const allowedIds = group.allowedProducts.map(normalizeId);

      if (
        allowedIds.some((id) => !id) ||
        new Set(allowedIds).size !== allowedIds.length
      ) {
        alert(
          `Hay productos inválidos o repetidos en "${group.name}".`
        );
        return false;
      }

      const unavailable = allowedIds.some(
        (id) =>
          !availablePromoProducts.some(
            (product) => normalizeId(product._id) === id
          )
      );

      if (unavailable) {
        alert(
          `Uno de los productos permitidos en "${group.name}" ya no está disponible.`
        );
        return false;
      }
    }

    return true;
  };

  /* =========================================
     GUARDAR PRODUCTO
  ========================================= */

  const saveProduct = async (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      form.price === ""
    ) {
      alert("Completá el nombre, la categoría y el precio.");
      return;
    }

    if (!editingProduct && !selectedImage) {
      alert("Seleccioná una imagen para el producto.");
      return;
    }

    const price = Number(form.price);
    const cost = form.cost === "" ? 0 : Number(form.cost);

    const stock = form.useStock
      ? Number(form.stock || 0)
      : 0;

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      (form.useStock && !Number.isInteger(stock))
    ) {
      alert("Ingresá valores numéricos válidos.");
      return;
    }

    let promoPrice = null;

    if (form.isPromo) {
      if (
        form.promoPrice === "" ||
        form.promoPrice === null
      ) {
        alert("Ingresá el precio promocional del producto.");
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

    if (!validatePromoConfig()) return;

    const currentProductId = normalizeId(editingProduct?._id);

    const componentIds = [
      ...form.promoConfig.includedProducts.map(
        (item) => normalizeId(item.product)
      ),
      ...form.promoConfig.selectionGroups.flatMap(
        (group) => group.allowedProducts.map(normalizeId)
      ),
    ];

    if (
      form.isPromo &&
      form.promoConfig.enabled &&
      currentProductId &&
      componentIds.includes(currentProductId)
    ) {
      alert("Una promoción no puede incluirse a sí misma.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("category", form.category.trim());

      formData.append("price", String(price));
      formData.append("cost", String(cost));

      formData.append("stock", String(stock));
      formData.append("useStock", String(Boolean(form.useStock)));

      formData.append("active", String(Boolean(form.active)));
      formData.append("featured", String(Boolean(form.featured)));

      formData.append("isPromo", String(Boolean(form.isPromo)));

      formData.append(
        "promoPrice",
        form.isPromo ? String(promoPrice) : ""
      );

      // Conservar modificadores existentes.
      formData.append(
        "modifiers",
        JSON.stringify(editingProduct?.modifiers || [])
      );

      // Conservar la configuración aunque se desactive temporalmente.
      const promoConfig = {
        enabled: Boolean(form.promoConfig.enabled),

        includedProducts: form.promoConfig.includedProducts.map(
          (item) => ({
            product: normalizeId(item.product),
            quantity: Number(item.quantity),
          })
        ),

        selectionGroups: form.promoConfig.selectionGroups.map(
          (group) => ({
            name: group.name.trim(),
            description: group.description.trim(),
            requiredQuantity: Number(group.requiredQuantity),
            allowedProducts: group.allowedProducts.map(normalizeId),
          })
        ),
      };

      formData.append("promoConfig", JSON.stringify(promoConfig));

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      let response;

      if (editingProduct) {
        response = await axios.put(
          `${API}/products/${editingProduct._id}`,
          formData
        );
      } else {
        response = await axios.post(
          `${API}/products`,
          formData
        );
      }

      const savedProduct = getResponseProduct(response);

      if (!savedProduct?._id) {
        throw new Error(
          "El servidor no devolvió el producto guardado."
        );
      }

      if (editingProduct) {
        setProducts((previous) =>
          previous.map((product) =>
            product._id === editingProduct._id
              ? savedProduct
              : product
          )
        );
      } else {
        setProducts((previous) => [
          savedProduct,
          ...previous,
        ]);
      }

      setShowProductModal(false);
      setEditingProduct(null);

      setForm({
        ...EMPTY_PRODUCT,
        promoConfig: createEmptyPromoConfig(),
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
      console.error("Error guardando producto:", err);

      alert(
        err.response?.data?.message ||
        err.message ||
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
      await axios.delete(`${API}/products/${product._id}`);

      setProducts((previous) =>
        previous.filter((item) => item._id !== product._id)
      );
    } catch (err) {
      console.error("Error eliminando producto:", err);

      alert(
        err.response?.data?.message ||
        "No se pudo eliminar el producto."
      );
    }
  };

  /* =========================================
     MODIFICADORES
  ========================================= */

  const openModifierModal = (product) => {
    setSelectedProduct(product);

    setModifier({
      ...EMPTY_MODIFIER,
      options: [],
    });

    setOption({ ...EMPTY_OPTION });

    setShowModifierModal(true);
  };

  const closeModifierModal = () => {
    setShowModifierModal(false);
    setSelectedProduct(null);

    setModifier({
      ...EMPTY_MODIFIER,
      options: [],
    });

    setOption({ ...EMPTY_OPTION });
  };

  const addOption = () => {
    if (!option.label.trim()) {
      alert("Ingresá el nombre de la opción.");
      return;
    }

    const price =
      option.price === "" ? 0 : Number(option.price);

    if (!Number.isFinite(price) || price < 0) {
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

    setOption({ ...EMPTY_OPTION });
  };

  const removeNewOption = (index) => {
    setModifier((previous) => ({
      ...previous,
      options: previous.options.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const saveModifiers = async (modifiers) => {
    if (!selectedProduct) return null;

    const response = await axios.put(
      `${API}/products/${selectedProduct._id}`,
      { modifiers }
    );

    const updated = getResponseProduct(response);

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

      setOption({ ...EMPTY_OPTION });

      alert("Grupo de opciones guardado correctamente.");
    } catch (err) {
      console.error("Error guardando modificador:", err);
      alert("No se pudo guardar el grupo de opciones.");
    }
  };

  const deleteModifier = async (index) => {
    if (!window.confirm("¿Eliminar este grupo de opciones?")) {
      return;
    }

    try {
      const modifiers = (
        selectedProduct.modifiers || []
      ).filter((_, i) => i !== index);

      await saveModifiers(modifiers);
    } catch (err) {
      console.error("Error eliminando modificador:", err);
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

  return (
    <main className="qg-menu">

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

      <section className="qg-menu__stats">
        {[
          ["▤", "Total de productos", stats.total],
          ["✓", "Activos", stats.active],
          ["★", "Destacados", stats.featured],
          ["%", "En promoción", stats.promos],
          ["◌", "Inactivos", stats.inactive],
        ].map(([icon, label, value], index) => (
          <article className="qg-menu__stat" key={label}>
            <span className="qg-menu__stat-icon">{icon}</span>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="qg-menu__catalog">

        <div className="qg-menu__catalog-heading">
          <div>
            <h2>Catálogo</h2>
            <p>Buscá y administrá los productos del negocio.</p>
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

        <div className="qg-menu__filters">

          <label className="qg-menu__search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Buscar producto, descripción..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
                <option key={category} value={category}>
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
            <span className="qg-menu__empty-icon">🍽️</span>
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
                    className={`qg-menu__status ${product.active === false
                      ? "qg-menu__status--inactive"
                      : "qg-menu__status--active"
                      }`}
                  >
                    {product.active === false ? "Inactivo" : "Activo"}
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

                <div className="qg-menu__product-body">
                  <span className="qg-menu__category">
                    {product.category || "Sin categoría"}
                  </span>

                  <h3>{product.title}</h3>

                  <p className="qg-menu__description">
                    {product.description ||
                      "Sin descripción disponible."}
                  </p>

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
                      <strong>{formatPrice(product.price)}</strong>
                    )}
                  </div>

                  {product.useStock && (
                    <div className="qg-menu__stock">
                      <span>Stock disponible</span>
                      <strong>
                        {product.stock ?? 0} unidades
                      </strong>
                    </div>
                  )}

                  {(product.modifiers || []).length > 0 && (
                    <div className="qg-menu__modifier-summary">
                      🍟 {product.modifiers.length} grupo(s) de opciones
                    </div>
                  )}

                  {product.isPromo &&
                    product.promoConfig?.enabled && (
                      <div className="qg-menu__modifier-summary">
                        🏷️ Promoción configurable ·{" "}
                        {product.promoConfig.selectionGroups?.length || 0} grupo(s)
                      </div>
                    )}

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
                      onClick={() => deleteProduct(product)}
                      aria-label={`Eliminar ${product.title}`}
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

      {/* MODAL PRODUCTO */}

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

            <header className="qg-menu__modal-header">
              <div>
                <span className="qg-menu__eyebrow">
                  DATOS DEL PRODUCTO
                </span>
                <h2 id="qg-product-modal-title">
                  {editingProduct ? "Editar producto" : "Nuevo producto"}
                </h2>
              </div>

              <button
                type="button"
                className="qg-menu__close"
                onClick={closeProductModal}
                disabled={saving}
              >
                ×
              </button>
            </header>

            <form onSubmit={saveProduct}>

              <div className="qg-menu__form-grid">

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

                <label className="qg-menu__field qg-menu__field--full">
                  Descripción
                  <textarea
                    rows="3"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Ingredientes y detalles..."
                  />
                </label>

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
                  />
                </label>

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
                  />
                </label>

                {/* IMAGEN */}

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
                    <strong>Seleccionar imagen</strong>
                    <small>JPG, PNG o WEBP · Máximo 5 MB</small>
                  </label>

                  {imagePreview && (
                    <div className="qg-menu__preview">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
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
                </div>

              </div>

              {/* CONFIGURACIÓN GENERAL */}

              <div className="qg-menu__settings">
                <h3>Inventario y publicación</h3>

                <label className="qg-menu__check">
                  <input
                    type="checkbox"
                    checked={form.useStock}
                    onChange={(event) =>
                      updateForm("useStock", event.target.checked)
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

                <label className="qg-menu__check">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      updateForm("active", event.target.checked)
                    }
                  />
                  <span>Producto activo</span>
                </label>

                <label className="qg-menu__check">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateForm("featured", event.target.checked)
                    }
                  />
                  <span>★ Destacar producto en la página principal</span>
                </label>

                {/* PROMOCIÓN */}

                <label className="qg-menu__check">
                  <input
                    type="checkbox"
                    checked={form.isPromo}
                    onChange={(event) =>
                      updateForm("isPromo", event.target.checked)
                    }
                  />
                  <span>🏷️ Activar promoción</span>
                </label>

                {form.isPromo && (
                  <>
                    <label className="qg-menu__field">
                      Precio promocional *
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.promoPrice}
                        onChange={(event) =>
                          updateForm("promoPrice", event.target.value)
                        }
                      />
                      <small>Debe ser menor que el precio normal.</small>
                    </label>

                    {/* CONFIGURADOR */}

                    <div className="qg-menu__promo-config">

                      <div className="qg-menu__promo-config-header">
                        <div>
                          <h3>Configuración de la promoción</h3>
                          <p>
                            Definí qué recibe el cliente y qué productos puede elegir.
                          </p>
                        </div>

                        <label className="qg-menu__check">
                          <input
                            type="checkbox"
                            checked={form.promoConfig.enabled}
                            onChange={(event) =>
                              updatePromoConfig(
                                "enabled",
                                event.target.checked
                              )
                            }
                          />
                          <span>Permitir elegir productos</span>
                        </label>
                      </div>

                      {form.promoConfig.enabled && (
                        <>
                          {/* PRODUCTOS FIJOS */}

                          <section className="qg-menu__promo-section">
                            <h4>1. Productos incluidos</h4>
                            <p>
                              Se agregan automáticamente a la promoción.
                            </p>

                            {availablePromoProducts.length === 0 ? (
                              <small>No hay productos activos disponibles.</small>
                            ) : (
                              <div className="qg-menu__promo-product-list">
                                {availablePromoProducts.map((product) => {
                                  const included =
                                    form.promoConfig.includedProducts.find(
                                      (item) =>
                                        normalizeId(item.product) ===
                                        normalizeId(product._id)
                                    );

                                  return (
                                    <div
                                      className="qg-menu__promo-product"
                                      key={product._id}
                                    >
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={Boolean(included)}
                                          onChange={() =>
                                            toggleIncludedProduct(product._id)
                                          }
                                        />
                                        <span>{product.title}</span>
                                      </label>

                                      {included && (
                                        <input
                                          type="number"
                                          min="1"
                                          step="1"
                                          aria-label={`Cantidad de ${product.title}`}
                                          value={included.quantity}
                                          onChange={(event) =>
                                            updateIncludedQuantity(
                                              product._id,
                                              event.target.value
                                            )
                                          }
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </section>

                          {/* GRUPOS */}

                          <section className="qg-menu__promo-section">

                            <div className="qg-menu__promo-section-heading">
                              <div>
                                <h4>2. Productos a elección del cliente</h4>
                                <p>
                                  Definí la cantidad y los productos permitidos.
                                </p>
                              </div>

                              <button
                                type="button"
                                className="qg-menu__button qg-menu__button--secondary"
                                onClick={addPromoGroup}
                              >
                                + Agregar grupo
                              </button>
                            </div>

                            {form.promoConfig.selectionGroups.map(
                              (group, index) => (
                                <article
                                  className="qg-menu__promo-group"
                                  key={`promo-group-${index}`}
                                >
                                  <div className="qg-menu__promo-group-heading">
                                    <strong>Grupo {index + 1}</strong>

                                    <button
                                      type="button"
                                      className="qg-menu__remove-option"
                                      onClick={() =>
                                        removePromoGroup(index)
                                      }
                                    >
                                      Eliminar
                                    </button>
                                  </div>

                                  <div className="qg-menu__form-grid">

                                    <label className="qg-menu__field">
                                      Nombre del grupo *
                                      <input
                                        value={group.name}
                                        onChange={(event) =>
                                          updatePromoGroup(
                                            index,
                                            "name",
                                            event.target.value
                                          )
                                        }
                                        placeholder="Ej. Elegí tus empanadas"
                                      />
                                    </label>

                                    <label className="qg-menu__field">
                                      Cantidad total que debe elegir el cliente *
                                      <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        required
                                        value={group.requiredQuantity}
                                        onChange={(event) =>
                                          updatePromoGroup(
                                            index,
                                            "requiredQuantity",
                                            event.target.value
                                          )
                                        }
                                        placeholder="Ej. 12"
                                      />
                                      <small>
                                        El cliente deberá seleccionar exactamente esta cantidad
                                        entre los productos permitidos.
                                      </small>
                                    </label>

                                    <label className="qg-menu__field qg-menu__field--full">
                                      Descripción para el cliente
                                      <input
                                        value={group.description}
                                        onChange={(event) =>
                                          updatePromoGroup(
                                            index,
                                            "description",
                                            event.target.value
                                          )
                                        }
                                        placeholder="Podés combinar los sabores que quieras."
                                      />
                                    </label>

                                  </div>

                                  <div className="qg-menu__promo-allowed">
                                    <strong>Productos que puede elegir</strong>

                                    <small>
                                      Seleccioná los sabores permitidos.
                                    </small>

                                    <div className="qg-menu__promo-product-list">
                                      {availablePromoProducts.map((product) => (
                                        <label
                                          className="qg-menu__promo-product"
                                          key={product._id}
                                        >
                                          <span>
                                            <input
                                              type="checkbox"
                                              checked={group.allowedProducts.some(
                                                (id) =>
                                                  normalizeId(id) ===
                                                  normalizeId(product._id)
                                              )}
                                              onChange={() =>
                                                toggleAllowedProduct(
                                                  index,
                                                  product._id
                                                )
                                              }
                                            />
                                            {product.title}
                                          </span>

                                          <small>
                                            {formatPrice(product.price)}
                                          </small>
                                        </label>
                                      ))}
                                    </div>

                                    <small className="qg-menu__promo-selected-count">
                                      {group.allowedProducts.length} producto(s) permitido(s)
                                    </small>
                                  </div>
                                </article>
                              )
                            )}

                          </section>

                          <div className="qg-menu__promo-help">
                            <strong>¿Cómo funciona?</strong>
                            <p>
                              El cliente podrá combinar los productos permitidos
                              hasta completar exactamente la cantidad indicada
                              en cada grupo. Los productos incluidos se agregan
                              automáticamente.
                            </p>
                          </div>

                        </>
                      )}

                    </div>
                  </>
                )}

                {/* VISTA PREVIA */}

                {form.isPromo &&
                  form.price !== "" &&
                  form.promoPrice !== "" &&
                  Number(form.promoPrice) >= 0 &&
                  Number(form.promoPrice) < Number(form.price) && (
                    <div className="qg-menu__promo-preview">
                      <span>Vista previa de la oferta</span>
                      <div>
                        <del>{formatPrice(form.price)}</del>
                        <strong>{formatPrice(form.promoPrice)}</strong>
                      </div>
                      <small>
                        Ahorrás{" "}
                        {formatPrice(
                          Number(form.price) - Number(form.promoPrice)
                        )}
                      </small>
                    </div>
                  )}

              </div>

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
                  {saving ? "Guardando..." : "Guardar producto"}
                </button>
              </footer>

            </form>
          </section>
        </div>
      )}

      {/* MODAL MODIFICADORES */}

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
              >
                ×
              </button>
            </header>

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
                            : Math.max(2, previous.maxSelect),
                      }))
                    }
                  >
                    <option value="single">Una opción</option>
                    <option value="multiple">Varias opciones</option>
                  </select>
                </label>

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
                      >
                        🗑
                      </button>
                    </div>

                    <div className="qg-menu__existing-options">
                      {(group.options || []).map((item, optionIndex) => (
                        <span key={`${item.label}-${optionIndex}`}>
                          {item.label}
                          {Number(item.price) > 0 &&
                            ` · +${formatPrice(item.price)}`}
                        </span>
                      ))}
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
