import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
/* ==================================================
                    PRODUCTOS
================================================== */

/*=======================================================
 * Obtener todos los productos
 * Devuelve los productos sin los datos binarios de imagen
=======================================================*/
export const getProducts = async (req, res) => {
  try {
    console.log("🔥 Entrando a getProducts");

    const products = await Product.find()
      .select("-image.data")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(products);

  } catch (error) {
    console.error("💥 Error obteniendo productos:", error);

    return res.status(500).json({
      success: false,
      message: "Error obteniendo productos"
    });
  }
};


/*=======================================================
 * Obtener producto por ID
 * Devuelve los datos del producto sin el Buffer
=======================================================*/
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select("-image.data")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    return res.status(200).json(product);

  } catch (error) {
    console.error("Error obteniendo producto:", error);

    return res.status(500).json({
      success: false,
      message: "Error obteniendo producto"
    });
  }
};


/*=======================================================
 * Obtener imagen local de un producto
 * Devuelve el Buffer almacenado en MongoDB
=======================================================*/
export const getProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select("image");

    if (!product || !product.image?.data) {
      return res.status(404).json({
        success: false,
        message: "Imagen no encontrada"
      });
    }

    res.set("Content-Type", product.image.contentType);
    res.set("Cache-Control", "public, max-age=86400");

    return res.send(product.image.data);

  } catch (error) {
    console.error("Error obteniendo imagen:", error);

    return res.status(500).json({
      success: false,
      message: "Error obteniendo imagen"
    });
  }
};


/* ============================================
   UTILIDADES PARA PRODUCTOS Y PROMOCIONES
============================================ */

// Convertir datos recibidos desde FormData.
const parseJsonField = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    return JSON.parse(value);
  }

  return value;
};

// Convertir valores booleanos.
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return value === true || value === "true";
};

// Validar formato de ObjectId.
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(String(id));
};

/* ============================================
   VALIDAR CONFIGURACIÓN DE PROMOCIÓN
============================================ */

const validatePromoConfig = async (
  config,
  currentProductId = null
) => {

  if (!config || typeof config !== "object") {
    throw new Error("Configuración de promoción inválida");
  }

  const includedProducts = Array.isArray(config.includedProducts)
    ? config.includedProducts
    : [];

  const selectionGroups = Array.isArray(config.selectionGroups)
    ? config.selectionGroups
    : [];

  if (
    includedProducts.length === 0 &&
    selectionGroups.length === 0
  ) {
    throw new Error(
      "La promoción debe tener productos incluidos o grupos de selección"
    );
  }

  const productIds = [];

  /* ==========================================
     VALIDAR PRODUCTOS INCLUIDOS
  ========================================== */

  for (const included of includedProducts) {

    if (!isValidObjectId(included.product)) {
      throw new Error(
        "Hay un producto incluido con ID inválido"
      );
    }

    const quantity = Number(included.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(
        "La cantidad de un producto incluido es inválida"
      );
    }

    if (
      currentProductId &&
      String(included.product) === String(currentProductId)
    ) {
      throw new Error(
        "Una promoción no puede incluirse a sí misma"
      );
    }

    productIds.push(String(included.product));
  }

  /* ==========================================
     VALIDAR GRUPOS DE SELECCIÓN
  ========================================== */

  const groupNames = new Set();

  for (const group of selectionGroups) {

    if (
      !group.name ||
      typeof group.name !== "string" ||
      !group.name.trim()
    ) {
      throw new Error(
        "Todos los grupos deben tener un nombre"
      );
    }

    const groupName = group.name.trim();

    if (groupNames.has(groupName)) {
      throw new Error(
        `El grupo "${groupName}" está repetido`
      );
    }

    groupNames.add(groupName);

    const requiredQuantity = Number(
      group.requiredQuantity
    );

    if (
      !Number.isInteger(requiredQuantity) ||
      requiredQuantity < 1
    ) {
      throw new Error(
        `La cantidad requerida de "${groupName}" es inválida`
      );
    }

    if (
      !Array.isArray(group.allowedProducts) ||
      group.allowedProducts.length === 0
    ) {
      throw new Error(
        `El grupo "${groupName}" debe tener productos permitidos`
      );
    }

    const uniqueIds = new Set();

    for (const id of group.allowedProducts) {

      if (!isValidObjectId(id)) {
        throw new Error(
          `Hay un producto inválido en el grupo "${groupName}"`
        );
      }

      if (String(id) === String(currentProductId)) {
        throw new Error(
          "Una promoción no puede incluirse a sí misma"
        );
      }

      uniqueIds.add(String(id));
      productIds.push(String(id));
    }

    // Evitar referencias duplicadas dentro del grupo.
    group.allowedProducts = [...uniqueIds];
    group.name = groupName;
  }

  /* ==========================================
     COMPROBAR QUE LOS PRODUCTOS EXISTAN
     Y ESTÉN ACTIVOS
  ========================================== */

  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.length > 0) {

    const products = await Product.find({
      _id: { $in: uniqueProductIds },
      active: true
    }).select("_id title active");

    const foundIds = new Set(
      products.map(product => String(product._id))
    );

    for (const id of uniqueProductIds) {

      if (!foundIds.has(id)) {
        throw new Error(
          `El producto ${id} no existe o está inactivo`
        );
      }
    }
  }

  return {
    enabled: true,
    includedProducts,
    selectionGroups
  };
};

/*==================================================
 * Crear producto
 =================================================*/

/*============================================
 * Crear producto
 =============================================*/

/*============================================
 * CREAR PRODUCTO
=============================================*/

export const createProduct = async (req, res) => {
  try {

    const {
      title,
      description,
      category,
      price,
      cost,
      stock,
      useStock,
      modifiers,
      featured,
      active,
      isPromo,
      promoPrice,
      promoConfig
    } = req.body;

    /* ==========================================
       VALIDACIONES BÁSICAS
    ========================================== */

    if (!title || !category || price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios del producto"
      });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "El precio del producto es inválido"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Debés seleccionar una imagen para el producto"
      });
    }

    /* ==========================================
       CONVERTIR DATOS
    ========================================== */

    const parsedModifiers = parseJsonField(
      modifiers,
      []
    );

    const parsedPromoConfig = parseJsonField(
      promoConfig,
      {
        enabled: false,
        includedProducts: [],
        selectionGroups: []
      }
    );

    if (!Array.isArray(parsedModifiers)) {
      return res.status(400).json({
        success: false,
        message: "Los modificadores tienen un formato inválido"
      });
    }

    const promoEnabled = parseBoolean(isPromo);

    /* ==========================================
       VALIDAR PROMOCIÓN
    ========================================== */

    let validatedPromoConfig = {
      enabled: false,
      includedProducts: [],
      selectionGroups: []
    };

    if (parsedPromoConfig.enabled === true) {

      if (!promoEnabled) {
        return res.status(400).json({
          success: false,
          message: "Debés activar la promoción para configurar un combo"
        });
      }

      const numericPromoPrice = Number(promoPrice);

      if (
        promoPrice === undefined ||
        promoPrice === "" ||
        !Number.isFinite(numericPromoPrice) ||
        numericPromoPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Ingresá un precio promocional válido"
        });
      }

      validatedPromoConfig = await validatePromoConfig(
        parsedPromoConfig
      );
    }

    /* ==========================================
       IMAGEN MONGODB
    ========================================== */

    const image = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    /* ==========================================
       CREAR PRODUCTO
    ========================================== */

    const product = await Product.create({

      title: title.trim(),

      description: description || "",

      category,

      price: Number(price),

      cost: Number(cost || 0),

      image,

      stock: Number(stock || 0),

      useStock: parseBoolean(useStock),

      modifiers: parsedModifiers,

      featured: parseBoolean(featured),

      active: parseBoolean(active, true),

      isPromo: promoEnabled,

      promoPrice:
        promoEnabled && promoPrice !== undefined && promoPrice !== ""
          ? Number(promoPrice)
          : null,

      promoConfig: validatedPromoConfig

    });

    return res.status(201).json({
      success: true,
      product
    });

  } catch (error) {

    console.error(
      "Error creando producto:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message || "Error creando producto"
    });

  }
};



/*============================================
 * Actualizar producto
 =============================================*/

/*============================================
 * ACTUALIZAR PRODUCTO
=============================================*/

export const updateProduct = async (req, res) => {
  try {

    const {
      title,
      description,
      category,
      price,
      cost,
      stock,
      useStock,
      modifiers,
      featured,
      active,
      isPromo,
      promoPrice,
      promoConfig
    } = req.body;

    /* ==========================================
       BUSCAR PRODUCTO
    ========================================== */

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    /* ==========================================
       DATOS PRINCIPALES
    ========================================== */

    if (title !== undefined) {
      product.title = title.trim();
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (price !== undefined) {

      if (
        price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "El precio es inválido"
        });
      }

      product.price = Number(price);
    }

    if (cost !== undefined) {
      product.cost = Number(cost);
    }

    if (stock !== undefined) {
      product.stock = Number(stock);
    }

    if (useStock !== undefined) {
      product.useStock = parseBoolean(useStock);
    }

    /* ==========================================
       MODIFICADORES
    ========================================== */

    if (modifiers !== undefined) {

      const parsedModifiers = parseJsonField(
        modifiers,
        []
      );

      if (!Array.isArray(parsedModifiers)) {
        return res.status(400).json({
          success: false,
          message: "Los modificadores tienen un formato inválido"
        });
      }

      product.modifiers = parsedModifiers;
    }

    /* ==========================================
       CONFIGURACIÓN GENERAL
    ========================================== */

    if (featured !== undefined) {
      product.featured = parseBoolean(featured);
    }

    if (active !== undefined) {
      product.active = parseBoolean(active);
    }

    if (isPromo !== undefined) {
      product.isPromo = parseBoolean(isPromo);
    }

    /* ==========================================
       PRECIO PROMOCIONAL
    ========================================== */

    if (promoPrice !== undefined) {

      if (promoPrice === "") {

        product.promoPrice = null;

      } else {

        const newPromoPrice = Number(promoPrice);

        if (
          !Number.isFinite(newPromoPrice) ||
          newPromoPrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "El precio promocional es inválido"
          });
        }

        product.promoPrice = newPromoPrice;
      }
    }

    /* ==========================================
       CONFIGURACIÓN DE PROMOCIÓN
    ========================================== */

    if (promoConfig !== undefined) {

      const parsedPromoConfig = parseJsonField(
        promoConfig,
        {}
      );

      if (
        !parsedPromoConfig ||
        typeof parsedPromoConfig !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message: "Configuración de promoción inválida"
        });
      }

      if (parsedPromoConfig.enabled === true) {

        if (!product.isPromo) {
          return res.status(400).json({
            success: false,
            message: "Primero debés activar la promoción"
          });
        }

        if (
          product.promoPrice === null ||
          product.promoPrice === undefined
        ) {
          return res.status(400).json({
            success: false,
            message: "Ingresá un precio promocional válido"
          });
        }

        product.promoConfig = await validatePromoConfig(
          parsedPromoConfig,
          product._id
        );

      } else {

        product.promoConfig = {
          enabled: false,
          includedProducts: [],
          selectionGroups: []
        };
      }
    }

    // Si se desactiva la promoción,
    // también desactivamos su configuración de combo.
    if (!product.isPromo) {

      product.promoConfig = {
        enabled: false,
        includedProducts: [],
        selectionGroups: []
      };

      product.promoPrice = null;
    }

    /* ==========================================
       IMAGEN
       Si no se envía una nueva, se conserva.
    ========================================== */

    if (req.file) {

      product.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    /* ==========================================
       GUARDAR
    ========================================== */

    await product.save();

    return res.status(200).json({
      success: true,
      product
    });

  } catch (error) {

    console.error(
      "Error actualizando producto:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message || "Error actualizando producto"
    });

  }
};



/*============================================
 * Eliminar producto
 =============================================*/
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Producto eliminado correctamente"
    });

  } catch (error) {
    console.error("Error eliminando producto:", error);

    res.status(500).json({
      success: false,
      message: "Error eliminando producto"
    });
  }
};


/* ==================================================
                    CATEGORÍAS
================================================== */

/*===================================================
  obtener todas las categorías
 ===================================================*/
export const getCategories = async (req, res) => {
  try {

    const categories =
      await Category.find().sort({
        order: 1
      });

    res.status(200).json(categories);

  } catch (error) {
    console.error("Error obteniendo categorías:", error);

    res.status(500).json({
      success: false,
      message: "Error obteniendo categorías"
    });
  }
};

/*=================================================
  Crear categoría
 =================================================*/
export const createCategory = async (req, res) => {
  try {

    const {
      name,
      icon,
      order
    } = req.body;

    const category =
      await Category.create({
        name,
        icon,
        order
      });

    res.status(201).json({
      success: true,
      category
    });

  } catch (error) {
    console.error("Error creando categoría:", error);

    res.status(500).json({
      success: false,
      message: "Error creando categoría"
    });
  }
};
/*=======================================================
  Obtener todos los pedidos
 ==============================================*/
export const getOrders = async (
  req,
  res
) => {
  try {

    const orders =
      await Order.find()
        .sort({
          createdAt: -1
        });

    res.status(200).json(orders);

  } catch (error) {

    console.error(
      "Error obteniendo pedidos:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error obteniendo pedidos"
    });
  }
};
/*=================================================
  Obtener pedido por ID
 =================================================*/
export const getOrderById = async (
  req,
  res
) => {
  try {

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    res.status(200).json(order);

  } catch (error) {

    console.error(
      "Error obteniendo pedido:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error obteniendo pedido"
    });
  }
};


/* ==================================================
   CREAR PEDIDO
   PROMOCIONES + MODIFICADORES + CONTROL DE STOCK
================================================== */



export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const io = req.app.get("io");

    const {
      customer,
      items,
      paymentMethod = "Efectivo",
      deliveryType = "retiro"
    } = req.body;

    /* ==========================================
       VALIDACIONES BÁSICAS
    ========================================== */

    const fail = (message, statusCode = 400) => {
      const error = new Error(message);
      error.statusCode = statusCode;
      throw error;
    };

    if (
      !customer?.firstName?.trim() ||
      !customer?.lastName?.trim()
    ) {
      fail("Falta nombre o apellido del cliente");
    }

    if (!customer?.phone?.trim()) {
      fail("Falta el teléfono del cliente");
    }

    if (!Array.isArray(items) || items.length === 0) {
      fail("El pedido no tiene productos");
    }

    if (
      !["Efectivo", "Transferencia", "Tarjeta"].includes(
        paymentMethod
      )
    ) {
      fail("Método de pago inválido");
    }

    if (!["retiro", "delivery"].includes(deliveryType)) {
      fail("Tipo de entrega inválido");
    }

    if (
      deliveryType === "delivery" &&
      !customer.address?.trim()
    ) {
      fail("Falta la dirección de entrega");
    }

    /* ==========================================
       VARIABLES DEL PEDIDO
    ========================================== */

    let createdOrder = null;

    await session.withTransaction(async () => {
      let orderItems = [];
      let total = 0;

      const productCache = new Map();

      const stockRequirements = new Map();

      /* ==========================================
         OBTENER PRODUCTO DESDE MONGODB
      ========================================== */

      const getProduct = async (productId) => {
        if (
          !productId ||
          !mongoose.Types.ObjectId.isValid(productId)
        ) {
          fail("Identificador de producto inválido");
        }

        const id = String(productId);

        if (productCache.has(id)) {
          return productCache.get(id);
        }

        const product = await Product.findById(id).session(
          session
        );

        if (!product) {
          fail(`Producto no encontrado: ${id}`, 404);
        }

        if (product.active === false) {
          fail(
            `El producto "${product.title}" ya no está disponible`,
            409
          );
        }

        productCache.set(id, product);

        return product;
      };

      /* ==========================================
         REGISTRAR STOCK NECESARIO
      ========================================== */

      const addStockRequirement = (product, quantity) => {
        if (!product.useStock) return;

        const id = String(product._id);

        const previous = stockRequirements.get(id) || 0;

        stockRequirements.set(
          id,
          previous + quantity
        );
      };

      /* ==========================================
         PROCESAR PRODUCTOS
      ========================================== */

      for (const item of items) {
        const quantity = Number(item.quantity);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          fail("La cantidad de un producto es inválida");
        }

        const product = await getProduct(item.product);

        /* ==========================================
           PRECIO BASE
        ========================================== */

        let basePrice = Number(product.price);

        if (
          product.isPromo === true &&
          product.promoPrice !== null &&
          product.promoPrice !== undefined
        ) {
          const configuredPromoPrice = Number(
            product.promoPrice
          );

          if (
            Number.isFinite(configuredPromoPrice) &&
            configuredPromoPrice >= 0
          ) {
            basePrice = configuredPromoPrice;
          }
        }

        if (
          !Number.isFinite(basePrice) ||
          basePrice < 0
        ) {
          fail(
            `El precio de "${product.title}" no es válido`
          );
        }

        let unitPrice = basePrice;

        let selectedModifiers = [];

        /* ==========================================
           VALIDAR MODIFICADORES
        ========================================== */

        if (
          item.modifiers !== undefined &&
          !Array.isArray(item.modifiers)
        ) {
          fail(
            `Los modificadores de "${product.title}" tienen un formato inválido`
          );
        }

        const receivedModifiers = item.modifiers || [];

        const validModifierNames = (
          product.modifiers || []
        ).map((modifier) => modifier.name);

        // No aceptar grupos inexistentes.
        for (const received of receivedModifiers) {
          if (
            !received?.group ||
            !received?.option ||
            !validModifierNames.includes(received.group)
          ) {
            fail("Se recibió un modificador inválido");
          }
        }

        for (const modifier of product.modifiers || []) {
          const selected = receivedModifiers.filter(
            (received) => received.group === modifier.name
          );

          const minimum = modifier.required
            ? Math.max(1, Number(modifier.minSelect) || 0)
            : Number(modifier.minSelect) || 0;

          const maximum =
            modifier.maxSelect === undefined ||
            modifier.maxSelect === null
              ? Infinity
              : Number(modifier.maxSelect);

          if (selected.length < minimum) {
            fail(
              `Debe elegir mínimo ${minimum} opciones de ${modifier.name}`
            );
          }

          if (selected.length > maximum) {
            fail(
              `Superó el máximo permitido en ${modifier.name}`
            );
          }

          if (
            modifier.type === "single" &&
            selected.length > 1
          ) {
            fail(
              `Solo puede elegir una opción en ${modifier.name}`
            );
          }

          // Evitar que el cliente envíe dos veces
          // la misma opción.
          const selectedNames = selected.map(
            (choice) => choice.option
          );

          if (
            new Set(selectedNames).size !== selectedNames.length
          ) {
            fail(
              `No se puede repetir una opción en ${modifier.name}`
            );
          }

          for (const choice of selected) {
            const option = modifier.options.find(
              (option) =>
                option.label === choice.option &&
                option.active !== false
            );

            if (!option) {
              fail(
                `Opción inválida o inactiva: ${choice.option}`
              );
            }

            const extraPrice = Number(option.price) || 0;

            if (
              !Number.isFinite(extraPrice) ||
              extraPrice < 0
            ) {
              fail(
                `Precio inválido para ${choice.option}`
              );
            }

            unitPrice += extraPrice;

            selectedModifiers.push({
              group: modifier.name,
              option: option.label,
              extraPrice
            });
          }
        }

        /* ==========================================
           PROMOCIÓN CONFIGURABLE
        ========================================== */

        const isConfigurablePromo =
          product.isPromo === true &&
          product.promoConfig?.enabled === true;

        let promoSelections = [];
        let includedProducts = [];

        if (isConfigurablePromo) {
          const promoConfig = product.promoConfig;

          const configuredGroups =
            promoConfig.selectionGroups || [];

          const configuredIncluded =
            promoConfig.includedProducts || [];

          const receivedGroups = Array.isArray(
            item.promoSelections
          )
            ? item.promoSelections
            : [];

          // Una promoción no puede estar vacía.
          if (
            configuredGroups.length === 0 &&
            configuredIncluded.length === 0
          ) {
            fail(
              `La promoción "${product.title}" no tiene productos configurados`
            );
          }

          /* ------------------------------------------
             VALIDAR GRUPOS RECIBIDOS
          ------------------------------------------ */

          if (
            item.promoSelections !== undefined &&
            !Array.isArray(item.promoSelections)
          ) {
            fail(
              `Las selecciones de "${product.title}" son inválidas`
            );
          }

          if (
            receivedGroups.length !== configuredGroups.length
          ) {
            fail(
              `Debe completar todos los grupos de "${product.title}"`
            );
          }

          const receivedGroupNames = receivedGroups.map(
            (group) => group?.group
          );

          // Detectar grupos repetidos.
          if (
            new Set(receivedGroupNames).size !==
            receivedGroupNames.length
          ) {
            fail(
              `Hay grupos repetidos en la promoción "${product.title}"`
            );
          }

          /* ------------------------------------------
             VALIDAR CADA GRUPO CONFIGURADO
          ------------------------------------------ */

          for (const configuredGroup of configuredGroups) {
            const receivedGroup = receivedGroups.find(
              (group) =>
                group.group === configuredGroup.name
            );

            if (!receivedGroup) {
              fail(
                `Falta seleccionar: ${configuredGroup.name}`
              );
            }

            const selectedProducts = Array.isArray(
              receivedGroup.products
            )
              ? receivedGroup.products
              : [];

            const allowedIds = (
              configuredGroup.allowedProducts || []
            ).map((id) => String(id));

            let selectedQuantity = 0;

            const quantitiesByProduct = new Map();

            /* ------------------------------------------
               VALIDAR PRODUCTOS ELEGIDOS
            ------------------------------------------ */

            for (const selectedProduct of selectedProducts) {
              const selectedId = String(
                selectedProduct.product || ""
              );

              const selectedProductQuantity = Number(
                selectedProduct.quantity
              );

              if (
                !Number.isInteger(selectedProductQuantity) ||
                selectedProductQuantity < 1
              ) {
                fail(
                  `Cantidad inválida en ${configuredGroup.name}`
                );
              }

              if (!allowedIds.includes(selectedId)) {
                fail(
                  `El producto seleccionado no está permitido en ${configuredGroup.name}`
                );
              }

              const selectedDbProduct = await getProduct(
                selectedId
              );

              // Evitar que una promoción se incluya
              // a sí misma como producto seleccionado.
              if (
                String(selectedDbProduct._id) ===
                String(product._id)
              ) {
                fail(
                  "Una promoción no puede incluirse a sí misma"
                );
              }

              selectedQuantity += selectedProductQuantity;

              const previousQuantity =
                quantitiesByProduct.get(selectedId) || 0;

              quantitiesByProduct.set(
                selectedId,
                previousQuantity + selectedProductQuantity
              );

              addStockRequirement(
                selectedDbProduct,
                selectedProductQuantity * quantity
              );
            }

            /* ------------------------------------------
               VALIDAR CANTIDAD EXACTA
            ------------------------------------------ */

            if (
              selectedQuantity !==
              Number(configuredGroup.requiredQuantity)
            ) {
              fail(
                `La promoción "${product.title}" requiere exactamente ${configuredGroup.requiredQuantity} unidades en "${configuredGroup.name}". Seleccionaste ${selectedQuantity}.`
              );
            }

            /* ------------------------------------------
               PREPARAR DATOS HISTÓRICOS
            ------------------------------------------ */

            const savedProducts = [];

            for (const [
              selectedId,
              selectedProductQuantity
            ] of quantitiesByProduct) {
              const selectedDbProduct = await getProduct(
                selectedId
              );

              savedProducts.push({
                product: selectedDbProduct._id,
                title: selectedDbProduct.title,
                quantity: selectedProductQuantity
              });
            }

            promoSelections.push({
              group: configuredGroup.name,
              products: savedProducts
            });
          }

          /* ------------------------------------------
             VALIDAR GRUPOS DESCONOCIDOS
          ------------------------------------------ */

          for (const receivedGroup of receivedGroups) {
            const exists = configuredGroups.some(
              (group) =>
                group.name === receivedGroup.group
            );

            if (!exists) {
              fail(
                `Grupo desconocido: ${receivedGroup.group}`
              );
            }
          }

          /* ------------------------------------------
             VALIDAR PRODUCTOS FIJOS INCLUIDOS
          ------------------------------------------ */

          for (const included of configuredIncluded) {
            const includedProduct = await getProduct(
              included.product
            );

            const includedQuantity = Number(
              included.quantity
            );

            if (
              !Number.isInteger(includedQuantity) ||
              includedQuantity < 1
            ) {
              fail(
                `Cantidad inválida en productos incluidos de "${product.title}"`
              );
            }

            if (
              String(includedProduct._id) ===
              String(product._id)
            ) {
              fail(
                "Una promoción no puede incluirse a sí misma"
              );
            }

            includedProducts.push({
              product: includedProduct._id,
              title: includedProduct.title,
              quantity: includedQuantity
            });

            addStockRequirement(
              includedProduct,
              includedQuantity * quantity
            );
          }

        } else {
          /* ------------------------------------------
             PRODUCTO SIN PROMOCIÓN CONFIGURABLE
          ------------------------------------------ */

          if (
            (item.promoSelections !== undefined &&
              (!Array.isArray(item.promoSelections) ||
                item.promoSelections.length > 0)) ||
            (item.includedProducts !== undefined &&
              (!Array.isArray(item.includedProducts) ||
                item.includedProducts.length > 0))
          ) {
            fail(
              `El producto "${product.title}" no admite selecciones de promoción`
            );
          }

          addStockRequirement(product, quantity);
        }

        /* ==========================================
           CALCULAR SUBTOTAL
        ========================================== */

        const subtotal = unitPrice * quantity;

        total += subtotal;

        /* ==========================================
           GUARDAR PRODUCTO EN EL PEDIDO
        ========================================== */

        orderItems.push({
          product: product._id,
          title: product.title,
          quantity,
          unitPrice,
          modifiers: selectedModifiers,
          promoSelections,
          includedProducts,
          subtotal
        });
      }

      /* ==========================================
         DESCONTAR STOCK
      ========================================== */

      for (const [
        productId,
        requiredStock
      ] of stockRequirements) {
        const stockResult = await Product.updateOne(
          {
            _id: productId,
            useStock: true,
            stock: { $gte: requiredStock }
          },
          {
            $inc: {
              stock: -requiredStock
            }
          },
          {
            session
          }
        );

        if (stockResult.modifiedCount !== 1) {
          const stockProduct = await Product.findById(
            productId
          ).session(session);

          fail(
            `Stock insuficiente para "${stockProduct?.title || "un producto"}"`,
            409
          );
        }
      }

      /* ==========================================
         GENERAR NÚMERO DE PEDIDO
      ========================================== */

      const counter = await Counter.findOneAndUpdate(
        {
          name: "orders"
        },
        {
          $inc: {
            value: 1
          }
        },
        {
          new: true,
          upsert: true,
          session
        }
      );

      const orderNumber =
        `QG-${String(counter.value).padStart(6, "0")}`;

      /* ==========================================
         CREAR PEDIDO
      ========================================== */

      const [order] = await Order.create(
        [
          {
            customer: {
              firstName: customer.firstName.trim(),
              lastName: customer.lastName.trim(),
              phone: customer.phone.trim(),
              address: customer.address?.trim() || "",
              notes: customer.notes?.trim() || ""
            },

            items: orderItems,

            total,

            paymentMethod,

            deliveryType,

            orderNumber
          }
        ],
        {
          session
        }
      );

      createdOrder = order;
    });

    /* ==========================================
       SOCKET.IO
       Emitir después de confirmar la transacción.
    ========================================== */

    if (createdOrder) {
      io?.emit("newOrder", createdOrder);

      console.log(
        "🟢 Nuevo pedido:",
        createdOrder.orderNumber
      );

      return res.status(201).json({
        success: true,
        order: createdOrder
      });
    }

    return res.status(500).json({
      success: false,
      message: "No se pudo crear el pedido"
    });

  } catch (error) {
    console.error("Error creando pedido:", error);

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Error creando el pedido"
    });

  } finally {
    await session.endSession();
  }
};


/*=================================================
  Actualizar estado pedido
 =================================================*/
export const updateOrderStatus = async (req, res) => {

  try {

    const io = req.app.get("io");

    const { status } = req.body;


    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true
        }
      );


    if (!order) {

      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });

    }


    io.emit(
      "orderUpdated",
      order
    );


    res.status(200).json({
      success: true,
      order
    });


  } catch (error) {

    console.error(
      "Error actualizando pedido:",
      error
    );


    res.status(500).json({
      success: false,
      message: "Error actualizando pedido"
    });

  }

};